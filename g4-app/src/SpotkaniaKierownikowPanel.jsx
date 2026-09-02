import { useCallback, useEffect, useMemo, useState } from "react";
import {
  isoZDatyIGodziny,
  polaDatyGodzinyZIso,
  pobierzWpisyZakresu,
  wpisyNaTematy,
  zlozProtokolSpotkania,
  zestawienieTematowPoKr,
} from "./lib/czatKrSpotkanie.js";
import { CZAT_KR_TEAM_NR, zbudujZespolCzatKr } from "./CzatKrPanel.jsx";

const LIGHT = {
  panelBg: "linear-gradient(180deg, #fff7ed 0%, #fffbeb 45%, #ffffff 100%)",
  panelBorder: "1px solid #fdba74",
  text: "#0f172a",
  muted: "#475569",
  soft: "#64748b",
  accent: "#c2410c",
  accentSoft: "#ffedd5",
  cardBg: "#ffffff",
  cardBorder: "1px solid #e2e8f0",
  inputBorder: "1px solid #cbd5e1",
  dangerBg: "#fef2f2",
  dangerBorder: "1px solid #fecaca",
  dangerText: "#991b1b",
  ok: "#166534",
};

const SQL_PATH = "g4-app/supabase/spotkania-kierownikow.sql";

function normalizujNr(nr) {
  return String(nr ?? "").trim();
}

function dzisYmd() {
  return polaDatyGodzinyZIso().data;
}

function nowySzkic() {
  const teraz = polaDatyGodzinyZIso();
  const czteryGodzinyTemu = polaDatyGodzinyZIso(new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString());
  return {
    id: null,
    data: teraz.data,
    godzina_od: czteryGodzinyTemu.godzina,
    godzina_do: teraz.godzina,
    tytul: "Spotkanie kierowników",
    protokol: "",
  };
}

function etykietaPracownika(p) {
  const nr = normalizujNr(p?.nr);
  const nazwa = String(p?.imie_nazwisko ?? "").trim() || "—";
  return nr ? `${nr} — ${nazwa}` : nazwa;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function czyBrakTabeli(error) {
  const m = String(error?.message ?? "");
  return /spotkanie_kierownikow|schema cache|PGRST205|does not exist/i.test(m) || error?.code === "PGRST205";
}

function drukujSpotkanie({ form, obecnosc, tematy, zadania, zespol }) {
  const obecni = (zespol ?? [])
    .filter((p) => obecnosc.has(normalizujNr(p.nr)))
    .map((p) => String(p.imie_nazwisko ?? "").trim() || etykietaPracownika(p));
  const grupy = zestawienieTematowPoKr(tematy);
  const godziny = [form.godzina_od, form.godzina_do].filter(Boolean).join(" – ");
  const tematyHtml = grupy.length
    ? grupy
        .map((g) => {
          const punkty = (g.tematy ?? [])
            .map((t) => {
              const godz = formatGodzinaTematu(t.godzina);
              return `<li>${godz ? `<span class="godz">${escapeHtml(godz)}</span> ` : ""}${escapeHtml(t.tresc)}</li>`;
            })
            .join("");
          return `<h3>KR ${escapeHtml(g.kr)}</h3><ul>${punkty}</ul>`;
        })
        .join("")
    : "<p>Brak omówionych tematów.</p>";
  const zadaniaHtml = (zadania ?? []).length
    ? `<ul>${(zadania ?? [])
        .map((z) => {
          const kr = String(z.kr ?? "").trim();
          const kto = String(z.osoba_odpowiedzialna ?? "").trim();
          const status = String(z.status ?? "").trim();
          const extra = [kr ? `KR ${kr}` : "", kto ? `dla ${kto}` : "", status].filter(Boolean).join(" · ");
          return `<li><strong>${escapeHtml(z.zadanie || "—")}</strong>${extra ? ` <span class="meta">(${escapeHtml(extra)})</span>` : ""}</li>`;
        })
        .join("")}</ul>`
    : "<p>Brak zadań z tego spotkania.</p>";
  const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <title>Spotkanie kierowników ${escapeHtml(form.data || "")}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; color: #111; margin: 1.6cm; line-height: 1.45; }
    h1 { font-size: 1.35rem; margin: 0 0 0.2rem; }
    h2 { font-size: 1.05rem; margin: 1.2rem 0 0.4rem; border-bottom: 1px solid #ccc; padding-bottom: 0.2rem; }
    h3 { font-size: 0.98rem; margin: 0.7rem 0 0.25rem; }
    .meta { color: #444; font-size: 0.92rem; }
    .godz { font-weight: 700; font-variant-numeric: tabular-nums; }
    ul { margin: 0.2rem 0 0.4rem 1.2rem; padding: 0; }
    li { margin: 0.15rem 0; }
    .protokol { white-space: pre-wrap; font-family: ui-monospace, Consolas, monospace; font-size: 0.86rem; }
    .stopka { margin-top: 1.6rem; font-size: 0.78rem; color: #666; }
    @media print { body { margin: 1.1cm; } }
  </style>
</head>
<body>
  <h1>G4 Geodezja — Spotkanie kierowników</h1>
  <p class="meta">
    ${escapeHtml(form.tytul || "Spotkanie kierowników")}<br />
    Data: <strong>${escapeHtml(form.data || "—")}</strong>
    ${godziny ? ` · Godzina: <strong>${escapeHtml(godziny)}</strong>` : ""}
  </p>
  <h2>Lista obecnych</h2>
  ${obecni.length ? `<ul>${obecni.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>` : "<p>Nie zaznaczono obecnych.</p>"}
  <h2>Zestawienie omówionych tematów</h2>
  ${tematyHtml}
  <h2>Zadania</h2>
  ${zadaniaHtml}
  ${
    String(form.protokol ?? "").trim()
      ? `<h2>Protokół</h2><div class="protokol">${escapeHtml(form.protokol)}</div>`
      : ""
  }
  <p class="stopka">Wydruk z G4 · ${escapeHtml(new Date().toLocaleString("pl-PL"))}</p>
</body>
</html>`;
  const w = window.open("", "_blank");
  if (!w) {
    alert("Przeglądarka zablokowała okno wydruku. Zezwól na wyskakujące okna.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    try {
      w.print();
    } catch {
      /* użytkownik wydrukuje ręcznie */
    }
  }, 250);
}

export function SpotkaniaKierownikowPanel({
  supabase,
  pracownicy = [],
  krList = [],
  autorNazwa,
  autorEmail,
  autorNr,
  czyMozeEdytowac,
  onOtworzCzatKr,
}) {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brakTabeli, setBrakTabeli] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState(() => nowySzkic());
  const [obecnosc, setObecnosc] = useState(() => new Set());
  const [tematy, setTematy] = useState([]);
  const [zadania, setZadania] = useState([]);
  const [nowyTematKr, setNowyTematKr] = useState("");
  const [nowyTematTresc, setNowyTematTresc] = useState("");
  const [nowyTematGodzina, setNowyTematGodzina] = useState(() => polaDatyGodzinyZIso().godzina);
  const [zadanieTytul, setZadanieTytul] = useState("");
  const [zadanieDlaNr, setZadanieDlaNr] = useState("");
  const [zadanieKr, setZadanieKr] = useState("");
  const [busy, setBusy] = useState(false);

  const zespol = useMemo(() => zbudujZespolCzatKr(pracownicy), [pracownicy]);
  const zespolRdzen = useMemo(
    () => zespol.filter((p) => CZAT_KR_TEAM_NR.includes(normalizujNr(p.nr))),
    [zespol],
  );
  const kodyKr = useMemo(() => {
    const set = new Set();
    for (const row of krList ?? []) {
      const k = String(row?.kr ?? row ?? "").trim();
      if (k) set.add(k);
    }
    for (const t of tematy) {
      const k = String(t.kr ?? "").trim();
      if (k) set.add(k);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "pl", { numeric: true }));
  }, [krList, tematy]);

  useEffect(() => {
    if (zadanieDlaNr) return;
    const first = zespolRdzen[0] || zespol[0];
    if (first) setZadanieDlaNr(normalizujNr(first.nr));
  }, [zespol, zespolRdzen, zadanieDlaNr]);

  const ustawDomyslnaObecnosc = useCallback(
    (zaznaczeniNr) => {
      if (zaznaczeniNr?.length) {
        setObecnosc(new Set(zaznaczeniNr.map(normalizujNr).filter(Boolean)));
        return;
      }
      const domyslni = zespolRdzen.length ? zespolRdzen : zespol.slice(0, 5);
      setObecnosc(new Set(domyslni.map((p) => normalizujNr(p.nr)).filter(Boolean)));
    },
    [zespol, zespolRdzen],
  );

  useEffect(() => {
    if (form.id) return;
    ustawDomyslnaObecnosc();
  }, [form.id, ustawDomyslnaObecnosc]);

  const fetchLista = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("spotkanie_kierownikow")
      .select("id, data, godzina_od, godzina_do, tytul, created_at")
      .order("data", { ascending: false })
      .order("id", { ascending: false })
      .limit(80);
    setLoading(false);
    if (error) {
      if (czyBrakTabeli(error)) {
        setBrakTabeli(true);
        setLista([]);
        return;
      }
      setErr(error.message);
      return;
    }
    setBrakTabeli(false);
    setLista(data ?? []);
  }, [supabase]);

  useEffect(() => {
    void fetchLista();
  }, [fetchLista]);

  function resetSzkic() {
    setForm(nowySzkic());
    setTematy([]);
    setZadania([]);
    setMsg(null);
    ustawDomyslnaObecnosc();
  }

  async function otworzSpotkanie(id) {
    setMsg(null);
    setErr(null);
    setBusy(true);
    const { data, error } = await supabase.from("spotkanie_kierownikow").select("*").eq("id", id).single();
    if (error) {
      setBusy(false);
      setErr(error.message);
      return;
    }
    const [{ data: osoby }, { data: tematyDb }, zadRes] = await Promise.all([
      supabase.from("spotkanie_kierownikow_osoba").select("pracownik_nr, imie_nazwisko, obecny").eq("spotkanie_id", id),
      supabase
        .from("spotkanie_kierownikow_temat")
        .select("id, kr, tresc, godzina, kolejnosc")
        .eq("spotkanie_id", id)
        .order("kolejnosc", { ascending: true }),
      supabase
        .from("zadania")
        .select("id, kr, zadanie, osoba_odpowiedzialna, status, deadline, typ_zadania, created_at, spotkanie_id")
        .eq("spotkanie_id", id)
        .order("id", { ascending: true }),
    ]);
    let zadDb = zadRes.data ?? [];
    if (zadRes.error) {
      const fallback = await supabase
        .from("zadania")
        .select("id, kr, zadanie, osoba_odpowiedzialna, status, deadline, typ_zadania, created_at")
        .eq("typ_zadania", "czat_kr")
        .limit(40);
      zadDb = fallback.data ?? [];
    }
    setBusy(false);
    setForm({
      id: data.id,
      data: String(data.data ?? "").slice(0, 10),
      godzina_od: String(data.godzina_od ?? "").slice(0, 5),
      godzina_do: String(data.godzina_do ?? "").slice(0, 5),
      tytul: data.tytul || "Spotkanie kierowników",
      protokol: data.protokol || "",
    });
    const nrObecnych = (osoby ?? [])
      .filter((o) => o.obecny !== false)
      .map((o) => normalizujNr(o.pracownik_nr))
      .filter(Boolean);
    ustawDomyslnaObecnosc(nrObecnych);
    setTematy(tematyDb ?? []);
    setZadania(zadDb ?? []);
  }

  function toggleObecnosc(nr) {
    const n = normalizujNr(nr);
    if (!n) return;
    setObecnosc((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  async function wczytajTematyZCzat() {
    const odIso = isoZDatyIGodziny(form.data, form.godzina_od || "00:00");
    const doIso = isoZDatyIGodziny(form.data, form.godzina_do || "23:59");
    if (new Date(doIso).getTime() < new Date(odIso).getTime()) {
      setMsg("Godzina „do” musi być późniejsza niż „od” — albo zmień datę w polach.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const { data, error } = await pobierzWpisyZakresu(supabase, { odIso, doIso });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    const wczytane = wpisyNaTematy(data ?? []);
    setTematy(wczytane);
    if (!String(form.protokol ?? "").trim()) {
      setForm((prev) => ({ ...prev, protokol: zlozProtokolSpotkania(data ?? [], { odIso, doIso }) }));
    }
    setMsg(
      wczytane.length
        ? `Wczytano ${wczytane.length} ${wczytane.length === 1 ? "temat" : "tematów"} z CZAT KR.`
        : "W tym zakresie OD–DO nie ma wpisów w CZAT KR.",
    );
  }

  async function wczytajZadaniaZDnia() {
    const dzien = String(form.data || dzisYmd()).trim();
    if (!dzien) return;
    setBusy(true);
    setMsg(null);
    const od = `${dzien}T00:00:00`;
    const doKonca = `${dzien}T23:59:59`;
    let q = supabase
      .from("zadania")
      .select("id, kr, zadanie, osoba_odpowiedzialna, status, deadline, typ_zadania, created_at, spotkanie_id")
      .or(`typ_zadania.eq.czat_kr,typ_zadania.eq.spotkanie_kierownikow,deadline.eq.${dzien}`)
      .order("id", { ascending: false })
      .limit(80);
    if (form.id) {
      q = supabase
        .from("zadania")
        .select("id, kr, zadanie, osoba_odpowiedzialna, status, deadline, typ_zadania, created_at, spotkanie_id")
        .or(`spotkanie_id.eq.${form.id},typ_zadania.eq.czat_kr,typ_zadania.eq.spotkanie_kierownikow,deadline.eq.${dzien}`)
        .order("id", { ascending: false })
        .limit(80);
    }
    const { data, error } = await q;
    setBusy(false);
    if (error) {
      const { data: fallback, error: e2 } = await supabase
        .from("zadania")
        .select("id, kr, zadanie, osoba_odpowiedzialna, status, deadline, typ_zadania, created_at")
        .eq("typ_zadania", "czat_kr")
        .gte("created_at", od)
        .lte("created_at", doKonca)
        .order("id", { ascending: false })
        .limit(80);
      if (e2) {
        setErr(error.message);
        return;
      }
      setZadania(fallback ?? []);
      setMsg(`Wczytano ${(fallback ?? []).length} zadań z CZAT KR z tego dnia.`);
      return;
    }
    const unikalne = [];
    const seen = new Set();
    for (const z of data ?? []) {
      if (seen.has(z.id)) continue;
      seen.add(z.id);
      unikalne.push(z);
    }
    setZadania(unikalne);
    setMsg(`Wczytano ${unikalne.length} ${unikalne.length === 1 ? "zadanie" : "zadań"}.`);
  }

  function dodajTematRecznie() {
    const tresc = String(nowyTematTresc ?? "").trim();
    if (!tresc) {
      setMsg("Wpisz treść tematu.");
      return;
    }
    const godz = nowyTematGodzina
      ? isoZDatyIGodziny(form.data || dzisYmd(), nowyTematGodzina)
      : null;
    setTematy((prev) => [
      ...prev,
      {
        kr: String(nowyTematKr ?? "").trim(),
        tresc,
        godzina: godz,
        kolejnosc: prev.length,
      },
    ]);
    setNowyTematTresc("");
    setMsg("Dodano temat do protokołu.");
  }

  function usunTemat(idx) {
    setTematy((prev) => prev.filter((_, i) => i !== idx).map((t, i) => ({ ...t, kolejnosc: i })));
  }

  async function dodajZadanie() {
    if (!czyMozeEdytowac) return;
    const tytul = String(zadanieTytul ?? "").trim();
    if (!tytul) {
      setMsg("Podaj treść zadania.");
      return;
    }
    const nrOdp = normalizujNr(zadanieDlaNr);
    const osoba = zespol.find((p) => normalizujNr(p.nr) === nrOdp);
    const zlecajacy = String(autorNazwa ?? "").trim() || String(autorEmail ?? "").trim() || "Kierownik";
    const payload = {
      zadanie: tytul,
      osoba_odpowiedzialna: nrOdp || null,
      osoba_zlecajaca: normalizujNr(autorNr) || zlecajacy,
      status: "oczekuje",
      kr: String(zadanieKr ?? "").trim() || null,
      deadline: form.data || null,
      typ_zadania: "spotkanie_kierownikow",
      opis: `Ze spotkania kierowników (${form.data || "bez daty"}).`,
    };
    if (form.id) payload.spotkanie_id = form.id;
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.from("zadania").insert([payload]).select("id, kr, zadanie, osoba_odpowiedzialna, status, deadline, typ_zadania, created_at, spotkanie_id").single();
    setBusy(false);
    if (error) {
      const { data: d2, error: e2 } = await supabase
        .from("zadania")
        .insert([{ ...payload, spotkanie_id: undefined }])
        .select("id, kr, zadanie, osoba_odpowiedzialna, status, deadline, typ_zadania, created_at")
        .single();
      if (e2) {
        setErr(error.message);
        return;
      }
      setZadania((prev) => [...prev, d2]);
      setZadanieTytul("");
      setMsg(`Dodano zadanie dla ${osoba?.imie_nazwisko || nrOdp || "—"}.`);
      return;
    }
    setZadania((prev) => [...prev, data]);
    setZadanieTytul("");
    setMsg(`Dodano zadanie dla ${osoba?.imie_nazwisko || nrOdp || "—"}.`);
  }

  async function zapisz() {
    if (!czyMozeEdytowac) {
      alert("Zapis spotkań jest dostępny dla kierownika i administratora.");
      return;
    }
    if (!form.data) {
      setMsg("Wybierz datę spotkania.");
      return;
    }
    if (brakTabeli) {
      setMsg(`Najpierw uruchom w Supabase SQL Editor: ${SQL_PATH}`);
      return;
    }
    setBusy(true);
    setMsg(null);
    setErr(null);
    const payload = {
      data: form.data,
      godzina_od: form.godzina_od || null,
      godzina_do: form.godzina_do || null,
      tytul: String(form.tytul ?? "").trim() || "Spotkanie kierowników",
      protokol: form.protokol || null,
      updated_at: new Date().toISOString(),
      autor: String(autorNazwa ?? "").trim() || null,
      autor_email: String(autorEmail ?? "").trim() || null,
    };
    let spotkanieId = form.id;
    if (spotkanieId) {
      const { error } = await supabase.from("spotkanie_kierownikow").update(payload).eq("id", spotkanieId);
      if (error) {
        setBusy(false);
        if (czyBrakTabeli(error)) setBrakTabeli(true);
        setErr(error.message);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("spotkanie_kierownikow")
        .insert([payload])
        .select("id")
        .single();
      if (error) {
        setBusy(false);
        if (czyBrakTabeli(error)) setBrakTabeli(true);
        setErr(error.message);
        return;
      }
      spotkanieId = data.id;
    }

    await supabase.from("spotkanie_kierownikow_osoba").delete().eq("spotkanie_id", spotkanieId);
    const osoby = zespol
      .filter((p) => obecnosc.has(normalizujNr(p.nr)))
      .map((p) => ({
        spotkanie_id: spotkanieId,
        pracownik_nr: normalizujNr(p.nr),
        imie_nazwisko: String(p.imie_nazwisko ?? "").trim() || etykietaPracownika(p),
        obecny: true,
      }));
    if (osoby.length) {
      const { error: eO } = await supabase.from("spotkanie_kierownikow_osoba").insert(osoby);
      if (eO) {
        setBusy(false);
        setErr(eO.message);
        return;
      }
    }

    await supabase.from("spotkanie_kierownikow_temat").delete().eq("spotkanie_id", spotkanieId);
    const tematyPayload = tematy
      .filter((t) => String(t.tresc ?? "").trim())
      .map((t, i) => ({
        spotkanie_id: spotkanieId,
        kr: String(t.kr ?? "").trim() || null,
        tresc: String(t.tresc ?? "").trim(),
        godzina: t.godzina || null,
        kolejnosc: i,
      }));
    if (tematyPayload.length) {
      const { error: eT } = await supabase.from("spotkanie_kierownikow_temat").insert(tematyPayload);
      if (eT) {
        setBusy(false);
        setErr(eT.message);
        return;
      }
    }

    const idsZadan = zadania.map((z) => z.id).filter((id) => id != null);
    if (idsZadan.length) {
      await supabase.from("zadania").update({ spotkanie_id: spotkanieId }).in("id", idsZadan);
    }

    setForm((prev) => ({ ...prev, id: spotkanieId }));
    setBusy(false);
    setMsg("Zapisano spotkanie.");
    await fetchLista();
  }

  async function usunSpotkanie() {
    if (!form.id || !czyMozeEdytowac) return;
    const ok = window.confirm("Usunąć to spotkanie (protokół, obecność i tematy)? Zadania zostaną odpięte, nie usunięte.");
    if (!ok) return;
    setBusy(true);
    const { error } = await supabase.from("spotkanie_kierownikow").delete().eq("id", form.id);
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    resetSzkic();
    await fetchLista();
    setMsg("Usunięto spotkanie.");
  }

  const inputSt = {
    width: "100%",
    boxSizing: "border-box",
    padding: "0.4rem 0.5rem",
    borderRadius: 8,
    border: LIGHT.inputBorder,
    background: "#fff",
    color: LIGHT.text,
    font: "inherit",
    fontSize: "0.88rem",
  };
  const btnPrimary = {
    background: LIGHT.accent,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "0.5rem 0.85rem",
    fontWeight: 800,
    fontSize: "0.88rem",
    cursor: busy ? "wait" : "pointer",
  };
  const btnGhost = {
    background: "#fff",
    border: LIGHT.cardBorder,
    borderRadius: 8,
    padding: "0.45rem 0.75rem",
    fontWeight: 700,
    fontSize: "0.82rem",
    cursor: "pointer",
    color: LIGHT.text,
  };

  return (
    <div
      style={{
        marginTop: "0.85rem",
        border: LIGHT.panelBorder,
        borderRadius: 14,
        background: LIGHT.panelBg,
        padding: "0.95rem 1rem 1.1rem",
        color: LIGHT.text,
        boxShadow: "0 10px 28px -18px rgba(194,65,12,0.45)",
      }}
    >
      {brakTabeli ? (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.55rem 0.7rem",
            borderRadius: 8,
            background: LIGHT.dangerBg,
            border: LIGHT.dangerBorder,
            color: LIGHT.dangerText,
            fontSize: "0.82rem",
          }}
          role="alert"
        >
          Brak tabel w bazie — zapis protokołów zadziała po uruchomieniu w Supabase SQL Editor:{" "}
          <code style={{ background: "#fee2e2", padding: "0.05rem 0.25rem", borderRadius: 4 }}>{SQL_PATH}</code>.
          Możesz już wczytać tematy z CZAT KR i wydrukować szkic.
        </div>
      ) : null}
      {err ? (
        <div style={{ marginBottom: "0.5rem", color: LIGHT.dangerText, fontSize: "0.82rem" }}>{err}</div>
      ) : null}
      {msg ? <div style={{ marginBottom: "0.5rem", color: LIGHT.ok, fontSize: "0.82rem" }}>{msg}</div> : null}

      <div
        className="spotkania-kr-split"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(12rem, 16rem) minmax(0, 1fr)",
          gap: "0.85rem",
          alignItems: "start",
        }}
      >
        <aside
          style={{
            border: LIGHT.cardBorder,
            borderRadius: 12,
            background: LIGHT.cardBg,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "0.55rem 0.7rem",
              borderBottom: LIGHT.cardBorder,
              display: "flex",
              justifyContent: "space-between",
              gap: "0.4rem",
              alignItems: "center",
            }}
          >
            <strong style={{ fontSize: "0.85rem" }}>Zapisane</strong>
            <button type="button" onClick={resetSzkic} style={{ ...btnGhost, padding: "0.2rem 0.45rem", fontSize: "0.75rem" }}>
              Nowe
            </button>
          </div>
          <div style={{ maxHeight: "28rem", overflowY: "auto" }}>
            {loading ? (
              <p style={{ margin: "0.7rem", fontSize: "0.8rem", color: LIGHT.soft }}>Ładowanie…</p>
            ) : lista.length === 0 ? (
              <p style={{ margin: "0.7rem", fontSize: "0.8rem", color: LIGHT.soft }}>
                {brakTabeli ? "Brak tabeli — pracujesz na szkicu." : "Jeszcze nie ma zapisanych spotkań."}
              </p>
            ) : (
              lista.map((row) => {
                const active = form.id === row.id;
                const godz = [String(row.godzina_od ?? "").slice(0, 5), String(row.godzina_do ?? "").slice(0, 5)]
                  .filter(Boolean)
                  .join("–");
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => void otworzSpotkanie(row.id)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      borderBottom: LIGHT.cardBorder,
                      background: active ? LIGHT.accentSoft : "#fff",
                      color: LIGHT.text,
                      padding: "0.55rem 0.7rem",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: "0.84rem" }}>{String(row.data ?? "").slice(0, 10)}</div>
                    <div style={{ fontSize: "0.74rem", color: LIGHT.muted }}>
                      {godz || "—"} · {row.tytul || "Spotkanie"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div style={{ display: "grid", gap: "0.85rem" }}>
          <section style={{ border: LIGHT.cardBorder, borderRadius: 12, background: LIGHT.cardBg, padding: "0.8rem 0.85rem" }}>
            <strong style={{ color: LIGHT.accent }}>Data i godzina</strong>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
                gap: "0.55rem",
                marginTop: "0.55rem",
              }}
            >
              <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", fontWeight: 800 }}>
                Data
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))}
                  style={inputSt}
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", fontWeight: 800 }}>
                Od — godzina
                <input
                  type="time"
                  value={form.godzina_od}
                  onChange={(e) => setForm((p) => ({ ...p, godzina_od: e.target.value }))}
                  style={inputSt}
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", fontWeight: 800 }}>
                Do — godzina
                <input
                  type="time"
                  value={form.godzina_do}
                  onChange={(e) => setForm((p) => ({ ...p, godzina_do: e.target.value }))}
                  style={inputSt}
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: "0.78rem", fontWeight: 800, gridColumn: "1 / -1" }}>
                Tytuł
                <input
                  type="text"
                  value={form.tytul}
                  onChange={(e) => setForm((p) => ({ ...p, tytul: e.target.value }))}
                  style={inputSt}
                />
              </label>
            </div>
          </section>

          <section style={{ border: LIGHT.cardBorder, borderRadius: 12, background: LIGHT.cardBg, padding: "0.8rem 0.85rem" }}>
            <strong style={{ color: LIGHT.accent }}>Lista obecnych</strong>
            <p style={{ margin: "0.35rem 0 0.55rem", fontSize: "0.78rem", color: LIGHT.muted }}>
              Domyślnie zespół kierowników. Odznacz nieobecnych — reszta osób z dostępem do aplikacji jest niżej.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem 0.85rem" }}>
              {zespol.map((p) => {
                const nr = normalizujNr(p.nr);
                const rdzen = CZAT_KR_TEAM_NR.includes(nr);
                return (
                  <label
                    key={nr || p.imie_nazwisko}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.84rem",
                      fontWeight: rdzen ? 800 : 500,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={obecnosc.has(nr)}
                      onChange={() => toggleObecnosc(nr)}
                    />
                    {String(p.imie_nazwisko ?? "").trim() || etykietaPracownika(p)}
                  </label>
                );
              })}
            </div>
            {!zespol.length ? (
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.8rem", color: LIGHT.soft }}>
                Brak listy pracowników — otwórz CZAT KR albo odśwież, żeby wczytać zespół.
              </p>
            ) : null}
          </section>

          <section style={{ border: LIGHT.cardBorder, borderRadius: 12, background: LIGHT.cardBg, padding: "0.8rem 0.85rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ color: LIGHT.accent }}>Omówione tematy (wg KR)</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                <button type="button" disabled={busy} onClick={() => void wczytajTematyZCzat()} style={btnGhost}>
                  Wczytaj z CZAT KR (OD–DO)
                </button>
                {typeof onOtworzCzatKr === "function" ? (
                  <button type="button" onClick={() => onOtworzCzatKr()} style={btnGhost}>
                    Otwórz CZAT KR
                  </button>
                ) : null}
              </div>
            </div>
            <div style={{ marginTop: "0.65rem", display: "grid", gap: "0.4rem" }}>
              {tematy.length === 0 ? (
                <p style={{ margin: 0, fontSize: "0.8rem", color: LIGHT.soft }}>
                  Brak tematów — wczytaj wpisy z CZAT KR albo dopisz ręcznie.
                </p>
              ) : (
                tematy.map((t, idx) => (
                  <div
                    key={`${t.id || "n"}-${idx}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "5.5rem 4.2rem minmax(0, 1fr) auto",
                      gap: "0.4rem",
                      alignItems: "start",
                      fontSize: "0.84rem",
                    }}
                  >
                    <span style={{ fontWeight: 800, color: LIGHT.accent }}>KR {t.kr || "—"}</span>
                    <span style={{ color: LIGHT.soft }}>{formatGodzinaTematu(t.godzina) || "—"}</span>
                    <span style={{ whiteSpace: "pre-wrap" }}>{t.tresc}</span>
                    <button type="button" onClick={() => usunTemat(idx)} style={{ ...btnGhost, padding: "0.15rem 0.4rem", fontSize: "0.72rem" }}>
                      Usuń
                    </button>
                  </div>
                ))
              )}
            </div>
            <div
              style={{
                marginTop: "0.7rem",
                display: "grid",
                gridTemplateColumns: "minmax(7rem, 10rem) 7rem minmax(0, 1fr) auto",
                gap: "0.4rem",
                alignItems: "end",
              }}
            >
              <label style={{ display: "grid", gap: 3, fontSize: "0.72rem", fontWeight: 700 }}>
                KR
                <input
                  list="spotkanie-kr-list"
                  value={nowyTematKr}
                  onChange={(e) => setNowyTematKr(e.target.value)}
                  placeholder="np. 1083"
                  style={inputSt}
                />
                <datalist id="spotkanie-kr-list">
                  {kodyKr.map((k) => (
                    <option key={k} value={k} />
                  ))}
                </datalist>
              </label>
              <label style={{ display: "grid", gap: 3, fontSize: "0.72rem", fontWeight: 700 }}>
                Godzina
                <input
                  type="time"
                  value={nowyTematGodzina}
                  onChange={(e) => setNowyTematGodzina(e.target.value)}
                  style={inputSt}
                />
              </label>
              <label style={{ display: "grid", gap: 3, fontSize: "0.72rem", fontWeight: 700 }}>
                Temat
                <input
                  type="text"
                  value={nowyTematTresc}
                  onChange={(e) => setNowyTematTresc(e.target.value)}
                  placeholder="Omówiony temat…"
                  style={inputSt}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      dodajTematRecznie();
                    }
                  }}
                />
              </label>
              <button type="button" onClick={dodajTematRecznie} style={btnGhost}>
                Dodaj temat
              </button>
            </div>
          </section>

          <section style={{ border: LIGHT.cardBorder, borderRadius: 12, background: LIGHT.cardBg, padding: "0.8rem 0.85rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ color: LIGHT.accent }}>Zadania</strong>
              <button type="button" disabled={busy} onClick={() => void wczytajZadaniaZDnia()} style={btnGhost}>
                Wczytaj zadania z tego dnia
              </button>
            </div>
            <div style={{ marginTop: "0.55rem", display: "grid", gap: "0.35rem" }}>
              {zadania.length === 0 ? (
                <p style={{ margin: 0, fontSize: "0.8rem", color: LIGHT.soft }}>Brak zadań na wydruku.</p>
              ) : (
                zadania.map((z) => (
                  <div key={z.id || z.zadanie} style={{ fontSize: "0.84rem" }}>
                    <strong>{z.zadanie}</strong>
                    <span style={{ color: LIGHT.soft }}>
                      {" "}
                      · {z.kr ? `KR ${z.kr}` : "bez KR"} · {z.osoba_odpowiedzialna || "—"} · {z.status || "—"}
                    </span>
                  </div>
                ))
              )}
            </div>
            {czyMozeEdytowac ? (
              <div
                style={{
                  marginTop: "0.7rem",
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(8rem, 12rem) minmax(6rem, 8rem) auto",
                  gap: "0.4rem",
                  alignItems: "end",
                }}
              >
                <label style={{ display: "grid", gap: 3, fontSize: "0.72rem", fontWeight: 700 }}>
                  Nowe zadanie
                  <input
                    type="text"
                    value={zadanieTytul}
                    onChange={(e) => setZadanieTytul(e.target.value)}
                    placeholder="Treść zadania…"
                    style={inputSt}
                  />
                </label>
                <label style={{ display: "grid", gap: 3, fontSize: "0.72rem", fontWeight: 700 }}>
                  Dla
                  <select value={zadanieDlaNr} onChange={(e) => setZadanieDlaNr(e.target.value)} style={inputSt}>
                    {zespol.map((p) => (
                      <option key={normalizujNr(p.nr)} value={normalizujNr(p.nr)}>
                        {String(p.imie_nazwisko ?? "").trim() || etykietaPracownika(p)}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 3, fontSize: "0.72rem", fontWeight: 700 }}>
                  KR
                  <input
                    list="spotkanie-kr-list"
                    value={zadanieKr}
                    onChange={(e) => setZadanieKr(e.target.value)}
                    style={inputSt}
                  />
                </label>
                <button type="button" disabled={busy} onClick={() => void dodajZadanie()} style={btnGhost}>
                  Dodaj zadanie
                </button>
              </div>
            ) : null}
          </section>

          <section style={{ border: LIGHT.cardBorder, borderRadius: 12, background: LIGHT.cardBg, padding: "0.8rem 0.85rem" }}>
            <strong style={{ color: LIGHT.accent }}>Protokół</strong>
            <textarea
              value={form.protokol}
              onChange={(e) => setForm((p) => ({ ...p, protokol: e.target.value }))}
              rows={10}
              style={{ ...inputSt, marginTop: "0.5rem", minHeight: "10rem", fontFamily: "ui-monospace, Consolas, monospace", fontSize: "0.82rem", lineHeight: 1.45 }}
              placeholder="Złożony protokół (wczytaj z CZAT KR albo wpisz ręcznie)…"
            />
          </section>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            {czyMozeEdytowac ? (
              <button type="button" disabled={busy} onClick={() => void zapisz()} style={btnPrimary}>
                {busy ? "Zapisuję…" : form.id ? "Zapisz zmiany" : "Zapisz spotkanie"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() =>
                drukujSpotkanie({ form, obecnosc, tematy, zadania, zespol })
              }
              style={{ ...btnPrimary, background: "#9a3412" }}
            >
              Drukuj (obecni, tematy, zadania)
            </button>
            {form.id && czyMozeEdytowac ? (
              <button type="button" disabled={busy} onClick={() => void usunSpotkanie()} style={{ ...btnGhost, color: LIGHT.dangerText }}>
                Usuń spotkanie
              </button>
            ) : null}
            <span style={{ fontSize: "0.75rem", color: LIGHT.soft }}>
              Wydruk otworzy się w nowym oknie — możesz zapisać jako PDF.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
