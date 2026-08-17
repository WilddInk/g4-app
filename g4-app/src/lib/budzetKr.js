import { grupaTypuCzasuWpisu } from "../domain/grupaTypuCzasuWpisu.js";
import { kosztWpisuPracy } from "./stawkaPracy.js";
import { zbudujBudzetKrCsv, pobierzBudzetKrCsv } from "./exportBudzetKrCsv.js";

function typFakturyKosztowej(row) {
  return (
    String(row.typ_nazwy ?? "").trim() ||
    String(row.rodzaj_kosztu_nazwa ?? "").trim() ||
    String(row.rodzaj_kosztu ?? "").trim() ||
    "Nieokreślony"
  );
}

/**
 * Agregacja kosztów pracowniczych i faktur dla widoku BUDŻET KR.
 */
export function zbudujDaneBudzetuKr({
  kr,
  listaFakturKr,
  krCzasPracyWpisyList,
  stawkiByNr,
  pracownicy,
  draft,
}) {
  const parseNum = (v) => {
    const t = String(v ?? "").trim().replace(/\s/g, "").replace(",", ".");
    if (!t) return 0;
    const n = Number(t);
    return Number.isFinite(n) ? n : 0;
  };

  const budzetBrutto = parseNum(draft?.budzetBrutto);
  const ha = parseNum(draft?.ha);
  const dzialki = parseNum(draft?.liczbaDzialek);

  const sumaFakturBrutto = listaFakturKr.reduce((acc, row) => acc + (Number(row.kwota_brutto) || 0), 0);

  let godzinyPracy = 0;
  let sumaKosztPracy = 0;
  let godzinyBezStawki = 0;
  const byPrac = new Map();

  for (const w of krCzasPracyWpisyList) {
    if (grupaTypuCzasuWpisu(w.typ) !== "praca") continue;
    const nr = String(w.pracownik_nr ?? "").trim() || "—";
    const stawki = stawkiByNr?.get?.(nr) ?? stawkiByNr?.[nr] ?? [];
    const { godziny, koszt } = kosztWpisuPracy(w, stawki);
    godzinyPracy += godziny;
    const cur = byPrac.get(nr) ?? { nr, godziny: 0, koszt: 0, bezStawkiH: 0, maKoszt: false };
    cur.godziny += godziny;
    if (koszt != null) {
      cur.koszt += koszt;
      cur.maKoszt = true;
      sumaKosztPracy += koszt;
    } else {
      cur.bezStawkiH += godziny;
      godzinyBezStawki += godziny;
    }
    byPrac.set(nr, cur);
  }

  const etykietaPrac = (nr) => {
    const p = (pracownicy ?? []).find((x) => String(x.nr ?? "").trim() === String(nr ?? "").trim());
    return p?.imie_nazwisko?.trim() ? `${nr} — ${p.imie_nazwisko.trim()}` : String(nr ?? "—");
  };

  const kosztyPracownicze = Array.from(byPrac.values())
    .map((r) => ({
      nr: r.nr,
      etykieta: etykietaPrac(r.nr),
      godziny: r.godziny,
      koszt: r.maKoszt ? Math.round(r.koszt * 100) / 100 : null,
      bezStawkiH: r.bezStawkiH,
    }))
    .sort((a, b) => {
      const ka = a.koszt ?? -1;
      const kb = b.koszt ?? -1;
      if (kb !== ka) return kb - ka;
      return b.godziny - a.godziny;
    });

  const byTyp = new Map();
  for (const row of listaFakturKr) {
    const typ = typFakturyKosztowej(row);
    const g = byTyp.get(typ) ?? { typ, suma: 0, rows: [] };
    g.suma += Number(row.kwota_brutto) || 0;
    g.rows.push(row);
    byTyp.set(typ, g);
  }
  const fakturyWgTypu = Array.from(byTyp.values())
    .map((g) => ({
      ...g,
      suma: Math.round(g.suma * 100) / 100,
      rows: [...g.rows].sort((a, b) =>
        String(b.data_faktury ?? b.created_at ?? "").localeCompare(String(a.data_faktury ?? a.created_at ?? "")),
      ),
    }))
    .sort((a, b) => b.suma - a.suma);

  const razemKoszty = sumaKosztPracy + sumaFakturBrutto;
  const budzetProc = budzetBrutto > 0 ? (razemKoszty / budzetBrutto) * 100 : 0;
  const kosztNaHa = ha > 0 ? razemKoszty / ha : 0;
  const kosztNaDzialke = dzialki > 0 ? razemKoszty / dzialki : 0;

  return {
    kr,
    budzetBrutto,
    ha,
    dzialki,
    sumaFakturBrutto,
    sumaKosztPracy: Math.round(sumaKosztPracy * 100) / 100,
    godzinyPracy,
    godzinyBezStawki,
    razemKoszty: Math.round(razemKoszty * 100) / 100,
    budzetProc,
    kosztNaHa,
    kosztNaDzialke,
    kosztyPracownicze,
    fakturyWgTypu,
  };
}

export function eksportujBudzetKrDoExcela(dane) {
  const csv = zbudujBudzetKrCsv(dane);
  const safe = String(dane.kr || "KR").replace(/[^\w.-]+/g, "_");
  pobierzBudzetKrCsv(`budzet-KR-${safe}.csv`, csv);
}
