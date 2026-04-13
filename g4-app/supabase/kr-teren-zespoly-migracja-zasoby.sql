-- Migracja ze starego modelu (KR na zespole, zadanie → zespol_id) na:
--   zespół = tylko nazwa + skład; zadanie = kr + dzień + opis + pracownik.
-- Uruchom w Supabase po wcześniejszym wdrożeniu starego kr-teren-zespoly.sql.
-- Bezpieczne gdy tabele są już w nowym kształcie (sprawdza kolumny).

-- 1) Kolumna kr na zadaniu
ALTER TABLE public.kr_teren_zadanie ADD COLUMN IF NOT EXISTS kr text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kr_teren_zadanie' AND column_name = 'zespol_id'
  ) THEN
    UPDATE public.kr_teren_zadanie z
    SET kr = e.kr
    FROM public.kr_teren_zespol e
    WHERE z.zespol_id = e.id
      AND (z.kr IS NULL OR btrim(z.kr) = '');
  END IF;
END $$;

UPDATE public.kr_teren_zadanie
SET kr = 'MIGRACJA_UZUPELNIJ_KR'
WHERE kr IS NULL OR btrim(kr) = '';

ALTER TABLE public.kr_teren_zadanie ALTER COLUMN kr SET NOT NULL;

-- 2) Usuń powiązanie zadania z zespołem
ALTER TABLE public.kr_teren_zadanie DROP CONSTRAINT IF EXISTS kr_teren_zadanie_zespol_id_fkey;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kr_teren_zadanie' AND column_name = 'zespol_id'
  ) THEN
    ALTER TABLE public.kr_teren_zadanie DROP COLUMN zespol_id;
  END IF;
END $$;

DROP INDEX IF EXISTS kr_teren_zadanie_zespol_data_idx;

CREATE INDEX IF NOT EXISTS kr_teren_zadanie_kr_data_idx ON public.kr_teren_zadanie (kr, data_dnia);
CREATE INDEX IF NOT EXISTS kr_teren_zadanie_prac_data_idx ON public.kr_teren_zadanie (pracownik_nr, data_dnia);

COMMENT ON COLUMN public.kr_teren_zadanie.kr IS 'Projekt (kod KR), na który przypada ta praca w tym dniu';

-- 3) Zespół bez kolumny kr
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'kr_teren_zespol' AND column_name = 'kr'
  ) THEN
    ALTER TABLE public.kr_teren_zespol DROP COLUMN kr;
  END IF;
END $$;

DROP INDEX IF EXISTS kr_teren_zespol_kr_idx;

COMMENT ON TABLE public.kr_teren_zespol IS 'Opcjonalna nazwana grupa pracowników (zasób) — bez stałego KR; przydziały są w kr_teren_zadanie';
