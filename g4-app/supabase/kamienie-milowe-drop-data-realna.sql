-- Usunięcie kolumny data_realna z kamieni milowych (termin realny nie jest używany).
-- Uruchom w Supabase SQL Editor.

ALTER TABLE public.kamienie_milowe
  DROP COLUMN IF EXISTS data_realna;
