/**
 * Eksport budżetu KR do CSV (Excel otwiera po dwukliku; separator `;`, BOM UTF-8).
 */

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  if (/[;"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatPlnCsv(n) {
  if (n == null || !Number.isFinite(Number(n))) return "";
  return String(Math.round(Number(n) * 100) / 100).replace(".", ",");
}

/**
 * @param {{
 *   kr: string,
 *   budzetBrutto: number,
 *   sumaKosztPracy: number,
 *   sumaFakturBrutto: number,
 *   godzinyPracy: number,
 *   kosztyPracownicze: Array<{ nr: string, etykieta: string, godziny: number, koszt: number | null, bezStawkiH: number }>,
 *   fakturyWgTypu: Array<{ typ: string, suma: number, rows: Array<object> }>,
 * }} data
 */
export function zbudujBudzetKrCsv(data) {
  const lines = [];
  const push = (cols) => lines.push(cols.map(csvEscape).join(";"));

  push(["Budżet projektu KR", data.kr]);
  push(["Budżet brutto (wpisany)", formatPlnCsv(data.budzetBrutto)]);
  push(["Koszty pracownicze (PLN)", formatPlnCsv(data.sumaKosztPracy)]);
  push(["Roboczogodziny", String(data.godzinyPracy.toFixed(2)).replace(".", ",")]);
  push(["Faktury kosztowe brutto", formatPlnCsv(data.sumaFakturBrutto)]);
  push([
    "Razem koszty (praca + faktury)",
    formatPlnCsv((Number(data.sumaKosztPracy) || 0) + (Number(data.sumaFakturBrutto) || 0)),
  ]);
  push([]);

  push(["KOSZTY PRACOWNICZE"]);
  push(["Nr", "Pracownik", "Roboczogodziny", "Koszt PLN", "Godziny bez stawki"]);
  for (const r of data.kosztyPracownicze) {
    push([
      r.nr,
      r.etykieta,
      String(Number(r.godziny).toFixed(2)).replace(".", ","),
      formatPlnCsv(r.koszt),
      r.bezStawkiH > 0 ? String(Number(r.bezStawkiH).toFixed(2)).replace(".", ",") : "",
    ]);
  }
  push([]);

  push(["FAKTURY KOSZTOWE WG TYPÓW"]);
  push(["Typ", "Data", "Sprzedawca", "Nr faktury", "Netto", "VAT", "Brutto"]);
  for (const g of data.fakturyWgTypu) {
    push([g.typ, "", "", "", "", "", formatPlnCsv(g.suma)]);
    for (const row of g.rows) {
      push([
        "",
        row.data_faktury || "",
        row.sprzedawca_nazwa || "",
        row.numer_faktury || "",
        formatPlnCsv(row.kwota_netto),
        formatPlnCsv(row.kwota_vat),
        formatPlnCsv(row.kwota_brutto),
      ]);
    }
  }

  return `\uFEFF${lines.join("\r\n")}`;
}

export function pobierzBudzetKrCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
