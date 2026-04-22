-- Rozszerzenie public.sprzet: identyfikator z Excela, historia poprzednich użytkowników (wielu).
-- Uruchom raz w SQL Editor (Supabase), potem import z arkusza (skrypt Python → plik .sql).

ALTER TABLE public.sprzet
  ADD COLUMN IF NOT EXISTS zewnetrzny_id text;

COMMENT ON COLUMN public.sprzet.zewnetrzny_id IS
  'Unikalny kod z inwentaryzacji (np. G4G-WS-KAZIE) — dopasowanie przy imporcie i kolejnych aktualizacjach.';

-- Jednoznaczne dopasowanie przy imporcie (UPSERT). W PostgreSQL UNIQUE dopuszcza wiele NULL.
ALTER TABLE public.sprzet
  DROP CONSTRAINT IF EXISTS sprzet_zewnetrzny_id_key;

ALTER TABLE public.sprzet
  ADD CONSTRAINT sprzet_zewnetrzny_id_key UNIQUE (zewnetrzny_id);

-- Tablica nazwisk / wpisów z importu (Excel: jedna komórka → wiele po separatorze | lub ; lub nowa linia).
ALTER TABLE public.sprzet
  ADD COLUMN IF NOT EXISTS poprzedni_uzytkownicy_teksty text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.sprzet.poprzedni_uzytkownicy_teksty IS
  'Lista poprzednich użytkowników sprzętu (tekst — jak w źródle). Może zawierać wiele pozycji.';

-- Opcjonalnie: powiązanie z pracownik.nr gdy uda się dopasować po imieniu (uzupełnia skrypt importu).
ALTER TABLE public.sprzet
  ADD COLUMN IF NOT EXISTS poprzedni_pracownicy_nr text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.sprzet.poprzedni_pracownicy_nr IS
  'Opcjonalnie: numery pracowników odpowiadające historii (jeśli dopasowanie po bazie się udało).';

-- Surowy tekst z Excela (jedna komórka) — audyt importu.
ALTER TABLE public.sprzet
  ADD COLUMN IF NOT EXISTS poprzedni_uzytkownicy_zrodlo text;

COMMENT ON COLUMN public.sprzet.poprzedni_uzytkownicy_zrodlo IS
  'Oryginalna wartość z komórki „Użytkownik historyczny” przed parsowaniem.';
