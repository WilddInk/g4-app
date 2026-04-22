-- Wygenerowano skryptem import_rozliczenie_godzinowe_xlsx_to_sql.py
-- Źródło: CMP---_---225-PyzikAnna---Rozliczenia---2026-01-01---RozliczenieGodzinowe---2026-01-01 - 2026-12-31.xlsx
-- Arkusze: miesiące MM-RRRR (bez RozliczenieKosztów / Świąt).
-- Pominięto wiersze z „WPISZ CZAS!” i puste typy/godziny.
-- Liczbowa kolumna „CZAS PRACY” → typ „praca” + godziny (KR z OBIEKT NR).
-- Kody nb-* → typy z aplikacji (urlop, zwolnienie_lekarskie, …); nb-UW bez szczegółów = 8 h.
--
-- Na początku transakcji: DELETE wcześniejszych wpisów z importu (żeby ponowny import nie dublował).
-- Wyłączenie: python ... --skip-delete
--
-- Wymagane kolumny: czas-pracy-wykonywane-zadanie.sql (wykonywane_zadanie).
BEGIN;

-- Usunięcie poprzedniego importu „RozliczenieGodzinowe” dla tego pracownika (zakres dat z arkuszy).
DELETE FROM public.czas_pracy_wpis
WHERE pracownik_nr = '225'
  AND data >= '2026-01-01'
  AND data <= '2026-12-26'
  AND strpos(coalesce(uwagi, ''), 'Import: RozliczenieGodzinowe') > 0;

INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-01', '', 'inne', 0.00, 0.00, $cg1$Nowy Rok
Kod arkusza: ŚWIĘTO
Import: RozliczenieGodzinowe / 01-2026$cg1$, $cg2$Nowy Rok$cg2$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-02', '', 'urlop', 8.00, 0.00, $cg3$Import: RozliczenieGodzinowe / 01-2026$cg3$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-05', '', 'urlop', 8.00, 0.00, $cg4$Import: RozliczenieGodzinowe / 01-2026$cg4$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-06', '', 'inne', 0.00, 0.00, $cg5$Trzech Króli (Objawienie Pańskie)
Kod arkusza: ŚWIĘTO
Import: RozliczenieGodzinowe / 01-2026$cg5$, $cg6$Trzech Króli (Objawienie Pańskie)$cg6$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-07', '1077', 'praca', 8.00, 0.00, $cg7$Obiekt: BDI
Opracowanie danych po terenie
06:30–14:30
Import: RozliczenieGodzinowe / 01-2026$cg7$, $cg8$Opracowanie danych po terenie$cg8$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-08', '1077', 'praca', 4.00, 0.00, $cg9$Obiekt: BDI
Opracowanie danych po terenie
06:30–10:30
nb-UW 10:30-14:30
Import: RozliczenieGodzinowe / 01-2026$cg9$, $cg10$Opracowanie danych po terenie$cg10$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-09', '1077', 'praca', 8.00, 0.00, $cg11$Obiekt: BDI
Opracowanie danych po terenie
06:45–14:45
Import: RozliczenieGodzinowe / 01-2026$cg11$, $cg12$Opracowanie danych po terenie$cg12$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-12', '1077', 'praca', 8.00, 0.00, $cg13$Obiekt: BDI
Opracowanie danych po terenie
06:30–14:30
Import: RozliczenieGodzinowe / 01-2026$cg13$, $cg14$Opracowanie danych po terenie$cg14$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-13', '1077', 'praca', 8.00, 0.00, $cg15$Obiekt: BDI
Opracowanie danych po terenie
06:30–14:30
Import: RozliczenieGodzinowe / 01-2026$cg15$, $cg16$Opracowanie danych po terenie$cg16$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-14', '', 'urlop', 8.00, 0.00, $cg17$Import: RozliczenieGodzinowe / 01-2026$cg17$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-15', '', 'urlop', 8.00, 0.00, $cg18$Import: RozliczenieGodzinowe / 01-2026$cg18$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-16', '', 'urlop', 8.00, 0.00, $cg19$Import: RozliczenieGodzinowe / 01-2026$cg19$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-19', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg20$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 01-2026$cg20$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-20', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg21$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 01-2026$cg21$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-21', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg22$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 01-2026$cg22$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-22', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg23$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 01-2026$cg23$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-23', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg24$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 01-2026$cg24$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-26', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg25$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 01-2026$cg25$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-27', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg26$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 01-2026$cg26$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-28', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg27$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 01-2026$cg27$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-29', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg28$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 01-2026$cg28$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-01-30', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg29$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 01-2026$cg29$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-02', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg30$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 02-2026$cg30$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-03', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg31$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 02-2026$cg31$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-04', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg32$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 02-2026$cg32$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-05', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg33$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 02-2026$cg33$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-06', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg34$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 02-2026$cg34$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-09', '1077', 'praca', 6.25, 0.00, $cg35$Obiekt: Kęty Podlesie
Korekty operatu
06:15–12:30
Import: RozliczenieGodzinowe / 02-2026$cg35$, $cg36$Korekty operatu$cg36$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-10', '1081', 'praca', 1.75, 0.00, $cg37$Obiekt: Jasło
Badanie KW
12:30–14:15
Import: RozliczenieGodzinowe / 02-2026$cg37$, $cg38$Badanie KW$cg38$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-10', '1081', 'praca', 8.00, 0.00, $cg39$Obiekt: Jasło
Badanie KW
06:30–14:30
Import: RozliczenieGodzinowe / 02-2026$cg39$, $cg40$Badanie KW$cg40$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-11', '1081', 'praca', 8.00, 0.00, $cg41$Obiekt: Jasło
Badanie KW
06:30–14:30
Import: RozliczenieGodzinowe / 02-2026$cg41$, $cg42$Badanie KW$cg42$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-12', '1081', 'praca', 8.00, 0.00, $cg43$Obiekt: Jasło
Badanie KW
06:30–14:30
Import: RozliczenieGodzinowe / 02-2026$cg43$, $cg44$Badanie KW$cg44$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-13', '1081', 'praca', 8.00, 0.00, $cg45$Obiekt: Jasło
Badanie KW
06:30–14:30
Import: RozliczenieGodzinowe / 02-2026$cg45$, $cg46$Badanie KW$cg46$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-16', '1081', 'praca', 7.50, 0.00, $cg47$Obiekt: Jasło
Badanie KW
06:45–14:15
Import: RozliczenieGodzinowe / 02-2026$cg47$, $cg48$Badanie KW$cg48$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-17', '1081', 'praca', 8.25, 0.00, $cg49$Obiekt: Jasło
Badanie KW
06:45–15:00
Import: RozliczenieGodzinowe / 02-2026$cg49$, $cg50$Badanie KW$cg50$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-18', '1081', 'praca', 8.25, 0.00, $cg51$Obiekt: Jasło
Badanie KW
06:45–15:00
Import: RozliczenieGodzinowe / 02-2026$cg51$, $cg52$Badanie KW$cg52$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-19', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg53$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 02-2026$cg53$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-20', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg54$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 02-2026$cg54$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-23', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg55$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 02-2026$cg55$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-24', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg56$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 02-2026$cg56$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-25', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg57$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 02-2026$cg57$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-26', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg58$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 02-2026$cg58$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-02-27', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg59$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 02-2026$cg59$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-03-02', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg60$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 03-2026$cg60$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-03-03', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg61$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 03-2026$cg61$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-03-04', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg62$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 03-2026$cg62$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-03-05', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg63$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 03-2026$cg63$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-03-06', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg64$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 03-2026$cg64$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-03-09', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg65$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 03-2026$cg65$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-03-10', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg66$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 03-2026$cg66$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-03-11', '', 'zwolnienie_lekarskie', 8.00, 0.00, $cg67$Kod arkusza: L4 - ciąża (nb-CH-C)
Import: RozliczenieGodzinowe / 03-2026$cg67$, NULL);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-04-05', '', 'inne', 0.00, 0.00, $cg68$Wielkanoc
Kod arkusza: ND-ŚWIĘTO
Import: RozliczenieGodzinowe / 04-2026$cg68$, $cg69$Wielkanoc$cg69$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-04-06', '', 'inne', 0.00, 0.00, $cg70$Poniedziałek Wielkanocny
Kod arkusza: ŚWIĘTO
Import: RozliczenieGodzinowe / 04-2026$cg70$, $cg71$Poniedziałek Wielkanocny$cg71$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-05-01', '', 'inne', 0.00, 0.00, $cg72$Święto Pracy
Kod arkusza: ŚWIĘTO
Import: RozliczenieGodzinowe / 05-2026$cg72$, $cg73$Święto Pracy$cg73$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-05-03', '', 'inne', 0.00, 0.00, $cg74$Święto Konstytucji 3 Maja
Kod arkusza: ND-ŚWIĘTO
Import: RozliczenieGodzinowe / 05-2026$cg74$, $cg75$Święto Konstytucji 3 Maja$cg75$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-05-24', '', 'inne', 0.00, 0.00, $cg76$Zielone Świątki
Kod arkusza: ND-ŚWIĘTO
Import: RozliczenieGodzinowe / 05-2026$cg76$, $cg77$Zielone Świątki$cg77$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-06-04', '', 'inne', 0.00, 0.00, $cg78$Boże Ciało
Kod arkusza: ŚWIĘTO
Import: RozliczenieGodzinowe / 06-2026$cg78$, $cg79$Boże Ciało$cg79$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-08-15', '', 'inne', 0.00, 0.00, $cg80$Wniebowzięcie NMP
Kod arkusza: ŚWIĘTO
Import: RozliczenieGodzinowe / 08-2026$cg80$, $cg81$Wniebowzięcie NMP$cg81$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-11-01', '', 'inne', 0.00, 0.00, $cg82$Wszystkich Świętych
Kod arkusza: ND-ŚWIĘTO
Import: RozliczenieGodzinowe / 11-2026$cg82$, $cg83$Wszystkich Świętych$cg83$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-11-11', '', 'inne', 0.00, 0.00, $cg84$Święto Niepodległości
Kod arkusza: ŚWIĘTO
Import: RozliczenieGodzinowe / 11-2026$cg84$, $cg85$Święto Niepodległości$cg85$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-12-24', '', 'inne', 0.00, 0.00, $cg86$Wigilia
Kod arkusza: ŚWIĘTO
Import: RozliczenieGodzinowe / 12-2026$cg86$, $cg87$Wigilia$cg87$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-12-25', '', 'inne', 0.00, 0.00, $cg88$Boże Narodzenie (I dzień)
Kod arkusza: ŚWIĘTO
Import: RozliczenieGodzinowe / 12-2026$cg88$, $cg89$Boże Narodzenie (I dzień)$cg89$);
INSERT INTO public.czas_pracy_wpis (pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie) VALUES ('225', '2026-12-26', '', 'inne', 0.00, 0.00, $cg90$Boże Narodzenie (II dzień)
Kod arkusza: ŚWIĘTO
Import: RozliczenieGodzinowe / 12-2026$cg90$, $cg91$Boże Narodzenie (II dzień)$cg91$);
COMMIT;
