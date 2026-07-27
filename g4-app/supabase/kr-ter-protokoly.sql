-- =============================================================================
-- TER / protokoły rozliczeniowe (mechanizm) — faza 1
-- Supabase → SQL Editor → Run (idempotentnie)
--
-- Excel „TABELA ELEMENTÓW ROZLICZENIOWYCH.xlsx” = SZABLON mechanizmu, NIE historia
-- protokołów produkcyjnych. Seed katalogu TER: kr-ter-protokoly-seed.sql
--
-- Reguła „ile zostało do końca” (faza 1 — protokoły):
--   • suma_kontraktu  — edytowalna wartość kontraktu NETTO (nagłówek KR)
--   • wykonano / suma_protokolow — SUM(wartosc_okresu) ze wszystkich linii protokołów
--     (kolumna L w Excelu: wartość usług w okresie rozliczeniowym)
--   • pozostalo = suma_kontraktu - wykonano
--   • procent_wykonania = wykonano / suma_kontraktu * 100  (gdy suma > 0)
--
-- Rozszerzenie FS (suma faktur sprzedażowych / pozostało handlowo):
--   uruchom dodatkowo kr-ter-protokoly-faktury.sql
--   (pozostalo_kontrakt = suma_kontraktu − suma_faktur_fs; protokoły osobno).
--
-- Pozycje TER (katalog) służą do rozbijania protokołu (K/L/M/N per lp);
-- metryka kontraktowa „pozostało do końca” jest na poziomie suma_kontraktu, nie
-- wymusza sumy wartosc pozycji (użytkownik może ustawić sumę niezależnie).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Nagłówek rozliczenia kontraktu / KR
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kr_ter_rozliczenie (
  id bigserial PRIMARY KEY,
  kr text NOT NULL,
  nazwa_kontraktu text,
  klient text,
  nr_umowy text,
  -- Edytowalna suma kontraktu NETTO — źródło „ile zostało do końca”
  suma_kontraktu numeric(14, 2) NOT NULL DEFAULT 0,
  uwagi text,
  -- reczne | szablon_excel
  zrodlo text NOT NULL DEFAULT 'reczne',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kr_ter_rozliczenie_kr_unique UNIQUE (kr),
  CONSTRAINT kr_ter_rozliczenie_suma_check CHECK (suma_kontraktu >= 0)
);

CREATE INDEX IF NOT EXISTS kr_ter_rozliczenie_kr_idx ON public.kr_ter_rozliczenie (kr);

COMMENT ON TABLE public.kr_ter_rozliczenie IS
  'TER: nagłówek rozliczenia KR — suma_kontraktu + metryki pozostało (mechanizm, nie import historii Excel).';
COMMENT ON COLUMN public.kr_ter_rozliczenie.suma_kontraktu IS
  'Edytowalna wartość kontraktu NETTO. pozostalo = suma_kontraktu - SUM(linie protokołów.wartosc_okresu).';
COMMENT ON COLUMN public.kr_ter_rozliczenie.zrodlo IS
  'reczne = wpis z aplikacji; szablon_excel = seed z arkusza TER (katalog przykładowy).';

-- -----------------------------------------------------------------------------
-- 2) Katalog pozycji TER (per KR)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kr_ter_pozycja (
  id bigserial PRIMARY KEY,
  rozliczenie_id bigint NOT NULL REFERENCES public.kr_ter_rozliczenie (id) ON DELETE CASCADE,
  kr text NOT NULL,
  lp text NOT NULL,
  opis text NOT NULL DEFAULT '',
  jm text,
  ilosc_umowna numeric(14, 4),
  cena numeric(14, 2),
  -- Wartość pozycji NETTO (Excel kol. G); zwykle ilosc_umowna * cena
  wartosc numeric(14, 2),
  kolejnosc int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kr_ter_pozycja_lp_unique UNIQUE (rozliczenie_id, lp)
);

CREATE INDEX IF NOT EXISTS kr_ter_pozycja_kr_idx ON public.kr_ter_pozycja (kr);
CREATE INDEX IF NOT EXISTS kr_ter_pozycja_rozliczenie_idx ON public.kr_ter_pozycja (rozliczenie_id);

COMMENT ON TABLE public.kr_ter_pozycja IS
  'TER: katalog elementów rozliczeniowych (lp, opis, jm, ilość umowna, cena, wartość).';
COMMENT ON COLUMN public.kr_ter_pozycja.wartosc IS
  'Wartość pozycji NETTO (Excel G). Pozostało per pozycja = wartosc - SUM(linie.wartosc_okresu dla tej pozycji).';

-- -----------------------------------------------------------------------------
-- 3) Rejestr protokołów (puste domyślnie — wypełniane progresywnie)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kr_ter_protokol (
  id bigserial PRIMARY KEY,
  rozliczenie_id bigint NOT NULL REFERENCES public.kr_ter_rozliczenie (id) ON DELETE CASCADE,
  kr text NOT NULL,
  nr_kolejny int NOT NULL,
  -- Numer wyświetlany: zwykle „{kr}/{nr_kolejny}”
  numer text NOT NULL,
  data_protokolu date,
  okres_od date,
  okres_do date,
  przy_udziale text,
  uwagi text,
  pdf_url text,
  -- szkic | zatwierdzony (faza 1: bez twardej blokady edycji)
  status text NOT NULL DEFAULT 'szkic',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kr_ter_protokol_nr_unique UNIQUE (rozliczenie_id, nr_kolejny),
  CONSTRAINT kr_ter_protokol_status_check CHECK (status IN ('szkic', 'zatwierdzony')),
  CONSTRAINT kr_ter_protokol_nr_kolejny_check CHECK (nr_kolejny >= 0)
);

CREATE INDEX IF NOT EXISTS kr_ter_protokol_kr_idx ON public.kr_ter_protokol (kr);
CREATE INDEX IF NOT EXISTS kr_ter_protokol_rozliczenie_idx ON public.kr_ter_protokol (rozliczenie_id);

COMMENT ON TABLE public.kr_ter_protokol IS
  'TER: nagłówki protokołów odbioru (rejestr). Excel Protokoły ≠ źródło prawdy — nie bulk-importować.';
COMMENT ON COLUMN public.kr_ter_protokol.numer IS
  'Numer protokołu (np. 1074/1).';

-- -----------------------------------------------------------------------------
-- 4) Linie protokołu (wartość okresu L — zmniejsza pozostało)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kr_ter_protokol_linia (
  id bigserial PRIMARY KEY,
  protokol_id bigint NOT NULL REFERENCES public.kr_ter_protokol (id) ON DELETE CASCADE,
  pozycja_id bigint REFERENCES public.kr_ter_pozycja (id) ON DELETE SET NULL,
  lp text,
  opis text,
  jm text,
  ilosc_okresu numeric(14, 4),
  -- Kolumna L (Excel): wartość usług w bieżącym okresie — wliczana w wykonano
  wartosc_okresu numeric(14, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kr_ter_protokol_linia_protokol_idx
  ON public.kr_ter_protokol_linia (protokol_id);
CREATE INDEX IF NOT EXISTS kr_ter_protokol_linia_pozycja_idx
  ON public.kr_ter_protokol_linia (pozycja_id);

COMMENT ON TABLE public.kr_ter_protokol_linia IS
  'TER: linie protokołu — wartosc_okresu (L) sumuje się do wykonano / suma_protokolow.';
COMMENT ON COLUMN public.kr_ter_protokol_linia.wartosc_okresu IS
  'Wartość NETTO w okresie rozliczeniowym protokołu (Excel L). Sumowana w podsumowaniu KR.';

-- -----------------------------------------------------------------------------
-- 5) updated_at triggers (EXECUTE PROCEDURE — zgodność ze starszym Postgres / Supabase)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kr_ter_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kr_ter_rozliczenie_updated ON public.kr_ter_rozliczenie;
CREATE TRIGGER trg_kr_ter_rozliczenie_updated
  BEFORE INSERT OR UPDATE ON public.kr_ter_rozliczenie
  FOR EACH ROW
  EXECUTE PROCEDURE public.kr_ter_set_updated_at();

DROP TRIGGER IF EXISTS trg_kr_ter_pozycja_updated ON public.kr_ter_pozycja;
CREATE TRIGGER trg_kr_ter_pozycja_updated
  BEFORE INSERT OR UPDATE ON public.kr_ter_pozycja
  FOR EACH ROW
  EXECUTE PROCEDURE public.kr_ter_set_updated_at();

DROP TRIGGER IF EXISTS trg_kr_ter_protokol_updated ON public.kr_ter_protokol;
CREATE TRIGGER trg_kr_ter_protokol_updated
  BEFORE INSERT OR UPDATE ON public.kr_ter_protokol
  FOR EACH ROW
  EXECUTE PROCEDURE public.kr_ter_set_updated_at();

DROP TRIGGER IF EXISTS trg_kr_ter_protokol_linia_updated ON public.kr_ter_protokol_linia;
CREATE TRIGGER trg_kr_ter_protokol_linia_updated
  BEFORE INSERT OR UPDATE ON public.kr_ter_protokol_linia
  FOR EACH ROW
  EXECUTE PROCEDURE public.kr_ter_set_updated_at();

-- Numer protokołu domyślnie kr/nr_kolejny gdy pusty
CREATE OR REPLACE FUNCTION public.kr_ter_protokol_set_numer()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.numer IS NULL OR btrim(NEW.numer) = '' THEN
    NEW.numer := NEW.kr || '/' || NEW.nr_kolejny::text;
  END IF;
  IF NEW.kr IS NULL OR btrim(NEW.kr) = '' THEN
    SELECT r.kr INTO NEW.kr
    FROM public.kr_ter_rozliczenie r
    WHERE r.id = NEW.rozliczenie_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kr_ter_protokol_numer ON public.kr_ter_protokol;
CREATE TRIGGER trg_kr_ter_protokol_numer
  BEFORE INSERT OR UPDATE ON public.kr_ter_protokol
  FOR EACH ROW
  EXECUTE PROCEDURE public.kr_ter_protokol_set_numer();

-- Sync kr na pozycji z nagłówka
CREATE OR REPLACE FUNCTION public.kr_ter_pozycja_set_kr()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.kr IS NULL OR btrim(NEW.kr) = '' THEN
    SELECT r.kr INTO NEW.kr
    FROM public.kr_ter_rozliczenie r
    WHERE r.id = NEW.rozliczenie_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kr_ter_pozycja_kr ON public.kr_ter_pozycja;
CREATE TRIGGER trg_kr_ter_pozycja_kr
  BEFORE INSERT OR UPDATE ON public.kr_ter_pozycja
  FOR EACH ROW
  EXECUTE PROCEDURE public.kr_ter_pozycja_set_kr();

-- -----------------------------------------------------------------------------
-- 6) Widok podsumowania (suma / wykonano / pozostało / %)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_kr_ter_podsumowanie AS
SELECT
  r.id AS rozliczenie_id,
  r.kr,
  r.nazwa_kontraktu,
  r.klient,
  r.nr_umowy,
  r.suma_kontraktu,
  r.uwagi,
  r.zrodlo,
  COALESCE(agg.suma_protokolow, 0)::numeric(14, 2) AS suma_protokolow,
  COALESCE(agg.suma_protokolow, 0)::numeric(14, 2) AS wykonano,
  (r.suma_kontraktu - COALESCE(agg.suma_protokolow, 0))::numeric(14, 2) AS pozostalo,
  CASE
    WHEN r.suma_kontraktu > 0 THEN
      ROUND((COALESCE(agg.suma_protokolow, 0) / r.suma_kontraktu) * 100, 2)
    ELSE NULL
  END AS procent_wykonania,
  COALESCE(agg.liczba_protokolow, 0)::int AS liczba_protokolow,
  COALESCE(poz.liczba_pozycji, 0)::int AS liczba_pozycji_ter,
  r.created_at,
  r.updated_at
FROM public.kr_ter_rozliczenie r
LEFT JOIN (
  SELECT
    pr.rozliczenie_id,
    COUNT(DISTINCT pr.id)::int AS liczba_protokolow,
    COALESCE(SUM(l.wartosc_okresu), 0) AS suma_protokolow
  FROM public.kr_ter_protokol pr
  LEFT JOIN public.kr_ter_protokol_linia l ON l.protokol_id = pr.id
  GROUP BY pr.rozliczenie_id
) agg ON agg.rozliczenie_id = r.id
LEFT JOIN (
  SELECT rozliczenie_id, COUNT(*)::int AS liczba_pozycji
  FROM public.kr_ter_pozycja
  GROUP BY rozliczenie_id
) poz ON poz.rozliczenie_id = r.id;

COMMENT ON VIEW public.v_kr_ter_podsumowanie IS
  'TER: podsumowanie KR — suma_kontraktu, wykonano (=suma_protokolow), pozostalo, %.';

-- Widok pozostało per pozycja TER (Excel N)
CREATE OR REPLACE VIEW public.v_kr_ter_pozycja_pozostalo AS
SELECT
  p.id AS pozycja_id,
  p.rozliczenie_id,
  p.kr,
  p.lp,
  p.opis,
  p.jm,
  p.ilosc_umowna,
  p.cena,
  COALESCE(p.wartosc, 0)::numeric(14, 2) AS wartosc,
  COALESCE(x.wykonano_pozycji, 0)::numeric(14, 2) AS wykonano_pozycji,
  (COALESCE(p.wartosc, 0) - COALESCE(x.wykonano_pozycji, 0))::numeric(14, 2) AS pozostalo_pozycji,
  p.kolejnosc
FROM public.kr_ter_pozycja p
LEFT JOIN (
  SELECT
    l.pozycja_id,
    SUM(l.wartosc_okresu) AS wykonano_pozycji
  FROM public.kr_ter_protokol_linia l
  WHERE l.pozycja_id IS NOT NULL
  GROUP BY l.pozycja_id
) x ON x.pozycja_id = p.id;

COMMENT ON VIEW public.v_kr_ter_pozycja_pozostalo IS
  'TER: pozostało per pozycja = wartosc - SUM(linie.wartosc_okresu). Pomocnicze; UI KR używa v_kr_ter_podsumowanie.';

-- -----------------------------------------------------------------------------
-- 7) RLS — jak kr_plan_faktury (anon + authenticated read/write)
-- -----------------------------------------------------------------------------
ALTER TABLE public.kr_ter_rozliczenie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kr_ter_pozycja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kr_ter_protokol ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kr_ter_protokol_linia ENABLE ROW LEVEL SECURITY;

-- rozliczenie
DROP POLICY IF EXISTS "anon_select_kr_ter_rozliczenie" ON public.kr_ter_rozliczenie;
DROP POLICY IF EXISTS "anon_insert_kr_ter_rozliczenie" ON public.kr_ter_rozliczenie;
DROP POLICY IF EXISTS "anon_update_kr_ter_rozliczenie" ON public.kr_ter_rozliczenie;
DROP POLICY IF EXISTS "anon_delete_kr_ter_rozliczenie" ON public.kr_ter_rozliczenie;
CREATE POLICY "anon_select_kr_ter_rozliczenie"
  ON public.kr_ter_rozliczenie FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kr_ter_rozliczenie"
  ON public.kr_ter_rozliczenie FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kr_ter_rozliczenie"
  ON public.kr_ter_rozliczenie FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kr_ter_rozliczenie"
  ON public.kr_ter_rozliczenie FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "auth_select_kr_ter_rozliczenie" ON public.kr_ter_rozliczenie;
DROP POLICY IF EXISTS "auth_insert_kr_ter_rozliczenie" ON public.kr_ter_rozliczenie;
DROP POLICY IF EXISTS "auth_update_kr_ter_rozliczenie" ON public.kr_ter_rozliczenie;
DROP POLICY IF EXISTS "auth_delete_kr_ter_rozliczenie" ON public.kr_ter_rozliczenie;
CREATE POLICY "auth_select_kr_ter_rozliczenie"
  ON public.kr_ter_rozliczenie FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_kr_ter_rozliczenie"
  ON public.kr_ter_rozliczenie FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_kr_ter_rozliczenie"
  ON public.kr_ter_rozliczenie FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_kr_ter_rozliczenie"
  ON public.kr_ter_rozliczenie FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_ter_rozliczenie TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_ter_rozliczenie TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.kr_ter_rozliczenie_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.kr_ter_rozliczenie_id_seq TO authenticated;

-- pozycja
DROP POLICY IF EXISTS "anon_select_kr_ter_pozycja" ON public.kr_ter_pozycja;
DROP POLICY IF EXISTS "anon_insert_kr_ter_pozycja" ON public.kr_ter_pozycja;
DROP POLICY IF EXISTS "anon_update_kr_ter_pozycja" ON public.kr_ter_pozycja;
DROP POLICY IF EXISTS "anon_delete_kr_ter_pozycja" ON public.kr_ter_pozycja;
CREATE POLICY "anon_select_kr_ter_pozycja"
  ON public.kr_ter_pozycja FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kr_ter_pozycja"
  ON public.kr_ter_pozycja FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kr_ter_pozycja"
  ON public.kr_ter_pozycja FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kr_ter_pozycja"
  ON public.kr_ter_pozycja FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "auth_select_kr_ter_pozycja" ON public.kr_ter_pozycja;
DROP POLICY IF EXISTS "auth_insert_kr_ter_pozycja" ON public.kr_ter_pozycja;
DROP POLICY IF EXISTS "auth_update_kr_ter_pozycja" ON public.kr_ter_pozycja;
DROP POLICY IF EXISTS "auth_delete_kr_ter_pozycja" ON public.kr_ter_pozycja;
CREATE POLICY "auth_select_kr_ter_pozycja"
  ON public.kr_ter_pozycja FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_kr_ter_pozycja"
  ON public.kr_ter_pozycja FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_kr_ter_pozycja"
  ON public.kr_ter_pozycja FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_kr_ter_pozycja"
  ON public.kr_ter_pozycja FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_ter_pozycja TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_ter_pozycja TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.kr_ter_pozycja_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.kr_ter_pozycja_id_seq TO authenticated;

-- protokol
DROP POLICY IF EXISTS "anon_select_kr_ter_protokol" ON public.kr_ter_protokol;
DROP POLICY IF EXISTS "anon_insert_kr_ter_protokol" ON public.kr_ter_protokol;
DROP POLICY IF EXISTS "anon_update_kr_ter_protokol" ON public.kr_ter_protokol;
DROP POLICY IF EXISTS "anon_delete_kr_ter_protokol" ON public.kr_ter_protokol;
CREATE POLICY "anon_select_kr_ter_protokol"
  ON public.kr_ter_protokol FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kr_ter_protokol"
  ON public.kr_ter_protokol FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kr_ter_protokol"
  ON public.kr_ter_protokol FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kr_ter_protokol"
  ON public.kr_ter_protokol FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "auth_select_kr_ter_protokol" ON public.kr_ter_protokol;
DROP POLICY IF EXISTS "auth_insert_kr_ter_protokol" ON public.kr_ter_protokol;
DROP POLICY IF EXISTS "auth_update_kr_ter_protokol" ON public.kr_ter_protokol;
DROP POLICY IF EXISTS "auth_delete_kr_ter_protokol" ON public.kr_ter_protokol;
CREATE POLICY "auth_select_kr_ter_protokol"
  ON public.kr_ter_protokol FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_kr_ter_protokol"
  ON public.kr_ter_protokol FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_kr_ter_protokol"
  ON public.kr_ter_protokol FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_kr_ter_protokol"
  ON public.kr_ter_protokol FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_ter_protokol TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_ter_protokol TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.kr_ter_protokol_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.kr_ter_protokol_id_seq TO authenticated;

-- linia
DROP POLICY IF EXISTS "anon_select_kr_ter_protokol_linia" ON public.kr_ter_protokol_linia;
DROP POLICY IF EXISTS "anon_insert_kr_ter_protokol_linia" ON public.kr_ter_protokol_linia;
DROP POLICY IF EXISTS "anon_update_kr_ter_protokol_linia" ON public.kr_ter_protokol_linia;
DROP POLICY IF EXISTS "anon_delete_kr_ter_protokol_linia" ON public.kr_ter_protokol_linia;
CREATE POLICY "anon_select_kr_ter_protokol_linia"
  ON public.kr_ter_protokol_linia FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kr_ter_protokol_linia"
  ON public.kr_ter_protokol_linia FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kr_ter_protokol_linia"
  ON public.kr_ter_protokol_linia FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kr_ter_protokol_linia"
  ON public.kr_ter_protokol_linia FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "auth_select_kr_ter_protokol_linia" ON public.kr_ter_protokol_linia;
DROP POLICY IF EXISTS "auth_insert_kr_ter_protokol_linia" ON public.kr_ter_protokol_linia;
DROP POLICY IF EXISTS "auth_update_kr_ter_protokol_linia" ON public.kr_ter_protokol_linia;
DROP POLICY IF EXISTS "auth_delete_kr_ter_protokol_linia" ON public.kr_ter_protokol_linia;
CREATE POLICY "auth_select_kr_ter_protokol_linia"
  ON public.kr_ter_protokol_linia FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_kr_ter_protokol_linia"
  ON public.kr_ter_protokol_linia FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_kr_ter_protokol_linia"
  ON public.kr_ter_protokol_linia FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_kr_ter_protokol_linia"
  ON public.kr_ter_protokol_linia FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_ter_protokol_linia TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_ter_protokol_linia TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.kr_ter_protokol_linia_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.kr_ter_protokol_linia_id_seq TO authenticated;

-- Widoki
GRANT SELECT ON public.v_kr_ter_podsumowanie TO anon;
GRANT SELECT ON public.v_kr_ter_podsumowanie TO authenticated;
GRANT SELECT ON public.v_kr_ter_pozycja_pozostalo TO anon;
GRANT SELECT ON public.v_kr_ter_pozycja_pozostalo TO authenticated;
