-- Wygenerowano automatycznie — sprawdź typy i przypisania przed uruchomieniem na produkcji.
-- Źródło: arkusz Sprzet z inwentaryzacji IT.

BEGIN;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP Elite Desk 800Gi TWR (SN: CZC52655C6)',
  'WS-3/2019',
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: I5-4590@3,3GHZ
RAM GB: 8.0
Dysk: SSD 222 GB
System: Win 10 Pro
Akcesoria: Monitor 1: Samsung 2443Bw | Monitor 2: Samsung: 2443BW | Klawiatura: HP:  KU-0316 | Myszka: Gensis KRYPTON190 nr wewnętrzny: WS-7/2019
Uwagi: DP: Pokój 3:  okno szafa',
  'G4G-WS-KAZIE',
  ARRAY['Dagmara Skwara']::text[],
  '{}'::text[],
  'Dagmara Skwara'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP Elite Desk 800Gi TWR (SN: CZC5141ZDH)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: I5-4590@3,3GHZ
RAM GB: 8.0
Dysk: SSD 240GB
System: Win 10 Pro',
  'G4G-WS-MAWAS',
  ARRAY['Martyna Wąs']::text[],
  '{}'::text[],
  'Martyna Wąs'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP Elite Desk 800Gi TWR (SN: CZC54505N3)',
  NULL,
  NULL,
  '286',
  'Kategoria (import): Komputer stacjonarny
CPU: I5-4590@3,30GHZ
RAM GB: 16.0
Dysk: SSD 240GB
System: Win 10 Pro
Akcesoria: Monitor 1: Samsung / SyncMaster 2443BW / LS24MYKABCA/EN  nr wewn: WS-5/2019 | Monitor 2: Samsung / SyncMaster 2443BW / LS24MYKABCA/EN   nr wewn: WS-5/2019 | Klawiatura: LOGITECH K120 2016MR18E1E8| Mysz: Genesis Krypton 190',
  'G4G-WS-AGSTU',
  ARRAY['Agnieszka Studniarz']::text[],
  '{}'::text[],
  'Agnieszka Studniarz'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP COMPAQ 8200 ELITE CMT PC (SN: CZC2378115)',
  'WS-6/2019',
  NULL,
  '156',
  'Kategoria (import): Komputer stacjonarny
CPU: i5 2400 3,1GHz
RAM GB: 8.0
Dysk: SSD 240GB
System: Windows 7 Pro OEM',
  'G4G-WS-DADEB',
  ARRAY['Dagmara Wnęk']::text[],
  '{}'::text[],
  'Dagmara Wnęk'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision Tower 7810 (SN: FZLLQ92)',
  'WS-7/2019',
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: Xeon e5-2609@1,9ghz
RAM GB: 32.0
Dysk: SSD 500GB
System: Win 10 Pro
Akcesoria: Monitor 1: LG / 24EA53 / 306NDUNDB318',
  'G4G-WS-JOBOC',
  ARRAY['Justyna Ryniak']::text[],
  '{}'::text[],
  'Justyna Ryniak'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Lenovo ThinkStation (SN: S4DZNX4)',
  'WS-8/2019',
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: Xeon W3690 3,47GHz
RAM GB: 12.0
Dysk: SSF240 GB
System: Win 10 Pro
Akcesoria: Monitor 1: HP Compaq LA 2205wg seria: 3CQ0134YSM| Monitor 2: HP COMPAQ LA2205wg  Seria:  3CQ0134TS7 | Klawiatura: Msonic model: MK122UKC| Myszka: speedlink SL-670021-BK
Uwagi: DP:  Pokój 3: okno okno',
  'G4G-WS-MASKA',
  ARRAY['Magdalena Skarbek']::text[],
  '{}'::text[],
  'Magdalena Skarbek'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision T3500 (SN: 5F46R4J)',
  'PC/201/2016',
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: Xeon W5650 2,67GHz
RAM GB: 8.0
Dysk: SSD 225GB
System: Windows 7 Pro
Akcesoria: Monitor 1: HP / LA2205wg / 3CQ0134TSM / MON/15/2016 | Monitor 2: Lenovo / ThinkVision | Klawiatura: Genius | Mysz: Genius',
  'PC-201-2016',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP COMPAQ 8200 ELITE CMT PC (SN: XL508AV)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: i5 2400 3,1GHz
RAM GB: 4.0
Dysk: HDD 300GB
System: Windows 7 Pro
Akcesoria: Monitor 1: Samsung / SyncMaster 2443 / MY24H9XZ207909Z / 9 | Klawiatura: Toshiba | Mysz: Modecom',
  'XL508AV',
  ARRAY['Justyna Bielak']::text[],
  '{}'::text[],
  'Justyna Bielak'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Lenovo ThinkStation (SN: S4GTLF8)',
  'WS-12/2019',
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: Xeon W3550 3,07GHz
RAM GB: 12.0
Dysk: SSD 240GB
System: Windows 10 pro
Akcesoria: Monitor 1: Samsung / SyncMaster 2443 / MY24H9XZ107303L | Monitor 2: Samsung / SyncMaster 2443 / MY24H9XB407754K | Klawiatura: Msonic | Mysz: Modecom',
  'G4G-WS-KAKOT',
  ARRAY['Katarzyna Nowak']::text[],
  '{}'::text[],
  'Katarzyna Nowak'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Lenovo ThinkStation (SN: S4EHLC1)',
  'WS-4/2019',
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: Xeon W3690 3,47GHz
RAM GB: 12.0
Dysk: SSF240 GB
System: Windows 10 Pro
Akcesoria: Monitor 1: Samsung:  S24B00H Typ: Ls24B300| Monitor 2: Samsung:  S24B00H Typ: Ls24B300 | Klawiatura : Dell: KB212-B| Myszka: Genius Krypton 192
Uwagi: DP: Pokój 2: okno brak kabla zasilającego monitor 2',
  'G4G-WS-MAFLI',
  ARRAY['Małgorzata Flis']::text[],
  '{}'::text[],
  'Małgorzata Flis'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision M4800 (SN: JNPVP12)',
  'GG4/NB/5/2019',
  NULL,
  NULL,
  'Kategoria (import): Laptop
CPU: I7-4810@2,8GHZ
RAM GB: 16.0
Dysk: SSD 500GB
System: WIN 10 Pro
Akcesoria: Monitor 1: Samsung / SyncMaster 2443 / MY24H9XQA04369D | Klawiatura: Genius | Mysz: Genius',
  'G4G-NB-ALKU',
  ARRAY['Aleksandra Kuśmierczyk']::text[],
  '{}'::text[],
  'Aleksandra Kuśmierczyk'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP HP Z400DIMM Workstation (SN: CZC204BWDF)',
  'WS/1/2019',
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: Xeon(R) CPU W3550 3,07 GHZ
RAM GB: 32.0
Dysk: SSD 224 GB
System: Windows 10 Pro
Akcesoria: Monitor 1:  Lenovo ThiinkVision model: L2440PWC seisl number: VNA116M | Monitor 2: HP elite Display E241i  NRPRODUKTU: F0W81AAF0W81AL SEIAL NUMBER: CN44450KX1Nr wewnętrzny WS-14/2019 | Klawiatura: Msonic Model: MK122UKC | Mysz: logitech B100 M/N: M-U003656
Uwagi: DP: Pokój 3:  ściana drzwi',
  'G4G-WS-MABED',
  ARRAY['Maciej Bednarczyk']::text[],
  '{}'::text[],
  'Maciej Bednarczyk'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision (SN: D04RKQ1)',
  NULL,
  NULL,
  '200',
  'Kategoria (import): Laptop
CPU: i-7 2860QM
RAM GB: 16.0
Dysk: SSD 224 GB
System: Win 10 Pro
Akcesoria: Monitor 1: Dell: U2412M nr wewn. WS-2/2019 |Monitor 2:  Dell: U2412M nr wewn. WS-2/2019 | Klawiatura: Dell: SK-8115| myszka:  nr wewntrzny WS/2/2019 Gemius Krypton 190',
  'G4G-NB-MABED',
  ARRAY['Maciej Bednarczyk']::text[],
  '{}'::text[],
  'Maciej Bednarczyk'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP Elite Desk 800Gi TWR (SN: CZC5141ZQT)',
  'WS-2/2019',
  NULL,
  '287',
  'Kategoria (import): Komputer stacjonarny
CPU: I5-4590@3,3GHZ
RAM GB: 8.0
Dysk: SSD 224B
System: Win 10 Pro
Akcesoria: Monitor 1: Dell U2412Mb SN: CN-04RFMK-64180-5C8- 0L6L-A02| Monitor 2: Dell U2412Mb S/N: CN-00FFXD-74261-314-579S | Klawiatura: Cobra Predator K550| Myszka: Genius KRYPTON 190',
  'G4G-WS-PIGAR',
  ARRAY['Piotr Garsztka']::text[],
  '{}'::text[],
  'Piotr Garsztka'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision M4700 (SN: 5NBV9Z1)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Laptop
CPU: I7-3740QM
Uwagi: nie uruchamia się',
  'G4G-NB-ANHOM',
  ARRAY['Anna Homik']::text[],
  '{}'::text[],
  'Anna Homik'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP C8N27AV (SN: ZCC4402KMC)',
  'WS-11/2019',
  NULL,
  '177',
  'Kategoria (import): Komputer stacjonarny
CPU: I7-4470
RAM GB: 24.0
Dysk: SSD 238GB
System: Windows 10 Pro
Akcesoria: Monitor 1: Dell: P2417Hb Monitor2: P2417H| Klawiatura: Genius: GK-100012CP/K| muszka: Genius: KRYPTON190',
  'G4G-WS-JOADA',
  ARRAY['Joanna Adamska']::text[],
  '{}'::text[],
  'Joanna Adamska'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell OPTIPLEX 3020 (SN: 297NR22)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: i5 4590 @ 3,3 GHz
RAM GB: 8.0
Dysk: SSD 120GB
System: Windows 10 Pro
Akcesoria: Monitor 1: DELL / p2212HD',
  'G4G-WS-ROROG',
  ARRAY['Roksana Rogalka']::text[],
  '{}'::text[],
  'Roksana Rogalka'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision (SN: BD6T5S1)',
  'LAP/3/2016',
  NULL,
  NULL,
  'Kategoria (import): Laptop
CPU: i7 2640 2,8GHz
RAM GB: 16.0
Dysk: SSD 240GB
System: Windows 7 Pro
Akcesoria: Monitor 1: HP / ZR2440w / CN2150PK1 | Mysz: Genesis',
  'LAP-3-2016',
  ARRAY['Magdalena Trojanowska']::text[],
  '{}'::text[],
  'Magdalena Trojanowska'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision (SN: 1ZCYK32)',
  'GG4/NB/7/2019',
  NULL,
  NULL,
  'Kategoria (import): Laptop
CPU: i7-4910@2,9Ghz
RAM GB: 16.0
Dysk: SSD 240GB
System: Windows 10 Pro',
  'G4G-NB-MATRO',
  ARRAY['Magdalena Trojanowska']::text[],
  '{}'::text[],
  'Magdalena Trojanowska'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP COMPAQ 8200 ELITE CMT PC (SN: CZC23947D6)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: i5 2400 3,1GHz
RAM GB: 4.0
Dysk: SSD 240GB
System: Windows 7 Pro
Akcesoria: Monitor 1: BENQ / ET-0019-NA / ET59800985026 / MON/14/2016 | Klawiatura: Msonic | Mysz: Genesys',
  'CZC23947D6',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Lenovo ThinkStation (SN: S496259)',
  'WS-15/2019',
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: Xeon W3580 3,33 GHz
RAM GB: 16.0
Dysk: SSD 240GB
System: Windows 10 Pro
Akcesoria: Monitor 1: HP / ZR2440w / CN2150NQG | Monitor 2: HP / ZR2440w / CNT148C0DX | Klawiatura: Genesys | Mysz: Genesys',
  'G4G-WS-PRAKT',
  ARRAY['Dominika Nowicka']::text[],
  '{}'::text[],
  'Dominika Nowicka'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision (SN: JV93LQ1)',
  'WS-11/2019',
  NULL,
  '176',
  'Kategoria (import): Laptop
CPU: i7-2640M
RAM GB: 16.0
Dysk: 240 GB SSD
System: Windows 10 Pro
Akcesoria: Monitror 1: Dell: P2417Hb S/N: CN-0CW6Y7-74261-666-359L-A00 | Monitor 2: Dell: P2417Hb S/N: CN-0CW6Y7-724261-666-2Y7L-A00 | myszka: Genius: Krypton 190 | klawaitura: laptec: YB-MB62| Stacja dokkująca: Dell: PR02X CN-035RXK-12961-65J-2191-A00',
  'G4G-WS-MALAS',
  ARRAY['Joanna Strzałka']::text[],
  '{}'::text[],
  'Joanna Strzałka'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Lenovo B560 (SN: WB0083693)',
  'LAP/25/2012',
  NULL,
  NULL,
  'Kategoria (import): Laptop
CPU: Pentium P6100 2,0 GHz
RAM GB: 4.0
Dysk: SSD 120GB
System: Windows 7 Pro
Akcesoria: Klawiatura: Modecom',
  'LAP-25-2012',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP Pavilon dv9700 (SN: dv9850eb)',
  'LAP/29/2012',
  NULL,
  NULL,
  'Kategoria (import): Laptop
CPU: C2Duo 2,4 GHz',
  'LAP-29-2012',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP COMPAQ 8200 ELITE CMT PC (SN: CZC237814M)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
System: Windows 7 Pro',
  'CZC237814M',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Lenovo ThinkStation (SN: S4FGGE9)',
  'WS-14/2019',
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: Xeon W3690 3,47 GHz
RAM GB: 16.0
Dysk: SSD 240GB
System: Windows 7 Pro
Akcesoria: Monitor 1: HP / ZR2440w / CNT148C0DB | Monitor 2: HP / ZR2440w / CNT2100854 | Klawiatura: TITANIUM | Mysz: Genesys',
  'G4G-WS-BOKUC',
  ARRAY['Bogumił Kuciński']::text[],
  '{}'::text[],
  'Bogumił Kuciński'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Latitude 3520',
  NULL,
  NULL,
  '003',
  'Kategoria (import): Laptop
CPU: i5-1135G7 @ 2.40GHz (1.38 GHz)
RAM GB: 16.0
Dysk: SSD 240GB
System: Windows 11 Pro
Akcesoria: Monitor 1  SAMSUNG LC34G55TWWRXEN',
  'G4G-NB-PACIE',
  ARRAY['Małgorzata Franczak']::text[],
  '{}'::text[],
  'Małgorzata Franczak'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision M4700 (SN: 6ZDTNX1)',
  NULL,
  NULL,
  '005',
  'Kategoria (import): Laptop
CPU: i7 3740QM @ 2.70GHz
RAM GB: 16.0
Dysk: HDD 500GB
System: Windows 7 Pro',
  '6ZDTNX1',
  ARRAY['Anna Iskierka']::text[],
  '{}'::text[],
  'Anna Iskierka'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell 4800',
  NULL,
  NULL,
  '042',
  'Kategoria (import): Komputer stacjonarny',
  'SPRZET-001',
  ARRAY['Adrian Skuza']::text[],
  '{}'::text[],
  'Adrian Skuza'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision M4700',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Laptop
Akcesoria: ładowska do laptopa nr wewn: GG/NB/6/2019
Uwagi: nie uruchamia się, bateria nie chce się ładować',
  'SPRZET-002',
  ARRAY['Danuta Szydełko']::text[],
  '{}'::text[],
  'Danuta Szydełko'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Vostro (SN: 52K1JT2)',
  NULL,
  NULL,
  '231',
  'Kategoria (import): Laptop
CPU: i5-8265U@1,6ghz
RAM GB: 16.0
Dysk: SSD 238GB
System: Windows 10 Pro
Akcesoria: Monitor 1: LG: 24MP59G| Myszka: Genesis model Krypton 190',
  'G4G-NB-SLPYZ',
  ARRAY['Sławomir Pyzik']::text[],
  '{}'::text[],
  'Sławomir Pyzik'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP Zbook 15 G2 (SN: CND5372DLJ)',
  NULL,
  NULL,
  '211',
  'Kategoria (import): Laptop
CPU: i7 4810 MQ
RAM GB: 16.0
Dysk: 477 GB SSD
System: Windows 10 Pro
Akcesoria: Monitor: Dell: P2414Hb nr wewe. WS-13/2009 | Myszka: Asus WT465M',
  'G4G-NB-PISZA',
  ARRAY['Piotr Szafrański']::text[],
  '{}'::text[],
  'Piotr Szafrański'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell 4800 (SN: 6C82W32)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny',
  '6C82W32',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell PRECISION TOWER 7810 (SN: FMHQS62)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny',
  'FMHQS62',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell PRECISION TOWER 7810',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny',
  'SPRZET-003',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP EliteDesk 800 G1 TWR (SN: CZC54512KH)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: I5-4590 3,30 GHz
RAM GB: 16 gb
Dysk: 240 GB SSD
System: Windows 10 Pro
Akcesoria: Monitor 1: Lenovo ThinkVision L24400pwC serial numer: VNA1LV6 nr wewnetrzny: WS-6/2019 | Monitor 2: Lenovo ThinkVision L24400pwC serial numer: VNA10TL nr wewnetrzny: WS-6/2019 | klawiatura: Genius model GK-100112CP/K nr wewnetrzny: WS-6/2019 | myszka : Genius GK- 100012CP/T nr wewnetrzny: WS-6/2019
Uwagi: MONITOR 1: Pojawiają się żółte pasy na monitorze | MONITOR 2: działa, ale czarny ekran. 
DP: Pokój 3: Okno ściana',
  'G4G-WS-CGEO2',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP EliteDesk 800TW (SN: CZC5141ZHR)',
  'WS-16/2019',
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: I5-4590
RAM GB: 8.0
Dysk: SSD240
System: Windows 10 Pro',
  'G4G-WS-TEREN',
  ARRAY['Teren']::text[],
  '{}'::text[],
  'Teren'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision M4700 (SN: 6PMFRY1)',
  NULL,
  NULL,
  '023',
  'Kategoria (import): Laptop
CPU: i7-3740qm@2,7GHz
RAM GB: 32.0
Dysk: SSD256GB
System: Windows 7 Pro',
  'G4G-NB-DAMAR',
  ARRAY['Damian Markiewicz']::text[],
  '{}'::text[],
  'Damian Markiewicz'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision M4600 (SN: H9YBCT1)',
  'GG4/NB/19/2019',
  NULL,
  NULL,
  'Kategoria (import): Laptop
CPU: i7-2860qm@2,5GHz
RAM GB: 16.0
Dysk: SSD240GB
System: Windows 10 Pro',
  'G4G-NB-TEREN',
  ARRAY['Justyna Kuśnierz']::text[],
  '{}'::text[],
  'Justyna Kuśnierz'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision M4600 (SN: 93B8BT1)',
  'Laptop 8',
  NULL,
  '035',
  'Kategoria (import): Laptop
CPU: i7-2860qm@2,5GHz
RAM GB: 16.0
Dysk: SSD240GB
System: Windows 7 Pro
Akcesoria: myszka bezprzewodowa logitech m185
Uwagi: Bateria niedziałająca',
  'G4G-NB-KAKOT',
  ARRAY['Kamil Kot']::text[],
  '{}'::text[],
  'Kamil Kot'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell 7510',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Laptop
CPU: i7-6820hq
RAM GB: 32.0
Dysk: 1TB SSD
System: Windows 10 Pro',
  'beznazwy',
  ARRAY['Marcin Ciszek']::text[],
  '{}'::text[],
  'Marcin Ciszek'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell 4800 (SN: CXQ1XY1)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny',
  'CXQ1XY1',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell 4800 (SN: JNPVP12)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny',
  'JNPVP12',
  ARRAY['Aleksandra Kuśnierczyk']::text[],
  '{}'::text[],
  'Aleksandra Kuśnierczyk'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell G15 5511 (SN: DPYCYH3)',
  NULL,
  NULL,
  '225',
  'Kategoria (import): Laptop
CPU: i7-11800H @ 2,3 GHz
RAM GB: 16.0
Dysk: 500GB
System: windows 10 pro
Akcesoria: Monitor 1: Dell: P2414Hb | Monitor 2: Dell: P2414Hb | myszka: Genesis KRYPTON 190| klawiatura: Logitech: Y-R0035| Adapter: UNITEK:V1411A
Uwagi: monitory odnowione',
  'G4G-NB-JURYN',
  ARRAY['Justyna Ryniak']::text[],
  '{}'::text[],
  'Justyna Ryniak'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell G15 5510 (SN: J8H4LF3)',
  NULL,
  NULL,
  '282',
  'Kategoria (import): Laptop
CPU: i7-10870H @ 2,21GHz
RAM GB: 16.0
Dysk: 577 GB SSD
System: windows 10 pro
Akcesoria: Monitor 1: BENQ/ GL2480 | Monitor 2: BENQ/ GL2480 |  klawiatura  KB212-B  nr wewn: WS-5/2019| myszka:  WT465M | Adapter: AUKEY CB-C78',
  'G4G-NB-ANSWA',
  ARRAY['Anna Swatowska']::text[],
  '{}'::text[],
  'Anna Swatowska'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell G15 5511 (SN: 6HYFYH3)',
  NULL,
  NULL,
  '011',
  'Kategoria (import): Laptop
CPU: i7-11800H
RAM GB: 16.0
Dysk: 500GB
System: windows 10 pro
Akcesoria: Monitor 1: LG/ 101 NTCZKB315 i | Monitor 2: LG/101 NTTQKB321  | mysz: Acer | klawiatura: Logitech',
  'G4G-NB-ANHOM1',
  ARRAY['Anna Homik']::text[],
  '{}'::text[],
  'Anna Homik'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Latitude 3520 (SN: HTM9GG3)',
  NULL,
  NULL,
  '005',
  'Kategoria (import): Laptop
CPU: i5-1135g7
RAM GB: 16.0
Dysk: 500GB
System: windows 10 pro
Akcesoria: myszka: Kensington M01215',
  'G4G-NB-HTM9GG3',
  ARRAY['Anna Iskierka']::text[],
  '{}'::text[],
  'Anna Iskierka'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Latitude 3520 (SN: 3YP9GG3)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Laptop
CPU: i5-1135g7
RAM GB: 16.0
Dysk: 500GB
System: windows 10 pro',
  '3YP9GG3',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell G15 5511 (SN: 94HFPH3)',
  NULL,
  NULL,
  '042',
  'Kategoria (import): Laptop
CPU: i7-11800H
RAM GB: 16.0
Dysk: 477GB
System: windows 10 pro
Akcesoria: Monitor: LG: 24MP59G | Monitor 2: HP:  CN44320C3V | Klawiatura: Silver line |myszka1 : speedlink SL-680021-BK l myszka 2: CRYPTON190',
  '2TVMHK3',
  ARRAY['Damian Markiewicz']::text[],
  '{}'::text[],
  'Damian Markiewicz'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell G16 7630 (SN: 5K60KZ3)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Laptop
System: windows 11 pro',
  'G4G-NB-5K60KZ3',
  ARRAY['Martyna Ściupider']::text[],
  '{}'::text[],
  'Martyna Ściupider'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell G167630 (SN: CZC2378115)',
  NULL,
  NULL,
  '156',
  'Kategoria (import): Laptop
CPU: i9-13900HX
RAM GB: 32.0
Dysk: 954 GB
System: Windows 11  Pro
Akcesoria: Monitor 1: NEC: EA244WMi | Monitor2 : NEC: EA244WMi : |klawaitura Titanum: TK101| myszka:UGREEN: MU006',
  'G4G-NB-2LJ0KZ3',
  ARRAY['Dagmara Wnęk']::text[],
  '{}'::text[],
  'Dagmara Wnęk'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Lenovo 14 Gen1 (SN: PF20KJ5B)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Laptop
CPU: i5-10210U
RAM GB: 32.0
Dysk: 2TB SSD
System: Windows 10 Pro',
  'G4G-NB-PF20KJ5B',
  ARRAY['Roksana Stryjak']::text[],
  '{}'::text[],
  'Roksana Stryjak'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision 3561 (SN: 2CJT9G3)',
  NULL,
  NULL,
  '268',
  'Kategoria (import): Laptop
CPU: i7-11850H
RAM GB: 16.0
Dysk: 512 GBNVME SSD
System: Windows 11 Pro
Akcesoria: ładowarka do laptopa',
  'G4G-NB-2CJT9G3',
  ARRAY['Magdalena Chrzanowska']::text[],
  '{}'::text[],
  'Magdalena Chrzanowska'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision 7510 (SN: 5FGYQC2)',
  NULL,
  NULL,
  '3.0',
  'Kategoria (import): Laptop
CPU: i7-16820HQ
RAM GB: 64 GB
Dysk: 953 GB
System: Windows 7 Professional
Akcesoria: myszka:speedlink: SL-680021-BK',
  'DAMIAN-KOMPUTER',
  ARRAY['Damian Markiewicz']::text[],
  '{}'::text[],
  'Damian Markiewicz'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell M4600 (SN: 2BFT5S1)',
  NULL,
  NULL,
  '176.0',
  'Kategoria (import): Laptop
CPU: i7-2760QM
RAM GB: 16 GB
Dysk: 466 GB SDD
System: Windows 10 Pro
Akcesoria: myszka: MODECOM: MC-M9 S/N: 901171000003718',
  'ADL1MT7',
  ARRAY['Sebastian Zając']::text[],
  '{}'::text[],
  'Sebastian Zając'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'składany 51D (SN: 3067ZP0C11010116001426)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: i9-12900K
RAM GB: 64 GB
Dysk: 2,75 TB
System: Windows 11 Pro
Akcesoria: Monitor 1: HP: CN45130LQS',
  'G4G-WS-SKAN',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'HP EliteDesk 800 G1 TWR (SN: CZ5141ZDH)',
  'WS-5/2019',
  NULL,
  NULL,
  'Kategoria (import): Komputer stacjonarny
CPU: I5-4590 3,30 GHz
RAM GB: 8 GB
Dysk: 222 GB
System: Windows 10 Pro
Akcesoria: Monitor 1: Samsung / SyncMaster 2443BW model code: LS24MYKABCA/EN typ: MY24WS nr wewnętrzny: GG4/NB/5/2019 | Monitor 1: Samsung / SyncMaster 2443BW model 245B model code:LS24HUBCQ/ED TYP: HU24BS nr wewnętrzny: GG4/NB/5/2019  | Klawiatura: e5 model: KB-6106/RE00206 nr wewnętrzny: KLA/5/2012 | Mysz bezprzewodowaa: Genius GK-10012CP/T nr wewnętrzny: GG4/NB/5/2019
Uwagi: DP: Pokój 2: Ściana',
  'DESKTOP-QFE3TSO',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision M4800 (SN: CZC54512KH)',
  'GG4/NT/2/2019',
  NULL,
  NULL,
  'Kategoria (import): Laptop
CPU: i7-4810MQ  2.8GHz
RAM GB: 16 GB
Dysk: 237 GB
System: Windows 10 Pro',
  'G4G-NB-Prawny',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'Dell Precision M700 (SN: 082H3V)',
  NULL,
  NULL,
  '005',
  'Kategoria (import): Laptop
CPU: i7-3740QM  2.70GHz
RAM GB: 17 GB
Dysk: 240 GB
System: Windows 10 Pro
Uwagi: nie działa klawisz s oraz brak klawisza 5',
  'G4G-NB-ANISK',
  ARRAY['Anna Iskierka']::text[],
  '{}'::text[],
  'Anna Iskierka'
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

INSERT INTO public.sprzet (
  typ, nazwa, numer_inwentarzowy, data_przegladu, pracownik_nr, notatki,
  zewnetrzny_id, poprzedni_uzytkownicy_teksty, poprzedni_pracownicy_nr, poprzedni_uzytkownicy_zrodlo
) VALUES (
  'komputer',
  'DELL G16 7630 (SN: P122F001)',
  NULL,
  NULL,
  NULL,
  'Kategoria (import): Laptop
CPU: i-9 - 13900 HX 2.20 GHz
RAM GB: 32 GB
Dysk: 954 GB
System: Windows 11 Pro
Uwagi: DP: Szafka za Olą',
  'G4G-NB-5K60KZ3',
  ARRAY[]::text[],
  '{}'::text[],
  NULL
)
ON CONFLICT ON CONSTRAINT sprzet_zewnetrzny_id_key DO UPDATE SET
  typ = EXCLUDED.typ,
  nazwa = EXCLUDED.nazwa,
  numer_inwentarzowy = EXCLUDED.numer_inwentarzowy,
  pracownik_nr = EXCLUDED.pracownik_nr,
  notatki = EXCLUDED.notatki,
  poprzedni_uzytkownicy_teksty = EXCLUDED.poprzedni_uzytkownicy_teksty,
  poprzedni_uzytkownicy_zrodlo = EXCLUDED.poprzedni_uzytkownicy_zrodlo;

COMMIT;
