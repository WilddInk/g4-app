-- =============================================================================
-- Automatyczne powiązanie: auth.users -> public.pracownik.auth_user_id
-- Match po e-mailu (case-insensitive, trim), tylko gdy:
-- - public.pracownik.auth_user_id jest NULL
-- - istnieje dokładnie 1 kandydat w public.pracownik dla danego e-maila
--
-- Uruchom raz w Supabase SQL Editor.
-- =============================================================================

-- 0) Metryki konta logowania w tabeli pracownik.
ALTER TABLE public.pracownik
  ADD COLUMN IF NOT EXISTS konto_logowania_utworzone_at timestamptz,
  ADD COLUMN IF NOT EXISTS ostatnie_logowanie_at timestamptz;

COMMENT ON COLUMN public.pracownik.konto_logowania_utworzone_at IS
  'Data utworzenia konta logowania (auth.users.created_at).';
COMMENT ON COLUMN public.pracownik.ostatnie_logowanie_at IS
  'Data ostatniego logowania (auth.users.last_sign_in_at).';

-- 1) Funkcja triggera
CREATE OR REPLACE FUNCTION public.map_auth_user_to_pracownik()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_count integer;
BEGIN
  v_email := lower(trim(NEW.email));

  IF v_email IS NULL OR v_email = '' THEN
    RETURN NEW;
  END IF;

  -- Jeśli kolumna email nie istnieje (niestandardowa baza), bezpiecznie pomiń.
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'pracownik'
      AND c.column_name = 'email'
  ) THEN
    RETURN NEW;
  END IF;

  -- Aktualizuj tylko przy jednoznacznym dopasowaniu.
  SELECT count(*)
  INTO v_count
  FROM public.pracownik p
  WHERE p.auth_user_id IS NULL
    AND lower(trim(p.email)) = v_email;

  IF v_count = 1 THEN
    UPDATE public.pracownik p
    SET auth_user_id = NEW.id,
        konto_logowania_utworzone_at = COALESCE(p.konto_logowania_utworzone_at, NEW.created_at),
        ostatnie_logowanie_at = COALESCE(NEW.last_sign_in_at, p.ostatnie_logowanie_at)
    WHERE p.auth_user_id IS NULL
      AND lower(trim(p.email)) = v_email;
  ELSE
    UPDATE public.pracownik p
    SET ostatnie_logowanie_at = COALESCE(NEW.last_sign_in_at, p.ostatnie_logowanie_at)
    WHERE p.auth_user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.map_auth_user_to_pracownik() IS
  'Automatyczne mapowanie auth.users -> public.pracownik.auth_user_id po email.';

-- 2) Trigger na auth.users
DROP TRIGGER IF EXISTS trg_map_auth_user_to_pracownik ON auth.users;

CREATE TRIGGER trg_map_auth_user_to_pracownik
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.map_auth_user_to_pracownik();

-- 3) Jednorazowy backfill dla już istniejących kont (opcjonalny, ale zalecany)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'pracownik'
      AND c.column_name = 'email'
  ) THEN
    UPDATE public.pracownik p
    SET auth_user_id = u.id
    FROM auth.users u
    WHERE p.auth_user_id IS NULL
      AND lower(trim(p.email)) = lower(trim(u.email))
      AND (
        SELECT count(*)
        FROM public.pracownik p2
        WHERE p2.auth_user_id IS NULL
          AND lower(trim(p2.email)) = lower(trim(u.email))
      ) = 1;

    UPDATE public.pracownik p
    SET konto_logowania_utworzone_at = COALESCE(p.konto_logowania_utworzone_at, u.created_at),
        ostatnie_logowanie_at = COALESCE(u.last_sign_in_at, p.ostatnie_logowanie_at)
    FROM auth.users u
    WHERE p.auth_user_id = u.id;
  END IF;
END $$;

-- 4) Diagnostyka: konflikty (więcej niż 1 pracownik na ten sam e-mail)
-- SELECT lower(trim(email)) AS email_key, count(*) AS ile
-- FROM public.pracownik
-- WHERE email IS NOT NULL AND trim(email) <> ''
-- GROUP BY lower(trim(email))
-- HAVING count(*) > 1
-- ORDER BY ile DESC, email_key;
