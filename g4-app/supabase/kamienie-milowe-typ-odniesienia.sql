-- Rodzaj kotwicy daty odniesienia: linia (np. oś dokumentacji) lub zlecenie.
-- Uruchom w Supabase SQL Editor po kamienie-milowe-odniesienie-offset.sql.

ALTER TABLE public.kamienie_milowe
  ADD COLUMN IF NOT EXISTS typ_odniesienia text;

COMMENT ON COLUMN public.kamienie_milowe.typ_odniesienia IS
  'Znaczenie daty odniesienia: linia | zlecenie (wartość z aplikacji)';

ALTER TABLE public.kamienie_milowe
  DROP CONSTRAINT IF EXISTS kamienie_milowe_typ_odniesienia_check;

ALTER TABLE public.kamienie_milowe
  ADD CONSTRAINT kamienie_milowe_typ_odniesienia_check CHECK (
    typ_odniesienia IS NULL OR typ_odniesienia IN ('linia', 'zlecenie')
  );
