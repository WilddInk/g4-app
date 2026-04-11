-- Status kamieni milowych + CHECK (Supabase → SQL Editor → Run całość naraz).
-- Błąd 23514 = w tabeli są wiersze z `status` spoza dozwolonej listy. Poniżej najpierw
-- normalizujemy / zerujemy takie wartości, potem dodajemy constraint.

-- Jeśli constraint już istnieje w połowie nieudanej migracji:
ALTER TABLE public.etapy DROP CONSTRAINT IF EXISTS etapy_status_check;

-- Puste po obcięciu → NULL
UPDATE public.etapy
SET status = NULL
WHERE status IS NOT NULL
  AND btrim(status) = '';

-- Jednolity zapis (bez zbędnych spacji)
UPDATE public.etapy
SET status = btrim(status)
WHERE status IS NOT NULL;

-- Mapowanie często spotykanych wartości (np. takie same jak status KR albo stare wpisy ręczne)
UPDATE public.etapy
SET status = 'zrealizowane'
WHERE status IN ('zakończone', 'Zakończone');

UPDATE public.etapy
SET status = 'oczekuje'
WHERE status IN ('oczekuje na zamawiającego', 'Oczekuje na zamawiającego');

-- Ujednolicenie dozwolonych etykiet (wielkość liter) — lista musi dokładnie pasować do CHECK
UPDATE public.etapy SET status = 'planowane' WHERE lower(btrim(status)) = 'planowane';
UPDATE public.etapy SET status = 'w trakcie' WHERE lower(btrim(status)) = 'w trakcie';
UPDATE public.etapy SET status = 'zrealizowane' WHERE lower(btrim(status)) = 'zrealizowane';
UPDATE public.etapy SET status = 'rozliczone' WHERE lower(btrim(status)) = 'rozliczone';
UPDATE public.etapy SET status = 'oczekuje' WHERE lower(btrim(status)) = 'oczekuje';
UPDATE public.etapy SET status = 'anulowane' WHERE lower(btrim(status)) = 'anulowane';

-- Wszystko, co nadal nie jest na liście docelowej → NULL (wtedy CHECK przejdzie)
UPDATE public.etapy
SET status = NULL
WHERE status IS NOT NULL
  AND status NOT IN (
    'planowane',
    'w trakcie',
    'zrealizowane',
    'rozliczone',
    'oczekuje',
    'anulowane'
  );

ALTER TABLE public.etapy ADD CONSTRAINT etapy_status_check CHECK (
  status IS NULL
    OR status IN (
      'planowane',
      'w trakcie',
      'zrealizowane',
      'rozliczone',
      'oczekuje',
      'anulowane'
    )
);

COMMENT ON COLUMN public.etapy.status IS 'Status etapu KM: planowane, w trakcie, zrealizowane, rozliczone, oczekuje, anulowane';
