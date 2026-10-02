import { zestawienieTematowPoKr } from "./czatKrSpotkanie.js";
import { trescProtokoluZGlosow } from "./spotkanieMowcy.js";

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
  const godziny = [form.godzina_od, form.godzina_do].filter(Boolean).join(" – ");
  const grupy = zestawienieTematowPoKr(tematy);
  const linie = [
    "G4 Geodezja — sprawozdanie ze spotkania kierowników",
    String(form.tytul || "Spotkanie kierowników").trim(),
    `Data: ${form.data || "—"}${godziny ? ` · Godzina: ${godziny}` : ""}`,
    "",
    "Lista obecnych",
    obecni.length ? obecni.map((n) => `• ${n}`).join("\n") : "Nie zaznaczono obecnych.",
    "",
    "Omówione tematy",
  ];
  if (!grupy.length) {
    linie.push("Brak omówionych tematów.");
  } else {
    for (const g of grupy) {
      linie.push(`KR ${g.kr}`);
      for (const t of g.tematy ?? []) {
        const godz = formatGodzinaTematu(t.godzina);
        const tresc = trescProtokoluZGlosow(t.tresc, zespol) || String(t.tresc ?? "").trim();
        linie.push(`  ${godz ? `${godz} ` : ""}${tresc}`);
      }
    }
  }
  linie.push("", "Zadania");
  if (!(zadania ?? []).length) {
    linie.push("Brak zadań z tego spotkania.");
  } else {
    for (const z of zadania ?? []) {
      const extra = [
        z.kr ? `KR ${z.kr}` : "",
        z.osoba_odpowiedzialna ? `dla ${z.osoba_odpowiedzialna}` : "",
        String(z.status ?? "").trim(),
      ]
        .filter(Boolean)
        .join(" · ");
      linie.push(`• ${z.zadanie || "—"}${extra ? ` (${extra})` : ""}`);
    }
  }
  const prot = String(form.protokol ?? "").trim();
  if (prot) linie.push("", "Protokół", prot);
  linie.push("", `Wysłane z G4 · ${new Date().toLocaleString("pl-PL")}`);
  return linie.join("\n");
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

export async function wyslijMailSprawozdania({ form, obecnosc, tematy, zadania, zespol }) {
  const { zMailem, bezMaila } = emaileObecnych(zespol, obecnosc);
  if (!zMailem.length) {
    alert(
      bezMaila.length
        ? `Brak adresów e-mail u zaznaczonych obecnych:\n${bezMaila.join(", ")}\n\nUzupełnij e-mail w kartotece pracowników.`
        : "Zaznacz obecnych na liście, potem wyślij mail.",
    );
    return { ok: false, msg: null };
  }
  const temat = `${form.tytul || "Spotkanie kierowników"} — ${form.data || ""}`.replace(/\s+—\s+$/, "").trim();
  const body = trescSprawozdaniaTekst({ form, obecnosc, tematy, zadania, zespol });
  const to = zMailem.join(",");
  const mailtoPelny = `mailto:${to}?subject=${encodeURIComponent(temat)}&body=${encodeURIComponent(body)}`;
  const zaDlugi = mailtoPelny.length > 1800;
  if (zaDlugi) {
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      /* schowek może być zablokowany */
    }
    const skrot = `Dzień dobry,\n\nwklejam sprawozdanie ze spotkania kierowników ${form.data || ""} (Ctrl+V — treść jest w schowku).\n\nPozdrawiam`;
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(temat)}&body=${encodeURIComponent(skrot)}`;
  } else {
    window.location.href = mailtoPelny;
  }
  let info = `Otworzono pocztę do ${zMailem.length} ${zMailem.length === 1 ? "osoby" : "osób"}.`;
  if (bezMaila.length) info += ` Bez e-maila: ${bezMaila.join(", ")}.`;
  if (zaDlugi) info += " Treść skopiowano do schowka — wklej w mailu (Ctrl+V).";
  return { ok: true, msg: info };
}
