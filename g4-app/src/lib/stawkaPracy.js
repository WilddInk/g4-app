/** Stawka godzinowa obowiązująca w danym dniu (okresy `pracownik_stawka_okres`). */
export function stawkaDlaDaty(stawki, dataIso) {
  const pas = (stawki ?? [])
    .filter((r) => dataIso >= r.data_od && dataIso <= r.data_do)
    .sort((a, b) => String(b.data_od).localeCompare(String(a.data_od)));
  return pas[0] ?? null;
}

/**
 * Koszt jednego wpisu czasu pracy (tylko gdy jest stawka).
 * @returns {{ godziny: number, stawka: number | null, koszt: number | null }}
 */
export function kosztWpisuPracy(wpis, stawkiPracownika) {
  const godziny = (Number(wpis?.godziny) || 0) + (Number(wpis?.nadgodziny) || 0);
  const dataIso = String(wpis?.data ?? "").slice(0, 10);
  const st = stawkaDlaDaty(stawkiPracownika, dataIso);
  const stawka = st != null ? Number(st.stawka_za_godzine) : null;
  if (stawka == null || !Number.isFinite(stawka)) {
    return { godziny, stawka: null, koszt: null };
  }
  return { godziny, stawka, koszt: Math.round(godziny * stawka * 100) / 100 };
}
