-- Jak użytkownik podał estymację: godziny robocze lub dni robocze (wartość w estymacja_godzin zawsze to roboczogodziny).

ALTER TABLE public.zadania
  ADD COLUMN IF NOT EXISTS estymacja_jednostka text;

COMMENT ON COLUMN public.zadania.estymacja_jednostka IS 'h = wpis w godzinach roboczych, d = wpis w dniach roboczych (× 8 rob. h w aplikacji).';
