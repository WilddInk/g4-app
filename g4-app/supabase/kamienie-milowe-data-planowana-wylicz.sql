-- data_planowana z data_odniesienia + offset_miesiecy (Supabase → SQL Editor).
-- Uruchom po kamienie-milowe-odniesienie-offset.sql (lub skrypt jest samowystarczalny poniżej).
--
-- Reguła: gdy oba pola są ustawione, data_planowana = data_odniesienia + N miesięcy (PostgreSQL / make_interval).
-- Przeliczenie tylko przy INSERT albo gdy zmieni się data_odniesienia albo offset_miesiecy — ręczna korekta samej
-- data_planowana przy niezmienionej parze odniesienie+offset nie jest nadpisywana przy zapisie innych kolumn.

ALTER TABLE public.kamienie_milowe
  ADD COLUMN IF NOT EXISTS data_odniesienia date,
  ADD COLUMN IF NOT EXISTS offset_miesiecy integer;

CREATE OR REPLACE FUNCTION public.kamienie_milowe_wylicz_data_planowana()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.data_odniesienia IS NOT NULL AND NEW.offset_miesiecy IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      NEW.data_planowana :=
        (NEW.data_odniesienia + make_interval(months => NEW.offset_miesiecy))::date;
    ELSIF
      NEW.data_odniesienia IS DISTINCT FROM OLD.data_odniesienia
      OR NEW.offset_miesiecy IS DISTINCT FROM OLD.offset_miesiecy
    THEN
      NEW.data_planowana :=
        (NEW.data_odniesienia + make_interval(months => NEW.offset_miesiecy))::date;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kamienie_milowe_wylicz_data_planowana ON public.kamienie_milowe;

CREATE TRIGGER kamienie_milowe_wylicz_data_planowana
  BEFORE INSERT OR UPDATE ON public.kamienie_milowe
  FOR EACH ROW
  EXECUTE FUNCTION public.kamienie_milowe_wylicz_data_planowana();

COMMENT ON FUNCTION public.kamienie_milowe_wylicz_data_planowana() IS
  'Ustawia data_planowana z data_odniesienia + offset_miesiecy przy insert lub zmianie kotwicy/offsetu.';
