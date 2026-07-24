-- Kolumna flagi „w trakcie fakturowania” na tabeli public.kr
-- Uruchom w Supabase → SQL Editor → Run
-- Używane w module FAKTUROWANIE → Bieżące KR

ALTER TABLE public.kr
  ADD COLUMN IF NOT EXISTS fakturowanie_w_trakcie boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.kr.fakturowanie_w_trakcie IS
  'true = KR jest w bieżącym procesie fakturowania (moduł FAKTUROWANIE → Bieżące KR)';

CREATE INDEX IF NOT EXISTS kr_fakturowanie_w_trakcie_idx
  ON public.kr (fakturowanie_w_trakcie)
  WHERE fakturowanie_w_trakcie = true;
