-- Seed: lista planowanych FS (prezes) — lipiec–2027
-- Uruchom PO kr-plan-faktury.sql
-- Bezpieczne: nie duplikuje, jeśli ten sam kr+opis+horyzont już jest.

INSERT INTO public.kr_plan_faktury (
  kr, klient, opis, horyzont, kwota_netto, bloker, odpowiedzialny, uwagi, mozna_fakturowac, status, numer_fs_planowany, zrodlo
)
SELECT v.kr, v.klient, v.opis, v.horyzont, v.kwota_netto, v.bloker, v.odpowiedzialny, v.uwagi,
       false, 'plan', v.numer_fs_planowany, 'lista_prezes'
FROM (
  VALUES
  -- LIPIEC 2026
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

  -- SIERPIEŃ 2026
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

  -- WRZESIEŃ 2026
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

  -- KONIEC ROKU 2026
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

  -- 2027
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
