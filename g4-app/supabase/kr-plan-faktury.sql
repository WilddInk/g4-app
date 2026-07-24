-- =============================================================================
-- Planowane faktury sprzedażowe (kolejka FS) — pilnowanie + zaznaczanie przez kierowników
-- Supabase → SQL Editor → Run (idempotentnie)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.kr_plan_faktury (
  id bigserial PRIMARY KEY,
  kr text,
  klient text,
  opis text NOT NULL DEFAULT '',
  horyzont text NOT NULL,
  -- 2026-07 | 2026-08 | 2026-09 | 2026-Q4 | 2027 | inne
  kwota_netto numeric(14, 2),
  -- Blokada biznesowa (dlaczego jeszcze nie FS)
  bloker text,
  -- czeka_protokol | czeka_klauzule | czeka_zielone | ustalic_kwote | waloryzacja | brak | inne
  odpowiedzialny text,
  uwagi text,
  -- Kierownik: czy wolno wystawić fakturę
  mozna_fakturowac boolean NOT NULL DEFAULT false,
  -- plan | blokada | gotowe_do_fs | wystawione
  status text NOT NULL DEFAULT 'plan',
  numer_fs_planowany text,
  data_docelowa date,
  zrodlo text DEFAULT 'lista_prezes',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kr_plan_faktury_status_check CHECK (
    status IN ('plan', 'blokada', 'gotowe_do_fs', 'wystawione')
  )
);

CREATE INDEX IF NOT EXISTS kr_plan_faktury_horyzont_idx ON public.kr_plan_faktury (horyzont);
CREATE INDEX IF NOT EXISTS kr_plan_faktury_kr_idx ON public.kr_plan_faktury (kr);
CREATE INDEX IF NOT EXISTS kr_plan_faktury_mozna_idx ON public.kr_plan_faktury (mozna_fakturowac)
  WHERE mozna_fakturowac = true;
CREATE INDEX IF NOT EXISTS kr_plan_faktury_status_idx ON public.kr_plan_faktury (status);

COMMENT ON TABLE public.kr_plan_faktury IS
  'Planowane faktury sprzedażowe per KR — księgowość pilnuje, kierownik zaznacza „można fakturować”.';
COMMENT ON COLUMN public.kr_plan_faktury.mozna_fakturowac IS
  'true = kierownik potwierdza, że można wystawić FS';
COMMENT ON COLUMN public.kr_plan_faktury.horyzont IS
  'Okres planowany: 2026-07, 2026-08, 2026-09, 2026-Q4, 2027…';

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.kr_plan_faktury_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.mozna_fakturowac IS TRUE AND NEW.status = 'plan' THEN
    NEW.status := 'gotowe_do_fs';
  END IF;
  IF NEW.mozna_fakturowac IS FALSE AND NEW.status = 'gotowe_do_fs' THEN
    NEW.status := 'blokada';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kr_plan_faktury_updated ON public.kr_plan_faktury;
CREATE TRIGGER trg_kr_plan_faktury_updated
  BEFORE INSERT OR UPDATE ON public.kr_plan_faktury
  FOR EACH ROW
  EXECUTE PROCEDURE public.kr_plan_faktury_set_updated_at();

-- RLS
ALTER TABLE public.kr_plan_faktury ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kr_plan_faktury" ON public.kr_plan_faktury;
DROP POLICY IF EXISTS "anon_insert_kr_plan_faktury" ON public.kr_plan_faktury;
DROP POLICY IF EXISTS "anon_update_kr_plan_faktury" ON public.kr_plan_faktury;
DROP POLICY IF EXISTS "anon_delete_kr_plan_faktury" ON public.kr_plan_faktury;

CREATE POLICY "anon_select_kr_plan_faktury"
  ON public.kr_plan_faktury FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kr_plan_faktury"
  ON public.kr_plan_faktury FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kr_plan_faktury"
  ON public.kr_plan_faktury FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kr_plan_faktury"
  ON public.kr_plan_faktury FOR DELETE TO anon USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_plan_faktury TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.kr_plan_faktury_id_seq TO anon;

DROP POLICY IF EXISTS "auth_select_kr_plan_faktury" ON public.kr_plan_faktury;
DROP POLICY IF EXISTS "auth_insert_kr_plan_faktury" ON public.kr_plan_faktury;
DROP POLICY IF EXISTS "auth_update_kr_plan_faktury" ON public.kr_plan_faktury;
DROP POLICY IF EXISTS "auth_delete_kr_plan_faktury" ON public.kr_plan_faktury;

CREATE POLICY "auth_select_kr_plan_faktury"
  ON public.kr_plan_faktury FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_kr_plan_faktury"
  ON public.kr_plan_faktury FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_kr_plan_faktury"
  ON public.kr_plan_faktury FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_kr_plan_faktury"
  ON public.kr_plan_faktury FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_plan_faktury TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.kr_plan_faktury_id_seq TO authenticated;
