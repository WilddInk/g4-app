-- =============================================================================
-- Usuwanie kamienia milowego (etapy) a tabela faktury
-- Błąd: violates foreign key constraint "faktury_etap_id_fkey" on table "faktury"
--
-- Postgres domyślnie blokuje DELETE wiersza KM, jeśli faktury wskazują na jego id.
-- Uruchom JEDNĄ z opcji poniżej w SQL Editor (dopasuj do potrzeb).
-- =============================================================================

ALTER TABLE public.faktury DROP CONSTRAINT IF EXISTS faktury_etap_id_fkey;

-- --- OPCJA A (zwykle najlepsza): usuń KM → w fakturach etap_id staje się NULL ----
-- Wymaga, żeby kolumna etap_id w faktury dopuszczała NULL.
-- Jeśli dostaniesz błąd o NOT NULL, użyj opcji B albo w Table Editor ustaw etap_id na
-- nullable, albo najpierw usuń / przepnij faktury ręcznie.

ALTER TABLE public.faktury
  ADD CONSTRAINT faktury_etap_id_fkey
  FOREIGN KEY (etap_id) REFERENCES public.etapy(id)
  ON DELETE SET NULL;

-- --- OPCJA B (ostrożnie): usuń KM → kasują się powiązane faktury -----------------
-- Odkomentuj poniższe ZAMIAST opcji A (najpierw usuń blok OPCJA A powyżej, jeśli już
-- został wykonany, albo DROP CONSTRAINT i dodaj na nowo).

-- ALTER TABLE public.faktury DROP CONSTRAINT IF EXISTS faktury_etap_id_fkey;
-- ALTER TABLE public.faktury
--   ADD CONSTRAINT faktury_etap_id_fkey
--   FOREIGN KEY (etap_id) REFERENCES public.etapy(id)
--   ON DELETE CASCADE;
