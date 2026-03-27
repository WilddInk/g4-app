-- Uzupełnienie tabeli public.kamienie_milowe (uruchom w Supabase SQL Editor), jeśli kolumn brakuje.
-- Nazwy zgodne z aplikacją (g4-app/src/App.jsx). Kolumny data_planowana, etap, status, kr, id — bez zmian.
-- Usunięcie data_realna z KM: kamienie-milowe-drop-data-realna.sql

ALTER TABLE public.kamienie_milowe
  ADD COLUMN IF NOT EXISTS osoba_odpowiedzialna text,
  ADD COLUMN IF NOT EXISTS uwagi text,
  ADD COLUMN IF NOT EXISTS osiagniete boolean,
  ADD COLUMN IF NOT EXISTS zagrozenie boolean,
  ADD COLUMN IF NOT EXISTS zagrozenie_opis text;

COMMENT ON COLUMN public.kamienie_milowe.osoba_odpowiedzialna IS 'Nr z tabeli pracownik (jak w KR)';
COMMENT ON COLUMN public.kamienie_milowe.osiagniete IS 'NULL = nie ustawiono';
COMMENT ON COLUMN public.kamienie_milowe.zagrozenie IS 'NULL = nie ustawiono';
