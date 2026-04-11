-- =============================================================================
-- Gdy przy imporcie / zapisie pracownik_dokument widzisz:
--   new row violates row-level security policy
-- uruchom TEN plik w Supabase SQL Editor (po utworzeniu tabeli pracownik_dokument).
-- Nie wynika to z liczby wierszy — brakuje polityki dla roli authenticated (i/lub anon).
--
-- Powiązane: pracownik-rls-update-tylko-admin.sql — żeby zwykły pracownik nie mógł
-- zmieniać link_google_arkusz (UPDATE na public.pracownik).
-- =============================================================================

ALTER TABLE public.pracownik_dokument ENABLE ROW LEVEL SECURITY;

-- authenticated (logowanie w aplikacji z JWT)
-- Odczyt: wszyscy zalogowani.
-- Zapis (INSERT/UPDATE/DELETE): tylko użytkownik z app_role = 'admin'.
DROP POLICY IF EXISTS "auth_select_pracownik_dokument" ON public.pracownik_dokument;
DROP POLICY IF EXISTS "auth_insert_pracownik_dokument" ON public.pracownik_dokument;
DROP POLICY IF EXISTS "auth_update_pracownik_dokument" ON public.pracownik_dokument;
DROP POLICY IF EXISTS "auth_delete_pracownik_dokument" ON public.pracownik_dokument;

CREATE POLICY "auth_select_pracownik_dokument"
  ON public.pracownik_dokument FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_pracownik_dokument"
  ON public.pracownik_dokument
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND p.is_active = true
        AND p.app_role = 'admin'
    )
  );

CREATE POLICY "auth_update_pracownik_dokument"
  ON public.pracownik_dokument
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND p.is_active = true
        AND p.app_role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND p.is_active = true
        AND p.app_role = 'admin'
    )
  );

CREATE POLICY "auth_delete_pracownik_dokument"
  ON public.pracownik_dokument
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND p.is_active = true
        AND p.app_role = 'admin'
    )
  );

GRANT SELECT ON public.pracownik_dokument TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pracownik_dokument TO authenticated;

-- anon (bez logowania): tylko podgląd
DROP POLICY IF EXISTS "anon_select_pracownik_dokument" ON public.pracownik_dokument;
DROP POLICY IF EXISTS "anon_insert_pracownik_dokument" ON public.pracownik_dokument;
DROP POLICY IF EXISTS "anon_update_pracownik_dokument" ON public.pracownik_dokument;
DROP POLICY IF EXISTS "anon_delete_pracownik_dokument" ON public.pracownik_dokument;

CREATE POLICY "anon_select_pracownik_dokument"
  ON public.pracownik_dokument FOR SELECT TO anon USING (true);

GRANT SELECT ON public.pracownik_dokument TO anon;
REVOKE INSERT, UPDATE, DELETE ON public.pracownik_dokument FROM anon;
