-- =============================================================================
-- Forma zatrudnienia — do rozliczania czasu pracy (UoP vs umowa zlecenie itd.).
-- Uruchom w Supabase SQL Editor po istniejącej tabeli public.pracownik.
-- =============================================================================

ALTER TABLE public.pracownik
  ADD COLUMN IF NOT EXISTS forma_zatrudnienia TEXT NOT NULL DEFAULT 'uop';

ALTER TABLE public.pracownik
  DROP CONSTRAINT IF EXISTS pracownik_forma_zatrudnienia_check;

ALTER TABLE public.pracownik
  ADD CONSTRAINT pracownik_forma_zatrudnienia_check
  CHECK (forma_zatrudnienia IN ('uop', 'uz', 'inne'));

COMMENT ON COLUMN public.pracownik.forma_zatrudnienia IS
  'uop — umowa o pracę (norma miesięczna, nadgodziny ponad normę); uz — umowa zlecenie (w praktyce często wszystkie godziny jak „nadgodziny”); inne.';
