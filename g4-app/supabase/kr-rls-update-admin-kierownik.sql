-- KR: aktualizacja tylko dla ról admin i kierownik (authenticated).
-- Uruchom w Supabase SQL Editor.

ALTER TABLE public.kr ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_update_kr" ON public.kr;
DROP POLICY IF EXISTS "auth_update_kr_admin_kierownik" ON public.kr;

CREATE POLICY "auth_update_kr_admin_kierownik"
  ON public.kr
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND trim(coalesce(p.app_role, '')) IN ('admin', 'kierownik')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND trim(coalesce(p.app_role, '')) IN ('admin', 'kierownik')
    )
  );

GRANT UPDATE ON public.kr TO authenticated;
