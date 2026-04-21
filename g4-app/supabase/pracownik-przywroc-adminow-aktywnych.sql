BEGIN;

-- Przywraca widoczność kolumn adminowych (Flota/Teren/Aktywny),
-- bo uprawnienia admina są liczone tylko dla aktywnego pracownika.
UPDATE public.pracownik
SET is_active = true
WHERE trim(coalesce(app_role, '')) = 'admin';

COMMIT;

