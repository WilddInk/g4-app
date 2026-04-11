-- =============================================================================
-- Pole „wykonywane zadanie” na wpisie czasu pracy + szablony tekstów per pracownik
-- (własne wpisy trafiają na listę propozycji przy kolejnych zapisach).
-- Uruchom w Supabase SQL Editor po czas-pracy-stawki-i-wpisy.sql.
-- Następnie: czas-pracy-zadanie-szablon-rls.sql (jeśli używasz RLS jak czas-pracy-wpis-rls-role).
-- =============================================================================

ALTER TABLE public.czas_pracy_wpis
  ADD COLUMN IF NOT EXISTS wykonywane_zadanie TEXT;

COMMENT ON COLUMN public.czas_pracy_wpis.wykonywane_zadanie IS
  'Opcjonalny opis zadania w bloku (wybór z listy lub własny tekst; szablony w czas_pracy_zadanie_szablon).';

CREATE TABLE IF NOT EXISTS public.czas_pracy_zadanie_szablon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pracownik_nr TEXT NOT NULL,
  tekst TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT czas_zad_szab_tekst_nie_pusty CHECK (length(trim(tekst)) > 0),
  CONSTRAINT czas_zad_szab_uniq UNIQUE (pracownik_nr, tekst)
);

CREATE INDEX IF NOT EXISTS idx_czas_zad_szab_nr ON public.czas_pracy_zadanie_szablon (pracownik_nr);

COMMENT ON TABLE public.czas_pracy_zadanie_szablon IS
  'Teksty zadań zapisane przy czasie pracy — propozycje dla danego pracownika_nr (deduplikacja po parze nr+tekst).';

ALTER TABLE public.czas_pracy_zadanie_szablon ENABLE ROW LEVEL SECURITY;

-- Domyślnie polityki ustawia czas-pracy-zadanie-szablon-rls.sql (authenticated).
-- Przy środowisku dev z pełnym anon na innych tabelach możesz tymczasowo dodać polityki anon jak w starych migracjach.
