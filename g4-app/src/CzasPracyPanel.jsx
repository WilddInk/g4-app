import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { theme } from "./operationalShell.jsx";
import {
  KR_OGOLNOBIUROWY,
  listujArkuszeMiesieczneRozliczenie,
  normalizujKrZArkusza,
  parsujRozliczenieGodzinoweXlsx,
  zakresMiesiacaZKoduArkusza,
} from "./lib/importRozliczenieGodzinoweXlsx.js";
import {
  czyDzienRoboczyPl,
  infoDniaKalendarzaPl,
  liczDniRoboczeWMiesiacu,
  normaGodzinMiesiaca,
} from "./lib/swietoPl.js";

function etykietaKrDoPodgladu(krRaw) {
  const k = normalizujKrZArkusza(krRaw);
  if (!k) return "";
  if (k === KR_OGOLNOBIUROWY) return `${KR_OGOLNOBIUROWY} (ogólnobiurowa)`;
  return k;
}

/** Etykieta opcji KR w formularzu — 000 jako biuro ogólne. */
function formatOpcjaKRListy(r) {
  const k = normalizujKrZArkusza(r.kr);
  const kod = k === KR_OGOLNOBIUROWY ? `${k} — ogólnobiurowa (biuro)` : k;
  const naz = r.nazwa_obiektu?.trim();
  return naz ? `${kod} — ${naz}` : kod;
}

/** Typy wpisów — rozszerzalne bez migracji (CHECK w bazie jest luźny). W formularzu wybiera się też skróty nb-*; stary `delegacja` w DB traktujemy jak pracę + flaga w uwagach. */
export const CZAS_TYP_WPISU = [
  { value: "praca", label: "Praca", grupa: "praca" },
  { value: "szkolenie", label: "Szkolenie", grupa: "praca" },
  { value: "urlop", label: "Urlop wypoczynkowy", grupa: "nieobecnosc" },
  { value: "urlop_na_zadanie", label: "Urlop na żądanie", grupa: "nieobecnosc" },
  { value: "zwolnienie_lekarskie", label: "L4", grupa: "nieobecnosc" },
  { value: "opieka_nad_dzieckiem", label: "Opieka nad dzieckiem zdrowym", grupa: "nieobecnosc" },
  { value: "inne", label: "Inne (uwagi w polu)", grupa: "inne" },
];

/** Kolory jak w arkuszu CMP — lewa kolumna kodu, prawa opis (legenda panelu). */
const LEGENDA_ARKUSZA_CMP = [
  { kod: "nb-OD", tlo: "#92D050", tekst: "#0f172a", opis: "opieka nad dzieckiem zdrowym" },
  { kod: "nb-CH", tlo: "#00B0F0", tekst: "#0f172a", opis: "L4" },
  { kod: "nb-CH-C", tlo: "#FFF2CC", tekst: "#0f172a", opis: "L4 — ciąża" },
  { kod: "nb-CH-O", tlo: "#F4B084", tekst: "#0f172a", opis: "L4 — opieka nad dzieckiem, małżonkiem itd." },
  { kod: "nb-UW", tlo: "#FFFF00", tekst: "#0f172a", opis: "urlop wypoczynkowy" },
  { kod: "nb-UŻ", tlo: "#FF0000", tekst: "#ffffff", opis: "urlop na żądanie" },
  { kod: "nb-UO", tlo: "#A94442", tekst: "#ffffff", opis: "urlop okolicznościowy" },
  { kod: "nb-WŚ", tlo: "#A0522D", tekst: "#ffffff", opis: "wolne za święto w sobotę" },
  { kod: "nb-N", tlo: "#7030A0", tekst: "#ffffff", opis: "niedostępność (podwykonawcy, umowa zlecenie)" },
];

/** Domyślny blok przy dodawaniu wpisu ręcznie — 8 h od 7:00. */
const DOMYSLNY_OD_CZASU = "07:00";
const DOMYSLNY_DO_CZASU = "15:00";

function splitRodzajSelectValue(v) {
  const s = String(v ?? "");
  const i = s.indexOf("|");
  if (i === -1) return { typ: s.trim(), kodNbArkusza: "" };
  return { typ: s.slice(0, i).trim(), kodNbArkusza: s.slice(i + 1).trim() };
}

function joinRodzajSelectValue(typ, kodNbArkusza) {
  const k = String(kodNbArkusza ?? "").trim();
  const t = String(typ ?? "").trim();
  return k ? `${t}|${k}` : t;
}

/** Kod legendy CMP → wartość `typ` i tag `(nb-…)` w uwagach. */
function metaSkrotLegendyCmp(row) {
  switch (row.kod) {
    case "nb-OD":
      return { typ: "opieka_nad_dzieckiem", kodNb: "nb-OD" };
    case "nb-CH":
      return { typ: "zwolnienie_lekarskie", kodNb: "nb-CH" };
    case "nb-CH-C":
      return { typ: "zwolnienie_lekarskie", kodNb: "nb-CH-C" };
    case "nb-CH-O":
      return { typ: "zwolnienie_lekarskie", kodNb: "nb-CH-O" };
    case "nb-UW":
      return { typ: "urlop", kodNb: "nb-UW" };
    case "nb-UŻ":
      return { typ: "urlop_na_zadanie", kodNb: "nb-UŻ" };
    case "nb-UO":
      return { typ: "inne", kodNb: "nb-UO" };
    case "nb-WŚ":
      return { typ: "inne", kodNb: "nb-WŚ" };
    case "nb-N":
      return { typ: "inne", kodNb: "nb-N" };
    default:
      return null;
  }
}

function budujOpcjeRodzajuWpisu() {
  const out = [
    { value: joinRodzajSelectValue("praca", ""), label: "Praca" },
    { value: joinRodzajSelectValue("szkolenie", ""), label: "Szkolenie" },
  ];
  for (const row of LEGENDA_ARKUSZA_CMP) {
    const meta = metaSkrotLegendyCmp(row);
    if (!meta) continue;
    out.push({
      value: joinRodzajSelectValue(meta.typ, meta.kodNb),
      label: `${row.kod} · ${row.opis}`,
    });
  }
  out.push({ value: joinRodzajSelectValue("inne", ""), label: "Inne (uwagi w polu)" });
  return out;
}

const OPCJE_RODZAJU_WPISU = budujOpcjeRodzajuWpisu();

/** Przed edycją w polu „uwagi dodatkowe” — usuń dopisek kodu arkusza z reszty po zakresie. */
function oczyscReszteUwagDlaFormularza(resztaRaw) {
  let r = String(resztaRaw ?? "").trim();
  r = r.replace(/\s*·\s*\([^)]*nb-[^)]+\)\s*$/i, "").trim();
  r = r.replace(/\n+\([^)]*nb-[^)]+\)\s*$/i, "").trim();
  return r;
}

function grupaTypu(typ) {
  if (String(typ ?? "").trim() === "delegacja") return "praca";
  const row = CZAS_TYP_WPISU.find((t) => t.value === typ);
  return row?.grupa ?? "inne";
}

/** Kod z arkusza rozliczenia w uwagach: „(nb-CH-C)” lub pierwszy token nb-* z linii „Kod arkusza: …”. */
function kodArkuszaZZUwag(uwagi) {
  const s = String(uwagi ?? "");
  const wParen = s.match(/\((nb-[^)]+)\)/i);
  if (wParen) return wParen[1].trim();
  const nbToken = /\b(nb-[A-Za-zżŻźŹąĄęĘółÓ\-]+)/i.exec(s.replace(/–|—/g, "-"));
  return nbToken ? nbToken[1].trim() : null;
}

function normalizeNbKodPorownanie(k) {
  return String(k ?? "")
    .toLowerCase()
    .replace(/–|—/g, "-")
    .normalize("NFD")
    .replace(/\u0301/g, "");
}

/** Święto państwowe z importu CMP (kolumna J: „święto”, nd-…) — nie mylić z nb-WŚ (sobota). */
function czySwietoEtykietaZCzasu(typ, uwagi) {
  if (String(typ ?? "").trim() !== "inne") return false;
  const kodR = kodArkuszaZZUwag(uwagi ?? "");
  if (kodR) {
    const kn = normalizeNbKodPorownanie(kodR);
    if (kn.includes("nb-wś") || kn.includes("nb-ws")) return false;
  }
  const u = String(uwagi ?? "");
  const low = u.toLowerCase();
  if (low.includes("święto") || low.includes("swieto")) return true;
  return /\bnd-/i.test(u);
}

function labelTypuCzasu(typ, uwagi) {
  const t = String(typ ?? "").trim();
  if (t === "delegacja") return "Delegacja";

  const kodRaw = kodArkuszaZZUwag(uwagi ?? "");
  const kodN = kodRaw ? normalizeNbKodPorownanie(kodRaw) : "";

  if (typ === "zwolnienie_lekarskie") {
    if (kodN.includes("nb-ch-c")) return "L4 — ciąża";
    if (kodN.includes("nb-ch-o")) return "L4 — opieka nad dzieckiem, małżonkiem itd.";
    return "L4";
  }
  if (typ === "inne" && kodN) {
    if (kodN.includes("nb-uo")) return "Urlop okolicznościowy";
    if (kodN.includes("nb-wś") || kodN.includes("nb-ws")) return "Wolne za święto w sobotę";
    if (kodN.includes("nb-n")) return "Niedostępność (podwykonawcy, umowa zlecenie)";
  }

  if (czySwietoEtykietaZCzasu(typ, uwagi)) return "Święto";

  const row = CZAS_TYP_WPISU.find((t) => t.value === typ);
  return row?.label ?? (String(typ ?? "").replace(/_/g, " ").trim() || "?");
}

/** Jedna linia podsumowania wpisu w komórce kalendarza (kod arkusza · typ aplikacji · KR · skrót zadania). */
function tekstLiniiWpisuWKalendarzu(w) {
  const kod = kodArkuszaZZUwag(w.uwagi);
  const lb = labelTypuCzasu(w.typ, w.uwagi);
  let s = kod ? `${kod} · ${lb}` : lb;
  const krNorm = normalizujKrWgWpisu(w);
  const zad = String(w.wykonywane_zadanie ?? "").trim().slice(0, 22);
  if (krNorm) {
    const rawDoEtykiety = normalizujKrZArkusza(w.kr) ? w.kr : KR_OGOLNOBIUROWY;
    s += ` · ${etykietaKrDoPodgladu(rawDoEtykiety)}`;
  }
  if (zad) s += ` · ${zad}`;
  if (s.length > 58) return `${s.slice(0, 56)}…`;
  return s;
}

/** Kolory jak w panelu „Legenda arkusza” — dopasowanie po kodzie z uwag. */
function znajdzStylZnaczkaLegendyWpisu(w) {
  if (czySwietoEtykietaZCzasu(w.typ, w.uwagi)) {
    return {
      tlo: "rgba(239,68,68,0.32)",
      tekst: "#fecaca",
      znaczek: "Święto",
    };
  }
  const kodRaw = kodArkuszaZZUwag(w.uwagi);
  if (kodRaw) {
    const key = normalizeNbKodPorownanie(kodRaw);
    const row = LEGENDA_ARKUSZA_CMP.find((r) => normalizeNbKodPorownanie(r.kod) === key);
    if (row) {
      return { tlo: row.tlo, tekst: row.tekst, znaczek: row.kod };
    }
    return {
      tlo: "rgba(71,85,105,0.85)",
      tekst: "#f8fafc",
      znaczek: kodRaw.length > 14 ? `${kodRaw.slice(0, 12)}…` : kodRaw,
    };
  }
  const g = grupaTypu(w.typ);
  if (g === "nieobecnosc") {
    return {
      tlo: "rgba(244,114,182,0.45)",
      tekst: "#fce7f3",
      znaczek: labelTypuCzasu(w.typ, w.uwagi).slice(0, 14),
    };
  }
  if (g === "praca") {
    return {
      tlo: "rgba(251,146,60,0.35)",
      tekst: "#ffedd5",
      znaczek: w.typ === "szkolenie" ? "Szkol." : "Praca",
    };
  }
  return {
    tlo: "rgba(148,163,184,0.35)",
    tekst: "#f1f5f9",
    znaczek: labelTypuCzasu(w.typ, w.uwagi).slice(0, 12),
  };
}

/** Tekst obok znaczka (bez powielania kodu nb-* — jest w pigułce). */
function czyTypLiczyGodzinyPracy(typ) {
  return grupaTypu(typ) === "praca";
}

/**
 * Pusty KR przy pracy (licz. godziny) = w praktyce 000 (arkusz: 0, pusta E, scalone komórki).
 * Użycie: kalendarz, sumy / stawki, start formularza edycji.
 */
function normalizujKrWgWpisu(w) {
  const k = normalizujKrZArkusza(w.kr);
  if (k) return k;
  if (czyTypLiczyGodzinyPracy(w.typ)) return KR_OGOLNOBIUROWY;
  return "";
}

/** Gdy pigułka to kod nb-* (np. nb-UW), nie powtarzaj obok osobno słowa „Praca” — informacja jest w znaczku/kodzie arkusza. */
function czyPominEtykietePracaPrzyPigulceNb(st, lb, w) {
  if (lb !== "Praca" || !czyTypLiczyGodzinyPracy(w.typ)) return false;
  const z = String(st?.znaczek ?? "");
  if (!z || z === "Praca") return false;
  return /^nb-/i.test(z);
}

/** KR do jednej linii skrótowej kalendarza (bez dopisku „ogólnobiurowa”). */
function krotkiKrTekstWpisu(w) {
  const k = normalizujKrWgWpisu(w);
  return k === KR_OGOLNOBIUROWY ? KR_OGOLNOBIUROWY : k;
}

/**
 * Tekst obok znaczka w komórce kalendarza.
 * @param {{ bezEtykietyTypu?: boolean, stylZnaczka?: ReturnType<typeof znajdzStylZnaczkaLegendyWpisu> }} opt — przy kilku blokach „Praca”: kolejne linie bez powtórki; styl znaczka do wykrycia redundancji Praca vs nb-*.
 */
function opisPoZnaczkuKalendarza(w, opt = {}) {
  const bezEtykietyTypu = opt.bezEtykietyTypu === true;
  const st = opt.stylZnaczka ?? znajdzStylZnaczkaLegendyWpisu(w);
  const lb = labelTypuCzasu(w.typ, w.uwagi);
  const pominLbPracaNb = !bezEtykietyTypu && czyPominEtykietePracaPrzyPigulceNb(st, lb, w);
  const pokazLb = !bezEtykietyTypu && !pominLbPracaNb;
  const krNorm = normalizujKrWgWpisu(w);
  const krE = krNorm
    ? etykietaKrDoPodgladu(normalizujKrZArkusza(w.kr) ? w.kr : KR_OGOLNOBIUROWY)
    : "";
  const zad = String(w.wykonywane_zadanie ?? "").trim().slice(0, 22);
  const bits = pokazLb ? [lb, krE, zad].filter(Boolean) : [krE, zad].filter(Boolean);
  let s = bits.join(" · ");
  if (s.length > 54) s = `${s.slice(0, 52)}…`;
  return s;
}

/** Kilka wpisów tego samego typu / kodu → jedna linia: KR po „/”. */
function opisPoZnaczkuKalendarzaGrupa(wpisy, st) {
  if (!wpisy?.length) return "";
  const w0 = wpisy[0];
  const lb = labelTypuCzasu(w0.typ, w0.uwagi);
  const pominLbPracaNb = czyPominEtykietePracaPrzyPigulceNb(st, lb, w0);
  const krs = [];
  const seen = new Set();
  for (const w of wpisy) {
    const k = krotkiKrTekstWpisu(w);
    if (k && !seen.has(k)) {
      seen.add(k);
      krs.push(k);
    }
  }
  const krJoined = krs.join(" / ");
  const zad = String(w0.wykonywane_zadanie ?? "").trim().slice(0, 22);
  const bits = [];
  if (!pominLbPracaNb) bits.push(lb);
  if (krJoined) bits.push(krJoined);
  if (zad) bits.push(zad);
  let s = bits.filter(Boolean).join(" · ");
  if (s.length > 54) s = `${s.slice(0, 52)}…`;
  return s;
}

/** Kolejne wpisy z tą samą pigułką i tym samym „znaczeniem” dnia → jedna linia wizualna. */
function grupujWpisyKalendarzaDoKomorki(lista) {
  if (!lista?.length) return [];
  const grupy = [];
  let i = 0;
  while (i < lista.length) {
    const w0 = lista[i];
    const st0 = znajdzStylZnaczkaLegendyWpisu(w0);
    const kod0 = kodArkuszaZZUwag(w0.uwagi);
    const lb0 = labelTypuCzasu(w0.typ, w0.uwagi);
    const zad0 = String(w0.wykonywane_zadanie ?? "").trim();
    const grupa = [w0];
    let j = i + 1;
    while (j < lista.length) {
      const w1 = lista[j];
      const st1 = znajdzStylZnaczkaLegendyWpisu(w1);
      const kod1 = kodArkuszaZZUwag(w1.uwagi);
      const lb1 = labelTypuCzasu(w1.typ, w1.uwagi);
      const zad1 = String(w1.wykonywane_zadanie ?? "").trim();
      const merge =
        st0.znaczek === st1.znaczek &&
        lb0 === lb1 &&
        (kod0 || "") === (kod1 || "") &&
        zad0 === zad1 &&
        czyTypLiczyGodzinyPracy(w0.typ) &&
        czyTypLiczyGodzinyPracy(w1.typ);
      if (!merge) break;
      grupa.push(w1);
      j++;
    }
    grupy.push(grupa);
    i = j;
  }
  return grupy;
}

function tytulGrupyKalendarza(grupa) {
  return grupa.map((w) => tekstLiniiWpisuWKalendarzu(w)).join("\n");
}

/** Czy dzień składa się wyłącznie z bloków ze znaczkiem „Praca” (wtedy jedna etykieta „Praca” na pierwszej linii). */
function czyKalendarzLaczyPowtorzeniaPraca(lista) {
  if (!lista || lista.length < 2) return false;
  const styles = lista.map((w) => znajdzStylZnaczkaLegendyWpisu(w));
  return styles.every((st) => st.znaczek === "Praca");
}

/** Nieobecności płatne / „pełnodniowe” wg zapisanych godzin (import CMP: często 8 h). */
const TYPY_LICZONE_DO_NORMY_OPROCZ_PRACY = new Set([
  "urlop",
  "urlop_na_zadanie",
  "zwolnienie_lekarskie",
  "opieka_nad_dzieckiem",
]);

function czyTypLiczyDoNormyMiesiaca(typ) {
  if (czyTypLiczyGodzinyPracy(typ)) return true;
  return TYPY_LICZONE_DO_NORMY_OPROCZ_PRACY.has(String(typ ?? "").trim());
}

function godzinyWpisuZZapisu(w) {
  const g = Number(w.godziny) || 0;
  const legacyNd = Number(w.nadgodziny) || 0;
  return g + legacyNd;
}

function dataIsoZDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDataIso(s) {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function stawkaDlaDaty(stawki, dataIso) {
  const pas = (stawki ?? [])
    .filter((r) => dataIso >= r.data_od && dataIso <= r.data_do)
    .sort((a, b) => String(b.data_od).localeCompare(String(a.data_od)));
  return pas[0] ?? null;
}

function formatPln(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return (
    new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " zł"
  );
}

/**
 * @param {object} props
 * @param {import("@supabase/supabase-js").SupabaseClient} props.supabase
 * @param {Array} props.krList — rekordy z tabeli kr (pole .kr)
 * @param {Array} props.pracownicy
 * @param {object | null} props.pracownikSesja — zalogowany użytkownik (konto)
 * @param {object | null} props.pracownikWidokEfektywny — kto jest „widziany” (w tym podgląd admina)
 * @param {boolean} props.wymagaKonta — VITE_REQUIRE_AUTH
 */
const NORMA_H_NA_DZIEN_ROBOCZY = 8;

/** Siatka minut w polach Od/Do (np. 00, 15, 30, 45). */
const KROK_MINUT_CZAS_PRACY = 15;
/** Dla `input type="time"` — krok w sekundach (15 min = 900 s). */
const TIME_INPUT_STEP_SEKUND = KROK_MINUT_CZAS_PRACY * 60;

function minutyZZaokragleniemDoKroku(minutyOdPolnocy) {
  const k = KROK_MINUT_CZAS_PRACY;
  if (!Number.isFinite(minutyOdPolnocy)) return 0;
  let m = Math.round(minutyOdPolnocy / k) * k;
  if (m >= 24 * 60) m = 24 * 60 - k;
  return Math.max(0, m);
}

function minutyZCzasuHHMM(s) {
  const m = String(s ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return NaN;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return NaN;
  return h * 60 + min;
}

/** Zwraca długość w godzinach; jeśli „do” < „od”, traktujemy jako przejście przez północ. */
function obliczGodzinyZZakresu(od, dol) {
  const t1 = minutyZCzasuHHMM(od);
  let t2 = minutyZCzasuHHMM(dol);
  if (!Number.isFinite(t1) || !Number.isFinite(t2)) return NaN;
  let diffMin = t2 - t1;
  if (diffMin < 0) diffMin += 24 * 60;
  return Math.round((diffMin / 60) * 10000) / 10000;
}

function normalizeTimeInput(t) {
  const m = String(t ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return "";
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  const total = minutyZZaokragleniemDoKroku(h * 60 + min);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function dodajGodzinyDoCzasu(czasHHMM, godziny) {
  const base = minutyZCzasuHHMM(czasHHMM);
  if (!Number.isFinite(base)) return "08:00";
  const g = Number(godziny);
  if (!Number.isFinite(g) || g <= 0) return czasHHMM;
  const raw = ((base + Math.round(g * 60)) % (24 * 60) + 24 * 60) % (24 * 60);
  const total = minutyZZaokragleniemDoKroku(raw);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Odczyt zakresu zapisu z pola uwagi: „HH:MM–HH:MM” lub „HH:MM–HH:MM · reszta”. */
function parsujZakresCzasuZUwag(full) {
  const s = String(full ?? "").trim();
  const m = s.match(/^(\d{1,2}:\d{2})\s*[–\-—]\s*(\d{1,2}:\d{2})(?:\s*·\s*([\s\S]*))?$/);
  if (m) {
    return {
      czasOd: normalizeTimeInput(m[1]),
      czasDo: normalizeTimeInput(m[2]),
      reszta: String(m[3] ?? "").trim(),
    };
  }
  return { czasOd: "", czasDo: "", reszta: s };
}

function zlozUwagiZZakresu(czasOd, czasDo, uwagiDodatkowe) {
  const od = normalizeTimeInput(czasOd);
  const dol = normalizeTimeInput(czasDo);
  const dod = String(uwagiDodatkowe ?? "").trim();
  const rd = `${od}–${dol}`;
  return dod ? `${rd} · ${dod}` : rd;
}

export function CzasPracyPanel({
  supabase,
  krList = [],
  pracownicy = [],
  pracownikSesja,
  pracownikWidokEfektywny,
  wymagaKonta,
}) {
  const rolaSesji = String(pracownikSesja?.app_role ?? "").trim();
  const mozeWybieracPracownika = rolaSesji === "admin" || rolaSesji === "kierownik";
  const mozeZarzadzacStawkami = rolaSesji === "admin";

  const domyslnyNr = String(pracownikWidokEfektywny?.nr ?? "").trim();
  const [wybranyNr, setWybranyNr] = useState(domyslnyNr);

  useEffect(() => {
    setWybranyNr(domyslnyNr);
  }, [domyslnyNr]);

  /** Gdy lista pracowników jest zawężona (np. tylko aktywni), przełącz na widok efektywny lub pierwszą osobę z listy. */
  useEffect(() => {
    if (!mozeWybieracPracownika || pracownicy.length === 0) return;
    const allowed = new Set(pracownicy.map((p) => String(p.nr ?? "").trim()).filter(Boolean));
    const cur = String(wybranyNr ?? "").trim();
    if (cur && allowed.has(cur)) return;
    const dom = String(pracownikWidokEfektywny?.nr ?? "").trim();
    const pick = dom && allowed.has(dom) ? dom : String(pracownicy[0]?.nr ?? "").trim();
    if (pick && pick !== cur) setWybranyNr(pick);
  }, [mozeWybieracPracownika, pracownicy, wybranyNr, pracownikWidokEfektywny]);

  const [rok, setRok] = useState(() => new Date().getFullYear());
  const [miesiac, setMiesiac] = useState(() => new Date().getMonth());

  const [wpisy, setWpisy] = useState([]);
  const [stawki, setStawki] = useState([]);
  const [fetchErr, setFetchErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const [modal, setModal] = useState(null);
  /** @type {{ id?: string, data: string, kr: string, typ: string, kodNbArkusza: string, czas_od: string, czas_do: string, uwagi_dodatkowe: string, wykonywane_zadanie: string, delegacja: boolean } | null} */
  const [form, setForm] = useState(null);

  const [stForm, setStForm] = useState({ data_od: "", data_do: "", stawka_za_godzine: "", uwagi: "" });
  const [stMsg, setStMsg] = useState(null);
  const [importBusy, setImportBusy] = useState(false);
  const [usuwanieRozliczeniaBusy, setUsuwanieRozliczeniaBusy] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [skipDeleteImport, setSkipDeleteImport] = useState(false);
  /** Bufor wybranego .xlsx do ponownego importu innego miesiąca bez ponownego wgrywania pliku. */
  const importBuforPlikuRef = useRef(null);
  const [importListaArkuszy, setImportListaArkuszy] = useState([]);
  const [importWybranyArkusz, setImportWybranyArkusz] = useState("");
  const [importNazwaPliku, setImportNazwaPliku] = useState("");
  const importFileRef = useRef(null);
  /** Teksty zapisane wcześniej przy czasie pracy (per wybrany pracownik). */
  const [szablonyZadan, setSzablonyZadan] = useState([]);
  /** Wiersze z tabeli zadania — do podpowiedzi (ogólne + dopasowane do KR w formularzu). */
  const [zadaniaDlaCzasu, setZadaniaDlaCzasu] = useState([]);

  const pierwszyOstatniDzien = useMemo(() => {
    const pierwszy = new Date(rok, miesiac, 1);
    const ostatni = new Date(rok, miesiac + 1, 0);
    return { pierwszy, ostatni, odIso: dataIsoZDate(pierwszy), doIso: dataIsoZDate(ostatni) };
  }, [rok, miesiac]);

  const propozycjeZadaniaCzasu = useMemo(() => {
    if (!form) return [];
    const kr = normalizujKrZArkusza(form.kr);
    const zb = new Set(szablonyZadan.map((t) => String(t).trim()).filter(Boolean));
    for (const z of zadaniaDlaCzasu) {
      const txt = String(z.zadanie ?? "").trim();
      if (!txt) continue;
      const zkr = String(z.kr ?? "").trim();
      if (!zkr || zkr === kr) zb.add(txt);
    }
    return [...zb].sort((a, b) => a.localeCompare(b, "pl", { sensitivity: "base" }));
  }, [form, szablonyZadan, zadaniaDlaCzasu]);

  const kalendarzKomorki = useMemo(() => {
    const { pierwszy, ostatni } = pierwszyOstatniDzien;
    const startDow = (pierwszy.getDay() + 6) % 7;
    const dniWMiesiacu = ostatni.getDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push({ pusty: true, key: `p-${i}` });
    for (let d = 1; d <= dniWMiesiacu; d++) {
      const date = new Date(rok, miesiac, d);
      cells.push({ pusty: false, date, iso: dataIsoZDate(date), key: `d-${d}` });
    }
    while (cells.length % 7 !== 0) cells.push({ pusty: true, key: `t-${cells.length}` });
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [rok, miesiac]);

  const wpisyDlaWybranego = useMemo(() => {
    const nr = String(wybranyNr ?? "").trim();
    if (!nr) return [];
    return wpisy.filter((w) => String(w.pracownik_nr ?? "").trim() === nr);
  }, [wpisy, wybranyNr]);

  const pracownikRekord = useMemo(() => {
    const n = String(wybranyNr ?? "").trim();
    return pracownicy.find((p) => String(p.nr ?? "").trim() === n) ?? null;
  }, [pracownicy, wybranyNr]);

  const formaZatrudnienia = String(pracownikRekord?.forma_zatrudnienia ?? "uop").trim() || "uop";

  const wpisyPoDniu = useMemo(() => {
    const m = new Map();
    for (const w of wpisyDlaWybranego) {
      const ds = String(w.data ?? "").slice(0, 10);
      if (!m.has(ds)) m.set(ds, []);
      m.get(ds).push(w);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => String(a.id ?? "").localeCompare(String(b.id ?? "")));
    }
    return m;
  }, [wpisyDlaWybranego]);

  /** Suma godzin z bloków „praca” (kilka KR dziennie = kilka wierszy). Nadgodziny zapisane w starych wierszach są wliczane w sumę zapisu. */
  const podsumowanie = useMemo(() => {
    let sumaPracy = 0;
    const poKr = {};
    for (const w of wpisyDlaWybranego) {
      if (!czyTypLiczyGodzinyPracy(w.typ)) continue;
      const razem = godzinyWpisuZZapisu(w);
      sumaPracy += razem;
      const kr = normalizujKrWgWpisu(w);
      if (kr) {
        poKr[kr] = (poKr[kr] || 0) + razem;
      }
    }
    return { sumaPracy, poKr };
  }, [wpisyDlaWybranego]);

  /** Do porównania z normą: praca (+ delegacja, szkolenie) oraz urlop / L4 / opieka itd. — wg pól godziny (+ legacy nadgodziny). */
  const sumaGodzinDoNormyMiesiaca = useMemo(() => {
    let s = 0;
    for (const w of wpisyDlaWybranego) {
      if (!czyTypLiczyDoNormyMiesiaca(w.typ)) continue;
      s += godzinyWpisuZZapisu(w);
    }
    return s;
  }, [wpisyDlaWybranego]);

  const rozliczenieMiesiac = useMemo(() => {
    const dniRobocze = liczDniRoboczeWMiesiacu(rok, miesiac);
    const norma = normaGodzinMiesiaca(rok, miesiac, NORMA_H_NA_DZIEN_ROBOCZY);
    const suma = sumaGodzinDoNormyMiesiaca;
    if (formaZatrudnienia === "uz") {
      return {
        dniRobocze,
        norma,
        sumaZalogowanych: suma,
        nadgodzinyRozliczeniowe: suma,
        brakDoNormy: 0,
        tryb: "uz",
      };
    }
    return {
      dniRobocze,
      norma,
      sumaZalogowanych: suma,
      nadgodzinyRozliczeniowe: Math.max(0, suma - norma),
      brakDoNormy: Math.max(0, norma - suma),
      tryb: formaZatrudnienia === "inne" ? "inne" : "uop",
    };
  }, [rok, miesiac, sumaGodzinDoNormyMiesiaca, formaZatrudnienia]);

  const kwotaSzacunekPoKr = useMemo(() => {
    if (!mozeZarzadzacStawkami) return {};
    const out = {};
    for (const w of wpisyDlaWybranego) {
      if (!czyTypLiczyGodzinyPracy(w.typ)) continue;
      const kr = normalizujKrWgWpisu(w);
      if (!kr) continue;
      const ds = String(w.data ?? "").slice(0, 10);
      const st = stawkaDlaDaty(stawki, ds);
      if (!st) continue;
      const h = (Number(w.godziny) || 0) + (Number(w.nadgodziny) || 0); // legacy pole nd w starych wpisach
      const kw = h * Number(st.stawka_za_godzine);
      out[kr] = (out[kr] || 0) + kw;
    }
    return out;
  }, [wpisyDlaWybranego, stawki, mozeZarzadzacStawkami]);

  const load = useCallback(async () => {
    const nr = String(wybranyNr ?? "").trim();
    if (!nr) return;
    setFetchErr(null);
    setBusy(true);
    try {
      const { data: w, error: e1 } = await supabase
        .from("czas_pracy_wpis")
        .select("*")
        .eq("pracownik_nr", nr)
        .gte("data", pierwszyOstatniDzien.odIso)
        .lte("data", pierwszyOstatniDzien.doIso)
        .order("data", { ascending: true });
      if (e1) throw e1;
      setWpisy(w ?? []);

      {
        const { data: szabl, error: esz } = await supabase
          .from("czas_pracy_zadanie_szablon")
          .select("tekst")
          .eq("pracownik_nr", nr);
        if (!esz && szabl) {
          setSzablonyZadan(
            [...new Set(szabl.map((r) => r.tekst).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pl"))
          );
        } else {
          setSzablonyZadan([]);
        }
      }
      {
        const { data: zadRows, error: ez } = await supabase.from("zadania").select("zadanie, kr").limit(3000);
        if (!ez && zadRows) setZadaniaDlaCzasu(zadRows);
        else setZadaniaDlaCzasu([]);
      }

      if (mozeZarzadzacStawkami) {
        const { data: s, error: e2 } = await supabase
          .from("pracownik_stawka_okres")
          .select("*")
          .eq("pracownik_nr", nr)
          .order("data_od", { ascending: true });
        if (e2) throw e2;
        setStawki(s ?? []);
      } else {
        setStawki([]);
      }
    } catch (e) {
      setFetchErr(e?.message ?? String(e));
      setWpisy([]);
      setStawki([]);
    } finally {
      setBusy(false);
    }
  }, [supabase, wybranyNr, pierwszyOstatniDzien.odIso, pierwszyOstatniDzien.doIso, mozeZarzadzacStawkami]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!modal || form != null) return;
    const list = wpisyPoDniu.get(modal.dzien) ?? [];
    setModal((prev) => (prev && prev.dzien ? { ...prev, lista: list } : prev));
  }, [wpisyPoDniu, modal?.dzien, form]);

  /** Edycja wpisów: wyłącznie administrator (wszyscy) albo własny nr (pracownik i kierownik). Kierownik widzi listę wszystkich, ale edytuje tylko siebie. */
  const mozeEdytowacWybraneWpisy = useMemo(() => {
    if (!pracownikSesja?.nr) return false;
    if (String(pracownikSesja.app_role ?? "").trim() === "admin") return true;
    return String(pracownikSesja.nr).trim() === String(wybranyNr ?? "").trim();
  }, [pracownikSesja, wybranyNr]);

  const widokTylkoDoOdczytuCudzychGodzin = useMemo(() => {
    if (!pracownikSesja?.nr) return false;
    if (String(pracownikSesja.app_role ?? "").trim() === "admin") return false;
    return String(pracownikSesja.nr).trim() !== String(wybranyNr ?? "").trim();
  }, [pracownikSesja, wybranyNr]);

  /** Import z Excela CMP — admin (dowolny plik) lub pracownik (tylko własny nr z arkusza). */
  const mozeImportowacArkusz = useMemo(() => {
    if (!pracownikSesja?.nr) return false;
    if (String(pracownikSesja.app_role ?? "").trim() === "admin") return true;
    return mozeEdytowacWybraneWpisy;
  }, [pracownikSesja, mozeEdytowacWybraneWpisy]);

  async function usunImportRozliczeniaMiesiecznegoCMP() {
    if (!mozeImportowacArkusz || usuwanieRozliczeniaBusy) return;
    const nr = String(wybranyNr ?? "").trim();
    if (!nr) {
      alert("Wybierz pracownika na liście.");
      return;
    }
    const ark = `${String(miesiac + 1).padStart(2, "0")}-${rok}`;
    const miesNazwaRaw = new Date(rok, miesiac, 15).toLocaleDateString("pl-PL", { month: "long" });
    const miesNazwa = miesNazwaRaw ? miesNazwaRaw.charAt(0).toUpperCase() + miesNazwaRaw.slice(1) : ark;
    const osoba = String(pracownikRekord?.imie_nazwisko ?? "").trim() || `nr ${nr}`;

    const krok1 =
      `Usunąć z bazy wpisy czasu pracy zaimportowane z arkusza „RozliczenieGodzinowe”?\n\n` +
      `• Pracownik: ${osoba} (nr ${nr})\n` +
      `• Miesiąc (arkusz): ${ark} (${miesNazwa} ${rok})\n\n` +
      `Skasowane zostaną wyłącznie wpisy z tym importem (znacznik w polu uwagi dla arkusza ${ark}).\n` +
      `Wpisy dodane ręcznie w aplikacji nie są usuwane.\n\n` +
      `Tej operacji nie można cofnąć.`;
    if (!window.confirm(krok1)) return;

    const krok2 = `Ostateczne potwierdzenie: skasować rozliczenie miesięczne (import CMP) dla ${osoba}, arkusz ${ark}?`;
    if (!window.confirm(krok2)) return;

    setUsuwanieRozliczeniaBusy(true);
    try {
      const zakres = zakresMiesiacaZKoduArkusza(ark);
      if (!zakres?.odIso || !zakres?.doIso) {
        alert("Nie udało się ustalić zakresu dat miesiąca.");
        return;
      }
      const { error } = await supabase
        .from("czas_pracy_wpis")
        .delete()
        .eq("pracownik_nr", nr)
        .gte("data", zakres.odIso)
        .lte("data", zakres.doIso)
        .like("uwagi", `*Import: RozliczenieGodzinowe / ${ark}*`);
      if (error) throw error;
      setImportMsg(`Usunięto wpisy importu CMP dla arkusza „${ark}” (nr ${nr}).`);
      await load();
    } catch (err) {
      console.error(err);
      alert(err?.message ?? String(err));
    } finally {
      setUsuwanieRozliczeniaBusy(false);
    }
  }

  async function obsluzWyborPlikuImportu(files) {
    const file = files?.[0];
    if (!file || !mozeImportowacArkusz) return;
    setImportMsg(null);
    try {
      const buf = await file.arrayBuffer();
      const slice = buf.slice(0);
      const lista = listujArkuszeMiesieczneRozliczenie(slice);
      if (!lista.length) {
        alert("Brak arkuszy w nazwie MM-RRRR (np. 01-2026). Wybierz plik „RozliczenieGodzinowe”.");
        importBuforPlikuRef.current = null;
        setImportListaArkuszy([]);
        setImportNazwaPliku("");
        setImportWybranyArkusz("");
        return;
      }
      importBuforPlikuRef.current = slice;
      setImportListaArkuszy(lista);
      setImportNazwaPliku(file.name);
      const suggest = `${String(miesiac + 1).padStart(2, "0")}-${rok}`;
      setImportWybranyArkusz(lista.includes(suggest) ? suggest : lista[0]);
      setImportMsg(
        `Plik „${file.name}”: ${lista.length} arkusz(y) miesięczne — „Importuj wybrany arkusz”, „Importuj wszystkie arkusze” albo inny miesiąc z tego samego pliku.`,
      );
    } catch (err) {
      console.error(err);
      alert(err?.message ?? String(err));
      importBuforPlikuRef.current = null;
      setImportListaArkuszy([]);
      setImportNazwaPliku("");
    } finally {
      if (importFileRef.current) importFileRef.current.value = "";
    }
  }

  async function wykonajImportWybranegoArkusza() {
    if (!mozeImportowacArkusz) return;
    const buf = importBuforPlikuRef.current;
    const ark = String(importWybranyArkusz ?? "").trim();
    if (!buf || !ark) {
      alert("Najpierw wybierz plik .xlsx, potem arkusz miesięczny (MM-RRRR).");
      return;
    }
    setImportBusy(true);
    setImportMsg(null);
    try {
      const parsed = parsujRozliczenieGodzinoweXlsx(buf, { sheetNames: [ark] });
      const fileNr = parsed.pracownikNr;
      const admin = String(pracownikSesja?.app_role ?? "").trim() === "admin";
      const sessionNr = String(pracownikSesja?.nr ?? "").trim();
      const wybr = String(wybranyNr ?? "").trim();

      if (!admin) {
        if (fileNr !== sessionNr || fileNr !== wybr) {
          alert(
            `Plik dotyczy numeru ewidencyjnego ${fileNr}. Wybierz na liście tę osobę i upewnij się, że importujesz na swoje konto.`,
          );
          return;
        }
      } else if (fileNr !== wybr) {
        if (
          !window.confirm(
            `Arkusz jest dla pracownika nr ${fileNr}, na liście wybrano ${wybr}. Zapisze wpisy dla nr ${fileNr}. Kontynuować?`,
          )
        ) {
          return;
        }
      }

      if (parsed.rows.length === 0) {
        alert(`Brak wierszy do importu w arkuszu „${ark}”.`);
        return;
      }

      const zakresArkusza = zakresMiesiacaZKoduArkusza(ark);
      const delOd = zakresArkusza?.odIso ?? parsed.minData;
      const delDo = zakresArkusza?.doIso ?? parsed.maxData;

      if (!skipDeleteImport && delOd && delDo) {
        const { error: eDel } = await supabase
          .from("czas_pracy_wpis")
          .delete()
          .eq("pracownik_nr", fileNr)
          .gte("data", delOd)
          .lte("data", delDo)
          .like("uwagi", `*Import: RozliczenieGodzinowe / ${ark}*`);
        if (eDel) throw eDel;
      }

      const chunkSize = 80;
      for (let i = 0; i < parsed.rows.length; i += chunkSize) {
        const chunk = parsed.rows.slice(i, i + chunkSize);
        const { error } = await supabase.from("czas_pracy_wpis").insert(chunk);
        if (error) throw error;
      }

      setWybranyNr(fileNr);
      setImportMsg(
        `Zaimportowano ${parsed.rows.length} wpisów → nr ${fileNr}, arkusz „${ark}” (możesz wybrać inny miesiąc z tego samego pliku i zaimportować ponownie).`,
      );
      await load();
    } catch (err) {
      console.error(err);
      alert(err?.message ?? String(err));
    } finally {
      setImportBusy(false);
    }
  }

  async function wykonajImportWszystkichArkuszy() {
    if (!mozeImportowacArkusz) return;
    const buf = importBuforPlikuRef.current;
    if (!buf) {
      alert("Najpierw wybierz plik .xlsx.");
      return;
    }
    if (!importListaArkuszy.length) {
      alert("Brak arkuszy MM-RRRR w pliku.");
      return;
    }
    const listaTxt = importListaArkuszy.join(", ");
    if (
      !window.confirm(
        `Zaimportować wszystkie arkusze miesięczne z wczytanego pliku?\n\n` +
          `Arkusze (${importListaArkuszy.length}): ${listaTxt}\n\n` +
          (skipDeleteImport
            ? "Zaznaczono „Nie kasuj wcześniejszego importu” — istniejące wpisy nie będą usuwane (możliwe duplikaty).\n\n"
            : "Dla każdego miesiąca usunięte zostaną wcześniejsze wpisy z importu CMP (ten sam znacznik w uwagach).\n\n") +
          `Kontynuować?`,
      )
    ) {
      return;
    }

    setImportBusy(true);
    setImportMsg(null);
    try {
      const parsed = parsujRozliczenieGodzinoweXlsx(buf, {});
      const nrsUnikalne = [
        ...new Set(parsed.rows.map((r) => String(r.pracownik_nr ?? "").trim()).filter(Boolean)),
      ];
      if (nrsUnikalne.length > 1) {
        alert(
          `W pliku występują wpisy dla więcej niż jednego numeru ewidencyjnego: ${nrsUnikalne.join(", ")}.\n\n` +
            `Import wszystkich arkuszy jest możliwy tylko wtedy, gdy cały plik dotyczy jednej osoby.`,
        );
        return;
      }
      const fileNr = nrsUnikalne[0] ?? String(parsed.pracownikNr ?? "").trim();
      if (!fileNr) {
        alert("Nie udało się ustalić numeru ewidencyjnego z pliku.");
        return;
      }

      const admin = String(pracownikSesja?.app_role ?? "").trim() === "admin";
      const sessionNr = String(pracownikSesja?.nr ?? "").trim();
      const wybr = String(wybranyNr ?? "").trim();

      if (!admin) {
        if (fileNr !== sessionNr || fileNr !== wybr) {
          alert(
            `Plik dotyczy numeru ewidencyjnego ${fileNr}. Wybierz na liście tę osobę i upewnij się, że importujesz na swoje konto.`,
          );
          return;
        }
      } else if (fileNr !== wybr) {
        if (
          !window.confirm(
            `Plik dotyczy pracownika nr ${fileNr}, na liście wybrano ${wybr}. Zapisze wpisy dla nr ${fileNr}. Kontynuować?`,
          )
        ) {
          return;
        }
      }

      if (parsed.rows.length === 0) {
        alert("Brak wierszy do importu we wszystkich arkuszach miesięcznych.");
        return;
      }

      if (!skipDeleteImport) {
        for (const ark of parsed.przetworzoneArkusze) {
          const zakresArkusza = zakresMiesiacaZKoduArkusza(ark);
          const delOd = zakresArkusza?.odIso;
          const delDo = zakresArkusza?.doIso;
          if (!delOd || !delDo) continue;
          const { error: eDel } = await supabase
            .from("czas_pracy_wpis")
            .delete()
            .eq("pracownik_nr", fileNr)
            .gte("data", delOd)
            .lte("data", delDo)
            .like("uwagi", `*Import: RozliczenieGodzinowe / ${ark}*`);
          if (eDel) throw eDel;
        }
      }

      const chunkSize = 80;
      for (let i = 0; i < parsed.rows.length; i += chunkSize) {
        const chunk = parsed.rows.slice(i, i + chunkSize);
        const { error } = await supabase.from("czas_pracy_wpis").insert(chunk);
        if (error) throw error;
      }

      setWybranyNr(fileNr);
      setImportMsg(
        `Zaimportowano ${parsed.rows.length} wpisów z ${parsed.przetworzoneArkusze.length} arkuszy → nr ${fileNr}.`,
      );
      await load();
    } catch (err) {
      console.error(err);
      alert(err?.message ?? String(err));
    } finally {
      setImportBusy(false);
    }
  }

  function otworzDzien(iso) {
    const list = wpisyPoDniu.get(iso) ?? [];
    setModal({ dzien: iso, lista: list });
  }

  function startDodaj(iso) {
    setForm({
      id: undefined,
      data: iso,
      kr: "",
      typ: "praca",
      kodNbArkusza: "",
      czas_od: DOMYSLNY_OD_CZASU,
      czas_do: DOMYSLNY_DO_CZASU,
      uwagi_dodatkowe: "",
      wykonywane_zadanie: "",
      delegacja: false,
    });
  }

  function startEdytuj(w) {
    const g = Number(w.godziny) || 0;
    const nd = Number(w.nadgodziny) || 0;
    const godzRazem = nd > 0 ? g + nd : g;
    const uw = String(w.uwagi ?? "");
    const kodZUwag = kodArkuszaZZUwag(uw) || "";

    let typEdycji = w.typ === "delegacja" ? "praca" : (w.typ || "praca");
    let delegacjaFlg = w.typ === "delegacja";

    const parsed = parsujZakresCzasuZUwag(uw);
    let czasOd = parsed.czasOd ? normalizeTimeInput(parsed.czasOd) : "";
    let czasDo = parsed.czasDo ? normalizeTimeInput(parsed.czasDo) : "";
    const maZakresWZapisie = Boolean(czasOd && czasDo);

    let uwagiDodatkowe = maZakresWZapisie
      ? oczyscReszteUwagDlaFormularza(parsed.reszta || "")
      : uw.trim();

    function wycinajDelegacjaZZapisu(t) {
      let s = String(t ?? "").trim();
      if (s && /^delegacja(\s|—|–|-|$)/i.test(s)) {
        delegacjaFlg = true;
        s = s.replace(/^delegacja\s*(—|–|-)?\s*/i, "").trim();
      }
      return s;
    }
    uwagiDodatkowe = wycinajDelegacjaZZapisu(uwagiDodatkowe);

    if (!maZakresWZapisie) {
      czasOd = DOMYSLNY_OD_CZASU;
      czasDo =
        godzRazem > 0 ? dodajGodzinyDoCzasu(DOMYSLNY_OD_CZASU, godzRazem) : DOMYSLNY_DO_CZASU;
    }

    setForm({
      id: w.id,
      data: String(w.data ?? "").slice(0, 10),
      kr: normalizujKrWgWpisu(w),
      typ: typEdycji,
      kodNbArkusza: kodZUwag.trim(),
      czas_od: czasOd,
      czas_do: czasDo,
      uwagi_dodatkowe: uwagiDodatkowe,
      wykonywane_zadanie: String(w.wykonywane_zadanie ?? "").trim(),
      delegacja: delegacjaFlg,
    });
  }

  async function zapiszWpis(ev) {
    ev.preventDefault();
    if (!mozeEdytowacWybraneWpisy || !form) return;
    const od = normalizeTimeInput(form.czas_od);
    const dol = normalizeTimeInput(form.czas_do);
    if (!od || !dol) {
      alert("Uzupełnij godzinę początku i końca (Od / Do).");
      return;
    }
    const godzWyliczone = obliczGodzinyZZakresu(od, dol);
    if (!Number.isFinite(godzWyliczone) || godzWyliczone <= 0) {
      alert("Zakres Od–Do musi dawać dodatnią liczbę godzin (np. 08:00–11:00).");
      return;
    }
    const nr = String(wybranyNr).trim();
    let dod = String(form.uwagi_dodatkowe ?? "").trim();
    if (form.delegacja && form.typ === "praca") {
      if (!/\bdelegacja\b/i.test(dod)) {
        dod = dod ? `Delegacja — ${dod}` : "Delegacja";
      }
    }
    let uwagiZapis = zlozUwagiZZakresu(od, dol, dod);
    const kn = String(form.kodNbArkusza ?? "").trim();
    if (kn) {
      uwagiZapis = uwagiZapis ? `${uwagiZapis}\n(${kn})` : `(${kn})`;
    }

    const payload = {
      pracownik_nr: nr,
      data: form.data,
      kr: normalizujKrZArkusza(form.kr),
      typ: form.typ,
      godziny: godzWyliczone,
      nadgodziny: 0,
      uwagi: uwagiZapis || null,
      wykonywane_zadanie: String(form.wykonywane_zadanie ?? "").trim() || null,
    };
    if (grupaTypu(payload.typ) === "nieobecnosc") {
      payload.kr = "";
    }
    setBusy(true);
    try {
      if (form.id) {
        const { error } = await supabase.from("czas_pracy_wpis").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("czas_pracy_wpis").insert([payload]);
        if (error) throw error;
      }
      const zadTxt = String(form.wykonywane_zadanie ?? "").trim();
      if (zadTxt) {
        const { error: ez } = await supabase
          .from("czas_pracy_zadanie_szablon")
          .upsert({ pracownik_nr: nr, tekst: zadTxt }, { onConflict: "pracownik_nr,tekst" });
        if (ez) console.warn("Szablon zadania (opcjonalnie):", ez.message);
      }
      setForm(null);
      await load();
    } catch (e) {
      alert(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  /** @param {{ zamknijModal?: boolean }} [opcje] — z listy dnia zostaw modal otwarty i odśwież listę */
  async function usunWpis(id, opcje = {}) {
    const zamknijModal = opcje.zamknijModal !== false;
    if (!mozeEdytowacWybraneWpisy || !id) return;
    if (!window.confirm("Usunąć ten wpis?")) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("czas_pracy_wpis").delete().eq("id", id);
      if (error) throw error;
      setForm(null);
      if (zamknijModal) setModal(null);
      await load();
    } catch (e) {
      alert(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function zapiszStawke(ev) {
    ev.preventDefault();
    if (!mozeZarzadzacStawkami) return;
    const nr = String(wybranyNr).trim();
    const data_od = String(stForm.data_od).trim();
    const data_do = String(stForm.data_do).trim();
    const st = Number(String(stForm.stawka_za_godzine).replace(",", "."));
    if (!data_od || !data_do || !st || st <= 0) {
      setStMsg("Uzupełnij daty i dodatnią stawkę.");
      return;
    }
    setBusy(true);
    setStMsg(null);
    try {
      const { error } = await supabase.from("pracownik_stawka_okres").insert([
        {
          pracownik_nr: nr,
          data_od,
          data_do,
          stawka_za_godzine: st,
          uwagi: String(stForm.uwagi ?? "").trim() || null,
        },
      ]);
      if (error) throw error;
      setStForm({ data_od: "", data_do: "", stawka_za_godzine: "", uwagi: "" });
      await load();
      setStMsg("Zapisano okres stawki.");
    } catch (e) {
      setStMsg(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function usunStawke(id) {
    if (!mozeZarzadzacStawkami || !id) return;
    if (!window.confirm("Usunąć ten okres stawki?")) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("pracownik_stawka_okres").delete().eq("id", id);
      if (error) throw error;
      await load();
    } catch (e) {
      alert(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  if (wymagaKonta && !pracownikSesja?.nr) {
    return (
      <section style={{ maxWidth: "40rem" }}>
        <p style={{ color: theme.muted, fontSize: "0.9rem" }}>
          Kalendarz czasu pracy jest dostępny po zalogowaniu i powiązaniu konta z rekordem w{" "}
          <code style={{ fontSize: "0.85em" }}>pracownik</code>.
        </p>
      </section>
    );
  }

  const nazwyMies = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Październik",
    "Listopad",
    "Grudzień",
  ];

  return (
    <section style={{ maxWidth: "min(1200px, 100%)" }}>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", marginTop: 0, letterSpacing: "-0.02em" }}>
        Czas pracy i rozliczenie godzin
      </h2>
      <p style={{ color: theme.muted, fontSize: "0.86rem", lineHeight: 1.55, marginBottom: "1rem" }}>
        W jednym dniu możesz dodać <strong style={{ color: theme.text }}>wiele wpisów</strong> (np. 7–10 jedna KR, potem
        kolejna) — każdy wpis to osobny blok godzin. <strong style={{ color: theme.text }}>Nadgodziny</strong> liczone są
        na koniec miesiąca: najpierw wg kalendarza PL obliczana jest norma (dni robocze × {NORMA_H_NA_DZIEN_ROBOCZY} h), potem
        porównanie z sumą zapisanych godzin pracy. Przy{" "}
        <strong style={{ color: theme.text }}>umowie zlecenie</strong> wszystkie zapisane godziny traktujemy jak nadgodziny
        rozliczeniowe; przy <strong style={{ color: theme.text }}>UoP</strong> — nadgodziny to nadwyżka ponad normę.
        Formę zatrudnienia ustawia administrator w <strong style={{ color: theme.text }}>Zespół</strong>.
        {mozeZarzadzacStawkami ? (
          <>
            {" "}
            <strong style={{ color: theme.text }}>Stawki godzinowe</strong> i szacunek kosztu na KR są dostępne tylko
            administratorowi.
          </>
        ) : (
          <>
            {" "}
            Szczegóły <strong style={{ color: theme.text }}>stawek płacowych</strong> i kosztów na KR wprowadza wyłącznie
            administrator — w tym widoku nie są wyświetlane.
          </>
        )}
      </p>

      {fetchErr ? (
        <div
          role="alert"
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            border: "1px solid rgba(239,68,68,0.4)",
            background: "rgba(239,68,68,0.08)",
            color: "#fecaca",
            fontSize: "0.88rem",
            marginBottom: "1rem",
          }}
        >
          <strong>Nie udało się wczytać danych.</strong> {fetchErr}
          <br />
          <span style={{ fontSize: "0.82em", opacity: 0.95 }}>
            Uruchom w Supabase: <code>g4-app/supabase/czas-pracy-stawki-i-wpisy.sql</code>
          </span>
        </div>
      ) : null}

      {widokTylkoDoOdczytuCudzychGodzin ? (
        <div
          role="status"
          style={{
            marginBottom: "1rem",
            padding: "0.65rem 0.85rem",
            borderRadius: "10px",
            border: "1px solid rgba(56,189,248,0.35)",
            background: "rgba(56,189,248,0.08)",
            color: "#bae6fd",
            fontSize: "0.86rem",
            lineHeight: 1.45,
          }}
        >
          <strong>Podgląd godzin innej osoby.</strong> Jako kierownik możesz je przeglądać; edytować i dodawać wpisy może
          tylko ta osoba lub <strong>administrator</strong>.
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.65rem",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        {mozeWybieracPracownika ? (
          <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.82rem", color: theme.muted }}>
            Pracownik
            <select
              value={wybranyNr}
              onChange={(e) => setWybranyNr(e.target.value)}
              style={{
                padding: "0.45rem 0.6rem",
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
                background: "#111827",
                color: theme.text,
                minWidth: "14rem",
              }}
            >
              {pracownicy.map((p) => (
                <option key={String(p.nr)} value={String(p.nr).trim()}>
                  {String(p.nr)} — {p.imie_nazwisko ?? ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span style={{ fontSize: "0.85rem", color: theme.text }}>
            <strong>{pracownikWidokEfektywny?.imie_nazwisko ?? "—"}</strong>
            <span style={{ color: theme.muted }}>
              {" "}
              (nr {wybranyNr}) ·{" "}
              {formaZatrudnienia === "uz"
                ? "um. zlecenie"
                : formaZatrudnienia === "inne"
                  ? "forma: inna"
                  : "UoP"}
            </span>
          </span>
        )}
        {mozeWybieracPracownika && pracownikRekord ? (
          <span style={{ fontSize: "0.78rem", color: theme.muted }}>
            Forma:{" "}
            {formaZatrudnienia === "uz" ? "umowa zlecenie" : formaZatrudnienia === "inne" ? "inna" : "umowa o pracę"}
          </span>
        ) : null}
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.82rem", color: theme.muted }}>
          Rok
          <input
            type="number"
            value={rok}
            min={2000}
            max={2100}
            onChange={(e) => setRok(Number(e.target.value))}
            style={{
              width: "5.5rem",
              padding: "0.45rem",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              background: "#111827",
              color: theme.text,
            }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.82rem", color: theme.muted }}>
          Miesiąc
          <select
            value={miesiac}
            onChange={(e) => setMiesiac(Number(e.target.value))}
            style={{
              padding: "0.45rem 0.6rem",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              background: "#111827",
              color: theme.text,
              minWidth: "10rem",
            }}
          >
            {nazwyMies.map((n, i) => (
              <option key={n} value={i}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void load()}
          style={{
            marginTop: "1.15rem",
            padding: "0.45rem 0.85rem",
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
            background: "rgba(249,115,22,0.12)",
            color: theme.action,
            fontWeight: 600,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          Odśwież
        </button>
        {mozeImportowacArkusz ? (
          <div
            style={{
              marginTop: "0.85rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
              fontSize: "0.78rem",
              color: theme.muted,
              maxWidth: "28rem",
            }}
          >
            <input
              ref={importFileRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              style={{ display: "none" }}
              onChange={(ev) => void obsluzWyborPlikuImportu(ev.target.files)}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", alignItems: "center" }}>
              <button
                type="button"
                disabled={busy || importBusy}
                onClick={() => importFileRef.current?.click()}
                style={{
                  padding: "0.45rem 0.75rem",
                  borderRadius: "8px",
                  border: `1px solid rgba(52,211,153,0.45)`,
                  background: "rgba(52,211,153,0.12)",
                  color: "#a7f3d0",
                  fontWeight: 600,
                  cursor: busy || importBusy ? "wait" : "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Wybierz plik RozliczenieGodzinowe (.xlsx)
              </button>
              {importListaArkuszy.length > 0 ? (
                <>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: theme.text }}>
                    Arkusz:
                    <select
                      value={importWybranyArkusz}
                      onChange={(ev) => setImportWybranyArkusz(ev.target.value)}
                      disabled={busy || importBusy}
                      style={{
                        padding: "0.35rem 0.5rem",
                        borderRadius: "8px",
                        border: `1px solid ${theme.border}`,
                        background: "#0b0f14",
                        color: theme.text,
                        fontSize: "0.8rem",
                        minWidth: "6.5rem",
                      }}
                    >
                      {importListaArkuszy.map((nazwa) => (
                        <option key={nazwa} value={nazwa}>
                          {nazwa}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={busy || importBusy || !importWybranyArkusz}
                    onClick={() => void wykonajImportWybranegoArkusza()}
                    style={{
                      padding: "0.45rem 0.75rem",
                      borderRadius: "8px",
                      border: `1px solid rgba(251,191,36,0.55)`,
                      background: "rgba(251,191,36,0.12)",
                      color: "#fcd34d",
                      fontWeight: 600,
                      cursor: busy || importBusy ? "wait" : "pointer",
                      fontSize: "0.8rem",
                    }}
                  >
                    {importBusy ? "Import…" : "Importuj wybrany arkusz"}
                  </button>
                  <button
                    type="button"
                    disabled={busy || importBusy}
                    onClick={() => void wykonajImportWszystkichArkuszy()}
                    style={{
                      padding: "0.45rem 0.75rem",
                      borderRadius: "8px",
                      border: `1px solid rgba(96,165,250,0.55)`,
                      background: "rgba(96,165,250,0.12)",
                      color: "#93c5fd",
                      fontWeight: 600,
                      cursor: busy || importBusy ? "wait" : "pointer",
                      fontSize: "0.8rem",
                    }}
                  >
                    {importBusy ? "Import…" : "Importuj wszystkie arkusze"}
                  </button>
                </>
              ) : null}
              <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={skipDeleteImport}
                  onChange={(ev) => setSkipDeleteImport(ev.target.checked)}
                />
                Nie kasuj wcześniejszego importu (tylko dopisz)
              </label>
            </div>
            {importNazwaPliku ? (
              <span style={{ fontSize: "0.74rem", color: theme.muted }}>
                Wczytany plik: <strong style={{ color: theme.text }}>{importNazwaPliku}</strong>
              </span>
            ) : null}
            {importMsg ? (
              <span style={{ color: "#86efac", lineHeight: 1.35 }}>{importMsg}</span>
            ) : (
              <span style={{ opacity: 0.85 }}>
                Najpierw wybierz plik — aplikacja pokaże listę arkuszy MM-RRRR. Możesz zaimportować jeden miesiąc albo wszystkie naraz. Przed importem (opcja domyślna) kasowane są wcześniejsze wpisy z tego samego arkusza (ten sam miesiąc w znaczniku importu).
              </span>
            )}
            <div style={{ marginTop: "0.55rem", paddingTop: "0.55rem", borderTop: `1px solid ${theme.border}` }}>
              <button
                type="button"
                disabled={busy || importBusy || usuwanieRozliczeniaBusy || !String(wybranyNr ?? "").trim()}
                onClick={() => void usunImportRozliczeniaMiesiecznegoCMP()}
                style={{
                  padding: "0.45rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(248,113,113,0.55)",
                  background: "rgba(248,113,113,0.12)",
                  color: "#fca5a5",
                  fontWeight: 600,
                  cursor: busy || importBusy || usuwanieRozliczeniaBusy ? "wait" : "pointer",
                  fontSize: "0.8rem",
                }}
              >
                {usuwanieRozliczeniaBusy ? "Usuwanie…" : "Usuń rozliczenie miesięczne (import CMP)"}
              </button>
              <div style={{ marginTop: "0.35rem", fontSize: "0.72rem", color: theme.muted, lineHeight: 1.4 }}>
                Dotyczy <strong style={{ color: theme.text }}>wybranego miesiąca i roku</strong> oraz{" "}
                <strong style={{ color: theme.text }}>wybranego pracownika</strong>. Usuwa wyłącznie wpisy z importu
                „RozliczenieGodzinowe” (znacznik w uwagach). Dwukrotne potwierdzenie.
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "0.65rem",
          marginBottom: "1.25rem",
          fontSize: "0.82rem",
          color: theme.muted,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            padding: "0.65rem 0.75rem",
            borderRadius: "10px",
            border: `1px solid ${theme.border}`,
            background: "#111827",
            gridColumn: "span 1",
            minWidth: 0,
          }}
        >
          <div style={{ fontWeight: 700, color: theme.text, marginBottom: "0.5rem", fontSize: "0.88rem" }}>
            Legenda arkusza (CMP)
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(5.5rem, auto) 1fr",
              gap: "0.35rem 0.5rem",
              fontSize: "0.78rem",
              lineHeight: 1.35,
            }}
          >
            {LEGENDA_ARKUSZA_CMP.map((r) => (
              <Fragment key={r.kod}>
                <div
                  style={{
                    fontWeight: 700,
                    fontFamily: "ui-monospace, monospace",
                    padding: "0.2rem 0.35rem",
                    borderRadius: "6px",
                    background: r.tlo,
                    color: r.tekst,
                    textAlign: "center",
                    alignSelf: "start",
                    border: "1px solid rgba(15,23,42,0.2)",
                  }}
                >
                  {r.kod}
                </div>
                <div style={{ color: theme.text, paddingTop: "0.08rem" }}>{r.opis}</div>
              </Fragment>
            ))}
          </div>
        </div>
        <div style={{ padding: "0.65rem 0.75rem", borderRadius: "10px", border: `1px solid ${theme.border}`, background: "#111827" }}>
          <div style={{ fontWeight: 700, color: theme.text, marginBottom: "0.35rem" }}>Norma miesiąca (PL)</div>
          <div>Dni robocze: {rozliczenieMiesiac.dniRobocze}</div>
          <div>
            Norma godzin: {rozliczenieMiesiac.norma.toFixed(0)} h ({NORMA_H_NA_DZIEN_ROBOCZY} h × dni)
          </div>
          <div style={{ marginTop: "0.35rem", color: theme.text }}>
            Suma godzin liczona do normy: <strong>{rozliczenieMiesiac.sumaZalogowanych.toFixed(2)} h</strong>
          </div>
          <div style={{ marginTop: "0.2rem", fontSize: "0.78rem", lineHeight: 1.35, opacity: 0.92 }}>
            Obejmuje pracę (w tym delegację, szkolenie), urlop wypoczynkowy i na żądanie, L4 oraz opiekę nad dzieckiem zdrowym — wg zapisanych godzin (np. 8 h z importu całego dnia).
          </div>
          {rozliczenieMiesiac.tryb === "uz" ? (
            <div style={{ marginTop: "0.45rem", color: "#fdba74", lineHeight: 1.45 }}>
              <strong>Um. zlecenie:</strong> do rozliczeń nadgodzin przyjmujemy całą sumę zapisów ({rozliczenieMiesiac.nadgodzinyRozliczeniowe.toFixed(2)} h).
            </div>
          ) : (
            <>
              <div style={{ marginTop: "0.45rem", color: rozliczenieMiesiac.brakDoNormy > 0 ? "#fca5a5" : "#86efac" }}>
                Brak do normy: {rozliczenieMiesiac.brakDoNormy.toFixed(2)} h
              </div>
              <div style={{ marginTop: "0.2rem", color: "#fdba74" }}>
                Nadgodziny rozliczeniowe: {rozliczenieMiesiac.nadgodzinyRozliczeniowe.toFixed(2)} h
              </div>
              {rozliczenieMiesiac.tryb === "inne" ? (
                <div style={{ marginTop: "0.35rem", fontSize: "0.78rem", opacity: 0.9 }}>
                  Forma „inne” — jak UoP (norma vs suma); doprecyzuj politykę w kadrach.
                </div>
              ) : null}
            </>
          )}
        </div>
        <div style={{ padding: "0.65rem 0.75rem", borderRadius: "10px", border: `1px solid ${theme.border}`, background: "#111827" }}>
          <div style={{ fontWeight: 700, color: theme.text, marginBottom: "0.25rem" }}>Godziny na KR (miesiąc)</div>
          <div style={{ lineHeight: 1.45 }}>
            {Object.keys(podsumowanie.poKr).length === 0 ? (
              "—"
            ) : (
              Object.entries(podsumowanie.poKr).map(([k, h]) => (
                <div key={k}>
                  <strong style={{ color: theme.action }}>{etykietaKrDoPodgladu(k)}</strong>: {h.toFixed(2)} h
                </div>
              ))
            )}
          </div>
        </div>
        {mozeZarzadzacStawkami ? (
          <div
            style={{
              padding: "0.65rem 0.75rem",
              borderRadius: "10px",
              border: `1px solid ${theme.border}`,
              background: "#111827",
            }}
          >
            <div style={{ fontWeight: 700, color: theme.text, marginBottom: "0.25rem" }}>
              Szacunek kosztu na KR (wg stawek) — tylko administrator
            </div>
            <div style={{ lineHeight: 1.45 }}>
              {Object.keys(kwotaSzacunekPoKr).length === 0 ? (
                <span>Brak dopasowanej stawki lub brak godzin z polem KR.</span>
              ) : (
                Object.entries(kwotaSzacunekPoKr).map(([k, v]) => (
                  <div key={k}>
                    <strong style={{ color: theme.action }}>{etykietaKrDoPodgladu(k)}</strong>: {formatPln(v)}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="czas-pracy-kalendarz-wrap" style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
        <table
          style={{
            borderCollapse: "collapse",
            borderSpacing: 0,
            tableLayout: "fixed",
            width: "100%",
            minWidth: "640px",
            fontSize: "0.78rem",
          }}
        >
          <colgroup>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <col key={i} style={{ width: `${100 / 7}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((d) => (
                <th
                  key={d}
                  style={{
                    boxSizing: "border-box",
                    minWidth: 0,
                    padding: "0.35rem",
                    color: theme.muted,
                    fontWeight: 700,
                    textAlign: "center",
                    borderBottom: `1px solid ${theme.border}`,
                  }}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kalendarzKomorki.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell) => {
                  if (cell.pusty) {
                    return (
                      <td
                        key={`${ri}-${cell.key}`}
                        style={{
                          boxSizing: "border-box",
                          minWidth: 0,
                          padding: "0.25rem",
                          background: "rgba(15,23,42,0.35)",
                          minHeight: "3.2rem",
                        }}
                      />
                    );
                  }
                  const inf = infoDniaKalendarzaPl(cell.date);
                  const rob = czyDzienRoboczyPl(cell.date);
                  const lista = wpisyPoDniu.get(cell.iso) ?? [];
                  const grupyKomorki = grupujWpisyKalendarzaDoKomorki(lista);
                  let pokazanoWpisy = 0;
                  const grupyDoWyswietlenia = [];
                  for (const g of grupyKomorki) {
                    if (grupyDoWyswietlenia.length >= 3) break;
                    grupyDoWyswietlenia.push(g);
                    pokazanoWpisy += g.length;
                  }
                  const laczPowtorzPracaWDniu = czyKalendarzLaczyPowtorzeniaPraca(lista);
                  const sumaDzien = lista.reduce((acc, w) => {
                    if (!czyTypLiczyGodzinyPracy(w.typ)) return acc;
                    return acc + (Number(w.godziny) || 0) + (Number(w.nadgodziny) || 0);
                  }, 0);
                  let bg = "rgba(17,24,39,0.65)";
                  if (inf.swieto) bg = "rgba(254,202,202,0.28)";
                  else if (inf.weekend) bg = "rgba(30,41,59,0.55)";
                  else if (!rob) bg = "rgba(30,41,59,0.4)";
                  return (
                    <td
                      key={`${ri}-${cell.key}`}
                      style={{
                        boxSizing: "border-box",
                        minWidth: 0,
                        padding: "0.28rem",
                        verticalAlign: "top",
                        border: `1px solid ${theme.border}`,
                        background: bg,
                        minHeight: "4rem",
                        cursor: "pointer",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                      }}
                      title={inf.nazwaSwieta ?? (inf.weekend ? "Weekend" : "")}
                      onClick={() => otworzDzien(cell.iso)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          otworzDzien(cell.iso);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div style={{ fontWeight: 800, color: "#fff", marginBottom: "0.2rem" }}>{cell.date.getDate()}</div>
                      {lista.length === 0 ? (
                        <span style={{ color: theme.muted, fontSize: "0.72rem" }}>—</span>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.22rem" }}>
                          {grupyDoWyswietlenia.map((grupa, wi) => {
                            const w0 = grupa[0];
                            const st = znajdzStylZnaczkaLegendyWpisu(w0);
                            const scalona = grupa.length > 1;
                            const ukryjPowtorPraca =
                              laczPowtorzPracaWDniu && wi > 0 && st.znaczek === "Praca";
                            const key =
                              grupa.map((w) => w.id).filter((id) => id != null).join("-") ||
                              `${cell.iso}-g-${wi}`;
                            return (
                              <div
                                key={key}
                                title={scalona ? tytulGrupyKalendarza(grupa) : tekstLiniiWpisuWKalendarzu(w0)}
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  alignItems: "flex-start",
                                  gap: "0.28rem",
                                  lineHeight: 1.25,
                                }}
                              >
                                {!ukryjPowtorPraca ? (
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      fontFamily: "ui-monospace, SFMono-Regular, monospace",
                                      fontSize: "0.62rem",
                                      padding: "0.14rem 0.32rem",
                                      borderRadius: "6px",
                                      border: "1px solid rgba(15,23,42,0.22)",
                                      background: st.tlo,
                                      color: st.tekst,
                                      flexShrink: 0,
                                      maxWidth: "100%",
                                    }}
                                  >
                                    {st.znaczek}
                                  </span>
                                ) : null}
                                <span
                                  style={{
                                    fontSize: "0.66rem",
                                    color: "#e5e7eb",
                                    flex: "1 1 4rem",
                                    minWidth: 0,
                                  }}
                                >
                                  {scalona
                                    ? opisPoZnaczkuKalendarzaGrupa(grupa, st)
                                    : opisPoZnaczkuKalendarza(w0, {
                                        bezEtykietyTypu: ukryjPowtorPraca,
                                        stylZnaczka: st,
                                      })}
                                </span>
                              </div>
                            );
                          })}
                          {lista.length > pokazanoWpisy ? (
                            <span style={{ fontSize: "0.65rem", color: theme.muted }}>
                              +{lista.length - pokazanoWpisy}
                            </span>
                          ) : null}
                          {sumaDzien > 0 ? (
                            <span style={{ fontSize: "0.68rem", color: "#86efac" }}>{sumaDzien.toFixed(1)} h</span>
                          ) : null}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (!form) setModal(null);
          }}
        >
          <div
            style={{
              background: "#111827",
              border: `1px solid ${theme.border}`,
              borderRadius: "12px",
              padding: "1.1rem",
              maxWidth: "min(32rem, 100%)",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", color: "#fff" }}>
              Dzień {modal.dzien}
              {infoDniaKalendarzaPl(parseDataIso(modal.dzien)).nazwaSwieta
                ? ` · ${infoDniaKalendarzaPl(parseDataIso(modal.dzien)).nazwaSwieta}`
                : ""}
            </h3>
            {!form ? (
              <>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: theme.muted }}>
                  Wpisy tego dnia ({(modal.lista ?? []).length}) — kolejne bloki (inne KR lub inny typ):
                </p>
                <ul style={{ margin: "0 0 1rem", paddingLeft: 0, color: theme.text, fontSize: "0.88rem", listStyle: "none" }}>
                  {(modal.lista ?? []).map((w) => (
                    <li
                      key={w.id}
                      style={{
                        marginBottom: "0.45rem",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: "1 1 12rem", minWidth: 0 }}>
                        <span style={{ lineHeight: 1.45 }}>
                          {tekstLiniiWpisuWKalendarzu(w)}{" "}
                          — {(Number(w.godziny) || 0) + (Number(w.nadgodziny) || 0)} h
                        </span>
                      </div>
                      {mozeEdytowacWybraneWpisy && w.id ? (
                        <div style={{ display: "flex", flexShrink: 0, gap: "0.35rem", alignItems: "center" }}>
                          <button
                            type="button"
                            aria-label="Edytuj wpis"
                            disabled={busy}
                            onClick={() => startEdytuj(w)}
                            style={{
                              ...btnGhost,
                              color: theme.action,
                              padding: "0.2rem 0.5rem",
                              fontSize: "0.78rem",
                              borderColor: "rgba(249,115,22,0.35)",
                            }}
                          >
                            Edytuj
                          </button>
                          <button
                            type="button"
                            aria-label="Usuń wpis"
                            disabled={busy}
                            onClick={() => void usunWpis(w.id, { zamknijModal: false })}
                            style={{
                              ...btnGhost,
                              color: "#fecaca",
                              padding: "0.2rem 0.5rem",
                              fontSize: "0.78rem",
                            }}
                          >
                            Usuń
                          </button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {mozeEdytowacWybraneWpisy ? (
                  <button type="button" style={{ ...btnPrimary, width: "100%", marginBottom: "0.5rem" }} onClick={() => startDodaj(modal.dzien)}>
                    Dodaj kolejny blok (np. inna KR)
                  </button>
                ) : null}
                <button type="button" style={{ ...btnGhost, marginLeft: "0.5rem" }} onClick={() => setModal(null)}>
                  Zamknij
                </button>
              </>
            ) : (
              <form onSubmit={zapiszWpis}>
                <label style={lbl}>
                  Rodzaj
                  <select
                    required
                    value={joinRodzajSelectValue(form.typ, form.kodNbArkusza)}
                    onChange={(e) => {
                      const { typ, kodNbArkusza } = splitRodzajSelectValue(e.target.value);
                      setForm((f) =>
                        f
                          ? {
                              ...f,
                              typ,
                              kodNbArkusza,
                              delegacja: typ === "praca" ? f.delegacja : false,
                            }
                          : f,
                      );
                    }}
                    style={inp}
                  >
                    {OPCJE_RODZAJU_WPISU.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                {form.typ === "praca" ? (
                  <label
                    style={{
                      ...lbl,
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.65rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.delegacja}
                      onChange={(e) => setForm((f) => (f ? { ...f, delegacja: e.target.checked } : f))}
                    />
                    <span>Delegacja (dodatkowa informacja — dopisywana do uwag)</span>
                  </label>
                ) : null}
                <label style={lbl}>
                  KR (opcjonalnie — praca na projekcie; kwoty ze stawek widzi tylko administrator)
                  <select
                    value={normalizujKrZArkusza(form.kr)}
                    onChange={(e) => setForm({ ...form, kr: normalizujKrZArkusza(e.target.value) })}
                    style={inp}
                  >
                    <option value="">— brak / praca ogólna (nie to samo co KR {KR_OGOLNOBIUROWY}) —</option>
                    {[...krList]
                      .sort((a, b) => {
                        const ka = normalizujKrZArkusza(a.kr);
                        const kb = normalizujKrZArkusza(b.kr);
                        if (ka === KR_OGOLNOBIUROWY && kb !== KR_OGOLNOBIUROWY) return -1;
                        if (kb === KR_OGOLNOBIUROWY && ka !== KR_OGOLNOBIUROWY) return 1;
                        return String(a.kr ?? "").localeCompare(String(b.kr ?? ""), "pl", { numeric: true });
                      })
                      .map((r) => {
                        const val = normalizujKrZArkusza(r.kr);
                        return (
                          <option key={val || `x-${String(r.kr)}`} value={val}>
                            {formatOpcjaKRListy(r)}
                          </option>
                        );
                      })}
                  </select>
                  <span style={{ fontSize: "0.76rem", color: theme.muted, marginTop: "0.2rem" }}>
                    <strong style={{ color: theme.text }}>KR {KR_OGOLNOBIUROWY}</strong> — praca ogólnobiurowa (biuro); pole puste — wpis bez przypisanego projektu/KR.
                  </span>
                </label>
                <label style={lbl}>
                  Wykonywane zadanie (opcjonalnie)
                  <input
                    type="text"
                    list="cp-wyk-zadanie-datalist"
                    value={form.wykonywane_zadanie}
                    onChange={(e) => setForm({ ...form, wykonywane_zadanie: e.target.value })}
                    style={inp}
                    placeholder="Wybierz z listy lub wpisz własne — zapisane trafią na podpowiedzi"
                    autoComplete="off"
                  />
                  <datalist id="cp-wyk-zadanie-datalist">
                    {propozycjeZadaniaCzasu.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                  <span style={{ fontSize: "0.76rem", color: theme.muted, marginTop: "0.2rem" }}>
                    Lista łączy <strong>zadania</strong> z modułu Zadania (ogólne + ten sam KR co wyżej) oraz Twoje wcześniejsze
                    wpisy.
                  </span>
                </label>
                <div style={{ ...lbl, marginBottom: "0.65rem" }}>
                  <span>Blok czasu (kilka wpisów w tym samym dniu = kilka bloków)</span>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                      alignItems: "flex-end",
                      marginTop: "0.35rem",
                    }}
                  >
                    <label style={{ ...lbl, marginBottom: 0 }}>
                      Od
                      <input
                        type="time"
                        required
                        step={TIME_INPUT_STEP_SEKUND}
                        value={form.czas_od}
                        onChange={(e) => setForm({ ...form, czas_od: e.target.value })}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (!v?.trim()) return;
                          setForm((f) => (f ? { ...f, czas_od: normalizeTimeInput(v) } : f));
                        }}
                        style={{ ...inp, width: "auto", minWidth: "7.5rem" }}
                      />
                    </label>
                    <label style={{ ...lbl, marginBottom: 0 }}>
                      Do
                      <input
                        type="time"
                        required
                        step={TIME_INPUT_STEP_SEKUND}
                        value={form.czas_do}
                        onChange={(e) => setForm({ ...form, czas_do: e.target.value })}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (!v?.trim()) return;
                          setForm((f) => (f ? { ...f, czas_do: normalizeTimeInput(v) } : f));
                        }}
                        style={{ ...inp, width: "auto", minWidth: "7.5rem" }}
                      />
                    </label>
                    <div
                      style={{
                        fontSize: "0.88rem",
                        color: theme.text,
                        paddingBottom: "0.35rem",
                        fontWeight: 600,
                      }}
                      aria-live="polite"
                    >
                      {(() => {
                        const odN = normalizeTimeInput(form.czas_od);
                        const dolN = normalizeTimeInput(form.czas_do);
                        const h = obliczGodzinyZZakresu(odN || form.czas_od, dolN || form.czas_do);
                        if (!Number.isFinite(h) || h <= 0) return "— h (wybierz Od i Do)";
                        const t = h % 1 !== 0 ? h.toFixed(2).replace(".", ",") : String(h);
                        return `→ ${t} h`;
                      })()}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.78rem", color: theme.muted, display: "block", marginTop: "0.35rem" }}>
                    Minuty co {KROK_MINUT_CZAS_PRACY} min (np. :00, :15, :30, :45). Godziny pracy liczą się z przedziału.
                    Jeśli „Do” jest wcześniej niż „Od”, liczymy przez północ (np. nocna zmiana).
                  </span>
                </div>
                <label style={lbl}>
                  Uwagi dodatkowe (opcjonalnie — dołączane do zakresu w zapisie)
                  <input
                    value={form.uwagi_dodatkowe}
                    onChange={(e) => setForm({ ...form, uwagi_dodatkowe: e.target.value })}
                    style={inp}
                    placeholder="np. dojazd, notatka"
                  />
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                  <button type="submit" disabled={busy} style={btnPrimary}>
                    Zapisz
                  </button>
                  <button type="button" style={btnGhost} onClick={() => setForm(null)}>
                    Wstecz
                  </button>
                  {form.id ? (
                    <button type="button" style={{ ...btnGhost, color: "#fecaca" }} onClick={() => usunWpis(form.id)}>
                      Usuń
                    </button>
                  ) : null}
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {mozeZarzadzacStawkami ? (
        <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: `1px solid ${theme.border}` }}>
          <h3 style={{ fontSize: "0.95rem", color: "#fff", margin: "0 0 0.5rem" }}>
            Stawki za godzinę (okresy) — widoczne tylko dla administratora
          </h3>
          <p style={{ color: theme.muted, fontSize: "0.82rem", marginBottom: "0.75rem" }}>
            Zakres dat nie powinien się nakładać z innym wierszem — przy nakładaniu się koszt na KR bierze ostatni pasujący
            okres (wg <code style={{ fontSize: "0.85em" }}>data_od</code>). Inne role nie widzą tej sekcji ani kwot (przy
            migracji RLS: <code style={{ fontSize: "0.85em" }}>pracownik-stawka-okres-rls-tylko-admin.sql</code>).
          </p>
          {stMsg ? <p style={{ fontSize: "0.82rem", color: stMsg.startsWith("Zapisano") ? "#86efac" : "#fecaca" }}>{stMsg}</p> : null}
          <form onSubmit={zapiszStawke} style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "flex-end", marginBottom: "1rem" }}>
            <label style={lbl}>
              Od
              <input
                type="date"
                required
                value={stForm.data_od}
                onChange={(e) => setStForm((f) => ({ ...f, data_od: e.target.value }))}
                style={inp}
              />
            </label>
            <label style={lbl}>
              Do
              <input
                type="date"
                required
                value={stForm.data_do}
                onChange={(e) => setStForm((f) => ({ ...f, data_do: e.target.value }))}
                style={inp}
              />
            </label>
            <label style={lbl}>
              PLN / h
              <input
                value={stForm.stawka_za_godzine}
                onChange={(e) => setStForm((f) => ({ ...f, stawka_za_godzine: e.target.value }))}
                style={{ ...inp, width: "6rem" }}
                inputMode="decimal"
              />
            </label>
            <label style={{ ...lbl, flex: "1 1 12rem" }}>
              Uwagi
              <input
                value={stForm.uwagi}
                onChange={(e) => setStForm((f) => ({ ...f, uwagi: e.target.value }))}
                style={inp}
              />
            </label>
            <button type="submit" disabled={busy} style={{ ...btnPrimary, marginBottom: "0.15rem" }}>
              Dodaj okres
            </button>
          </form>
          <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.85rem", color: theme.text }}>
            {(stawki ?? []).map((s) => (
              <li key={s.id} style={{ marginBottom: "0.35rem" }}>
                {s.data_od} → {s.data_do}: <strong>{formatPln(Number(s.stawka_za_godzine))}</strong> / h
                {s.uwagi ? ` — ${s.uwagi}` : ""}
                <button
                  type="button"
                  onClick={() => usunStawke(s.id)}
                  style={{
                    marginLeft: "0.5rem",
                    background: "none",
                    border: "none",
                    color: "#fca5a5",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  usuń
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

const lbl = { display: "grid", gap: "0.25rem", fontSize: "0.82rem", color: theme.muted, marginBottom: "0.5rem" };
const inp = {
  padding: "0.45rem 0.55rem",
  borderRadius: "8px",
  border: `1px solid ${theme.border}`,
  background: "#0b0f14",
  color: theme.text,
  font: "inherit",
  fontSize: "0.88rem",
};
const btnPrimary = {
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  border: "none",
  background: "linear-gradient(180deg, rgba(249,115,22,0.95), rgba(234,88,12,0.95))",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};
const btnGhost = {
  padding: "0.5rem 0.85rem",
  borderRadius: "8px",
  border: `1px solid ${theme.border}`,
  background: "transparent",
  color: theme.text,
  cursor: "pointer",
};
