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

-- etapy
DROP POLICY IF EXISTS "auth_select_kamienie" ON public.etapy;
DROP POLICY IF EXISTS "auth_insert_kamienie" ON public.etapy;
DROP POLICY IF EXISTS "auth_update_kamienie" ON public.etapy;
DROP POLICY IF EXISTS "auth_delete_kamienie" ON public.etapy;

CREATE POLICY "auth_select_kamienie"
  ON public.etapy FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_kamienie"
  ON public.etapy FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_kamienie"
  ON public.etapy FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_kamienie"
  ON public.etapy FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.etapy TO authenticated;

-- pracownik
DROP POLICY IF EXISTS "auth_select_pracownik" ON public.pracownik;
DROP POLICY IF EXISTS "auth_insert_pracownik" ON public.pracownik;

CREATE POLICY "auth_select_pracownik"
  ON public.pracownik FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_pracownik"
  ON public.pracownik FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_pracownik" ON public.pracownik;

-- Aktualizacja kartoteki (np. link_google_arkusz) — tylko admin; szczegóły: pracownik-rls-update-tylko-admin.sql
CREATE POLICY "auth_update_pracownik"
  ON public.pracownik
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND p.is_active = true
        AND p.app_role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND p.is_active = true
        AND p.app_role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.pracownik TO authenticated;

-- pracownik_dokument (linki HR) — jak pracownik-dokument-rls-naprawa.sql: zapis tylko admin
DROP POLICY IF EXISTS "auth_select_pracownik_dokument" ON public.pracownik_dokument;
DROP POLICY IF EXISTS "auth_insert_pracownik_dokument" ON public.pracownik_dokument;
DROP POLICY IF EXISTS "auth_update_pracownik_dokument" ON public.pracownik_dokument;
DROP POLICY IF EXISTS "auth_delete_pracownik_dokument" ON public.pracownik_dokument;

CREATE POLICY "auth_select_pracownik_dokument"
  ON public.pracownik_dokument FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_pracownik_dokument"
  ON public.pracownik_dokument
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND p.is_active = true
        AND p.app_role = 'admin'
    )
  );

CREATE POLICY "auth_update_pracownik_dokument"
  ON public.pracownik_dokument
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND p.is_active = true
        AND p.app_role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND p.is_active = true
        AND p.app_role = 'admin'
    )
  );

CREATE POLICY "auth_delete_pracownik_dokument"
  ON public.pracownik_dokument
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND p.is_active = true
        AND p.app_role = 'admin'
    )
  );

GRANT SELECT ON public.pracownik_dokument TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pracownik_dokument TO authenticated;

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
