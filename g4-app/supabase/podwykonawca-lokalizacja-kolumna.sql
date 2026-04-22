-- Dodaje kolumnę lokalizacji do katalogu podwykonawców.
ALTER TABLE public.podwykonawca
ADD COLUMN IF NOT EXISTS lokalizacja text;

COMMENT ON COLUMN public.podwykonawca.lokalizacja IS 'Lokalizacja / obszar działania firmy';
