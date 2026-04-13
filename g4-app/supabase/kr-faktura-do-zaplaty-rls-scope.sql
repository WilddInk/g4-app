  -- =============================================================================
  -- Docelowy zakres dostępu do faktur (po logowaniu):
  -- - admin: widzi i edytuje wszystkie
  -- - kierownik KR: widzi faktury dla KR, które prowadzi (kr.osoba_prowadzaca = pracownik.nr)
  -- - pracownik: widzi faktury, które sam zgłosił (zgloszil_pracownik_nr = pracownik.nr)
  -- - faktury nieprzypisane (bez KR i bez pracownika): tylko admin
  --
  -- Uruchom po: kr-faktura-do-zaplaty.sql
  -- =============================================================================

  ALTER TABLE public.kr_faktura_do_zaplaty ENABLE ROW LEVEL SECURITY;

  -- Rozszerzenie schematu pod import z legacy invoices.csv
  ALTER TABLE public.kr_faktura_do_zaplaty
  ALTER COLUMN kr DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS data_faktury date,
  ADD COLUMN IF NOT EXISTS kwota_netto numeric(14, 2),
  ADD COLUMN IF NOT EXISTS kwota_vat numeric(14, 2),
  ADD COLUMN IF NOT EXISTS sprzedawca_nip text,
  ADD COLUMN IF NOT EXISTS sprzedawca_nazwa text,
    ADD COLUMN IF NOT EXISTS rodzaj_kosztu text,
    ADD COLUMN IF NOT EXISTS typ_nazwy text,
    ADD COLUMN IF NOT EXISTS nazwa_obiektu text,
  ADD COLUMN IF NOT EXISTS legacy_nazwa_pliku text,
    ADD COLUMN IF NOT EXISTS legacy_pdf_file text,
    ADD COLUMN IF NOT EXISTS legacy_issuer_id text,
    ADD COLUMN IF NOT EXISTS legacy_receiver_name text,
    ADD COLUMN IF NOT EXISTS legacy_payer_name text,
    ADD COLUMN IF NOT EXISTS legacy_link_group_id text,
    ADD COLUMN IF NOT EXISTS legacy_counts_in_sums boolean;

  COMMENT ON COLUMN public.kr_faktura_do_zaplaty.data_faktury IS 'Data z dokumentu/legacy CSV (invoice date).';
COMMENT ON COLUMN public.kr_faktura_do_zaplaty.kwota_netto IS 'Legacy CSV: price_netto.';
COMMENT ON COLUMN public.kr_faktura_do_zaplaty.kwota_vat IS 'Legacy CSV: vat.';
COMMENT ON COLUMN public.kr_faktura_do_zaplaty.sprzedawca_nip IS 'NIP sprzedawcy (słownik po NIP).';
COMMENT ON COLUMN public.kr_faktura_do_zaplaty.sprzedawca_nazwa IS 'Nazwa sprzedawcy przypisana do NIP.';
  COMMENT ON COLUMN public.kr_faktura_do_zaplaty.rodzaj_kosztu IS 'Legacy CSV: cost_kind.';
  COMMENT ON COLUMN public.kr_faktura_do_zaplaty.typ_nazwy IS 'Legacy CSV: type_name (np. Media, Usługi).';
  COMMENT ON COLUMN public.kr_faktura_do_zaplaty.nazwa_obiektu IS 'Legacy CSV: object_name.';
COMMENT ON COLUMN public.kr_faktura_do_zaplaty.legacy_nazwa_pliku IS 'Legacy CSV: unit_price_name (często nazwa pliku).';

  -- Jeśli chcesz pełne bezpieczeństwo po logowaniu: wyłącz dostęp anon do faktur.
  DROP POLICY IF EXISTS "anon_select_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;
  DROP POLICY IF EXISTS "anon_insert_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;
  DROP POLICY IF EXISTS "anon_update_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;
  DROP POLICY IF EXISTS "anon_delete_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;
  REVOKE ALL ON public.kr_faktura_do_zaplaty FROM anon;

  -- Czytelny reset istniejących polityk authenticated (zastępuje "USING (true)").
  DROP POLICY IF EXISTS "auth_select_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;
  DROP POLICY IF EXISTS "auth_insert_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;
  DROP POLICY IF EXISTS "auth_update_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;
  DROP POLICY IF EXISTS "auth_delete_kr_faktura_do_zaplaty" ON public.kr_faktura_do_zaplaty;

  CREATE POLICY "auth_select_kr_faktura_do_zaplaty"
    ON public.kr_faktura_do_zaplaty
    FOR SELECT
    TO authenticated
    USING (
      -- Admin widzi wszystko
      EXISTS (
        SELECT 1
        FROM public.pracownik p_admin
        WHERE p_admin.auth_user_id = auth.uid()
          AND p_admin.is_active = true
          AND p_admin.app_role = 'admin'
      )
      OR
      -- Kierownik widzi tylko KR, które prowadzi
      EXISTS (
        SELECT 1
        FROM public.pracownik p_me
        JOIN public.kr k ON k.kr = public.kr_faktura_do_zaplaty.kr
        WHERE p_me.auth_user_id = auth.uid()
          AND p_me.is_active = true
          AND p_me.nr = k.osoba_prowadzaca
      )
      OR
      -- Pracownik widzi swoje zgłoszenia
      EXISTS (
        SELECT 1
        FROM public.pracownik p_me
        WHERE p_me.auth_user_id = auth.uid()
          AND p_me.is_active = true
          AND p_me.nr = public.kr_faktura_do_zaplaty.zgloszil_pracownik_nr
      )
    );

  -- Mutacje tylko admin (najbezpieczniej na start).
  CREATE POLICY "auth_insert_kr_faktura_do_zaplaty"
    ON public.kr_faktura_do_zaplaty
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

  CREATE POLICY "auth_update_kr_faktura_do_zaplaty"
    ON public.kr_faktura_do_zaplaty
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

  CREATE POLICY "auth_delete_kr_faktura_do_zaplaty"
    ON public.kr_faktura_do_zaplaty
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

  GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_faktura_do_zaplaty TO authenticated;
