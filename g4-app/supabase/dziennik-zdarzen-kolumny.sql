-- =============================================================================
-- Dziennik zdarzeń (dziennik_zdarzen): kolumny zgodne z aplikacją (LOG).
-- Uruchom w Supabase SQL Editor (raz, po utworzeniu tabeli).
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dziennik_zdarzen'
      AND column_name = 'osoba'
  ) THEN
    ALTER TABLE public.dziennik_zdarzen RENAME COLUMN osoba TO osoba_zglaszajaca;
  END IF;
END
$$;

ALTER TABLE public.dziennik_zdarzen
  ADD COLUMN IF NOT EXISTS wymagane_dzialanie text;

ALTER TABLE public.dziennik_zdarzen
  ADD COLUMN IF NOT EXISTS osoba_odpowiedzialna_za_zadanie text;

COMMENT ON COLUMN public.dziennik_zdarzen.osoba_zglaszajaca IS
  'Kto zgłasza / raportuje (np. nr z tabeli pracownik).';
COMMENT ON COLUMN public.dziennik_zdarzen.wymagane_dzialanie IS
  'Wymagane działanie — opis zadania (tekst).';
COMMENT ON COLUMN public.dziennik_zdarzen.osoba_odpowiedzialna_za_zadanie IS
  'Nr z tabeli pracownik — osoba, do której kierowane jest zadanie i odpowiedzialna za jego wykonanie.';

-- Status zdarzenia (zgodnie z listą w aplikacji LOG)
ALTER TABLE public.dziennik_zdarzen
  ADD COLUMN IF NOT EXISTS status_zdarzenia text;

UPDATE public.dziennik_zdarzen
SET status_zdarzenia = 'w trakcie'
WHERE status_zdarzenia IS NULL OR trim(status_zdarzenia) = '';

ALTER TABLE public.dziennik_zdarzen
  DROP CONSTRAINT IF EXISTS dziennik_zdarzen_status_zdarzenia_check;

ALTER TABLE public.dziennik_zdarzen
  ADD CONSTRAINT dziennik_zdarzen_status_zdarzenia_check
  CHECK (status_zdarzenia IN ('w trakcie', 'ukończone', 'oczekuje'));

ALTER TABLE public.dziennik_zdarzen
  ALTER COLUMN status_zdarzenia SET DEFAULT 'w trakcie';

ALTER TABLE public.dziennik_zdarzen
  ALTER COLUMN status_zdarzenia SET NOT NULL;

COMMENT ON COLUMN public.dziennik_zdarzen.status_zdarzenia IS
  'w trakcie | ukończone | oczekuje';

-- Data zdarzenia: tylko dzień (bez czasu)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dziennik_zdarzen'
      AND column_name = 'data_zdarzenia'
      AND data_type <> 'date'
  ) THEN
    ALTER TABLE public.dziennik_zdarzen
      ALTER COLUMN data_zdarzenia TYPE date
      USING (data_zdarzenia::date);
  END IF;
END
$$;

COMMENT ON COLUMN public.dziennik_zdarzen.data_zdarzenia IS
  'Data zdarzenia (bez czasu).';
