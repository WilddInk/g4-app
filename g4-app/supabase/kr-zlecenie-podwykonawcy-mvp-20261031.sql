-- MVP zleceń podwykonawców: etapy, aneks ceny, NIP, autor i wąskie uprawnienia.
-- Uruchom ręcznie w Supabase SQL Editor PO zalogowaniu jako właściciel projektu.
-- Nie uruchamiaj rls-policies-anon.sql. Ten plik zdejmuje anonimowy zapis tych tabel.
-- Nie publikuje danych i nie zmienia faktur.

ALTER TABLE public.podwykonawca
  ADD COLUMN IF NOT EXISTS nip text;

CREATE UNIQUE INDEX IF NOT EXISTS podwykonawca_nip_uniq
  ON public.podwykonawca (nip)
  WHERE nip IS NOT NULL AND nip <> '';

ALTER TABLE public.kr_zlecenie_podwykonawcy
  ADD COLUMN IF NOT EXISTS firma_kod text,
  ADD COLUMN IF NOT EXISTS nazwa_roboty text,
  ADD COLUMN IF NOT EXISTS zamawiajacy text,
  ADD COLUMN IF NOT EXISTS waluta text,
  ADD COLUMN IF NOT EXISTS status_ceny text,
  ADD COLUMN IF NOT EXISTS ilosc numeric(14, 4),
  ADD COLUMN IF NOT EXISTS stawka_netto numeric(14, 2),
  ADD COLUMN IF NOT EXISTS jednostka text,
  ADD COLUMN IF NOT EXISTS plan_data_faktury date,
  ADD COLUMN IF NOT EXISTS plan_kwota_faktury_netto numeric(14, 2),
  ADD COLUMN IF NOT EXISTS warunek_fakturowania text,
  ADD COLUMN IF NOT EXISTS termin_platnosci_dni integer,
  ADD COLUMN IF NOT EXISTS termin_platnosci_od text,
  ADD COLUMN IF NOT EXISTS link_dokumentu text,
  ADD COLUMN IF NOT EXISTS wynik_sprawdzenia text,
  ADD COLUMN IF NOT EXISTS zrodlo_odbioru text,
  ADD COLUMN IF NOT EXISTS uwagi_odbioru text,
  ADD COLUMN IF NOT EXISTS data_odbioru date,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS autor_pracownik_nr text,
  ADD COLUMN IF NOT EXISTS zmienil_pracownik_nr text,
  ADD COLUMN IF NOT EXISTS zakres_zmienil text,
  ADD COLUMN IF NOT EXISTS zakres_zmieniono timestamptz,
  ADD COLUMN IF NOT EXISTS termin_zmienil text,
  ADD COLUMN IF NOT EXISTS termin_zmieniono timestamptz,
  ADD COLUMN IF NOT EXISTS cene_zmienil text,
  ADD COLUMN IF NOT EXISTS cene_zmieniono timestamptz,
  ADD COLUMN IF NOT EXISTS wersja integer NOT NULL DEFAULT 1;

ALTER TABLE public.kr_zlecenie_podwykonawcy
  DROP CONSTRAINT IF EXISTS kr_zlecenie_pw_firma_chk;
ALTER TABLE public.kr_zlecenie_podwykonawcy
  ADD CONSTRAINT kr_zlecenie_pw_firma_chk
  CHECK (firma_kod IS NULL OR firma_kod IN ('A', 'B', 'C')) NOT VALID;

ALTER TABLE public.kr_zlecenie_podwykonawcy
  DROP CONSTRAINT IF EXISTS kr_zlecenie_pw_status_ceny_chk;
ALTER TABLE public.kr_zlecenie_podwykonawcy
  ADD CONSTRAINT kr_zlecenie_pw_status_ceny_chk
  CHECK (status_ceny IS NULL OR status_ceny IN ('proponowana', 'uzgodniona', 'do_ustalenia')) NOT VALID;

ALTER TABLE public.kr_zlecenie_podwykonawcy
  DROP CONSTRAINT IF EXISTS kr_zlecenie_pw_dni_chk;
ALTER TABLE public.kr_zlecenie_podwykonawcy
  ADD CONSTRAINT kr_zlecenie_pw_dni_chk
  CHECK (termin_platnosci_dni IS NULL OR termin_platnosci_dni >= 0) NOT VALID;

CREATE TABLE IF NOT EXISTS public.kr_zlecenie_pw_etap (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  zlecenie_id bigint NOT NULL REFERENCES public.kr_zlecenie_podwykonawcy(id) ON DELETE CASCADE,
  kolejnosc integer NOT NULL DEFAULT 1,
  nazwa text,
  opis text,
  cena_netto numeric(14, 2),
  status_ceny text,
  waluta text,
  plan_data_faktury date,
  plan_kwota_netto numeric(14, 2),
  data_oddania date,
  data_odbioru date,
  wynik_sprawdzenia text,
  czy_sprawdzone boolean NOT NULL DEFAULT false,
  czy_odebrane boolean NOT NULL DEFAULT false,
  zrodlo_odbioru text,
  uwagi text,
  status text NOT NULL DEFAULT 'aktywny',
  wersja integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE INDEX IF NOT EXISTS kr_zlecenie_pw_etap_zlecenie_idx
  ON public.kr_zlecenie_pw_etap (zlecenie_id);

CREATE TABLE IF NOT EXISTS public.kr_zlecenie_pw_cena_historia (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  zlecenie_id bigint NOT NULL REFERENCES public.kr_zlecenie_podwykonawcy(id) ON DELETE CASCADE,
  etap_id bigint,
  cena_netto_poprzednia numeric(14, 2),
  cena_netto_nowa numeric(14, 2),
  status_ceny_poprzedni text,
  status_ceny_nowy text,
  powod text,
  autor_pracownik_nr text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.g4_pw_rola_zalogowanego()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT trim(coalesce(p.app_role, ''))
      FROM public.pracownik p
      WHERE p.auth_user_id = auth.uid()
        AND (p.is_active IS NULL OR p.is_active = true)
      ORDER BY p.nr
      LIMIT 1
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.g4_pw_moze_zarzadzac_zleceniami()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.g4_pw_rola_zalogowanego() IN ('admin', 'kierownik');
$$;

CREATE OR REPLACE FUNCTION public.g4_pw_przed_zapisem_zlecenia()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nr text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.g4_pw_moze_zarzadzac_zleceniami() THEN
    RAISE EXCEPTION 'odmowa' USING ERRCODE = '42501';
  END IF;
  SELECT trim(p.nr::text) INTO v_nr
  FROM public.pracownik p
  WHERE p.auth_user_id = auth.uid()
    AND (p.is_active IS NULL OR p.is_active = true)
  LIMIT 1;
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.created_by := auth.uid();
    NEW.autor_pracownik_nr := v_nr;
    NEW.wersja := 1;
  ELSE
    IF NEW.wersja IS NOT DISTINCT FROM OLD.wersja THEN
      NEW.wersja := OLD.wersja + 1;
    END IF;
    IF OLD.status_ceny = 'uzgodniona' AND OLD.cena_netto IS DISTINCT FROM NEW.cena_netto THEN
      INSERT INTO public.kr_zlecenie_pw_cena_historia (
        zlecenie_id, cena_netto_poprzednia, cena_netto_nowa,
        status_ceny_poprzedni, status_ceny_nowy, powod, autor_pracownik_nr, created_by
      ) VALUES (
        OLD.id, OLD.cena_netto, NEW.cena_netto,
        OLD.status_ceny, NEW.status_ceny, 'aneks', v_nr, auth.uid()
      );
      NEW.cene_zmienil := v_nr;
      NEW.cene_zmieniono := now();
    END IF;
    IF OLD.opis_zakresu IS DISTINCT FROM NEW.opis_zakresu THEN
      NEW.zakres_zmienil := v_nr;
      NEW.zakres_zmieniono := now();
    END IF;
    IF OLD.termin_zlecenia IS DISTINCT FROM NEW.termin_zlecenia THEN
      NEW.termin_zmienil := v_nr;
      NEW.termin_zmieniono := now();
    END IF;
  END IF;
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  NEW.zmienil_pracownik_nr := v_nr;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS g4_pw_przed_zapisem_zlecenia ON public.kr_zlecenie_podwykonawcy;
CREATE TRIGGER g4_pw_przed_zapisem_zlecenia
  BEFORE INSERT OR UPDATE ON public.kr_zlecenie_podwykonawcy
  FOR EACH ROW
  EXECUTE FUNCTION public.g4_pw_przed_zapisem_zlecenia();

CREATE OR REPLACE FUNCTION public.g4_pw_zapisz_zlecenie(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id bigint;
  v_rec public.kr_zlecenie_podwykonawcy%ROWTYPE;
  v_etap jsonb;
  v_etap_id bigint;
  v_nr text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.g4_pw_moze_zarzadzac_zleceniami() THEN
    RETURN jsonb_build_object('ok', false, 'kod', 'odmowa');
  END IF;
  IF coalesce(p_payload->>'kr', '') = '' OR nullif(p_payload->>'podwykonawca_id', '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'kod', 'walidacja', 'komunikat', 'Szkic wymaga podwykonawcy i KR.');
  END IF;
  IF coalesce(p_payload->>'status', '') = 'potwierdzone' THEN
    IF coalesce(p_payload->>'firma_kod', '') NOT IN ('A', 'B', 'C')
       OR coalesce(p_payload->>'opis_zakresu', '') = ''
       OR coalesce(p_payload->>'data_zlecenia', '') = ''
       OR coalesce(p_payload->>'termin_zlecenia', '') = ''
       OR coalesce(p_payload->>'status_ceny', '') NOT IN ('proponowana', 'uzgodniona', 'do_ustalenia')
    THEN
      RETURN jsonb_build_object('ok', false, 'kod', 'walidacja', 'komunikat', 'Do potwierdzenia brakuje firmy, zakresu, ceny, daty albo terminu.');
    END IF;
    IF p_payload->>'status_ceny' = 'uzgodniona' AND nullif(p_payload->>'cena_netto', '') IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'kod', 'walidacja', 'komunikat', 'Uzgodniona cena wymaga kwoty.');
    END IF;
  END IF;

  SELECT trim(p.nr::text) INTO v_nr
  FROM public.pracownik p
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;

  v_id := nullif(p_payload->>'id', '')::bigint;
  IF v_id IS NULL THEN
    INSERT INTO public.kr_zlecenie_podwykonawcy (
      kr, podwykonawca_id, numer_zlecenia, opis_zakresu, data_zlecenia, termin_zlecenia,
      data_oddania, cena_netto, czy_sprawdzone, czy_odebrane, status, pracownik_weryfikacja,
      osoba_faktury_nazwa, osoba_faktury_email, osoba_faktury_telefon, uwagi,
      firma_kod, nazwa_roboty, zamawiajacy, waluta, status_ceny, ilosc, stawka_netto, jednostka,
      plan_data_faktury, plan_kwota_faktury_netto, warunek_fakturowania, termin_platnosci_dni,
      termin_platnosci_od, link_dokumentu, wynik_sprawdzenia, zrodlo_odbioru, uwagi_odbioru, data_odbioru
    ) VALUES (
      p_payload->>'kr',
      (p_payload->>'podwykonawca_id')::bigint,
      nullif(p_payload->>'numer_zlecenia', ''),
      nullif(p_payload->>'opis_zakresu', ''),
      nullif(p_payload->>'data_zlecenia', '')::date,
      nullif(p_payload->>'termin_zlecenia', '')::date,
      nullif(p_payload->>'data_oddania', '')::date,
      nullif(p_payload->>'cena_netto', '')::numeric,
      coalesce((p_payload->>'czy_sprawdzone')::boolean, false),
      coalesce((p_payload->>'czy_odebrane')::boolean, false),
      coalesce(nullif(p_payload->>'status', ''), 'szkic'),
      nullif(p_payload->>'pracownik_weryfikacja', ''),
      nullif(p_payload->>'osoba_faktury_nazwa', ''),
      nullif(p_payload->>'osoba_faktury_email', ''),
      nullif(p_payload->>'osoba_faktury_telefon', ''),
      nullif(p_payload->>'uwagi', ''),
      nullif(p_payload->>'firma_kod', ''),
      nullif(p_payload->>'nazwa_roboty', ''),
      nullif(p_payload->>'zamawiajacy', ''),
      coalesce(nullif(p_payload->>'waluta', ''), 'PLN'),
      coalesce(nullif(p_payload->>'status_ceny', ''), 'do_ustalenia'),
      nullif(p_payload->>'ilosc', '')::numeric,
      nullif(p_payload->>'stawka_netto', '')::numeric,
      nullif(p_payload->>'jednostka', ''),
      nullif(p_payload->>'plan_data_faktury', '')::date,
      nullif(p_payload->>'plan_kwota_faktury_netto', '')::numeric,
      nullif(p_payload->>'warunek_fakturowania', ''),
      nullif(p_payload->>'termin_platnosci_dni', '')::integer,
      nullif(p_payload->>'termin_platnosci_od', ''),
      nullif(p_payload->>'link_dokumentu', ''),
      nullif(p_payload->>'wynik_sprawdzenia', ''),
      nullif(p_payload->>'zrodlo_odbioru', ''),
      nullif(p_payload->>'uwagi_odbioru', ''),
      nullif(p_payload->>'data_odbioru', '')::date
    )
    RETURNING * INTO v_rec;
  ELSE
    SELECT * INTO v_rec FROM public.kr_zlecenie_podwykonawcy WHERE id = v_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'kod', 'brak');
    END IF;
    IF v_rec.wersja IS DISTINCT FROM coalesce(nullif(p_payload->>'wersja', '')::integer, -1) THEN
      RETURN jsonb_build_object('ok', false, 'kod', 'konflikt', 'aktualny', to_jsonb(v_rec), 'przyslane', p_payload);
    END IF;
    UPDATE public.kr_zlecenie_podwykonawcy SET
      kr = p_payload->>'kr',
      podwykonawca_id = (p_payload->>'podwykonawca_id')::bigint,
      numer_zlecenia = nullif(p_payload->>'numer_zlecenia', ''),
      opis_zakresu = nullif(p_payload->>'opis_zakresu', ''),
      data_zlecenia = nullif(p_payload->>'data_zlecenia', '')::date,
      termin_zlecenia = nullif(p_payload->>'termin_zlecenia', '')::date,
      data_oddania = nullif(p_payload->>'data_oddania', '')::date,
      cena_netto = nullif(p_payload->>'cena_netto', '')::numeric,
      czy_sprawdzone = coalesce((p_payload->>'czy_sprawdzone')::boolean, false),
      czy_odebrane = coalesce((p_payload->>'czy_odebrane')::boolean, false),
      status = coalesce(nullif(p_payload->>'status', ''), 'szkic'),
      pracownik_weryfikacja = nullif(p_payload->>'pracownik_weryfikacja', ''),
      osoba_faktury_nazwa = nullif(p_payload->>'osoba_faktury_nazwa', ''),
      osoba_faktury_email = nullif(p_payload->>'osoba_faktury_email', ''),
      osoba_faktury_telefon = nullif(p_payload->>'osoba_faktury_telefon', ''),
      uwagi = nullif(p_payload->>'uwagi', ''),
      firma_kod = nullif(p_payload->>'firma_kod', ''),
      nazwa_roboty = nullif(p_payload->>'nazwa_roboty', ''),
      zamawiajacy = nullif(p_payload->>'zamawiajacy', ''),
      waluta = coalesce(nullif(p_payload->>'waluta', ''), 'PLN'),
      status_ceny = coalesce(nullif(p_payload->>'status_ceny', ''), 'do_ustalenia'),
      ilosc = nullif(p_payload->>'ilosc', '')::numeric,
      stawka_netto = nullif(p_payload->>'stawka_netto', '')::numeric,
      jednostka = nullif(p_payload->>'jednostka', ''),
      plan_data_faktury = nullif(p_payload->>'plan_data_faktury', '')::date,
      plan_kwota_faktury_netto = nullif(p_payload->>'plan_kwota_faktury_netto', '')::numeric,
      warunek_fakturowania = nullif(p_payload->>'warunek_fakturowania', ''),
      termin_platnosci_dni = nullif(p_payload->>'termin_platnosci_dni', '')::integer,
      termin_platnosci_od = nullif(p_payload->>'termin_platnosci_od', ''),
      link_dokumentu = nullif(p_payload->>'link_dokumentu', ''),
      wynik_sprawdzenia = nullif(p_payload->>'wynik_sprawdzenia', ''),
      zrodlo_odbioru = nullif(p_payload->>'zrodlo_odbioru', ''),
      uwagi_odbioru = nullif(p_payload->>'uwagi_odbioru', ''),
      data_odbioru = nullif(p_payload->>'data_odbioru', '')::date,
      wersja = wersja + 1
    WHERE id = v_id AND wersja = v_rec.wersja
    RETURNING * INTO v_rec;
    IF NOT FOUND THEN
      SELECT * INTO v_rec FROM public.kr_zlecenie_podwykonawcy WHERE id = v_id;
      RETURN jsonb_build_object('ok', false, 'kod', 'konflikt', 'aktualny', to_jsonb(v_rec), 'przyslane', p_payload);
    END IF;
  END IF;

  FOR v_etap IN SELECT value FROM jsonb_array_elements(coalesce(p_payload->'etapy', '[]'::jsonb)) AS t(value)
  LOOP
    v_etap_id := nullif(v_etap->>'id', '')::bigint;
    IF v_etap_id IS NULL THEN
      INSERT INTO public.kr_zlecenie_pw_etap (
        zlecenie_id, kolejnosc, nazwa, opis, cena_netto, status_ceny, waluta,
        plan_data_faktury, plan_kwota_netto, data_oddania, data_odbioru,
        wynik_sprawdzenia, czy_sprawdzone, czy_odebrane, zrodlo_odbioru, uwagi, status,
        created_by, updated_by
      ) VALUES (
        v_rec.id,
        coalesce(nullif(v_etap->>'kolejnosc', '')::integer, 1),
        nullif(v_etap->>'nazwa', ''),
        nullif(v_etap->>'opis', ''),
        nullif(v_etap->>'cena_netto', '')::numeric,
        nullif(v_etap->>'status_ceny', ''),
        coalesce(nullif(v_etap->>'waluta', ''), 'PLN'),
        nullif(v_etap->>'plan_data_faktury', '')::date,
        nullif(v_etap->>'plan_kwota_netto', '')::numeric,
        nullif(v_etap->>'data_oddania', '')::date,
        nullif(v_etap->>'data_odbioru', '')::date,
        nullif(v_etap->>'wynik_sprawdzenia', ''),
        coalesce((v_etap->>'czy_sprawdzone')::boolean, false),
        coalesce((v_etap->>'czy_odebrane')::boolean, false),
        nullif(v_etap->>'zrodlo_odbioru', ''),
        nullif(v_etap->>'uwagi', ''),
        coalesce(nullif(v_etap->>'status', ''), 'aktywny'),
        auth.uid(),
        auth.uid()
      );
    ELSE
      UPDATE public.kr_zlecenie_pw_etap SET
        nazwa = nullif(v_etap->>'nazwa', ''),
        opis = nullif(v_etap->>'opis', ''),
        cena_netto = nullif(v_etap->>'cena_netto', '')::numeric,
        status_ceny = nullif(v_etap->>'status_ceny', ''),
        waluta = coalesce(nullif(v_etap->>'waluta', ''), 'PLN'),
        plan_data_faktury = nullif(v_etap->>'plan_data_faktury', '')::date,
        plan_kwota_netto = nullif(v_etap->>'plan_kwota_netto', '')::numeric,
        data_oddania = nullif(v_etap->>'data_oddania', '')::date,
        data_odbioru = nullif(v_etap->>'data_odbioru', '')::date,
        wynik_sprawdzenia = nullif(v_etap->>'wynik_sprawdzenia', ''),
        czy_sprawdzone = coalesce((v_etap->>'czy_sprawdzone')::boolean, false),
        czy_odebrane = coalesce((v_etap->>'czy_odebrane')::boolean, false),
        zrodlo_odbioru = nullif(v_etap->>'zrodlo_odbioru', ''),
        uwagi = nullif(v_etap->>'uwagi', ''),
        status = coalesce(nullif(v_etap->>'status', ''), 'aktywny'),
        updated_at = now(),
        updated_by = auth.uid(),
        wersja = wersja + 1
      WHERE id = v_etap_id AND zlecenie_id = v_rec.id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'kod', 'zapisane', 'zlecenie', to_jsonb(v_rec), 'autor', v_nr);
END;
$$;

REVOKE ALL ON FUNCTION public.g4_pw_rola_zalogowanego() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.g4_pw_moze_zarzadzac_zleceniami() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.g4_pw_przed_zapisem_zlecenia() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.g4_pw_zapisz_zlecenie(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.g4_pw_rola_zalogowanego() TO authenticated;
GRANT EXECUTE ON FUNCTION public.g4_pw_moze_zarzadzac_zleceniami() TO authenticated;
GRANT EXECUTE ON FUNCTION public.g4_pw_zapisz_zlecenie(jsonb) TO authenticated;

DROP POLICY IF EXISTS "anon_select_podwykonawca" ON public.podwykonawca;
DROP POLICY IF EXISTS "anon_insert_podwykonawca" ON public.podwykonawca;
DROP POLICY IF EXISTS "anon_update_podwykonawca" ON public.podwykonawca;
DROP POLICY IF EXISTS "anon_delete_podwykonawca" ON public.podwykonawca;
DROP POLICY IF EXISTS "auth_select_podwykonawca" ON public.podwykonawca;
DROP POLICY IF EXISTS "auth_insert_podwykonawca" ON public.podwykonawca;
DROP POLICY IF EXISTS "auth_update_podwykonawca" ON public.podwykonawca;
DROP POLICY IF EXISTS "auth_delete_podwykonawca" ON public.podwykonawca;
DROP POLICY IF EXISTS "anon_select_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;
DROP POLICY IF EXISTS "anon_insert_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;
DROP POLICY IF EXISTS "anon_update_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;
DROP POLICY IF EXISTS "anon_delete_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;
DROP POLICY IF EXISTS "auth_select_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;
DROP POLICY IF EXISTS "auth_insert_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;
DROP POLICY IF EXISTS "auth_update_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;
DROP POLICY IF EXISTS "auth_delete_kr_zlecenie_pw" ON public.kr_zlecenie_podwykonawcy;

REVOKE ALL ON TABLE public.podwykonawca FROM anon;
REVOKE ALL ON TABLE public.kr_zlecenie_podwykonawcy FROM anon;

ALTER TABLE public.podwykonawca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kr_zlecenie_podwykonawcy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kr_zlecenie_pw_etap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kr_zlecenie_pw_cena_historia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pw_select_podwykonawca"
  ON public.podwykonawca FOR SELECT TO authenticated
  USING (public.g4_pw_moze_zarzadzac_zleceniami());
CREATE POLICY "pw_insert_podwykonawca"
  ON public.podwykonawca FOR INSERT TO authenticated
  WITH CHECK (public.g4_pw_moze_zarzadzac_zleceniami());
CREATE POLICY "pw_update_podwykonawca"
  ON public.podwykonawca FOR UPDATE TO authenticated
  USING (public.g4_pw_moze_zarzadzac_zleceniami())
  WITH CHECK (public.g4_pw_moze_zarzadzac_zleceniami());
CREATE POLICY "pw_delete_podwykonawca"
  ON public.podwykonawca FOR DELETE TO authenticated
  USING (public.g4_pw_moze_zarzadzac_zleceniami());

CREATE POLICY "pw_select_zlecenie"
  ON public.kr_zlecenie_podwykonawcy FOR SELECT TO authenticated
  USING (public.g4_pw_moze_zarzadzac_zleceniami());
CREATE POLICY "pw_insert_zlecenie"
  ON public.kr_zlecenie_podwykonawcy FOR INSERT TO authenticated
  WITH CHECK (public.g4_pw_moze_zarzadzac_zleceniami());
CREATE POLICY "pw_update_zlecenie"
  ON public.kr_zlecenie_podwykonawcy FOR UPDATE TO authenticated
  USING (public.g4_pw_moze_zarzadzac_zleceniami())
  WITH CHECK (public.g4_pw_moze_zarzadzac_zleceniami());
CREATE POLICY "pw_delete_zlecenie"
  ON public.kr_zlecenie_podwykonawcy FOR DELETE TO authenticated
  USING (public.g4_pw_moze_zarzadzac_zleceniami());

CREATE POLICY "pw_select_etap"
  ON public.kr_zlecenie_pw_etap FOR SELECT TO authenticated
  USING (public.g4_pw_moze_zarzadzac_zleceniami());
CREATE POLICY "pw_insert_etap"
  ON public.kr_zlecenie_pw_etap FOR INSERT TO authenticated
  WITH CHECK (public.g4_pw_moze_zarzadzac_zleceniami());
CREATE POLICY "pw_update_etap"
  ON public.kr_zlecenie_pw_etap FOR UPDATE TO authenticated
  USING (public.g4_pw_moze_zarzadzac_zleceniami())
  WITH CHECK (public.g4_pw_moze_zarzadzac_zleceniami());
CREATE POLICY "pw_delete_etap"
  ON public.kr_zlecenie_pw_etap FOR DELETE TO authenticated
  USING (public.g4_pw_moze_zarzadzac_zleceniami());

CREATE POLICY "pw_select_historia"
  ON public.kr_zlecenie_pw_cena_historia FOR SELECT TO authenticated
  USING (public.g4_pw_moze_zarzadzac_zleceniami());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.podwykonawca TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_zlecenie_podwykonawcy TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kr_zlecenie_pw_etap TO authenticated;
GRANT SELECT ON public.kr_zlecenie_pw_cena_historia TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.kr_zlecenie_pw_etap_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.kr_zlecenie_pw_cena_historia_id_seq TO authenticated;
