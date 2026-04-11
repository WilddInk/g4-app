-- =============================================================================
-- Zmiana nazwy tabeli etapów: public.kamienie_milowe → public.etapy
-- Bezpieczne wielokrotne uruchamianie: jeśli public.etapy już jest, a starej
-- nazwy nie ma — skrypt tylko wypisze NOTICE, bez błędu i bez ALTER.
--
-- PostgreSQL automatycznie przenosi: indeksy, RLS, triggery, klucze obce itd.
--
-- Po pierwszej migracji warto uruchomić kamienie-milowe-data-planowana-wylicz.sql.
-- =============================================================================

DO $$
BEGIN
  IF to_regclass('public.etapy') IS NOT NULL
     AND to_regclass('public.kamienie_milowe') IS NULL THEN
    RAISE NOTICE 'public.etapy już istnieje, public.kamienie_milowe nie — migracja nazwy była już wykonana. Nic nie robię.';
    RETURN;
  END IF;

  IF to_regclass('public.etapy') IS NOT NULL
     AND to_regclass('public.kamienie_milowe') IS NOT NULL THEN
    RAISE EXCEPTION 'Konflikt: istnieją jednocześnie public.etapy i public.kamienie_milowe — rozstrzygnij ręcznie (nie uruchamiaj RENAME).';
  END IF;

  IF to_regclass('public.kamienie_milowe') IS NULL THEN
    RAISE EXCEPTION 'Brak tabeli public.kamienie_milowe — nic do zmiany (i public.etapy też nie ma).';
  END IF;

  ALTER TABLE public.kamienie_milowe RENAME TO etapy;
END $$;

COMMENT ON TABLE public.etapy IS 'Etap pracy przy projekcie KR (dawniej kamienie_milowe).';
