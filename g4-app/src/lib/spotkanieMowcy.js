/** Inicjały zespołu (kolizja Monika / Michał Jakubowscy). */
const INICJALY_NR = {
  "023": "DM",
  "000": "Mi",
  "001": "MJ",
  "011": "AH",
  "003": "GF",
};

const ALIASY_NR = {
  "023": ["Damian"],
  "000": ["Michał", "Michal"],
  "001": ["Monika"],
  "011": ["Ania", "Anna"],
  "003": ["Gosia", "Małgorzata", "Malgorzata"],
};

const KOLOR_NR = {
  "023": "#c2410c",
  "000": "#0369a1",
  "001": "#7c3aed",
  "011": "#be185d",
  "003": "#15803d",
};

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizujNrMowcy(nr) {
  return String(nr ?? "").trim();
}

export function inicjalyZNazwy(imieNazwisko, nr) {
  const n = normalizujNrMowcy(nr);
  if (INICJALY_NR[n]) return INICJALY_NR[n];
  const parts = String(imieNazwisko ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase();
  if (parts[0]) return parts[0][0].toUpperCase();
  return "?";
}

export function kolorInicjalow(nr, inicjaly) {
  const n = normalizujNrMowcy(nr);
  if (KOLOR_NR[n]) return KOLOR_NR[n];
  const s = n || String(inicjaly || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const paleta = ["#0f766e", "#a16207", "#1d4ed8", "#9333ea", "#b91c1c", "#047857"];
  return paleta[h % paleta.length];
}

export function tokenyMowcy(p) {
  const nr = normalizujNrMowcy(p?.nr);
  const nazwa = String(p?.imie_nazwisko ?? "").trim();
  const first = nazwa.split(/\s+/).filter(Boolean)[0] || "";
  const ini = inicjalyZNazwy(nazwa, nr);
  return [...new Set([ini, first, ...(ALIASY_NR[nr] || [])].filter(Boolean))];
}

export function dopiszPrefiksMowcy(tresc, mowca) {
  if (!mowca) return tresc;
  const pref = `${inicjalyZNazwy(mowca.imie_nazwisko, mowca.nr)}: `;
  const t = String(tresc ?? "");
  if (!t.trim()) return pref;
  if (/(?:^|\n)[^\n:]{1,16}:\s*$/.test(t)) {
    return t.replace(/(?:^|\n)[^\n:]{1,16}:\s*$/, (m) => (m.startsWith("\n") ? "\n" : "") + pref);
  }
  return `${t.replace(/\s+$/, "")}\n${pref}`;
}

export function zPrefiksemMowcy(tresc, mowca) {
  if (!mowca) return String(tresc ?? "").trim();
  const t = String(tresc ?? "").trim();
  if (!t) return t;
  const ini = inicjalyZNazwy(mowca.imie_nazwisko, mowca.nr);
  if (new RegExp(`^${escapeRe(ini)}\\s*:`, "i").test(t)) return t;
  if (/^[A-ZĄĆĘŁŃÓŚŹŻ][A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]{0,12}\s*:/.test(t)) return t;
  return `${ini}: ${t}`;
}

/**
 * Dzieli notatkę na głosy: „AH: …”, „Ania: …”, „Ania: a; Damian: b”.
 */
export function rozbijNaGlosy(tresc, mowcy = []) {
  const raw = String(tresc ?? "").replace(/\r/g, "").trim();
  if (!raw) return [];
  const mapa = [];
  for (const p of mowcy ?? []) {
    for (const tok of tokenyMowcy(p)) {
      mapa.push({ tok, p, len: tok.length });
    }
  }
  mapa.sort((a, b) => b.len - a.len);
  if (!mapa.length) return [{ inicjaly: null, nazwa: null, nr: null, tresc: raw }];

  const alt = mapa.map((x) => escapeRe(x.tok)).join("|");
  const re = new RegExp(`(?:^|[\\n;]+)\\s*(${alt})\\s*[:;–—-]+\\s*`, "gi");
  const matches = [...raw.matchAll(re)];
  if (!matches.length) return [{ inicjaly: null, nazwa: null, nr: null, tresc: raw }];

  const glosy = [];
  const przed = raw.slice(0, matches[0].index).trim();
  if (przed) glosy.push({ inicjaly: null, nazwa: null, nr: null, tresc: przed });

  for (let i = 0; i < matches.length; i += 1) {
    const m = matches[i];
    const tok = String(m[1] ?? "");
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    const body = raw.slice(start, end).replace(/^[;\s]+|[;\s]+$/g, "").trim();
    const found = mapa.find((x) => x.tok.toLowerCase() === tok.toLowerCase());
    const p = found?.p;
    glosy.push({
      inicjaly: p ? inicjalyZNazwy(p.imie_nazwisko, p.nr) : tok.slice(0, 2).toUpperCase(),
      nazwa: p?.imie_nazwisko || tok,
      nr: p?.nr || null,
      tresc: body,
    });
  }
  return glosy.filter((g) => g.tresc);
}

export function trescProtokoluZGlosow(tresc, mowcy = []) {
  const glosy = rozbijNaGlosy(tresc, mowcy);
  if (!glosy.length) return "";
  if (glosy.length === 1 && !glosy[0].inicjaly) return glosy[0].tresc;
  return glosy.map((g) => `${g.inicjaly ? `${g.inicjaly}: ` : ""}${g.tresc}`).join("\n    ");
}

export function htmlTresciZGlosami(tresc, mowcy, escapeHtml) {
  const esc = typeof escapeHtml === "function" ? escapeHtml : (s) => String(s ?? "");
  const glosy = rozbijNaGlosy(tresc, mowcy);
  if (!glosy.length) return "";
  if (glosy.length === 1 && !glosy[0].inicjaly) return esc(glosy[0].tresc);
  return glosy
    .map((g) => {
      const badge = g.inicjaly
        ? `<span class="ini" style="background:${kolorInicjalow(g.nr, g.inicjaly)}">${esc(g.inicjaly)}</span>`
        : "";
      return `<div class="glos">${badge}${esc(g.tresc)}</div>`;
    })
    .join("");
}
