-- 1) Pozwól aplikacji zmieniać wpisy
-- 2) Przepisanie dzisiejszych wpisów Moniki na notatki ze spotkania kierowników
-- Supabase → SQL Editor → Run

ALTER TABLE public.kr_notatka ADD COLUMN IF NOT EXISTS updated_at timestamptz;

DROP POLICY IF EXISTS "anon_update_kr_notatka" ON public.kr_notatka;
DROP POLICY IF EXISTS "auth_update_kr_notatka" ON public.kr_notatka;

CREATE POLICY "anon_update_kr_notatka"
  ON public.kr_notatka FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "auth_update_kr_notatka"
  ON public.kr_notatka FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.kr_notatka TO anon, authenticated;

UPDATE public.kr_notatka
SET
  autor = 'Notatka ze spotkania kierowników',
  autor_email = NULL
WHERE created_at >= TIMESTAMPTZ '2026-09-02 00:00:00+02'
  AND created_at <  TIMESTAMPTZ '2026-09-03 00:00:00+02'
  AND COALESCE(autor, '') NOT IN (
    'Notatka ze spotkania',
    'Notatka ze spotkania kierowników',
    'Spotkanie kierowników'
  )
  AND tresc NOT ILIKE 'Początek spotkania kierowników%'
  AND tresc NOT ILIKE 'Koniec spotkania kierowników%'
  AND (
    autor ILIKE '%monika%jakubowska%'
    OR autor ILIKE '%jakubowska%'
    OR autor_email ILIKE '%monika%'
  );
