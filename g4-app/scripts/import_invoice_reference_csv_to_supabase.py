#!/usr/bin/env python3
"""
Import słowników legacy faktur do Supabase.

Wymagane env:
  SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=...

Opcjonalnie:
  APP_INV_DIR="C:/Users/.../!INV---FAKTURY/APP"
  DRY_RUN=1
"""

from __future__ import annotations

import csv
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

DEFAULT_APP_INV_DIR = Path(r"C:\Users\m301\Box\!INV---FAKTURY\APP")
BATCH_SIZE = 500


def env(name: str, required: bool = True) -> str:
    v = os.getenv(name, "").strip()
    if required and not v:
        raise RuntimeError(f"Brak zmiennej środowiskowej: {name}")
    return v


def normalize_nip(raw: str) -> str:
    return "".join(ch for ch in str(raw or "") if ch.isdigit())


def post_batch(
    base_url: str,
    api_key: str,
    endpoint: str,
    rows: list[dict],
    prefer_resolution: str = "merge-duplicates",
) -> None:
    url = f"{base_url.rstrip('/')}{endpoint}"
    payload = json.dumps(rows, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "apikey": api_key,
            "Authorization": f"Bearer {api_key}",
            "Prefer": f"resolution={prefer_resolution},return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            if resp.status not in (200, 201, 204):
                raise RuntimeError(f"HTTP {resp.status} dla endpointu {endpoint}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Błąd HTTP {e.code} dla {endpoint}: {body}") from e


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def dedupe_by_key(rows: list[dict], key_name: str) -> list[dict]:
    """Zostawia jeden rekord na klucz (ostatni wygrywa)."""
    out: dict[str, dict] = {}
    for row in rows:
        key = str(row.get(key_name, "")).strip()
        if not key:
            continue
        out[key] = row
    return list(out.values())


def batch_insert(
    base_url: str,
    api_key: str,
    endpoint: str,
    rows: list[dict],
    dry_run: bool,
    prefer_resolution: str = "merge-duplicates",
) -> int:
    if not rows:
        return 0
    if dry_run:
        print(f"[DRY_RUN] {endpoint} sample:", json.dumps(rows[0], ensure_ascii=False))
        return len(rows)

    sent = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        post_batch(base_url, api_key, endpoint, batch, prefer_resolution=prefer_resolution)
        sent += len(batch)
    return sent


def build_sellers_rows(app_dir: Path) -> list[dict]:
    src = read_csv(app_dir / "sellers.csv")
    out: list[dict] = []
    for row in src:
        nip = normalize_nip(row.get("nip", ""))
        name = (row.get("name") or "").strip()
        if not nip or not name:
            continue
        out.append({"nip": nip, "nazwa": name})
    return dedupe_by_key(out, "nip")


def build_payers_rows(app_dir: Path) -> list[dict]:
    src = read_csv(app_dir / "payers.csv")
    out: list[dict] = []
    for row in src:
        payer_id = (row.get("payer_id") or "").strip()
        payer_name = (row.get("payer_name") or "").strip()
        if not payer_id or not payer_name:
            continue
        pracownik_nr = payer_id
        out.append(
            {
                "payer_id": payer_id,
                "payer_name": payer_name,
                "pracownik_nr": pracownik_nr,
            }
        )
    return dedupe_by_key(out, "payer_id")


def build_simple_code_rows(app_dir: Path, filename: str) -> list[dict]:
    src = read_csv(app_dir / filename)
    out: list[dict] = []
    for row in src:
        code = (row.get("code") or "").strip()
        name = (row.get("name") or "").strip()
        if not code or not name:
            continue
        out.append({"code": code, "name": name})
    return dedupe_by_key(out, "code")


def patch_kr_names(base_url: str, api_key: str, app_dir: Path, dry_run: bool) -> int:
    src = read_csv(app_dir / "kr_table.csv")
    rows: list[dict] = []
    for row in src:
        kr = (row.get("kr") or "").strip()
        nazwa = (row.get("object_name") or "").strip()
        if not kr or not nazwa:
            continue
        rows.append({"kr": kr, "nazwa_obiektu": nazwa})

    if not rows:
        return 0
    endpoint = "/rest/v1/kr?on_conflict=kr"
    return batch_insert(base_url, api_key, endpoint, rows, dry_run)


def sync_pracownicy_from_payers(base_url: str, api_key: str, payers_rows: list[dict], dry_run: bool) -> int:
    rows: list[dict] = []
    for row in payers_rows:
        nr = str(row.get("payer_id", "")).strip()
        nazwa = str(row.get("payer_name", "")).strip()
        if not nr or not nazwa:
            continue
        rows.append(
            {
                "nr": nr,
                "imie_nazwisko": nazwa,
                "is_active": True,
            }
        )
    rows = dedupe_by_key(rows, "nr")
    return batch_insert(
        base_url,
        api_key,
        "/rest/v1/pracownik",
        rows,
        dry_run,
        prefer_resolution="ignore-duplicates",
    )


def main() -> int:
    try:
        supabase_url = env("SUPABASE_URL")
        service_role_key = env("SUPABASE_SERVICE_ROLE_KEY")
    except RuntimeError as e:
        print(f"[ERR] {e}")
        return 2

    app_dir = Path(os.getenv("APP_INV_DIR", "")).expanduser() if os.getenv("APP_INV_DIR") else DEFAULT_APP_INV_DIR
    dry_run = os.getenv("DRY_RUN", "").strip().lower() in {"1", "true", "yes", "y"}

    if not app_dir.exists():
        print(f"[ERR] Nie znaleziono katalogu APP: {app_dir}")
        return 2

    try:
        sellers = build_sellers_rows(app_dir)
        payers = build_payers_rows(app_dir)
        types_ = build_simple_code_rows(app_dir, "types.csv")
        cost_kinds = build_simple_code_rows(app_dir, "cost_kinds.csv")

        sent_sellers = batch_insert(
            supabase_url,
            service_role_key,
            "/rest/v1/kr_faktura_sprzedawca?on_conflict=nip",
            sellers,
            dry_run,
        )
        sent_payers = batch_insert(
            supabase_url,
            service_role_key,
            "/rest/v1/kr_faktura_platnik?on_conflict=payer_id",
            payers,
            dry_run,
        )
        sent_types = batch_insert(
            supabase_url,
            service_role_key,
            "/rest/v1/kr_faktura_typ?on_conflict=code",
            types_,
            dry_run,
        )
        sent_cost_kinds = batch_insert(
            supabase_url,
            service_role_key,
            "/rest/v1/kr_faktura_rodzaj_kosztu?on_conflict=code",
            cost_kinds,
            dry_run,
        )
        sent_kr = patch_kr_names(supabase_url, service_role_key, app_dir, dry_run)
        sent_prac = sync_pracownicy_from_payers(supabase_url, service_role_key, payers, dry_run)
    except RuntimeError as e:
        print(f"[ERR] {e}")
        return 1

    print(f"[OK] Słownik sprzedawców: {sent_sellers}")
    print(f"[OK] Słownik płatników: {sent_payers}")
    print(f"[OK] Słownik typów: {sent_types}")
    print(f"[OK] Słownik rodzajów kosztów: {sent_cost_kinds}")
    print(f"[OK] Aktualizacja KR (nazwa_obiektu): {sent_kr}")
    print(f"[OK] Synchronizacja Zespołu z płatników: {sent_prac}")
    print("[DONE] Import słowników zakończony.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
