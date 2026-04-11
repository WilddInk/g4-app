-- =============================================================================
-- public.pracownik — rozszerzenie: dział (CHECK), app_role, auth_user_id, is_active
-- Wklej w Supabase → SQL Editor → Run.
--
-- Wymaga istniejącej tabeli public.pracownik (ALTER, nie CREATE).
-- Nie usuwa danych. Kolumny dodawane z IF NOT EXISTS.
-- Przed CHECK na dzial: normalizacja starych etykiet (np. z seed-demo-geodezja.sql).
-- auth_user_id: opcjonalny link do auth.users — istniejące wiersze zostają z NULL.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Kolumny (idempotentnie)
-- ---------------------------------------------------------------------------
ALTER TABLE public.pracownik
  ADD COLUMN IF NOT EXISTS dzial text,
  ADD COLUMN IF NOT EXISTS app_role text NOT NULL DEFAULT 'uzytkownik',
  ADD COLUMN IF NOT EXISTS auth_user_id uuid,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.pracownik.dzial IS
  'Dział: administracja | dzial_prawny | dzial_inzynieryjny | dzial_nieruchomosci | dzial_terenowy (albo NULL)';
COMMENT ON COLUMN public.pracownik.app_role IS
  'Rola w aplikacji: admin | kierownik | uzytkownik';
COMMENT ON COLUMN public.pracownik.auth_user_id IS
  'Opcjonalne powiązanie z auth.users(id)';
COMMENT ON COLUMN public.pracownik.is_active IS
  'Czy konto pracownika jest aktywne w aplikacji';

-- ---------------------------------------------------------------------------
-- 2) Normalizacja dzial (stare etykiety → kody) — dopasuj lub rozszerz pod swoją bazę
-- ---------------------------------------------------------------------------
UPDATE public.pracownik
SET dzial = 'dzial_inzynieryjny'
WHERE dzial IS NOT NULL
  AND trim(dzial) <> ''
  AND dzial NOT IN (
    'administracja',
    'dzial_prawny',
    'dzial_inzynieryjny',
    'dzial_nieruchomosci',
    'dzial_terenowy'
  )
  AND (
    lower(trim(dzial)) LIKE '%inzynieryjny%'
    OR lower(trim(dzial)) LIKE '%inżynieryjny%'
    OR lower(trim(dzial)) LIKE '%inżynier%'
  );

UPDATE public.pracownik
SET dzial = 'dzial_prawny'
WHERE dzial IS NOT NULL
  AND trim(dzial) <> ''
  AND dzial NOT IN (
    'administracja',
    'dzial_prawny',
    'dzial_inzynieryjny',
    'dzial_nieruchomosci',
    'dzial_terenowy'
  )
  AND lower(trim(dzial)) LIKE '%prawn%';

UPDATE public.pracownik
SET dzial = 'administracja'
WHERE dzial IS NOT NULL
  AND trim(dzial) <> ''
  AND dzial NOT IN (
    'administracja',
    'dzial_prawny',
    'dzial_inzynieryjny',
    'dzial_nieruchomosci',
    'dzial_terenowy'
  )
  AND lower(trim(dzial)) LIKE '%administr%';

UPDATE public.pracownik
SET dzial = 'dzial_nieruchomosci'
WHERE dzial IS NOT NULL
  AND trim(dzial) <> ''
  AND dzial NOT IN (
    'administracja',
    'dzial_prawny',
    'dzial_inzynieryjny',
    'dzial_nieruchomosci',
    'dzial_terenowy'
  )
  AND lower(trim(dzial)) LIKE '%nieruchom%';

UPDATE public.pracownik
SET dzial = 'dzial_terenowy'
WHERE dzial IS NOT NULL
  AND trim(dzial) <> ''
  AND dzial NOT IN (
    'administracja',
    'dzial_prawny',
    'dzial_inzynieryjny',
    'dzial_nieruchomosci',
    'dzial_terenowy'
  )
  AND lower(trim(dzial)) LIKE '%teren%';

-- Wiersze nadal spoza listy: ustaw na NULL (zachowanie rekordu; wymagane przed CHECK).
-- Jeśli wolisz ręcznie poprawić — zakomentuj poniższe i napraw SELECT-em z końca pliku.
UPDATE public.pracownik
SET dzial = NULL
WHERE dzial IS NOT NULL
  AND trim(dzial) <> ''
  AND dzial NOT IN (
    'administracja',
    'dzial_prawny',
    'dzial_inzynieryjny',
    'dzial_nieruchomosci',
    'dzial_terenowy'
  );

-- ---------------------------------------------------------------------------
-- 3) CHECK: dzial (nullable; dozwolone wartości + NULL)
-- ---------------------------------------------------------------------------
ALTER TABLE public.pracownik
  DROP CONSTRAINT IF EXISTS pracownik_dzial_check;

ALTER TABLE public.pracownik
  ADD CONSTRAINT pracownik_dzial_check
  CHECK (
    dzial IS NULL
    OR dzial = ANY (
      ARRAY[
        'administracja',
        'dzial_prawny',
        'dzial_inzynieryjny',
        'dzial_nieruchomosci',
        'dzial_terenowy'
      ]::text[]
    )
  );

-- ---------------------------------------------------------------------------
-- 4) CHECK: app_role
-- ---------------------------------------------------------------------------
ALTER TABLE public.pracownik
  DROP CONSTRAINT IF EXISTS pracownik_app_role_check;

ALTER TABLE public.pracownik
  ADD CONSTRAINT pracownik_app_role_check
  CHECK (
    app_role = ANY (ARRAY['admin', 'kierownik', 'uzytkownik']::text[])
  );

-- ---------------------------------------------------------------------------
-- 5) UNIQUE(auth_user_id) — wiele NULL jest dozwolone w PostgreSQL
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS pracownik_auth_user_id_unique;

CREATE UNIQUE INDEX pracownik_auth_user_id_unique
  ON public.pracownik (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 6) FK → auth.users(id)
-- ---------------------------------------------------------------------------
ALTER TABLE public.pracownik
  DROP CONSTRAINT IF EXISTS pracownik_auth_user_id_fkey;

ALTER TABLE public.pracownik
  ADD CONSTRAINT pracownik_auth_user_id_fkey
  FOREIGN KEY (auth_user_id)
  REFERENCES auth.users (id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- =============================================================================
-- Diagnostyka (opcjonalnie uruchom osobno):
-- SELECT nr, imie_nazwisko, dzial, app_role, auth_user_id, is_active FROM public.pracownik ORDER BY nr;
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 7) Ustawienie wskazanego użytkownika jako admin
-- -----------------------------------------------------------------------------
UPDATE public.pracownik
SET dzial = 'administracja',
    app_role = 'admin',
    is_active = true
WHERE trim(imie_nazwisko) = 'Monika Jakubowska';
