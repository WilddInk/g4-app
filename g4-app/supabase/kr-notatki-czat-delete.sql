-- Usuwanie wpisów CZAT KR (DELETE na kr_notatka)
-- Supabase → SQL Editor → Run

DROP POLICY IF EXISTS "anon_delete_kr_notatka" ON public.kr_notatka;
DROP POLICY IF EXISTS "auth_delete_kr_notatka" ON public.kr_notatka;

CREATE POLICY "anon_delete_kr_notatka"
  ON public.kr_notatka FOR DELETE TO anon USING (true);
CREATE POLICY "auth_delete_kr_notatka"
  ON public.kr_notatka FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_notatka TO anon, authenticated;
