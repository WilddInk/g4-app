/**
 * Parsowanie „RozliczenieGodzinowe” CMP (.xlsx) → rekordy do `czas_pracy_wpis`.
 * Logika zgodna z scripts/import_rozliczenie_godzinowe_xlsx_to_sql.py
 */

import * as XLSX from "xlsx";

const MM_RRRR = /^\d{2}-\d{4}$/;
const GODZ_PELNY_DZIEN = 8;

/** KR ogólnobiurowa (biuro); w arkuszu Excel często jako liczba 0 lub tekst „0”. */
export const KR_OGOLNOBIUROWY = "000";

/** Trzy same cyfry → jedno zero z przodu (779→0779); „000” ogólnobiurowy bez zmian. */
function dopelnijKrTrzyCyfryLeadingZero(s) {
  if (!s || s === KR_OGOLNOBIUROWY) return s;
  return /^\d{3}$/.test(s) ? `0${s}` : s;
}

/**
 * @param {unknown} krVal — wartość z kolumny OBIEKT NR / KR w arkuszu
 * @returns {string}
 */
export function normalizujKrZArkusza(krVal) {
  if (krVal == null || krVal === "") return "";
  if (typeof krVal === "number" && Number.isFinite(krVal) && krVal === 0) return KR_OGOLNOBIUROWY;
  const s = String(krVal).trim();
  if (s === "0") return KR_OGOLNOBIUROWY;
  return dopelnijKrTrzyCyfryLeadingZero(s);
}

function unikalneZachowujacKolejnosc(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

/**
 * CMP często wpisuje kilka KR w jednej komórce E (np. „000/1079”, „000, 1079”).
 * Każdy KR importujemy jako osobny wiersz z tą samą liczbą godzin z J — potem
 * `zastosujPodzialGodzinMiedzyKrBezZakresu` rozłoży sumę na KR.
 * @param {unknown} krVal
 * @returns {string[]}
 */
export function rozbijKryZZkomorki(krVal) {
  if (krVal == null || krVal === "") return [];
  if (typeof krVal === "number" && Number.isFinite(krVal) && krVal === 0) {
    return [KR_OGOLNOBIUROWY];
  }
  const raw = String(krVal).trim();
  if (!raw) return [];
  if (raw === "0") return [KR_OGOLNOBIUROWY];

  const poSeparatorach = raw
    .split(/[,;/|]+/)
    .map((p) => normalizujKrZArkusza(p.trim()))
    .filter(Boolean);
  if (poSeparatorach.length > 1) {
    return unikalneZachowujacKolejnosc(poSeparatorach);
  }

  const multiDigit = raw.match(/\d{3,4}/g);
  const wygladaNaWieleKodow =
    multiDigit &&
    multiDigit.length > 1 &&
    (/[^\d\s]/.test(raw) || /\d\s+\d/.test(raw));
  if (wygladaNaWieleKodow) {
    const nums = multiDigit.map((m) => normalizujKrZArkusza(m)).filter(Boolean);
    return unikalneZachowujacKolejnosc(nums);
  }

  const one = normalizujKrZArkusza(krVal);
  return one ? [one] : [];
}

function sortujNazwyMiesieczne(a, b) {
  const [ma, ya] = String(a).split("-").map(Number);
  const [mb, yb] = String(b).split("-").map(Number);
  return ya !== yb ? ya - yb : ma - mb;
}

/**
 * Pierwszy i ostatni dzień miesiąca dla nazwy arkusza MM-YYYY (stringi ISO YYYY-MM-DD).
 * @param {string} sheetLabel np. "02-2026"
 * @returns {{ odIso: string, doIso: string } | null}
 */
export function zakresMiesiacaZKoduArkusza(sheetLabel) {
  const m = String(sheetLabel ?? "").trim().match(/^(\d{2})-(\d{4})$/);
  if (!m) return null;
  const mm = parseInt(m[1], 10);
  const yyyy = parseInt(m[2], 10);
  if (mm < 1 || mm > 12 || !Number.isFinite(yyyy)) return null;
  const odIso = `${yyyy}-${String(mm).padStart(2, "0")}-01`;
  const lastDay = new Date(yyyy, mm, 0).getDate();
  const doIso = `${yyyy}-${String(mm).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { odIso, doIso };
}

/**
 * Lista nazw arkuszy miesięcznych z pliku „RozliczenieGodzinowe” (np. 01-2026 … 12-2026).
 * @param {ArrayBuffer} buf
 * @returns {string[]}
 */
export function listujArkuszeMiesieczneRozliczenie(buf) {
  const wb = XLSX.read(buf, { type: "array", cellDates: true, raw: false });
  const names = wb.SheetNames.filter((n) => MM_RRRR.test(String(n).trim()));
  return [...names].sort(sortujNazwyMiesieczne);
}

/** Parsuje wartość liczbową z komórki ewidencyjnej (np. 259 lub „nr 259”). */
function wartoscEwidencyjnaZKomorki(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return String(Math.trunc(v));
  const s = String(v).trim();
  if (/^\d+$/.test(s)) return s;
  const m = s.match(/\d+/);
  return m ? m[0] : null;
}

/**
 * CMP: nagłówek typu „NUMER EWID.” w kolumnie B, wartość w D (czasem przy scaleniach liczba stoi w E).
 * Pierwszy pasujący `includes('numer ewid')` bywa mylący (np. duży blok tekstu + obca liczba w D).
 */
function priorytetEtykietyNumeruEwid(labelRaw) {
  const t = String(labelRaw ?? "").trim();
  const low = t.toLowerCase();
  if (!(low.includes("numer ewid") || low.includes("numer ewiden"))) return null;
  if (/^numer\s+ewid\.?\s*$/i.test(t)) return 320;
  if (/^numer ewidencyjny\s*:?\s*$/i.test(t)) return 310;
  if (/^numer ewidencyjny\b/i.test(t) && t.length <= 42) return 280;
  if (/^numer\s+ewid\b/i.test(t) && t.length <= 36) return 260;
  return Math.max(0, 140 - Math.min(t.length, 140));
}

/** @param {unknown[][]} rows */
function znajdzNumerEwidencyjny(rows, headerRowIdx) {
  const limit = Math.min(headerRowIdx ?? 40, rows.length);
  /** @type {{ idx: number, nr: string, prio: number }[]} */
  const found = [];

  for (let i = 0; i < limit; i++) {
    const row = rows[i] ?? [];
    const b = row[1];
    if (b == null) continue;
    const prio = priorytetEtykietyNumeruEwid(b);
    if (prio == null) continue;

    let nr = wartoscEwidencyjnaZKomorki(row[3]);
    if (!nr && row[4] != null && row[4] !== "") nr = wartoscEwidencyjnaZKomorki(row[4]);
    if (!nr) continue;

    found.push({ idx: i, nr, prio });
  }

  if (found.length === 0) return null;
  found.sort((a, b) => b.prio - a.prio || a.idx - b.idx);
  return found[0].nr;
}

/** @param {unknown[][]} rows */
function znajdzWierszNaglowka(rows, maxScan = 40) {
  for (let i = 0; i < Math.min(maxScan, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    const b = row[1];
    if (b != null && String(b).trim().toUpperCase() === "DATA") return i;
  }
  return null;
}

function czyPominJ(rawJ) {
  if (rawJ == null) return true;
  if (typeof rawJ === "string") {
    const t = rawJ.trim();
    if (!t) return true;
    if (t.toLowerCase().includes("wpisz czas")) return true;
    return false;
  }
  return false;
}

/** @param {unknown} v */
function formatTimeCell(v) {
  if (v == null) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const hh = String(v.getHours()).padStart(2, "0");
    const mm = String(v.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  if (typeof v === "number" && v >= 0 && v < 1) {
    const totalMin = Math.round(v * 24 * 60);
    const h = Math.floor(totalMin / 60) % 24;
    const m = totalMin % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  return s || null;
}

/** @param {unknown} v */
function dataIsoZKomorki(v) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v.trim())) return v.trim().slice(0, 10);
  return null;
}

/**
 * @param {string} jRaw
 * @returns {{ typ: string, godziny: number, kodLinie: string[] }}
 */
function mapujKodArkusza(jRaw) {
  const s0 = String(jRaw ?? "").trim();
  const s = s0.replace(/–|—/g, "-");
  const sc = s.toLowerCase().replace(/\s+/g, "");

  if (/^nb-ch-c/.test(sc)) {
    return {
      typ: "zwolnienie_lekarskie",
      godziny: GODZ_PELNY_DZIEN,
      kodLinie: ["Kod arkusza: L4 — ciąża (nb-CH-C)"],
    };
  }
  if (/^nb-ch-o/.test(sc)) {
    return {
      typ: "zwolnienie_lekarskie",
      godziny: GODZ_PELNY_DZIEN,
      kodLinie: ["Kod arkusza: L4 — opieka nad dzieckiem, małżonkiem itd. (nb-CH-O)"],
    };
  }
  if (/^nb-ch/.test(sc)) {
    return { typ: "zwolnienie_lekarskie", godziny: GODZ_PELNY_DZIEN, kodLinie: [] };
  }
  if (/^nb-od/.test(sc)) {
    return { typ: "opieka_nad_dzieckiem", godziny: GODZ_PELNY_DZIEN, kodLinie: [] };
  }
  if (/^nb-uw/.test(sc)) {
    return { typ: "urlop", godziny: GODZ_PELNY_DZIEN, kodLinie: [] };
  }
  if (/^nb-uż/.test(sc) || /^nb-uz/.test(sc)) {
    return { typ: "urlop_na_zadanie", godziny: GODZ_PELNY_DZIEN, kodLinie: [] };
  }
  if (/^nb-uo/.test(sc)) {
    return {
      typ: "inne",
      godziny: GODZ_PELNY_DZIEN,
      kodLinie: ["Kod arkusza: urlop okolicznościowy (nb-UO)"],
    };
  }
  if (/^nb-wś/.test(sc) || /^nb-ws/.test(sc)) {
    return {
      typ: "inne",
      godziny: 0,
      kodLinie: ["Kod arkusza: wolne za święto w sobotę (nb-WŚ)"],
    };
  }
  if (/^nb-n/.test(sc)) {
    return { typ: "inne", godziny: 0, kodLinie: ["Kod arkusza: niedostępność (nb-N)"] };
  }

  if (sc.includes("święto") || sc.includes("swieto") || sc.startsWith("nd-")) {
    return { typ: "inne", godziny: 0, kodLinie: [`Kod arkusza: ${s0}`] };
  }
  if (sc.startsWith("nb-")) {
    return { typ: "inne", godziny: 0, kodLinie: [`Kod arkusza (niezmapowany): ${s0}`] };
  }
  return { typ: "inne", godziny: 0, kodLinie: [`Kod arkusza: ${s0}`] };
}

/**
 * @param {unknown} rawJ
 * @param {string} kr
 * @param {unknown} nazwaObiektu
 * @param {unknown} opis
 * @param {unknown} godzOd
 * @param {unknown} godzDo
 * @param {unknown} uwagiK
 */
function mapujWiersz(rawJ, kr, nazwaObiektu, opis, godzOd, godzDo, uwagiK) {
  const uwExtraParts = [];
  if (nazwaObiektu != null && String(nazwaObiektu).trim() !== "") {
    uwExtraParts.push(`Obiekt: ${String(nazwaObiektu).trim()}`);
  }
  if (opis != null && String(opis).trim() !== "") uwExtraParts.push(String(opis).trim());
  const go = formatTimeCell(godzOd);
  const gd = formatTimeCell(godzDo);
  if (go || gd) uwExtraParts.push(`${go || "?"}–${gd || "?"}`);
  if (uwagiK != null && String(uwagiK).trim() !== "") uwExtraParts.push(String(uwagiK).trim());

  if (typeof rawJ === "number" && Number.isFinite(rawJ) && rawJ !== true && rawJ !== false) {
    const g = Number(rawJ);
    return {
      typ: "praca",
      godziny: Math.round(g * 100) / 100,
      nadgodziny: 0,
      uwagiPodstawa: uwExtraParts.length ? uwExtraParts.join("\n") : null,
    };
  }

  const rawKod = String(rawJ).trim();
  const mk = mapujKodArkusza(rawKod);
  const polacz = [...uwExtraParts, ...mk.kodLinie];
  const pierwszyToken = rawKod.split(/\s+/)[0];
  if (pierwszyToken && /^nb-/i.test(pierwszyToken)) {
    polacz.push(`(${pierwszyToken})`);
  }
  return {
    typ: mk.typ,
    godziny: mk.godziny,
    nadgodziny: 0,
    uwagiPodstawa: polacz.length ? polacz.join("\n") : null,
  };
}

/** Oba pola czasu muszą być wypełnione, żeby uznać arkusz za rozróżniający godziny między KR. */
function maZakresGodzinZOdniesien(godzOd, godzDo) {
  const go = formatTimeCell(godzOd);
  const gd = formatTimeCell(godzDo);
  return Boolean(go && gd);
}

/** Rozkłada sumę godzin na n części z dokładnością do setnych (suma = calkowite). */
function podzielGodzinyRowno(calkowite, n) {
  if (n <= 0) return [];
  const setne = Math.round(Number(calkowite) * 100);
  const base = Math.floor(setne / n);
  const rem = setne % n;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push((base + (i < rem ? 1 : 0)) / 100);
  }
  return out;
}

const UWAGA_PODZIAL = "Import: podział bez zakresu Od–Do —";

/**
 * Gdy ten sam dzień ma kilka wierszy „praca” z tą samą liczbą godzin (kolumna liczbowa), bez zakresu Od–Do,
 * a każdy wiersz ma inny niepusty KR — liczba z arkusza to dzienny łączny czas; dzielimy równo na KR.
 * Wiersze już rozłożone z jednej komórki (wiele KR + jedna suma godzin) są pomijane.
 * @param {Array<object & { _zakres?: boolean, _rawJNum?: boolean, _juzPodzieloneWieloKr?: boolean }>} rows
 */
function zastosujPodzialGodzinMiedzyKrBezZakresu(rows) {
  /** @type {Map<string, number[]>} */
  const grupy = new Map();
  rows.forEach((row, idx) => {
    if (row.typ !== "praca" || !row._rawJNum || row._zakres || row._juzPodzieloneWieloKr) return;
    const key = `${row.pracownik_nr}|${row.data}`;
    if (!grupy.has(key)) grupy.set(key, []);
    grupy.get(key).push(idx);
  });

  for (const indices of grupy.values()) {
    if (indices.length < 2) continue;
    const slice = indices.map((i) => rows[i]);
    const krs = slice.map((r) => String(r.kr ?? "").trim());
    if (krs.some((k) => !k)) continue;
    if (new Set(krs).size !== krs.length) continue;

    const vals = slice.map((r) => Number(r.godziny) || 0);
    const positives = vals.filter((v) => v > 0);
    if (positives.length === 0) continue;
    const uniqCents = new Set(positives.map((v) => Math.round(v * 100)));
    if (uniqCents.size !== 1) continue;

    const H = [...uniqCents][0] / 100;
    const n = indices.length;
    const czesci = podzielGodzinyRowno(H, n);

    indices.forEach((idx, j) => {
      rows[idx].godziny = czesci[j];
      const dop = `${UWAGA_PODZIAL} część ${j + 1}/${n}, ${H} h łącznie na dzień przy braku rozróżnienia godzin na KR.`;
      rows[idx].uwagi = rows[idx].uwagi ? `${rows[idx].uwagi}\n${dop}` : dop;
    });
  }

  for (const row of rows) {
    delete row._zakres;
    delete row._rawJNum;
    delete row._juzPodzieloneWieloKr;
  }
}

/**
 * @param {ArrayBuffer} buf
 * @param {{ pracownikNrOverride?: string | null, sheetNames?: string[] }} opt — `sheetNames`: tylko te arkusze (np. jeden miesiąc); puste / brak = wszystkie miesięczne w pliku.
 */
export function parsujRozliczenieGodzinoweXlsx(buf, opt = {}) {
  const wb = XLSX.read(buf, { type: "array", cellDates: true, raw: false });
  const names = wb.SheetNames.filter((n) => MM_RRRR.test(String(n).trim()));

  const rowsOut = [];
  const daty = [];
  let pracownikNr = (opt.pracownikNrOverride ?? "").trim() || null;

  const sortedNames = [...names].sort(sortujNazwyMiesieczne);

  let toProcess = sortedNames;
  if (Array.isArray(opt.sheetNames) && opt.sheetNames.length > 0) {
    const want = new Set(opt.sheetNames.map((s) => String(s).trim()).filter(Boolean));
    toProcess = sortedNames.filter((n) => want.has(n));
    if (toProcess.length === 0) {
      const lista = sortedNames.length ? sortedNames.join(", ") : "(brak arkuszy MM-RRRR)";
      throw new Error(
        `Nie znaleziono wybranych arkuszy w pliku: ${[...want].join(", ")}. Dostępne: ${lista}.`,
      );
    }
  }

  for (const sheetName of toProcess) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });

    const hdr = znajdzWierszNaglowka(rows);
    if (hdr == null) continue;

    const nr =
      pracownikNr ||
      znajdzNumerEwidencyjny(rows, hdr);
    if (!nr) {
      throw new Error(`Brak numeru ewidencyjnego (wiersz „NUMER EWID.”) w arkuszu „${sheetName}”.`);
    }
    pracownikNr = nr;

    for (let r = hdr + 1; r < rows.length; r++) {
      const row = rows[r] ?? [];
      if (row.length < 11) continue;

      const dataCell = row[1];
      const rawJ = row[9];
      if (czyPominJ(rawJ)) continue;

      const dIso = dataIsoZKomorki(dataCell);
      if (!dIso) continue;

      daty.push(dIso);

      const krVal = row[4];
      const krLista = rozbijKryZZkomorki(krVal);
      const krsDoWierszy = krLista.length ? krLista : [normalizujKrZArkusza(krVal)];

      const maZakres = maZakresGodzinZOdniesien(row[7], row[8]);
      const rawJNum =
        typeof rawJ === "number" && Number.isFinite(rawJ) && rawJ !== true && rawJ !== false;

      const opisZad = row[6];
      const wykZad =
        opisZad != null && String(opisZad).trim() !== "" ? String(opisZad).trim() : null;

      const nKrCell = krsDoWierszy.length;
      let mappedWspolneMultiKr = null;
      let czesciGodzin = null;
      if (nKrCell > 1) {
        mappedWspolneMultiKr = mapujWiersz(rawJ, krsDoWierszy[0], row[5], row[6], row[7], row[8], row[10]);
        if (mappedWspolneMultiKr.typ === "praca" && typeof rawJ === "number" && Number.isFinite(rawJ)) {
          czesciGodzin = podzielGodzinyRowno(mappedWspolneMultiKr.godziny, nKrCell);
        }
      }

      for (let j = 0; j < krsDoWierszy.length; j++) {
        let kr = krsDoWierszy[j];
        const mapped =
          czesciGodzin != null
            ? mappedWspolneMultiKr
            : mapujWiersz(rawJ, kr, row[5], row[6], row[7], row[8], row[10]);
        if (!kr && mapped.typ === "praca") {
          kr = KR_OGOLNOBIUROWY;
        }

        const sumaHArkusza = mapped.godziny;
        let godziny = mapped.godziny;
        let juzPodzieloneWieloKr = false;
        if (czesciGodzin != null && mapped.typ === "praca") {
          godziny = czesciGodzin[j];
          juzPodzieloneWieloKr = true;
        }

        const uwParts = [];
        if (mapped.uwagiPodstawa) uwParts.push(mapped.uwagiPodstawa);
        uwParts.push(`Import: RozliczenieGodzinowe / ${sheetName}`);
        if (czesciGodzin != null && mapped.typ === "praca") {
          uwParts.push(
            `Import: wiele KR w jednej komórce — część ${j + 1}/${nKrCell} sumy ${sumaHArkusza} h z kolumny „Czas pracy”.`,
          );
        }
        const uwagi = uwParts.join("\n");

        rowsOut.push({
          pracownik_nr: nr,
          data: dIso,
          kr,
          typ: mapped.typ,
          godziny,
          nadgodziny: mapped.nadgodziny,
          uwagi,
          wykonywane_zadanie: wykZad,
          _zakres: maZakres,
          _rawJNum: Boolean(rawJNum && mapped.typ === "praca"),
          _juzPodzieloneWieloKr: juzPodzieloneWieloKr,
        });
      }
    }
  }

  zastosujPodzialGodzinMiedzyKrBezZakresu(rowsOut);

  if (!pracownikNr) throw new Error("Nie znaleziono ani jednego miesięcznego arkusza (np. 01-2026).");

  daty.sort();
  const minData = daty.length ? daty[0] : null;
  const maxData = daty.length ? daty[daty.length - 1] : null;

  return {
    pracownikNr,
    rows: rowsOut,
    minData,
    maxData,
    arkuszy: toProcess.length,
    przetworzoneArkusze: toProcess,
  };
}
