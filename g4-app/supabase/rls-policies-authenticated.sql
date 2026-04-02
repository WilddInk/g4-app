-- =============================================================================
-- Po włączeniu logowania w aplikacji: zapytania idą z JWT (rola authenticated).
-- Uruchom w Supabase SQL Editor PO rls-policies-anon.sql (te same tabele).
-- Dopóki anon ma dostęp, niezalogowani nadal mogą czytać/zapisywać przez klucz anon;
-- jeśli chcesz tylko dla zalogowanych — usuń polityki GRANT dla anon osobną migracją.
-- =============================================================================

-- kr
DROP POLICY IF EXISTS "auth_select_kr" ON public.kr;
DROP POLICY IF EXISTS "auth_insert_kr" ON public.kr;
DROP POLICY IF EXISTS "auth_update_kr" ON public.kr;

CREATE POLICY "auth_select_kr"
  ON public.kr FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_kr"
  ON public.kr FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_kr"
  ON public.kr FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.kr TO authenticated;

-- kamienie_milowe
DROP POLICY IF EXISTS "auth_select_kamienie" ON public.kamienie_milowe;
DROP POLICY IF EXISTS "auth_insert_kamienie" ON public.kamienie_milowe;
DROP POLICY IF EXISTS "auth_update_kamienie" ON public.kamienie_milowe;
DROP POLICY IF EXISTS "auth_delete_kamienie" ON public.kamienie_milowe;

CREATE POLICY "auth_select_kamienie"
  ON public.kamienie_milowe FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_kamienie"
  ON public.kamienie_milowe FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_kamienie"
  ON public.kamienie_milowe FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_kamienie"
  ON public.kamienie_milowe FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kamienie_milowe TO authenticated;

-- pracownik
DROP POLICY IF EXISTS "auth_select_pracownik" ON public.pracownik;
DROP POLICY IF EXISTS "auth_insert_pracownik" ON public.pracownik;

CREATE POLICY "auth_select_pracownik"
  ON public.pracownik FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_pracownik"
  ON public.pracownik FOR INSERT TO authenticated WITH CHECK (true);

GRANT SELECT, INSERT ON public.pracownik TO authenticated;

-- dziennik_zdarzen
DROP POLICY IF EXISTS "auth_select_dziennik_zdarzen" ON public.dziennik_zdarzen;
DROP POLICY IF EXISTS "auth_insert_dziennik_zdarzen" ON public.dziennik_zdarzen;
DROP POLICY IF EXISTS "auth_update_dziennik_zdarzen" ON public.dziennik_zdarzen;

CREATE POLICY "auth_select_dziennik_zdarzen"
  ON public.dziennik_zdarzen FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_dziennik_zdarzen"
  ON public.dziennik_zdarzen FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_dziennik_zdarzen"
  ON public.dziennik_zdarzen FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.dziennik_zdarzen TO authenticated;

-- zadania
DROP POLICY IF EXISTS "auth_select_zadania" ON public.zadania;
DROP POLICY IF EXISTS "auth_insert_zadania" ON public.zadania;
DROP POLICY IF EXISTS "auth_update_zadania" ON public.zadania;
DROP POLICY IF EXISTS "auth_delete_zadania" ON public.zadania;

CREATE POLICY "auth_select_zadania"
  ON public.zadania FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_zadania"
  ON public.zadania FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_zadania"
  ON public.zadania FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_zadania"
  ON public.zadania FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.zadania TO authenticated;

-- podwykonawca
DROP POLICY IF EXISTS "auth_select_podwykonawca" ON public.podwykonawca;
DROP POLICY IF EXISTS "auth_insert_podwykonawca" ON public.podwykonawca;
DROP POLICY IF EXISTS "auth_update_podwykonawca" ON public.podwykonawca;
DROP POLICY IF EXISTS "auth_delete_podwykonawca" ON public.podwykonawca;

CREATE POLICY "auth_select_podwykonawca"
  ON public.podwykonawca FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_podwykonawca"
  ON public.podwykonawca FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_podwykonawca"
  ON public.podwykonawca FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_podwykonawca"
  ON public.podwykonawca FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.podwykonawca TO authenticated;

-- kr_zlecenie_podwykonawcy
DROP POLICY IF EXISTS "auth_select_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;
DROP POLICY IF EXISTS "auth_insert_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;
DROP POLICY IF EXISTS "auth_update_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;
DROP POLICY IF EXISTS "auth_delete_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;

CREATE POLICY "auth_select_kr_zlecenie_pw"
  ON public.kr_zlecenie_podwykonawcy FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_kr_zlecenie_pw"
  ON public.kr_zlecenie_podwykonawcy FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_kr_zlecenie_pw"
  ON public.kr_zlecenie_podwykonawcy FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_kr_zlecenie_pw"
  ON public.kr_zlecenie_podwykonawcy FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_zlecenie_podwykonawcy TO authenticated;

-- samochod / sprzet / samochod_rezerwacja
DROP POLICY IF EXISTS "auth_select_samochod" ON public.samochod;
DROP POLICY IF EXISTS "auth_insert_samochod" ON public.samochod;
DROP POLICY IF EXISTS "auth_update_samochod" ON public.samochod;
DROP POLICY IF EXISTS "auth_delete_samochod" ON public.samochod;

CREATE POLICY "auth_select_samochod" ON public.samochod FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_samochod" ON public.samochod FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_samochod" ON public.samochod FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_samochod" ON public.samochod FOR DELETE TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.samochod TO authenticated;

DROP POLICY IF EXISTS "auth_select_sprzet" ON public.sprzet;
DROP POLICY IF EXISTS "auth_insert_sprzet" ON public.sprzet;
DROP POLICY IF EXISTS "auth_update_sprzet" ON public.sprzet;
DROP POLICY IF EXISTS "auth_delete_sprzet" ON public.sprzet;

CREATE POLICY "auth_select_sprzet" ON public.sprzet FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_sprzet" ON public.sprzet FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_sprzet" ON public.sprzet FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_sprzet" ON public.sprzet FOR DELETE TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sprzet TO authenticated;

DROP POLICY IF EXISTS "auth_select_samochod_rezerwacja" ON public.samochod_rezerwacja;
DROP POLICY IF EXISTS "auth_insert_samochod_rezerwacja" ON public.samochod_rezerwacja;
DROP POLICY IF EXISTS "auth_update_samochod_rezerwacja" ON public.samochod_rezerwacja;
DROP POLICY IF EXISTS "auth_delete_samochod_rezerwacja" ON public.samochod_rezerwacja;

CREATE POLICY "auth_select_samochod_rezerwacja" ON public.samochod_rezerwacja FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_samochod_rezerwacja" ON public.samochod_rezerwacja FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_samochod_rezerwacja" ON public.samochod_rezerwacja FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_samochod_rezerwacja" ON public.samochod_rezerwacja FOR DELETE TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.samochod_rezerwacja TO authenticated;

-- kr_faktura_do_zaplaty (tabela musi już istnieć — najpierw kr-faktura-do-zaplaty.sql)
DROP POLICY IF EXISTS "auth_select_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;
DROP POLICY IF EXISTS "auth_insert_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;
DROP POLICY IF EXISTS "auth_update_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;
DROP POLICY IF EXISTS "auth_delete_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;

CREATE POLICY "auth_select_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty FOR DELETE TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_faktura_do_zaplaty TO authenticated;
