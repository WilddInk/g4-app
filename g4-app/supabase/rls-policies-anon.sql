-- =============================================================================
-- Wklej całość w Supabase: SQL Editor → New query → Run
-- Naprawia „pustą listę” przy włączonym RLS: aplikacja używa klucza anon (rola anon).
-- Na produkcji doprecyzuj warunki USING / WITH CHECK zamiast (true).
-- =============================================================================

-- Tabela kr: odczyt + dodawanie z formularza w React
ALTER TABLE public.kr ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kr" ON public.kr;
DROP POLICY IF EXISTS "anon_insert_kr" ON public.kr;

CREATE POLICY "anon_select_kr"
  ON public.kr
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_kr"
  ON public.kr
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_kr" ON public.kr;

CREATE POLICY "anon_update_kr"
  ON public.kr
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Bez tego czasem UPDATE kończy się „sukcesem” bez zwróconego wiersza albo pole dzial się nie zapisuje w API
GRANT SELECT, INSERT, UPDATE ON public.kr TO anon;

-- Etapy: tylko odczyt w obecnej aplikacji
ALTER TABLE public.etapy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kamienie" ON public.etapy;

CREATE POLICY "anon_select_kamienie"
  ON public.etapy
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "anon_insert_kamienie" ON public.etapy;
DROP POLICY IF EXISTS "anon_update_kamienie" ON public.etapy;
DROP POLICY IF EXISTS "anon_delete_kamienie" ON public.etapy;

CREATE POLICY "anon_insert_kamienie"
  ON public.etapy
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_kamienie"
  ON public.etapy
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_delete_kamienie"
  ON public.etapy
  FOR DELETE
  TO anon
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.etapy TO anon;

-- Pracownicy (widok „ID” w aplikacji)
ALTER TABLE public.pracownik ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pracownik" ON public.pracownik;

CREATE POLICY "anon_select_pracownik"
  ON public.pracownik
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "anon_insert_pracownik" ON public.pracownik;

CREATE POLICY "anon_insert_pracownik"
  ON public.pracownik
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_pracownik" ON public.pracownik;

CREATE POLICY "anon_update_pracownik"
  ON public.pracownik
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.pracownik TO anon;

-- Dokumenty HR pracownika (linki — wymaga pracownik-dokumenty-i-arkusz.sql)
ALTER TABLE public.pracownik_dokument ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pracownik_dokument" ON public.pracownik_dokument;
DROP POLICY IF EXISTS "anon_insert_pracownik_dokument" ON public.pracownik_dokument;
DROP POLICY IF EXISTS "anon_update_pracownik_dokument" ON public.pracownik_dokument;
DROP POLICY IF EXISTS "anon_delete_pracownik_dokument" ON public.pracownik_dokument;

CREATE POLICY "anon_select_pracownik_dokument"
  ON public.pracownik_dokument FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_pracownik_dokument"
  ON public.pracownik_dokument FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_pracownik_dokument"
  ON public.pracownik_dokument FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_pracownik_dokument"
  ON public.pracownik_dokument FOR DELETE TO anon USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pracownik_dokument TO anon;

-- Dziennik zdarzeń (LOG — wpisy dla danego kodu KR)
-- Uwaga: po zalogowaniu w aplikacji zapytania idą jako rola authenticated — wtedy
-- potrzebne są też polityki z rls-policies-authenticated.sql (inaczej UPDATE może „0 wierszy”).
ALTER TABLE public.dziennik_zdarzen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_dziennik_zdarzen" ON public.dziennik_zdarzen;
DROP POLICY IF EXISTS "anon_insert_dziennik_zdarzen" ON public.dziennik_zdarzen;
DROP POLICY IF EXISTS "anon_update_dziennik_zdarzen" ON public.dziennik_zdarzen;

CREATE POLICY "anon_select_dziennik_zdarzen"
  ON public.dziennik_zdarzen
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_dziennik_zdarzen"
  ON public.dziennik_zdarzen
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_dziennik_zdarzen"
  ON public.dziennik_zdarzen
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.dziennik_zdarzen TO anon;

-- Zadania ogólne (sprzęt, organizacja — bez powiązania z KR)
ALTER TABLE public.zadania ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_zadania" ON public.zadania;
DROP POLICY IF EXISTS "anon_insert_zadania" ON public.zadania;
DROP POLICY IF EXISTS "anon_update_zadania" ON public.zadania;
DROP POLICY IF EXISTS "anon_delete_zadania" ON public.zadania;

CREATE POLICY "anon_select_zadania"
  ON public.zadania
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_zadania"
  ON public.zadania
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_zadania"
  ON public.zadania
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_delete_zadania"
  ON public.zadania
  FOR DELETE
  TO anon
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.zadania TO anon;

-- Podwykonawcy (widok PW w aplikacji)
ALTER TABLE public.podwykonawca ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_podwykonawca" ON public.podwykonawca;
DROP POLICY IF EXISTS "anon_insert_podwykonawca" ON public.podwykonawca;
DROP POLICY IF EXISTS "anon_update_podwykonawca" ON public.podwykonawca;
DROP POLICY IF EXISTS "anon_delete_podwykonawca" ON public.podwykonawca;

CREATE POLICY "anon_select_podwykonawca"
  ON public.podwykonawca
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_podwykonawca"
  ON public.podwykonawca
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_podwykonawca"
  ON public.podwykonawca
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_delete_podwykonawca"
  ON public.podwykonawca
  FOR DELETE
  TO anon
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.podwykonawca TO anon;

-- Zlecenia PW przypisane do KR
ALTER TABLE public.kr_zlecenie_podwykonawcy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;
DROP POLICY IF EXISTS "anon_insert_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;
DROP POLICY IF EXISTS "anon_update_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;
DROP POLICY IF EXISTS "anon_delete_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;

CREATE POLICY "anon_select_kr_zlecenie_pw"
  ON public.kr_zlecenie_podwykonawcy
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon_insert_kr_zlecenie_pw"
  ON public.kr_zlecenie_podwykonawcy
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_kr_zlecenie_pw"
  ON public.kr_zlecenie_podwykonawcy
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_delete_kr_zlecenie_pw"
  ON public.kr_zlecenie_podwykonawcy
  FOR DELETE
  TO anon
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_zlecenie_podwykonawcy TO anon;

-- Flota: samochody, sprzęt, rezerwacje (samochody-sprzet-rezerwacje.sql)
ALTER TABLE public.samochod ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprzet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samochod_rezerwacja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_samochod" ON public.samochod;
DROP POLICY IF EXISTS "anon_insert_samochod" ON public.samochod;
DROP POLICY IF EXISTS "anon_update_samochod" ON public.samochod;
DROP POLICY IF EXISTS "anon_delete_samochod" ON public.samochod;

CREATE POLICY "anon_select_samochod" ON public.samochod FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_samochod" ON public.samochod FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_samochod" ON public.samochod FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_samochod" ON public.samochod FOR DELETE TO anon USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.samochod TO anon;

DROP POLICY IF EXISTS "anon_select_sprzet" ON public.sprzet;
DROP POLICY IF EXISTS "anon_insert_sprzet" ON public.sprzet;
DROP POLICY IF EXISTS "anon_update_sprzet" ON public.sprzet;
DROP POLICY IF EXISTS "anon_delete_sprzet" ON public.sprzet;

CREATE POLICY "anon_select_sprzet" ON public.sprzet FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_sprzet" ON public.sprzet FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_sprzet" ON public.sprzet FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_sprzet" ON public.sprzet FOR DELETE TO anon USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sprzet TO anon;

DROP POLICY IF EXISTS "anon_select_samochod_rezerwacja" ON public.samochod_rezerwacja;
DROP POLICY IF EXISTS "anon_insert_samochod_rezerwacja" ON public.samochod_rezerwacja;
DROP POLICY IF EXISTS "anon_update_samochod_rezerwacja" ON public.samochod_rezerwacja;
DROP POLICY IF EXISTS "anon_delete_samochod_rezerwacja" ON public.samochod_rezerwacja;

CREATE POLICY "anon_select_samochod_rezerwacja" ON public.samochod_rezerwacja FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_samochod_rezerwacja" ON public.samochod_rezerwacja FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_samochod_rezerwacja" ON public.samochod_rezerwacja FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_samochod_rezerwacja" ON public.samochod_rezerwacja FOR DELETE TO anon USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.samochod_rezerwacja TO anon;

-- Faktury kosztowe — zgłoszenia do opłacenia (KR).
-- WYMAGANE: najpierw uruchom g4-app/supabase/kr-faktura-do-zaplaty.sql (tworzy tabelę) albo cały ten plik kończy się błędem 42P01.
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
