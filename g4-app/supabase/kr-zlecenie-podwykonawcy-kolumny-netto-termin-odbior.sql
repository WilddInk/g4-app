-- Dodatkowe pola zleceń PW: cena netto, termin planowany, data faktycznego oddania, flagi sprawdzenia i odbioru.
-- Uruchom w Supabase SQL Editor na istniejącej bazie (gdy tabela powstała ze starego skryptu
-- bez tych kolumn). Błąd PostgREST „Could not find the 'cena_netto' column … schema cache”
-- znika po ALTER — czasem trzeba odświeżyć stronę aplikacji po kilku sekundach.

ALTER TABLE public.kr_zlecenie_podwykonawcy
  ADD COLUMN IF NOT EXISTS cena_netto numeric(14, 2),
  ADD COLUMN IF NOT EXISTS termin_zlecenia date,
  ADD COLUMN IF NOT EXISTS data_oddania date,
  ADD COLUMN IF NOT EXISTS czy_sprawdzone boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS czy_odebrane boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.cena_netto IS 'Wartość netto zlecenia (PLN)';
COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.termin_zlecenia IS 'Planowany termin realizacji zlecenia (umowny)';
COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.data_oddania IS 'Faktyczna data oddania / przekazania wykonanej pracy';
COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.czy_sprawdzone IS 'Czy sprawdzone po naszej stronie';
COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.czy_odebrane IS 'Czy odebrane (odbiór / rozliczenie)';
