-- =============================================================================
-- RLS: czas_pracy_zadanie_szablon — jak czas_pracy_wpis (admin/kierownik widzą
-- wszystko, pracownik tylko własne szablony). Uruchom po czas-pracy-wykonywane-zadanie.sql
-- i po czas-pracy-wpis-rls-role.sql (ta sama logika pracownik / rola).
-- =============================================================================

REVOKE ALL ON public.czas_pracy_zadanie_szablon FROM anon;

DROP POLICY IF EXISTS "anon_all_czas_zad_szab" ON public.czas_pracy_zadanie_szablon;
DROP POLICY IF EXISTS "auth_select_czas_zad_szab" ON public.czas_pracy_zadanie_szablon;
DROP POLICY IF EXISTS "auth_insert_czas_zad_szab" ON public.czas_pracy_zadanie_szablon;
DROP POLICY IF EXISTS "auth_update_czas_zad_szab" ON public.czas_pracy_zadanie_szablon;
DROP POLICY IF EXISTS "auth_delete_czas_zad_szab" ON public.czas_pracy_zadanie_szablon;

CREATE POLICY "auth_select_czas_zad_szab"
  ON public.czas_pracy_zadanie_szablon FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND (
          trim(coalesce(p.app_role, '')) IN ('admin', 'kierownik')
          OR trim(coalesce(p.nr::text, '')) = trim(coalesce(czas_pracy_zadanie_szablon.pracownik_nr, ''))
        )
    )
  );

CREATE POLICY "auth_insert_czas_zad_szab"
  ON public.czas_pracy_zadanie_szablon FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND (
          trim(coalesce(p.app_role, '')) = 'admin'
          OR trim(coalesce(p.nr::text, '')) = trim(coalesce(pracownik_nr, ''))
        )
    )
  );

CREATE POLICY "auth_update_czas_zad_szab"
  ON public.czas_pracy_zadanie_szablon FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND (
          trim(coalesce(p.app_role, '')) = 'admin'
          OR trim(coalesce(p.nr::text, '')) = trim(coalesce(czas_pracy_zadanie_szablon.pracownik_nr, ''))
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND (
          trim(coalesce(p.app_role, '')) = 'admin'
          OR trim(coalesce(p.nr::text, '')) = trim(coalesce(pracownik_nr, ''))
        )
    )
  );

CREATE POLICY "auth_delete_czas_zad_szab"
  ON public.czas_pracy_zadanie_szablon FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND (
          trim(coalesce(p.app_role, '')) = 'admin'
          OR trim(coalesce(p.nr::text, '')) = trim(coalesce(czas_pracy_zadanie_szablon.pracownik_nr, ''))
        )
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.czas_pracy_zadanie_szablon TO authenticated;
