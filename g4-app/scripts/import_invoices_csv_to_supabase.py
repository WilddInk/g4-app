#!/usr/bin/env python3
"""
Import legacy invoices.csv -> public.kr_faktura_do_zaplaty (Supabase PostgREST).

Wymagane env:
  SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=...

Opcjonalnie:
  INVOICES_CSV_PATH="C:/Users/.../invoices.csv"
  DRY_RUN=1
"""

from __future__ import annotations

import csv
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


DEFAULT_CSV_PATH = Path(r"C:\Users\m301\Box\!INV---FAKTURY\APP\invoices.csv")
TABLE_ENDPOINT = "/rest/v1/kr_faktura_do_zaplaty"
BATCH_SIZE = 250


def env(name: str, required: bool = True) -> str:
    v = os.getenv(name, "").strip()
    if required and not v:
        raise RuntimeError(f"Brak zmiennej środowiskowej: {name}")
    return v


def parse_decimal(raw: str) -> float | None:
    s = (raw or "").strip().replace(" ", "")
    if not s:
        return None
    # polskie CSV:  "126,69"
    s = s.replace(",", ".")
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


def parse_iso_date(raw: str) -> str | None:
    s = (raw or "").strip()
    if len(s) == 10 and s[4] == "-" and s[7] == "-":
        return s
    return None


def parse_seller_nip(issuer_id: str) -> str | None:
    s = (issuer_id or "").strip()
    if not s:
        return None
    if s.upper().startswith("NIP_"):
        s = s[4:]
    digits = "".join(ch for ch in s if ch.isdigit())
    if len(digits) == 10:
        return digits
    return None


def to_record(row: dict[str, str]) -> dict:
    brutto = parse_decimal(row.get("price_brutto", ""))
    if brutto is None:
        brutto = parse_decimal(row.get("cost_000_net", "")) or 0.0
    netto = parse_decimal(row.get("price_netto", ""))
    vat = parse_decimal(row.get("vat", ""))

    seller = (row.get("seller_name") or "").strip()
    payer = (row.get("payer_name") or "").strip()
    komu = seller or payer or "—"

    notatki_parts = [
        f"import invoices.csv",
        f"year={row.get('year', '').strip()}",
        f"month={row.get('month', '').strip()}",
    ]
    notatki = " | ".join([x for x in notatki_parts if x and not x.endswith("=")])

    return {
        "kr": (row.get("kr") or "").strip() or None,
        "komu": komu,
        "nr_konta": None,
        "kwota_brutto": brutto,
        "kwota_netto": netto,
        "kwota_vat": vat,
        "sprzedawca_nip": parse_seller_nip(row.get("issuer_id", "")),
        "sprzedawca_nazwa": (row.get("seller_name") or "").strip() or None,
        "link_faktury": (row.get("invoice_link") or "").strip() or None,
        "numer_faktury": (row.get("invoice_number") or "").strip() or None,
        "zgloszil_pracownik_nr": None,
        "status": "do_zaplaty",
        "notatki": notatki,
        "data_faktury": parse_iso_date(row.get("date", "")),
        "rodzaj_kosztu": (row.get("cost_kind") or "").strip() or None,
        "typ_nazwy": (row.get("type_name") or "").strip() or None,
        "nazwa_obiektu": (row.get("object_name") or "").strip() or None,
        "legacy_nazwa_pliku": (row.get("unit_price_name") or "").strip() or None,
        "legacy_pdf_file": (row.get("pdf_file") or "").strip() or None,
        "legacy_issuer_id": (row.get("issuer_id") or "").strip() or None,
        "legacy_receiver_name": (row.get("receiver_name") or "").strip() or None,
        "legacy_payer_name": payer or None,
        "legacy_link_group_id": (row.get("link_group_id") or "").strip() or None,
        "legacy_counts_in_sums": parse_bool(row.get("counts_in_sums", "")),
    }


def post_batch(base_url: str, api_key: str, rows: list[dict]) -> None:
    endpoint = f"{base_url.rstrip('/')}{TABLE_ENDPOINT}"
    payload = json.dumps(rows).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "apikey": api_key,
            "Authorization": f"Bearer {api_key}",
            "Prefer": "return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            if resp.status not in (200, 201, 204):
                raise RuntimeError(f"HTTP {resp.status} podczas insertu")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Błąd HTTP {e.code}: {body}") from e


def main() -> int:
    try:
        supabase_url = env("SUPABASE_URL")
        service_role_key = env("SUPABASE_SERVICE_ROLE_KEY")
    except RuntimeError as e:
        print(f"[ERR] {e}")
        return 2

    csv_path = Path(os.getenv("INVOICES_CSV_PATH", "")).expanduser() if os.getenv("INVOICES_CSV_PATH") else DEFAULT_CSV_PATH
    if not csv_path.exists():
        print(f"[ERR] Nie znaleziono pliku CSV: {csv_path}")
        return 2

    dry_run = os.getenv("DRY_RUN", "").strip() in {"1", "true", "TRUE", "yes", "YES"}

    rows_out: list[dict] = []
    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows_out.append(to_record(row))

    print(f"[INFO] Odczytano {len(rows_out)} rekordów z {csv_path}")
    if not rows_out:
        print("[INFO] Brak danych do importu.")
        return 0

    if dry_run:
        print("[DRY_RUN] Przykład pierwszego rekordu:")
        print(json.dumps(rows_out[0], ensure_ascii=False, indent=2))
        return 0

    sent = 0
    for i in range(0, len(rows_out), BATCH_SIZE):
        batch = rows_out[i : i + BATCH_SIZE]
        post_batch(supabase_url, service_role_key, batch)
        sent += len(batch)
        print(f"[OK] Wysłano: {sent}/{len(rows_out)}")

    print("[DONE] Import zakończony.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
