-- Zgłoszenia faktur kosztowych do opłacenia (pracownik → księgowość), powiązane z kodem KR.
--
-- Wklej CAŁY plik w Supabase → SQL Editor → Run (jedna operacja: tabela + RLS dla anon).
-- Błąd „relation kr_faktura_do_zaplaty does not exist” = uruchomiłeś tylko fragment z rls-policies-anon.sql
-- zamiast najpierw tego pliku.
--
-- Po wklejeniu tego pliku: jeśli używasz logowania (rola authenticated), uruchom jeszcze końcówkę
-- rls-policies-authenticated.sql dla kr_faktura_do_zaplaty (lub cały plik authenticated).

CREATE TABLE IF NOT EXISTS public.kr_faktura_do_zaplaty (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kr text,
  sprzedawca_nip text,
  sprzedawca_nazwa text,
  komu text NOT NULL,
  nr_konta text,
  kwota_brutto numeric(14, 2) NOT NULL,
  link_faktury text,
  numer_faktury text,
  zgloszil_pracownik_nr text,
  status text NOT NULL DEFAULT 'do_zaplaty',
  notatki text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kr_faktura_do_zaplaty_status_check CHECK (
    status = ANY (ARRAY['do_zaplaty'::text, 'oplacone'::text, 'anulowane'::text])
  )
);

CREATE INDEX IF NOT EXISTS kr_faktura_do_zaplaty_kr_idx ON public.kr_faktura_do_zaplaty (kr);
CREATE INDEX IF NOT EXISTS kr_faktura_do_zaplaty_status_idx ON public.kr_faktura_do_zaplaty (status);

COMMENT ON TABLE public.kr_faktura_do_zaplaty IS 'Faktury kosztowe — zgłoszenie do opłacenia (komu, konto, brutto, link)';
COMMENT ON COLUMN public.kr_faktura_do_zaplaty.sprzedawca_nip IS 'NIP sprzedawcy (słownik po NIP).';
COMMENT ON COLUMN public.kr_faktura_do_zaplaty.sprzedawca_nazwa IS 'Nazwa sprzedawcy przypisana do NIP.';
COMMENT ON COLUMN public.kr_faktura_do_zaplaty.komu IS 'Odbiorca przelewu / kontrahent';
COMMENT ON COLUMN public.kr_faktura_do_zaplaty.nr_konta IS 'Numer konta bankowego';
COMMENT ON COLUMN public.kr_faktura_do_zaplaty.kwota_brutto IS 'Kwota brutto do zapłaty';
COMMENT ON COLUMN public.kr_faktura_do_zaplaty.link_faktury IS 'URL do pliku / wystawcy (opcjonalnie)';
COMMENT ON COLUMN public.kr_faktura_do_zaplaty.zgloszil_pracownik_nr IS 'Kto zgłosił — pracownik.nr';
COMMENT ON COLUMN public.kr_faktura_do_zaplaty.status IS 'do_zaplaty | oplacone | anulowane (księgowość)';

-- =============================================================================
-- RLS + GRANT dla klucza anon (aplikacja w przeglądarce) — ta sama kolejność co w rls-policies-anon.sql
-- =============================================================================
ALTER TABLE public.kr_faktura_do_zaplaty ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;
DROP POLICY IF EXISTS "anon_insert_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;
DROP POLICY IF EXISTS "anon_update_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;
DROP POLICY IF EXISTS "anon_delete_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;

CREATE POLICY "anon_select_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty FOR DELETE TO anon USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_faktura_do_zaplaty TO anon;
