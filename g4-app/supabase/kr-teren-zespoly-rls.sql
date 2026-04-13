-- RLS dla zespołów terenowych — uruchom po kr-teren-zespoly.sql
-- Na produkcji doprecyzuj USING / WITH CHECK zamiast (true).

ALTER TABLE public.kr_teren_zespol ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_kr_teren_zespol" ON public.kr_teren_zespol;
DROP POLICY IF EXISTS "anon_insert_kr_teren_zespol" ON public.kr_teren_zespol;
DROP POLICY IF EXISTS "anon_update_kr_teren_zespol" ON public.kr_teren_zespol;
DROP POLICY IF EXISTS "anon_delete_kr_teren_zespol" ON public.kr_teren_zespol;
CREATE POLICY "anon_select_kr_teren_zespol" ON public.kr_teren_zespol FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kr_teren_zespol" ON public.kr_teren_zespol FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kr_teren_zespol" ON public.kr_teren_zespol FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kr_teren_zespol" ON public.kr_teren_zespol FOR DELETE TO anon USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_teren_zespol TO anon;

ALTER TABLE public.kr_teren_zespol_pracownik ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_kr_teren_zespol_prac" ON public.kr_teren_zespol_pracownik;
DROP POLICY IF EXISTS "anon_insert_kr_teren_zespol_prac" ON public.kr_teren_zespol_pracownik;
DROP POLICY IF EXISTS "anon_delete_kr_teren_zespol_prac" ON public.kr_teren_zespol_pracownik;
CREATE POLICY "anon_select_kr_teren_zespol_prac" ON public.kr_teren_zespol_pracownik FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kr_teren_zespol_prac" ON public.kr_teren_zespol_pracownik FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_delete_kr_teren_zespol_prac" ON public.kr_teren_zespol_pracownik FOR DELETE TO anon USING (true);
GRANT SELECT, INSERT, DELETE ON public.kr_teren_zespol_pracownik TO anon;

ALTER TABLE public.kr_teren_zadanie ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_kr_teren_zadanie" ON public.kr_teren_zadanie;
DROP POLICY IF EXISTS "anon_insert_kr_teren_zadanie" ON public.kr_teren_zadanie;
DROP POLICY IF EXISTS "anon_update_kr_teren_zadanie" ON public.kr_teren_zadanie;
DROP POLICY IF EXISTS "anon_delete_kr_teren_zadanie" ON public.kr_teren_zadanie;
CREATE POLICY "anon_select_kr_teren_zadanie" ON public.kr_teren_zadanie FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kr_teren_zadanie" ON public.kr_teren_zadanie FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kr_teren_zadanie" ON public.kr_teren_zadanie FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kr_teren_zadanie" ON public.kr_teren_zadanie FOR DELETE TO anon USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_teren_zadanie TO anon;

-- authenticated (sesja Supabase)
ALTER TABLE public.kr_teren_zespol ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_kr_teren_zespol" ON public.kr_teren_zespol;
DROP POLICY IF EXISTS "auth_insert_kr_teren_zespol" ON public.kr_teren_zespol;
DROP POLICY IF EXISTS "auth_update_kr_teren_zespol" ON public.kr_teren_zespol;
DROP POLICY IF EXISTS "auth_delete_kr_teren_zespol" ON public.kr_teren_zespol;
CREATE POLICY "auth_select_kr_teren_zespol" ON public.kr_teren_zespol FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_kr_teren_zespol" ON public.kr_teren_zespol FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_kr_teren_zespol" ON public.kr_teren_zespol FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_kr_teren_zespol" ON public.kr_teren_zespol FOR DELETE TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_teren_zespol TO authenticated;

ALTER TABLE public.kr_teren_zespol_pracownik ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_kr_teren_zespol_prac" ON public.kr_teren_zespol_pracownik;
DROP POLICY IF EXISTS "auth_insert_kr_teren_zespol_prac" ON public.kr_teren_zespol_pracownik;
DROP POLICY IF EXISTS "auth_delete_kr_teren_zespol_prac" ON public.kr_teren_zespol_pracownik;
CREATE POLICY "auth_select_kr_teren_zespol_prac" ON public.kr_teren_zespol_pracownik FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_kr_teren_zespol_prac" ON public.kr_teren_zespol_pracownik FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_delete_kr_teren_zespol_prac" ON public.kr_teren_zespol_pracownik FOR DELETE TO authenticated USING (true);
GRANT SELECT, INSERT, DELETE ON public.kr_teren_zespol_pracownik TO authenticated;

ALTER TABLE public.kr_teren_zadanie ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_kr_teren_zadanie" ON public.kr_teren_zadanie;
DROP POLICY IF EXISTS "auth_insert_kr_teren_zadanie" ON public.kr_teren_zadanie;
DROP POLICY IF EXISTS "auth_update_kr_teren_zadanie" ON public.kr_teren_zadanie;
DROP POLICY IF EXISTS "auth_delete_kr_teren_zadanie" ON public.kr_teren_zadanie;
CREATE POLICY "auth_select_kr_teren_zadanie" ON public.kr_teren_zadanie FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_kr_teren_zadanie" ON public.kr_teren_zadanie FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_kr_teren_zadanie" ON public.kr_teren_zadanie FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_kr_teren_zadanie" ON public.kr_teren_zadanie FOR DELETE TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_teren_zadanie TO authenticated;
