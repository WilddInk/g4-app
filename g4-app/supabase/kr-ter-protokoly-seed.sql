-- =============================================================================
-- Seed SZABLON TER (mechanizm) — NIE jest historią protokołów produkcyjnych
-- Źródło: TABELA ELEMENTÓW ROZLICZENIOWYCH.xlsx (arkusze KR + KON)
-- Protokoły: puste (rejestr wypełniany progresywnie w aplikacji)
-- Uruchom PO: kr-ter-protokoly.sql
-- Idempotentnie: upsert po kr / (rozliczenie_id, lp)
-- =============================================================================

-- Uwaga: dane oznaczone zrodlo='szablon_excel' — przykładowy katalog TER + suma z arkusza.

INSERT INTO public.kr_ter_rozliczenie (kr, nazwa_kontraktu, klient, nr_umowy, suma_kontraktu, zrodlo)
VALUES ('1031', 'Zaprojektowanie i wykonanie drogi S1 Kosztowy - Bielsko-Biała, Odcinek I/B węzeł „Kosztowy II” (z węzłem) – węzeł „Bieruń” (bez węzła)', 'TRAKT', 'nr 914_04', 1017199.36, 'szablon_excel')
ON CONFLICT (kr) DO UPDATE SET
  nazwa_kontraktu = COALESCE(NULLIF(EXCLUDED.nazwa_kontraktu, ''), public.kr_ter_rozliczenie.nazwa_kontraktu),
  klient = COALESCE(NULLIF(EXCLUDED.klient, ''), public.kr_ter_rozliczenie.klient),
  nr_umowy = COALESCE(NULLIF(EXCLUDED.nr_umowy, ''), public.kr_ter_rozliczenie.nr_umowy),
  -- suma_kontraktu: ustaw tylko gdy dotychczas 0 (nie nadpisuj ręcznej edycji)
  suma_kontraktu = CASE
    WHEN public.kr_ter_rozliczenie.suma_kontraktu = 0 THEN EXCLUDED.suma_kontraktu
    ELSE public.kr_ter_rozliczenie.suma_kontraktu
  END,
  updated_at = now();

INSERT INTO public.kr_ter_rozliczenie (kr, nazwa_kontraktu, klient, nr_umowy, suma_kontraktu, zrodlo)
VALUES ('1044', '„Zaprojektowanie i budowa drogi ekspresowej, drogi S19 od węzeł Dukla (bez węzła) - Barwinek (granica państwa) długości około 18,2 km na odcinku od km 78+289 do km -96+467.”', 'TRAKT', '943_01 (wersja 16. z dnia 24.11.2022 r.)', 1881958.0, 'szablon_excel')
ON CONFLICT (kr) DO UPDATE SET
  nazwa_kontraktu = COALESCE(NULLIF(EXCLUDED.nazwa_kontraktu, ''), public.kr_ter_rozliczenie.nazwa_kontraktu),
  klient = COALESCE(NULLIF(EXCLUDED.klient, ''), public.kr_ter_rozliczenie.klient),
  nr_umowy = COALESCE(NULLIF(EXCLUDED.nr_umowy, ''), public.kr_ter_rozliczenie.nr_umowy),
  -- suma_kontraktu: ustaw tylko gdy dotychczas 0 (nie nadpisuj ręcznej edycji)
  suma_kontraktu = CASE
    WHEN public.kr_ter_rozliczenie.suma_kontraktu = 0 THEN EXCLUDED.suma_kontraktu
    ELSE public.kr_ter_rozliczenie.suma_kontraktu
  END,
  updated_at = now();

INSERT INTO public.kr_ter_rozliczenie (kr, nazwa_kontraktu, klient, nr_umowy, suma_kontraktu, zrodlo)
VALUES ('1071', '„Zaprojektowanie i budowa drogi ekspresowej S11 Kępno – A1 na odcinku Kępno - granica woj. opolskiego (z wyłączeniem obwodnicy Olesna), odc. II, Siemianice - Gotartów"', 'TRAKT', '', 1041700.0, 'szablon_excel')
ON CONFLICT (kr) DO UPDATE SET
  nazwa_kontraktu = COALESCE(NULLIF(EXCLUDED.nazwa_kontraktu, ''), public.kr_ter_rozliczenie.nazwa_kontraktu),
  klient = COALESCE(NULLIF(EXCLUDED.klient, ''), public.kr_ter_rozliczenie.klient),
  nr_umowy = COALESCE(NULLIF(EXCLUDED.nr_umowy, ''), public.kr_ter_rozliczenie.nr_umowy),
  -- suma_kontraktu: ustaw tylko gdy dotychczas 0 (nie nadpisuj ręcznej edycji)
  suma_kontraktu = CASE
    WHEN public.kr_ter_rozliczenie.suma_kontraktu = 0 THEN EXCLUDED.suma_kontraktu
    ELSE public.kr_ter_rozliczenie.suma_kontraktu
  END,
  updated_at = now();

INSERT INTO public.kr_ter_rozliczenie (kr, nazwa_kontraktu, klient, nr_umowy, suma_kontraktu, zrodlo)
VALUES ('1038', 'Budowa drogi S6 – Zachodnia Obwodnica Szczecina odcinek 3  Police – Goleniów od km 27+400,00 do km 50+810,20', 'VOESSING', 'UMOWA NR 6429/04/02/2023', 1491475.0, 'szablon_excel')
ON CONFLICT (kr) DO UPDATE SET
  nazwa_kontraktu = COALESCE(NULLIF(EXCLUDED.nazwa_kontraktu, ''), public.kr_ter_rozliczenie.nazwa_kontraktu),
  klient = COALESCE(NULLIF(EXCLUDED.klient, ''), public.kr_ter_rozliczenie.klient),
  nr_umowy = COALESCE(NULLIF(EXCLUDED.nr_umowy, ''), public.kr_ter_rozliczenie.nr_umowy),
  -- suma_kontraktu: ustaw tylko gdy dotychczas 0 (nie nadpisuj ręcznej edycji)
  suma_kontraktu = CASE
    WHEN public.kr_ter_rozliczenie.suma_kontraktu = 0 THEN EXCLUDED.suma_kontraktu
    ELSE public.kr_ter_rozliczenie.suma_kontraktu
  END,
  updated_at = now();

INSERT INTO public.kr_ter_rozliczenie (kr, nazwa_kontraktu, klient, nr_umowy, suma_kontraktu, zrodlo)
VALUES ('1061', 'Rozbudowa drogi wojewódzkiej nr 793 na terenie gmin Siewierz, Myszków, Żarki oraz Janów - dokumentacja projektowa wraz z nadzorem autorskim', 'SAFEGE', '', 1484700.0, 'szablon_excel')
ON CONFLICT (kr) DO UPDATE SET
  nazwa_kontraktu = COALESCE(NULLIF(EXCLUDED.nazwa_kontraktu, ''), public.kr_ter_rozliczenie.nazwa_kontraktu),
  klient = COALESCE(NULLIF(EXCLUDED.klient, ''), public.kr_ter_rozliczenie.klient),
  nr_umowy = COALESCE(NULLIF(EXCLUDED.nr_umowy, ''), public.kr_ter_rozliczenie.nr_umowy),
  -- suma_kontraktu: ustaw tylko gdy dotychczas 0 (nie nadpisuj ręcznej edycji)
  suma_kontraktu = CASE
    WHEN public.kr_ter_rozliczenie.suma_kontraktu = 0 THEN EXCLUDED.suma_kontraktu
    ELSE public.kr_ter_rozliczenie.suma_kontraktu
  END,
  updated_at = now();

INSERT INTO public.kr_ter_rozliczenie (kr, nazwa_kontraktu, klient, nr_umowy, suma_kontraktu, zrodlo)
VALUES ('1070', 'Budowa drogi S10 Szczecin – Piła na odcinku koniec obwodnicy Stargardu – początek obwodnicy Piły (z węzłem „Koszyce”) z wyłączeniem obwodnicy miejscowości Wałcz, odcinek 5, węzeł „Cybowo” (z węzłem) – węzeł Łowicz Wałecki (bez węzła)', 'ARCADIS', '', 778000.0, 'szablon_excel')
ON CONFLICT (kr) DO UPDATE SET
  nazwa_kontraktu = COALESCE(NULLIF(EXCLUDED.nazwa_kontraktu, ''), public.kr_ter_rozliczenie.nazwa_kontraktu),
  klient = COALESCE(NULLIF(EXCLUDED.klient, ''), public.kr_ter_rozliczenie.klient),
  nr_umowy = COALESCE(NULLIF(EXCLUDED.nr_umowy, ''), public.kr_ter_rozliczenie.nr_umowy),
  -- suma_kontraktu: ustaw tylko gdy dotychczas 0 (nie nadpisuj ręcznej edycji)
  suma_kontraktu = CASE
    WHEN public.kr_ter_rozliczenie.suma_kontraktu = 0 THEN EXCLUDED.suma_kontraktu
    ELSE public.kr_ter_rozliczenie.suma_kontraktu
  END,
  updated_at = now();

INSERT INTO public.kr_ter_rozliczenie (kr, nazwa_kontraktu, klient, nr_umowy, suma_kontraktu, zrodlo)
VALUES ('1074', 'Obwodnica Łącka - zaprojektowanie i wykonanie robót budowlanych', 'AUTOSTRADAII', 'nr 01/0147/2025', 135000.0, 'szablon_excel')
ON CONFLICT (kr) DO UPDATE SET
  nazwa_kontraktu = COALESCE(NULLIF(EXCLUDED.nazwa_kontraktu, ''), public.kr_ter_rozliczenie.nazwa_kontraktu),
  klient = COALESCE(NULLIF(EXCLUDED.klient, ''), public.kr_ter_rozliczenie.klient),
  nr_umowy = COALESCE(NULLIF(EXCLUDED.nr_umowy, ''), public.kr_ter_rozliczenie.nr_umowy),
  -- suma_kontraktu: ustaw tylko gdy dotychczas 0 (nie nadpisuj ręcznej edycji)
  suma_kontraktu = CASE
    WHEN public.kr_ter_rozliczenie.suma_kontraktu = 0 THEN EXCLUDED.suma_kontraktu
    ELSE public.kr_ter_rozliczenie.suma_kontraktu
  END,
  updated_at = now();

INSERT INTO public.kr_ter_rozliczenie (kr, nazwa_kontraktu, klient, nr_umowy, suma_kontraktu, zrodlo)
VALUES ('1075', 'Opracowanie dokumentacji projektowej wraz z nadzorem autorskim w ramach projektu pn. „Prace na liniach kolejowych nr 4, 64 i 570 na odcinkach Psary – podg. Starzyny – Kozłów”Opracowanie dokumentacji projektowej wraz z nadzorem autorskim w ramach projektu pn. „Prace na liniach kolejowych nr 4, 64 i 570 na odcinkach Psary – podg. Starzyny – Kozłów”', 'DATABOUT', 'Temat nr: 10669 05/10669/25 z dnia 2025-04-23', 1014150.0, 'szablon_excel')
ON CONFLICT (kr) DO UPDATE SET
  nazwa_kontraktu = COALESCE(NULLIF(EXCLUDED.nazwa_kontraktu, ''), public.kr_ter_rozliczenie.nazwa_kontraktu),
  klient = COALESCE(NULLIF(EXCLUDED.klient, ''), public.kr_ter_rozliczenie.klient),
  nr_umowy = COALESCE(NULLIF(EXCLUDED.nr_umowy, ''), public.kr_ter_rozliczenie.nr_umowy),
  -- suma_kontraktu: ustaw tylko gdy dotychczas 0 (nie nadpisuj ręcznej edycji)
  suma_kontraktu = CASE
    WHEN public.kr_ter_rozliczenie.suma_kontraktu = 0 THEN EXCLUDED.suma_kontraktu
    ELSE public.kr_ter_rozliczenie.suma_kontraktu
  END,
  updated_at = now();

-- Pozycje TER KR 1031 (6 szt.)
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1031', '1', 'Mapa dla celów projektowych, numeryczny model terenu (NMT) oraz dokumentacją dla zamawiającego według SIWZ, SP 30.10.00, DP07.', 'hektar', 419.784, 790.0, 331629.36, 1
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1031'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1031', '2', 'Dokumentacja geodezyjna i formalno prawna związana z nabywaniem nieruchomości wraz z dokumentacją dla zamawiającego według SIWZ SP 30.20.00 z wyłączeniem prac i dokumentów z punktu 4.5.3.7 ppkt1-4 i 6 .', 'działka dzielona', 528.0, 810.0, 427680.0, 2
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1031'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1031', '3', 'Dokumentacja geodezyjna i formalno prawna związana z nabywaniem nieruchomości wraz z dokumentacją dla zamawiającego według SIWZ SP 30.20.00 z wyłączeniem prac i dokumentów z punktu 4.5.3.7 ppkt1-4 i 6 .', 'działka w całości', 106.0, 550.0, 58300.0, 3
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1031'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1031', '4', 'Opisu stanu prawnego nieruchomości nabywanych pod budowę drogi oraz nieruchomości przeznaczone do ograniczenia w korzystaniu według pkt. 4.5.3.6. SP 30.20.00 oraz PFU pkt. 1.2.3.2', 'działka', 969.0, 170.0, 164730.0, 4
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1031'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1031', '5', 'Wykonanie stabilizacji pasa drogowego wraz z dokumentacją dla zamawiającego według SP 30.30.00 (bez słupków PD)', 'działka', 634.0, NULL, 0.0, 5
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1031'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1031', '6', 'Dodatkowe projekty podziałów nieruchomości 41 działek dzielonych i 3 w całości.', 'ryczałt', 1.0, 34860.0, 34860.0, 6
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1031'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();

-- Pozycje TER KR 1044 (17 szt.)
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '1', 'Mapa dla celów projektowych, numeryczny model terenu (NMT) oraz dokumentacją dla zamawiającego – zgodnie z SIWZ, SP 30.10.00, DP07.', 'hektar', 417.91, 700.0, 292537.0, 1
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '2', 'Dokumentacja geodezyjno - kartograficzną i formalno - prawną związana z nabywaniem nieruchomości oraz materiałami dla zamawiającego według SIWZ SP 30.20.00 z wyłączeniem prac i dokumentów z punktu 4.5.3.7 ppkt1-4 i 6.', 'działka dzielona', 635.0, 800.0, 508000.0, 2
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '3', 'Dokumentacja geodezyjno - kartograficzną i formalno - prawną związana z nabywaniem nieruchomości oraz materiałami dla zamawiającego według SIWZ SP 30.20.00 z wyłączeniem prac i dokumentów z punktu 4.5.3.7 ppkt1-4 i 6.', 'działka w całości', 122.0, 550.0, 67100.0, 3
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '4', 'Opisu stanu prawnego nieruchomości nabywanych pod budowę drogi oraz nieruchomości przeznaczone do ograniczenia w korzystaniu ze wskazaniem podstawy prawnej ograniczenia według SP 30.20.00 pkt. 4.5.3.6. oraz PFU pkt. 1.2.3.2', 'działka', 755.0, 250.0, 188750.0, 4
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '5', 'Wykonanie stabilizacji pasa drogowego wraz z dokumentacją dla zamawiającego według SP 30.30.00 (bez słupków PD)', 'działka', 634.0, 450.0, 285300.0, 5
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '6', 'Wykonanie mapy do celów projektowych, numerycznego modeltu terenu oraz dokumentacji dla zamawiającego dla poszerzeń', 'hektar', 39.16, 700.0, 27412.0, 6
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '7', 'Wykonanie mapy do celów projektowych, numerycznego modeltu terenu oraz dokumentacji dla zamawiającego dla poszerzeń', 'ryczałt', 1.0, 15000.0, 15000.0, 7
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '8', 'Wykonanie ponownej dokumentacja geodezyjno - kartograficzną i formalno - prawną związana z nabywaniem nieruchomości oraz materiałami dla zamawiającego.', 'działka dzielona', 415.0, 440.0, 182600.0, 8
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '9', 'Wykonanie ponownej dokumentacja geodezyjno - kartograficzną i formalno - prawną związana z nabywaniem nieruchomości oraz materiałami dla zamawiającego.', 'działka w całości', 117.0, 302.0, 35334.0, 9
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '10', 'Wykonanie nowych projektów podziału w związku ze zmianą linii rozgraniczającej zewnętrznej', 'działka w całości', 12.0, 800.0, 9600.0, 10
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '11', 'Wykonanie nowej mapy prawnej dla działki w całości w związku ze zmianą linii rozgraniczającej zewnętrznej', 'działka w całości', 1.0, 550.0, 550.0, 11
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '12', 'Inne opracowania', 'ryczałt', 1.0, 50000.0, 50000.0, 12
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '13', 'Zmian podziałów w związku ze zmianą linii', 'działka dzielona', 4.0, 800.0, 3200.0, 13
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '14', 'Zmian podziałów w związku ze zmianą linii', 'działka w całości', 334.0, 400.0, 133600.0, 14
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '15', 'Zmian podziałów w związku ze zmianą linii', 'działka dzielona', 1.0, 550.0, 550.0, 15
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '16', 'Zmian podziałów w związku ze zmianą linii', 'działka dzielona', 27.0, 275.0, 7425.0, 16
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1044', '17', 'Poszerzenia mapy (ustalono 18 marca 2025 r.)', 'ryczałt', 1.0, 75000.0, 75000.0, 17
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1044'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();

-- Pozycje TER KR 1071 (5 szt.)
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1071', '1', 'Mapa dla celów projektowych (MDCP), numeryczny model terenu (NMT) ortofotomapa w zakresie MDCP oraz czynności i opracowania dla zamawiającego przewidziane DP07, SIWZ, SP.30.10.00', 'hektar', 534.0, 600.0, 320400.0, 1
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1071'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1071', '2', 'Dokumentacja geodezyjna i formalno-prawna związana z nabywaniem nieruchomości oraz czynności i opracowania dla zamawiającego przewidziane DP07, SIWZ, SP 30.20.00 z wyłączeniem pkt. 4.5.3.7 ppkt.1-4 oraz 6.', 'działka dzielona', 576.0, 700.0, 403200.0, 2
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1071'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1071', '3', 'Dokumentacja geodezyjna i formalno-prawna związana z nabywaniem nieruchomości oraz czynności i opracowania dla zamawiającego przewidziane DP07, SIWZ, SP 30.20.00 z wyłączeniem pkt. 4.5.3.7 ppkt.1-4 oraz 6.', 'działka w całości', 29.0, 500.0, 14500.0, 3
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1071'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1071', '4', 'Opisu stanu prawnego nieruchomości nabywanych pod budowę drogi oraz nieruchomości przeznaczone do ograniczenia w korzystaniu ze wskazaniem podstawy prawnej ograniczenia według SIWZ, SP 30.20.00 oraz PFU', 'działka', 600.0, 150.0, 90000.0, 4
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1071'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1071', '5', 'Wykonanie stabilizacji pasa drogowego oraz czynności i opracowania dla zamawiającego przewidziane według SIWZ, SP 30.20.00, SP 30.30.00.', 'działka', 534.0, 400.0, 213600.0, 5
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1071'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();

-- Pozycje TER KR 1038 (11 szt.)
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1038', '1', 'Projekt podziału nieruchomości lub dokumentacja dla działek przejmowanych w całości', 'działka', 350.0, 900.0, 315000.0, 1
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1038'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1038', '2', 'Mapa do celów projektowych', 'hektar', 900.0, 714.0, 642600.0, 2
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1038'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1038', '3', 'Wykonanie skaningu lotniczego wraz z ortofotomapą oraz  sporządzenie NM', 'ryczałt', 1.0, 50000.0, 50000.0, 3
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1038'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1038', '4', 'Wykonanie inwentaryzacji dendrologicznej', 'ryczałt', 1.0, 26750.0, 26750.0, 4
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1038'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1038', '5', 'Pomiary batymetryczne', 'ryczałt', 1.0, 32000.0, 32000.0, 5
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1038'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1038', '6', 'Stabilizacja granic w terenie wraz z dokumentacją (granicznik, podcentr i PD)', 'punkt', 600.0, 275.0, 165000.0, 6
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1038'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1038', '7', 'Opisy  stanu  nieruchomości  nabywanych  pod  budowę  drogi oraz nieruchomości  przeznaczone  do  ograniczenia  w  korzystaniu ze wskazaniem podstawy prawnej ograniczenia', 'działka', 495.0, 275.0, 136125.0, 7
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1038'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1038', '8', 'Sporządzenie wniosków do sądów wieczysto-księgowych o ujawnienie w księgach wieczystych podziału oraz prawa własności', 'działka', 350.0, 95.0, 33250.0, 8
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1038'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1038', '9', 'Ujawnienie w księgach wieczystych podziału oraz prawa własności', 'działka', 350.0, 95.0, 33250.0, 9
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1038'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1038', '10', 'Wykonanie dokumentacji geodezyjnej i kartograficznej dotyczącej czasowego korzystania z nieruchomości', 'działka', 150.0, 250.0, 37500.0, 10
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1038'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1038', '11', 'Tymczasowe wyznaczenie projektowanych granic pasa drogowego (w razie konieczności)', 'ryczałt', 1.0, 20000.0, 20000.0, 11
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1038'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();

-- Pozycje TER KR 1061 (4 szt.)
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1061', '1', 'Mapa do celów projektowych wraz z pomiarem wysokościowym', 'ha', 264.0, 1150.0, 303600.0, 1
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1061'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1061', '2', 'Mapy zawierające projekty podziału nieruchomości', 'działka', 800.0, 980.0, 784000.0, 2
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1061'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1061', '3', 'Wyznczenie na gruncie linii rozgraniczających teren inwestycji', 'punkt', 520.0, 80.0, 41600.0, 3
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1061'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1061', '4', 'Inwentaryzacja stanu nieruchomości', 'opis', 900.0, 395.0, 355500.0, 4
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1061'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();

-- Pozycje TER KR 1070 (6 szt.)
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1070', '1', 'Etap I - Mapa do celów projektowych § 1 ust.2 d) SP. 30.10.00', 'ryczałt', 1.0, 274500.0, 274500.0, 1
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1070'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1070', '2', 'Etap II - Dokumentację geodezyjno-kartograficzną związaną z nabywaniem nieruchomości i z czasowym korzystaniem z nieruchomości § 1 ust. 2 a) b) (m.in. Zakres SP.30.20.00 pkt 4.5.3.3, 4.5.3.4., 4.5.3.5)', 'ryczałt', 1.0, 255300.0, 255300.0, 2
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1070'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1070', '3', 'Etap III - Prace geodezyjne po wydaniu decyzji PnB/ZRID (opisy stanu nieruchomości) § 1 ust. 2 a) (m.in. zakres SP.30.20.00 pkt 4.5.3.6.)', 'ryczałt', 1.0, 78000.0, 78000.0, 3
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1070'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1070', '4', 'Etap IV - Wykonania wszystkich niezbędnych czynności w związku z wpisem do katastru nieruchomości i ksiąg wieczystych praw do nieruchomości w liniach rozgraniczających oraz ujawnienia wszystkich ograniczeń w korzystaniu z nieruchomości podlegających ujawnieniu § 1 ust.2 c) SP.30.20.00', 'ryczałt', 1.0, 13000.0, 13000.0, 4
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1070'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1070', '5', 'Pozostałe materiały, które należy wykonać i przekazać Zamawiającemu zgodnie z § 1 ust.2 e) m.in. zakres SP.30.20.00 4.5.3.7.', 'ryczałt', 1.0, 29200.0, 29200.0, 5
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1070'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1070', '6', 'Stabilizacja pasa drogowego § 1 ust.1 f) SP.30.20.00, SP.30.30.00', 'ryczałt', 1.0, 128000.0, 128000.0, 6
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1070'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();

-- Pozycje TER KR 1074 (2 szt.)
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1074', '1', 'Mapa do celów projektowych (miejska) wraz z NMT*', 'ryczałt', 1.0, 40000.0, 40000.0, 1
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1074'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1074', '2', 'Projekty podziału nieruchomości wraz z dokumentacją dla działek przejmowanych w całości', 'ryczałt', 1.0, 95000.0, 95000.0, 2
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1074'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();

-- Pozycje TER KR 1075 (8 szt.)
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1075', '1a', 'Wykonanie mapy do celów projektowych dla terenów kolejowych zamkniętych (w wersji numerycznej) wraz z NMT - linia kolejowa', '1 km', 41.5, 12000.0, 498000.0, 1
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1075'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1075', '1b', 'Wykonanie mapy do celów projektowych dla terenów kolejowych zamkniętych (w wersji numerycznej) wraz z NMT - stacja kolejowa', '1 km', 7.5, 15500.0, 116250.0, 2
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1075'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1075', '2', 'Wykonanie mapy do celów projektowych dla terenów "cywilnych" (w wersji numerycznej) wraz z NMT', 'ha', 1.0, 950.0, 950.0, 3
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1075'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1075', '3a', 'Sprawdzenie dokładności i stanu pionowej i poziomej osnowy pomiarowej', 'ryczałt', 1.0, 25000.0, 25000.0, 4
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1075'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1075', '3b', 'Założenie dodatkowej osnowy geodezyjnej o dokładności określonej w branżowym standardzie.', 'ryczałt', 1.0, 1200.0, 1200.0, 5
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1075'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1075', '4', 'Pozyskanie wywiadów branżowych dla terenów kolejowych oraz ich naniesienie na mapy.', 'km', 49.0, 6000.0, 294000.0, 6
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1075'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1075', '5', 'Sprawdzenie zgodności granic działek ewidencyjnych stanowiących kolejowy teren zamknięty ze stanem faktycznym tj. - pozyskanie danych dotyczących numerów i przebiegu granic działek ewidencyjnych obszaru kolejowego z PODGiK oraz z KODGiK PKP S.A. i dokonanie analizy porównawczej tych granic,', 'ryczałt', 1.0, 45000.0, 45000.0, 7
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1075'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();
INSERT INTO public.kr_ter_pozycja (rozliczenie_id, kr, lp, opis, jm, ilosc_umowna, cena, wartosc, kolejnosc)
SELECT r.id, '1075', '6', 'Przeprowadzenie szczegółowego postępowania doprowadzającego do zgodności danych ewidencyjnych w porozumieniu i wg procedur określonych w KODGiK, W przypadku stwierdzenia rozbieżności danych', 'działka', 50.0, 675.0, 33750.0, 8
FROM public.kr_ter_rozliczenie r WHERE r.kr = '1075'
ON CONFLICT (rozliczenie_id, lp) DO UPDATE SET
  opis = EXCLUDED.opis,
  jm = EXCLUDED.jm,
  ilosc_umowna = EXCLUDED.ilosc_umowna,
  cena = EXCLUDED.cena,
  wartosc = EXCLUDED.wartosc,
  kolejnosc = EXCLUDED.kolejnosc,
  updated_at = now();

-- Protokoły: celowo BRAK seedu (Excel arkusz Protokoły nie jest źródłem prawdy).

