-- Usunięcie sprzętu ma usunąć wpisy planowania terenu, które go używały (brak blokady FK).
ALTER TABLE public.kr_teren_przydzial_zasob
  DROP CONSTRAINT IF EXISTS kr_teren_przydzial_zasob_sprzet_id_fkey;

ALTER TABLE public.kr_teren_przydzial_zasob
  ADD CONSTRAINT kr_teren_przydzial_zasob_sprzet_id_fkey
  FOREIGN KEY (sprzet_id) REFERENCES public.sprzet(id) ON DELETE CASCADE;
