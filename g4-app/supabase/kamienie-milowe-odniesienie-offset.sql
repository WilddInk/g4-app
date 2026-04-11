-- Kotwica terminu + offset (miesiące) dla public.etapy.
-- Uruchom w Supabase SQL Editor. data_planowana może być liczona w aplikacji jako
-- data_odniesienia + offset_miesiecy albo utrzymywana ręcznie — zależnie od ustalonej logiki.

ALTER TABLE public.etapy
  ADD COLUMN IF NOT EXISTS data_odniesienia date,
  ADD COLUMN IF NOT EXISTS offset_miesiecy integer;

COMMENT ON COLUMN public.etapy.data_odniesienia IS 'Data, od której liczony jest termin (np. wpływ, umowa, koniec innego etapu)';
COMMENT ON COLUMN public.etapy.offset_miesiecy IS 'Liczba miesięcy od data_odniesienia do planowego terminu; NULL = bez automatycznego naliczania';
