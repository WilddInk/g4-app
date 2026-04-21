-- =============================================================================
-- Słowniki faktur kosztowych + kontrola jakości danych
-- Uruchom po: kr-faktura-do-zaplaty.sql oraz kr-faktura-do-zaplaty-rls-scope.sql
-- =============================================================================

-- Powiązanie płatnika (legacy) z pracownikiem.
ALTER TABLE public.kr_faktura_do_zaplaty
  ADD COLUMN IF NOT EXISTS sprzedawca_nip text,
  ADD COLUMN IF NOT EXISTS sprzedawca_nazwa text,
  ADD COLUMN IF NOT EXISTS platnik_id text;

COMMENT ON COLUMN public.kr_faktura_do_zaplaty.platnik_id IS
  'Id płatnika z legacy payers.csv; dla pracowników zwykle odpowiada pracownik.nr.';

CREATE INDEX IF NOT EXISTS kr_faktura_do_zaplaty_platnik_id_idx
  ON public.kr_faktura_do_zaplaty (platnik_id);

CREATE INDEX IF NOT EXISTS kr_faktura_do_zaplaty_sprzedawca_nip_idx
  ON public.kr_faktura_do_zaplaty (sprzedawca_nip);

-- Słownik sprzedawców po NIP.
CREATE TABLE IF NOT EXISTS public.kr_faktura_sprzedawca (
  nip text PRIMARY KEY,
  nazwa text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Słownik płatników (z możliwością mapowania do pracownika).
CREATE TABLE IF NOT EXISTS public.kr_faktura_platnik (
  payer_id text PRIMARY KEY,
  payer_name text NOT NULL,
  pracownik_nr text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Słownik typów i rodzajów kosztów z legacy CSV.
CREATE TABLE IF NOT EXISTS public.kr_faktura_typ (
  code text PRIMARY KEY,
  name text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kr_faktura_rodzaj_kosztu (
  code text PRIMARY KEY,
  name text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.kr_faktura_sprzedawca IS 'Słownik sprzedawców: NIP -> nazwa.';
COMMENT ON TABLE public.kr_faktura_platnik IS 'Słownik płatników legacy: payer_id -> payer_name (+ opcjonalnie pracownik_nr).';
COMMENT ON TABLE public.kr_faktura_typ IS 'Słownik type_name z legacy app.';
COMMENT ON TABLE public.kr_faktura_rodzaj_kosztu IS 'Słownik cost_kind z legacy app.';

-- Widok: potencjalne duplikaty (jak w legacy: KR + data + sprzedawca + nr + netto).
CREATE OR REPLACE VIEW public.kr_faktura_duplikaty AS
SELECT
  kr,
  data_faktury,
  COALESCE(NULLIF(TRIM(sprzedawca_nazwa), ''), NULLIF(TRIM(legacy_receiver_name), '')) AS sprzedawca,
  COALESCE(NULLIF(TRIM(numer_faktury), ''), NULLIF(TRIM(legacy_nazwa_pliku), '')) AS klucz_nr,
  kwota_netto,
  COUNT(*) AS ile,
  ARRAY_AGG(id ORDER BY id) AS ids
FROM public.kr_faktura_do_zaplaty
GROUP BY
  kr,
  data_faktury,
  COALESCE(NULLIF(TRIM(sprzedawca_nazwa), ''), NULLIF(TRIM(legacy_receiver_name), '')),
  COALESCE(NULLIF(TRIM(numer_faktury), ''), NULLIF(TRIM(legacy_nazwa_pliku), '')),
  kwota_netto
HAVING COUNT(*) > 1;

COMMENT ON VIEW public.kr_faktura_duplikaty IS
  'Potencjalne duplikaty wg klucza biznesowego: KR + data + sprzedawca + numer/plik + netto.';

-- Widok: faktury niekompletne (braki w głównych polach).
-- Uwagi: numer może być w legacy_nazwa_pliku; odbiorca w legacy_receiver_name;
-- sprzedawca — nazwa albo NIP (kolumna lub legacy_issuer_id NIP_…); nr_konta nie jest wymagane.
CREATE OR REPLACE VIEW public.kr_faktura_niekompletne AS
SELECT *
FROM public.kr_faktura_do_zaplaty f
WHERE
  NULLIF(TRIM(COALESCE(f.kr, '')), '') IS NULL
  OR f.data_faktury IS NULL
  OR (
    NULLIF(TRIM(COALESCE(f.sprzedawca_nazwa, '')), '') IS NULL
    AND NULLIF(TRIM(COALESCE(f.sprzedawca_nip, '')), '') IS NULL
    AND NULLIF(TRIM(COALESCE(f.legacy_issuer_id, '')), '') IS NULL
  )
  OR NULLIF(TRIM(COALESCE(f.komu, f.legacy_receiver_name, '')), '') IS NULL
  OR (
    NULLIF(TRIM(COALESCE(f.numer_faktury, '')), '') IS NULL
    AND NULLIF(TRIM(COALESCE(f.legacy_nazwa_pliku, '')), '') IS NULL
  )
  OR f.kwota_brutto IS NULL;

COMMENT ON VIEW public.kr_faktura_niekompletne IS
  'Faktury z brakami wymaganych danych operacyjnych (bez wymogu nr_konta).';

GRANT SELECT ON public.kr_faktura_sprzedawca TO authenticated;
GRANT SELECT ON public.kr_faktura_sprzedawca TO anon;

-- Wymuś odświeżenie cache PostgREST (Supabase API), aby nowe tabele/widoki były od razu widoczne.
NOTIFY pgrst, 'reload schema';
