-- =============================================================================
-- Tabela public.pracownik_stawka_okres — tylko administrator (app_role = admin).
-- Uruchom PO czas-pracy-stawki-i-wpisy.sql (gdy tabele już istnieją).
-- Wymaga zalogowanego użytkownika (JWT) z przypisanym auth_user_id w pracownik.
-- =============================================================================

REVOKE ALL ON public.pracownik_stawka_okres FROM anon;

DROP POLICY IF EXISTS "anon_all_pracownik_stawka_okres" ON public.pracownik_stawka_okres;
DROP POLICY IF EXISTS "auth_all_pracownik_stawka_okres" ON public.pracownik_stawka_okres;
DROP POLICY IF EXISTS "auth_select_prac_stawka_admin" ON public.pracownik_stawka_okres;
DROP POLICY IF EXISTS "auth_insert_prac_stawka_admin" ON public.pracownik_stawka_okres;
DROP POLICY IF EXISTS "auth_update_prac_stawka_admin" ON public.pracownik_stawka_okres;
DROP POLICY IF EXISTS "auth_delete_prac_stawka_admin" ON public.pracownik_stawka_okres;

CREATE POLICY "auth_select_prac_stawka_admin"
  ON public.pracownik_stawka_okres FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND trim(coalesce(p.app_role, '')) = 'admin'
    )
  );

CREATE POLICY "auth_insert_prac_stawka_admin"
  ON public.pracownik_stawka_okres FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND trim(coalesce(p.app_role, '')) = 'admin'
    )
  );

CREATE POLICY "auth_update_prac_stawka_admin"
  ON public.pracownik_stawka_okres FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND trim(coalesce(p.app_role, '')) = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND trim(coalesce(p.app_role, '')) = 'admin'
    )
  );

CREATE POLICY "auth_delete_prac_stawka_admin"
  ON public.pracownik_stawka_okres FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND trim(coalesce(p.app_role, '')) = 'admin'
    )
  );

-- GRANT pozostaje dla authenticated (anon bez dostępu)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pracownik_stawka_okres TO authenticated;
