-- =============================================================================
-- Kalendarz czasu pracy: stawki godzinowe (okresy) + dzienne wpisy z KR.
-- Uruchom w Supabase SQL Editor. Wymaga istniejącej tabeli public.pracownik.
-- =============================================================================

-- Okresy stawki za godzinę (do rozliczeń / kosztów na KR)
CREATE TABLE IF NOT EXISTS public.pracownik_stawka_okres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pracownik_nr TEXT NOT NULL,
  data_od DATE NOT NULL,
  data_do DATE NOT NULL,
  stawka_za_godzine NUMERIC(12, 2) NOT NULL,
  waluta TEXT NOT NULL DEFAULT 'PLN',
  uwagi TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT prac_stawka_daty CHECK (data_do >= data_od),
  CONSTRAINT prac_stawka_kwota CHECK (stawka_za_godzine > 0)
);

CREATE INDEX IF NOT EXISTS idx_prac_stawka_nr ON public.pracownik_stawka_okres (pracownik_nr);
CREATE INDEX IF NOT EXISTS idx_prac_stawka_zakres ON public.pracownik_stawka_okres (pracownik_nr, data_od, data_do);

COMMENT ON TABLE public.pracownik_stawka_okres IS
  'Przedział dat + stawka za godzinę — do wyliczania kwoty pracy na KR (nakładające się okresy rozwiązuj w aplikacji / unikaj duplikatów).';

-- Wpisy dnia: wiele wierszy na ten sam dzień (różne KR lub rodzaj nieobecności)
CREATE TABLE IF NOT EXISTS public.czas_pracy_wpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pracownik_nr TEXT NOT NULL,
  data DATE NOT NULL,
  kr TEXT NOT NULL DEFAULT '',
  typ TEXT NOT NULL,
  godziny NUMERIC(6, 2) NOT NULL DEFAULT 0,
  nadgodziny NUMERIC(6, 2) NOT NULL DEFAULT 0,
  uwagi TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT czas_typ_nie_pusty CHECK (length(trim(typ)) > 0),
  CONSTRAINT czas_godziny_chk CHECK (godziny >= 0 AND nadgodziny >= 0)
);

-- Indeks pod listę miesiąca (bez UNIQUE — ten sam dzień może mieć kilka wierszy, np. dwa KR lub korekty)
CREATE INDEX IF NOT EXISTS idx_czas_pracy_nr_data ON public.czas_pracy_wpis (pracownik_nr, data);
CREATE INDEX IF NOT EXISTS idx_czas_pracy_nr_data_kr ON public.czas_pracy_wpis (pracownik_nr, data, kr);

CREATE OR REPLACE FUNCTION public.czas_pracy_wpis_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_czas_pracy_wpis_updated ON public.czas_pracy_wpis;
CREATE TRIGGER trg_czas_pracy_wpis_updated
  BEFORE UPDATE ON public.czas_pracy_wpis
  FOR EACH ROW
  EXECUTE FUNCTION public.czas_pracy_wpis_touch_updated_at();

ALTER TABLE public.pracownik_stawka_okres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.czas_pracy_wpis ENABLE ROW LEVEL SECURITY;

-- Polityki dev: pełny dostęp dla anon / authenticated (jak pozostałe tabele w projekcie).
-- Na produkcji zastąp warunkami po auth.uid() → pracownik.auth_user_id.

DROP POLICY IF EXISTS "anon_all_pracownik_stawka_okres" ON public.pracownik_stawka_okres;
CREATE POLICY "anon_all_pracownik_stawka_okres"
  ON public.pracownik_stawka_okres FOR ALL TO anon
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_pracownik_stawka_okres" ON public.pracownik_stawka_okres;
CREATE POLICY "auth_all_pracownik_stawka_okres"
  ON public.pracownik_stawka_okres FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_czas_pracy_wpis" ON public.czas_pracy_wpis;
CREATE POLICY "anon_all_czas_pracy_wpis"
  ON public.czas_pracy_wpis FOR ALL TO anon
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_czas_pracy_wpis" ON public.czas_pracy_wpis;
CREATE POLICY "auth_all_czas_pracy_wpis"
  ON public.czas_pracy_wpis FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pracownik_stawka_okres TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.czas_pracy_wpis TO anon, authenticated;

-- Na produkcji uruchom po tym pliku (kolejność):
-- 1) g4-app/supabase/czas-pracy-wpis-rls-role.sql — wpisy czasu: admin / kierownik / pracownik
-- 2) g4-app/supabase/pracownik-stawka-okres-rls-tylko-admin.sql — stawki tylko dla administratora
