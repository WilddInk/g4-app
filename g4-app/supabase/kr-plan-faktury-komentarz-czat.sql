-- Wątek / czat uwag do pozycji planu faktur FS
-- Supabase → SQL Editor → Run

CREATE TABLE IF NOT EXISTS public.kr_plan_faktury_komentarz (
  id bigserial PRIMARY KEY,
  plan_id bigint NOT NULL REFERENCES public.kr_plan_faktury (id) ON DELETE CASCADE,
  tresc text NOT NULL,
  autor text,
  autor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kr_plan_faktury_komentarz_plan_idx
  ON public.kr_plan_faktury_komentarz (plan_id, created_at);

COMMENT ON TABLE public.kr_plan_faktury_komentarz IS
  'Komentarze / uwagi do pozycji planu faktur — forma rozmowy (kto, kiedy, treść).';

-- Jednorazowa migracja starego pola uwagi → pierwsza wiadomość w wątku
INSERT INTO public.kr_plan_faktury_komentarz (plan_id, tresc, created_at)
SELECT
  p.id,
  p.uwagi,
  COALESCE(p.updated_at, p.created_at, now())
FROM public.kr_plan_faktury p
WHERE p.uwagi IS NOT NULL
  AND TRIM(p.uwagi) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.kr_plan_faktury_komentarz k
    WHERE k.plan_id = p.id
  );

ALTER TABLE public.kr_plan_faktury_komentarz ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kr_plan_faktury_komentarz" ON public.kr_plan_faktury_komentarz;
DROP POLICY IF EXISTS "anon_insert_kr_plan_faktury_komentarz" ON public.kr_plan_faktury_komentarz;
DROP POLICY IF EXISTS "auth_select_kr_plan_faktury_komentarz" ON public.kr_plan_faktury_komentarz;
DROP POLICY IF EXISTS "auth_insert_kr_plan_faktury_komentarz" ON public.kr_plan_faktury_komentarz;

CREATE POLICY "anon_select_kr_plan_faktury_komentarz"
  ON public.kr_plan_faktury_komentarz FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kr_plan_faktury_komentarz"
  ON public.kr_plan_faktury_komentarz FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "auth_select_kr_plan_faktury_komentarz"
  ON public.kr_plan_faktury_komentarz FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_kr_plan_faktury_komentarz"
  ON public.kr_plan_faktury_komentarz FOR INSERT TO authenticated WITH CHECK (true);

GRANT SELECT, INSERT ON public.kr_plan_faktury_komentarz TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.kr_plan_faktury_komentarz_id_seq TO anon, authenticated;
