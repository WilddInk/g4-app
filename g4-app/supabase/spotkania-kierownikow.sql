-- =============================================================================
-- Spotkania kierowników — protokoły, obecność, tematy
-- Supabase → SQL Editor → Run (idempotentnie)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.spotkanie_kierownikow (
  id bigserial PRIMARY KEY,
  data date NOT NULL,
  godzina_od time,
  godzina_do time,
  tytul text,
  protokol text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  autor text,
  autor_email text
);

CREATE INDEX IF NOT EXISTS spotkanie_kierownikow_data_idx
  ON public.spotkanie_kierownikow (data DESC, id DESC);

COMMENT ON TABLE public.spotkanie_kierownikow IS
  'Protokoły spotkań kierowników: data, godziny, treść, zestawienie tematów.';

CREATE TABLE IF NOT EXISTS public.spotkanie_kierownikow_osoba (
  id bigserial PRIMARY KEY,
  spotkanie_id bigint NOT NULL REFERENCES public.spotkanie_kierownikow(id) ON DELETE CASCADE,
  pracownik_nr text,
  imie_nazwisko text NOT NULL,
  obecny boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS spotkanie_kierownikow_osoba_spotkanie_idx
  ON public.spotkanie_kierownikow_osoba (spotkanie_id);

CREATE TABLE IF NOT EXISTS public.spotkanie_kierownikow_temat (
  id bigserial PRIMARY KEY,
  spotkanie_id bigint NOT NULL REFERENCES public.spotkanie_kierownikow(id) ON DELETE CASCADE,
  kr text,
  tresc text NOT NULL,
  godzina timestamptz,
  kolejnosc int
);

CREATE INDEX IF NOT EXISTS spotkanie_kierownikow_temat_spotkanie_idx
  ON public.spotkanie_kierownikow_temat (spotkanie_id, kolejnosc);

ALTER TABLE public.zadania
  ADD COLUMN IF NOT EXISTS spotkanie_id bigint REFERENCES public.spotkanie_kierownikow(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS zadania_spotkanie_id_idx
  ON public.zadania (spotkanie_id)
  WHERE spotkanie_id IS NOT NULL;

ALTER TABLE public.spotkanie_kierownikow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotkanie_kierownikow_osoba ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotkanie_kierownikow_temat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_spotkanie_kierownikow" ON public.spotkanie_kierownikow;
DROP POLICY IF EXISTS "auth_all_spotkanie_kierownikow" ON public.spotkanie_kierownikow;
DROP POLICY IF EXISTS "anon_all_spotkanie_kierownikow_osoba" ON public.spotkanie_kierownikow_osoba;
DROP POLICY IF EXISTS "auth_all_spotkanie_kierownikow_osoba" ON public.spotkanie_kierownikow_osoba;
DROP POLICY IF EXISTS "anon_all_spotkanie_kierownikow_temat" ON public.spotkanie_kierownikow_temat;
DROP POLICY IF EXISTS "auth_all_spotkanie_kierownikow_temat" ON public.spotkanie_kierownikow_temat;

CREATE POLICY "anon_all_spotkanie_kierownikow"
  ON public.spotkanie_kierownikow FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_spotkanie_kierownikow"
  ON public.spotkanie_kierownikow FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_spotkanie_kierownikow_osoba"
  ON public.spotkanie_kierownikow_osoba FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_spotkanie_kierownikow_osoba"
  ON public.spotkanie_kierownikow_osoba FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_spotkanie_kierownikow_temat"
  ON public.spotkanie_kierownikow_temat FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_spotkanie_kierownikow_temat"
  ON public.spotkanie_kierownikow_temat FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.spotkanie_kierownikow TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spotkanie_kierownikow_osoba TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spotkanie_kierownikow_temat TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.spotkanie_kierownikow_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.spotkanie_kierownikow_osoba_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.spotkanie_kierownikow_temat_id_seq TO anon, authenticated;
