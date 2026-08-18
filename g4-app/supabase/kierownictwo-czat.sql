-- =============================================================================
-- Czat kierownictwa (Damian, Michał, Monika, Ania Homik, Gosia Franczak)
-- Supabase → SQL Editor → Run
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.kierownictwo_czat (
  id bigserial PRIMARY KEY,
  tresc text NOT NULL,
  autor text,
  autor_email text,
  -- opcjonalnie: powiązane zadanie utworzone z czatu
  zadanie_id bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kierownictwo_czat_created_idx
  ON public.kierownictwo_czat (created_at DESC);

COMMENT ON TABLE public.kierownictwo_czat IS
  'Wspólny czat kierownictwa (fakturowanie / ustalenia) — tylko wybrani kierownicy w UI.';

ALTER TABLE public.kierownictwo_czat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kierownictwo_czat" ON public.kierownictwo_czat;
DROP POLICY IF EXISTS "anon_insert_kierownictwo_czat" ON public.kierownictwo_czat;
DROP POLICY IF EXISTS "auth_select_kierownictwo_czat" ON public.kierownictwo_czat;
DROP POLICY IF EXISTS "auth_insert_kierownictwo_czat" ON public.kierownictwo_czat;

CREATE POLICY "anon_select_kierownictwo_czat"
  ON public.kierownictwo_czat FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kierownictwo_czat"
  ON public.kierownictwo_czat FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "auth_select_kierownictwo_czat"
  ON public.kierownictwo_czat FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_kierownictwo_czat"
  ON public.kierownictwo_czat FOR INSERT TO authenticated WITH CHECK (true);

GRANT SELECT, INSERT ON public.kierownictwo_czat TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.kierownictwo_czat_id_seq TO anon, authenticated;
