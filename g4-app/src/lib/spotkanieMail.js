import { etykietaKrZNazwa } from "./czatKrSpotkanie.js";
import {
  inicjalyZNazwy,
  kolorInicjalow,
  rozbijNaGlosy,
  trescProtokoluZGlosow,
} from "./spotkanieMowcy.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizujNr(nr) {
  return String(nr ?? "").trim();
}

function etykietaPracownika(p) {
  const nr = normalizujNr(p?.nr);
  const nazwa = String(p?.imie_nazwisko ?? "").trim() || "—";
  return nr ? `${nr} — ${nazwa}` : nazwa;
}

function formatGodzinaTematu(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function obecniPracownicy(zespol, obecnosc) {
  return (zespol ?? []).filter((p) => obecnosc.has(normalizujNr(p.nr)));
}

export function trescSprawozdaniaTekst({ form, obecnosc, tematy, zadania, zespol, nazwyKr }) {
  const obecni = obecniPracownicy(zespol, obecnosc).map(
    (p) => String(p.imie_nazwisko ?? "").trim() || etykietaPracownika(p),
  );
  const godziny = [form.godzina_od, form.godzina_do].filter(Boolean).join("–");
  const wiersze = sortujWierszeTematow(wierszeTematowTabeli(tematy, zespol), { key: "kr", dir: "asc" });
  const linie = [
    "G4 Geodezja — sprawozdanie ze spotkania kierowników",
    `${String(form.tytul || "Spotkanie kierowników").trim()} · ${form.data || "—"}${godziny ? ` · ${godziny}` : ""}`,
    `Obecni: ${obecni.length ? obecni.join(", ") : "nie zaznaczono"}`,
    "Tematy:",
  ];
  if (!wiersze.length) {
    linie.push("Brak omówionych tematów.");
  } else {
    linie.push("KR | Godzina | Kto | Treść");
    for (const w of wiersze) {
      const tresc = trescProtokoluZGlosow(w.tresc, zespol) || String(w.tresc ?? "").trim();
      linie.push(
        `${etykietaKrZNazwa(w.kr, nazwyKr)} | ${w.godz || "—"} | ${w.kto || "—"} | ${tresc.replace(/\n+/g, " / ")}`,
      );
    }
  }
  if ((zadania ?? []).length) {
    linie.push("Zadania:");
    for (const z of zadania ?? []) {
      const extra = [
        z.kr ? `KR ${etykietaKrZNazwa(z.kr, nazwyKr)}` : "",
        z.osoba_odpowiedzialna ? `dla ${z.osoba_odpowiedzialna}` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      linie.push(`• ${z.zadanie || "—"}${extra ? ` (${extra})` : ""}`);
    }
  }
  return linie.join("\n");
}

function htmlBadge(inicjaly, nr) {
  const ini = escapeHtml(String(inicjaly || "?").slice(0, 2));
  const bg = kolorInicjalow(nr, ini);
  return `<span style="display:inline-block;min-width:22px;height:22px;line-height:22px;border-radius:11px;background:${bg};color:#ffffff;font-size:10px;font-weight:700;text-align:center;padding:0 5px;margin:0 6px 0 0;font-family:Calibri,Arial,sans-serif;vertical-align:middle;">${ini}</span>`;
}

function htmlGlosow(tresc, zespol) {
  const glosy = rozbijNaGlosy(tresc, zespol);
  if (!glosy.length) return escapeHtml(tresc);
  if (glosy.length === 1 && !glosy[0].inicjaly) return escapeHtml(glosy[0].tresc);
  return glosy
    .map((g) => {
      const badge = g.inicjaly ? htmlBadge(g.inicjaly, g.nr) : "";
      return `<div style="margin:0 0 3px 0;line-height:1.3;">${badge}<span>${escapeHtml(g.tresc)}</span></div>`;
    })
    .join("");
}

function mowcyUnikalniZTresci(tresc, zespol) {
  const seen = new Set();
  const out = [];
  for (const g of rozbijNaGlosy(tresc, zespol)) {
    if (!g.inicjaly) continue;
    const k = `${normalizujNr(g.nr)}|${g.inicjaly}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(g);
  }
  return out;
}

export function wierszeTematowTabeli(tematy = [], zespol = []) {
  return (tematy ?? []).map((t, i) => {
    const mowcy = mowcyUnikalniZTresci(t.tresc, zespol);
    return {
      _idx: t._idx ?? i,
      id: t.id,
      kr: String(t.kr ?? "").trim() || "—",
      godzina: t.godzina || null,
      godz: formatGodzinaTematu(t.godzina),
      kto: mowcy.map((g) => g.inicjaly).join(" "),
      mowcy,
      tresc: t.tresc,
      temat: t,
    };
  });
}

export function sortujWierszeTematow(wiersze, sort = { key: "kr", dir: "asc" }) {
  const key = sort?.key || "kr";
  const dir = sort?.dir === "desc" ? "desc" : "asc";
  const m = dir === "desc" ? -1 : 1;
  return [...(wiersze ?? [])].sort((a, b) => {
    let cmp = 0;
    if (key === "kr") cmp = String(a.kr).localeCompare(String(b.kr), "pl", { numeric: true });
    else if (key === "godz") cmp = new Date(a.godzina || 0).getTime() - new Date(b.godzina || 0).getTime();
    else if (key === "kto") cmp = String(a.kto || "").localeCompare(String(b.kto || ""), "pl");
    else cmp = String(a.tresc || "").localeCompare(String(b.tresc || ""), "pl");
    if (cmp === 0) {
      const t = new Date(a.godzina || 0).getTime() - new Date(b.godzina || 0).getTime();
      if (t !== 0) return t;
      return String(a.kr).localeCompare(String(b.kr), "pl", { numeric: true });
    }
    return cmp * m;
  });
}

function htmlKtoBadges(mowcy) {
  if (!mowcy?.length) return "&nbsp;";
  return mowcy.map((g) => htmlBadge(g.inicjaly, g.nr)).join("");
}

const TH_MAIL =
  "text-align:left;background:#fff7ed;color:#9a3412;font-size:12px;font-weight:700;padding:6px 8px;border:1px solid #fed7aa;white-space:nowrap;";
const TD_MAIL = "vertical-align:top;padding:6px 8px;border:1px solid #fed7aa;font-size:13px;";

export function htmlTabeliTematowMail({ tematy, zespol, nazwyKr }) {
  const wiersze = sortujWierszeTematow(wierszeTematowTabeli(tematy, zespol), { key: "kr", dir: "asc" });
  if (!wiersze.length) {
    return `<p style="margin:0;">Brak omówionych tematów.</p>`;
  }
  const rows = wiersze
    .map((w, i) => {
      const bg = i % 2 ? "#fffbeb" : "#ffffff";
      return `<tr style="background:${bg};">
        <td style="${TD_MAIL}font-weight:700;color:#c2410c;">${escapeHtml(etykietaKrZNazwa(w.kr, nazwyKr))}</td>
        <td style="${TD_MAIL}color:#64748b;font-weight:700;white-space:nowrap;font-variant-numeric:tabular-nums;">${escapeHtml(
          w.godz || "—",
        )}</td>
        <td style="${TD_MAIL}white-space:nowrap;">${htmlKtoBadges(w.mowcy)}</td>
        <td style="${TD_MAIL}">${htmlGlosow(w.tresc, zespol)}</td>
      </tr>`;
    })
    .join("");
  return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;font-family:Calibri,Arial,sans-serif;">
    <thead>
      <tr>
        <th style="${TH_MAIL}">KR</th>
        <th style="${TH_MAIL}">Godzina</th>
        <th style="${TH_MAIL}">Kto</th>
        <th style="${TH_MAIL}">Treść</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function htmlTabeliZadanMail(zadania, nazwyKr) {
  if (!(zadania ?? []).length) return "";
  const rows = (zadania ?? [])
    .map((z, i) => {
      const bg = i % 2 ? "#fffbeb" : "#ffffff";
      return `<tr style="background:${bg};">
        <td style="${TD_MAIL}font-weight:700;color:#c2410c;">${escapeHtml(etykietaKrZNazwa(z.kr, nazwyKr))}</td>
        <td style="${TD_MAIL}white-space:nowrap;">${escapeHtml(z.osoba_odpowiedzialna || "—")}</td>
        <td style="${TD_MAIL}">${escapeHtml(z.zadanie || "—")}</td>
      </tr>`;
    })
    .join("");
  return `<p style="margin:12px 0 4px;font-weight:700;font-size:14px;">Zadania</p>
  <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;font-family:Calibri,Arial,sans-serif;">
    <thead>
      <tr>
        <th style="${TH_MAIL}">KR</th>
        <th style="${TH_MAIL}">Dla</th>
        <th style="${TH_MAIL}">Zadanie</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function htmlSprawozdaniaMail({ form, obecnosc, tematy, zadania, zespol, nazwyKr }) {
  const obecni = obecniPracownicy(zespol, obecnosc);
  const godziny = [form.godzina_od, form.godzina_do].filter(Boolean).join("–");
  const obecniHtml = obecni.length
    ? obecni
        .map((p) => {
          const nazwa = escapeHtml(String(p.imie_nazwisko ?? "").trim() || etykietaPracownika(p));
          const ini = inicjalyZNazwy(p.imie_nazwisko, p.nr);
          return `<span style="display:inline-block;margin:0 10px 4px 0;white-space:nowrap;">${htmlBadge(ini, p.nr)}${nazwa}</span>`;
        })
        .join("")
    : "<span>Nie zaznaczono obecnych.</span>";
  return `<div style="font-family:Calibri,Arial,sans-serif;font-size:14px;line-height:1.35;color:#111827;">
<p style="margin:0 0 2px;font-size:16px;font-weight:700;">G4 Geodezja — sprawozdanie ze spotkania kierowników</p>
<p style="margin:0 0 10px;color:#475569;">${escapeHtml(form.tytul || "Spotkanie kierowników")} · ${escapeHtml(
    form.data || "—",
  )}${godziny ? ` · ${escapeHtml(godziny)}` : ""}</p>
<p style="margin:0 0 4px;font-weight:700;font-size:14px;">Obecni</p>
<p style="margin:0 0 8px;">${obecniHtml}</p>
<p style="margin:0 0 6px;font-weight:700;font-size:14px;">Omówione tematy</p>
${htmlTabeliTematowMail({ tematy, zespol, nazwyKr })}
${htmlTabeliZadanMail(zadania, nazwyKr)}
</div>`;
}

export function emaileObecnych(zespol, obecnosc) {
  const zMailem = [];
  const bezMaila = [];
  const seen = new Set();
  for (const p of obecniPracownicy(zespol, obecnosc)) {
    const mail = String(p.email ?? "").trim();
    const nazwa = String(p.imie_nazwisko ?? "").trim() || etykietaPracownika(p);
    if (!mail || !mail.includes("@")) {
      bezMaila.push(nazwa);
      continue;
    }
    const key = mail.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    zMailem.push(mail);
  }
  return { zMailem, bezMaila };
}

function kopiujHtmlDoSchowka(html, tekst) {
  const onCopy = (e) => {
    e.clipboardData.setData("text/html", html);
    e.clipboardData.setData("text/plain", tekst);
    e.preventDefault();
  };
  try {
    document.addEventListener("copy", onCopy);
    const ok = document.execCommand("copy");
    document.removeEventListener("copy", onCopy);
    if (ok) return true;
  } catch {
    document.removeEventListener("copy", onCopy);
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = String(tekst ?? "");
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    return true;
  } catch {
    return false;
  }
}

/** Otwiera lokalny Outlook / domyślną pocztę (mailto) w tym samym kliknięciu — bez await. */
function otworzMailto(url) {
  window.location.href = url;
}

/**
 * Od razu po kliknięciu otwiera Outlook (domyślny program pocztowy).
 * Nie używać await przed wywołaniem — przeglądarka zablokuje okno.
 */
export function wyslijMailSprawozdania({ form, obecnosc, tematy, zadania, zespol, nazwyKr }) {
  const { zMailem, bezMaila } = emaileObecnych(zespol, obecnosc);
  const temat = `${form.tytul || "Spotkanie kierowników"} — ${form.data || ""}`.replace(/\s+—\s+$/, "").trim();
  const plain = trescSprawozdaniaTekst({ form, obecnosc, tematy, zadania, zespol, nazwyKr });
  const html = htmlSprawozdaniaMail({ form, obecnosc, tematy, zadania, zespol, nazwyKr });
  kopiujHtmlDoSchowka(html, plain);
  const to = zMailem.join(",");
  const mailto = `mailto:${to}?subject=${encodeURIComponent(temat)}&body=${encodeURIComponent(
    "Dzień dobry,\n\n",
  )}`;
  otworzMailto(mailto);
  let info = to
    ? `Otwarto Outlook do ${zMailem.length} ${zMailem.length === 1 ? "osoby" : "osób"}.`
    : "Otwarto Outlook — uzupełnij adresy, bo w kartotece brak e-maili zespołu.";
  if (bezMaila.length) info += ` Bez e-maila: ${bezMaila.join(", ")}.`;
  info += " W treści wklej Ctrl+V — ikonki kto mówił, bez dużych przerw.";
  return { ok: true, msg: info };
}
