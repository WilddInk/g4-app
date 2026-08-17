-- =============================================================================
-- pracownik_stawka_okres: odczyt dla zalogowanych (BUDŻET KR), zapis tylko admin.
-- Uruchom w Supabase SQL Editor PO pracownik-stawka-okres-rls-tylko-admin.sql
-- (albo zamiast niego — pełna polityka poniżej).
-- =============================================================================

ALTER TABLE public.pracownik_stawka_okres ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.pracownik_stawka_okres FROM anon;
GRANT SELECT ON public.pracownik_stawka_okres TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pracownik_stawka_okres TO authenticated;

DROP POLICY IF EXISTS "anon_all_pracownik_stawka_okres" ON public.pracownik_stawka_okres;
DROP POLICY IF EXISTS "auth_all_pracownik_stawka_okres" ON public.pracownik_stawka_okres;
DROP POLICY IF EXISTS "auth_select_prac_stawka_admin" ON public.pracownik_stawka_okres;
DROP POLICY IF EXISTS "auth_insert_prac_stawka_admin" ON public.pracownik_stawka_okres;
DROP POLICY IF EXISTS "auth_update_prac_stawka_admin" ON public.pracownik_stawka_okres;
DROP POLICY IF EXISTS "auth_delete_prac_stawka_admin" ON public.pracownik_stawka_okres;
DROP POLICY IF EXISTS "auth_select_prac_stawka_auth" ON public.pracownik_stawka_okres;

-- Odczyt: każdy aktywny zalogowany pracownik (potrzebne do wyceny BUDŻETU).
CREATE POLICY "auth_select_prac_stawka_auth"
  ON public.pracownik_stawka_okres FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
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
