BEGIN;

ALTER TABLE public.pracownik
  ADD COLUMN IF NOT EXISTS odpowiedzialny_teren boolean NOT NULL DEFAULT false;

COMMIT;

