-- =============================================================================
-- Tabela public.kr — pola opcjonalne: zleceniodawca, umowa, okres trwania.
-- Uruchom w Supabase: SQL Editor → Run (idempotentnie: IF NOT EXISTS).
-- =============================================================================

ALTER TABLE public.kr ADD COLUMN IF NOT EXISTS rodzaj_pracy text;
ALTER TABLE public.kr ADD COLUMN IF NOT EXISTS zleceniodawca text;
ALTER TABLE public.kr ADD COLUMN IF NOT EXISTS osoba_odpowiedzialna_zleceniodawcy text;
ALTER TABLE public.kr ADD COLUMN IF NOT EXISTS link_umowy text;
ALTER TABLE public.kr ADD COLUMN IF NOT EXISTS okres_projektu_od date;
ALTER TABLE public.kr ADD COLUMN IF NOT EXISTS okres_projektu_do date;

COMMENT ON COLUMN public.kr.rodzaj_pracy IS 'Rodzaj pracy / typ projektu (opcjonalnie).';
COMMENT ON COLUMN public.kr.zleceniodawca IS 'Zleceniodawca (opcjonalnie).';
COMMENT ON COLUMN public.kr.osoba_odpowiedzialna_zleceniodawcy IS
  'Osoba odpowiedzialna po stronie zleceniodawcy (opcjonalnie, tekst).';
COMMENT ON COLUMN public.kr.link_umowy IS 'Link do umowy (opcjonalnie).';
COMMENT ON COLUMN public.kr.okres_projektu_od IS 'Początek okresu trwania projektu (opcjonalnie).';
COMMENT ON COLUMN public.kr.okres_projektu_do IS 'Koniec okresu trwania projektu (opcjonalnie).';
