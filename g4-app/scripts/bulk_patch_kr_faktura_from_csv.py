#!/usr/bin/env python3
"""
Aktualizacja istniejących wierszy kr_faktura_do_zaplaty z CSV (edycja lokalna → hurtowy zapis).

Dla każdego wiersza CSV:
  - wymagana kolumna `id` (bigint z bazy),
  - do PATCH trafiają tylko kolumny z **niepustą** wartością w CSV (puste = „nie zmieniaj”),
  - kolumna `id` nie jest wysyłana w ciele PATCH.

Wymagane env:
  SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=...

Opcjonalnie:
  PATCH_CSV_PATH=./kr_faktura_do_zaplaty_export.csv
  DRY_RUN=1
  CONCURRENCY=16 — równoległe PATCH (ostrożnie przy limitach Supabase)
  BATCH_PAUSE_MS=50     — krótka pauza co wiersz w workerze (0 = brak)

Status musi być jednym z: do_zaplaty | oplacone | anulowane (jeśli w ogóle wysyłasz status).

Uwaga: `komu` i `kwota_brutto` są NOT NULL w bazie — nie wysyłaj pustych, jeśli nie chcesz nadpisać;
 skrypt pomija puste komórki, więc istniejąca wartość zostaje.
"""

from __future__ import annotations

import csv
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

TABLE = "kr_faktura_do_zaplaty"
DEFAULT_CSV = Path("kr_faktura_do_zaplaty_export.csv")

# Kolumny dozwolone w PATCH (bez id / created_at).
ALLOWED_PATCH_KEYS = frozenset(
    {
        "kr",
        "data_faktury",
        "sprzedawca_nip",
        "sprzedawca_nazwa",
        "komu",
        "nr_konta",
        "kwota_brutto",
        "kwota_netto",
        "kwota_vat",
        "link_faktury",
        "numer_faktury",
        "zgloszil_pracownik_nr",
        "status",
        "notatki",
        "platnik_id",
        "rodzaj_kosztu",
        "typ_nazwy",
        "nazwa_obiektu",
        "legacy_nazwa_pliku",
        "legacy_pdf_file",
        "legacy_issuer_id",
        "legacy_receiver_name",
        "legacy_payer_name",
        "legacy_link_group_id",
        "legacy_counts_in_sums",
    }
)

STATUS_OK = frozenset({"do_zaplaty", "oplacone", "anulowane"})


def env(name: str, required: bool = True) -> str:
    v = os.getenv(name, "").strip()
    if required and not v:
        raise RuntimeError(f"Brak zmiennej środowiskowej: {name}")
    return v


def parse_decimal(raw: str) -> float | None:
    s = (raw or "").strip().replace(" ", "").replace(",", ".")
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def parse_bool(raw: str) -> bool | None:
    s = (raw or "").strip().lower()
    if not s:
        return None
    if s in {"1", "true", "t", "tak", "y", "yes"}:
        return True
    if s in {"0", "false", "f", "nie", "n", "no"}:
        return False
    return None


def row_to_patch(row: dict[str, str]) -> tuple[int, dict] | tuple[int, str]:
    raw_id = (row.get("id") or "").strip()
    if not raw_id or not raw_id.isdigit():
        return 0, "brak lub złe id"
    row_id = int(raw_id)
    body: dict = {}
    for key in ALLOWED_PATCH_KEYS:
        if key not in row:
            continue
        cell = row.get(key)
        if cell is None:
            continue
        s = str(cell).strip()
        if s == "":
            continue
        if key in {"kwota_brutto", "kwota_netto", "kwota_vat"}:
            n = parse_decimal(s)
            if n is None:
                return row_id, f"kolumna {key}: nie liczba ({s!r})"
            body[key] = n
        elif key == "legacy_counts_in_sums":
            b = parse_bool(s)
            if b is None:
                return row_id, f"legacy_counts_in_sums: oczekiwano true/false ({s!r})"
            body[key] = b
        elif key == "status":
            if s not in STATUS_OK:
                return row_id, f"status musi być jednym z {sorted(STATUS_OK)}"
            body[key] = s
        elif key == "data_faktury":
            if len(s) == 10 and s[4] == "-" and s[7] == "-":
                body[key] = s
            else:
                return row_id, f"data_faktury oczekuje YYYY-MM-DD, jest {s!r}"
        else:
            body[key] = s
    if not body:
        return row_id, "brak niepustych kolumn do aktualizacji (poza id)"
    return row_id, body


def patch_one(base_url: str, api_key: str, row_id: int, body: dict) -> tuple[int, bool, str]:
    pause_ms = int(os.getenv("BATCH_PAUSE_MS", "0"))
    if pause_ms > 0:
        time.sleep(pause_ms / 1000.0)
    q = urllib.parse.urlencode({"id": f"eq.{row_id}"})
    url = f"{base_url.rstrip('/')}/rest/v1/{TABLE}?{q}"
    payload = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="PATCH",
        headers={
            "Content-Type": "application/json",
            "apikey": api_key,
            "Authorization": f"Bearer {api_key}",
            "Prefer": "return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            if resp.status not in (200, 204):
                return row_id, False, f"HTTP {resp.status}"
        return row_id, True, ""
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", errors="replace")
        return row_id, False, f"HTTP {e.code}: {msg}"


def main() -> int:
    try:
        supabase_url = env("SUPABASE_URL")
        service_key = env("SUPABASE_SERVICE_ROLE_KEY")
    except RuntimeError as e:
        print(f"[ERR] {e}")
        return 2

    csv_path = Path(os.getenv("PATCH_CSV_PATH", str(DEFAULT_CSV))).expanduser()
    if not csv_path.exists():
        print(f"[ERR] Nie ma pliku: {csv_path}")
        return 2

    dry = os.getenv("DRY_RUN", "").strip() in {"1", "true", "TRUE", "yes", "YES"}
    concurrency = max(1, int(os.getenv("CONCURRENCY", "16")))

    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"[INFO] Wczytano {len(rows)} wierszy z {csv_path}")

    work: list[tuple[int, dict]] = []
    errors_parse: list[str] = []
    for i, r in enumerate(rows, start=2):
        tid, res = row_to_patch(r)
        if isinstance(res, str):
            errors_parse.append(f"wiersz {i} (id={tid or '?'}): {res}")
        else:
            work.append((tid, res))

    for e in errors_parse[:30]:
        print(f"[SKIP] {e}")
    if len(errors_parse) > 30:
        print(f"[SKIP] … i {len(errors_parse) - 30} kolejnych błędów parsowania")

    if not work:
        print("[ERR] Nic do wysłania.")
        return 2

    print(f"[INFO] Do wysłania: {len(work)} PATCH (pominięto {len(errors_parse)})")

    if dry:
        print("[DRY_RUN] Przykład:")
        rid, b = work[0]
        print(json.dumps({"id": rid, "patch": b}, ensure_ascii=False, indent=2))
        return 0

    ok = 0
    fail = 0
    with ThreadPoolExecutor(max_workers=concurrency) as ex:
        futs = {ex.submit(patch_one, supabase_url, service_key, rid, b): rid for rid, b in work}
        for n, fut in enumerate(as_completed(futs), start=1):
            rid, success, msg = fut.result()
            if success:
                ok += 1
            else:
                fail += 1
                print(f"[FAIL] id={rid} {msg}")
            if n % 200 == 0 or n == len(work):
                print(f"[PROGRESS] {n}/{len(work)} (ok={ok} fail={fail})")

    print(f"[DONE] OK={ok} FAIL={fail}")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
