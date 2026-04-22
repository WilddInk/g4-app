-- Rozszerzenie istniejącej tabeli podwykonawców o geolokalizację i uwagi.
ALTER TABLE public.podwykonawca
ADD COLUMN IF NOT EXISTS lokalizacja_lat double precision,
ADD COLUMN IF NOT EXISTS lokalizacja_lng double precision,
ADD COLUMN IF NOT EXISTS uwagi text;

COMMENT ON COLUMN public.podwykonawca.lokalizacja_lat IS 'Szerokość geograficzna lokalizacji (WGS84)';
COMMENT ON COLUMN public.podwykonawca.lokalizacja_lng IS 'Długość geograficzna lokalizacji (WGS84)';
COMMENT ON COLUMN public.podwykonawca.uwagi IS 'Dodatkowe uwagi o podwykonawcy';
