/**
 * Generowanie HTML: protokół odbioru + tabela TER (jak Excel).
 * Spójne z ter_dokumenty_html.py w księgowości.
 */

const WYKONAWCA_G4 = {
  nazwa: "G4 GEODEZJA sp. z o.o.",
  adres1: "ul. Cienista 2",
  adres2: "31-831 Kraków",
  nip: "NIP: 678-315-92-91",
};

const VAT_STAWKA = 0.23;

function esc(v) {
  if (v == null) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtPln(v) {
  return `${num(v).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
}

function fmtPct(v) {
  return `${num(v).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

function fmtData(v) {
  if (v == null || v === "") return "—";
  const s = String(v).trim();
  if (s.length >= 10 && s[4] === "-" && s[7] === "-") {
    return `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`;
  }
  return s;
}

function cssBase() {
  return `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Calibri, Arial, sans-serif;
      font-size: 11pt;
      color: #111;
      margin: 1.2cm;
      line-height: 1.35;
    }
    h1 { font-size: 16pt; margin: 0 0 0.4rem; text-align: center; }
    h2 { font-size: 12pt; margin: 0 0 0.75rem; text-align: center; font-weight: 600; }
    .meta { margin: 0.35rem 0; }
    .label { font-weight: 700; }
    table.doc {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.85rem;
      font-size: 9.5pt;
    }
    table.doc th, table.doc td {
      border: 1px solid #333;
      padding: 0.28rem 0.35rem;
      vertical-align: top;
    }
    table.doc th { background: #f0f0f0; text-align: center; }
    td.num, th.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    td.ctr { text-align: center; }
    .muted { color: #555; font-size: 9.5pt; }
    .sig {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-top: 2.2rem;
    }
    .sig .box { min-height: 5rem; border-top: 1px solid #333; padding-top: 0.35rem; margin-top: 3rem; }
    .toolbar {
      position: sticky; top: 0; z-index: 5;
      background: #fff8e7; border: 1px solid #e2c36b;
      padding: 0.5rem 0.75rem; margin: -0.5cm -0.5cm 0.8cm;
      display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;
    }
    .toolbar button { font: inherit; padding: 0.35rem 0.75rem; cursor: pointer; }
    @media print {
      .toolbar { display: none !important; }
      body { margin: 0.8cm; }
    }
  `;
}

function toolbarHtml(title) {
  return `<div class="toolbar">
    <strong>${esc(title)}</strong>
    <button type="button" onclick="window.print()">Drukuj / Zapisz jako PDF</button>
    <span class="muted">W oknie druku wybierz „Zapisz jako PDF”.</span>
  </div>`;
}

/**
 * @param {object[]} pozycje
 * @param {object[]} linie
 * @param {object[]} protokoly
 * @param {number|null} protokolId
 */
export function computeTerRows(pozycje, linie, protokoly, protokolId = null) {
  const protById = new Map();
  for (const p of protokoly || []) {
    if (p?.id != null) protById.set(Number(p.id), p);
  }
  let currentNr = null;
  if (protokolId != null && protById.has(Number(protokolId))) {
    currentNr = num(protById.get(Number(protokolId)).nr_kolejny);
  }

  const kByPoz = new Map();
  const lByPoz = new Map();
  const kByLp = new Map();
  const lByLp = new Map();

  for (const lin of linie || []) {
    const wart = num(lin.wartosc_okresu);
    if (wart === 0) continue;
    const pid = lin.protokol_id;
    const prot = pid != null ? protById.get(Number(pid)) : null;
    const nr = prot ? num(prot.nr_kolejny) : 0;

    let bucket;
    if (protokolId == null) bucket = "K";
    else if (pid != null && Number(pid) === Number(protokolId)) bucket = "L";
    else if (currentNr != null && prot && nr < currentNr) bucket = "K";
    else continue;

    const pozId = lin.pozycja_id;
    const lp = String(lin.lp ?? "").trim();
    if (pozId != null) {
      const target = bucket === "L" ? lByPoz : kByPoz;
      target.set(pozId, (target.get(pozId) || 0) + wart);
    } else if (lp) {
      const target = bucket === "L" ? lByLp : kByLp;
      target.set(lp, (target.get(lp) || 0) + wart);
    }
  }

  return (pozycje || []).map((p) => {
    const pozId = p.pozycja_id != null ? p.pozycja_id : p.id;
    const lp = String(p.lp ?? "").trim();
    const g = num(p.wartosc);
    let k = 0;
    let l = 0;
    if (pozId != null) {
      k += kByPoz.get(pozId) || 0;
      l += lByPoz.get(pozId) || 0;
    }
    if (lp) {
      k += kByLp.get(lp) || 0;
      l += lByLp.get(lp) || 0;
    }
    if (protokolId == null) l = 0;
    const m = k + l;
    const n = g - m;
    const o = g > 0 ? (m / g) * 100 : 0;
    return {
      lp: lp || "—",
      opis: p.opis || "",
      jm: p.jm || "",
      ilosc: p.ilosc_umowna,
      cena: p.cena,
      wartosc: g,
      poprzednie: k,
      okres: l,
      od_poczatku: m,
      pozostalo: n,
      postep: o,
    };
  });
}

function sumField(rows, key) {
  return (rows || []).reduce((a, r) => a + num(r[key]), 0);
}

export function buildProtokolHtml({ naglowek, protokol, linie }) {
  const kr = naglowek?.kr || protokol?.kr || "—";
  const numer = protokol?.numer || `${kr}/${protokol?.nr_kolejny ?? "?"}`;
  const nazwa = naglowek?.nazwa_kontraktu || "";
  const klient = naglowek?.klient || "";
  const umowa = naglowek?.nr_umowy || "";
  const dataP = fmtData(protokol?.data_protokolu);
  const okresOd = fmtData(protokol?.okres_od);
  const okresDo = fmtData(protokol?.okres_do);
  const przy = protokol?.przy_udziale || "";

  const lines = (linie || [])
    .filter((lin) => num(lin.wartosc_okresu) !== 0)
    .map((lin) => ({
      lp: lin.lp || "—",
      opis: lin.opis || "—",
      wartosc: num(lin.wartosc_okresu),
    }));
  const suma = lines.reduce((a, r) => a + r.wartosc, 0);
  const vat = suma * VAT_STAWKA;
  const brutto = suma + vat;

  const rowsHtml =
    lines.length === 0
      ? `<tr><td colspan="5" class="muted" style="text-align:center">Brak pozycji z wartością w okresie (kolumna L).</td></tr>`
      : lines
          .map(
            (r) =>
              `<tr><td class="ctr">${esc(r.lp)}</td><td>${esc(r.opis)}</td>` +
              `<td class="num">${esc(fmtPln(r.wartosc))}</td><td></td><td></td></tr>`,
          )
          .join("");

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8"/>
  <title>Protokół odbioru ${esc(numer)}</title>
  <style>${cssBase()}
    @page { size: A4 portrait; margin: 1.2cm; }
  </style>
</head>
<body>
  ${toolbarHtml(`Protokół odbioru ${numer}`)}
  <p class="meta muted">Kontrakt: ${esc(nazwa || "—")} · KR ${esc(kr)}</p>
  <h1>PROTOKÓŁ ODBIORU Nr ${esc(numer)}</h1>
  <p class="meta">Realizacja przedmiotu umowy w okresie: <strong>${esc(okresOd)}</strong> – <strong>${esc(okresDo)}</strong></p>
  <p class="meta">Sporządzony dnia: <strong>${esc(dataP)}</strong></p>
  <p class="meta"><span class="label">Zlecający:</span> ${esc(klient || "—")}</p>
  <p class="meta"><span class="label">Przedstawiciel Zamawiającego:</span> ${esc(przy || "—")}</p>
  <p class="meta"><span class="label">Wykonawca:</span><br/>
    ${esc(WYKONAWCA_G4.nazwa)}<br/>
    ${esc(WYKONAWCA_G4.adres1)}<br/>
    ${esc(WYKONAWCA_G4.adres2)}<br/>
    ${esc(WYKONAWCA_G4.nip)}
  </p>
  <p class="meta"><span class="label">Umowa nr:</span> ${esc(umowa || "—")}</p>
  <p class="muted">Strony potwierdzają wykonanie poniżej wymienionych elementów rozliczeniowych
  w okresie rozliczeniowym, w zakresie i wartościach wskazanych w tabeli.</p>
  <table class="doc">
    <thead>
      <tr>
        <th style="width:3rem">Lp</th>
        <th>Nazwa rodzajów usług / opis</th>
        <th style="width:8rem">Wartość w okresie (NETTO)</th>
        <th style="width:7rem">Jakość</th>
        <th style="width:8rem">Uwagi / zastrzeżenia</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      <tr>
        <td colspan="2" class="label" style="text-align:right">RAZEM NETTO</td>
        <td class="num label">${esc(fmtPln(suma))}</td>
        <td colspan="2"></td>
      </tr>
      <tr>
        <td colspan="2" style="text-align:right">VAT 23%</td>
        <td class="num">${esc(fmtPln(vat))}</td>
        <td colspan="2"></td>
      </tr>
      <tr>
        <td colspan="2" class="label" style="text-align:right">RAZEM BRUTTO</td>
        <td class="num label">${esc(fmtPln(brutto))}</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>
  <div class="sig">
    <div><div class="box">Zlecający / Zamawiający</div></div>
    <div><div class="box">Wykonawca</div></div>
  </div>
</body>
</html>`;
}

export function buildTerHtml({ naglowek, protokol, terRows }) {
  const kr = naglowek?.kr || "—";
  const nazwa = naglowek?.nazwa_kontraktu || "";
  const klient = naglowek?.klient || "";
  let numer = "—";
  let okres = "—";
  if (protokol) {
    numer = protokol.numer || `${kr}/${protokol.nr_kolejny ?? "?"}`;
    okres = `${fmtData(protokol.okres_od)} – ${fmtData(protokol.okres_do)}`;
  }

  const bodyRows =
    (terRows || []).length === 0
      ? `<tr><td colspan="11" class="muted" style="text-align:center">Brak pozycji TER.</td></tr>`
      : terRows
          .map(
            (r) =>
              `<tr>
                <td class="ctr">${esc(r.lp)}</td>
                <td>${esc(r.opis)}</td>
                <td class="ctr">${esc(r.jm || "—")}</td>
                <td class="num">${r.ilosc != null ? esc(r.ilosc) : "—"}</td>
                <td class="num">${r.cena != null ? esc(fmtPln(r.cena)) : "—"}</td>
                <td class="num">${esc(fmtPln(r.wartosc))}</td>
                <td class="num">${esc(fmtPln(r.poprzednie))}</td>
                <td class="num">${esc(fmtPln(r.okres))}</td>
                <td class="num">${esc(fmtPln(r.od_poczatku))}</td>
                <td class="num">${esc(fmtPln(r.pozostalo))}</td>
                <td class="num">${esc(fmtPct(r.postep))}</td>
              </tr>`,
          )
          .join("");

  const keys = ["wartosc", "poprzednie", "okres", "od_poczatku", "pozostalo"];
  function footerRow(label, { vat = false, brutto = false } = {}) {
    const cells = keys
      .map((k) => {
        let base = sumField(terRows, k);
        if (vat) base *= VAT_STAWKA;
        if (brutto) base = sumField(terRows, k) * (1 + VAT_STAWKA);
        return `<td class="num">${esc(fmtPln(base))}</td>`;
      })
      .join("");
    return `<tr><td colspan="5" class="label" style="text-align:right">${esc(label)}</td>${cells}<td></td></tr>`;
  }

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8"/>
  <title>TER KR ${esc(kr)}</title>
  <style>${cssBase()}
    @page { size: A4 landscape; margin: 0.8cm; }
    body { font-size: 9.5pt; }
    table.doc { font-size: 8.5pt; }
  </style>
</head>
<body>
  ${toolbarHtml(`Tabela elementów rozliczeniowych — KR ${kr}`)}
  <h1>TABELA ELEMENTÓW ROZLICZENIOWYCH PRZEDMIOTU UMOWY</h1>
  <h2>KR ${esc(kr)}${nazwa ? esc(` — ${nazwa}`) : ""}</h2>
  <p class="meta"><span class="label">Zleceniodawca:</span> ${esc(klient || "—")}
    &nbsp;·&nbsp; <span class="label">Protokół:</span> ${esc(numer)}
    &nbsp;·&nbsp; <span class="label">Okres:</span> ${esc(okres)}
  </p>
  <table class="doc">
    <thead>
      <tr>
        <th>Lp</th>
        <th>Wyszczególnienie</th>
        <th>Jm</th>
        <th>Ilość</th>
        <th>Cena NETTO</th>
        <th>Wartość NETTO (G)</th>
        <th>Poprzednie (K)</th>
        <th>Okres (L)</th>
        <th>Od początku (M)</th>
        <th>Pozostało (N)</th>
        <th>Postęp % (O)</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
      ${footerRow("RAZEM WARTOŚĆ NETTO")}
      ${footerRow("VAT 23%", { vat: true })}
      ${footerRow("RAZEM WARTOŚĆ BRUTTO", { brutto: true })}
    </tbody>
  </table>
  <p class="muted" style="margin-top:0.75rem">
    K = wartość wg poprzednich protokołów · L = wartość w bieżącym okresie · M = K+L · N = G−M · O = M/G.
    Wykonawca: ${esc(WYKONAWCA_G4.nazwa)}, ${esc(WYKONAWCA_G4.adres1)}, ${esc(WYKONAWCA_G4.adres2)}.
  </p>
</body>
</html>`;
}

export function openHtmlInNewWindow(htmlDoc) {
  const blob = new Blob([htmlDoc], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    URL.revokeObjectURL(url);
    throw new Error("Przeglądarka zablokowała okno — zezwól na wyskakujące okna.");
  }
  // revoke later
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
