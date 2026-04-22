-- Spłaszczenie typów „praca stacjonarna” / „praca zdalna” → jeden typ „praca”.
-- Uruchom raz w SQL Editor po wdrożeniu zmian w aplikacji (CzasPracyPanel).

UPDATE public.czas_pracy_wpis
SET typ = 'praca'
WHERE typ IN ('praca_stacjonarna', 'praca_zdalna');
