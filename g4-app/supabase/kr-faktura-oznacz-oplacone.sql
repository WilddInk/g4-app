-- Hurtowo oznacz faktury kosztowe jako opłacone.
-- Najbezpieczniejszy wariant: zmienia tylko status "do_zaplaty" -> "oplacone".

BEGIN;

-- Podgląd: ile rekordów jest obecnie w każdym statusie
SELECT status, COUNT(*) AS ile
FROM public.kr_faktura_do_zaplaty
GROUP BY status
ORDER BY status;

UPDATE public.kr_faktura_do_zaplaty
SET status = 'oplacone'
WHERE status = 'do_zaplaty';

-- Kontrola po zmianie
SELECT status, COUNT(*) AS ile
FROM public.kr_faktura_do_zaplaty
GROUP BY status
ORDER BY status;

COMMIT;

