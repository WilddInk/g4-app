-- =============================================================================
-- KR TEST / Obiekt Testowy — sandbox pod rozwój modułu TEREN
-- Uruchom w Supabase SQL Editor po podstawowych migracjach (kr, etapy, pracownik,
-- kr_teren_*, samochod/sprzet/rezerwacje, podwykonawca).
-- Idempotentne: możesz uruchamiać wielokrotnie.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Pracownicy testowi
-- ---------------------------------------------------------------------------
INSERT INTO public.pracownik (nr, imie_nazwisko, dzial, email, telefon)
SELECT * FROM (
  VALUES
    ('291', 'Krzysztof Jarzyna ze Szczecina', 'dzial_terenowy', 'krzysztof.jarzyna@test.local', '+48 600 910 910'),
    ('292', 'Karol Maliniak', 'dzial_terenowy', 'karol.maliniak@test.local', '+48 600 920 920')
) AS v(nr, imie_nazwisko, dzial, email, telefon)
WHERE NOT EXISTS (SELECT 1 FROM public.pracownik p WHERE p.nr = v.nr);

-- Jeśli są kolumny ról i aktywności — ustaw testowe uprawnienia.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pracownik' AND column_name = 'app_role'
  ) THEN
    UPDATE public.pracownik
    SET app_role = 'kierownik',
        is_active = true
    WHERE nr = '291';

    UPDATE public.pracownik
    SET app_role = 'uzytkownik',
        is_active = true
    WHERE nr = '292';
  END IF;
END $$;

-- Placeholder pod odpowiedzialność terenową:
-- dopóki nie ma osobnego ticka `odpowiedzialny_teren`, używamy flagi flotowej dla kierownika.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pracownik' AND column_name = 'odpowiedzialny_flota'
  ) THEN
    UPDATE public.pracownik
    SET odpowiedzialny_flota = true
    WHERE nr = '291';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Projekt KR TEST
-- ---------------------------------------------------------------------------
INSERT INTO public.kr (
  kr,
  nazwa_obiektu,
  rodzaj_pracy,
  dzial,
  osoba_prowadzaca,
  data_rozpoczecia,
  status,
  zleceniodawca,
  osoba_odpowiedzialna_zleceniodawcy,
  link_umowy,
  okres_projektu_od,
  okres_projektu_do
)
SELECT
  'TEST',
  'Obiekt Testowy',
  'Test modułu teren (przydział, postęp, zasoby)',
  'dzial_terenowy',
  '291',
  CURRENT_DATE,
  'w trakcie',
  'Klient testowy — wewnętrzny',
  'Monisia / QA',
  NULL,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '60 days'
WHERE NOT EXISTS (SELECT 1 FROM public.kr WHERE kr = 'TEST');

-- ---------------------------------------------------------------------------
-- 3) Etapy KR TEST (żeby było co oglądać w timeline)
-- ---------------------------------------------------------------------------
INSERT INTO public.etapy (
  kr,
  data_planowana,
  etap,
  status,
  osoba_odpowiedzialna,
  uwagi,
  osiagniete,
  zagrozenie,
  zagrozenie_opis
)
SELECT * FROM (
  VALUES
    ('TEST', CURRENT_DATE + 1,  'Plan pomiarów terenowych',          'zrealizowane', '291', 'Zakres uzgodniony', true,  false, NULL),
    ('TEST', CURRENT_DATE + 4,  'Prace terenowe — tura 1',           'w trakcie',    '292', 'W toku',            false, false, NULL),
    ('TEST', CURRENT_DATE + 9,  'Prace terenowe — tura 2',           'planowane',    '292', NULL,                false, false, NULL),
    ('TEST', CURRENT_DATE + 15, 'Opracowanie kameralne',             'planowane',    '291', NULL,                false, false, NULL),
    ('TEST', CURRENT_DATE + 20, 'Kontrola jakości + odbiór wewn.',   'planowane',    '291', NULL,                false, false, NULL)
) AS v(kr, data_planowana, etap, status, osoba_odpowiedzialna, uwagi, osiagniete, zagrozenie, zagrozenie_opis)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.etapy e
  WHERE e.kr = v.kr
    AND e.etap = v.etap
);

-- ---------------------------------------------------------------------------
-- 4) Podwykonawca testowy + zlecenie PW dla KR TEST
-- ---------------------------------------------------------------------------
INSERT INTO public.podwykonawca (nazwa_firmy, osoba_kontaktowa, telefon)
SELECT 'TEST-PW Geodezja', 'Adam Podwykonawca', '+48 600 930 930'
WHERE NOT EXISTS (
  SELECT 1 FROM public.podwykonawca p WHERE lower(trim(p.nazwa_firmy)) = lower(trim('TEST-PW Geodezja'))
);

INSERT INTO public.kr_zlecenie_podwykonawcy (
  kr,
  podwykonawca_id,
  numer_zlecenia,
  opis_zakresu,
  data_zlecenia,
  termin_zlecenia,
  cena_netto,
  status,
  pracownik_weryfikacja,
  osoba_faktury_nazwa,
  osoba_faktury_email,
  osoba_faktury_telefon,
  uwagi
)
SELECT
  'TEST',
  p.id,
  'PW/TEST/001',
  'Pomiary kontrolne na odcinku testowym',
  CURRENT_DATE,
  CURRENT_DATE + 10,
  2500.00,
  'w trakcie',
  '291',
  'Adam Podwykonawca',
  'adam.pw@test.local',
  '+48 600 930 930',
  'Seed testowy'
FROM public.podwykonawca p
WHERE lower(trim(p.nazwa_firmy)) = lower(trim('TEST-PW Geodezja'))
  AND NOT EXISTS (
    SELECT 1
    FROM public.kr_zlecenie_podwykonawcy z
    WHERE z.kr = 'TEST'
      AND z.numer_zlecenia = 'PW/TEST/001'
  );

-- ---------------------------------------------------------------------------
-- 5) Zespół terenowy + przydziały dzienne
-- ---------------------------------------------------------------------------
INSERT INTO public.kr_teren_zespol (nazwa, notatki)
SELECT 'TEST — Zespół terenowy A', 'Zespół testowy pod KR TEST'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.kr_teren_zespol z
  WHERE lower(trim(z.nazwa)) = lower(trim('TEST — Zespół terenowy A'))
);

INSERT INTO public.kr_teren_zespol_pracownik (zespol_id, pracownik_nr)
SELECT z.id, p.nr
FROM public.kr_teren_zespol z
JOIN public.pracownik p ON p.nr IN ('291', '292')
WHERE lower(trim(z.nazwa)) = lower(trim('TEST — Zespół terenowy A'))
  AND NOT EXISTS (
    SELECT 1
    FROM public.kr_teren_zespol_pracownik zp
    WHERE zp.zespol_id = z.id
      AND zp.pracownik_nr = p.nr
  );

INSERT INTO public.kr_teren_zadanie (
  kr,
  data_dnia,
  opis,
  ilosc_plan,
  ilosc_wykonano,
  pracownik_nr,
  uwagi
)
SELECT * FROM (
  VALUES
    ('TEST', CURRENT_DATE + 1, 'Przygotowanie punktów osnowy',                  10::numeric, 10::numeric, '292', 'Zakończone'),
    ('TEST', CURRENT_DATE + 2, 'Pomiar szczegółów terenowych — sektor A',      30::numeric, 18::numeric, '292', 'W toku'),
    ('TEST', CURRENT_DATE + 3, 'Pomiar szczegółów terenowych — sektor B',      25::numeric,  0::numeric, '292', 'Start jutro'),
    ('TEST', CURRENT_DATE + 4, 'Kontrola i domiary uzupełniające',             12::numeric,  0::numeric, '291', 'Nadzór kierownika'),
    ('TEST', CURRENT_DATE + 6, 'Przekazanie danych do kameralnego opracowania', 1::numeric,  0::numeric, '291', 'Do akceptacji')
) AS v(kr, data_dnia, opis, ilosc_plan, ilosc_wykonano, pracownik_nr, uwagi)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.kr_teren_zadanie t
  WHERE t.kr = v.kr
    AND t.data_dnia = v.data_dnia
    AND t.opis = v.opis
);

-- ---------------------------------------------------------------------------
-- 6) Powiązanie z flotą i sprzętem (test)
-- ---------------------------------------------------------------------------
INSERT INTO public.samochod (
  nazwa, numer_rejestracyjny, polisa_numer, polisa_wazna_do, przeglad_wazny_do, notatki
)
SELECT
  'Zygzak McQueen',
  'ZT TEST1',
  'POL/TEST/001',
  CURRENT_DATE + 365,
  CURRENT_DATE + 180,
  'Samochód testowy pod moduł teren'
WHERE NOT EXISTS (
  SELECT 1 FROM public.samochod s WHERE lower(trim(s.nazwa)) = lower(trim('Zygzak McQueen'))
);

INSERT INTO public.sprzet (typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki)
SELECT
  'gps',
  'RTK TEST-01',
  'TEST/SPRZ/001',
  CURRENT_DATE + 120,
  '292',
  'Sprzęt testowy dla modułu teren'
WHERE NOT EXISTS (
  SELECT 1 FROM public.sprzet s WHERE lower(trim(s.numer_inwentarzowy)) = lower(trim('TEST/SPRZ/001'))
);

INSERT INTO public.samochod_rezerwacja (samochod_id, data_dnia, pracownik_nr, opis_krotki)
SELECT
  s.id,
  CURRENT_DATE + 2,
  '292',
  'KR TEST — pomiary sektor A'
FROM public.samochod s
WHERE lower(trim(s.nazwa)) = lower(trim('Zygzak McQueen'))
  AND NOT EXISTS (
    SELECT 1
    FROM public.samochod_rezerwacja r
    WHERE r.samochod_id = s.id
      AND r.data_dnia = CURRENT_DATE + 2
  );

COMMIT;

