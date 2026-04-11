/**
 * Święta i dni wolne w PL (do kalendarza czasu pracy).
 * Uwzględnia stałe daty oraz ruchome: Wielkanoc, Poniedziałek wielkanocny,
 * Zielone Świątki (niedziela), Boże Ciało (+60 od niedzieli wielkanocnej).
 */

function niedzielaWielkanocna(y) {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}

function addDays(d, n) {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
}

function kluczIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const cacheSwiat = new Map();

/**
 * Mapa YYYY-MM-DD → nazwa święta (dla danego roku).
 */
function mapaSwiatRocznych(rok) {
  if (cacheSwiat.has(rok)) return cacheSwiat.get(rok);
  const m = new Map();
  const dodaj = (d, nazwa) => {
    m.set(kluczIso(d), nazwa);
  };

  dodaj(new Date(rok, 0, 1), "Nowy Rok");
  dodaj(new Date(rok, 0, 6), "Święto Trzech Króli");
  dodaj(new Date(rok, 4, 1), "Święto Pracy");
  dodaj(new Date(rok, 4, 3), "Święto Konstytucji 3 Maja");
  dodaj(new Date(rok, 7, 15), "Wniebowzięcie NMP");
  dodaj(new Date(rok, 10, 1), "Wszystkich Świętych");
  dodaj(new Date(rok, 10, 11), "Narodowe Święto Niepodległości");
  dodaj(new Date(rok, 11, 25), "Boże Narodzenie (pierwszy dzień)");
  dodaj(new Date(rok, 11, 26), "Boże Narodzenie (drugi dzień)");

  const nw = niedzielaWielkanocna(rok);
  dodaj(nw, "Wielkanoc");
  dodaj(addDays(nw, 1), "Poniedziałek Wielkanocny");
  dodaj(addDays(nw, 49), "Zielone Świątki");
  dodaj(addDays(nw, 60), "Boże Ciało");

  cacheSwiat.set(rok, m);
  return m;
}

/**
 * @param {Date} date — lokalna data (bez czasu strefy)
 * @returns {{ weekend: boolean, swieto: boolean, nazwaSwieta: string | null }}
 */
export function infoDniaKalendarzaPl(date) {
  const wd = date.getDay();
  const weekend = wd === 0 || wd === 6;
  const mapa = mapaSwiatRocznych(date.getFullYear());
  const k = kluczIso(date);
  const nazwa = mapa.get(k) ?? null;
  return {
    weekend,
    swieto: nazwa != null,
    nazwaSwieta: nazwa,
  };
}

/** Czy wg kalendarza to typowy „dzień roboczy” (bez weekendu i świąt). */
export function czyDzienRoboczyPl(date) {
  const i = infoDniaKalendarzaPl(date);
  return !i.weekend && !i.swieto;
}

/**
 * Liczba dni roboczych w miesiącu kalendarzowym (PL: bez sob/niedz i bez świąt).
 * @param {number} rok
 * @param {number} miesiacIndex0 — 0 = styczeń
 */
export function liczDniRoboczeWMiesiacu(rok, miesiacIndex0) {
  const ostatni = new Date(rok, miesiacIndex0 + 1, 0).getDate();
  let n = 0;
  for (let d = 1; d <= ostatni; d++) {
    const dt = new Date(rok, miesiacIndex0, d);
    if (czyDzienRoboczyPl(dt)) n++;
  }
  return n;
}

/**
 * Typowa norma godzin w miesiącu: dni robocze × godzin na dzień (domyślnie 8).
 */
export function normaGodzinMiesiaca(rok, miesiacIndex0, godzinNaDzienRoboczy = 8) {
  return liczDniRoboczeWMiesiacu(rok, miesiacIndex0) * godzinNaDzienRoboczy;
}
