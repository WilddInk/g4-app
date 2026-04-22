-- =============================================================================
-- Tickety / dziennik uwag aplikacji G4
-- Uruchom po utworzeniu tabeli public.pracownik (powiazanie auth_user_id -> nr).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.app_ticket (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  zglaszajacy_nr text NOT NULL,
  tresc_zgloszenia text NOT NULL,
  odpowiedz text,
  status text NOT NULL DEFAULT 'oczekuje'
    CHECK (status IN ('oczekuje', 'w trakcie', 'zrobione')),
  podpis_wdrozenia text,
  data_zgloszenia date NOT NULL DEFAULT CURRENT_DATE,
  data_zrobienia date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_ticket_status_data ON public.app_ticket (status, data_zgloszenia DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_app_ticket_zglaszajacy ON public.app_ticket (zglaszajacy_nr, data_zgloszenia DESC);

COMMENT ON TABLE public.app_ticket IS 'Roboczy dziennik uwag/ticketow dla aplikacji G4.';
COMMENT ON COLUMN public.app_ticket.podpis_wdrozenia IS 'Podpis osoby wdrazajacej (np. Imie Nazwisko / nr).';

CREATE OR REPLACE FUNCTION public.app_ticket_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_app_ticket_updated_at ON public.app_ticket;
CREATE TRIGGER trg_app_ticket_updated_at
  BEFORE UPDATE ON public.app_ticket
  FOR EACH ROW
  EXECUTE FUNCTION public.app_ticket_touch_updated_at();

ALTER TABLE public.app_ticket ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.app_ticket FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_ticket TO authenticated;

DROP POLICY IF EXISTS "app_ticket_select_active_auth" ON public.app_ticket;
CREATE POLICY "app_ticket_select_active_auth"
  ON public.app_ticket FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
    )
  );

DROP POLICY IF EXISTS "app_ticket_insert_active_auth" ON public.app_ticket;
CREATE POLICY "app_ticket_insert_active_auth"
  ON public.app_ticket FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND (
          trim(coalesce(p.app_role, '')) = 'admin'
          OR trim(coalesce(p.nr::text, '')) = trim(coalesce(app_ticket.zglaszajacy_nr, ''))
        )
    )
  );

DROP POLICY IF EXISTS "app_ticket_update_active_auth" ON public.app_ticket;
CREATE POLICY "app_ticket_update_active_auth"
  ON public.app_ticket FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND (
          trim(coalesce(p.app_role, '')) IN ('admin', 'kierownik')
          OR trim(coalesce(p.nr::text, '')) = trim(coalesce(app_ticket.zglaszajacy_nr, ''))
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
          trim(coalesce(p.app_role, '')) IN ('admin', 'kierownik')
          OR trim(coalesce(p.nr::text, '')) = trim(coalesce(app_ticket.zglaszajacy_nr, ''))
        )
    )
  );

DROP POLICY IF EXISTS "app_ticket_delete_admin_only" ON public.app_ticket;
CREATE POLICY "app_ticket_delete_admin_only"
  ON public.app_ticket FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
        AND trim(coalesce(p.app_role, '')) = 'admin'
    )
  );
