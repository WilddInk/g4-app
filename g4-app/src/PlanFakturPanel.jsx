import { useCallback, useEffect, useMemo, useState } from "react";

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
              background: "rgba(15,23,42,0.55)",
              border: "1px dashed rgba(251,146,60,0.55)",
              borderRadius: "8px",
              padding: "0.4rem 0.5rem",
              color: "#e2e8f0",
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
                <span style={{ display: "block", marginTop: "0.25rem", fontSize: "0.7rem", color: "#94a3b8" }}>
                  {ostatnia.autor || "—"} · {formatDataUwag(ostatnia.created_at) || "—"}
                  {wiadomosci.length > 1 ? ` · ${wiadomosci.length} wpisów` : ""}
                  {" · otwórz rozmowę"}
                </span>
              </>
            ) : (
              <span style={{ color: "#fdba74" }}>＋ Otwórz rozmowę / dodaj wpis…</span>
            )}
          </button>
        ) : (
          <div
            style={{
              border: "1px solid rgba(148,163,184,0.35)",
              borderRadius: "10px",
              background: "rgba(15,23,42,0.85)",
              padding: "0.45rem",
              display: "grid",
              gap: "0.4rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.4rem", alignItems: "center" }}>
              <strong style={{ fontSize: "0.75rem", color: "#fdba74" }}>Rozmowa</strong>
              <button
                type="button"
                style={{ ...(st.btnGhost || {}), fontSize: "0.7rem", padding: "0.1rem 0.4rem" }}
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
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Brak wpisów — napisz pierwszą wiadomość.</span>
              ) : (
                wiadomosci.map((w) => (
                  <div
                    key={w.id}
                    style={{
                      padding: "0.35rem 0.45rem",
                      borderRadius: "8px",
                      background: "rgba(30,41,59,0.9)",
                      border: "1px solid rgba(148,163,184,0.2)",
                    }}
                  >
                    <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginBottom: "0.15rem" }}>
                      <strong style={{ color: "#fdba74" }}>{w.autor || w.autor_email || "—"}</strong>
                      {" · "}
                      {formatDataUwag(w.created_at) || "—"}
                      {w._legacy ? " · (stary wpis)" : ""}
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", color: "#e2e8f0", fontSize: "0.78rem" }}>{w.tresc}</div>
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
                    border: "1px solid rgba(148,163,184,0.45)",
                    background: "#0f172a",
                    color: "#e2e8f0",
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
                  style={{ ...(st.btn || {}), fontSize: "0.74rem", padding: "0.25rem 0.55rem" }}
                  disabled={wysylanieId === row.id || !(draftByPlan[row.id] ?? "").trim()}
                  onClick={() => void wyslijWiadomosc(row.id)}
                >
                  {wysylanieId === row.id ? "Wysyłanie…" : "Wyślij"}
                </button>
              </div>
            ) : (
              <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Zaloguj się, aby dopisać wiadomość.</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ ...(shell.sectionCard || {}), marginTop: "0.85rem" }}>
      <h3 style={{ ...(shell.sectionTitle || {}), marginTop: 0, marginBottom: "0.35rem" }}>
        Plan faktur sprzedażowych ({filtered.length})
      </h3>
      <p style={{ ...(st.muted || {}), marginTop: 0, marginBottom: "0.75rem", fontSize: "0.84rem", maxWidth: "52rem" }}>
        To jest lista od prezesa (lipiec → 2027). <strong>Kierownik</strong> zaznacza „Można fakturować”. Kolumna{" "}
        <strong>Uwagi / rozmowa</strong> działa jak czat: każdy dopisuje swoją wiadomość — widać kto, kiedy i co napisał
        (nie nadpisuje poprzednich).
      </p>
      {brakTabeliCzat ? (
        <div style={{ ...(st.errBox || {}), marginBottom: "0.75rem" }} role="alert">
          Brak tabeli czatu w bazie. Uruchom w Supabase SQL Editor:{" "}
          <code style={st.code}>g4-app/supabase/kr-plan-faktury-komentarz-czat.sql</code>
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "0.75rem", alignItems: "center" }}>
        <label style={{ fontSize: "0.84rem" }}>
          Horyzont{" "}
          <select
            value={filtrHoryzont}
            onChange={(e) => setFiltrHoryzont(e.target.value)}
            style={{ marginLeft: 4 }}
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
        <button type="button" style={st.btnGhost} onClick={() => void fetchRows()}>
          Odśwież
        </button>
      </div>

      <div style={{ ...(st.muted || {}), fontSize: "0.84rem", marginBottom: "0.75rem" }}>
        Suma widocznych: <strong>{formatPln(sumy.total)}</strong>
        {" · "}
        Gotowe do FS: <strong style={{ color: "#86efac" }}>{formatPln(sumy.gotowe)}</strong>
      </div>

      {err ? (
        <div style={{ ...(st.errBox || {}), marginBottom: "0.85rem" }} role="alert">
          {err}
        </div>
      ) : null}
      {msg ? (
        <div style={{ marginBottom: "0.75rem", fontSize: "0.84rem", color: "#86efac" }}>{msg}</div>
      ) : null}

      {loading ? (
        <p style={st.muted}>Ładowanie…</p>
      ) : filteredSorted.length === 0 ? (
        <p style={st.muted}>Brak pozycji dla wybranego filtra.</p>
      ) : (
        <div style={{ ...(st.tableWrap || {}), borderRadius: "12px", overflow: "auto" }}>
          <table style={{ ...(st.table || {}), fontSize: "0.82rem" }}>
            <thead>
              <tr>
                {KOLUMNY_SORT_PLAN.map((kol) => {
                  const aktywna = sort.key === kol.key;
                  const strzalka = aktywna ? (sort.dir === "asc" ? " ▲" : " ▼") : "";
                  return (
                    <th key={kol.key} style={st.th}>
                      <button
                        type="button"
                        onClick={() => przestawSort(kol.key)}
                        title={`Sortuj według: ${kol.label}`}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          margin: 0,
                          color: "inherit",
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
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((r) => {
                const gotowe = Boolean(r.mozna_fakturowac);
                return (
                  <tr
                    key={r.id}
                    style={gotowe ? { background: "rgba(34,197,94,0.12)" } : undefined}
                  >
                    <td style={st.td}>{HORYZONT_LABEL[r.horyzont] || r.horyzont}</td>
                    <td style={st.td}>
                      <strong>{r.kr || "—"}</strong>
                    </td>
                    <td style={st.td}>{r.klient || "—"}</td>
                    <td style={{ ...(st.td || {}), maxWidth: "18rem" }}>{r.opis || "—"}</td>
                    <td style={{ ...(st.td || {}), verticalAlign: "top" }}>{renderCzatKomorka(r)}</td>
                    <td style={{ ...(st.td || {}), whiteSpace: "nowrap" }}>{formatPln(r.kwota_netto)}</td>
                    <td style={st.td}>{BLOKER_LABEL[r.bloker] || r.bloker || "—"}</td>
                    <td style={st.td}>{r.odpowiedzialny || "—"}</td>
                    <td style={st.td}>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          cursor: czyMozeEdytowac ? "pointer" : "default",
                          fontWeight: 700,
                          color: gotowe ? "#86efac" : undefined,
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
