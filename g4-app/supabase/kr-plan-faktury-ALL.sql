-- =============================================================================
-- WSZYSTKO W JEDNYM: tabela + uprawnienia + dane z listy prezesa
-- Supabase → SQL Editor → wklej CAŁY plik → Run
-- =============================================================================

-- 1) TABELA
CREATE TABLE IF NOT EXISTS public.kr_plan_faktury (
  id bigserial PRIMARY KEY,
  kr text,
  klient text,
  opis text NOT NULL DEFAULT '',
  horyzont text NOT NULL,
  kwota_netto numeric(14, 2),
  bloker text,
  odpowiedzialny text,
  uwagi text,
  mozna_fakturowac boolean NOT NULL DEFAULT false,
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
  'Planowane faktury sprzedażowe per KR — księgowość pilnuje, kierownik zaznacza można fakturować.';

-- 2) TRIGGER (składnia kompatybilna z Supabase)
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

-- 3) RLS
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

-- 4) DANE (lista prezesa) — bez duplikatów
INSERT INTO public.kr_plan_faktury (
  kr, klient, opis, horyzont, kwota_netto, bloker, odpowiedzialny, uwagi, mozna_fakturowac, status, numer_fs_planowany, zrodlo
)
SELECT v.kr, v.klient, v.opis, v.horyzont, v.kwota_netto, v.bloker, v.odpowiedzialny, v.uwagi,
       false, 'plan', v.numer_fs_planowany, 'lista_prezes'
FROM (
  VALUES
  (NULL::text, 'PROMOST CONSULTING',
   'Budowa obwodnicy Chełmca w ciągu DK28 — dokumentacja formalno-prawna po ZRID (waloryzacja)',
   '2026-07', NULL::numeric, 'waloryzacja', NULL::text,
   'Waloryzacja do ustalenia — faktura za waloryzację do ustalenia',
   '020-949-2026'),
  ('1005', 'ARCADIS',
   'Obsługa geodezyjna — budowa obwodnicy Opatowa w ciągu S74 i DK9',
   '2026-07', 32500.00, 'czeka_protokol', 'Damian',
   'Damian czeka na protokół', NULL),
  ('1073', 'PANGAZ',
   'Rozbudowa rurociągu Płock-Koluszki-Boronów — linia światłowodowa PSP.I.24.013',
   '2026-07', 300000.00, 'czeka_zielone', 'Damian',
   'Czekam na zielone światło i podam kwotę; Damian przygotuje protokół', NULL),
  ('1084', 'AUTOSTRADA II',
   'DK31 Kostrzyn n/Odrą — obsługa geodezyjna',
   '2026-07', 54000.00, 'czeka_klauzule', 'A. Homik',
   'Po klauzuli podziałów — pytanie do A. Homik; wyrobić do 15.07', NULL),
  ('1084', 'AUTOSTRADA II',
   'DK31 Kostrzyn n/Odrą — inwentaryzacja zieleni',
   '2026-07', 28500.00, 'czeka_klauzule', 'A. Homik',
   'Po klauzuli podziałów — pytanie do A. Homik; wyrobić do 15.07', NULL),
  ('1038', 'VOESSING',
   'S6 Zachodnia Obwodnica Szczecina cz.2 odc.3 Police–Goleniów',
   '2026-07', 570.00, 'czeka_protokol', 'Damian',
   'Czekamy na protokół — pytaj Damiana', NULL),
  ('1083', 'SYSTRA',
   '784 opisy',
   '2026-08', 137200.00, 'czeka_protokol', 'Damian',
   'Pytać Damiana o kwotę; czekamy na protokół', NULL),
  ('998', 'AUTOSTRADA II',
   'A2 Warszawa–Kukuryki odc. VIII Siedlce–Cicibór (~12,5 km)',
   '2026-08', 135000.00, 'czeka_klauzule', 'A. Homik',
   'A2 odc.8 — podział kompetencji; klauzule A. Homik (IX–X)', NULL),
  ('997', 'AUTOSTRADA II',
   'A2 Warszawa–Kukuryki odc. VII Siedlce–Cicibór / Łukowisko (~18 km)',
   '2026-08', 80000.00, 'czeka_klauzule', 'A. Homik',
   'A2 odc.7 — podział kompetencji; klauzule A. Homik (IX–X)', NULL),
  ('1081', 'AUTOSTRADA II',
   'Jasło — inwentaryzacja zieleni, przekroje przez rzekę, wywiady',
   '2026-08', 95000.00, 'brak', NULL,
   NULL, NULL),
  ('1073', 'PANGAZ',
   'PSP.I.24.013 — prace dodatkowe MDCP PKP',
   '2026-08', 5500.00, 'czeka_zielone', 'Damian',
   'Czekam na zielone światło; Damian przygotuje protokół', NULL),
  ('1073', 'PANGAZ',
   'PSP.I.24.013 — prace dodatkowe MDCP cywilne',
   '2026-08', 21000.00, 'czeka_zielone', 'Damian',
   'Czekam na zielone światło; Damian przygotuje protokół', NULL),
  ('956', 'TRAKT',
   'S11 odc.2 — korespondencja TRAKT–G4 (prace dodatkowe)',
   '2026-08', 4800.00, 'brak', NULL,
   'KR do potwierdzenia (956?)', NULL),
  ('1052', 'AUTOSTRADA II',
   'S12 — opisy nieruchomości',
   '2026-09', 150000.00, 'inne', 'Marcin C.',
   'Czekamy na wydruki Marcina C.', NULL),
  (NULL, 'VOESSING',
   'BDI S52',
   '2026-09', 318500.00, 'czeka_klauzule', 'G. Franczak',
   'Czekamy na klauzulę od G. Franczak; KR do uzupełnienia', NULL),
  ('1051', 'AUTOSTRADA II',
   'S10 Bydgoszcz',
   '2026-09', 40500.00, 'czeka_klauzule', NULL,
   'Czekamy na prawomocną decyzję ZRID', NULL),
  ('1081', 'AUTOSTRADA II',
   'Jasło — podziały, złożenie operatu do PODGiK 40%',
   '2026-09', 160000.00, 'ustalic_kwote', 'A. Homik',
   'Ustalić z Anią Homik', NULL),
  ('1073', 'PANGAZ',
   'PSP.I.24.013 — kontynuacja (pozostałość zakresu)',
   '2026-Q4', 300000.00, 'czeka_zielone', 'Damian',
   'Zielone światło; pozostało ~600 tys minus ostatnio wystawiona FS 2026', NULL),
  ('1075', 'DATABOUT',
   'Linie kolejowe 4/64/570 Psary–Starzyny–Kozłów — faktura końcowa zakres podstawowy',
   '2026-Q4', 147840.00, 'ustalic_kwote', NULL,
   'Końcowa: 660 tys minus już wystawione za zakres podstawowy; umowa 05/10669/2025', NULL),
  ('1075', 'DATABOUT',
   'Linie kolejowe 4/64/570 — faktura za prawo opcji',
   '2026-Q4', 539890.00, 'ustalic_kwote', NULL,
   'Prawo opcji szacunkowo ~500 tys', NULL),
  ('1081', 'AUTOSTRADA II',
   'Jasło — podziały, klauzula 40%',
   '2026-Q4', 160000.00, 'ustalic_kwote', 'A. Homik',
   'Ustalić z Anią Homik', NULL),
  ('1068', 'MP MOSTY',
   'DK79 (dc 2, 10 km) — dawniej KR 993',
   '2026-Q4', 275042.00, 'ustalic_kwote', 'A. Homik',
   '993 (1068) — ustalić z Anią Homik', NULL),
  ('1080', 'MP MOSTY',
   'S7 węzeł Opatkowice',
   '2026-Q4', 80000.00, 'ustalic_kwote', 'A. Homik',
   'Ustalić z Anią Homik', NULL),
  (NULL, 'GDDKiA o. Kraków',
   'Obsługa Tarnowa',
   '2026-Q4', 40000.00, 'ustalic_kwote', 'A. Homik',
   'Ustalić z Anią Homik; KR do uzupełnienia', NULL),
  ('1081', 'AUTOSTRADA II',
   'Jasło — opisy nieruchomości i wpisy do KW',
   '2027', 200000.00, 'brak', NULL, NULL, NULL),
  (NULL, 'PROMOST',
   'BDI (zakres do doprecyzowania)',
   '2027', NULL, 'brak', NULL, 'Kwota / KR do uzupełnienia', NULL),
  (NULL, 'VOESSING',
   'BDI (zakres do doprecyzowania)',
   '2027', NULL, 'brak', NULL, 'Kwota / KR do uzupełnienia', NULL)
) AS v(kr, klient, opis, horyzont, kwota_netto, bloker, odpowiedzialny, uwagi, numer_fs_planowany)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.kr_plan_faktury p
  WHERE p.horyzont = v.horyzont
    AND coalesce(p.kr, '') = coalesce(v.kr, '')
    AND p.opis = v.opis
);
