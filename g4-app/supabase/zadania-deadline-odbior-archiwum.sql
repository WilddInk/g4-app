-- Termin realizacji (deadline), zgłoszenie wykonania, data odbioru, archiwum — Supabase SQL Editor (idempotentne).

ALTER TABLE public.zadania
  ADD COLUMN IF NOT EXISTS deadline date;

ALTER TABLE public.zadania
  ADD COLUMN IF NOT EXISTS wykonanie_zgloszone_at timestamptz;

ALTER TABLE public.zadania
  ADD COLUMN IF NOT EXISTS data_odbioru date;

ALTER TABLE public.zadania
  ADD COLUMN IF NOT EXISTS w_archiwum boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.zadania.deadline IS 'Termin realizacji (deadline) — jedna data graniczna zamiast „planowanej”.';
COMMENT ON COLUMN public.zadania.wykonanie_zgloszone_at IS 'Czas zgłoszenia wykonania przez osobę odpowiedzialną.';
COMMENT ON COLUMN public.zadania.data_odbioru IS 'Data potwierdzenia odbioru przez osobę zlecającą (po zgłoszeniu wykonania).';
COMMENT ON COLUMN public.zadania.w_archiwum IS 'Zadanie przeniesione do archiwum (po odbiorze).';

UPDATE public.zadania z
SET deadline = (z.data_planowana)::date
WHERE z.deadline IS NULL AND z.data_planowana IS NOT NULL;

UPDATE public.zadania z
SET data_odbioru = (z.data_realna)::date
WHERE z.data_odbioru IS NULL AND z.data_realna IS NOT NULL;

CREATE INDEX IF NOT EXISTS zadania_deadline_idx ON public.zadania (deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS zadania_w_archiwum_idx ON public.zadania (w_archiwum) WHERE w_archiwum = true;
