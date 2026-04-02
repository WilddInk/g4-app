-- =============================================================================
-- DEMO / SEED — sensowne dane testowe dla biura geodezyjnego (ZRID, drogi, mapy
-- sytuacyjno-wysokościowe, wytyczenia, MPZP, skaning). Supabase → SQL Editor.
--
-- WYMAGANIA: migracje (kr, kamienie-milowe-kolumny.sql, kamienie-milowe-status-check.sql,
--   dziennik, zadania+kr, PW, faktury kosztowe, samochody/sprzęt, RLS).
--   Etapy w seedzie NIE wymagają kamienie-milowe-odniesienie-offset.sql ani
--   kamienie-milowe-typ-odniesienia.sql (kotwice dat — opcjonalnie później).
--   Nie czyścimy całej bazy — wstawki warunkowe (bez duplikatów po kluczach roboczych).
--
-- Faktury sprzedażowe (tabela `faktury`): schemat bywa projektowy — sekcja na
--   końcu jest opakowana w DO … EXCEPTION; jeśli brakuje kolumn, reszta seedu
--   i tak się wykona.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Pracownicy (nr — jak w aplikacji)
-- ---------------------------------------------------------------------------
INSERT INTO public.pracownik (nr, imie_nazwisko, dzial, email, telefon)
SELECT * FROM (VALUES
  ('01', 'Anna Nowak', 'dział inżynieryjny', 'a.nowak@firma-geodezyjna.example', '+48 600 111 001'),
  ('02', 'Piotr Wiśniewski', 'dział inżynieryjny', 'p.wisniewski@firma-geodezyjna.example', '+48 600 111 002'),
  ('03', 'Marek Zieliński', 'dział inżynieryjny', 'm.zielinski@firma-geodezyjna.example', '+48 600 111 003'),
  ('04', 'Katarzyna Lewandowska', 'dział prawny', 'k.lewandowska@firma-geodezyjna.example', '+48 600 111 004'),
  ('05', 'Tomasz Kamiński', 'dział inżynieryjny', 't.kaminski@firma-geodezyjna.example', '+48 600 111 005'),
  ('06', 'Julia Wójcik', 'dział inżynieryjny', 'j.wojcik@firma-geodezyjna.example', '+48 600 111 006'),
  ('07', 'Bogusław Król', 'dział inżynieryjny', 'b.krol@firma-geodezyjna.example', '+48 600 111 007'),
  ('08', 'Krzysztof Dąbrowski', 'dział inżynieryjny', 'k.dabrowski@firma-geodezyjna.example', '+48 600 111 008')
) AS v(nr, imie_nazwisko, dzial, email, telefon)
WHERE NOT EXISTS (SELECT 1 FROM public.pracownik p WHERE p.nr = v.nr);

-- ---------------------------------------------------------------------------
-- Projekty KR (drogi / ZRID / miejskie / zamknięte)
INSERT INTO public.kr (kr, nazwa_obiektu, rodzaj_pracy, dzial, osoba_prowadzaca, data_rozpoczecia, status, zleceniodawca, osoba_odpowiedzialna_zleceniodawcy, link_umowy, okres_projektu_od, okres_projektu_do)
SELECT * FROM (VALUES
  (
    'ZRID-2025-DW1523',
    'ZRID — przebudowa DW1523G (odcinek 4,2 km) — mapa do proj. budowlanego',
    'ZRID / dokumentacja geodezyjna pod drogę',
    'dział inżynieryjny',
    '01',
    '2025-08-12'::date,
    'w trakcie',
    'Zarząd Dróg Powiatowych w Nowym Sączu',
    'mgr inż. Elżbieta Poręba',
    'bip.example.powiat.pl/umowy/2025-dw1523',
    '2025-08-01'::date,
    '2026-11-30'::date
  ),
  (
    'A2-2025-SSWN',
    'Przełożenie osnovy poziomej i kontrola pod przebudowę A2 (wiadukt km 312+600)',
    'Obsługa geodezyjna inwestycji drogowej',
    'dział inżynieryjny',
    '02',
    '2025-03-01'::date,
    'w trakcie',
    'GDDKiA O/Kraków',
    'inż. Paweł Kostrzewa',
    'https://example-gddkia.pl/zlecenia/a2-2025-sswn',
    '2025-03-01'::date,
    '2026-12-15'::date
  ),
  (
    'WD-HALA-2025',
    'Wytyczenie pod halę magazynową + inwentaryczna map. z usł. pod WZ',
    'Wytyczenie / inwentaryzacja',
    'dział inżynieryjny',
    '05',
    '2025-10-01'::date,
    'oczekuje na zamawiającego',
    'Spółka Logistyczna „Transsafe” Sp. z o.o.',
    'Robert Mazur — kierownik budowy',
    NULL,
    '2025-10-01'::date,
    '2026-04-30'::date
  ),
  (
    'MPZP-TARN-2024',
    'Aktualizacja mapy do studium / MPZP — fragment dzielnicy Mościce',
    'Mapa sytuacyjno-wysokościowa do planu',
    'dział inżynieryjny',
    '03',
    '2024-02-15'::date,
    'zakończone',
    'Urząd Miasta Tarnowa',
    'Referat architektury — Anna Gil',
    'https://tarnow.example/geodezja/mpzp-moscice',
    '2024-02-01'::date,
    '2025-01-20'::date
  ),
  (
    'SKAN-MOB-2025',
    'Skanowanie mobilne ciągu ZRID + cloud compare z modelem BIM drogowym',
    'Skanowanie laserowe / MMS',
    'dział inżynieryjny',
    '08',
    '2025-11-05'::date,
    'w trakcie',
    'DROGPOL Projekt Sp. z o.o.',
    'BIM: Michał Żurawski',
    NULL,
    '2025-11-01'::date,
    '2026-06-30'::date
  ),
  (
    'PODZIAL-GDN-2025',
    'Podział nieruchomości — działki przy ul. Kartuskiej (4 właścicieli)',
    'Podziały / rozgraniczenia',
    'dział prawny',
    '04',
    '2025-09-20'::date,
    'w trakcie',
    'Kancelaria Notarialna w Gdańsku (inwestor zbiorowy)',
    'Notariusz Magdalena Sikora',
    NULL,
    '2025-09-15'::date,
    '2026-02-28'::date
  )
) AS v(kr, nazwa_obiektu, rodzaj_pracy, dzial, osoba_prowadzaca, data_rozpoczecia, status, zleceniodawca, osoba_odpowiedzialna_zleceniodawcy, link_umowy, okres_projektu_od, okres_projektu_do)
WHERE NOT EXISTS (SELECT 1 FROM public.kr k WHERE k.kr = v.kr);

-- ---------------------------------------------------------------------------
-- Kamienie milowe (etapy) — ZRID, drogi, ryzyka, terminy
-- Bez kolumn typ_odniesienia / data_odniesienia / offset_miesiecy — dodaje je
-- kamienie-milowe-odniesienie-offset.sql + kamienie-milowe-typ-odniesienia.sql.
-- Po ich uruchomieniu możesz w UI uzupełnić kotwice lub dodać UPDATE w osobnym skrypcie.
-- ---------------------------------------------------------------------------
INSERT INTO public.kamienie_milowe (
  kr, data_planowana, etap, status,
  osoba_odpowiedzialna, uwagi, osiagniete, zagrozenie, zagrozenie_opis
)
SELECT * FROM (VALUES
  ('ZRID-2025-DW1523'::text, '2025-10-15'::date, 'Wpływ pełnomocnictw i kompletów'::text, 'zrealizowane'::text, '01'::text, NULL::text, true, false, NULL::text),
  ('ZRID-2025-DW1523', '2025-12-01', 'Pomiar wyjściowy + uzgodnienie z branżą drogową', 'w trakcie', '02', 'Wykonawca drogi opóźnił przekazanie DWG osi.', false, true, 'Brak aktualnej dokumentacji środka ciągu — możliwe przesunięcie OTP.'),
  ('ZRID-2025-DW1523', '2026-02-01', 'Opracowanie ZRID (projekt zamienny) + MDCP', 'planowane', '01', NULL, false, false, NULL),
  ('ZRID-2025-DW1523', '2026-04-30', 'Uzgodnienie z zarządcą drogi + ZDP', 'oczekuje', '04', 'Czekamy na protokół z przeglądu branżowego.', false, false, NULL),
  ('A2-2025-SSWN', '2025-04-10', 'Wejście w teren + przyjęcie XYZ referencyjnych', 'zrealizowane', '05', NULL, true, false, NULL),
  ('A2-2025-SSWN', '2025-08-01', 'Stabilizacja osnowy + raport niezgodności z układem GI', 'w trakcie', '02', NULL, false, true, 'Różnica wModule z M-1. Możliwa korekta po warsztacie z inwestorem.'),
  ('A2-2025-SSWN', '2026-03-15', 'Przekazanie końcowej tabeli wsadów do BIM', 'planowane', '08', NULL, false, false, NULL),
  ('WD-HALA-2025', '2025-10-20', 'Odbiór geodezyjny wytyczonych osi A/B', 'anulowane', '05', 'Anulowane przez ZL — zmiana bramy wjazdowej.', false, false, NULL),
  ('WD-HALA-2025', '2025-12-01', 'Wytyczenie po zmianie projektu architektonicznego', 'w trakcie', '05', NULL, false, false, NULL),
  ('MPZP-TARN-2024', '2024-04-20', 'Pomiar wyjściowy + klas.poz.', 'zrealizowane', '03', NULL, true, false, NULL),
  ('MPZP-TARN-2024', '2024-08-01', 'MSW w skali 1:500 + kryptonimy K1..K4', 'zrealizowane', '03', NULL, true, false, NULL),
  ('MPZP-TARN-2024', '2024-11-15', 'Rozliczenie z POT i uzgodnienie MPZP', 'rozliczone', '04', NULL, true, false, NULL),
  ('SKAN-MOB-2025', '2025-12-20', 'Sesja MMS — nocny slot (S17)', 'w trakcie', '08', 'Wykładnica taśmy — uwaga na ograniczenia czasowe GDDKiA.', false, false, NULL),
  ('SKAN-MOB-2025', '2026-02-01', 'Porównanie chmury punktów z modelem 3D drogi', 'planowane', '08', NULL, false, true, 'Wysokie ryzyko gapy w modelu — rezerwa czasu na re-skan odcinka.'),
  ('PODZIAL-GDN-2025', '2025-11-10', 'Analiza prawna stanu + propozycja linii podziału', 'zrealizowane', '04', NULL, true, false, NULL),
  ('PODZIAL-GDN-2025', '2026-01-15', 'Operaty podziału + załączniki do KW', 'w trakcie', '04', 'Jeden ze współwłaścicieli w trakcie negocjacji.', false, true, 'Możliwy spór graniczny — rozważyć protokół komisyjny.')
) AS v(kr, data_planowana, etap, status, osoba_odpowiedzialna, uwagi, osiagniete, zagrozenie, zagrozenie_opis)
WHERE NOT EXISTS (
  SELECT 1 FROM public.kamienie_milowe km
  WHERE km.kr = v.kr AND km.etap = v.etap
);

-- ---------------------------------------------------------------------------
-- Podwykonawcy + zlecenia PW
-- ---------------------------------------------------------------------------
INSERT INTO public.podwykonawca (nazwa_firmy, osoba_kontaktowa, telefon)
SELECT * FROM (VALUES
  ('GEO-TACH LIDAR Sp. z o.o.', 'Adam Ruciński', '+48 512 100 201'),
  ('Firma Geodezyjna „Azymut”', 'Magdalena Fąfara', '+48 512 100 202'),
  ('Biuro Kartograficzne MAPROL', 'Krzysztof Bereza', '+48 512 100 203'),
  ('Georythm — inspekcja dróg', 'Łukasz Orczyk', '+48 512 100 204')
) AS v(nazwa_firmy, osoba_kontaktowa, telefon)
WHERE NOT EXISTS (SELECT 1 FROM public.podwykonawca p WHERE p.nazwa_firmy = v.nazwa_firmy);

INSERT INTO public.kr_zlecenie_podwykonawcy (
  kr, podwykonawca_id, numer_zlecenia, opis_zakresu, data_zlecenia, termin_zlecenia, data_oddania,
  cena_netto, czy_sprawdzone, czy_odebrane, status, pracownik_weryfikacja,
  osoba_faktury_nazwa, osoba_faktury_email, osoba_faktury_telefon, uwagi
)
SELECT z.kr, pw.id, z.numer_zlecenia, z.opis_zakresu, z.data_zlecenia, z.termin_zlecenia, z.data_oddania,
  z.cena_netto, z.czy_sprawdzone, z.czy_odebrane, z.status, z.pracownik_weryfikacja,
  z.osoba_faktury_nazwa, z.osoba_faktury_email, z.osoba_faktury_telefon, z.uwagi
FROM (VALUES
  (
    'ZRID-2025-DW1523',
    'GEO-TACH LIDAR Sp. z o.o.',
    'ZL-PW-2025-084',
    'Skanowanie airborne + klasyfikacja chmury pod ZRID (odcinek startowy)',
    '2025-09-02'::date,
    '2025-10-15'::date,
    '2025-10-01'::date,
    42000::numeric,
    true,
    true,
    'zakończone',
    '02',
    'Adam Ruciński',
    'biuro@geotach-lidar.example',
    '+48 512 100 201',
    'Faktura sprawdzona — netto OK.'
  ),
  (
    'SKAN-MOB-2025',
    'Firma Geodezyjna „Azymut”',
    'AZY/2025/771',
    'Wynajem zestawu GNSS + asysta w terenie (3 dni)',
    '2025-11-08'::date,
    '2025-12-05'::date,
    NULL,
    18500::numeric,
    false,
    false,
    'w realizacji',
    '08',
    'Magdalena Fąfara',
    'faktury@azymut-geodezja.example',
    '+48 512 100 202',
    'Termin ciasny — pilnować oddania.'
  ),
  (
    'MPZP-TARN-2024',
    'Biuro Kartograficzne MAPROL',
    'MAPR/24/099',
    'Wydruk wielkoformatowy + skład tablic MPZP',
    '2024-07-12'::date,
    '2024-08-30'::date,
    '2024-08-28'::date,
    9600::numeric,
    true,
    true,
    'zakończone',
    '03',
    'Krzysztof Bereza',
    'rozliczenia@maprol.example',
    '+48 512 100 203',
    NULL
  ),
  (
    'A2-2025-SSWN',
    'Georythm — inspekcja dróg',
    'GEO-A2-556',
    'Inspekcja udrożnienia geodezyjnego na jezdni (nocki)',
    '2025-07-01'::date,
    '2026-03-01'::date,
    NULL,
    24000::numeric,
    false,
    false,
    'w realizacji',
    '02',
    'Łukasz Orczyk',
    'faktury@georythm.example',
    '+48 512 100 204',
    'Po terminie planowanym — podświetlenie na pulpicie test.'
  )
) AS z(kr, pw_nazwa, numer_zlecenia, opis_zakresu, data_zlecenia, termin_zlecenia, data_oddania, cena_netto, czy_sprawdzone, czy_odebrane, status, pracownik_weryfikacja, osoba_faktury_nazwa, osoba_faktury_email, osoba_faktury_telefon, uwagi)
JOIN public.podwykonawca pw ON pw.nazwa_firmy = z.pw_nazwa
WHERE NOT EXISTS (
  SELECT 1 FROM public.kr_zlecenie_podwykonawcy x
  WHERE x.kr = z.kr AND x.numer_zlecenia = z.numer_zlecenia
);

-- ---------------------------------------------------------------------------
-- Dziennik zdarzeń (LOG)
-- ---------------------------------------------------------------------------
INSERT INTO public.dziennik_zdarzen (
  kr, typ_zdarzenia, opis, data_zdarzenia, osoba_zglaszajaca, wymagane_dzialanie,
  osoba_odpowiedzialna_za_zadanie, status_zdarzenia
)
SELECT * FROM (VALUES
  ('ZRID-2025-DW1523', 'Spotkanie', 'Uzgodnienie z projektantem drogi zakresu MDCP + numeracja punktów', '2025-09-18'::date, '02', NULL, NULL, 'ukończone'),
  ('ZRID-2025-DW1523', 'Zgłoszenie problemu', 'Brak zatwierdzonej mapy zasadniczej w PZGiK — wstrzymanie OTP', '2025-10-02'::date, '01', 'Uzyskać wypis/potwierdzenie aktualności MPZP od gminy', '04', 'w trakcie'),
  ('A2-2025-SSWN', 'Nadzór w terenie', 'Kontrola wbitych głów osnowy — protokół nr 3', '2025-07-22'::date, '05', NULL, NULL, 'ukończone'),
  ('A2-2025-SSWN', 'Mail / komunikat', 'GDDKiA: zmiana okna prac w nocy (zima) — nowy harmonogram', '2025-12-01'::date, '02', 'Przełożyć sesję skanowania z Azymutu na styczeń', '08', 'oczekuje'),
  ('WD-HALA-2025', 'Telefon', 'Inwestor prosi o przyspieszenie wytyczenia — dostawa konstrukcji 2 tyg. wcześniej', '2025-11-14'::date, '05', 'Potwierdzić możliwość terminu z Królem i sprzętem GNSS', '07', 'w trakcie'),
  ('SKAN-MOB-2025', 'Koordynacja', 'Uzgodnienie eskorty policyjnej pod MMS', '2025-11-12'::date, '08', NULL, NULL, 'ukończone'),
  ('PODZIAL-GDN-2025', 'Notarialne', 'Projekt podziału wysłany do uchwalenia na zebraniu współwłaścicieli', '2025-12-03'::date, '04', 'Czekać na uchwałę i zebrać podpisy', '04', 'oczekuje'),
  ('MPZP-TARN-2024', 'Archiwum', 'Przekazanie CD z opracowaniem do archiwum miejskiego', '2025-01-18'::date, '03', NULL, NULL, 'ukończone')
) AS v(kr, typ_zdarzenia, opis, data_zdarzenia, osoba_zglaszajaca, wymagane_dzialanie, osoba_odpowiedzialna_za_zadanie, status_zdarzenia)
WHERE NOT EXISTS (
  SELECT 1 FROM public.dziennik_zdarzen d
  WHERE d.kr = v.kr AND d.data_zdarzenia = v.data_zdarzenia AND d.typ_zdarzenia = v.typ_zdarzenia
    AND COALESCE(d.opis, '') = COALESCE(v.opis, '')
);

-- ---------------------------------------------------------------------------
-- Zadania (ogólne + przypięte do KR) — „problemy” przez zagrozenie + opis
-- ---------------------------------------------------------------------------
INSERT INTO public.zadania (
  kr, zadanie, dzial, osoba_odpowiedzialna, osoba_zlecajaca, status, data_planowana, data_realna, zagrozenie, opis
)
SELECT * FROM (VALUES
  (NULL::text, 'Przegląd ważności szkolenia BHP dla ekip terenowych', 'dział inżynieryjny'::text, '07'::text, '04'::text, 'w trakcie'::text, '2026-04-01'::date, NULL::date, false, 'Przypomnienie — szkolenia wygasają w VI 2026.'),
  (NULL::text, 'Aktualizacja licencji na oprogramowanie CAD', 'dział inżynieryjny', '08', '07', 'oczekuje', '2026-03-30'::date, NULL, false, 'Oferta od dystrybutora — czeka akceptacja zarządu.'),
  ('ZRID-2025-DW1523'::text, 'Dopisanie klauzul geodezyjnych do OTP dla ZDP'::text, 'dział prawny'::text, '04'::text, '01'::text, 'w trakcie'::text, '2026-03-15'::date, NULL::date, true, 'Ryzyko opinii prawnej po zmianie PZT — konsultacja z kancelarią.'),
  ('ZRID-2025-DW1523'::text, 'Import DWG osi drogi do szablonu ZRID — zgodność warstw'::text, 'dział inżynieryjny'::text, '06'::text, '02'::text, 'oczekuje'::text, '2026-02-28'::date, NULL::date, false::boolean, NULL::text),
  ('A2-2025-SSWN'::text, 'Analiza odchyleń niwelacji w strefie wiaduktu — raport 5 str.'::text, 'dział inżynieryjny'::text, '02'::text, '02'::text, 'ukończone'::text, '2025-11-01'::date, '2025-11-03'::date, false::boolean, 'Wysłane na mail inwestora.'::text),
  ('SKAN-MOB-2025'::text, 'Kalibracja IMU przed sesją nocną MMS'::text, 'dział inżynieryjny'::text, '08'::text, '05'::text, 'w trakcie'::text, '2026-03-20'::date, NULL::date, false::boolean, NULL::text),
  ('PODZIAL-GDN-2025'::text, 'Sporządzenie wizualizacji 3D działek dla notariusza'::text, 'dział inżynieryjny', '08'::text, '04'::text, 'oczekuje'::text, '2026-02-10'::date, NULL::date, false, NULL),
  ('WD-HALA-2025'::text, 'Potwierdzenie przyjęcia wytyczenia przez kierownika budowy (podpis)'::text, 'dział inżynieryjny', '05'::text, '03'::text, 'oczekuje'::text, '2025-12-15'::date, NULL::date, true, 'Bez podpisu nie rozliczamy etapu w systemie.')
) AS v(kr, zadanie, dzial, osoba_odpowiedzialna, osoba_zlecajaca, status, data_planowana, data_realna, zagrozenie, opis)
WHERE NOT EXISTS (
  SELECT 1 FROM public.zadania z
  WHERE COALESCE(z.kr, '') = COALESCE(v.kr, '')
    AND z.zadanie = v.zadanie
);

-- ---------------------------------------------------------------------------
-- Flota + sprzęt + rezerwacje (marzec 2026)
-- ---------------------------------------------------------------------------
INSERT INTO public.samochod (nazwa, numer_rejestracyjny, polisa_numer, polisa_wazna_do, przeglad_wazny_do, uwagi_eksploatacja, wymagane_naprawy, notatki)
SELECT * FROM (VALUES
  ('VW Caddy — pole 1', 'KR 9G401', 'OC/AC/2024/8812', '2026-09-30'::date, '2026-01-31'::date, 'Świece przy 180k km', NULL, 'GNSS + statyw w bagażniku'),
  ('Toyota Proace — pole 2', 'KR 7XT22', 'OC/AC/2024/9011', '2026-11-15'::date, '2026-06-10'::date, NULL, 'Wymiana tarcz przednich — zaplanować po sezonie zimowym', 'Przewóz sprzętu skaningowego'),
  ('Skoda Octavia — biuro', 'KR 2KM88', 'OC/AC/2025/1100', '2027-02-28'::date, '2026-03-01'::date, NULL, NULL, 'Kierownictwo / spotkania')
) AS v(nazwa, numer_rejestracyjny, polisa_numer, polisa_wazna_do, przeglad_wazny_do, uwagi_eksploatacja, wymagane_naprawy, notatki)
WHERE NOT EXISTS (SELECT 1 FROM public.samochod s WHERE s.numer_rejestracyjny = v.numer_rejestracyjny);

INSERT INTO public.sprzet (typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki)
SELECT * FROM (VALUES
  ('komputer'::text, 'Laptop Dell Precision 7780 + CAD', 'IT/2024/045'::text, '2026-02-01'::date, '02'::text, 'Stacja ZRID'),
  ('komputer', 'Laptop Lenovo P1 — MMS', 'IT/2024/046', '2026-02-01'::date, '08', 'Sterowanie skanerem'),
  ('drukarka', 'HP DesignJet T650', 'IT/2023/012', '2025-12-15'::date, '07', 'Wielkoformat'),
  ('ksero', 'Canon imageRUNNER C5840i', 'IT/2022/003', '2025-11-20'::date, NULL, 'Biuro'),
  ('inne', 'GNSS Stonex S999 + krążek', 'GEO/2025/001', NULL::date, '05', 'Sprawdzić kalibrację radia')
) AS v(typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki)
WHERE NOT EXISTS (SELECT 1 FROM public.sprzet s WHERE s.numer_inwentarzowy = v.numer_inwentarzowy);

INSERT INTO public.samochod_rezerwacja (samochod_id, data_dnia, pracownik_nr, opis_krotki)
SELECT s.id, v.data_dnia, v.pracownik_nr, v.opis_krotki
FROM (VALUES
  ('KR 9G401'::text, '2026-03-28'::date, '02'::text, 'ZRID DW1523 — odcinek MP'::text),
  ('KR 9G401', '2026-03-31'::date, '05', 'Hala Mysłowice — wytyczenie'),
  ('KR 7XT22', '2026-03-27'::date, '08', 'Przygotowanie MMS — magazyn'),
  ('KR 2KM88', '2026-03-26'::date, '04', 'Notariat Gdańsk — spotkanie')
) AS v(nrrej, data_dnia, pracownik_nr, opis_krotki)
JOIN public.samochod s ON s.numer_rejestracyjny = v.nrrej
ON CONFLICT (samochod_id, data_dnia) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Faktury kosztowe — zgłoszenia do księgowości
-- ---------------------------------------------------------------------------
INSERT INTO public.kr_faktura_do_zaplaty (
  kr, komu, nr_konta, kwota_brutto, link_faktury, numer_faktury, zgloszil_pracownik_nr, status, notatki
)
SELECT * FROM (VALUES
  (
    'ZRID-2025-DW1523'::text,
    'GEO-TACH LIDAR Sp. z o.o.'::text,
    '12 3456 0007 0000 0000 3000 1234'::text,
    51660::numeric,
    'https://faktury.example/geotach/2025/084.pdf'::text,
    'FV 2025/10/084'::text,
    '02'::text,
    'oplacone'::text,
    'Zaksięgowane — paliwo zaliczone na KR.'::text
  ),
  (
    'SKAN-MOB-2025',
    'Firma Geodezyjna „Azymut”',
    '11 2222 3333 4444 5555 6666 7777',
    22770.00,
    NULL,
    'FV 2025/11/771',
    '08',
    'do_zaplaty',
    'Netto 18 500 + VAT 23% — termin 14 dni.'
  ),
  (
    'A2-2025-SSWN',
    'Stacja paliw ORLEN — faktura zbiorcza paliwo teren',
    NULL,
    1840.50,
    NULL,
    'FV/ORY/778812',
    '05',
    'do_zaplaty',
    'Do rozdzielenia na etapy po numerach rejestracyjnych.'
  ),
  (
    'PODZIAL-GDN-2025',
    'Urząd Gminy — opłaty MPZP / wypis',
    NULL,
    157.00,
    NULL,
    'WPIS/2025/901',
    '04',
    'do_zaplaty',
    'Kwota symboliczna — czeka akceptacja.'
  )
) AS v(kr, komu, nr_konta, kwota_brutto, link_faktury, numer_faktury, zgloszil_pracownik_nr, status, notatki)
WHERE NOT EXISTS (
  SELECT 1 FROM public.kr_faktura_do_zaplaty f
  WHERE f.kr = v.kr AND COALESCE(f.numer_faktury, '') = COALESCE(v.numer_faktury, '')
);

COMMIT;

-- ---------------------------------------------------------------------------
-- Faktury sprzedażowe (powiązanie z pierwszym etapem danego KR) — opcjonalnie
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  e_zrid bigint;
  e_mpzp bigint;
BEGIN
  SELECT id INTO e_zrid FROM public.kamienie_milowe
  WHERE kr = 'ZRID-2025-DW1523' AND etap = 'Wpływ pełnomocnictw i kompletów' LIMIT 1;
  SELECT id INTO e_mpzp FROM public.kamienie_milowe
  WHERE kr = 'MPZP-TARN-2024' AND etap = 'MSW w skali 1:500 + kryptonimy K1..K4' LIMIT 1;

  IF e_zrid IS NOT NULL THEN
    BEGIN
      INSERT INTO public.faktury (etap_id, numer_faktury, data_wystawienia, zafakturowane, odebrane_protokolem, kwota_netto)
      SELECT e_zrid, 'FS/2025/1404', '2025-11-05'::date, true, true, 38000::numeric
      WHERE NOT EXISTS (SELECT 1 FROM public.faktury f WHERE f.etap_id = e_zrid AND f.numer_faktury = 'FS/2025/1404');
    EXCEPTION WHEN SQLSTATE '42703' THEN
      BEGIN
        INSERT INTO public.faktury (etap_id, numer_faktury, data_faktury, zafakturowane, odebrane_protokolem)
        SELECT e_zrid, 'FS/2025/1404', '2025-11-05'::date, true, true
        WHERE NOT EXISTS (SELECT 1 FROM public.faktury f WHERE f.etap_id = e_zrid AND f.numer_faktury = 'FS/2025/1404');
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Pominięto INSERT faktury ZRID — dostosuj kolumny w tabeli faktury.';
      END;
    WHEN OTHERS THEN
      RAISE NOTICE 'Pominięto INSERT faktury ZRID — %', SQLERRM;
    END;
  END IF;

  IF e_mpzp IS NOT NULL THEN
    BEGIN
      INSERT INTO public.faktury (etap_id, numer_faktury, data_wystawienia, zafakturowane, odebrane_protokolem, kwota_netto)
      SELECT e_mpzp, 'FS/2024/0891', '2024-10-02'::date, true, false, 27500::numeric
      WHERE NOT EXISTS (SELECT 1 FROM public.faktury f WHERE f.etap_id = e_mpzp AND f.numer_faktury = 'FS/2024/0891');
    EXCEPTION WHEN SQLSTATE '42703' THEN
      BEGIN
        INSERT INTO public.faktury (etap_id, numer_faktury, data_faktury, zafakturowane, odebrane_protokolem)
        SELECT e_mpzp, 'FS/2024/0891', '2024-10-02'::date, true, false
        WHERE NOT EXISTS (SELECT 1 FROM public.faktury f WHERE f.etap_id = e_mpzp AND f.numer_faktury = 'FS/2024/0891');
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Pominięto INSERT faktury MPZP — dostosuj kolumny w tabeli faktury.';
      END;
    WHEN OTHERS THEN
      RAISE NOTICE 'Pominięto INSERT faktury MPZP — %', SQLERRM;
    END;
  END IF;
END $$;
