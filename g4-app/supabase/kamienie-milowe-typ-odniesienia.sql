-- Rodzaj kotwicy daty odniesienia: linia (np. oś dokumentacji) lub zlecenie.
-- Uruchom w Supabase SQL Editor po kamienie-milowe-odniesienie-offset.sql.

ALTER TABLE public.etapy
  ADD COLUMN IF NOT EXISTS typ_odniesienia text;

COMMENT ON COLUMN public.etapy.typ_odniesienia IS
  'Znaczenie daty odniesienia: linia | zlecenie (wartość z aplikacji)';

ALTER TABLE public.etapy
  DROP CONSTRAINT IF EXISTS etapy_typ_odniesienia_check;

ALTER TABLE public.etapy
  ADD CONSTRAINT etapy_typ_odniesienia_check CHECK (
    typ_odniesienia IS NULL OR typ_odniesienia IN ('linia', 'zlecenie')
  );
