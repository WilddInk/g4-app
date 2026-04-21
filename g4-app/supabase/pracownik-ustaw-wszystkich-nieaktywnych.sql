BEGIN;

UPDATE public.pracownik
SET is_active = false;

COMMIT;

