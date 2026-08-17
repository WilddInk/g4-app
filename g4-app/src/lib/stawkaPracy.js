/** Stawka godzinowa obowiązująca w danym dniu (okresy `pracownik_stawka_okres`). */
export function stawkaDlaDaty(stawki, dataIso) {
  const d = String(dataIso ?? "").slice(0, 10);
  if (!d) return null;
  const pas = (stawki ?? [])
    .filter((r) => {
      const od = String(r.data_od ?? "").slice(0, 10);
      const doo = String(r.data_do ?? "").slice(0, 10);
      if (!od || d < od) return false;
      // brak końca / daleka data „bez terminu” (eksport Księgowość → 2099-12-31)
      if (!doo || doo.startsWith("2099")) return true;
      return d <= doo;
    })
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
