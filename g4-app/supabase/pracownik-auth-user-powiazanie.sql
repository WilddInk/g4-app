-- =============================================================================
-- Powiązanie konta Supabase Auth z rekordem public.pracownik (auth_user_id).
-- Bez tego po zalogowaniu użytkownik widzi: „Brak powiązania z kartoteką” —
-- panel „Moje dokumenty” nie wczytuje nic z pracownik_dokument, nawet gdy
-- admin zapisał pliki dla tej samej osoby w podglądzie.
--
-- Uruchom w Supabase → SQL Editor (role z dostępem do auth.users).
-- =============================================================================

-- --- Krok 1 (opcjonalnie): sprawdź konto i uuid -------------------------------
-- SELECT id, email, created_at FROM auth.users WHERE lower(email) = lower('anna.homik@g4geodezja.pl');

-- --- Krok 2: podejrzyj rekord pracownika (dopasuj warunek) ---------------------
-- SELECT nr, imie_nazwisko, auth_user_id FROM public.pracownik
-- WHERE lower(trim(imie_nazwisko)) LIKE '%homik%' OR lower(trim(imie_nazwisko)) LIKE '%anna%';

-- --- Krok 3: jednorazowe powiązanie po adresie e-mail (jeden wiersz pracownika) -
UPDATE public.pracownik p
SET auth_user_id = u.id
FROM auth.users u
WHERE lower(trim(u.email)) = lower(trim('anna.homik@g4geodezja.pl'))
  AND p.auth_user_id IS NULL
  AND lower(trim(p.imie_nazwisko)) = lower(trim('Anna Homik'));

-- Jeśli nie znalazło wiersza: sprawdź dokładną pisownię imie_nazwisko w tabeli
-- i e-mail w auth.users; ewentualnie użyj dopasowania po nr:
--
-- UPDATE public.pracownik
-- SET auth_user_id = (SELECT id FROM auth.users WHERE lower(email) = lower('anna.homik@g4geodezja.pl') LIMIT 1)
-- WHERE trim(nr) = '012';

-- --- Weryfikacja + dokumenty dla tego nr ---------------------------------------
-- SELECT p.nr, p.imie_nazwisko, p.auth_user_id, (SELECT count(*) FROM public.pracownik_dokument d WHERE d.pracownik_nr = p.nr) AS liczba_dokumentow
-- FROM public.pracownik p
-- WHERE p.auth_user_id IS NOT NULL AND lower(trim(p.imie_nazwisko)) = lower(trim('Anna Homik'));

-- UNIQUE(auth_user_id): jeden rekord pracownik na jedno konto. Jeśli UPDATE zwróci błąd
-- unikalności, usuń lub zmień auth_user_id u wcześniejszego duplikatu.
