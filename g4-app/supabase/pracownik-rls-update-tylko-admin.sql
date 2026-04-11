-- =============================================================================
-- public.pracownik — UPDATE tylko dla app_role = 'admin' (authenticated).
-- Blokuje m.in. zmianę link_google_arkusz przez zwykłego pracownika z aplikacji
-- (panel „Moje dokumenty” wywołuje UPDATE pracownik).
--
-- Uruchom w Supabase SQL Editor po kolumnach app_role / auth_user_id
-- (np. pracownik-kolumny-auth-dzial-check.sql).
-- =============================================================================

ALTER TABLE public.pracownik ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_update_pracownik" ON public.pracownik;

CREATE POLICY "auth_update_pracownik"
  ON public.pracownik
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

-- GRANT pozostaje jak w rls-policies-authenticated.sql (UPDATE nadal potrzebny adminowi).
