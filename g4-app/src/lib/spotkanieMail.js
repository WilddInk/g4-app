import { zestawienieTematowPoKr } from "./czatKrSpotkanie.js";
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

export function trescSprawozdaniaTekst({ form, obecnosc, tematy, zadania, zespol }) {
  const obecni = obecniPracownicy(zespol, obecnosc).map(
    (p) => String(p.imie_nazwisko ?? "").trim() || etykietaPracownika(p),
  );
  const godziny = [form.godzina_od, form.godzina_do].filter(Boolean).join("–");
  const grupy = zestawienieTematowPoKr(tematy);
  const linie = [
    "G4 Geodezja — sprawozdanie ze spotkania kierowników",
    `${String(form.tytul || "Spotkanie kierowników").trim()} · ${form.data || "—"}${godziny ? ` · ${godziny}` : ""}`,
    `Obecni: ${obecni.length ? obecni.join(", ") : "nie zaznaczono"}`,
    "Tematy:",
  ];
  if (!grupy.length) {
    linie.push("Brak omówionych tematów.");
  } else {
    for (const g of grupy) {
      linie.push(`KR ${g.kr}`);
      for (const t of g.tematy ?? []) {
        const godz = formatGodzinaTematu(t.godzina);
        const tresc = trescProtokoluZGlosow(t.tresc, zespol) || String(t.tresc ?? "").trim();
        linie.push(`${godz ? `${godz} ` : ""}${tresc.replace(/\n+/g, " | ")}`);
      }
    }
  }
  if ((zadania ?? []).length) {
    linie.push("Zadania:");
    for (const z of zadania ?? []) {
      const extra = [
        z.kr ? `KR ${z.kr}` : "",
        z.osoba_odpowiedzialna ? `dla ${z.osoba_odpowiedzialna}` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      linie.push(`• ${z.zadanie || "—"}${extra ? ` (${extra})` : ""}`);
    }
  }
  const prot = String(form.protokol ?? "").trim();
  if (prot) linie.push("Protokół:", prot.replace(/\n{3,}/g, "\n"));
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

export function htmlSprawozdaniaMail({ form, obecnosc, tematy, zadania, zespol }) {
  const obecni = obecniPracownicy(zespol, obecnosc);
  const godziny = [form.godzina_od, form.godzina_do].filter(Boolean).join("–");
  const grupy = zestawienieTematowPoKr(tematy);
  const obecniHtml = obecni.length
    ? obecni
        .map((p) => {
          const nazwa = escapeHtml(String(p.imie_nazwisko ?? "").trim() || etykietaPracownika(p));
          const ini = inicjalyZNazwy(p.imie_nazwisko, p.nr);
          return `<span style="display:inline-block;margin:0 10px 4px 0;white-space:nowrap;">${htmlBadge(ini, p.nr)}${nazwa}</span>`;
        })
        .join("")
    : "<span>Nie zaznaczono obecnych.</span>";
  let tematyHtml = `<p style="margin:0;">Brak omówionych tematów.</p>`;
  if (grupy.length) {
    tematyHtml = grupy
      .map((g) => {
        const wiersze = (g.tematy ?? [])
          .map((t) => {
            const godz = escapeHtml(formatGodzinaTematu(t.godzina) || "");
            return `<tr>
              <td style="width:44px;vertical-align:top;color:#64748b;font-weight:700;padding:2px 8px 4px 0;white-space:nowrap;font-variant-numeric:tabular-nums;">${godz}</td>
              <td style="vertical-align:top;padding:2px 0 4px 0;">${htmlGlosow(t.tresc, zespol)}</td>
            </tr>`;
          })
          .join("");
        return `<p style="margin:10px 0 4px;font-weight:700;color:#c2410c;font-size:14px;">KR ${escapeHtml(g.kr)}</p>
          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">${wiersze}</table>`;
      })
      .join("");
  }
  let zadaniaHtml = "";
  if ((zadania ?? []).length) {
    const li = (zadania ?? [])
      .map((z) => {
        const extra = [z.kr ? `KR ${z.kr}` : "", z.osoba_odpowiedzialna ? `dla ${z.osoba_odpowiedzialna}` : ""]
          .filter(Boolean)
          .join(" · ");
        return `<li style="margin:0 0 3px 0;">${escapeHtml(z.zadanie || "—")}${
          extra ? ` <span style="color:#64748b;">(${escapeHtml(extra)})</span>` : ""
        }</li>`;
      })
      .join("");
    zadaniaHtml = `<p style="margin:12px 0 4px;font-weight:700;font-size:14px;">Zadania</p><ul style="margin:0;padding-left:18px;">${li}</ul>`;
  }
  return `<div style="font-family:Calibri,Arial,sans-serif;font-size:14px;line-height:1.35;color:#111827;">
<p style="margin:0 0 2px;font-size:16px;font-weight:700;">G4 Geodezja — sprawozdanie ze spotkania kierowników</p>
<p style="margin:0 0 10px;color:#475569;">${escapeHtml(form.tytul || "Spotkanie kierowników")} · ${escapeHtml(
    form.data || "—",
  )}${godziny ? ` · ${escapeHtml(godziny)}` : ""}</p>
<p style="margin:0 0 4px;font-weight:700;font-size:14px;">Obecni</p>
<p style="margin:0 0 8px;">${obecniHtml}</p>
<p style="margin:0 0 2px;font-weight:700;font-size:14px;">Omówione tematy</p>
${tematyHtml}
${zadaniaHtml}
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
export function wyslijMailSprawozdania({ form, obecnosc, tematy, zadania, zespol }) {
  const { zMailem, bezMaila } = emaileObecnych(zespol, obecnosc);
  const temat = `${form.tytul || "Spotkanie kierowników"} — ${form.data || ""}`.replace(/\s+—\s+$/, "").trim();
  const plain = trescSprawozdaniaTekst({ form, obecnosc, tematy, zadania, zespol });
  const html = htmlSprawozdaniaMail({ form, obecnosc, tematy, zadania, zespol });
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
