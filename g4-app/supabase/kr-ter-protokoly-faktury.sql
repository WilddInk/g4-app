-- =============================================================================
-- TER / protokoły + faktury sprzedażowe (FS) — migracja addytywna
-- Supabase → SQL Editor → Run PO: kr-ter-protokoly.sql
-- Idempotentnie: CREATE OR REPLACE VIEW / FUNCTION
--
-- Źródło FS: public.faktury (sprzedażowe / INV / FS), powiązane z KR przez etapy.kr.
-- NIE używamy faktury_kosztowe ani kr_faktura_do_zaplaty (koszty).
--
-- Reguły metryk (obie widoczne w podsumowaniu):
--   • suma_kontraktu           — wartość kontraktu NETTO (nagłówek)
--   • suma_protokolow / wykonano — SUM(linie.wartosc_okresu)  [postęp protokołami]
--   • pozostalo_po_protokolach — suma_kontraktu − suma_protokolow
--   • suma_faktur_fs           — SUM(kwota_netto FS) dla KR  [„na ile wystawiliśmy faktur”]
--   • pozostalo_kontrakt       — suma_kontraktu − suma_faktur_fs
--                                ★ główna metryka handlowa „ile zostało do zafakturowania”
--   • pozostalo                — alias = pozostalo_po_protokolach (wsteczna zgodność z fazą 1)
--   • procent_wykonania        — protokoły / kontrakt
--   • procent_zafakturowania   — FS / kontrakt
--
-- Dopasowanie KR: normalizacja „1070” ≡ „KR1070” ≡ „kr 1070” (prefix KR + trim).
-- Brak tabeli/kolumn faktur → suma_faktur_fs = 0 (widok nadal działa).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.kr_ter_norm_kr(p_kr text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT NULLIF(
    lower(
      regexp_replace(
        btrim(COALESCE(p_kr, '')),
        '^kr[[:space:]]*',
        '',
        'i'
      )
    ),
    ''
  );
$$;

COMMENT ON FUNCTION public.kr_ter_norm_kr(text) IS
  'TER: normalizacja kodu KR do porównań (usuwa opcjonalny prefix KR, trim, lower).';

GRANT EXECUTE ON FUNCTION public.kr_ter_norm_kr(text) TO anon;
GRANT EXECUTE ON FUNCTION public.kr_ter_norm_kr(text) TO authenticated;

-- -----------------------------------------------------------------------------
-- Widok agregujący FS netto per znormalizowany KR
-- (dynamicznie — zależnie od istnienia tabeli/kolumn)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  has_faktury boolean;
  has_etapy boolean;
  has_etap_id boolean;
  has_kwota_netto boolean;
  has_price_netto boolean;
  has_kwota boolean;
  has_zafakturowane boolean;
  has_czy_zafakturowane boolean;
  has_anulowana boolean;
  has_anulowane boolean;
  has_f_kr boolean;
  amount_expr text;
  where_parts text[] := ARRAY[]::text[];
  where_sql text := 'TRUE';
  sql text;
BEGIN
  SELECT to_regclass('public.faktury') IS NOT NULL INTO has_faktury;
  SELECT to_regclass('public.etapy') IS NOT NULL INTO has_etapy;

  IF NOT has_faktury THEN
    EXECUTE $v$
      CREATE OR REPLACE VIEW public.v_kr_ter_faktury_fs_agg AS
      SELECT
        NULL::text AS kr_norm,
        0::numeric(14, 2) AS suma_faktur_fs,
        0::int AS liczba_faktur_fs
      WHERE FALSE
    $v$;
    RAISE NOTICE 'kr-ter-protokoly-faktury: brak public.faktury — agregat FS pusty.';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'faktury' AND column_name = 'etap_id'
  ) INTO has_etap_id;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'faktury' AND column_name = 'kwota_netto'
  ) INTO has_kwota_netto;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'faktury' AND column_name = 'price_netto'
  ) INTO has_price_netto;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'faktury' AND column_name = 'kwota'
  ) INTO has_kwota;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'faktury' AND column_name = 'zafakturowane'
  ) INTO has_zafakturowane;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'faktury' AND column_name = 'czy_zafakturowane'
  ) INTO has_czy_zafakturowane;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'faktury' AND column_name = 'anulowana'
  ) INTO has_anulowana;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'faktury' AND column_name = 'anulowane'
  ) INTO has_anulowane;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'faktury' AND column_name = 'kr'
  ) INTO has_f_kr;

  IF has_kwota_netto THEN
    amount_expr := 'COALESCE(f.kwota_netto, 0)';
  ELSIF has_price_netto THEN
    amount_expr := 'COALESCE(f.price_netto, 0)';
  ELSIF has_kwota THEN
    amount_expr := 'COALESCE(f.kwota, 0)';
  ELSE
    amount_expr := '0';
    RAISE NOTICE 'kr-ter-protokoly-faktury: brak kolumny kwoty netto w faktury — suma_faktur_fs = 0.';
  END IF;

  IF has_zafakturowane THEN
    where_parts := array_append(where_parts, 'COALESCE(f.zafakturowane, true) IS DISTINCT FROM false');
  END IF;
  IF has_czy_zafakturowane THEN
    where_parts := array_append(where_parts, 'COALESCE(f.czy_zafakturowane, true) IS DISTINCT FROM false');
  END IF;
  IF has_anulowana THEN
    where_parts := array_append(where_parts, 'COALESCE(f.anulowana, false) IS NOT TRUE');
  END IF;
  IF has_anulowane THEN
    where_parts := array_append(where_parts, 'COALESCE(f.anulowane, false) IS NOT TRUE');
  END IF;
  IF cardinality(where_parts) > 0 THEN
    where_sql := array_to_string(where_parts, ' AND ');
  END IF;

  -- Preferowane: FS przez etap → etapy.kr (model G4: tabela faktury = sprzedażowe).
  -- Dodatkowo: bezpośrednie f.kr, jeśli kolumna istnieje (bez podwójnego liczenia tego samego wiersza).
  IF has_etapy AND has_etap_id THEN
    sql := format($v$
      CREATE OR REPLACE VIEW public.v_kr_ter_faktury_fs_agg AS
      SELECT
        public.kr_ter_norm_kr(src.kr_raw) AS kr_norm,
        COALESCE(SUM(src.kwota), 0)::numeric(14, 2) AS suma_faktur_fs,
        COUNT(*)::int AS liczba_faktur_fs
      FROM (
        SELECT
          e.kr AS kr_raw,
          (%s)::numeric AS kwota
        FROM public.faktury f
        INNER JOIN public.etapy e ON e.id = f.etap_id
        WHERE f.etap_id IS NOT NULL
          AND (%s)
        %s
      ) src
      WHERE public.kr_ter_norm_kr(src.kr_raw) IS NOT NULL
      GROUP BY public.kr_ter_norm_kr(src.kr_raw)
    $v$,
      amount_expr,
      where_sql,
      CASE
        WHEN has_f_kr THEN format($u$
        UNION ALL
        SELECT
          f.kr AS kr_raw,
          (%s)::numeric AS kwota
        FROM public.faktury f
        WHERE (f.etap_id IS NULL)
          AND f.kr IS NOT NULL
          AND btrim(f.kr::text) <> ''
          AND (%s)
        $u$, amount_expr, where_sql)
        ELSE ''
      END
    );
  ELSIF has_f_kr THEN
    sql := format($v$
      CREATE OR REPLACE VIEW public.v_kr_ter_faktury_fs_agg AS
      SELECT
        public.kr_ter_norm_kr(f.kr) AS kr_norm,
        COALESCE(SUM((%s)::numeric), 0)::numeric(14, 2) AS suma_faktur_fs,
        COUNT(*)::int AS liczba_faktur_fs
      FROM public.faktury f
      WHERE f.kr IS NOT NULL
        AND btrim(f.kr::text) <> ''
        AND (%s)
        AND public.kr_ter_norm_kr(f.kr) IS NOT NULL
      GROUP BY public.kr_ter_norm_kr(f.kr)
    $v$, amount_expr, where_sql);
  ELSE
    EXECUTE $v$
      CREATE OR REPLACE VIEW public.v_kr_ter_faktury_fs_agg AS
      SELECT
        NULL::text AS kr_norm,
        0::numeric(14, 2) AS suma_faktur_fs,
        0::int AS liczba_faktur_fs
      WHERE FALSE
    $v$;
    RAISE NOTICE 'kr-ter-protokoly-faktury: brak etapy.etap_id / faktury.kr — agregat FS pusty.';
    RETURN;
  END IF;

  EXECUTE sql;
END $$;

COMMENT ON VIEW public.v_kr_ter_faktury_fs_agg IS
  'TER: suma netto faktur sprzedażowych (public.faktury / FS) per znormalizowany KR. Bez faktur kosztowych.';

GRANT SELECT ON public.v_kr_ter_faktury_fs_agg TO anon;
GRANT SELECT ON public.v_kr_ter_faktury_fs_agg TO authenticated;

-- -----------------------------------------------------------------------------
-- Podsumowanie KR: protokoły + FS
-- CREATE OR REPLACE nie może zmieniać nazw/kolejności kolumn istniejącego widoku
-- (błąd 42P16) — dlatego DROP + CREATE.
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_kr_ter_podsumowanie;

CREATE VIEW public.v_kr_ter_podsumowanie AS
SELECT
  r.id AS rozliczenie_id,
  r.kr,
  r.nazwa_kontraktu,
  r.klient,
  r.nr_umowy,
  r.suma_kontraktu,
  r.uwagi,
  r.zrodlo,
  COALESCE(agg.suma_protokolow, 0)::numeric(14, 2) AS suma_protokolow,
  COALESCE(agg.suma_protokolow, 0)::numeric(14, 2) AS wykonano,
  -- wsteczna zgodność: pozostalo = postęp protokołami
  (r.suma_kontraktu - COALESCE(agg.suma_protokolow, 0))::numeric(14, 2) AS pozostalo,
  CASE
    WHEN r.suma_kontraktu > 0 THEN
      ROUND((COALESCE(agg.suma_protokolow, 0) / r.suma_kontraktu) * 100, 2)
    ELSE NULL
  END AS procent_wykonania,
  COALESCE(agg.liczba_protokolow, 0)::int AS liczba_protokolow,
  COALESCE(poz.liczba_pozycji, 0)::int AS liczba_pozycji_ter,
  r.created_at,
  r.updated_at,
  -- kolumny FS / aliasy DOKŁADANE NA KOŃCU (po DROP i tak pełny CREATE)
  (r.suma_kontraktu - COALESCE(agg.suma_protokolow, 0))::numeric(14, 2) AS pozostalo_po_protokolach,
  COALESCE(fs.suma_faktur_fs, 0)::numeric(14, 2) AS suma_faktur_fs,
  COALESCE(fs.liczba_faktur_fs, 0)::int AS liczba_faktur_fs,
  -- główna metryka handlowa: ile kontraktu jeszcze nie zafakturowano FS
  (r.suma_kontraktu - COALESCE(fs.suma_faktur_fs, 0))::numeric(14, 2) AS pozostalo_kontrakt,
  CASE
    WHEN r.suma_kontraktu > 0 THEN
      ROUND((COALESCE(fs.suma_faktur_fs, 0) / r.suma_kontraktu) * 100, 2)
    ELSE NULL
  END AS procent_zafakturowania
FROM public.kr_ter_rozliczenie r
LEFT JOIN (
  SELECT
    pr.rozliczenie_id,
    COUNT(DISTINCT pr.id)::int AS liczba_protokolow,
    COALESCE(SUM(l.wartosc_okresu), 0) AS suma_protokolow
  FROM public.kr_ter_protokol pr
  LEFT JOIN public.kr_ter_protokol_linia l ON l.protokol_id = pr.id
  GROUP BY pr.rozliczenie_id
) agg ON agg.rozliczenie_id = r.id
LEFT JOIN (
  SELECT rozliczenie_id, COUNT(*)::int AS liczba_pozycji
  FROM public.kr_ter_pozycja
  GROUP BY rozliczenie_id
) poz ON poz.rozliczenie_id = r.id
LEFT JOIN public.v_kr_ter_faktury_fs_agg fs
  ON fs.kr_norm = public.kr_ter_norm_kr(r.kr);

COMMENT ON VIEW public.v_kr_ter_podsumowanie IS
  'TER: podsumowanie KR — kontrakt, protokoły (wykonano/pozostalo_po_protokolach), FS (suma_faktur_fs/pozostalo_kontrakt).';

GRANT SELECT ON public.v_kr_ter_podsumowanie TO anon;
GRANT SELECT ON public.v_kr_ter_podsumowanie TO authenticated;

COMMENT ON COLUMN public.kr_ter_rozliczenie.suma_kontraktu IS
  'Edytowalna wartość kontraktu NETTO. Handlowo: pozostalo_kontrakt = suma_kontraktu - suma_faktur_fs. Protokoły: pozostalo_po_protokolach = suma_kontraktu - SUM(linie.wartosc_okresu).';
