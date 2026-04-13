/** Skraca ISO z bazy do YYYY-MM-DD pod input type="date"; puste → "". */
export function dataDoInputa(v) {
  if (v == null || v === "") return "";
  return String(v).slice(0, 10);
}

/** YYYY-MM-DD do sortowania osi czasu; niepoprawne → null. */
export function dataDoSortuYYYYMMDD(v) {
  const s = dataDoInputa(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

/** Wyświetlanie daty DD.MM.RRRR. */
export function dataPLZFormat(yyyymmdd) {
  if (!yyyymmdd || !/^\d{4}-\d{2}-\d{2}$/.test(String(yyyymmdd))) return "—";
  const s = String(yyyymmdd).slice(0, 10);
  return `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`;
}

/** Tekst z pola bazy — bezpiecznie; `x?.trim()` na liczbie/bool daje crash (`undefined()`). */
export function tekstTrim(v) {
  if (v == null || v === "") return "";
  return String(v).trim();
}
