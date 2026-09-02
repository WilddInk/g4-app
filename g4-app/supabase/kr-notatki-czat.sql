-- =============================================================================
-- Notatki / czat projektu (KR) — wątek rozmowy na Tablicy KR
-- Supabase → SQL Editor → Run (idempotentnie)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.kr_notatka (
  id bigserial PRIMARY KEY,
  kr text NOT NULL,
  tresc text NOT NULL,
  autor text,
  autor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kr_notatka_kr_created_idx
  ON public.kr_notatka (kr, created_at DESC);

COMMENT ON TABLE public.kr_notatka IS
  'Notatki / czat przy projekcie KR — każdy wpis osobno (kto, kiedy, treść).';

ALTER TABLE public.kr_notatka ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.kr_notatka ADD COLUMN IF NOT EXISTS updated_at timestamptz;

DROP POLICY IF EXISTS "anon_select_kr_notatka" ON public.kr_notatka;
DROP POLICY IF EXISTS "anon_insert_kr_notatka" ON public.kr_notatka;
DROP POLICY IF EXISTS "anon_update_kr_notatka" ON public.kr_notatka;
DROP POLICY IF EXISTS "anon_delete_kr_notatka" ON public.kr_notatka;
DROP POLICY IF EXISTS "auth_select_kr_notatka" ON public.kr_notatka;
DROP POLICY IF EXISTS "auth_insert_kr_notatka" ON public.kr_notatka;
DROP POLICY IF EXISTS "auth_update_kr_notatka" ON public.kr_notatka;
DROP POLICY IF EXISTS "auth_delete_kr_notatka" ON public.kr_notatka;

CREATE POLICY "anon_select_kr_notatka"
  ON public.kr_notatka FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kr_notatka"
  ON public.kr_notatka FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kr_notatka"
  ON public.kr_notatka FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kr_notatka"
  ON public.kr_notatka FOR DELETE TO anon USING (true);

CREATE POLICY "auth_select_kr_notatka"
  ON public.kr_notatka FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_kr_notatka"
  ON public.kr_notatka FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_kr_notatka"
  ON public.kr_notatka FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_kr_notatka"
  ON public.kr_notatka FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_notatka TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.kr_notatka_id_seq TO anon, authenticated;
