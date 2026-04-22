-- Jednorazowo: usuń zdublowane wpisy z importu „RozliczenieGodzinowe” (podwójny import SQL).
-- Zostaje pierwszy wpis wg created_at (przy remisie — mniejszy id).
-- Uruchom w SQL Editor po świadomej decyzji / kopii zapasowej.

DELETE FROM public.czas_pracy_wpis del
WHERE del.id IN (
  SELECT w.id
  FROM (
    SELECT
      id,
      row_number() OVER (
        PARTITION BY
          pracownik_nr,
          data,
          coalesce(trim(kr), ''),
          typ,
          coalesce(godziny, 0),
          coalesce(nadgodziny, 0),
          coalesce(trim(wykonywane_zadanie), '')
        ORDER BY created_at ASC NULLS LAST, id ASC
      ) AS rn
    FROM public.czas_pracy_wpis
    WHERE strpos(coalesce(uwagi, ''), 'Import: RozliczenieGodzinowe') > 0
  ) w
  WHERE w.rn > 1
);
