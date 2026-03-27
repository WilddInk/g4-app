-- Kolumna status dla tabeli public.kr — uruchom w Supabase: SQL Editor → Run
-- Dozwolone wartości (albo NULL): w trakcie | zakończone | oczekuje na zamawiającego

ALTER TABLE public.kr ADD COLUMN IF NOT EXISTS status text;

ALTER TABLE public.kr DROP CONSTRAINT IF EXISTS kr_status_check;

ALTER TABLE public.kr ADD CONSTRAINT kr_status_check CHECK (
  status IS NULL
  OR status IN (
    'w trakcie',
    'zakończone',
    'oczekuje na zamawiającego'
  )
);

COMMENT ON COLUMN public.kr.status IS 'Status projektu KR: w trakcie, zakończone, oczekuje na zamawiającego';
