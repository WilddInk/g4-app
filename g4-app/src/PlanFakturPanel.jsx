import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const HORYZONTY = ["2026-07", "2026-08", "2026-09", "2026-Q4", "2027", "inne"];

const HORYZONT_LABEL = {
  "2026-07": "Lipiec 2026",
  "2026-08": "Sierpień 2026",
  "2026-09": "Wrzesień 2026",
  "2026-Q4": "Koniec roku 2026",
  "2027": "Rok 2027",
  inne: "Inne",
};

const BLOKER_LABEL = {
  czeka_protokol: "Czeka na protokół",
  czeka_klauzule: "Czeka na klauzulę / ZRID",
  czeka_zielone: "Czeka na zielone światło",
  ustalic_kwote: "Ustalić kwotę",
  waloryzacja: "Waloryzacja",
  brak: "Brak blokady",
  inne: "Inne",
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
      return HORYZONT_LABEL[row.horyzont] || row.horyzont || "";
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
    setLoading(false);
    if (error) {
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
  }, [supabase, fetchKomentarze]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

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
    setMsg(`Dodano wpis — ${autorNazwa}.`);
  }

  const st = s || {};
  const shell = op || {};
  const moznaUwagi = Boolean(czyMozeEdytowacUwagi);

  const ostatnieWpisy = useMemo(() => {
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
    return lista.slice(0, 8);
  }, [rows, komentarzeByPlan]);

  function przejdzDoWpis(planId) {
    setFiltrHoryzont("wszystkie");
    setTylkoGotowe(false);
    setTylkoBlokady(false);
    setOtwartyCzatId(planId);
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

    return (
      <div style={{ display: "grid", gap: "0.35rem", minWidth: "14rem", maxWidth: "22rem" }}>
        {!otwarty ? (
          <button
            type="button"
            onClick={() => setOtwartyCzatId(row.id)}
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
            }}
          >
            {ostatnia ? (
              <>
                <span style={{ display: "block", whiteSpace: "pre-wrap" }}>
                  {String(ostatnia.tresc).slice(0, 120)}
                  {String(ostatnia.tresc).length > 120 ? "…" : ""}
                </span>
                <span style={{ display: "block", marginTop: "0.25rem", fontSize: "0.7rem", color: LIGHT.soft }}>
                  {ostatnia.autor || "—"} · {formatDataUwag(ostatnia.created_at) || "—"}
                  {wiadomosci.length > 1 ? ` · ${wiadomosci.length} wpisów` : ""}
                  {" · otwórz rozmowę"}
                </span>
              </>
            ) : (
              <span style={{ color: LIGHT.accent }}>＋ Otwórz rozmowę / dodaj wpis…</span>
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
        To jest lista od prezesa (lipiec → 2027). <strong style={{ color: LIGHT.text }}>Kierownik</strong> zaznacza
        „Można fakturować”. Kolumna <strong style={{ color: LIGHT.text }}>Uwagi / rozmowa</strong> działa jak czat:
        każdy dopisuje swoją wiadomość — widać kto, kiedy i co napisał (nie nadpisuje poprzednich).
      </p>
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
            {HORYZONTY.map((h) => (
              <option key={h} value={h}>
                {HORYZONT_LABEL[h] || h}
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
        {ostatnieWpisy.length === 0 ? (
          <p style={{ margin: "0.45rem 0 0", fontSize: "0.8rem", color: LIGHT.soft }}>
            Brak wiadomości w rozmowach.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.35rem", marginTop: "0.5rem" }}>
            {ostatnieWpisy.map((w) => (
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
            ))}
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
                {czyMozeEdytowac ? <th style={thLight}>Akcja</th> : null}
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((r) => {
                const gotowe = Boolean(r.mozna_fakturowac);
                const podswietlony = podswietlonyPlanId === r.id;
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
                    <td style={tdLight}>{HORYZONT_LABEL[r.horyzont] || r.horyzont}</td>
                    <td style={tdLight}>
                      <strong>{r.kr || "—"}</strong>
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
                    {czyMozeEdytowac ? (
                      <td style={tdLight}>
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
                      </td>
                    ) : null}
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
