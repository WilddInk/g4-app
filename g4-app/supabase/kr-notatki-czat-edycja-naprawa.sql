-- =============================================================================
-- CZAT KR — naprawa EDYCJI wpisów (UPDATE na kr_notatka) dla ZALOGOWANYCH
-- CLD 2026-11-20 — zgłoszenie Damiana: „po edycji wpisu nie da się zapisać zmiany”.
-- Supabase → SQL Editor → wklej całość → Run. Można uruchamiać wielokrotnie.
-- =============================================================================

DROP POLICY IF EXISTS "auth_update_kr_notatka" ON public.kr_notatka;
CREATE POLICY "auth_update_kr_notatka"
  ON public.kr_notatka FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.kr_notatka TO authenticated;

-- Kontrola: polityki na kr_notatka. Musi być auth_update_kr_notatka (cmd = UPDATE).
-- Jeśli w kolumnie permissive jest RESTRICTIVE — ta polityka nadal może blokować edycję.
SELECT policyname, permissive, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'kr_notatka'
ORDER BY cmd, policyname;
