-- =============================================================================
-- Krok wstecz: wyczyszczenie danych faktur kosztowych + słowników fakturowych.
-- UWAGA: to usuwa WSZYSTKIE rekordy z:
--   - public.kr_faktura_do_zaplaty
--   - public.kr_faktura_sprzedawca (NIP -> nazwa)
--   - public.kr_faktura_platnik
--   - public.kr_faktura_typ
--   - public.kr_faktura_rodzaj_kosztu
-- Uruchamiaj tylko świadomie (najpierw backup / export).
-- =============================================================================

BEGIN;

-- Kasuje wszystkie wiersze i resetuje licznik ID.
TRUNCATE TABLE public.kr_faktura_do_zaplaty RESTART IDENTITY;
TRUNCATE TABLE public.kr_faktura_sprzedawca;
TRUNCATE TABLE public.kr_faktura_platnik;
TRUNCATE TABLE public.kr_faktura_typ;
TRUNCATE TABLE public.kr_faktura_rodzaj_kosztu;

COMMIT;

