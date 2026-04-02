-- Opcjonalne powiązanie zadania ogólnego z kodem projektu (KR).
-- Uruchom w Supabase → SQL Editor (idempotentne).

ALTER TABLE public.zadania
  ADD COLUMN IF NOT EXISTS kr text;

COMMENT ON COLUMN public.zadania.kr IS 'Kod projektu (jak w tabeli kr) — NULL = zadanie ogólne, nieprzypisane do KR';

CREATE INDEX IF NOT EXISTS zadania_kr_idx ON public.zadania (kr) WHERE kr IS NOT NULL AND trim(kr) <> '';
