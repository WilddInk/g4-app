-- =============================================================================
-- RLS dla public.czas_pracy_wpis — role: admin (pełna edycja), kierownik (podgląd
-- wszystkich, edycja tylko własnych), pracownik (tylko własne).
-- Uruchom PO czas-pracy-stawki-i-wpisy.sql. Wymaga JWT (authenticated) i auth_user_id w pracownik.
-- Odbiera dostęp roli anon do tej tabeli.
-- =============================================================================

REVOKE ALL ON public.czas_pracy_wpis FROM anon;

DROP POLICY IF EXISTS "anon_all_czas_pracy_wpis" ON public.czas_pracy_wpis;
DROP POLICY IF EXISTS "auth_all_czas_pracy_wpis" ON public.czas_pracy_wpis;
DROP POLICY IF EXISTS "auth_select_czas_pracy_wpis" ON public.czas_pracy_wpis;
DROP POLICY IF EXISTS "auth_insert_czas_pracy_wpis" ON public.czas_pracy_wpis;
DROP POLICY IF EXISTS "auth_update_czas_pracy_wpis" ON public.czas_pracy_wpis;
DROP POLICY IF EXISTS "auth_delete_czas_pracy_wpis" ON public.czas_pracy_wpis;

-- Odczyt: własne wiersze LUB admin/kierownik (widok całości)
CREATE POLICY "auth_select_czas_pracy_wpis"
  ON public.czas_pracy_wpis FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND (
          trim(coalesce(p.app_role, '')) IN ('admin', 'kierownik')
          OR trim(coalesce(p.nr::text, '')) = trim(coalesce(czas_pracy_wpis.pracownik_nr, ''))
        )
    )
  );

-- Zapis: admin dowolny pracownik_nr; pozostali tylko własny numer
CREATE POLICY "auth_insert_czas_pracy_wpis"
  ON public.czas_pracy_wpis FOR INSERT TO authenticated
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

CREATE POLICY "auth_update_czas_pracy_wpis"
  ON public.czas_pracy_wpis FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND (
          trim(coalesce(p.app_role, '')) = 'admin'
          OR trim(coalesce(p.nr::text, '')) = trim(coalesce(czas_pracy_wpis.pracownik_nr, ''))
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

CREATE POLICY "auth_delete_czas_pracy_wpis"
  ON public.czas_pracy_wpis FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND (
          trim(coalesce(p.app_role, '')) = 'admin'
          OR trim(coalesce(p.nr::text, '')) = trim(coalesce(czas_pracy_wpis.pracownik_nr, ''))
        )
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.czas_pracy_wpis TO authenticated;
