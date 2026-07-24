-- Autor ostatniej zmiany uwag w planie faktur FS
-- Supabase → SQL Editor → Run

ALTER TABLE public.kr_plan_faktury
  ADD COLUMN IF NOT EXISTS uwagi_autor text;

ALTER TABLE public.kr_plan_faktury
  ADD COLUMN IF NOT EXISTS uwagi_autor_email text;

ALTER TABLE public.kr_plan_faktury
  ADD COLUMN IF NOT EXISTS uwagi_zmieniono_at timestamptz;

COMMENT ON COLUMN public.kr_plan_faktury.uwagi_autor IS
  'Imię i nazwisko (lub e-mail) osoby, która ostatnio zapisała uwagi';
COMMENT ON COLUMN public.kr_plan_faktury.uwagi_autor_email IS
  'E-mail konta Auth przy ostatnim zapisie uwag';
COMMENT ON COLUMN public.kr_plan_faktury.uwagi_zmieniono_at IS
  'Kiedy ostatnio zmieniono uwagi';
