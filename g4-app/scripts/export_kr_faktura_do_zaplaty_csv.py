#!/usr/bin/env python3
"""
Eksport public.kr_faktura_do_zaplaty -> CSV (do edycji lokalnej, potem bulk_patch_kr_faktura_from_csv.py).

Wymagane env:
  SUPABASE_URL=https://xxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=...   (Settings → API → service_role — NIE commituj, NIE wklejaj do frontu)

Opcjonalnie:
  EXPORT_CSV_PATH=./kr_faktura_export.csv
  PAGE_SIZE=1000
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

TABLE = "kr_faktura_do_zaplaty"
DEFAULT_OUT = Path("kr_faktura_do_zaplaty_export.csv")


def env(name: str, required: bool = True) -> str:
    v = os.getenv(name, "").strip()
    if required and not v:
        raise RuntimeError(f"Brak zmiennej środowiskowej: {name}")
    return v


def fetch_page(base_url: str, api_key: str, offset: int, limit: int) -> list[dict]:
    q = urllib.parse.urlencode(
        {
            "select": "*",
            "order": "id.asc",
            "offset": str(offset),
            "limit": str(limit),
        }
    )
    url = f"{base_url.rstrip('/')}/rest/v1/{TABLE}?{q}"
    req = urllib.request.Request(
        url,
        method="GET",
        headers={
            "apikey": api_key,
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw.strip() else []
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {body}") from e


def main() -> int:
    try:
        supabase_url = env("SUPABASE_URL")
        key = env("SUPABASE_SERVICE_ROLE_KEY")
    except RuntimeError as e:
        print(f"[ERR] {e}")
        return 2

    out_path = Path(os.getenv("EXPORT_CSV_PATH", str(DEFAULT_OUT))).expanduser()
    page_size = int(os.getenv("PAGE_SIZE", "1000"))

    all_rows: list[dict] = []
    offset = 0
    while True:
        chunk = fetch_page(supabase_url, key, offset, page_size)
        if not chunk:
            break
        all_rows.extend(chunk)
        print(f"[INFO] Pobrano {len(all_rows)} wierszy…")
        if len(chunk) < page_size:
            break
        offset += page_size

    if not all_rows:
        print("[WARN] Brak rekordów (albo błąd filtra).")
        return 0

    keys: set[str] = set()
    for r in all_rows:
        keys.update(r.keys())
    fieldnames = ["id"] + sorted(k for k in keys if k != "id")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in all_rows:
            flat = {}
            for k in fieldnames:
                v = r.get(k)
                if v is None:
                    flat[k] = ""
                elif isinstance(v, (dict, list)):
                    flat[k] = json.dumps(v, ensure_ascii=False)
                else:
                    flat[k] = v
            w.writerow(flat)

    print(f"[DONE] Zapisano {len(all_rows)} wierszy do {out_path.resolve()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
