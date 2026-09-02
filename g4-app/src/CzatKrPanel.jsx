import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SPOTKANIE_AUTOR_NOTATKA,
  SPOTKANIE_AUTOR_ZNACZNIK,
  czyWpisSpotkania,
  czyZnacznikKoniec,
  czyZnacznikPoczatek,
  czyKrPlaceholder,
  etykietaAutoraWpisu,
  isoZDatyIGodziny,
  polaDatyGodzinyZIso,
  przepiszMojeWpisyNaNotatkiSpotkania,
  trescKoniecSpotkania,
  trescPoczatekSpotkania,
  upsertZnacznikPoczatek,
  useSpotkanieKierownikow,
  zapiszSpotkanie,
  znajdzZnacznikPoczatek,
} from "./lib/czatKrSpotkanie.js";

/**
 * Zespół CZAT KR (nieformalne imiona → konkretne nr w `pracownik` z Supabase).
 * 023 Damian Markiewicz, 000 Michał Jakubowski, 001 Monika Jakubowska,
 * 011 Anna Homik, 003 Małgorzata Franczak.
 */
export const CZAT_KR_TEAM_NR = ["023", "000", "001", "011", "003"];

const CZAT_KR_TEAM_MATCH = [
  { nr: "023", match: /damian.*markiewicz|markiewicz.*damian|^damian$/i },
  { nr: "000", match: /micha[łl].*jakubowski|jakubowski.*micha[łl]/i },
  { nr: "001", match: /monika.*jakubowska|jakubowska.*monika/i },
  { nr: "011", match: /anna.*homik|homik.*anna|ania.*homik/i },
  { nr: "003", match: /ma[łl]gorzata.*franczak|franczak.*ma[łl]gorzata|gosia.*franczak/i },
];

function normalizujNr(nr) {
  return String(nr ?? "").trim();
}

/** Aktywni pracownicy z dostępem do aplikacji (powiązane konto auth). */
export function pracownicyZDostepemDoAplikacji(pracownicy = []) {
  return (pracownicy ?? []).filter((p) => {
    if (p?.is_active === false) return false;
    return p?.auth_user_id != null && String(p.auth_user_id).trim() !== "";
  });
}

/** Zespół do wyboru w zadaniach — realne rekordy z bazy (nr + imię_nazwisko). */
export function zbudujZespolCzatKr(pracownicy = []) {
  const zDostepem = pracownicyZDostepemDoAplikacji(pracownicy);
  const mapa = new Map(
    (pracownicy ?? []).map((p) => [normalizujNr(p.nr), p]),
  );
  const out = [];
  const used = new Set();

  for (const nr of CZAT_KR_TEAM_NR) {
    const p = mapa.get(nr);
    if (p && p.is_active !== false) {
      out.push(p);
      used.add(nr);
    }
  }

  // Uzupełnij po nazwisku, gdy nr się nie zgrał (np. inny format)
  for (const rule of CZAT_KR_TEAM_MATCH) {
    if (used.has(rule.nr)) continue;
    const found = zDostepem.find((p) => rule.match.test(String(p.imie_nazwisko ?? "")));
    if (found) {
      out.push(found);
      used.add(normalizujNr(found.nr));
    }
  }

  // Reszta osób z dostępem do apki (auth) — żeby lista była kompletna
  for (const p of zDostepem) {
    const nr = normalizujNr(p.nr);
    if (!nr || used.has(nr)) continue;
    out.push(p);
    used.add(nr);
  }

  return out.sort((a, b) =>
    String(a.imie_nazwisko ?? "").localeCompare(String(b.imie_nazwisko ?? ""), "pl", {
      sensitivity: "base",
    }),
  );
}

export function czyMozeDodawacZadaniaZCzatKr({
  imieNazwisko,
  email,
  nr,
  czyAdmin,
  pracownicy = [],
}) {
  if (czyAdmin) return true;
  const zespol = zbudujZespolCzatKr(pracownicy);
  const n = normalizujNr(nr);
  if (n && zespol.some((p) => normalizujNr(p.nr) === n)) return true;
  const blob = `${imieNazwisko ?? ""} ${email ?? ""}`.toLowerCase();
  return zespol.some((p) => {
    const nazwa = String(p.imie_nazwisko ?? "").toLowerCase();
    const mail = String(p.email ?? "").toLowerCase();
    if (mail && email && mail === String(email).trim().toLowerCase()) return true;
    return nazwa && blob.includes(nazwa);
  });
}

function etykietaPracownika(p) {
  const nr = normalizujNr(p?.nr);
  const nazwa = String(p?.imie_nazwisko ?? "").trim() || "—";
  return nr ? `${nr} — ${nazwa}` : nazwa;
}

const LIGHT = {
  panelBg: "linear-gradient(180deg, #e0f2fe 0%, #f8fafc 55%, #ffffff 100%)",
  panelBorder: "1px solid #7dd3fc",
  text: "#0f172a",
  muted: "#475569",
  soft: "#64748b",
  accent: "#0369a1",
  accentSoft: "#e0f2fe",
  cardBg: "#ffffff",
  cardBorder: "1px solid #cbd5e1",
  inputBorder: "1px solid #94a3b8",
  dangerBg: "#fef2f2",
  dangerBorder: "1px solid #fecaca",
  dangerText: "#991b1b",
  ok: "#166534",
  spotkanieBg: "#fffbeb",
  spotkanieBorder: "1px solid #f59e0b",
  spotkanieText: "#92400e",
  znacznikBg: "#fef3c7",
};

function formatData(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function czasMs(iso) {
  const t = new Date(iso || 0).getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * CZAT KR — lista KR po lewej, wątek po prawej.
 */
export function CzatKrPanel({
  supabase,
  autorNazwa,
  autorEmail,
  autorNr,
  czyAdmin,
  czyMozePisac,
  krList = [],
  pracownicy = [],
  onOtworzKr,
  /** Przejście do Plan faktur FS z prefill (KR / klient / opis). */
  onDodajFaktureDoPlanu,
}) {
  const [wpisy, setWpisy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [brakTabeli, setBrakTabeli] = useState(false);
  const [wybranyKr, setWybranyKr] = useState("");
  const [draft, setDraft] = useState("");
  const [wysylanie, setWysylanie] = useState(false);
  const [rozwiniete, setRozwiniete] = useState(false);
  const [szukajKr, setSzukajKr] = useState("");
  const [edycjaId, setEdycjaId] = useState(null);
  const [edycjaTresc, setEdycjaTresc] = useState("");
  const [zapisywanieEdycji, setZapisywanieEdycji] = useState(false);

  const [pokazZadanie, setPokazZadanie] = useState(false);
  const [zadanieTytul, setZadanieTytul] = useState("");
  const [zadanieDlaNr, setZadanieDlaNr] = useState("");
  const [zadanieDeadline, setZadanieDeadline] = useState("");
  const [zapisZadania, setZapisZadania] = useState(false);
  const spotkanie = useSpotkanieKierownikow();
  const polaOdInit = polaDatyGodzinyZIso(
    spotkanie.startIso || new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  );
  const polaDoInit = polaDatyGodzinyZIso(new Date().toISOString());
  const [spotkanieData, setSpotkanieData] = useState(polaOdInit.data);
  const [spotkanieGodzina, setSpotkanieGodzina] = useState(polaOdInit.godzina);
  const [spotkanieDataDo, setSpotkanieDataDo] = useState(polaDoInit.data);
  const [spotkanieGodzinaDo, setSpotkanieGodzinaDo] = useState(polaDoInit.godzina);
  const [notatkaGodzina, setNotatkaGodzina] = useState(() => polaDatyGodzinyZIso().godzina);
  const [przepisBusy, setPrzepisBusy] = useState(false);
  const [edycjaData, setEdycjaData] = useState("");
  const [edycjaGodzina, setEdycjaGodzina] = useState("");
  const [godzinaDraft, setGodzinaDraft] = useState({});
  const [zapisGodzinyId, setZapisGodzinyId] = useState(null);

  useEffect(() => {
    if (!spotkanie.startIso) return;
    const p = polaDatyGodzinyZIso(spotkanie.startIso);
    setSpotkanieData(p.data);
    setSpotkanieGodzina(p.godzina);
  }, [spotkanie.startIso]);

  const zespolDoZadan = useMemo(() => zbudujZespolCzatKr(pracownicy), [pracownicy]);

  useEffect(() => {
    if (zadanieDlaNr) return;
    if (zespolDoZadan.length) setZadanieDlaNr(normalizujNr(zespolDoZadan[0].nr));
  }, [zespolDoZadan, zadanieDlaNr]);

  const mozeZadania = czyMozeDodawacZadaniaZCzatKr({
    imieNazwisko: autorNazwa,
    email: autorEmail,
    nr: autorNr,
    czyAdmin,
    pracownicy,
  });

  const etykietaZespolu = useMemo(
    () =>
      zespolDoZadan
        .filter((p) => CZAT_KR_TEAM_NR.includes(normalizujNr(p.nr)))
        .map((p) => String(p.imie_nazwisko ?? "").trim())
        .filter(Boolean)
        .join(" · ") || "zespół z dostępem do aplikacji",
    [zespolDoZadan],
  );

  const fetchWpisy = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("kr_notatka")
      .select("id, kr, tresc, autor, autor_email, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    setLoading(false);
    if (error) {
      const m = String(error.message ?? "");
      if (/kr_notatka|schema cache|PGRST205|does not exist/i.test(m)) {
        setBrakTabeli(true);
        setWpisy([]);
        return;
      }
      setErr(m);
      setWpisy([]);
      return;
    }
    setBrakTabeli(false);
    setWpisy(data ?? []);
  }, [supabase]);

  useEffect(() => {
    void fetchWpisy();
  }, [fetchWpisy]);

  const krOpcje = useMemo(() => {
    return [...(krList ?? [])]
      .map((r) => String(r.kr ?? "").trim())
      .filter((k) => k && !czyKrPlaceholder(k))
      .sort((a, b) => a.localeCompare(b, "pl", { numeric: true }));
  }, [krList]);

  /** Lista KR po lewej: najpierw te z wpisami (po dacie), potem pozostałe z listy KR. */
  const listaKrLewa = useMemo(() => {
    const meta = new Map();
    for (const w of wpisy) {
      const k = String(w.kr ?? "").trim();
      if (!k) continue;
      const prev = meta.get(k);
      const ms = czasMs(w.created_at);
      if (!prev) {
        meta.set(k, { kr: k, count: 1, lastMs: ms, lastIso: w.created_at });
      } else {
        prev.count += 1;
        if (ms > prev.lastMs) {
          prev.lastMs = ms;
          prev.lastIso = w.created_at;
        }
      }
    }
    for (const k of krOpcje) {
      if (czyKrPlaceholder(k)) continue;
      if (!meta.has(k)) meta.set(k, { kr: k, count: 0, lastMs: 0, lastIso: null });
    }
    const q = String(szukajKr ?? "").trim().toLowerCase();
    let list = [...meta.values()];
    if (q) list = list.filter((x) => x.kr.toLowerCase().includes(q));
    list.sort((a, b) => {
      const pa = czyKrPlaceholder(a.kr) ? 1 : 0;
      const pb = czyKrPlaceholder(b.kr) ? 1 : 0;
      if (pa !== pb) return pa - pb;
      if (b.lastMs !== a.lastMs) return b.lastMs - a.lastMs;
      if (b.count !== a.count) return b.count - a.count;
      return a.kr.localeCompare(b.kr, "pl", { numeric: true });
    });
    return list;
  }, [wpisy, krOpcje, szukajKr]);

  useEffect(() => {
    const pierwszy = listaKrLewa.find((x) => !czyKrPlaceholder(x.kr));
    if (!pierwszy) return;
    if (!wybranyKr || czyKrPlaceholder(wybranyKr)) setWybranyKr(pierwszy.kr);
  }, [listaKrLewa, wybranyKr]);

  const wpisyWybranego = useMemo(() => {
    const k = String(wybranyKr ?? "").trim();
    if (!k) return [];
    return wpisy.filter((w) => String(w.kr ?? "").trim() === k);
  }, [wpisy, wybranyKr]);

  const widoczne = useMemo(() => {
    if (rozwiniete) return wpisyWybranego;
    return wpisyWybranego.slice(0, 12);
  }, [wpisyWybranego, rozwiniete]);

  function wybierzKr(k) {
    const kod = String(k ?? "").trim();
    if (!kod) return;
    setWybranyKr(kod);
    setRozwiniete(false);
    setMsg(null);
    setEdycjaId(null);
    setEdycjaTresc("");
  }

  async function wyslij(e) {
    e?.preventDefault?.();
    if (!czyMozePisac) {
      alert("Zaloguj się, aby dodać wpis do CZAT KR.");
      return;
    }
    if (brakTabeli) {
      setMsg("Brak tabeli. Uruchom w Supabase: g4-app/supabase/kr-notatki-czat.sql");
      return;
    }
    const kr = String(wybranyKr ?? "").trim();
    if (!kr) {
      setMsg("Wybierz KR po lewej stronie.");
      return;
    }
    if (czyKrPlaceholder(kr)) {
      setMsg("Wybierz prawdziwy numer KR po lewej — nie zapisuję do „???”.");
      return;
    }
    const tekst = String(draft ?? "").trim();
    if (!tekst) return;
    const autor = spotkanie.aktywne
      ? SPOTKANIE_AUTOR_NOTATKA
      : String(autorNazwa ?? "").trim() ||
        String(autorEmail ?? "").trim() ||
        "Użytkownik";
    setMsg(null);
    setWysylanie(true);
    const payload = {
      kr,
      tresc: tekst,
      autor,
      autor_email: spotkanie.aktywne ? null : String(autorEmail ?? "").trim() || null,
    };
    if (spotkanie.aktywne) {
      payload.created_at = isoZDatyIGodziny(spotkanieData, notatkaGodzina || polaDatyGodzinyZIso().godzina);
    }
    const { data, error } = await supabase
      .from("kr_notatka")
      .insert([payload])
      .select("id, kr, tresc, autor, autor_email, created_at")
      .single();
    setWysylanie(false);
    if (error) {
      const m = String(error.message ?? "");
      if (/kr_notatka|schema cache|PGRST205|does not exist/i.test(m)) {
        setBrakTabeli(true);
        setMsg("Brak tabeli. Uruchom w Supabase: g4-app/supabase/kr-notatki-czat.sql");
        return;
      }
      setMsg(`Nie udało się wysłać: ${m}`);
      return;
    }
    setWpisy((prev) => [data, ...prev.filter((x) => x.id !== data.id)]);
    setDraft("");
    setMsg(spotkanie.aktywne ? "Dodano notatkę ze spotkania." : "Dodano wpis.");
  }

  async function wstawWpisSpotkania({ tresc, autor, createdAt }) {
    const kr = String(wybranyKr ?? "").trim();
    if (!kr || czyKrPlaceholder(kr)) {
      setMsg("Wybierz prawdziwy numer KR po lewej (np. 1083) — nie zapisuję do „???”.");
      return null;
    }
    const payload = {
      kr,
      tresc,
      autor,
      autor_email: null,
    };
    if (createdAt) payload.created_at = createdAt;
    const { data, error } = await supabase
      .from("kr_notatka")
      .insert([payload])
      .select("id, kr, tresc, autor, autor_email, created_at")
      .single();
    if (error) {
      setMsg(`Nie udało się zapisać znacznika spotkania: ${error.message}`);
      return null;
    }
    setWpisy((prev) => [data, ...prev.filter((x) => x.id !== data.id)]);
    return data;
  }

  function scalPrzepisaneWpisy(ids) {
    const set = new Set(ids);
    setWpisy((prev) =>
      prev.map((x) =>
        set.has(x.id) ? { ...x, autor: SPOTKANIE_AUTOR_NOTATKA, autor_email: null } : x,
      ),
    );
  }

  async function zastosujPoczatekIPrzepisz({ startIso, wstawNowyZnacznik }) {
    let kr = String(wybranyKr ?? "").trim();
    if (czyKrPlaceholder(kr)) kr = "";
    if (!kr) {
      const pierwszy = listaKrLewa.find((x) => !czyKrPlaceholder(x.kr));
      kr = pierwszy?.kr ? String(pierwszy.kr).trim() : "";
    }
    if (!kr || czyKrPlaceholder(kr)) {
      setMsg("Najpierw kliknij po lewej prawdziwy KR (np. 1083). Nie zapisuję początku do „???”.");
      return false;
    }
    const znacznik = znajdzZnacznikPoczatek(
      wpisy.filter((w) => !czyKrPlaceholder(w.kr)),
      kr,
    );
    const { data, error } = await upsertZnacznikPoczatek(supabase, {
      kr,
      startIso,
      znacznikId: wstawNowyZnacznik ? null : znacznik?.id,
    });
    if (error) {
      setMsg(`Nie udało się zapisać początku spotkania: ${error.message}`);
      return false;
    }
    if (data) {
      setWpisy((prev) => {
        const bez = prev.filter((x) => x.id !== data.id && !(znacznik?.id && x.id === znacznik.id));
        return [data, ...bez];
      });
    }
    const doIso = isoZDatyIGodziny(spotkanieDataDo, spotkanieGodzinaDo);
    const wynik = await przepiszMojeWpisyNaNotatkiSpotkania(supabase, {
      odIso: startIso,
      doIso,
      nazwa: autorNazwa,
      email: autorEmail,
    });
    if (wynik.error) {
      setMsg(`Początek zapisany, ale nie udało się przepisać wpisów: ${wynik.error.message}`);
      zapiszSpotkanie({ aktywne: true, startIso, startKr: kr });
      return true;
    }
    scalPrzepisaneWpisy(wynik.ids);
    zapiszSpotkanie({ aktywne: true, startIso, startKr: kr });
    const ile = wynik.liczba;
    setMsg(
      ile
        ? `Początek spotkania: ${formatData(startIso)}. Przepisano ${ile} ${
            ile === 1 ? "Twój wpis" : "Twoich wpisów"
          } na notatki ze spotkania (bez nazwiska).`
        : `Początek spotkania: ${formatData(startIso)}. Brak Twoich wcześniejszych wpisów do przepisania.`,
    );
    return true;
  }

  async function rozpocznijSpotkanie() {
    if (!czyMozePisac) {
      alert("Zaloguj się, aby notować ze spotkania.");
      return;
    }
    if (spotkanie.aktywne) return;
    const startIso = isoZDatyIGodziny(spotkanieData, spotkanieGodzina);
    setMsg(null);
    setWysylanie(true);
    await zastosujPoczatekIPrzepisz({
      startIso,
      wstawNowyZnacznik: !znajdzZnacznikPoczatek(
        wpisy.filter((w) => !czyKrPlaceholder(w.kr)),
        String(wybranyKr ?? "").trim(),
      ),
    });
    setWysylanie(false);
  }

  async function zastosujDateSpotkaniaWstecz() {
    if (!czyMozePisac) return;
    const startIso = isoZDatyIGodziny(spotkanieData, spotkanieGodzina);
    if (Number.isNaN(new Date(startIso).getTime())) {
      setMsg("Podaj poprawną datę i godzinę początku spotkania.");
      return;
    }
    const ok = window.confirm(
      `Ustawić początek spotkania na ${formatData(startIso)} i przepisać Twoje wpisy od tej godziny do teraz na „Notatka ze spotkania” (bez nazwiska)?`,
    );
    if (!ok) return;
    setMsg(null);
    setPrzepisBusy(true);
    await zastosujPoczatekIPrzepisz({
      startIso,
      wstawNowyZnacznik: !znajdzZnacznikPoczatek(
        wpisy.filter((w) => !czyKrPlaceholder(w.kr)),
        String(wybranyKr ?? "").trim(),
      ),
    });
    setPrzepisBusy(false);
  }

  async function zamienMojeWpisyOdDo() {
    if (!czyMozePisac) return;
    const odIso = isoZDatyIGodziny(spotkanieData, spotkanieGodzina);
    const doIso = isoZDatyIGodziny(spotkanieDataDo, spotkanieGodzinaDo);
    if (new Date(doIso).getTime() < new Date(odIso).getTime()) {
      setMsg("Godzina „do” musi być późniejsza niż „od”.");
      return;
    }
    const ok = window.confirm(
      `Zamienić Twoje wpisy od ${formatData(odIso)} do ${formatData(doIso)} na „Notatka ze spotkania kierowników” (zamiast nazwiska)?`,
    );
    if (!ok) return;
    setMsg(null);
    setPrzepisBusy(true);
    const wynik = await przepiszMojeWpisyNaNotatkiSpotkania(supabase, {
      odIso,
      doIso,
      nazwa: autorNazwa,
      email: autorEmail,
    });
    setPrzepisBusy(false);
    if (wynik.error) {
      setMsg(`Nie udało się przepisać wpisów: ${wynik.error.message}`);
      return;
    }
    scalPrzepisaneWpisy(wynik.ids);
    zapiszSpotkanie({
      aktywne: true,
      startIso: odIso,
      startKr: String(wybranyKr ?? "").trim(),
    });
    const ile = wynik.liczba;
    setMsg(
      ile
        ? `Przepisano ${ile} ${ile === 1 ? "wpis" : "wpisów"} z ${formatData(odIso)} – ${formatData(doIso)} na notatki ze spotkania kierowników.`
        : `W tym zakresie nie znaleziono Twoich wpisów do przepisania (${formatData(odIso)} – ${formatData(doIso)}).`,
    );
    await fetchWpisy();
  }

  async function zakonczSpotkanie() {
    if (!spotkanie.aktywne) return;
    const endIso = new Date().toISOString();
    setMsg(null);
    setWysylanie(true);
    const wstawiony = await wstawWpisSpotkania({
      tresc: trescKoniecSpotkania(spotkanie.startIso, endIso),
      autor: SPOTKANIE_AUTOR_ZNACZNIK,
    });
    setWysylanie(false);
    if (!wstawiony) return;
    zapiszSpotkanie({ aktywne: false, startIso: null, startKr: "" });
    setMsg("Zapisano koniec spotkania kierowników.");
  }

  function rozpocznijEdycje(w) {
    if (!czyMozePisac) {
      alert("Zaloguj się, aby edytować wpis w CZAT KR.");
      return;
    }
    setEdycjaId(w.id);
    setEdycjaTresc(String(w.tresc ?? ""));
    const pola = polaDatyGodzinyZIso(w.created_at);
    setEdycjaData(pola.data);
    setEdycjaGodzina(pola.godzina);
    setMsg(null);
  }

  function anulujEdycje() {
    setEdycjaId(null);
    setEdycjaTresc("");
  }

  function polaGodzinyWpisu(w) {
    return godzinaDraft[w.id] || polaDatyGodzinyZIso(w.created_at);
  }

  function ustawGodzineDraft(w, patch) {
    setGodzinaDraft((prev) => ({
      ...prev,
      [w.id]: { ...polaDatyGodzinyZIso(w.created_at), ...(prev[w.id] || {}), ...patch },
    }));
  }

  async function zapiszGodzineWpisu(w) {
    if (!czyMozePisac || !w?.id) return;
    const pola = polaGodzinyWpisu(w);
    const iso = isoZDatyIGodziny(pola.data, pola.godzina);
    if (Number.isNaN(new Date(iso).getTime())) {
      setMsg("Podaj poprawną datę i godzinę wpisu.");
      return;
    }
    const patch = { created_at: iso };
    if (czyZnacznikPoczatek(w)) patch.tresc = trescPoczatekSpotkania(iso);
    if (czyZnacznikKoniec(w)) patch.tresc = trescKoniecSpotkania(spotkanie.startIso, iso);
    setZapisGodzinyId(w.id);
    setMsg(null);
    const { data, error } = await supabase
      .from("kr_notatka")
      .update(patch)
      .eq("id", w.id)
      .select("id, kr, tresc, autor, autor_email, created_at")
      .single();
    setZapisGodzinyId(null);
    if (error) {
      setMsg(`Nie udało się zapisać godziny: ${error.message}`);
      return;
    }
    setWpisy((prev) => prev.map((x) => (x.id === data.id ? { ...x, ...data } : x)));
    setGodzinaDraft((prev) => {
      const next = { ...prev };
      delete next[w.id];
      return next;
    });
    if (czyZnacznikPoczatek(w) && spotkanie.aktywne) {
      zapiszSpotkanie({
        aktywne: true,
        startIso: iso,
        startKr: String(w.kr ?? wybranyKr ?? "").trim(),
      });
    }
    setMsg(`Zapisano godzinę wpisu: ${formatData(iso)}.`);
  }

  async function zapiszEdycje(e) {
    e?.preventDefault?.();
    if (!czyMozePisac) {
      alert("Zaloguj się, aby edytować wpis w CZAT KR.");
      return;
    }
    const id = edycjaId;
    const tekst = String(edycjaTresc ?? "").trim();
    if (!id) return;
    if (!tekst) {
      setMsg("Treść wpisu nie może być pusta.");
      return;
    }
    setZapisywanieEdycji(true);
    setMsg(null);
    const { data, error } = await supabase
      .from("kr_notatka")
      .update({
        tresc: tekst,
        created_at: isoZDatyIGodziny(edycjaData, edycjaGodzina),
      })
      .eq("id", id)
      .select("id, kr, tresc, autor, autor_email, created_at")
      .single();
    setZapisywanieEdycji(false);
    if (error) {
      const m = String(error.message ?? "");
      setMsg(`Nie udało się zapisać zmian: ${m}`);
      return;
    }
    setWpisy((prev) => prev.map((x) => (x.id === data.id ? { ...x, ...data } : x)));
    setEdycjaId(null);
    setEdycjaTresc("");
    setMsg("Zapisano zmiany we wpisie.");
  }

  async function utworzZadanie(e) {
    e?.preventDefault?.();
    if (!mozeZadania) {
      alert(`Zadania z CZAT KR mogą dodawać: ${etykietaZespolu}.`);
      return;
    }
    const tytul = String(zadanieTytul ?? "").trim();
    if (!tytul) {
      setMsg("Podaj treść zadania.");
      return;
    }
    const nrOdp = normalizujNr(zadanieDlaNr);
    if (!nrOdp) {
      setMsg("Wybierz osobę odpowiedzialną.");
      return;
    }
    const osoba = zespolDoZadan.find((p) => normalizujNr(p.nr) === nrOdp);
    const nazwaOsoby = String(osoba?.imie_nazwisko ?? "").trim() || nrOdp;
    const kr = String(wybranyKr ?? "").trim() || null;
    const zlecajacy =
      String(autorNazwa ?? "").trim() ||
      String(autorEmail ?? "").trim() ||
      "Kierownik";
    const payload = {
      zadanie: tytul,
      osoba_odpowiedzialna: nrOdp,
      osoba_zlecajaca: normalizujNr(autorNr) || zlecajacy,
      status: "oczekuje",
      kr,
      deadline: String(zadanieDeadline ?? "").trim() || null,
      typ_zadania: "czat_kr",
      opis: `Utworzono z CZAT KR (${zlecajacy}).`,
    };
    setZapisZadania(true);
    setMsg(null);
    const { error } = await supabase.from("zadania").insert([payload]).select("id").single();
    setZapisZadania(false);
    if (error) {
      setMsg(`Nie udało się utworzyć zadania: ${error.message}`);
      return;
    }
    if (kr && czyMozePisac && !brakTabeli) {
      const info = `✅ Zadanie dla ${etykietaPracownika(osoba || { nr: nrOdp, imie_nazwisko: nazwaOsoby })}: ${tytul}`;
      const { data } = await supabase
        .from("kr_notatka")
        .insert([
          {
            kr,
            tresc: info,
            autor: zlecajacy,
            autor_email: String(autorEmail ?? "").trim() || null,
          },
        ])
        .select("id, kr, tresc, autor, autor_email, created_at")
        .single();
      if (data) setWpisy((prev) => [data, ...prev]);
    }
    setZadanieTytul("");
    setZadanieDeadline("");
    setPokazZadanie(false);
    setMsg(`Utworzono zadanie dla ${nazwaOsoby}${kr ? ` (KR ${kr})` : ""}.`);
  }

  const inputSt = {
    width: "100%",
    boxSizing: "border-box",
    padding: "0.35rem 0.5rem",
    borderRadius: 8,
    border: LIGHT.inputBorder,
    background: "#fff",
    color: LIGHT.text,
    font: "inherit",
    fontSize: "0.82rem",
  };

  return (
    <div
      id="czat-kr"
      style={{
        marginTop: "0.85rem",
        border: LIGHT.panelBorder,
        borderRadius: 14,
        background: LIGHT.panelBg,
        padding: "0.9rem 1rem 1rem",
        color: LIGHT.text,
        boxShadow: "0 10px 28px -18px rgba(3,105,161,0.55)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", flexWrap: "wrap" }}>
        <div>
          <strong style={{ fontSize: "1.05rem", color: LIGHT.accent }}>CZAT KR</strong>
          <div style={{ fontSize: "0.78rem", color: LIGHT.soft, marginTop: 4 }}>
            Po lewej wybierz numer KR, potem notuj. Przy wpisie: Edytuj wpis (treść i godzinę).
          </div>
        </div>
        <button
          type="button"
          onClick={() => void fetchWpisy()}
          style={{
            background: "#fff",
            border: LIGHT.cardBorder,
            borderRadius: 8,
            color: LIGHT.text,
            fontSize: "0.75rem",
            padding: "0.25rem 0.55rem",
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          Odśwież
        </button>
      </div>

      {brakTabeli ? (
        <div
          style={{
            marginTop: "0.65rem",
            padding: "0.5rem 0.65rem",
            borderRadius: 8,
            background: LIGHT.dangerBg,
            border: LIGHT.dangerBorder,
            color: LIGHT.dangerText,
            fontSize: "0.8rem",
          }}
          role="alert"
        >
          Brak tabeli w bazie. Uruchom w Supabase SQL Editor:{" "}
          <code style={{ background: "#fee2e2", padding: "0.05rem 0.25rem", borderRadius: 4 }}>
            g4-app/supabase/kr-notatki-czat.sql
          </code>
        </div>
      ) : null}

      {err ? (
        <div style={{ marginTop: "0.5rem", color: LIGHT.dangerText, fontSize: "0.8rem" }}>{err}</div>
      ) : null}
      {msg ? (
        <div style={{ marginTop: "0.5rem", color: LIGHT.ok, fontSize: "0.8rem" }}>{msg}</div>
      ) : null}

      {czyMozePisac && !brakTabeli ? (
        <div
          role="region"
          aria-label="Spotkanie kierowników"
          style={{
            marginTop: "0.65rem",
            padding: "0.75rem 0.8rem",
            borderRadius: 10,
            background: LIGHT.znacznikBg,
            border: LIGHT.spotkanieBorder,
            color: LIGHT.spotkanieText,
          }}
        >
          <strong style={{ fontSize: "1rem" }}>Spotkanie kierowników — zakres OD / DO</strong>
          <p style={{ margin: "0.4rem 0 0.65rem", fontSize: "0.82rem", lineHeight: 1.45 }}>
            Ustaw, od kiedy do kiedy trwało spotkanie (może być kilka godzin albo kilka dni wstecz).
            Potem kliknij pomarańczowy przycisk — Twoje wpisy z tego czasu (np. „Monika Jakubowska”)
            zamienią się na <strong>Notatka ze spotkania kierowników</strong>.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
              gap: "0.65rem",
              marginBottom: "0.65rem",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "flex-end" }}>
              <label style={{ display: "grid", gap: 4, fontSize: "0.8rem", fontWeight: 800 }}>
                OD — data
                <input
                  type="date"
                  value={spotkanieData}
                  onChange={(e) => setSpotkanieData(e.target.value)}
                  style={{
                    ...inputSt,
                    width: "11.5rem",
                    fontSize: "1rem",
                    fontWeight: 700,
                    padding: "0.4rem 0.5rem",
                    border: LIGHT.spotkanieBorder,
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: "0.8rem", fontWeight: 800 }}>
                OD — godzina
                <input
                  type="time"
                  value={spotkanieGodzina}
                  onChange={(e) => setSpotkanieGodzina(e.target.value)}
                  style={{
                    ...inputSt,
                    width: "8.5rem",
                    fontSize: "1rem",
                    fontWeight: 700,
                    padding: "0.4rem 0.5rem",
                    border: LIGHT.spotkanieBorder,
                  }}
                />
              </label>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "flex-end" }}>
              <label style={{ display: "grid", gap: 4, fontSize: "0.8rem", fontWeight: 800 }}>
                DO — data
                <input
                  type="date"
                  value={spotkanieDataDo}
                  onChange={(e) => setSpotkanieDataDo(e.target.value)}
                  style={{
                    ...inputSt,
                    width: "11.5rem",
                    fontSize: "1rem",
                    fontWeight: 700,
                    padding: "0.4rem 0.5rem",
                    border: LIGHT.spotkanieBorder,
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: "0.8rem", fontWeight: 800 }}>
                DO — godzina
                <input
                  type="time"
                  value={spotkanieGodzinaDo}
                  onChange={(e) => setSpotkanieGodzinaDo(e.target.value)}
                  style={{
                    ...inputSt,
                    width: "8.5rem",
                    fontSize: "1rem",
                    fontWeight: 700,
                    padding: "0.4rem 0.5rem",
                    border: LIGHT.spotkanieBorder,
                  }}
                />
              </label>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            <button
              type="button"
              disabled={wysylanie || przepisBusy}
              onClick={() => void zamienMojeWpisyOdDo()}
              style={{
                background: "#c2410c",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: "0.92rem",
                fontWeight: 800,
                padding: "0.55rem 0.9rem",
                cursor: przepisBusy ? "wait" : "pointer",
              }}
            >
              {przepisBusy ? "Zamieniam wpisy…" : "Zamień moje wpisy OD–DO na notatki ze spotkania"}
            </button>
            <button
              type="button"
              disabled={wysylanie || przepisBusy}
              onClick={() => void (spotkanie.aktywne ? zakonczSpotkanie() : rozpocznijSpotkanie())}
              style={{
                background: "#fff",
                border: LIGHT.spotkanieBorder,
                borderRadius: 8,
                color: LIGHT.spotkanieText,
                fontSize: "0.82rem",
                fontWeight: 800,
                padding: "0.5rem 0.75rem",
                cursor: wysylanie ? "wait" : "pointer",
              }}
            >
              {spotkanie.aktywne ? "Zakończ spotkanie" : "Włącz tryb notowania"}
            </button>
          </div>
        </div>
      ) : null}

      <div
        className="czat-kr-split"
        style={{
          marginTop: "0.75rem",
          display: "grid",
          gridTemplateColumns: "minmax(7.5rem, 11rem) minmax(0, 1fr)",
          gap: "0.75rem",
          alignItems: "stretch",
          minHeight: "22rem",
        }}
      >
        {/* LEWA: lista KR */}
        <aside
          style={{
            border: LIGHT.cardBorder,
            borderRadius: 12,
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            minHeight: "22rem",
            maxHeight: "min(70vh, 36rem)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "0.55rem 0.6rem",
              borderBottom: LIGHT.cardBorder,
              background: LIGHT.accentSoft,
              fontWeight: 800,
              fontSize: "0.82rem",
              color: LIGHT.accent,
            }}
          >
            KR
          </div>
          <div style={{ padding: "0.45rem 0.5rem", borderBottom: LIGHT.cardBorder }}>
            <input
              style={{ ...inputSt, fontSize: "0.78rem" }}
              value={szukajKr}
              onChange={(e) => setSzukajKr(e.target.value)}
              placeholder="Szukaj KR…"
            />
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "0.25rem" }}>
            {listaKrLewa.length === 0 ? (
              <p style={{ margin: "0.5rem", fontSize: "0.78rem", color: LIGHT.soft }}>Brak projektów.</p>
            ) : (
              listaKrLewa.map((item) => {
                const aktywny = String(wybranyKr) === item.kr;
                return (
                  <button
                    key={item.kr}
                    type="button"
                    onClick={() => wybierzKr(item.kr)}
                    style={{
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.35rem",
                      textAlign: "left",
                      padding: "0.45rem 0.5rem",
                      marginBottom: 2,
                      border: aktywny ? `1px solid ${LIGHT.accent}` : "1px solid transparent",
                      borderRadius: 8,
                      background: aktywny ? LIGHT.accentSoft : "transparent",
                      color: LIGHT.text,
                      cursor: "pointer",
                      font: "inherit",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: aktywny ? LIGHT.accent : LIGHT.text,
                      }}
                    >
                      {item.kr}
                    </strong>
                    {item.count > 0 ? (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: LIGHT.soft,
                          background: "#f1f5f9",
                          borderRadius: 999,
                          padding: "0.05rem 0.35rem",
                        }}
                      >
                        {item.count}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* PRAWA: czat */}
        <section
          style={{
            border: LIGHT.cardBorder,
            borderRadius: 12,
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            minHeight: "22rem",
            maxHeight: "min(70vh, 36rem)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "0.55rem 0.75rem",
              borderBottom: LIGHT.cardBorder,
              background: LIGHT.accentSoft,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <strong style={{ fontSize: "0.95rem", color: LIGHT.accent }}>
              {wybranyKr ? `Czat · KR ${wybranyKr}` : "Czat"}
            </strong>
            {wybranyKr && typeof onOtworzKr === "function" ? (
              <button
                type="button"
                onClick={() => onOtworzKr(wybranyKr)}
                style={{
                  background: "#fff",
                  border: LIGHT.cardBorder,
                  borderRadius: 6,
                  color: LIGHT.accent,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "0.15rem 0.4rem",
                  cursor: "pointer",
                }}
              >
                Tablica KR
              </button>
            ) : null}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0.65rem 0.75rem", display: "grid", gap: "0.55rem" }}>
            {!wybranyKr ? (
              <p style={{ margin: 0, fontSize: "0.85rem", color: LIGHT.soft }}>Wybierz KR po lewej.</p>
            ) : loading ? (
              <p style={{ margin: 0, fontSize: "0.85rem", color: LIGHT.soft }}>Ładowanie…</p>
            ) : wpisyWybranego.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.85rem", color: LIGHT.soft }}>
                Brak wpisów w tym KR — napisz pierwszą wiadomość poniżej.
              </p>
            ) : (
              <>
                {widoczne.map((w) => {
                  const zeSpotkania = czyWpisSpotkania(w);
                  const znacznik = czyZnacznikPoczatek(w) || czyZnacznikKoniec(w);
                  return (
                  <div
                    key={w.id}
                    style={{
                      border: zeSpotkania ? LIGHT.spotkanieBorder : LIGHT.cardBorder,
                      borderRadius: 10,
                      background: znacznik ? LIGHT.znacznikBg : zeSpotkania ? LIGHT.spotkanieBg : "#f8fafc",
                      padding: "0.55rem 0.7rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "0.35rem 0.65rem",
                        marginBottom: "0.3rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: 800,
                          color: zeSpotkania ? LIGHT.spotkanieText : LIGHT.accent,
                          lineHeight: 1.25,
                        }}
                      >
                        {etykietaAutoraWpisu(w)}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: LIGHT.soft }}>
                        {formatData(w.created_at) || "—"}
                      </span>
                      {czyMozePisac && edycjaId !== w.id ? (
                        <button
                          type="button"
                          onClick={() => rozpocznijEdycje(w)}
                          style={{
                            marginLeft: "auto",
                            background: "#fff",
                            border: `1px solid ${LIGHT.accent}`,
                            borderRadius: 8,
                            color: LIGHT.accent,
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            padding: "0.2rem 0.55rem",
                            cursor: "pointer",
                          }}
                        >
                          Edytuj treść
                        </button>
                      ) : null}
                    </div>
                    {czyMozePisac && edycjaId !== w.id ? (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "flex-end",
                          gap: "0.4rem",
                          marginBottom: "0.45rem",
                          padding: "0.4rem 0.45rem",
                          borderRadius: 8,
                          background: "#fff7ed",
                          border: "1px solid #fdba74",
                        }}
                      >
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#9a3412", width: "100%" }}>
                          Zmień datę i godzinę tego wpisu
                        </span>
                        <label style={{ display: "grid", gap: 2, fontSize: "0.7rem", fontWeight: 700, color: "#9a3412" }}>
                          Data
                          <input
                            type="date"
                            value={polaGodzinyWpisu(w).data}
                            onChange={(e) => ustawGodzineDraft(w, { data: e.target.value })}
                            style={{
                              ...inputSt,
                              width: "11rem",
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              padding: "0.35rem 0.4rem",
                              border: "1px solid #fb923c",
                            }}
                          />
                        </label>
                        <label style={{ display: "grid", gap: 2, fontSize: "0.7rem", fontWeight: 700, color: "#9a3412" }}>
                          Godzina
                          <input
                            type="time"
                            value={polaGodzinyWpisu(w).godzina}
                            onChange={(e) => ustawGodzineDraft(w, { godzina: e.target.value })}
                            style={{
                              ...inputSt,
                              width: "8rem",
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              padding: "0.35rem 0.4rem",
                              border: "1px solid #fb923c",
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          disabled={zapisGodzinyId === w.id}
                          onClick={() => void zapiszGodzineWpisu(w)}
                          style={{
                            background: "#c2410c",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            fontSize: "0.8rem",
                            fontWeight: 800,
                            padding: "0.4rem 0.7rem",
                            cursor: zapisGodzinyId === w.id ? "wait" : "pointer",
                          }}
                        >
                          {zapisGodzinyId === w.id ? "Zapisuję godzinę…" : "Zapisz godzinę"}
                        </button>
                      </div>
                    ) : null}
                    {edycjaId === w.id ? (
                      <div style={{ display: "grid", gap: "0.4rem" }}>
                        <textarea
                          value={edycjaTresc}
                          onChange={(e) => setEdycjaTresc(e.target.value)}
                          rows={3}
                          disabled={zapisywanieEdycji}
                          style={{ ...inputSt, resize: "vertical", minHeight: "3.2rem", fontSize: "0.9rem" }}
                        />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                          <label style={{ display: "grid", gap: 2, fontSize: "0.72rem", fontWeight: 700, color: LIGHT.muted }}>
                            Data wpisu
                            <input
                              type="date"
                              value={edycjaData}
                              onChange={(e) => setEdycjaData(e.target.value)}
                              style={{ ...inputSt, width: "11rem" }}
                            />
                          </label>
                          <label style={{ display: "grid", gap: 2, fontSize: "0.72rem", fontWeight: 700, color: LIGHT.muted }}>
                            Godzina wpisu
                            <input
                              type="time"
                              value={edycjaGodzina}
                              onChange={(e) => setEdycjaGodzina(e.target.value)}
                              style={{ ...inputSt, width: "8rem" }}
                            />
                          </label>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                          <button
                            type="button"
                            disabled={zapisywanieEdycji || !edycjaTresc.trim()}
                            onClick={() => void zapiszEdycje()}
                            style={{
                              background: LIGHT.accent,
                              color: "#fff",
                              border: "none",
                              borderRadius: 8,
                              padding: "0.3rem 0.7rem",
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              cursor: zapisywanieEdycji ? "wait" : "pointer",
                              opacity: zapisywanieEdycji || !edycjaTresc.trim() ? 0.65 : 1,
                            }}
                          >
                            {zapisywanieEdycji ? "Zapisywanie…" : "Zapisz"}
                          </button>
                          <button
                            type="button"
                            disabled={zapisywanieEdycji}
                            onClick={anulujEdycje}
                            style={{
                              background: "#fff",
                              border: LIGHT.cardBorder,
                              borderRadius: 8,
                              padding: "0.3rem 0.7rem",
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              cursor: "pointer",
                              color: LIGHT.text,
                            }}
                          >
                            Anuluj
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ whiteSpace: "pre-wrap", fontSize: "0.92rem", lineHeight: 1.45, color: LIGHT.text }}>
                          {w.tresc}
                        </div>
                        {mozeZadania ? (
                          <button
                            type="button"
                            onClick={() => {
                              setZadanieTytul(String(w.tresc ?? "").slice(0, 200));
                              setPokazZadanie(true);
                            }}
                            style={{
                              marginTop: "0.4rem",
                              background: "none",
                              border: "none",
                              padding: 0,
                              color: LIGHT.accent,
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            Utwórz zadanie z tej wiadomości
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                  );
                })}
                {wpisyWybranego.length > 12 ? (
                  <button
                    type="button"
                    onClick={() => setRozwiniete((v) => !v)}
                    style={{
                      justifySelf: "start",
                      background: "none",
                      border: "none",
                      color: LIGHT.accent,
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    {rozwiniete ? "Zwiń" : `Pokaż starsze (${wpisyWybranego.length - 12})`}
                  </button>
                ) : null}
              </>
            )}
          </div>

          {czyMozePisac && !brakTabeli && wybranyKr && !czyKrPlaceholder(wybranyKr) ? (
            <form
              onSubmit={(e) => void wyslij(e)}
              style={{
                borderTop: LIGHT.cardBorder,
                padding: "0.65rem 0.75rem",
                display: "grid",
                gap: "0.4rem",
                background: spotkanie.aktywne ? LIGHT.spotkanieBg : "#fff",
              }}
            >
              {spotkanie.aktywne ? (
                <label style={{ display: "grid", gap: 4, fontSize: "0.8rem", fontWeight: 800, color: LIGHT.spotkanieText, justifySelf: "start" }}>
                  Godzina tej notatki
                  <input
                    type="time"
                    value={notatkaGodzina}
                    onChange={(e) => setNotatkaGodzina(e.target.value)}
                    style={{
                      ...inputSt,
                      width: "8.5rem",
                      fontSize: "1rem",
                      fontWeight: 700,
                      padding: "0.4rem 0.5rem",
                      border: LIGHT.spotkanieBorder,
                    }}
                  />
                </label>
              ) : null}
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                disabled={wysylanie}
                placeholder={
                  spotkanie.aktywne
                    ? `Notatka ze spotkania · KR ${wybranyKr}…`
                    : `Wpis do KR ${wybranyKr}…`
                }
                style={{ ...inputSt, resize: "vertical", minHeight: "2.8rem", fontSize: "0.9rem" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    void wyslij();
                  }
                }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", alignItems: "center" }}>
                <button
                  type="submit"
                  disabled={wysylanie || !draft.trim()}
                  style={{
                    background: LIGHT.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "0.4rem 0.85rem",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                    cursor: wysylanie ? "wait" : "pointer",
                    opacity: wysylanie || !draft.trim() ? 0.65 : 1,
                  }}
                >
                  {wysylanie ? "Wysyłanie…" : spotkanie.aktywne ? "Dodaj notatkę ze spotkania" : "Dodaj wpis"}
                </button>
                {mozeZadania ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPokazZadanie((v) => !v);
                      if (!pokazZadanie && draft.trim()) setZadanieTytul(draft.trim().slice(0, 200));
                    }}
                    style={{
                      background: "#fff",
                      border: `1px solid ${LIGHT.accent}`,
                      color: LIGHT.accent,
                      borderRadius: 8,
                      padding: "0.4rem 0.75rem",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                    }}
                  >
                    {pokazZadanie ? "Ukryj zadanie" : "＋ Dodaj zadanie"}
                  </button>
                ) : null}
                {typeof onDodajFaktureDoPlanu === "function" && wybranyKr ? (
                  <button
                    type="button"
                    onClick={() => {
                      const krRec =
                        (krList ?? []).find(
                          (r) => String(r.kr ?? "").trim() === String(wybranyKr).trim(),
                        ) ?? null;
                      const klient = String(krRec?.nazwa_obiektu ?? "").trim();
                      const nrOp =
                        krRec?.osoba_prowadzaca != null
                          ? String(krRec.osoba_prowadzaca).trim()
                          : "";
                      const prowadzacy = nrOp
                        ? (pracownicy ?? []).find((p) => String(p.nr ?? "").trim() === nrOp)
                        : null;
                      const odpowiedzialny = prowadzacy?.imie_nazwisko
                        ? String(prowadzacy.imie_nazwisko).trim()
                        : nrOp;
                      onDodajFaktureDoPlanu({
                        kr: String(wybranyKr).trim(),
                        klient,
                        opis: draft.trim().slice(0, 400),
                        odpowiedzialny,
                      });
                    }}
                    style={{
                      background: "#fff",
                      border: `1px solid ${LIGHT.accent}`,
                      color: LIGHT.accent,
                      borderRadius: 8,
                      padding: "0.4rem 0.75rem",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                    }}
                  >
                    ＋ Dodaj fakt
                  </button>
                ) : null}
                <span style={{ fontSize: "0.7rem", color: LIGHT.soft }}>Ctrl+Enter</span>
              </div>
            </form>
          ) : !brakTabeli && !czyMozePisac ? (
            <p style={{ margin: "0.65rem 0.75rem", fontSize: "0.8rem", color: LIGHT.soft }}>
              Zaloguj się, aby dodać wpis.
            </p>
          ) : null}
        </section>
      </div>

      {pokazZadanie && mozeZadania && !brakTabeli ? (
        <form
          onSubmit={(e) => void utworzZadanie(e)}
          style={{
            marginTop: "0.75rem",
            padding: "0.7rem 0.75rem",
            borderRadius: 12,
            border: "1px solid #7dd3fc",
            background: "#fff",
            display: "grid",
            gap: "0.45rem",
          }}
        >
          <strong style={{ fontSize: "0.88rem", color: LIGHT.accent }}>
            Zadanie{wybranyKr ? ` · KR ${wybranyKr}` : ""} — osoby z dostępem do aplikacji
          </strong>
          <p style={{ margin: 0, fontSize: "0.75rem", color: LIGHT.soft }}>
            Zespół: {etykietaZespolu}. Lista = realne rekordy z tabeli pracownik (nr).
          </p>
          <label style={{ fontSize: "0.75rem", color: LIGHT.muted, display: "grid", gap: 4 }}>
            Zadanie *
            <input
              style={inputSt}
              value={zadanieTytul}
              onChange={(e) => setZadanieTytul(e.target.value)}
              placeholder="Co trzeba zrobić?"
              required
            />
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(12rem, 1fr))",
              gap: "0.45rem",
            }}
          >
            <label style={{ fontSize: "0.75rem", color: LIGHT.muted, display: "grid", gap: 4 }}>
              Dla kogo * (pracownik.nr)
              <select
                style={inputSt}
                value={zadanieDlaNr}
                onChange={(e) => setZadanieDlaNr(e.target.value)}
                required
              >
                <option value="">— wybierz osobę —</option>
                {zespolDoZadan.map((p) => (
                  <option key={normalizujNr(p.nr)} value={normalizujNr(p.nr)}>
                    {etykietaPracownika(p)}
                    {p.auth_user_id ? "" : " (bez logowania)"}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: "0.75rem", color: LIGHT.muted, display: "grid", gap: 4 }}>
              Deadline
              <input
                style={inputSt}
                type="date"
                value={zadanieDeadline}
                onChange={(e) => setZadanieDeadline(e.target.value)}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={zapisZadania || !zadanieTytul.trim()}
            style={{
              justifySelf: "start",
              background: LIGHT.accent,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.4rem 0.85rem",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: zapisZadania ? "wait" : "pointer",
              opacity: zapisZadania || !zadanieTytul.trim() ? 0.65 : 1,
            }}
          >
            {zapisZadania ? "Zapisywanie…" : "Zapisz zadanie"}
          </button>
        </form>
      ) : null}

      <style>{`
        @media (max-width: 720px) {
          .czat-kr-split { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/** @deprecated */
export const KierownictwoCzatPanel = CzatKrPanel;
export const CZAT_KR_ZADANIA_OSOBY = CZAT_KR_TEAM_NR;
export const KIEROWNICTWO_CZAT_OSOBY = CZAT_KR_TEAM_NR;
export const czyDostepCzatKierownictwa = czyMozeDodawacZadaniaZCzatKr;
