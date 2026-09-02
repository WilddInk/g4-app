-- Edycja wpisów CZAT KR (UPDATE na kr_notatka)
-- Supabase → SQL Editor → Run (gdy tabela już istnieje)

ALTER TABLE public.kr_notatka ADD COLUMN IF NOT EXISTS updated_at timestamptz;

DROP POLICY IF EXISTS "anon_update_kr_notatka" ON public.kr_notatka;
DROP POLICY IF EXISTS "auth_update_kr_notatka" ON public.kr_notatka;

CREATE POLICY "anon_update_kr_notatka"
  ON public.kr_notatka FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_update_kr_notatka"
  ON public.kr_notatka FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.kr_notatka TO anon, authenticated;
