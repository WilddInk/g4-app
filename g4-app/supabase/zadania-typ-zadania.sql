-- Typ zadania (lista zamknięta w aplikacji) — uruchom w Supabase SQL Editor (idempotentne).

ALTER TABLE public.zadania
  ADD COLUMN IF NOT EXISTS typ_zadania text;

COMMENT ON COLUMN public.zadania.typ_zadania IS 'Kategoria biznesowa: Biurowe, Płatność, Zakupy, Inne, Terenowe, Pracownicze, Sprzęt (wartość z aplikacji; NULL = starsze rekordy / heurystyka w UI).';

CREATE INDEX IF NOT EXISTS zadania_typ_zadania_idx ON public.zadania (typ_zadania)
  WHERE typ_zadania IS NOT NULL AND trim(typ_zadania) <> '';
