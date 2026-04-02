-- Flota (samochody), ewidencja sprzętu biurowego, rezerwacje aut na dni (kalendarz).
-- Kolejność: 1) uruchom ten plik  2) dopisz sekcje w rls-policies-anon.sql
--    oraz rls-policies-authenticated.sql (jak używasz logowania).

-- ---------------------------------------------------------------------------
-- Samochody: ubezpieczenie, przegląd, uwagi eksploatacyjne, naprawy
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.samochod (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nazwa text NOT NULL,
  numer_rejestracyjny text,
  polisa_numer text,
  polisa_wazna_do date,
  przeglad_wazny_do date,
  uwagi_eksploatacja text,
  wymagane_naprawy text,
  notatki text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS samochod_nazwa_idx ON public.samochod (nazwa);

COMMENT ON TABLE public.samochod IS 'Flota — pojazdy firmowe (polisa, przegląd, uwagi)';
COMMENT ON COLUMN public.samochod.polisa_numer IS 'Nr polisy (pełna tabela ubezpieczeń może być później)';
COMMENT ON COLUMN public.samochod.uwagi_eksploatacja IS 'Zgłoszone uwagi o działaniu / stanie';
COMMENT ON COLUMN public.samochod.wymagane_naprawy IS 'Zgłoszenie o wymaganych naprawach';

-- ---------------------------------------------------------------------------
-- Sprzęt: komputer, drukarka, ksero; przegląd; przypisanie do pracownika (nr)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sprzet (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  typ text NOT NULL DEFAULT 'inne',
  nazwa text NOT NULL,
  numer_inwentarzowy text,
  data_przegladu date,
  pracownik_nr text,
  notatki text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sprzet_typ_idx ON public.sprzet (typ);
CREATE INDEX IF NOT EXISTS sprzet_pracownik_nr_idx ON public.sprzet (pracownik_nr);

COMMENT ON TABLE public.sprzet IS 'Ewidencja sprzętu (IT / ksero / drukarki); przypisanie przez pracownik.nr';
COMMENT ON COLUMN public.sprzet.data_przegladu IS 'Np. przegląd ksera / serwis drukarki';

-- ---------------------------------------------------------------------------
-- Rezerwacja: jeden wpis na samochód i dzień (kto ma auto)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.samochod_rezerwacja (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  samochod_id bigint NOT NULL REFERENCES public.samochod (id) ON DELETE CASCADE,
  data_dnia date NOT NULL,
  pracownik_nr text NOT NULL,
  opis_krotki text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT samochod_rezerwacja_jeden_dzien UNIQUE (samochod_id, data_dnia)
);

CREATE INDEX IF NOT EXISTS samochod_rezerwacja_data_idx ON public.samochod_rezerwacja (data_dnia);
CREATE INDEX IF NOT EXISTS samochod_rezerwacja_prac_idx ON public.samochod_rezerwacja (pracownik_nr);

COMMENT ON TABLE public.samochod_rezerwacja IS 'Kalendarz zajętości aut — dzień + pracownik';
