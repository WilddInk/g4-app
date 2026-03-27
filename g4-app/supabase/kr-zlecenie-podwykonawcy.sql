-- Zlecenia podwykonawców przypisane do kodu KR (powiązanie projektu z PW + szczegóły zlecenia).
-- Uruchom po podwykonawca-tabela.sql. Kolumna `kr` = ten sam tekst co w tabeli kr (bez FK — działa zawsze;
--
-- Jeśli tabela już istnieje ze starego skryptu (brak cena_netto / termin / data_oddania / flag), uruchom:
--   g4-app/supabase/kr-zlecenie-podwykonawcy-kolumny-netto-termin-odbior.sql
-- opcjonalnie w produkcji: FOREIGN KEY (kr) REFERENCES public.kr(kr) ON UPDATE CASCADE ON DELETE CASCADE).

CREATE TABLE IF NOT EXISTS public.kr_zlecenie_podwykonawcy (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kr text NOT NULL,
  podwykonawca_id bigint NOT NULL REFERENCES public.podwykonawca(id) ON DELETE RESTRICT,
  numer_zlecenia text,
  opis_zakresu text,
  data_zlecenia date,
  termin_zlecenia date,
  data_oddania date,
  cena_netto numeric(14, 2),
  czy_sprawdzone boolean NOT NULL DEFAULT false,
  czy_odebrane boolean NOT NULL DEFAULT false,
  status text,
  pracownik_weryfikacja text,
  osoba_faktury_nazwa text,
  osoba_faktury_email text,
  osoba_faktury_telefon text,
  uwagi text
);

CREATE INDEX IF NOT EXISTS kr_zlecenie_podwykonawcy_kr_idx ON public.kr_zlecenie_podwykonawcy (kr);
CREATE INDEX IF NOT EXISTS kr_zlecenie_podwykonawcy_pw_idx ON public.kr_zlecenie_podwykonawcy (podwykonawca_id);

COMMENT ON TABLE public.kr_zlecenie_podwykonawcy IS 'Zlecenia dla podwykonawców w ramach danego KR';
COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.kr IS 'Kod projektu (jak w tabeli kr)';
COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.pracownik_weryfikacja IS 'Nr z tabeli pracownik — kto po naszej stronie odpowiada za sprawdzenie / kontakt merytoryczny względem PW';
COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.osoba_faktury_nazwa IS 'Osoba po stronie PW — kontakt fakturowy';
COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.osoba_faktury_email IS 'E-mail do faktur (PW)';
COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.osoba_faktury_telefon IS 'Telefon — kontakt fakturowy (PW)';
COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.cena_netto IS 'Wartość netto zlecenia (PLN)';
COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.termin_zlecenia IS 'Planowany termin realizacji zlecenia (umowny)';
COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.data_oddania IS 'Faktyczna data oddania / przekazania wykonanej pracy';
COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.czy_sprawdzone IS 'Czy sprawdzone po naszej stronie';
COMMENT ON COLUMN public.kr_zlecenie_podwykonawcy.czy_odebrane IS 'Czy odebrane (odbiór / rozliczenie)';
