-- =============================================================================
-- Odpowiedzialność za flotę (naprawy) — tylko wybrani pracownicy + admin/kierownik.
-- 1) Kolumna public.pracownik.odpowiedzialny_flota (boolean).
-- 2) Widok public.samochod_lista — ukrywa treść wymagane_naprawy przed innymi.
-- 3) Triggery na public.samochod — blokada zapisu pola wymagane_naprawy bez uprawnień.
--
-- Uruchom w Supabase SQL Editor. Potem w aplikacji używaj SELECT z samochod_lista.
-- Flagi odpowiedzialny_flota ustawiasz w Table Editor lub w panelu Zespół (admin).
-- =============================================================================

ALTER TABLE public.pracownik
  ADD COLUMN IF NOT EXISTS odpowiedzialny_flota boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.pracownik.odpowiedzialny_flota IS
  'Osoba odpowiedzialna za obsługę floty (widać i edytuje pole wymagane naprawy przy samochodzie).';

-- Kto może widzieć/edytować naprawy (JWT = auth.uid() → pracownik.auth_user_id)
CREATE OR REPLACE FUNCTION public.moge_widziec_naprawy_floty()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pracownik p
    WHERE p.auth_user_id IS NOT NULL
      AND p.auth_user_id = auth.uid()
      AND COALESCE(p.is_active, true)
      AND (
        p.app_role IN ('admin', 'kierownik')
        OR COALESCE(p.odpowiedzialny_flota, false)
      )
  );
$$;

REVOKE ALL ON FUNCTION public.moge_widziec_naprawy_floty() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.moge_widziec_naprawy_floty() TO anon, authenticated;

-- Odczyt dla UI: maskuje wymagane_naprawy
DROP VIEW IF EXISTS public.samochod_lista;
CREATE VIEW public.samochod_lista AS
SELECT
  s.id,
  s.nazwa,
  s.numer_rejestracyjny,
  s.polisa_numer,
  s.polisa_wazna_do,
  s.przeglad_wazny_do,
  s.uwagi_eksploatacja,
  CASE
    WHEN public.moge_widziec_naprawy_floty() THEN s.wymagane_naprawy
    ELSE NULL
  END AS wymagane_naprawy,
  s.notatki,
  s.created_at
FROM public.samochod s;

COMMENT ON VIEW public.samochod_lista IS
  'Lista samochodów do odczytu w aplikacji — pole wymagane_naprawy widoczne tylko dla uprawnionych.';

GRANT SELECT ON public.samochod_lista TO anon, authenticated;

-- Ochrona zapisu bezpośrednio na tabeli samochod
CREATE OR REPLACE FUNCTION public.samochod_chron_wymagane_naprawy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.wymagane_naprawy IS NOT NULL AND btrim(NEW.wymagane_naprawy) <> '' THEN
      IF NOT public.moge_widziec_naprawy_floty() THEN
        RAISE EXCEPTION 'Brak uprawnień do zapisu informacji o wymaganych naprawach'
          USING ERRCODE = '42501';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.wymagane_naprawy IS DISTINCT FROM OLD.wymagane_naprawy THEN
      IF NOT public.moge_widziec_naprawy_floty() THEN
        RAISE EXCEPTION 'Brak uprawnień do zmiany informacji o wymaganych naprawach'
          USING ERRCODE = '42501';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_samochod_chron_naprawy_ins ON public.samochod;
CREATE TRIGGER trg_samochod_chron_naprawy_ins
  BEFORE INSERT ON public.samochod
  FOR EACH ROW
  EXECUTE PROCEDURE public.samochod_chron_wymagane_naprawy();

DROP TRIGGER IF EXISTS trg_samochod_chron_naprawy_upd ON public.samochod;
CREATE TRIGGER trg_samochod_chron_naprawy_upd
  BEFORE UPDATE ON public.samochod
  FOR EACH ROW
  EXECUTE PROCEDURE public.samochod_chron_wymagane_naprawy();
