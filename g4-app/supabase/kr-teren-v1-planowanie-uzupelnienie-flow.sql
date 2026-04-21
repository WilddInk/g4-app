BEGIN;

ALTER TABLE public.kr_teren_praca
  ADD COLUMN IF NOT EXISTS deadline_nieprzekraczalny date,
  ADD COLUMN IF NOT EXISTS estymata_dni numeric(8,2),
  ADD COLUMN IF NOT EXISTS linki_danych text;

CREATE INDEX IF NOT EXISTS idx_kr_teren_praca_deadline ON public.kr_teren_praca(deadline_nieprzekraczalny);

COMMIT;

