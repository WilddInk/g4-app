BEGIN;

-- =========================
-- TEREN v1 - planowanie operacyjne
-- =========================

CREATE TABLE IF NOT EXISTS public.kr_teren_zapotrzebowanie (
  id bigserial PRIMARY KEY,
  kr text NOT NULL REFERENCES public.kr(kr) ON DELETE CASCADE,
  tytul text NOT NULL,
  opis text,
  priorytet text NOT NULL DEFAULT 'normalny'
    CHECK (priorytet IN ('niski','normalny','wysoki','krytyczny')),
  status text NOT NULL DEFAULT 'nowe'
    CHECK (status IN ('nowe','w_planowaniu','zaakceptowane','odrzucone','zamkniete')),
  data_oczekiwana_od date,
  data_oczekiwana_do date,
  osoba_zglaszajaca text REFERENCES public.pracownik(nr),
  osoba_koordynujaca text REFERENCES public.pracownik(nr),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kr_teren_praca (
  id bigserial PRIMARY KEY,
  kr text NOT NULL REFERENCES public.kr(kr) ON DELETE CASCADE,
  zapotrzebowanie_id bigint REFERENCES public.kr_teren_zapotrzebowanie(id) ON DELETE SET NULL,
  nazwa text NOT NULL,
  opis text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','gotowe_do_przydzialu','w_realizacji','wstrzymane','zakonczone','anulowane')),
  priorytet text NOT NULL DEFAULT 'normalny'
    CHECK (priorytet IN ('niski','normalny','wysoki','krytyczny')),
  data_plan_od date NOT NULL,
  data_plan_do date NOT NULL,
  data_real_od date,
  data_real_do date,
  procent_postepu integer NOT NULL DEFAULT 0 CHECK (procent_postepu BETWEEN 0 AND 100),
  owner_pracownik_nr text REFERENCES public.pracownik(nr),
  zalezne_od_praca_id bigint REFERENCES public.kr_teren_praca(id) ON DELETE SET NULL,
  czy_kamien_milowy boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (data_plan_od <= data_plan_do)
);

CREATE TABLE IF NOT EXISTS public.kr_teren_przydzial (
  id bigserial PRIMARY KEY,
  praca_id bigint NOT NULL REFERENCES public.kr_teren_praca(id) ON DELETE CASCADE,
  typ_wykonawcy text NOT NULL CHECK (typ_wykonawcy IN ('pracownik','zespol','podwykonawca')),
  pracownik_nr text REFERENCES public.pracownik(nr),
  zespol_id bigint REFERENCES public.kr_teren_zespol(id),
  podwykonawca_id bigint REFERENCES public.podwykonawca(id),
  rola text,
  data_od date NOT NULL,
  data_do date NOT NULL,
  status text NOT NULL DEFAULT 'planowany'
    CHECK (status IN ('planowany','aktywny','zakonczony','anulowany')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (data_od <= data_do),
  CHECK (
    (CASE WHEN pracownik_nr IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN zespol_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN podwykonawca_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  )
);

CREATE TABLE IF NOT EXISTS public.kr_teren_przydzial_zasob (
  id bigserial PRIMARY KEY,
  przydzial_id bigint NOT NULL REFERENCES public.kr_teren_przydzial(id) ON DELETE CASCADE,
  typ_zasobu text NOT NULL CHECK (typ_zasobu IN ('samochod','sprzet')),
  samochod_id bigint REFERENCES public.samochod(id),
  sprzet_id bigint REFERENCES public.sprzet(id),
  data_od date NOT NULL,
  data_do date NOT NULL,
  status text NOT NULL DEFAULT 'zarezerwowany'
    CHECK (status IN ('zarezerwowany','wydany','zwrocony','anulowany')),
  notatki text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (data_od <= data_do),
  CHECK (
    (typ_zasobu = 'samochod' AND samochod_id IS NOT NULL AND sprzet_id IS NULL) OR
    (typ_zasobu = 'sprzet' AND sprzet_id IS NOT NULL AND samochod_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.kr_teren_raport (
  id bigserial PRIMARY KEY,
  praca_id bigint NOT NULL REFERENCES public.kr_teren_praca(id) ON DELETE CASCADE,
  data_raportu date NOT NULL DEFAULT CURRENT_DATE,
  wykonawca_pracownik_nr text REFERENCES public.pracownik(nr),
  procent_postepu integer NOT NULL CHECK (procent_postepu BETWEEN 0 AND 100),
  ilosc_wykonana numeric(12,2),
  jednostka text,
  status_raportu text NOT NULL DEFAULT 'roboczy'
    CHECK (status_raportu IN ('roboczy','zatwierdzony')),
  uwagi text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kr_teren_bloker (
  id bigserial PRIMARY KEY,
  praca_id bigint NOT NULL REFERENCES public.kr_teren_praca(id) ON DELETE CASCADE,
  typ text NOT NULL CHECK (typ IN ('zasob','formalny','pogoda','techniczny','inne')),
  status text NOT NULL DEFAULT 'otwarty' CHECK (status IN ('otwarty','w_trakcie','zamkniety')),
  opis text NOT NULL,
  severity text NOT NULL DEFAULT 'normalny' CHECK (severity IN ('niski','normalny','wysoki','krytyczny')),
  data_otwarcia date NOT NULL DEFAULT CURRENT_DATE,
  data_zamkniecia date,
  created_by text REFERENCES public.pracownik(nr),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (data_zamkniecia IS NULL OR data_zamkniecia >= data_otwarcia)
);

-- Powiazanie dziennej realizacji z planem
ALTER TABLE public.kr_teren_zadanie
  ADD COLUMN IF NOT EXISTS praca_id bigint REFERENCES public.kr_teren_praca(id) ON DELETE SET NULL;

-- Indeksy operacyjne
CREATE INDEX IF NOT EXISTS idx_kr_teren_zapotrzebowanie_kr_status ON public.kr_teren_zapotrzebowanie(kr, status);
CREATE INDEX IF NOT EXISTS idx_kr_teren_praca_kr_data ON public.kr_teren_praca(kr, data_plan_od, data_plan_do);
CREATE INDEX IF NOT EXISTS idx_kr_teren_praca_status ON public.kr_teren_praca(status);
CREATE INDEX IF NOT EXISTS idx_kr_teren_przydzial_praca_data ON public.kr_teren_przydzial(praca_id, data_od, data_do);
CREATE INDEX IF NOT EXISTS idx_kr_teren_przydzial_pracownik ON public.kr_teren_przydzial(pracownik_nr);
CREATE INDEX IF NOT EXISTS idx_kr_teren_zasob_przydzial ON public.kr_teren_przydzial_zasob(przydzial_id);
CREATE INDEX IF NOT EXISTS idx_kr_teren_raport_praca_data ON public.kr_teren_raport(praca_id, data_raportu);
CREATE INDEX IF NOT EXISTS idx_kr_teren_bloker_praca_status ON public.kr_teren_bloker(praca_id, status);
CREATE INDEX IF NOT EXISTS idx_kr_teren_zadanie_praca_id ON public.kr_teren_zadanie(praca_id);

-- Widok konfliktow zasobow (v1)
CREATE OR REPLACE VIEW public.kr_teren_conflict_v1 AS
WITH zasoby AS (
  SELECT
    z.id,
    z.typ_zasobu,
    z.samochod_id,
    z.sprzet_id,
    z.data_od,
    z.data_do,
    p.id AS przydzial_id,
    p.praca_id
  FROM public.kr_teren_przydzial_zasob z
  JOIN public.kr_teren_przydzial p ON p.id = z.przydzial_id
  WHERE z.status IN ('zarezerwowany', 'wydany')
)
SELECT
  a.id AS zasob_a_id,
  b.id AS zasob_b_id,
  a.typ_zasobu,
  COALESCE(a.samochod_id::text, a.sprzet_id::text) AS zasob_klucz,
  a.praca_id AS praca_a_id,
  b.praca_id AS praca_b_id,
  GREATEST(a.data_od, b.data_od) AS konflikt_od,
  LEAST(a.data_do, b.data_do) AS konflikt_do
FROM zasoby a
JOIN zasoby b
  ON a.id < b.id
 AND a.typ_zasobu = b.typ_zasobu
 AND COALESCE(a.samochod_id, -1) = COALESCE(b.samochod_id, -1)
 AND COALESCE(a.sprzet_id, -1) = COALESCE(b.sprzet_id, -1)
 AND a.data_od <= b.data_do
 AND b.data_od <= a.data_do;

COMMIT;

