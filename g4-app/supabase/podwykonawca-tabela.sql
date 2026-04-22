-- Baza podwykonawców (PW): firma, lokalizacja, osoba kontaktowa, telefon, uwagi.
-- Kolejność: 1) uruchom ten plik  2) dołącz sekcję podwykonawca z rls-policies-anon.sql
--    (i opcjonalnie rls-policies-authenticated.sql).

CREATE TABLE IF NOT EXISTS public.podwykonawca (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nazwa_firmy text NOT NULL,
  lokalizacja text,
  lokalizacja_lat double precision,
  lokalizacja_lng double precision,
  osoba_kontaktowa text,
  telefon text,
  uwagi text
);

CREATE INDEX IF NOT EXISTS podwykonawca_nazwa_firmy_idx ON public.podwykonawca (nazwa_firmy);

COMMENT ON TABLE public.podwykonawca IS 'Podwykonawcy — kontakty zewnętrzne (PW)';
COMMENT ON COLUMN public.podwykonawca.nazwa_firmy IS 'Nazwa firmy';
COMMENT ON COLUMN public.podwykonawca.lokalizacja IS 'Lokalizacja / obszar działania firmy';
COMMENT ON COLUMN public.podwykonawca.lokalizacja_lat IS 'Szerokość geograficzna lokalizacji (WGS84)';
COMMENT ON COLUMN public.podwykonawca.lokalizacja_lng IS 'Długość geograficzna lokalizacji (WGS84)';
COMMENT ON COLUMN public.podwykonawca.osoba_kontaktowa IS 'Osoba kontaktowa';
COMMENT ON COLUMN public.podwykonawca.telefon IS 'Telefon';
COMMENT ON COLUMN public.podwykonawca.uwagi IS 'Dodatkowe uwagi o podwykonawcy';
