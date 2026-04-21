# TEREN v1 - Dokument roboczy wdrozenia

Cel: szybkie decyzje operacyjne kierownika (kto wolny, co przypisac, konflikty zasobow, termin realny, blokery, opoznienia), przy zachowaniu obecnego modulu dziennych wpisow.

## 1) Model tabel SQL (v1)

Wdrozyc migracje: `g4-app/supabase/kr-teren-v1-planowanie.sql`

Nowe tabele (v1):
- `kr_teren_zapotrzebowanie` - zgloszenie potrzeby prac terenowych dla KR
- `kr_teren_praca` - zadanie planistyczne (od-do, priorytet, status)
- `kr_teren_przydzial` - przypisanie wykonawcy do zadania
- `kr_teren_przydzial_zasob` - przypiecie auta/sprzetu do przydzialu
- `kr_teren_raport` - raport postepu
- `kr_teren_bloker` - blokery/ryzyka

Rozszerzenie istniejacej tabeli:
- `kr_teren_zadanie` dostaje `praca_id` (FK do `kr_teren_praca`) - dzienne wpisy staja sie szczegolem wykonania.

### Relacje (v1)
- `kr (kr)` 1:N `kr_teren_zapotrzebowanie (kr)`
- `kr_teren_zapotrzebowanie` 1:N `kr_teren_praca`
- `kr_teren_praca` 1:N `kr_teren_przydzial`
- `kr_teren_przydzial` 1:N `kr_teren_przydzial_zasob`
- `kr_teren_praca` 1:N `kr_teren_raport`
- `kr_teren_praca` 1:N `kr_teren_bloker`
- `kr_teren_praca` 1:N `kr_teren_zadanie` (daily execution)

### Enumy/statusy (v1 przez CHECK)
- `kr_teren_zapotrzebowanie.status`:
  - `nowe | w_planowaniu | zaakceptowane | odrzucone | zamkniete`
- `kr_teren_praca.status`:
  - `draft | gotowe_do_przydzialu | w_realizacji | wstrzymane | zakonczone | anulowane`
- `kr_teren_praca.priorytet`:
  - `niski | normalny | wysoki | krytyczny`
- `kr_teren_przydzial.typ_wykonawcy`:
  - `pracownik | zespol | podwykonawca`
- `kr_teren_przydzial_zasob.typ_zasobu`:
  - `samochod | sprzet`
- `kr_teren_raport.status_raportu`:
  - `roboczy | zatwierdzony`
- `kr_teren_bloker.status`:
  - `otwarty | w_trakcie | zamkniety`

## 2) MVP backlog wdrozeniowy (kolejnosc)

### Sprint 1 - backend minimum (must-have)
1. Dodac migracje SQL v1 (`kr-teren-v1-planowanie.sql`).
2. Dodac RLS/granty dla nowych tabel (na wzor `kr_teren_zadanie`).
3. Dodac widok SQL `kr_teren_conflict_v1` (konflikty auto/sprzet po datach).
4. Dodac seed testowy pod v1 (zapotrzebowanie, praca, przydzial, raport).

### Sprint 2 - UI operacyjne (must-have)
1. Formularz: `Nowe zapotrzebowanie`.
2. Widok listy: `Prace terenowe KR` (status, priorytet, termin, owner).
3. Panel przydzialu wykonawcy + przypiecie auta/sprzetu.
4. Raport postepu (procent, ilosc, uwagi, blokery).
5. Karty KPI: `wolne zasoby`, `konflikty`, `po terminie`, `blokery`.

### Sprint 3 - Gantt v1 (must-have)
1. Gantt KR (warstwy: Projekt, Etapy, Teren, PW, Rezerwacje zasobow).
2. Zoom i scroll (rok/miesiac/tydzien/dzien).
3. Legenda + Today + filtry warstw.

### Odlozyc po MVP
- sciezka krytyczna
- what-if/symulacje
- automatyczny scoring "najlepszy wykonawca" (na razie proste podpowiedzi)

## 3) Architektura frontendowa (React)

Nowe komponenty:
- `src/modules/teren/TerenPlanningBoard.jsx`
- `src/modules/teren/TerenDemandForm.jsx`
- `src/modules/teren/TerenAssignmentPanel.jsx`
- `src/modules/teren/TerenProgressPanel.jsx`
- `src/modules/teren/TerenConflictsPanel.jsx`
- `src/modules/teren/KrGanttV1.jsx`
- `src/modules/teren/gantt/useGanttRows.js`
- `src/modules/teren/gantt/ganttPalette.js`

Nowe serwisy danych:
- `src/modules/teren/api/terenApi.js`
  - `fetchDemandsByKr(kr)`
  - `fetchWorkItemsByKr(kr)`
  - `fetchAssignments(workId)`
  - `fetchResourcesByDateRange(...)`
  - `fetchConflictsByKr(kr)`
  - `saveProgressReport(...)`

Wykorzystanie obecnego modulu:
- `kr_teren_zadanie` zostaje bez usuwania
- z poziomu zadania planistycznego pokazujemy "dzienna realizacja" jako sub-lista
- przy zapisie raportu mozna opcjonalnie aktualizowac `kr_teren_zadanie.ilosc_wykonano`

## 4) Specyfikacja Gantta v1 (UI/UX)

Warstwy MVP:
- Projekt KR (bar)
- Etapy (milestone romb/kropka)
- Prace terenowe (paski)
- Podwykonawcy (paski)
- Rezerwacje samochod/sprzet (cienkie paski)

Konwencja wizualna (minimalistyczna):
- tlo: delikatne, ciemne/jasne neutralne
- siatka: subtelna (bez ciezkich linii)
- status akcent:
  - `w_realizacji`: niebieski
  - `zakonczone`: zielony
  - `wstrzymane`: szary
  - `krytyczny/opoznione`: czerwony
- milestone: romb
- bloker: ikonka ostrzezenia przy pasku
- Today: pionowa wyrazna linia

Interakcje MVP:
- zoom: rok/miesiac/tydzien/dzien
- horizontal scroll
- toggle warstw
- hover tooltip (owner, % postepu, zasoby, blokery)
- click pasek -> panel szczegolow zadania

## 5) Plan migracji bez big-bang

Krok 1:
- wdrozyc nowe tabele v1, bez ruszania obecnego UI.

Krok 2:
- uruchomic nowy ekran TEREN v1 rownolegle z obecnym (flaga widoku).

Krok 3:
- mapowac `kr_teren_zadanie` do `kr_teren_praca` przez `praca_id` (nowe rekordy zawsze z powiazaniem).

Krok 4:
- stopniowo przenosic operacje kierownika na v1 (zapotrzebowanie -> przydzial -> raport).

Krok 5:
- stary widok dzienny pozostaje jako "widok realizacji szczegolowej" pod zadaniem v1.

## 6) Definition of Done dla v1

- kierownik tworzy zapotrzebowanie dla KR
- zamienia je na zadanie i przypisuje wykonawce
- przypina auto/sprzet
- system pokazuje konflikt zasobow
- wykonawca raportuje postep i bloker
- Gantt KR pokazuje warstwy i statusy czytelnie
- dzienne wpisy nadal dzialaja i sa powiazane z zadaniem

