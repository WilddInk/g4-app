-- =============================================================================
-- RLS: public.sprzet — pełna lista (Zasoby): admin + kierownik.
-- Osobisty widok „mój sprzęt”: użytkownik widzi tylko wiersze z pracownik_nr = swój nr.
-- Zmiana przypisania (pracownik_nr): tylko admin lub kierownik.
-- Uruchom PO public.sprzet i po pracownik (kolumny auth_user_id, app_role).
-- Nadpisuje polityki „auth_*_sprzet” z rls-policies-authenticated.sql.
-- =============================================================================

DROP POLICY IF EXISTS "auth_select_sprzet" ON public.sprzet;
DROP POLICY IF EXISTS "auth_insert_sprzet" ON public.sprzet;
DROP POLICY IF EXISTS "auth_update_sprzet" ON public.sprzet;
DROP POLICY IF EXISTS "auth_delete_sprzet" ON public.sprzet;

-- Odczyt: admin / kierownik — całość; pozostali — tylko rekordy przypisane do ich numeru.
CREATE POLICY "auth_select_sprzet"
  ON public.sprzet FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND (
          trim(coalesce(p.app_role, '')) IN ('admin', 'kierownik')
          OR trim(coalesce(p.nr::text, '')) = trim(coalesce(sprzet.pracownik_nr, ''))
        )
    )
  );

-- Nowy sprzęt: tylko admin lub kierownik.
CREATE POLICY "auth_insert_sprzet"
  ON public.sprzet FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND trim(coalesce(p.app_role, '')) IN ('admin', 'kierownik')
    )
  );

-- Aktualizacja (np. przydział): tylko admin lub kierownik.
CREATE POLICY "auth_update_sprzet"
  ON public.sprzet FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND trim(coalesce(p.app_role, '')) IN ('admin', 'kierownik')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND trim(coalesce(p.app_role, '')) IN ('admin', 'kierownik')
    )
  );

-- Usuwanie: tylko admin lub kierownik.
CREATE POLICY "auth_delete_sprzet"
  ON public.sprzet FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND trim(coalesce(p.app_role, '')) IN ('admin', 'kierownik')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sprzet TO authenticated;
