-- Opcjonalne kolumny: faktura SPRZEDAŻOWA powiązana z etapem (public.faktury.etap_id).
-- Pulpit INV / kolumny FS w etapach; „kosztowe” — docelowo inna tabela lub typ dokumentu.
-- Uruchom w Supabase SQL Editor według potrzeby.

ALTER TABLE public.faktury
  ADD COLUMN IF NOT EXISTS odebrane_protokolem boolean;

COMMENT ON COLUMN public.faktury.odebrane_protokolem IS 'Sprzedaż: czy odbiór potwierdzony protokołem (wzgl. etapu)';

-- BRUDNOPIS: pełna lista pól FS (numer, netto, VAT, data sprzedaży…) — uzupełnić w jednym skrypcie albo migracji UI.
