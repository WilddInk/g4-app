-- =============================================================================
-- Poprawki literówek w protokołach / tematach spotkań kierowników i notatkach KR
-- Źródło: dyktowanie (spotkania 2026-09-02 i 2026-10-02).
-- Sens, prefiksy mówców (AH/DM/MJ/Mi/GF), emoji zadań, nazwiska i numery KR bez zmian.
--
-- Supabase → SQL Editor → Run (jedyna pewna droga zapisu; REST PATCH przy RLS
-- zwraca 200, ale 0 wierszy).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Tematy spotkań (spotkanie_kierownikow_temat.tresc)
-- ---------------------------------------------------------------------------
-- temat id=56 KR 1052 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = '✅ Zadanie dla 023 — Damian Markiewicz: Porozliczać podwykonawców - wyślij proszę przybliżoną listę podwykonawców, którzy uczestniczyli w temacie - ja ze swojej strony sprawdzę faktury i płatności.' WHERE id = 56;

-- temat id=57 KR 1052 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'MJ:  w kolejnych tematach - będzie zapis że trzeba określić ilość stabilizacji - od punktu do punktu - przedział - bo w tym wypadku nie wstrzeliliśmy się z wyceną' WHERE id = 57;

-- temat id=59 KR 1068 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'MJ: Michał musi dzwonić, bo inaczej się nie da' WHERE id = 59;

-- temat id=60 KR 1070 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'DM: Królik by zrobił nam to taniej, ale trzeba by użyć mniejszych kamieni. Generalna to może zatwierdzić, ale dyrektor kontraktu mówi że wtedy może obniżyć cenę. Czekamy do poniedziałku, jak nie będzie odzewu to robimy na starych kamieniach' WHERE id = 60;

-- temat id=61 KR 1071 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'DM: Marcin działa dalej' WHERE id = 61;

-- temat id=63 KR 1073 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'DM: Wszystkie wyceny są już zrobione,' WHERE id = 63;

-- temat id=64 KR 1075 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'AH:  Bez komentarza. Wysyłają zakres inwestycji - w zakresie jest pocięty teren kolejowy.' WHERE id = 64;

-- temat id=65 KR 1075 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'MJ: Na spotkaniach trzeba to poruszyć' WHERE id = 65;

-- temat id=66 KR 1075 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'AH: Ogarnięta osoba odeszła z firmy, nie ogarniają zakresu' WHERE id = 66;

-- temat id=67 KR 1075 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'MJ:  Dzwonił Krzysztof Sroga on powiedział, że o co nam chodzi - jak nie mamy linii to wiadomo że nie zrobimy roboty i nie będzie z tego konsekwencji, że to oczywiste.' WHERE id = 67;

-- temat id=68 KR 1077 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = E'DM: Wysłaliśmy pismo\nGF:  nie ma informacji, że jest źle - mamy tylko 1 uwagę. Maślerz podpisał coś w naszym imieniu jeżeli chodzi o aktualizację mapy.\nAH:  Poszerzenia czy mają być z granicami ?\nGF: Darek Gala by się nadał przy poszerzeniach\nDM: Czy trzeba poszerzenia wycenić ?\nMJ: Nie wiadomo, bo mamy jednostkową wycenę, ale możemy spróbować wycenić.\nGF: Ale nie odebrali głównej roboty\nMi: Będę gadał z Michałem' WHERE id = 68;

-- temat id=69 KR 1079 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = E'GF: Składamy operat, domierzamy braki, jednej rzeczy której nam brakuje, to porcelanowe garaże. Składamy dopiero jak Ania Homik zrobi granice\nAH: Mamy operat zweryfikowany. Andrychów jest w ostatecznej weryfikacji - Darek Gala uratował nam teren\nDM: Jak się współpracuje z Wadowicami\nAH: jest tam 10 inspektorów i każdy jest inny. Każdy jest teoretykiem nie praktykiem. Andrychów przejdzie.' WHERE id = 69;

-- temat id=70 KR 1081 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = '✅ Zadanie dla 003 — Małgorzata Franczak: Mi: Musiał wysłał informację, że zostaniemy obciążeni kosztami  - Gosia ma napisać grzecznego maila, że robimy i stoimy na wysokości zadania i straszenie nas nie wpływa dobrze' WHERE id = 70;

-- temat id=71 KR 1081 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'Mi: Musiał wysłał informację, że zostaniemy obciążeni kosztami  - Gosia ma napisać grzecznego maila, że robimy i stoimy na wysokości zadania i straszenie nas nie wpływa dobrze' WHERE id = 71;

-- temat id=73 KR 1081 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'Kamil Bednarz - umowa stara, a teraz nowa - na 1081 robił zieleń.  - Damian ma wysłać dane do umowy' WHERE id = 73;

-- temat id=74 KR 1082 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'AH: Nie mamy więcej zleceń. Składamy do generalnej, Teraz będzie największa kwota, jak pani da protokół to będziemy mogli fakturę wystawić' WHERE id = 74;

-- temat id=75 KR 1083 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'DM: Poprosiliśmy o zrzeczenia i trzeba zadzwonić żeby się dowiedzieć co dalej, bo powinni to już sprawdzić i powinni zwrócić zabezpieczenie' WHERE id = 75;

-- temat id=76 KR 1084 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'AH: Robiliśmy dodatkowe rzeczy. Ola wysłała poprawkę - mamy klauzulę i musimy sprawdzić czy jest już klauzula. Gdy będzie Klauzula to będziemy fakturować.' WHERE id = 76;

-- temat id=77 KR 1084 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = '✅ Zadanie dla 023 — Damian Markiewicz: AH: Robiliśmy dodatkowe rzeczy. Ola wysłała poprawkę - mamy klauzulę i musimy sprawdzić czy jest już klauzula. Gdy będzie Klauzula to będziemy fakturować.' WHERE id = 77;

-- temat id=78 KR 1085 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = E'AH: robimy podziały, ale to nie są działki Wód Polskich tylko lasów.... i żeby zrobić podział to trzeba wniosek złożyć, ale nikt nie wie kto ma składać wnioski. Działamy w temacie\nDM: Czy dużo tam jest roboty ?\nAH: Działa na tym tylko Darek, będziemy próbować to kameralnie robić' WHERE id = 78;

-- temat id=79 KR 1087 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = '✅ Zadanie dla 023 — Damian Markiewicz: DM: Przygotować umowę' WHERE id = 79;

-- temat id=80 KR 1087 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = E'✅ Zadanie dla 003 — Małgorzata Franczak: DM: Przygotować umowę\nGF: Możliwe że uda się to zrobić bez wyjścia w teren\nAH: Ola jest na 1/3 analizy\nDM: My mamy zaproponować terminy' WHERE id = 80;

-- temat id=81 KR 1087 (spotkanie 3)
UPDATE public.spotkanie_kierownikow_temat SET tresc = E'DM: Przygotować umowę\nGF: Możliwe że uda się to zrobić bez wyjścia w teren\nAH: Ola jest na 1/3 analizy\nDM: My mamy zaproponować terminy. Dziewczyny mają zaproponować terminy.\nDM: To jest bardzo małe - 30 ha' WHERE id = 81;

-- temat id=1 KR 1038 (spotkanie 1)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'Koniec tematu - wystawiona faktura, zwrot zabezpieczenia ma być. Mamy wystąpić. Miesiąc po ostatnim protokole.' WHERE id = 1;

-- temat id=2 KR 1039 (spotkanie 1)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'Katowice - Legnica. Dzisiaj Michał ma dostać odpowiedź w sprawie rozliczeń. Piotr ma coś zaproponować, żeby OTS - jeszcze żył. Zobaczymy co dzisiaj napisze. Geotes też się morduje z nimi.' WHERE id = 2;

-- temat id=4 KR 1049 (spotkanie 1)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'Oświęcim - odkrywki, mamy jeszcze zatrzymania - wysłane pismo. Trzeba sprawdzić to pismo w sprawie zatrzymań.' WHERE id = 4;

-- temat id=6 KR 1052 (spotkanie 1)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'Decyzja wydana, nie jest ostateczna. Mamy zrobić opisy nieruchomości. Dostaliśmy już kasę - wypadałoby się porozliczać z podwykonawcami. Dostaliśmy kasę jakiś czas temu.  Co ze stabilizacją, Gędęk - około 3000 punktów. - 500 tys. Gdyby chcieli tak jak Dolota chciała, to będzie razy 4. To pochłonie cały temat. Sporządzenie wniosków do sądów wieczystoksięgowych - tam jest 60 tysięcy.' WHERE id = 6;

-- temat id=9 KR 1070 (spotkanie 1)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'Ośrodek chciałby decyzji zamiennej, ale to nie wchodzi w grę. Co zrobimy ze stabilizacją ? Dwa obręby są zablokowane przez 2 działki. Budimex będzie cisnął Arcadis, a Arcadis będzie nas cisnął. Możemy to fizycznie zrobić, ale bez protokołów. Co powiedzieć Królikowi - on musi kamienie zrobić, on musi przejść i sprawdzić w terenie jak to wygląda ile potrzebuje kamieni do stabilizacji. My chcemy żeby to było odebrane. 2 obręby to musimy ustalić, bo tam nie ma ujawnionego podziału, i musimy zrobić tak, żeby zastabilizować ale bez protokołu. 20-30 punktów to zagęszczenie linii podziałowej. Na razie nie gadamy z Naporą, dogadajmy się na ryczałt. Więcej punktów się nie pojawi, Wyjdzie 600 punktów tak około. Z Królikiem trzeba będzie przegadać, żeby sobie sam przeszedł teren i ocenił zakres prac i ilość graniczników. Możemy się z Królikiem dogadać - on sam produkuje kamienie.' WHERE id = 9;

-- temat id=13 KR 1073 (spotkanie 1)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'Mamy poprawki, zostało jeszcze około 200 k.  Gosia: my mamy zmiany związane z podziałami. Mamy poprawkę na Orlenie - tak wygląda sytuacja, że Boruta się sam kontaktuje z Orlenem. Koszt wykonania na terenie Orlenu jest duży.' WHERE id = 13;

-- temat id=14 KR 1075 (spotkanie 1)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'Kozłów Psary - wystawiłam fakturę, na podstawie jednego protokołu. i tyle, mapy były wystawione wcześniej.  Czy mamy jeszcze podstawę fakturowania ? Jest napisane przekażemy do klauzuli mapy i podziały we wrześniu. Na pewno nie będziemy mieć klauzuli kolejowej - bo to strasznie długo trwa.  W Krakowie każdą jedną kartkę trzeba podpisać.' WHERE id = 14;

-- temat id=19 KR 1077 (spotkanie 1)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'Jutro zawieziemy mapy, nie jest kłopot z zawiezieniem. Maślerz musi sobie to poukładać.' WHERE id = 19;

-- temat id=20 KR 1079 (spotkanie 1)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'BDI - odcinek dla Promost Consulting - mamy tam w cholerę etapów. Chłopaki mówią, że mają tam domierzać pojedyncze miejsca. Zaczynamy składać operat. Musimy pogadać z Darkiem Galą, ale wcześniej się trzeba rozliczyć. Na kiedy jest planowana klauzula ? Klauzula map jest połączona z ewidencją - mapa jest uzależniona od ewidencji. Gosia nie wróci. 30 października to będzie najwcześniej złożone - tam dokładnie nam trzymają 30 dni w klauzuli. W umowie jest do 17 maja 2027. Gdy dziewczyny zrobią ewidencję. Ania ma czas do 14 lipca 2027. Podziały na lipiec. Mariusz jak skończy robić Adrianowi, to zacznie robić Wadowice. Gosia mówi, że jak będzie ewidencja to złożą od razu. Pytanie ? Czy jak mamy tak późne terminy, to czy będziemy mogli się wcześniej rozliczyć za mapę ? Damian musi teren dogadać. Tylko trzeba się porozliczać.' WHERE id = 20;

-- temat id=21 KR 1081 (spotkanie 1)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'Sky snap - nie zapłacony. Robimy inwentaryzację zieleni, najpierw zgeneralizowane, ale potem będziemy musieli zrobić drugi raz. Musiał mówił, że 14 października jest termin nie przekraczalny. 14 listopada projektanci składają, a my musimy złożyć miesiąc wcześniej, ale nie mamy linii.  Ewidencję mamy przyjętą w 90 procent. Mamy tam możliwość rozliczenia mapy poszerzonej. Rozliczaliśmy roboczą mapę, ortofotomapę - rozliczaliśmy i 80% mapy roboczej, tylko małej powierzchni. Nie będzie już poszerzeń, a nawet jak będą to musi iść osobnym zleceniem.' WHERE id = 21;

-- temat id=22 KR 1081 (spotkanie 1)
UPDATE public.spotkanie_kierownikow_temat SET tresc = '188 ha jest rozliczone - jest jeden protokół na obwodnicę Jasła. Gosia mówi, że poszerzenia były 2 razy, ale nie możemy znaleźć kiedy.' WHERE id = 22;

-- temat id=23 KR 1082 (spotkanie 1)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'Jutro będzie faktura jeszcze raz po uwagach teczki i koszuli, znowu będzie 20 dni na weryfikację i potem będziemy mogli wystawić kolejną fakturę.' WHERE id = 23;

-- temat id=24 KR 1083 (spotkanie 1)
UPDATE public.spotkanie_kierownikow_temat SET tresc = 'Wszystkie faktury wystawione na 137 k netto, mieli zapłacić wczoraj.' WHERE id = 24;

-- ---------------------------------------------------------------------------
-- Protokoły spotkań (spotkanie_kierownikow.protokol)
-- ---------------------------------------------------------------------------

-- protokół spotkania id=3 data=2026-10-02
UPDATE public.spotkanie_kierownikow SET protokol = E'NOTATKA ZE SPOTKANIA KIEROWNIKÓW\nOkres: 02.10.2026, 09:30 – 02.10.2026, 12:00\nProjekty (KR): 1052, 1061, 1068, 1070, 1071, 1073, 1075, 1077, 1079, 1081, 1082, 1083, 1084, 1085, 1087\nLiczba wpisów: 27\n\n————————————————————————\nKR 1052\n09:52  ✅ Zadanie dla 001 — Monika Jakubowska: Porozliczać podwykonawców\n09:52  ✅ Zadanie dla 023 — Damian Markiewicz: Porozliczać podwykonawców - wyślij proszę przybliżoną listę podwykonawców, którzy uczestniczyli w temacie - ja ze swojej strony sprawdzę faktury i płatności.\n09:54  MJ: w kolejnych tematach - będzie zapis że trzeba określić ilość stabilizacji - od punktu do punktu - przedział - bo w tym wypadku nie wstrzeliliśmy się z wyceną\n\n————————————————————————\nKR 1061\n09:55  AH: Ania napisała maila i bez odzewu  - cisza\n\n————————————————————————\nKR 1068\n09:56  MJ: Michał musi dzwonić, bo inaczej się nie da\n\n————————————————————————\nKR 1070\n09:58  DM: Królik by zrobił nam to taniej, ale trzeba by użyć mniejszych kamieni. Generalna to może zatwierdzić, ale dyrektor kontraktu mówi że wtedy może obniżyć cenę. Czekamy do poniedziałku, jak nie będzie odzewu to robimy na starych kamieniach\n\n————————————————————————\nKR 1071\n09:58  DM: Marcin działa dalej\n\n————————————————————————\nKR 1073\n09:59  GF: Mapy nadal w ośrodku\n09:59  DM: Wszystkie wyceny są już zrobione,\n\n————————————————————————\nKR 1075\n10:00  AH: Bez komentarza. Wysyłają zakres inwestycji - w zakresie jest pocięty teren kolejowy.\n10:00  MJ: Na spotkaniach trzeba to poruszyć\n10:00  AH: Ogarnięta osoba odeszła z firmy, nie ogarniają zakresu\n10:06  MJ: Dzwonił Krzysztof Sroga on powiedział, że o co nam chodzi - jak nie mamy linii to wiadomo że nie zrobimy roboty i nie będzie z tego konsekwencji, że to oczywiste.\n\n————————————————————————\nKR 1077\n10:09  DM: Wysłaliśmy pismo\n    GF: nie ma informacji, że jest źle - mamy tylko 1 uwagę. Maślerz podpisał coś w naszym imieniu jeżeli chodzi o aktualizację mapy.\n    AH: Poszerzenia czy mają być z granicami ?\n    GF: Darek Gala by się nadał przy poszerzeniach\n    DM: Czy trzeba poszerzenia wycenić ?\n    MJ: Nie wiadomo, bo mamy jednostkową wycenę, ale możemy spróbować wycenić.\n    GF: Ale nie odebrali głównej roboty\n    Mi: Będę gadał z Michałem\n\n————————————————————————\nKR 1079\n10:11  GF: Składamy operat, domierzamy braki, jednej rzeczy której nam brakuje, to porcelanowe garaże. Składamy dopiero jak Ania Homik zrobi granice\n    AH: Mamy operat zweryfikowany. Andrychów jest w ostatecznej weryfikacji - Darek Gala uratował nam teren\n    DM: Jak się współpracuje z Wadowicami\n    AH: jest tam 10 inspektorów i każdy jest inny. Każdy jest teoretykiem nie praktykiem. Andrychów przejdzie.\n\n————————————————————————\nKR 1081\n10:15  ✅ Zadanie dla 003 — Małgorzata Franczak: Mi: Musiał wysłał informację, że zostaniemy obciążeni kosztami  - Gosia ma napisać grzecznego maila, że robimy i stoimy na wysokości zadania i straszenie nas nie wpływa dobrze\n10:15  Mi: Musiał wysłał informację, że zostaniemy obciążeni kosztami  - Gosia ma napisać grzecznego maila, że robimy i stoimy na wysokości zadania i straszenie nas nie wpływa dobrze\n10:18  ✅ Zadanie dla 001 — Monika Jakubowska: Kamil Bednarz - umowa stara, a teraz nowa - na 1081 robił zieleń.\n10:19  Kamil Bednarz - umowa stara, a teraz nowa - na 1081 robił zieleń.  - Damian ma wysłać dane do umowy\n\n————————————————————————\nKR 1082\n10:22  AH: Nie mamy więcej zleceń. Składamy do generalnej, Teraz będzie największa kwota, jak pani da protokół to będziemy mogli fakturę wystawić\n\n————————————————————————\nKR 1083\n10:22  DM: Poprosiliśmy o zrzeczenia i trzeba zadzwonić żeby się dowiedzieć co dalej, bo powinni to już sprawdzić i powinni zwrócić zabezpieczenie\n\n————————————————————————\nKR 1084\n10:23  AH: Robiliśmy dodatkowe rzeczy. Ola wysłała poprawkę - mamy klauzulę i musimy sprawdzić czy jest już klauzula. Gdy będzie Klauzula to będziemy fakturować.\n10:23  ✅ Zadanie dla 023 — Damian Markiewicz: AH: Robiliśmy dodatkowe rzeczy. Ola wysłała poprawkę - mamy klauzulę i musimy sprawdzić czy jest już klauzula. Gdy będzie Klauzula to będziemy fakturować.\n\n————————————————————————\nKR 1085\n10:25  AH: robimy podziały, ale to nie są działki Wód Polskich tylko lasów.... i żeby zrobić podział to trzeba wniosek złożyć, ale nikt nie wie kto ma składać wnioski. Działamy w temacie\n    DM: Czy dużo tam jest roboty ?\n    AH: Działa na tym tylko Darek, będziemy próbować to kameralnie robić\n\n————————————————————————\nKR 1087\n10:25  ✅ Zadanie dla 023 — Damian Markiewicz: DM: Przygotować umowę\n10:26  ✅ Zadanie dla 003 — Małgorzata Franczak: DM: Przygotować umowę\n    GF: Możliwe że uda się to zrobić bez wyjścia w teren\n    AH: Ola jest na 1/3 analizy\n    DM: My mamy zaproponować terminy\n10:28  DM: Przygotować umowę\n    GF: Możliwe że uda się to zrobić bez wyjścia w teren\n    AH: Ola jest na 1/3 analizy\n    DM: My mamy zaproponować terminy. Dziewczyny mają zaproponować terminy.\n    DM: To jest bardzo małe - 30 ha\n' WHERE id = 3;

-- protokół spotkania id=1 data=2026-09-02
UPDATE public.spotkanie_kierownikow SET protokol = E'NOTATKA ZE SPOTKANIA KIEROWNIKÓW\nOkres: 02.09.2026, 08:53 – 02.09.2026, 12:53\nProjekty (KR): 1038, 1039, 1049, 1051, 1052, 1068, 1070, 1071, 1073, 1074, 1075, 1077, 1079, 1081, 1082, 1083\nLiczba wpisów: 27\n\n————————————————————————\n02.09.2026, 10:09  ·  KR 1038\nKoniec tematu - wystawiona faktura, zwrot zabezpieczenia ma być. Mamy wystąpić. Miesiąc po ostatnim protokole.\n\n————————————————————————\n02.09.2026, 10:10  ·  KR 1039\nKatowice - Legnica. Dzisiaj Michał ma dostać odpowiedź w sprawie rozliczeń. Piotr ma coś zaproponować, żeby OTS - jeszcze żył. Zobaczymy co dzisiaj napisze. Geotes też się morduje z nimi.\n\n————————————————————————\n02.09.2026, 10:11  ·  KR 1039\nPoszła informacja, że nasze dane zostały wykorzystane.\n\n————————————————————————\n02.09.2026, 10:12  ·  KR 1049\nOświęcim - odkrywki, mamy jeszcze zatrzymania - wysłane pismo. Trzeba sprawdzić to pismo w sprawie zatrzymań.\n\n————————————————————————\n02.09.2026, 10:13  ·  KR 1074\nTemat zakończony, nie ma decyzji - może wrócić w sprawie ponownych klauzul\n\n————————————————————————\n02.09.2026, 10:16  ·  KR 1052\nDecyzja wydana, nie jest ostateczna. Mamy zrobić opisy nieruchomości. Dostaliśmy już kasę - wypadałoby się porozliczać z podwykonawcami. Dostaliśmy kasę jakiś czas temu.  Co ze stabilizacją, Gędęk - około 3000 punktów. - 500 tys. Gdyby chcieli tak jak Dolota chciała, to będzie razy 4. To pochłonie cały temat. Sporządzenie wniosków do sądów wieczystoksięgowych - tam jest 60 tysięcy.\n\n————————————————————————\n02.09.2026, 10:17  ·  KR 1051\nJeszcze nie ujawnione zmiany. - tam będą wpisy do KW do zrobienia.\n\n————————————————————————\n02.09.2026, 10:20  ·  KR 1068\nWszystko podpisane, odwiezione wczoraj do MPMostów, Ania szczęśliwa. Wystawić fakturę, ale to jeszcze daleko.  Trzeba napisać w skrócie, MPMosty muszą się z nami dogadać finansowo. Mamy tam komplet łącznie ze stabilizacją. To nie jest zaprojektuj wybuduj, to jest tylko projekt. Nikt nie będzie burzył płotów. Trzeba będzie stabilizować - zaznaczać w terenie róg płotu.\n\n————————————————————————\n02.09.2026, 10:25  ·  KR 1070\nOśrodek chciałby decyzji zamiennej, ale to nie wchodzi w grę. Co zrobimy ze stabilizacją ? Dwa obręby są zablokowane przez 2 działki. Budimex będzie cisnął Arcadis, a Arcadis będzie nas cisnął. Możemy to fizycznie zrobić, ale bez protokołów. Co powiedzieć Królikowi - on musi kamienie zrobić, on musi przejść i sprawdzić w terenie jak to wygląda ile potrzebuje kamieni do stabilizacji. My chcemy żeby to było odebrane. 2 obręby to musimy ustalić, bo tam nie ma ujawnionego podziału, i musimy zrobić tak, żeby zastabilizować ale bez protokołu. 20-30 punktów to zagęszczenie linii podziałowej. Na razie nie gadamy z Naporą, dogadajmy się na ryczałt. Więcej punktów się nie pojawi, Wyjdzie 600 punktów tak około. Z Królikiem trzeba będzie przegadać, żeby sobie sam przeszedł teren i ocenił zakres prac i ilość graniczników. Możemy się z Królikiem dogadać - on sam produkuje kamienie.\n\n————————————————————————\n02.09.2026, 10:26  ·  KR 1071\nDecyzja - koniec sierpnia. Myśmy wszystko przekazali, koniec września pewnie będzie decyzja. Teraz musimy zrobić opisy nieruchomości. Trzeba dogadać z Hajokiem sposób rozliczenia.\n\n————————————————————————\n02.09.2026, 10:26  ·  KR 1071\n✅ Zadanie dla 023 — Damian Markiewicz: Decyzja - koniec sierpnia. Myśmy wszystko przekazali, koniec września pewnie będzie decyzja. Teraz musimy zrobić opisy nieruchomości. Trzeba dogadać z Hajokiem sposób rozliczenia.\n\n————————————————————————\n02.09.2026, 10:27  ·  KR 1071\nMożemy połączyć tematy dla Królika - będzie łatwiej gadać o kasie.\n\n————————————————————————\n02.09.2026, 10:29  ·  KR 1073\nMamy poprawki, zostało jeszcze około 200 k.  Gosia: my mamy zmiany związane z podziałami. Mamy poprawkę na Orlenie - tak wygląda sytuacja, że Boruta się sam kontaktuje z Orlenem. Koszt wykonania na terenie Orlenu jest duży.\n\n————————————————————————\n02.09.2026, 10:33  ·  KR 1075\nKozłów Psary - wystawiłam fakturę, na podstawie jednego protokołu. i tyle, mapy były wystawione wcześniej.  Czy mamy jeszcze podstawę fakturowania ? Jest napisane przekażemy do klauzuli mapy i podziały we wrześniu. Na pewno nie będziemy mieć klauzuli kolejowej - bo to strasznie długo trwa.  W Krakowie każdą jedną kartkę trzeba podpisać.\n\n————————————————————————\n02.09.2026, 10:34  ·  KR 1075\n✅ Zadanie dla 001 — Monika Jakubowska: Wystawić dodatkowo fakturę - uciekł jeden protokół za osnowę.\n\n————————————————————————\n02.09.2026, 10:36  ·  KR 1077\nBDI - dostaliśmy uwagi od Generalnej, nie trzeba robić klauzuli ponownej. Nie wydrukowała się legenda.\n\n————————————————————————\n02.09.2026, 10:37  ·  KR 1077\nW specyfikacji nie ma napisane że ma być pieczątka z klauzuli.\n\n————————————————————————\n02.09.2026, 10:38  ·  KR 1077\nPoprawki nie są jakieś niewiadomo co, po prostu się nie wydrukowały linie.\n\n————————————————————————\n02.09.2026, 10:38  ·  KR 1077\nJutro zawieziemy mapy, nie jest kłopot z zawiezieniem. Maślerz musi sobie to poukładać.\n\n————————————————————————\n02.09.2026, 10:45  ·  KR 1079\nBDI - odcinek dla Promost Consulting - mamy tam w cholerę etapów. Chłopaki mówią, że mają tam domierzać pojedyncze miejsca. Zaczynamy składać operat. Musimy pogadać z Darkiem Galą, ale wcześniej się trzeba rozliczyć. Na kiedy jest planowana klauzula ? Klauzula map jest połączona z ewidencją - mapa jest uzależniona od ewidencji. Gosia nie wróci. 30 października to będzie najwcześniej złożone - tam dokładnie nam trzymają 30 dni w klauzuli. W umowie jest do 17 maja 2027. Gdy dziewczyny zrobią ewidencję. Ania ma czas do 14 lipca 2027. Podziały na lipiec. Mariusz jak skończy robić Adrianowi, to zacznie robić Wadowice. Gosia mówi, że jak będzie ewidencja to złożą od razu. Pytanie ? Czy jak mamy tak późne terminy, to czy będziemy mogli się wcześniej rozliczyć za mapę ? Damian musi teren dogadać. Tylko trzeba się porozliczać.\n\n————————————————————————\n02.09.2026, 10:48  ·  KR 1081\nSky snap - nie zapłacony. Robimy inwentaryzację zieleni, najpierw zgeneralizowane, ale potem będziemy musieli zrobić drugi raz. Musiał mówił, że 14 października jest termin nie przekraczalny. 14 listopada projektanci składają, a my musimy złożyć miesiąc wcześniej, ale nie mamy linii.  Ewidencję mamy przyjętą w 90 procent. Mamy tam możliwość rozliczenia mapy poszerzonej. Rozliczaliśmy roboczą mapę, ortofotomapę - rozliczaliśmy i 80% mapy roboczej, tylko małej powierzchni. Nie będzie już poszerzeń, a nawet jak będą to musi iść osobnym zleceniem.\n\n————————————————————————\n02.09.2026, 10:51  ·  KR 1081\n188 ha jest rozliczone - jest jeden protokół na obwodnicę Jasła. Gosia mówi, że poszerzenia były 2 razy, ale nie możemy znaleźć kiedy.\n\n————————————————————————\n02.09.2026, 10:55  ·  KR 1082\nJutro będzie faktura jeszcze raz po uwagach teczki i koszuli, znowu będzie 20 dni na weryfikację i potem będziemy mogli wystawić kolejną fakturę.\n\n————————————————————————\n02.09.2026, 10:55  ·  KR 1083\nWszystkie faktury wystawione na 137 k netto, mieli zapłacić wczoraj.\n\n————————————————————————\n02.09.2026, 10:56  ·  KR 1083\nDamian ma gotowe pismo o zwrot zabezpieczenia - dzisiaj będzie Damian wysyłał. To robił Darek Gala i co możemy rozliczyć.\n\n————————————————————————\n02.09.2026, 11:01  ·  KR 1083\n✅ Zadanie dla 023 — Damian Markiewicz: Damian ma gotowe pismo o zwrot zabezpieczenia - dzisiaj będzie Damian wysyłał. To robił Darek Gala i co możemy rozliczyć.\n\n————————————————————————\n02.09.2026, 11:25  ·  KR 1081\n266 ha - klauzula - bez klauzuli - 37 ha MDCP\n' WHERE id = 1;

-- ---------------------------------------------------------------------------
-- Notatki KR z tych samych dni (kr_notatka.tresc)
-- ---------------------------------------------------------------------------

-- notatka id=70 KR 1052
UPDATE public.kr_notatka SET tresc = '✅ Zadanie dla 023 — Damian Markiewicz: Porozliczać podwykonawców - wyślij proszę przybliżoną listę podwykonawców, którzy uczestniczyli w temacie - ja ze swojej strony sprawdzę faktury i płatności.' WHERE id = 70;

-- notatka id=71 KR 1052
UPDATE public.kr_notatka SET tresc = 'MJ:  w kolejnych tematach - będzie zapis że trzeba określić ilość stabilizacji - od punktu do punktu - przedział - bo w tym wypadku nie wstrzeliliśmy się z wyceną' WHERE id = 71;

-- notatka id=73 KR 1068
UPDATE public.kr_notatka SET tresc = 'MJ: Michał musi dzwonić, bo inaczej się nie da' WHERE id = 73;

-- notatka id=74 KR 1070
UPDATE public.kr_notatka SET tresc = 'DM: Królik by zrobił nam to taniej, ale trzeba by użyć mniejszych kamieni. Generalna to może zatwierdzić, ale dyrektor kontraktu mówi że wtedy może obniżyć cenę. Czekamy do poniedziałku, jak nie będzie odzewu to robimy na starych kamieniach' WHERE id = 74;

-- notatka id=75 KR 1071
UPDATE public.kr_notatka SET tresc = 'DM: Marcin działa dalej' WHERE id = 75;

-- notatka id=77 KR 1073
UPDATE public.kr_notatka SET tresc = 'DM: Wszystkie wyceny są już zrobione,' WHERE id = 77;

-- notatka id=78 KR 1075
UPDATE public.kr_notatka SET tresc = 'AH:  Bez komentarza. Wysyłają zakres inwestycji - w zakresie jest pocięty teren kolejowy.' WHERE id = 78;

-- notatka id=79 KR 1075
UPDATE public.kr_notatka SET tresc = 'MJ: Na spotkaniach trzeba to poruszyć' WHERE id = 79;

-- notatka id=80 KR 1075
UPDATE public.kr_notatka SET tresc = 'AH: Ogarnięta osoba odeszła z firmy, nie ogarniają zakresu' WHERE id = 80;

-- notatka id=81 KR 1075
UPDATE public.kr_notatka SET tresc = 'MJ:  Dzwonił Krzysztof Sroga on powiedział, że o co nam chodzi - jak nie mamy linii to wiadomo że nie zrobimy roboty i nie będzie z tego konsekwencji, że to oczywiste.' WHERE id = 81;

-- notatka id=82 KR 1077
UPDATE public.kr_notatka SET tresc = E'DM: Wysłaliśmy pismo\nGF:  nie ma informacji, że jest źle - mamy tylko 1 uwagę. Maślerz podpisał coś w naszym imieniu jeżeli chodzi o aktualizację mapy.\nAH:  Poszerzenia czy mają być z granicami ?\nGF: Darek Gala by się nadał przy poszerzeniach\nDM: Czy trzeba poszerzenia wycenić ?\nMJ: Nie wiadomo, bo mamy jednostkową wycenę, ale możemy spróbować wycenić.\nGF: Ale nie odebrali głównej roboty\nMi: Będę gadał z Michałem' WHERE id = 82;

-- notatka id=83 KR 1079
UPDATE public.kr_notatka SET tresc = E'GF: Składamy operat, domierzamy braki, jednej rzeczy której nam brakuje, to porcelanowe garaże. Składamy dopiero jak Ania Homik zrobi granice\nAH: Mamy operat zweryfikowany. Andrychów jest w ostatecznej weryfikacji - Darek Gala uratował nam teren\nDM: Jak się współpracuje z Wadowicami\nAH: jest tam 10 inspektorów i każdy jest inny. Każdy jest teoretykiem nie praktykiem. Andrychów przejdzie.' WHERE id = 83;

-- notatka id=84 KR 1081
UPDATE public.kr_notatka SET tresc = '✅ Zadanie dla 003 — Małgorzata Franczak: Mi: Musiał wysłał informację, że zostaniemy obciążeni kosztami  - Gosia ma napisać grzecznego maila, że robimy i stoimy na wysokości zadania i straszenie nas nie wpływa dobrze' WHERE id = 84;

-- notatka id=85 KR 1081
UPDATE public.kr_notatka SET tresc = 'Mi: Musiał wysłał informację, że zostaniemy obciążeni kosztami  - Gosia ma napisać grzecznego maila, że robimy i stoimy na wysokości zadania i straszenie nas nie wpływa dobrze' WHERE id = 85;

-- notatka id=88 KR 1081
UPDATE public.kr_notatka SET tresc = 'Kamil Bednarz - umowa stara, a teraz nowa - na 1081 robił zieleń.  - Damian ma wysłać dane do umowy' WHERE id = 88;

-- notatka id=89 KR 1082
UPDATE public.kr_notatka SET tresc = 'AH: Nie mamy więcej zleceń. Składamy do generalnej, Teraz będzie największa kwota, jak pani da protokół to będziemy mogli fakturę wystawić' WHERE id = 89;

-- notatka id=90 KR 1083
UPDATE public.kr_notatka SET tresc = 'DM: Poprosiliśmy o zrzeczenia i trzeba zadzwonić żeby się dowiedzieć co dalej, bo powinni to już sprawdzić i powinni zwrócić zabezpieczenie' WHERE id = 90;

-- notatka id=91 KR 1084
UPDATE public.kr_notatka SET tresc = 'AH: Robiliśmy dodatkowe rzeczy. Ola wysłała poprawkę - mamy klauzulę i musimy sprawdzić czy jest już klauzula. Gdy będzie Klauzula to będziemy fakturować.' WHERE id = 91;

-- notatka id=92 KR 1084
UPDATE public.kr_notatka SET tresc = '✅ Zadanie dla 023 — Damian Markiewicz: AH: Robiliśmy dodatkowe rzeczy. Ola wysłała poprawkę - mamy klauzulę i musimy sprawdzić czy jest już klauzula. Gdy będzie Klauzula to będziemy fakturować.' WHERE id = 92;

-- notatka id=93 KR 1085
UPDATE public.kr_notatka SET tresc = E'AH: robimy podziały, ale to nie są działki Wód Polskich tylko lasów.... i żeby zrobić podział to trzeba wniosek złożyć, ale nikt nie wie kto ma składać wnioski. Działamy w temacie\nDM: Czy dużo tam jest roboty ?\nAH: Działa na tym tylko Darek, będziemy próbować to kameralnie robić' WHERE id = 93;

-- notatka id=94 KR 1087
UPDATE public.kr_notatka SET tresc = '✅ Zadanie dla 023 — Damian Markiewicz: DM: Przygotować umowę' WHERE id = 94;

-- notatka id=95 KR 1087
UPDATE public.kr_notatka SET tresc = E'✅ Zadanie dla 003 — Małgorzata Franczak: DM: Przygotować umowę\nGF: Możliwe że uda się to zrobić bez wyjścia w teren\nAH: Ola jest na 1/3 analizy\nDM: My mamy zaproponować terminy' WHERE id = 95;

-- notatka id=96 KR 1087
UPDATE public.kr_notatka SET tresc = E'DM: Przygotować umowę\nGF: Możliwe że uda się to zrobić bez wyjścia w teren\nAH: Ola jest na 1/3 analizy\nDM: My mamy zaproponować terminy. Dziewczyny mają zaproponować terminy.\nDM: To jest bardzo małe - 30 ha' WHERE id = 96;

-- notatka id=4 KR 1038
UPDATE public.kr_notatka SET tresc = 'Koniec tematu - wystawiona faktura, zwrot zabezpieczenia ma być. Mamy wystąpić. Miesiąc po ostatnim protokole.' WHERE id = 4;

-- notatka id=5 KR 1039
UPDATE public.kr_notatka SET tresc = 'Katowice - Legnica. Dzisiaj Michał ma dostać odpowiedź w sprawie rozliczeń. Piotr ma coś zaproponować, żeby OTS - jeszcze żył. Zobaczymy co dzisiaj napisze. Geotes też się morduje z nimi.' WHERE id = 5;

-- notatka id=7 KR 1049
UPDATE public.kr_notatka SET tresc = 'Oświęcim - odkrywki, mamy jeszcze zatrzymania - wysłane pismo. Trzeba sprawdzić to pismo w sprawie zatrzymań.' WHERE id = 7;

-- notatka id=9 KR 1052
UPDATE public.kr_notatka SET tresc = 'Decyzja wydana, nie jest ostateczna. Mamy zrobić opisy nieruchomości. Dostaliśmy już kasę - wypadałoby się porozliczać z podwykonawcami. Dostaliśmy kasę jakiś czas temu.  Co ze stabilizacją, Gędęk - około 3000 punktów. - 500 tys. Gdyby chcieli tak jak Dolota chciała, to będzie razy 4. To pochłonie cały temat. Sporządzenie wniosków do sądów wieczystoksięgowych - tam jest 60 tysięcy.' WHERE id = 9;

-- notatka id=12 KR 1070
UPDATE public.kr_notatka SET tresc = 'Ośrodek chciałby decyzji zamiennej, ale to nie wchodzi w grę. Co zrobimy ze stabilizacją ? Dwa obręby są zablokowane przez 2 działki. Budimex będzie cisnął Arcadis, a Arcadis będzie nas cisnął. Możemy to fizycznie zrobić, ale bez protokołów. Co powiedzieć Królikowi - on musi kamienie zrobić, on musi przejść i sprawdzić w terenie jak to wygląda ile potrzebuje kamieni do stabilizacji. My chcemy żeby to było odebrane. 2 obręby to musimy ustalić, bo tam nie ma ujawnionego podziału, i musimy zrobić tak, żeby zastabilizować ale bez protokołu. 20-30 punktów to zagęszczenie linii podziałowej. Na razie nie gadamy z Naporą, dogadajmy się na ryczałt. Więcej punktów się nie pojawi, Wyjdzie 600 punktów tak około. Z Królikiem trzeba będzie przegadać, żeby sobie sam przeszedł teren i ocenił zakres prac i ilość graniczników. Możemy się z Królikiem dogadać - on sam produkuje kamienie.' WHERE id = 12;

-- notatka id=16 KR 1073
UPDATE public.kr_notatka SET tresc = 'Mamy poprawki, zostało jeszcze około 200 k.  Gosia: my mamy zmiany związane z podziałami. Mamy poprawkę na Orlenie - tak wygląda sytuacja, że Boruta się sam kontaktuje z Orlenem. Koszt wykonania na terenie Orlenu jest duży.' WHERE id = 16;

-- notatka id=17 KR 1075
UPDATE public.kr_notatka SET tresc = 'Kozłów Psary - wystawiłam fakturę, na podstawie jednego protokołu. i tyle, mapy były wystawione wcześniej.  Czy mamy jeszcze podstawę fakturowania ? Jest napisane przekażemy do klauzuli mapy i podziały we wrześniu. Na pewno nie będziemy mieć klauzuli kolejowej - bo to strasznie długo trwa.  W Krakowie każdą jedną kartkę trzeba podpisać.' WHERE id = 17;

-- notatka id=22 KR 1077
UPDATE public.kr_notatka SET tresc = 'Jutro zawieziemy mapy, nie jest kłopot z zawiezieniem. Maślerz musi sobie to poukładać.' WHERE id = 22;

-- notatka id=23 KR 1079
UPDATE public.kr_notatka SET tresc = 'BDI - odcinek dla Promost Consulting - mamy tam w cholerę etapów. Chłopaki mówią, że mają tam domierzać pojedyncze miejsca. Zaczynamy składać operat. Musimy pogadać z Darkiem Galą, ale wcześniej się trzeba rozliczyć. Na kiedy jest planowana klauzula ? Klauzula map jest połączona z ewidencją - mapa jest uzależniona od ewidencji. Gosia nie wróci. 30 października to będzie najwcześniej złożone - tam dokładnie nam trzymają 30 dni w klauzuli. W umowie jest do 17 maja 2027. Gdy dziewczyny zrobią ewidencję. Ania ma czas do 14 lipca 2027. Podziały na lipiec. Mariusz jak skończy robić Adrianowi, to zacznie robić Wadowice. Gosia mówi, że jak będzie ewidencja to złożą od razu. Pytanie ? Czy jak mamy tak późne terminy, to czy będziemy mogli się wcześniej rozliczyć za mapę ? Damian musi teren dogadać. Tylko trzeba się porozliczać.' WHERE id = 23;

-- notatka id=24 KR 1081
UPDATE public.kr_notatka SET tresc = 'Sky snap - nie zapłacony. Robimy inwentaryzację zieleni, najpierw zgeneralizowane, ale potem będziemy musieli zrobić drugi raz. Musiał mówił, że 14 października jest termin nie przekraczalny. 14 listopada projektanci składają, a my musimy złożyć miesiąc wcześniej, ale nie mamy linii.  Ewidencję mamy przyjętą w 90 procent. Mamy tam możliwość rozliczenia mapy poszerzonej. Rozliczaliśmy roboczą mapę, ortofotomapę - rozliczaliśmy i 80% mapy roboczej, tylko małej powierzchni. Nie będzie już poszerzeń, a nawet jak będą to musi iść osobnym zleceniem.' WHERE id = 24;

-- notatka id=25 KR 1081
UPDATE public.kr_notatka SET tresc = '188 ha jest rozliczone - jest jeden protokół na obwodnicę Jasła. Gosia mówi, że poszerzenia były 2 razy, ale nie możemy znaleźć kiedy.' WHERE id = 25;

-- notatka id=26 KR 1082
UPDATE public.kr_notatka SET tresc = 'Jutro będzie faktura jeszcze raz po uwagach teczki i koszuli, znowu będzie 20 dni na weryfikację i potem będziemy mogli wystawić kolejną fakturę.' WHERE id = 26;

-- notatka id=27 KR 1083
UPDATE public.kr_notatka SET tresc = 'Wszystkie faktury wystawione na 137 k netto, mieli zapłacić wczoraj.' WHERE id = 27;

-- ---------------------------------------------------------------------------
-- Wiersz testowy (jeśli istnieje)
-- ---------------------------------------------------------------------------
DELETE FROM public.kr_notatka WHERE id = 86 AND kr = '00M' AND tresc LIKE '%G4_TEST_DELETE_IGNORE%';

COMMIT;

