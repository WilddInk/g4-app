import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KrNotatkiCzat } from "./KrNotatkiCzat.jsx";

const HORYZONTY = ["2026-07", "2026-08", "2026-09", "2026-Q4", "2027", "inne"];

/** Klucz localStorage: plan_id → ISO ostatniego odczytu rozmowy. */
const STORAGE_CZAT_SEEN = "g4-plan-faktury-czat-seen";

/** Normalizacja horyzontu do RRRR-MM (sortowalne leksykograficznie). */
function horyzontNaRRRRMM(h) {
  const raw = String(h ?? "").trim();
  if (!raw || raw === "inne") return "9999-12";
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  const q = raw.match(/^(\d{4})-Q([1-4])$/i);
  if (q) {
    // Q4 (= „koniec roku”) → MM-12; pozostałe kwartały → pierwszy miesiąc
    const qq = Number(q[2]);
    const mm = qq === 4 ? "12" : String((qq - 1) * 3 + 1).padStart(2, "0");
    return `${q[1]}-${mm}`;
  }
  if (/^\d{4}$/.test(raw)) return `${raw}-01`;
  return raw;
}

/** Wyświetlanie horyzontu: zawsze RRRR-MM (albo „—” dla „inne”). */
function formatHoryzont(h) {
  const raw = String(h ?? "").trim();
  if (!raw || raw === "inne") return "—";
  return horyzontNaRRRRMM(raw);
}

function wczytajCzatSeen() {
  try {
    const raw = localStorage.getItem(STORAGE_CZAT_SEEN);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function zapiszCzatSeen(map) {
  try {
    localStorage.setItem(STORAGE_CZAT_SEEN, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

const BLOKER_LABEL = {
  czeka_protokol: "Czeka na protokół",
  czeka_klauzule: "Czeka na klauzulę / ZRID",
  czeka_zielone: "Czeka na zielone światło",
  ustalic_kwote: "Ustalić kwotę",
  waloryzacja: "Waloryzacja",
  brak: "Brak blokady",
  inne: "Inne",
};

const BLOKER_OPCJE = Object.keys(BLOKER_LABEL);

function pustyFormularzNowej() {
  return {
    kr: "",
    klient: "",
    opis: "",
    horyzont: "2026-07",
    horyzontCustom: "",
    kwota_netto: "",
    bloker: "brak",
    odpowiedzialny: "",
    mozna_fakturowac: false,
  };
}

function wierszDoFormularza(row) {
  const h = String(row?.horyzont ?? "").trim();
  const jestNaLiscie = HORYZONTY.includes(h);
  return {
    kr: row?.kr != null ? String(row.kr) : "",
    klient: row?.klient != null ? String(row.klient) : "",
    opis: row?.opis != null ? String(row.opis) : "",
    horyzont: jestNaLiscie ? h : h ? "__custom__" : "2026-07",
    horyzontCustom: jestNaLiscie || !h ? "" : /^\d{4}-\d{2}$/.test(h) ? h : "",
    kwota_netto:
      row?.kwota_netto != null && row.kwota_netto !== ""
        ? String(row.kwota_netto).replace(".", ",")
        : "",
    bloker: String(row?.bloker ?? "").trim() || "brak",
    odpowiedzialny: row?.odpowiedzialny != null ? String(row.odpowiedzialny) : "",
    mozna_fakturowac: Boolean(row?.mozna_fakturowac),
  };
}

function parsujPayloadZFormu(form) {
  const opis = String(form.opis ?? "").trim();
  if (!opis) return { ok: false, message: "Podaj opis faktury." };
  let horyzont = String(form.horyzont ?? "").trim();
  if (horyzont === "__custom__") {
    horyzont = String(form.horyzontCustom ?? "").trim();
  }
  if (!horyzont) return { ok: false, message: "Wybierz horyzont (RRRR-MM)." };
  if (!/^\d{4}-\d{2}$/.test(horyzont) && !HORYZONTY.includes(horyzont) && horyzont !== "inne") {
    return { ok: false, message: "Horyzont musi być w formacie RRRR-MM (np. 2026-08)." };
  }
  const kwotaRaw = String(form.kwota_netto ?? "").trim().replace(/\s/g, "").replace(",", ".");
  let kwota_netto = null;
  if (kwotaRaw) {
    const n = Number(kwotaRaw);
    if (!Number.isFinite(n)) return { ok: false, message: "Kwota netto jest nieprawidłowa." };
    kwota_netto = n;
  }
  const mozna = Boolean(form.mozna_fakturowac);
  return {
    ok: true,
    payload: {
      kr: String(form.kr ?? "").trim() || null,
      klient: String(form.klient ?? "").trim() || null,
      opis,
      horyzont,
      kwota_netto,
      bloker: String(form.bloker ?? "").trim() || "brak",
      odpowiedzialny: String(form.odpowiedzialny ?? "").trim() || null,
      mozna_fakturowac: mozna,
      status: mozna ? "gotowe_do_fs" : "plan",
    },
  };
}

const inputStyleNowa = {
  width: "100%",
  boxSizing: "border-box",
  padding: "0.3rem 0.45rem",
  borderRadius: 8,
  border: "1px solid #94a3b8",
  background: "#fff",
  color: "#0f172a",
  font: "inherit",
  fontSize: "0.8rem",
};

function formatPln(n) {
  if (n == null || n === "") return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
}

function formatDataUwag(iso) {
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

function skrotTekstu(tekst, max = 90) {
  const t = String(tekst ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "—";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function czasWpisMs(iso) {
  const t = new Date(iso || 0).getTime();
  return Number.isFinite(t) ? t : 0;
}

function porownajTekst(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""), "pl", {
    sensitivity: "base",
    numeric: true,
  });
}

function wartoscSortPlanFaktur(row, key, komentarzeByPlan) {
  switch (key) {
    case "horyzont":
      return horyzontNaRRRRMM(row.horyzont);
    case "kr":
      return row.kr ?? "";
    case "klient":
      return row.klient ?? "";
    case "opis":
      return row.opis ?? "";
    case "kwota":
      return Number(row.kwota_netto) || 0;
    case "bloker":
      return BLOKER_LABEL[row.bloker] || row.bloker || "";
    case "odpowiedzialny":
      return row.odpowiedzialny ?? "";
    case "uwagi": {
      const lista = komentarzeByPlan?.[row.id] ?? [];
      if (lista.length) {
        const last = lista[lista.length - 1];
        return `${last.autor || ""} ${last.tresc || ""}`;
      }
      return row.uwagi ?? "";
    }
    case "mozna_fakturowac":
      return row.mozna_fakturowac ? 1 : 0;
    default:
      return "";
  }
}

const KOLUMNY_SORT_PLAN = [
  { key: "horyzont", label: "Horyzont" },
  { key: "kr", label: "KR" },
  { key: "klient", label: "Klient" },
  { key: "opis", label: "Opis" },
  { key: "uwagi", label: "Uwagi / rozmowa" },
  { key: "kwota", label: "Kwota" },
  { key: "bloker", label: "Bloker" },
  { key: "odpowiedzialny", label: "Odpowiedzialny" },
  { key: "mozna_fakturowac", label: "Można fakturować" },
];

/** Jasna kolorystyka panelu — czarny tekst, lepsza czytelność rozmów. */
const LIGHT = {
  panelBg: "#f8fafc",
  panelBorder: "1px solid #cbd5e1",
  text: "#0f172a",
  muted: "#475569",
  soft: "#64748b",
  title: "#0f172a",
  accent: "#0369a1",
  accentSoft: "#e0f2fe",
  cardBg: "#ffffff",
  cardBorder: "1px solid #cbd5e1",
  chatClosedBg: "#ffffff",
  chatClosedBorder: "1px dashed #94a3b8",
  chatOpenBg: "#f1f5f9",
  bubbleBg: "#ffffff",
  bubbleBorder: "1px solid #e2e8f0",
  inputBg: "#ffffff",
  inputBorder: "1px solid #94a3b8",
  rowReady: "rgba(22,163,74,0.12)",
  rowFocus: "rgba(14,165,233,0.18)",
  rowFocusOutline: "2px solid #0284c7",
  readyText: "#166534",
  danger: "#b91c1c",
  thBg: "#e2e8f0",
  tdBorder: "1px solid #e2e8f0",
  msgOk: "#166534",
};

/**
 * Kolejka planowanych faktur sprzedażowych.
 * Uwagi = wątek rozmowy (każdy wpis osobno: kto / kiedy / treść).
 */
export function PlanFakturPanel({
  supabase,
  styles: s,
  op,
  czyMozeEdytowac,
  czyMozeEdytowacUwagi,
  autorUwagiNazwa,
  autorUwagiEmail,
  /** Otwórz pełną Tablicę KR (czat na górze karty projektu). */
  onOtworzCzatKr,
}) {
  const [rows, setRows] = useState([]);
  const [komentarzeByPlan, setKomentarzeByPlan] = useState({});
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtrHoryzont, setFiltrHoryzont] = useState("wszystkie");
  const [tylkoGotowe, setTylkoGotowe] = useState(false);
  const [tylkoBlokady, setTylkoBlokady] = useState(false);
  const [sort, setSort] = useState({ key: "horyzont", dir: "asc" });
  const [draftByPlan, setDraftByPlan] = useState({});
  const [otwartyCzatId, setOtwartyCzatId] = useState(null);
  const [wysylanieId, setWysylanieId] = useState(null);
  const [brakTabeliCzat, setBrakTabeliCzat] = useState(false);
  const [podswietlonyPlanId, setPodswietlonyPlanId] = useState(null);
  const [czatSeen, setCzatSeen] = useState(() => wczytajCzatSeen());
  const [rozwinOstatnieWpisy, setRozwinOstatnieWpisy] = useState(false);
  const [pokazFormularzNowej, setPokazFormularzNowej] = useState(false);
  const [formNowa, setFormNowa] = useState(() => pustyFormularzNowej());
  const [edycjaId, setEdycjaId] = useState(null);
  const [zapisNowej, setZapisNowej] = useState(false);
  const [czatKrKod, setCzatKrKod] = useState(null);
  const czatKrRef = useRef(null);
  const rowRefs = useRef({});
  const podswietlenieTimer = useRef(null);

  const fetchKomentarze = useCallback(
    async (planIds) => {
      const ids = [...new Set((planIds ?? []).map((x) => Number(x)).filter((n) => Number.isFinite(n)))];
      if (ids.length === 0) {
        setKomentarzeByPlan({});
        return;
      }
      const { data, error } = await supabase
        .from("kr_plan_faktury_komentarz")
        .select("id, plan_id, tresc, autor, autor_email, created_at")
        .in("plan_id", ids)
        .order("created_at", { ascending: true });
      if (error) {
        const m = String(error.message ?? "");
        if (/kr_plan_faktury_komentarz|schema cache|PGRST205|does not exist/i.test(m)) {
          setBrakTabeliCzat(true);
          setKomentarzeByPlan({});
          return;
        }
        setMsg(`Nie udało się wczytać rozmowy: ${m}`);
        return;
      }
      setBrakTabeliCzat(false);
      const map = {};
      for (const k of data ?? []) {
        const pid = k.plan_id;
        if (!map[pid]) map[pid] = [];
        map[pid].push(k);
      }
      setKomentarzeByPlan(map);
    },
    [supabase],
  );

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("kr_plan_faktury")
      .select("*")
      .order("horyzont", { ascending: true })
      .order("kr", { ascending: true });
    if (error) {
      setLoading(false);
      const m = String(error.message ?? "");
      setErr(
        /kr_plan_faktury|schema cache|PGRST205|does not exist/i.test(m)
          ? "Brak tabeli kr_plan_faktury. Uruchom w Supabase SQL: g4-app/supabase/kr-plan-faktury.sql oraz kr-plan-faktury-seed.sql"
          : m,
      );
      setRows([]);
      setKomentarzeByPlan({});
      return;
    }
    const list = data ?? [];
    setRows(list);
    await fetchKomentarze(list.map((r) => r.id));
    setLoading(false);
  }, [supabase, fetchKomentarze]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  /** Pierwsze uruchomienie w przeglądarce: istniejące wpisy = przeczytane; pogrubienie tylko dla nowych. */
  useEffect(() => {
    if (loading) return;
    if (localStorage.getItem(STORAGE_CZAT_SEEN) != null) return;
    const map = {};
    for (const row of rows ?? []) {
      const lista = komentarzeByPlan[row.id] ?? [];
      let maxIso = "";
      let maxMs = 0;
      for (const w of lista) {
        const ms = czasWpisMs(w.created_at);
        if (ms > maxMs) {
          maxMs = ms;
          maxIso = w.created_at || "";
        }
      }
      if (maxIso) map[String(row.id)] = maxIso;
    }
    zapiszCzatSeen(map);
    setCzatSeen(map);
  }, [loading, rows, komentarzeByPlan]);

  const filtered = useMemo(() => {
    return (rows ?? []).filter((r) => {
      if (filtrHoryzont !== "wszystkie" && r.horyzont !== filtrHoryzont) return false;
      if (tylkoGotowe && !r.mozna_fakturowac) return false;
      if (tylkoBlokady && r.mozna_fakturowac) return false;
      return true;
    });
  }, [rows, filtrHoryzont, tylkoGotowe, tylkoBlokady]);

  const filteredSorted = useMemo(() => {
    const list = [...filtered];
    const { key, dir } = sort;
    const mnoznik = dir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      const va = wartoscSortPlanFaktur(a, key, komentarzeByPlan);
      const vb = wartoscSortPlanFaktur(b, key, komentarzeByPlan);
      let cmp;
      if (typeof va === "number" && typeof vb === "number") {
        cmp = va - vb;
      } else {
        cmp = porownajTekst(va, vb);
      }
      if (cmp !== 0) return cmp * mnoznik;
      return porownajTekst(a.kr, b.kr) || Number(a.id) - Number(b.id);
    });
    return list;
  }, [filtered, sort, komentarzeByPlan]);

  const sumy = useMemo(() => {
    let total = 0;
    let gotowe = 0;
    for (const r of filtered) {
      const kw = Number(r.kwota_netto) || 0;
      total += kw;
      if (r.mozna_fakturowac) gotowe += kw;
    }
    return { total, gotowe };
  }, [filtered]);

  const horyzontyFiltr = useMemo(() => {
    const set = new Set(HORYZONTY);
    for (const r of rows ?? []) {
      const h = String(r.horyzont ?? "").trim();
      if (h) set.add(h);
    }
    return [...set].sort((a, b) => porownajTekst(horyzontNaRRRRMM(a), horyzontNaRRRRMM(b)));
  }, [rows]);

  function przestawSort(kolumna) {
    setSort((prev) => {
      if (prev.key === kolumna) {
        return { key: kolumna, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { key: kolumna, dir: "asc" };
    });
  }

  async function toggleMozna(id, next) {
    if (!czyMozeEdytowac) {
      alert("Zmianę mogą zapisać kierownik lub administrator.");
      return;
    }
    setMsg(null);
    const payload = {
      mozna_fakturowac: Boolean(next),
      status: next ? "gotowe_do_fs" : "blokada",
    };
    const { error } = await supabase.from("kr_plan_faktury").update(payload).eq("id", id);
    if (error) {
      setMsg(`Nie udało się zapisać: ${error.message}`);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...payload } : r)));
    setMsg(next ? "Oznaczono: można fakturować." : "Cofnięto zgodę na fakturowanie.");
  }

  async function usunPlan(row) {
    if (!czyMozeEdytowac) {
      alert("Usuwać pozycje z planu mogą kierownik lub administrator.");
      return;
    }
    const kr = String(row?.kr ?? "").trim() || "—";
    const opis = String(row?.opis ?? "").trim();
    const ok = window.confirm(
      `Usunąć z planu faktur?\n\nKR ${kr}${opis ? ` — ${opis}` : ""}\n\n` +
        `Użyj tego, gdy FS już wystawiona (pozycja nie jest już planowana).`,
    );
    if (!ok) return;
    setMsg(null);
    const { error } = await supabase.from("kr_plan_faktury").delete().eq("id", row.id);
    if (error) {
      setMsg(`Nie udało się usunąć: ${error.message}`);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setKomentarzeByPlan((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
    if (otwartyCzatId === row.id) setOtwartyCzatId(null);
    setMsg(`Usunięto z planu: KR ${kr}.`);
  }

  function zamknijFormularzPlanu() {
    setPokazFormularzNowej(false);
    setEdycjaId(null);
    setFormNowa(pustyFormularzNowej());
  }

  function otworzNowaPozycje() {
    setEdycjaId(null);
    setFormNowa(pustyFormularzNowej());
    setPokazFormularzNowej(true);
    setMsg(null);
  }

  function otworzEdycjePozycji(row) {
    if (!czyMozeEdytowac) {
      alert("Edytować plan mogą kierownik lub administrator.");
      return;
    }
    setEdycjaId(row.id);
    setFormNowa(wierszDoFormularza(row));
    setPokazFormularzNowej(true);
    setMsg(null);
    window.requestAnimationFrame(() => {
      document.getElementById("plan-faktur-formularz")?.scrollIntoView?.({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function zapiszPozycjePlanu(e) {
    e?.preventDefault?.();
    if (!czyMozeEdytowac) {
      alert("Dodawać i edytować pozycje planu mogą kierownik lub administrator.");
      return;
    }
    const parsed = parsujPayloadZFormu(formNowa);
    if (!parsed.ok) {
      setMsg(parsed.message);
      return;
    }
    const payload =
      edycjaId != null
        ? parsed.payload
        : { ...parsed.payload, zrodlo: "reczne" };
    setMsg(null);
    setZapisNowej(true);
    if (edycjaId != null) {
      const { data, error } = await supabase
        .from("kr_plan_faktury")
        .update(payload)
        .eq("id", edycjaId)
        .select("*")
        .single();
      setZapisNowej(false);
      if (error) {
        setMsg(`Nie udało się zapisać zmian: ${error.message}`);
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === edycjaId ? { ...r, ...data } : r)));
      setPodswietlonyPlanId(edycjaId);
      if (podswietlenieTimer.current) clearTimeout(podswietlenieTimer.current);
      podswietlenieTimer.current = window.setTimeout(() => {
        setPodswietlonyPlanId((cur) => (cur === edycjaId ? null : cur));
      }, 2600);
      zamknijFormularzPlanu();
      setMsg(`Zapisano zmiany (KR ${payload.kr || "—"}).`);
      return;
    }
    const { data, error } = await supabase.from("kr_plan_faktury").insert([payload]).select("*").single();
    setZapisNowej(false);
    if (error) {
      setMsg(`Nie udało się dodać faktury: ${error.message}`);
      return;
    }
    setRows((prev) => [...prev, data]);
    setPodswietlonyPlanId(data.id);
    if (podswietlenieTimer.current) clearTimeout(podswietlenieTimer.current);
    podswietlenieTimer.current = window.setTimeout(() => {
      setPodswietlonyPlanId((cur) => (cur === data.id ? null : cur));
    }, 2600);
    zamknijFormularzPlanu();
    setMsg(
      payload.mozna_fakturowac
        ? `Dodano fakturę (KR ${payload.kr || "—"}) — oznaczono: można wystawić.`
        : `Dodano fakturę do planu (KR ${payload.kr || "—"}).`,
    );
  }

  function otworzCzatProjektu(krKod) {
    const k = String(krKod ?? "").trim();
    if (!k) {
      setMsg("Ta pozycja nie ma numeru KR — uzupełnij KR, żeby otworzyć czat projektu.");
      return;
    }
    setCzatKrKod(k);
    window.requestAnimationFrame(() => {
      czatKrRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    });
  }

  function wiadomosciDlaWiersza(row) {
    const zBazy = komentarzeByPlan[row.id] ?? [];
    if (zBazy.length > 0) return zBazy;
    const legacy = String(row.uwagi ?? "").trim();
    if (!legacy) return [];
    return [
      {
        id: `legacy-${row.id}`,
        plan_id: row.id,
        tresc: legacy,
        autor: row.uwagi_autor || null,
        autor_email: row.uwagi_autor_email || null,
        created_at: row.uwagi_zmieniono_at || row.updated_at || null,
        _legacy: true,
      },
    ];
  }

  async function wyslijWiadomosc(planId) {
    if (!czyMozeEdytowacUwagi) {
      alert("Wiadomości mogą dodawać zalogowane osoby.");
      return;
    }
    if (brakTabeliCzat) {
      setMsg(
        "Brak tabeli czatu. Uruchom w Supabase SQL: g4-app/supabase/kr-plan-faktury-komentarz-czat.sql",
      );
      return;
    }
    const tekst = String(draftByPlan[planId] ?? "").trim();
    if (!tekst) return;
    const autorNazwa =
      String(autorUwagiNazwa ?? "").trim() ||
      String(autorUwagiEmail ?? "").trim() ||
      "Zalogowany użytkownik";
    const autorEmail = String(autorUwagiEmail ?? "").trim() || null;
    const payload = {
      plan_id: planId,
      tresc: tekst,
      autor: autorNazwa,
      autor_email: autorEmail,
    };
    setMsg(null);
    setWysylanieId(planId);
    const { data, error } = await supabase
      .from("kr_plan_faktury_komentarz")
      .insert([payload])
      .select("id, plan_id, tresc, autor, autor_email, created_at")
      .single();
    setWysylanieId(null);
    if (error) {
      const m = String(error.message ?? "");
      if (/kr_plan_faktury_komentarz|schema cache|PGRST205|does not exist/i.test(m)) {
        setBrakTabeliCzat(true);
        setMsg(
          "Brak tabeli czatu. Uruchom w Supabase SQL: g4-app/supabase/kr-plan-faktury-komentarz-czat.sql",
        );
        return;
      }
      setMsg(`Nie udało się wysłać: ${m}`);
      return;
    }
    setKomentarzeByPlan((prev) => ({
      ...prev,
      [planId]: [...(prev[planId] ?? []), data],
    }));
    setDraftByPlan((prev) => ({ ...prev, [planId]: "" }));
    oznaczCzatPrzeczytany(planId, [...(komentarzeByPlan[planId] ?? []), data]);
    setMsg(`Dodano wpis — ${autorNazwa}.`);
  }

  const moznaUwagi = Boolean(czyMozeEdytowacUwagi);

  function oznaczCzatPrzeczytany(planId, wiadomosci) {
    const id = Number(planId);
    if (!Number.isFinite(id)) return;
    let maxIso = "";
    let maxMs = 0;
    for (const w of wiadomosci ?? []) {
      const ms = czasWpisMs(w.created_at);
      if (ms > maxMs) {
        maxMs = ms;
        maxIso = w.created_at || new Date(ms).toISOString();
      }
    }
    if (!maxIso) maxIso = new Date().toISOString();
    setCzatSeen((prev) => {
      const next = { ...prev, [String(id)]: maxIso };
      zapiszCzatSeen(next);
      return next;
    });
  }

  function czyRozmowaNieprzeczytana(planId, wiadomosci) {
    if (!wiadomosci?.length) return false;
    const lastMs = Math.max(...wiadomosci.map((w) => czasWpisMs(w.created_at)));
    if (!lastMs) return false;
    const seenIso = czatSeen[String(planId)];
    if (!seenIso) return true;
    return lastMs > czasWpisMs(seenIso);
  }

  const wszystkieOstatnieWpisy = useMemo(() => {
    const lista = [];
    for (const row of rows ?? []) {
      for (const w of wiadomosciDlaWiersza(row)) {
        lista.push({
          key: `${row.id}-${w.id}`,
          planId: row.id,
          kr: String(row.kr ?? "").trim() || "—",
          klient: String(row.klient ?? "").trim(),
          autor: String(w.autor || w.autor_email || "—").trim() || "—",
          created_at: w.created_at,
          tresc: w.tresc,
        });
      }
    }
    lista.sort((a, b) => czasWpisMs(b.created_at) - czasWpisMs(a.created_at));
    return lista;
  }, [rows, komentarzeByPlan]);

  const ostatnieWpisy = useMemo(() => {
    if (rozwinOstatnieWpisy) return wszystkieOstatnieWpisy;
    return wszystkieOstatnieWpisy.slice(0, 3);
  }, [wszystkieOstatnieWpisy, rozwinOstatnieWpisy]);

  function otworzRozmowe(planId) {
    const row = (rows ?? []).find((r) => r.id === planId);
    const wiadomosci = row ? wiadomosciDlaWiersza(row) : komentarzeByPlan[planId] ?? [];
    setOtwartyCzatId(planId);
    oznaczCzatPrzeczytany(planId, wiadomosci);
  }

  function przejdzDoWpis(planId) {
    setFiltrHoryzont("wszystkie");
    setTylkoGotowe(false);
    setTylkoBlokady(false);
    otworzRozmowe(planId);
    setPodswietlonyPlanId(planId);
    if (podswietlenieTimer.current) clearTimeout(podswietlenieTimer.current);
    window.requestAnimationFrame(() => {
      const el = rowRefs.current[planId];
      if (el?.scrollIntoView) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
    podswietlenieTimer.current = window.setTimeout(() => {
      setPodswietlonyPlanId((cur) => (cur === planId ? null : cur));
    }, 2600);
  }

  function renderCzatKomorka(row) {
    const wiadomosci = wiadomosciDlaWiersza(row);
    const otwarty = otwartyCzatId === row.id;
    const ostatnia = wiadomosci.length ? wiadomosci[wiadomosci.length - 1] : null;
    const nieprzeczytana = !otwarty && czyRozmowaNieprzeczytana(row.id, wiadomosci);

    return (
      <div style={{ display: "grid", gap: "0.35rem", minWidth: "14rem", maxWidth: "22rem" }}>
        {!otwarty ? (
          <button
            type="button"
            onClick={() => otworzRozmowe(row.id)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              background: LIGHT.chatClosedBg,
              border: LIGHT.chatClosedBorder,
              borderRadius: "8px",
              padding: "0.4rem 0.5rem",
              color: LIGHT.text,
              cursor: "pointer",
              font: "inherit",
              fontSize: "0.78rem",
              lineHeight: 1.35,
              fontWeight: nieprzeczytana ? 700 : 400,
            }}
          >
            {ostatnia ? (
              <>
                <span style={{ display: "block", whiteSpace: "pre-wrap" }}>
                  {String(ostatnia.tresc).slice(0, 120)}
                  {String(ostatnia.tresc).length > 120 ? "…" : ""}
                </span>
                <span
                  style={{
                    display: "block",
                    marginTop: "0.25rem",
                    fontSize: "0.7rem",
                    color: LIGHT.soft,
                    fontWeight: nieprzeczytana ? 700 : 400,
                  }}
                >
                  {ostatnia.autor || "—"} · {formatDataUwag(ostatnia.created_at) || "—"}
                  {wiadomosci.length > 1 ? ` · ${wiadomosci.length} wpisów` : ""}
                  {nieprzeczytana ? " · nieprzeczytane" : ""}
                  {" · otwórz rozmowę"}
                </span>
              </>
            ) : (
              <span style={{ color: LIGHT.accent, fontWeight: 400 }}>＋ Otwórz rozmowę / dodaj wpis…</span>
            )}
          </button>
        ) : (
          <div
            style={{
              border: LIGHT.cardBorder,
              borderRadius: "10px",
              background: LIGHT.chatOpenBg,
              padding: "0.45rem",
              display: "grid",
              gap: "0.4rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.4rem", alignItems: "center" }}>
              <strong style={{ fontSize: "0.75rem", color: LIGHT.accent }}>Rozmowa</strong>
              <button
                type="button"
                style={{
                  background: "#fff",
                  border: LIGHT.cardBorder,
                  borderRadius: "6px",
                  color: LIGHT.text,
                  fontSize: "0.7rem",
                  padding: "0.1rem 0.4rem",
                  cursor: "pointer",
                }}
                onClick={() => setOtwartyCzatId(null)}
              >
                Zwiń
              </button>
            </div>
            <div
              style={{
                maxHeight: "11rem",
                overflowY: "auto",
                display: "grid",
                gap: "0.4rem",
                paddingRight: "0.15rem",
              }}
            >
              {wiadomosci.length === 0 ? (
                <span style={{ fontSize: "0.75rem", color: LIGHT.soft }}>Brak wpisów — napisz pierwszą wiadomość.</span>
              ) : (
                wiadomosci.map((w) => (
                  <div
                    key={w.id}
                    style={{
                      padding: "0.35rem 0.45rem",
                      borderRadius: "8px",
                      background: LIGHT.bubbleBg,
                      border: LIGHT.bubbleBorder,
                    }}
                  >
                    <div style={{ fontSize: "0.68rem", color: LIGHT.soft, marginBottom: "0.15rem" }}>
                      <strong style={{ color: LIGHT.accent }}>{w.autor || w.autor_email || "—"}</strong>
                      {" · "}
                      {formatDataUwag(w.created_at) || "—"}
                      {w._legacy ? " · (stary wpis)" : ""}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", color: LIGHT.text, fontSize: "0.78rem" }}>{w.tresc}</div>
                  </div>
                ))
              )}
            </div>
            {moznaUwagi ? (
              <div style={{ display: "grid", gap: "0.3rem" }}>
                <textarea
                  value={draftByPlan[row.id] ?? ""}
                  onChange={(e) => setDraftByPlan((prev) => ({ ...prev, [row.id]: e.target.value }))}
                  rows={2}
                  disabled={wysylanieId === row.id}
                  placeholder="Napisz wiadomość…"
                  style={{
                    width: "100%",
                    resize: "vertical",
                    minHeight: "2.6rem",
                    padding: "0.35rem 0.45rem",
                    borderRadius: "8px",
                    border: LIGHT.inputBorder,
                    background: LIGHT.inputBg,
                    color: LIGHT.text,
                    font: "inherit",
                    fontSize: "0.78rem",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      void wyslijWiadomosc(row.id);
                    }
                  }}
                />
                <button
                  type="button"
                  style={{
                    background: LIGHT.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "0.74rem",
                    padding: "0.3rem 0.6rem",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                  disabled={wysylanieId === row.id || !(draftByPlan[row.id] ?? "").trim()}
                  onClick={() => void wyslijWiadomosc(row.id)}
                >
                  {wysylanieId === row.id ? "Wysyłanie…" : "Wyślij"}
                </button>
              </div>
            ) : (
              <span style={{ fontSize: "0.72rem", color: LIGHT.soft }}>Zaloguj się, aby dopisać wiadomość.</span>
            )}
          </div>
        )}
      </div>
    );
  }

  const thLight = {
    background: LIGHT.thBg,
    color: LIGHT.text,
    borderBottom: LIGHT.tdBorder,
    padding: "0.45rem 0.5rem",
    textAlign: "left",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };
  const tdLight = {
    color: LIGHT.text,
    borderBottom: LIGHT.tdBorder,
    padding: "0.45rem 0.5rem",
    verticalAlign: "top",
    background: "#fff",
  };

  return (
    <div
      style={{
        marginTop: "0.85rem",
        background: LIGHT.panelBg,
        border: LIGHT.panelBorder,
        borderRadius: "14px",
        padding: "0.9rem 1rem 1rem",
        color: LIGHT.text,
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "0.35rem", color: LIGHT.title, fontSize: "1.05rem" }}>
        Plan faktur sprzedażowych ({filtered.length})
      </h3>
      <p style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "0.84rem", maxWidth: "52rem", color: LIGHT.muted }}>
        Lista planowanych faktur. Kierownik/admin: <strong style={{ color: LIGHT.text }}>dodaje</strong> i{" "}
        <strong style={{ color: LIGHT.text }}>edytuje</strong> pozycje. Kolumna{" "}
        <strong style={{ color: LIGHT.text }}>Uwagi / rozmowa</strong> = czat przy pozycji FS.{" "}
        <strong style={{ color: LIGHT.text }}>Czat KR</strong> = wątek całego projektu.
      </p>

      {czatKrKod ? (
        <div ref={czatKrRef} style={{ marginBottom: "0.85rem" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.45rem",
              alignItems: "center",
              marginBottom: "0.45rem",
            }}
          >
            <strong style={{ fontSize: "0.84rem", color: LIGHT.text }}>
              Czat projektu KR {czatKrKod}
            </strong>
            {typeof onOtworzCzatKr === "function" ? (
              <button
                type="button"
                onClick={() => onOtworzCzatKr(czatKrKod)}
                style={{
                  background: "#fff",
                  border: LIGHT.cardBorder,
                  borderRadius: 6,
                  color: LIGHT.accent,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.15rem 0.45rem",
                  cursor: "pointer",
                }}
              >
                Otwórz Tablicę KR
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setCzatKrKod(null)}
              style={{
                marginLeft: "auto",
                background: "#fff",
                border: LIGHT.cardBorder,
                borderRadius: 6,
                color: LIGHT.text,
                fontSize: "0.75rem",
                padding: "0.15rem 0.45rem",
                cursor: "pointer",
              }}
            >
              Zamknij czat
            </button>
          </div>
          <KrNotatkiCzat
            supabase={supabase}
            kr={czatKrKod}
            czyMozeEdytowac={Boolean(czyMozeEdytowacUwagi)}
            autorNazwa={autorUwagiNazwa}
            autorEmail={autorUwagiEmail}
          />
        </div>
      ) : null}
      {brakTabeliCzat ? (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.55rem 0.7rem",
            borderRadius: "8px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
          }}
          role="alert"
        >
          Brak tabeli czatu w bazie. Uruchom w Supabase SQL Editor:{" "}
          <code style={{ background: "#fee2e2", padding: "0.05rem 0.25rem", borderRadius: 4 }}>
            g4-app/supabase/kr-plan-faktury-komentarz-czat.sql
          </code>
        </div>
      ) : null}

      {czyMozeEdytowac ? (
        <div style={{ marginBottom: "0.85rem" }} id="plan-faktur-formularz">
          {!pokazFormularzNowej ? (
            <button
              type="button"
              onClick={() => otworzNowaPozycje()}
              style={{
                background: LIGHT.accent,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0.4rem 0.85rem",
                fontWeight: 700,
                fontSize: "0.84rem",
                cursor: "pointer",
              }}
            >
              ＋ Dodaj fakturę do planu
            </button>
          ) : (
            <form
              onSubmit={(e) => void zapiszPozycjePlanu(e)}
              style={{
                border: LIGHT.panelBorder,
                borderRadius: 12,
                background: LIGHT.cardBg,
                padding: "0.75rem 0.85rem",
                display: "grid",
                gap: "0.55rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                <strong style={{ color: LIGHT.title, fontSize: "0.9rem" }}>
                  {edycjaId != null ? "Edycja pozycji w planie" : "Nowa faktura w planie"}
                </strong>
                <button
                  type="button"
                  onClick={() => zamknijFormularzPlanu()}
                  style={{
                    background: "#fff",
                    border: LIGHT.cardBorder,
                    borderRadius: 6,
                    color: LIGHT.text,
                    fontSize: "0.75rem",
                    padding: "0.15rem 0.45rem",
                    cursor: "pointer",
                  }}
                >
                  Anuluj
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(9.5rem, 1fr))",
                  gap: "0.5rem",
                }}
              >
                <label style={{ fontSize: "0.75rem", color: LIGHT.muted, display: "grid", gap: 4 }}>
                  KR
                  <input
                    style={inputStyleNowa}
                    value={formNowa.kr}
                    onChange={(e) => setFormNowa((p) => ({ ...p, kr: e.target.value }))}
                    placeholder="np. 1073"
                  />
                </label>
                <label style={{ fontSize: "0.75rem", color: LIGHT.muted, display: "grid", gap: 4 }}>
                  Klient
                  <input
                    style={inputStyleNowa}
                    value={formNowa.klient}
                    onChange={(e) => setFormNowa((p) => ({ ...p, klient: e.target.value }))}
                    placeholder="Nazwa klienta"
                  />
                </label>
                <label style={{ fontSize: "0.75rem", color: LIGHT.muted, display: "grid", gap: 4 }}>
                  Horyzont
                  <select
                    style={inputStyleNowa}
                    value={
                      HORYZONTY.includes(formNowa.horyzont) || formNowa.horyzont === "__custom__"
                        ? formNowa.horyzont
                        : "__custom__"
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormNowa((p) => ({
                        ...p,
                        horyzont: v,
                        horyzontCustom: v === "__custom__" ? p.horyzontCustom : "",
                      }));
                    }}
                  >
                    {HORYZONTY.map((h) => (
                      <option key={h} value={h}>
                        {h === "inne" ? "Inne" : formatHoryzont(h)}
                      </option>
                    ))}
                    <option value="__custom__">Inny miesiąc (RRRR-MM)…</option>
                  </select>
                </label>
                {(formNowa.horyzont === "__custom__" ||
                  (!HORYZONTY.includes(formNowa.horyzont) && formNowa.horyzont)) && (
                  <label style={{ fontSize: "0.75rem", color: LIGHT.muted, display: "grid", gap: 4 }}>
                    Miesiąc (RRRR-MM)
                    <input
                      style={inputStyleNowa}
                      type="month"
                      value={
                        formNowa.horyzont === "__custom__"
                          ? formNowa.horyzontCustom
                          : formNowa.horyzont
                      }
                      onChange={(e) =>
                        setFormNowa((p) => ({
                          ...p,
                          horyzont: "__custom__",
                          horyzontCustom: e.target.value,
                        }))
                      }
                    />
                  </label>
                )}
                <label style={{ fontSize: "0.75rem", color: LIGHT.muted, display: "grid", gap: 4 }}>
                  Kwota netto
                  <input
                    style={inputStyleNowa}
                    value={formNowa.kwota_netto}
                    onChange={(e) => setFormNowa((p) => ({ ...p, kwota_netto: e.target.value }))}
                    placeholder="np. 40000"
                    inputMode="decimal"
                  />
                </label>
                <label style={{ fontSize: "0.75rem", color: LIGHT.muted, display: "grid", gap: 4 }}>
                  Bloker
                  <select
                    style={inputStyleNowa}
                    value={formNowa.bloker}
                    onChange={(e) => setFormNowa((p) => ({ ...p, bloker: e.target.value }))}
                  >
                    {BLOKER_OPCJE.map((b) => (
                      <option key={b} value={b}>
                        {BLOKER_LABEL[b]}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: "0.75rem", color: LIGHT.muted, display: "grid", gap: 4 }}>
                  Odpowiedzialny
                  <input
                    style={inputStyleNowa}
                    value={formNowa.odpowiedzialny}
                    onChange={(e) => setFormNowa((p) => ({ ...p, odpowiedzialny: e.target.value }))}
                    placeholder="np. Damian"
                  />
                </label>
              </div>
              <label style={{ fontSize: "0.75rem", color: LIGHT.muted, display: "grid", gap: 4 }}>
                Opis *
                <input
                  style={inputStyleNowa}
                  value={formNowa.opis}
                  onChange={(e) => setFormNowa((p) => ({ ...p, opis: e.target.value }))}
                  placeholder="Krótki opis zakresu / pozycji FS"
                  required
                />
              </label>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  color: formNowa.mozna_fakturowac ? LIGHT.readyText : LIGHT.text,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(formNowa.mozna_fakturowac)}
                  onChange={(e) => setFormNowa((p) => ({ ...p, mozna_fakturowac: e.target.checked }))}
                />
                Można wystawić fakturę (możliwość wystawienia FS)
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="submit"
                  disabled={zapisNowej}
                  style={{
                    background: LIGHT.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "0.4rem 0.9rem",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                    cursor: zapisNowej ? "wait" : "pointer",
                    opacity: zapisNowej ? 0.7 : 1,
                  }}
                >
                  {zapisNowej ? "Zapisywanie…" : edycjaId != null ? "Zapisz zmiany" : "Zapisz w planie"}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.6rem",
          marginBottom: "0.75rem",
          alignItems: "center",
          color: LIGHT.text,
        }}
      >
        <label style={{ fontSize: "0.84rem" }}>
          Horyzont{" "}
          <select
            value={filtrHoryzont}
            onChange={(e) => setFiltrHoryzont(e.target.value)}
            style={{
              marginLeft: 4,
              background: "#fff",
              color: LIGHT.text,
              border: LIGHT.inputBorder,
              borderRadius: 6,
              padding: "0.15rem 0.35rem",
            }}
          >
            <option value="wszystkie">Wszystkie</option>
            {horyzontyFiltr.map((h) => (
              <option key={h} value={h}>
                {h === "inne" ? "Inne" : formatHoryzont(h)}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: "0.84rem" }}>
          <input
            type="checkbox"
            checked={tylkoGotowe}
            onChange={(e) => {
              setTylkoGotowe(e.target.checked);
              if (e.target.checked) setTylkoBlokady(false);
            }}
          />{" "}
          Tylko „można fakturować”
        </label>
        <label style={{ fontSize: "0.84rem" }}>
          <input
            type="checkbox"
            checked={tylkoBlokady}
            onChange={(e) => {
              setTylkoBlokady(e.target.checked);
              if (e.target.checked) setTylkoGotowe(false);
            }}
          />{" "}
          Tylko z blokadą
        </label>
        <button
          type="button"
          style={{
            background: "#fff",
            border: LIGHT.cardBorder,
            borderRadius: 8,
            color: LIGHT.text,
            padding: "0.25rem 0.55rem",
            cursor: "pointer",
            fontSize: "0.82rem",
          }}
          onClick={() => void fetchRows()}
        >
          Odśwież
        </button>
      </div>

      <div style={{ fontSize: "0.84rem", marginBottom: "0.75rem", color: LIGHT.muted }}>
        Suma widocznych: <strong style={{ color: LIGHT.text }}>{formatPln(sumy.total)}</strong>
        {" · "}
        Gotowe do FS: <strong style={{ color: LIGHT.readyText }}>{formatPln(sumy.gotowe)}</strong>
      </div>

      <div
        style={{
          marginBottom: "0.85rem",
          border: "1px solid #7dd3fc",
          borderRadius: "12px",
          background: "linear-gradient(180deg, #e0f2fe 0%, #f8fafc 100%)",
          padding: "0.65rem 0.75rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", alignItems: "baseline" }}>
          <strong style={{ fontSize: "0.86rem", color: LIGHT.accent }}>Ostatnie wpisy</strong>
          <span style={{ fontSize: "0.72rem", color: LIGHT.soft }}>kliknij, żeby otworzyć rozmowę</span>
        </div>
        {wszystkieOstatnieWpisy.length === 0 ? (
          <p style={{ margin: "0.45rem 0 0", fontSize: "0.8rem", color: LIGHT.soft }}>
            Brak wiadomości w rozmowach.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.35rem", marginTop: "0.5rem" }}>
            {ostatnieWpisy.map((w) => {
              const row = (rows ?? []).find((r) => r.id === w.planId);
              const wiadomosci = row ? wiadomosciDlaWiersza(row) : [];
              const nieprzeczytana = czyRozmowaNieprzeczytana(w.planId, wiadomosci);
              return (
              <button
                key={w.key}
                type="button"
                onClick={() => przejdzDoWpis(w.planId)}
                title={`Przejdź do KR ${w.kr}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(5.5rem, auto) 1fr",
                  gap: "0.2rem 0.7rem",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                  border: LIGHT.cardBorder,
                  borderRadius: "9px",
                  background: podswietlonyPlanId === w.planId ? LIGHT.accentSoft : LIGHT.cardBg,
                  color: LIGHT.text,
                  padding: "0.4rem 0.55rem",
                  font: "inherit",
                  fontWeight: nieprzeczytana ? 700 : 400,
                }}
              >
                <span style={{ fontSize: "0.72rem", color: LIGHT.soft, whiteSpace: "nowrap" }}>
                  {formatDataUwag(w.created_at) || "—"}
                </span>
                <span style={{ fontSize: "0.78rem", lineHeight: 1.35 }}>
                  <strong style={{ color: LIGHT.accent }}>{w.autor}</strong>
                  {" · "}
                  <strong>KR {w.kr}</strong>
                  {w.klient ? <span style={{ color: LIGHT.soft }}>{` · ${w.klient}`}</span> : null}
                  <span style={{ display: "block", marginTop: "0.12rem", color: LIGHT.text }}>
                    {skrotTekstu(w.tresc, 110)}
                  </span>
                </span>
              </button>
              );
            })}
            {wszystkieOstatnieWpisy.length > 3 ? (
              <button
                type="button"
                onClick={() => setRozwinOstatnieWpisy((v) => !v)}
                style={{
                  marginTop: "0.15rem",
                  justifySelf: "start",
                  background: "none",
                  border: "none",
                  padding: "0.15rem 0",
                  color: LIGHT.accent,
                  font: "inherit",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {rozwinOstatnieWpisy
                  ? "Zwiń"
                  : `Rozwiń starsze (${wszystkieOstatnieWpisy.length - 3})`}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {err ? (
        <div
          style={{
            marginBottom: "0.85rem",
            padding: "0.55rem 0.7rem",
            borderRadius: "8px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
          }}
          role="alert"
        >
          {err}
        </div>
      ) : null}
      {msg ? (
        <div style={{ marginBottom: "0.75rem", fontSize: "0.84rem", color: LIGHT.msgOk }}>{msg}</div>
      ) : null}

      {loading ? (
        <p style={{ color: LIGHT.muted }}>Ładowanie…</p>
      ) : filteredSorted.length === 0 ? (
        <p style={{ color: LIGHT.muted }}>Brak pozycji dla wybranego filtra.</p>
      ) : (
        <div
          style={{
            borderRadius: "12px",
            overflow: "auto",
            border: LIGHT.panelBorder,
            background: "#fff",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", color: LIGHT.text }}>
            <thead>
              <tr>
                {KOLUMNY_SORT_PLAN.map((kol) => {
                  const aktywna = sort.key === kol.key;
                  const strzalka = aktywna ? (sort.dir === "asc" ? " ▲" : " ▼") : "";
                  return (
                    <th key={kol.key} style={thLight}>
                      <button
                        type="button"
                        onClick={() => przestawSort(kol.key)}
                        title={`Sortuj według: ${kol.label}`}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          margin: 0,
                          color: LIGHT.text,
                          font: "inherit",
                          fontWeight: aktywna ? 800 : 700,
                          cursor: "pointer",
                          textAlign: "left",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {kol.label}
                        {strzalka}
                      </button>
                    </th>
                  );
                })}
                {czyMozeEdytowac ? <th style={thLight}>Akcja</th> : <th style={thLight}>Czat</th>}
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((r) => {
                const gotowe = Boolean(r.mozna_fakturowac);
                const podswietlony = podswietlonyPlanId === r.id;
                const krKod = String(r.kr ?? "").trim();
                return (
                  <tr
                    key={r.id}
                    ref={(el) => {
                      if (el) rowRefs.current[r.id] = el;
                      else delete rowRefs.current[r.id];
                    }}
                    style={{
                      background: podswietlony ? LIGHT.rowFocus : gotowe ? LIGHT.rowReady : "#fff",
                      outline: podswietlony ? LIGHT.rowFocusOutline : undefined,
                      outlineOffset: podswietlony ? "-2px" : undefined,
                      transition: "background 0.35s ease",
                    }}
                  >
                    <td style={tdLight}>{formatHoryzont(r.horyzont)}</td>
                    <td style={tdLight}>
                      <strong>{krKod || "—"}</strong>
                    </td>
                    <td style={tdLight}>{r.klient || "—"}</td>
                    <td style={{ ...tdLight, maxWidth: "18rem" }}>{r.opis || "—"}</td>
                    <td style={{ ...tdLight, verticalAlign: "top" }}>{renderCzatKomorka(r)}</td>
                    <td style={{ ...tdLight, whiteSpace: "nowrap" }}>{formatPln(r.kwota_netto)}</td>
                    <td style={tdLight}>{BLOKER_LABEL[r.bloker] || r.bloker || "—"}</td>
                    <td style={tdLight}>{r.odpowiedzialny || "—"}</td>
                    <td style={tdLight}>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          cursor: czyMozeEdytowac ? "pointer" : "default",
                          fontWeight: 700,
                          color: gotowe ? LIGHT.readyText : LIGHT.text,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={gotowe}
                          disabled={!czyMozeEdytowac}
                          onChange={(e) => void toggleMozna(r.id, e.target.checked)}
                        />
                        {gotowe ? "TAK" : "nie"}
                      </label>
                    </td>
                    <td style={tdLight}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-start" }}>
                        <button
                          type="button"
                          disabled={!krKod}
                          title={
                            krKod
                              ? `Otwórz czat notatek projektu KR ${krKod}`
                              : "Brak numeru KR przy tej pozycji"
                          }
                          onClick={() => otworzCzatProjektu(krKod)}
                          style={{
                            background: krKod ? LIGHT.accent : "#e2e8f0",
                            color: krKod ? "#fff" : "#94a3b8",
                            border: "none",
                            borderRadius: 6,
                            padding: "0.25rem 0.55rem",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: krKod ? "pointer" : "not-allowed",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {krKod ? `Czat KR ${krKod}` : "Czat KR"}
                        </button>
                        {czyMozeEdytowac ? (
                          <>
                            <button
                              type="button"
                              style={{
                                background: "#fff",
                                padding: "0.2rem 0.5rem",
                                fontSize: "0.75rem",
                                color: LIGHT.accent,
                                border: "1px solid #7dd3fc",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontWeight: 700,
                              }}
                              title="Edytuj pozycję planu"
                              onClick={() => otworzEdycjePozycji(r)}
                            >
                              Edytuj
                            </button>
                            <button
                              type="button"
                              style={{
                                background: "#fff",
                                padding: "0.15rem 0.45rem",
                                fontSize: "0.75rem",
                                color: LIGHT.danger,
                                border: "1px solid #fca5a5",
                                borderRadius: 6,
                                cursor: "pointer",
                              }}
                              title="Usuń z planu (np. FS już wystawiona)"
                              onClick={() => void usunPlan(r)}
                            >
                              Usuń
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
