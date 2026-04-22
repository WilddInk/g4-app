-- Szacowany czas wykonania zadania — przechowywane jako roboczogodziny (+ opcjonalnie jednostka wpisu).
-- Uruchom w Supabase SQL Editor po wdrożeniu aplikacji z polem estymacji.

ALTER TABLE public.zadania
  ADD COLUMN IF NOT EXISTS estymacja_godzin numeric(12, 2);

COMMENT ON COLUMN public.zadania.estymacja_godzin IS 'Szacunek w roboczogodzinach (wpis w dniach jest mnożony × 8 w aplikacji).';

-- Jednostka oryginalnego wpisu użytkownika — patrz też zadania-estymacja-jednostka.sql
