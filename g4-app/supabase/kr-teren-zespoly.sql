-- Zespoły terenowe (zasoby ludzkie) + kalendarz przydziałów do KR.
-- Nowy model: zespół NIE ma pola KR; każde zadanie ma kr + dzień + (opcjonalnie) pracownika.
-- Kolejność: 1) ten plik (świeża baza)  LUB migracja kr-teren-zespoly-migracja-zasoby.sql (istniejąca baza)
--           2) kr-teren-zespoly-rls.sql / sekcje w rls-policies-*.sql

CREATE TABLE IF NOT EXISTS public.kr_teren_zespol (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nazwa text NOT NULL,
  notatki text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.kr_teren_zespol IS 'Opcjonalna nazwana grupa pracowników (np. ekipa Zachód) — zasób, nie projekt';

CREATE TABLE IF NOT EXISTS public.kr_teren_zespol_pracownik (
  zespol_id bigint NOT NULL REFERENCES public.kr_teren_zespol (id) ON DELETE CASCADE,
  pracownik_nr text NOT NULL,
  PRIMARY KEY (zespol_id, pracownik_nr)
);

CREATE INDEX IF NOT EXISTS kr_teren_zespol_prac_prac_idx ON public.kr_teren_zespol_pracownik (pracownik_nr);

COMMENT ON TABLE public.kr_teren_zespol_pracownik IS 'Skład nazwanego zespołu (ID pracownika jak w reszcie aplikacji)';

CREATE TABLE IF NOT EXISTS public.kr_teren_zadanie (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kr text NOT NULL,
  data_dnia date NOT NULL,
  opis text NOT NULL,
  ilosc_plan numeric NOT NULL DEFAULT 1,
  ilosc_wykonano numeric NOT NULL DEFAULT 0,
  pracownik_nr text,
  uwagi text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kr_teren_zadanie_ilosc_plan_nonneg CHECK (ilosc_plan >= 0),
  CONSTRAINT kr_teren_zadanie_ilosc_wyk_nonneg CHECK (ilosc_wykonano >= 0)
);

CREATE INDEX IF NOT EXISTS kr_teren_zadanie_kr_data_idx ON public.kr_teren_zadanie (kr, data_dnia);
CREATE INDEX IF NOT EXISTS kr_teren_zadanie_prac_data_idx ON public.kr_teren_zadanie (pracownik_nr, data_dnia);

COMMENT ON TABLE public.kr_teren_zadanie IS 'Przydział pracy terenowej: konkretny KR w konkretnym dniu; kto wykonuje (pracownik)';
COMMENT ON COLUMN public.kr_teren_zadanie.kr IS 'Kod projektu — ta sama osoba może mieć inny KR kolejnego dnia';
COMMENT ON COLUMN public.kr_teren_zadanie.pracownik_nr IS 'Kto realizuje (lub puste jeśli wpis ogólny / do dopisania)';
COMMENT ON COLUMN public.kr_teren_zadanie.ilosc_plan IS 'Przewidywana ilość / zakres';
COMMENT ON COLUMN public.kr_teren_zadanie.ilosc_wykonano IS 'Wykonane (rozliczenie)';
