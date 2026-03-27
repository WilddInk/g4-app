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
ALTER TABLE public.kamienie_milowe ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kamienie" ON public.kamienie_milowe;

CREATE POLICY "anon_select_kamienie"
  ON public.kamienie_milowe
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "anon_insert_kamienie" ON public.kamienie_milowe;
DROP POLICY IF EXISTS "anon_update_kamienie" ON public.kamienie_milowe;
DROP POLICY IF EXISTS "anon_delete_kamienie" ON public.kamienie_milowe;

CREATE POLICY "anon_insert_kamienie"
  ON public.kamienie_milowe
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_update_kamienie"
  ON public.kamienie_milowe
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_delete_kamienie"
  ON public.kamienie_milowe
  FOR DELETE
  TO anon
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kamienie_milowe TO anon;

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
