-- Tylko tabela pracownik — wklej w Supabase SQL Editor → Run
-- Jeśli w Table Editor są wiersze, a w aplikacji (przycisk ID) lista pusta: brak SELECT dla roli anon.

ALTER TABLE public.pracownik ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pracownik" ON public.pracownik;

CREATE POLICY "anon_select_pracownik"
  ON public.pracownik
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "anon_insert_pracownik" ON public.pracownik;

CREATE POLICY "anon_insert_pracownik"
  ON public.pracownik
  FOR INSERT
  TO anon
  WITH CHECK (true);
