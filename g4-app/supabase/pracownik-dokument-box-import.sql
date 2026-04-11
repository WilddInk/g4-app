-- =============================================================================
-- Rozszerzenie: import wielu linków Box (ta sama nazwa pliku + URL w linii),
-- kolumny nazwa_pliku / firma_kod; typ „zaimportowane_box” (wiele na osobę).
-- Uruchom w Supabase SQL Editor po pracownik-dokumenty-i-arkusz.sql
-- =============================================================================

ALTER TABLE public.pracownik_dokument
  ADD COLUMN IF NOT EXISTS nazwa_pliku text,
  ADD COLUMN IF NOT EXISTS firma_kod text;

COMMENT ON COLUMN public.pracownik_dokument.nazwa_pliku IS
  'Tekst przed URL (np. pełna nazwa z Box listy)';
COMMENT ON COLUMN public.pracownik_dokument.firma_kod IS
  'A | B | C z formatu HR---A---... (firma w grupie G4)';

-- Stary UNIQUE (nr, typ) blokuje wiele „zaimportowane_box” — usuwamy.
ALTER TABLE public.pracownik_dokument
  DROP CONSTRAINT IF EXISTS pracownik_dokument_nr_typ_unique;

ALTER TABLE public.pracownik_dokument
  DROP CONSTRAINT IF EXISTS pracownik_dokument_typ_check;

ALTER TABLE public.pracownik_dokument
  ADD CONSTRAINT pracownik_dokument_typ_check CHECK (
    typ = ANY (
      ARRAY[
        'umowa',
        'bhp',
        'orzeczenie_lekarskie',
        'kwitek_wyplaty',
        'zaimportowane_box'
      ]::text[]
    )
  );

-- Jedna kombinacja nr + url (nie duplikuj tego samego linku dla tej osoby).
DROP INDEX IF EXISTS pracownik_dokument_nr_url_uq;

CREATE UNIQUE INDEX pracownik_dokument_nr_url_uq
  ON public.pracownik_dokument (pracownik_nr, url);

-- Co najwyżej jeden wpis na „stały” typ HR (umowa, BHP, …).
DROP INDEX IF EXISTS pracownik_dokument_nr_typ_std_uq;

CREATE UNIQUE INDEX pracownik_dokument_nr_typ_std_uq
  ON public.pracownik_dokument (pracownik_nr, typ)
  WHERE typ IN ('umowa', 'bhp', 'orzeczenie_lekarskie', 'kwitek_wyplaty');

COMMENT ON COLUMN public.pracownik_dokument.typ IS
  'umowa | bhp | orzeczenie_lekarskie | kwitek_wyplaty | zaimportowane_box';

-- Po migracji: jeśli INSERT z aplikacji zwraca błąd RLS — uruchom
-- pracownik-dokument-rls-naprawa.sql (albo cały rls-policies-authenticated.sql + anon).
