-- Ręczny opis poprzednich użytkowników (dowolny tekst, nie powiązany z kartoteką pracowników).
-- Gdy NULL lub pusty po trim — w UI pokazywana jest etykieta z importu (teksty / źródło).

ALTER TABLE public.sprzet
  ADD COLUMN IF NOT EXISTS poprzedni_uzytkownicy_opis text;

COMMENT ON COLUMN public.sprzet.poprzedni_uzytkownicy_opis IS
  'Ręcznie wpisana historia poprzednich użytkowników; gdy brak — używana jest historia z importu (poprzedni_uzytkownicy_*).';
