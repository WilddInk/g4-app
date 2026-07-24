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

function porownajTekst(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""), "pl", {
    sensitivity: "base",
    numeric: true,
  });
}

function wartoscSortPlanFaktur(row, key) {
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
    case "uwagi":
      return row.uwagi ?? "";
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
  { key: "uwagi", label: "Uwagi" },
  { key: "kwota", label: "Kwota" },
  { key: "bloker", label: "Bloker" },
  { key: "odpowiedzialny", label: "Odpowiedzialny" },
  { key: "mozna_fakturowac", label: "Można fakturować" },
];

/**
 * Kolejka planowanych faktur sprzedażowych.
 * Kierownik zaznacza „Można fakturować” — księgowość widzi to w APP / sync.
 */
export function PlanFakturPanel({ supabase, styles: s, op, czyMozeEdytowac, czyMozeEdytowacUwagi }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtrHoryzont, setFiltrHoryzont] = useState("wszystkie");
  const [tylkoGotowe, setTylkoGotowe] = useState(false);
  const [tylkoBlokady, setTylkoBlokady] = useState(false);
  const [sort, setSort] = useState({ key: "horyzont", dir: "asc" });
  /** Drafty uwag podczas edycji: id → tekst. */
  const [uwagiDraft, setUwagiDraft] = useState({});
  const [uwagiEdycjaId, setUwagiEdycjaId] = useState(null);
  const [uwagiZapisId, setUwagiZapisId] = useState(null);

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
      return;
    }
    setRows(data ?? []);
  }, [supabase]);

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
      const va = wartoscSortPlanFaktur(a, key);
      const vb = wartoscSortPlanFaktur(b, key);
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
  }, [filtered, sort]);

  const sumy = useMemo(() => {
    const by = {};
    let total = 0;
    let gotowe = 0;
    for (const r of filtered) {
      const k = r.horyzont || "inne";
      const kw = Number(r.kwota_netto) || 0;
      by[k] = (by[k] || 0) + kw;
      total += kw;
      if (r.mozna_fakturowac) gotowe += kw;
    }
    return { by, total, gotowe };
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
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...payload } : r)),
    );
    setMsg(next ? "Oznaczono: można fakturować." : "Cofnięto zgodę na fakturowanie.");
  }

  function rozpocznijEdycjeUwag(row) {
    if (!czyMozeEdytowacUwagi) return;
    const id = row.id;
    setUwagiEdycjaId(id);
    setUwagiDraft((prev) => ({
      ...prev,
      [id]: row.uwagi != null ? String(row.uwagi) : "",
    }));
  }

  function anulujEdycjeUwag(id) {
    setUwagiEdycjaId((cur) => (cur === id ? null : cur));
    setUwagiDraft((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function zapiszUwagi(id) {
    if (!czyMozeEdytowacUwagi) {
      alert("Uwagi mogą zapisywać zalogowane osoby.");
      return;
    }
    const tekst = uwagiDraft[id] != null ? String(uwagiDraft[id]) : "";
    const row = (rows ?? []).find((r) => r.id === id);
    const stare = row?.uwagi != null ? String(row.uwagi) : "";
    if (tekst === stare) {
      anulujEdycjeUwag(id);
      return;
    }
    setMsg(null);
    setUwagiZapisId(id);
    const { error } = await supabase
      .from("kr_plan_faktury")
      .update({ uwagi: tekst.trim() === "" ? null : tekst })
      .eq("id", id);
    setUwagiZapisId(null);
    if (error) {
      setMsg(`Nie udało się zapisać uwag: ${error.message}`);
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, uwagi: tekst.trim() === "" ? null : tekst } : r,
      ),
    );
    anulujEdycjeUwag(id);
    setMsg("Zapisano uwagi.");
  }

  const st = s || {};
  const shell = op || {};
  const moznaUwagi = Boolean(czyMozeEdytowacUwagi);

  return (
    <div style={{ ...(shell.sectionCard || {}), marginTop: "0.85rem" }}>
      <h3 style={{ ...(shell.sectionTitle || {}), marginTop: 0, marginBottom: "0.35rem" }}>
        Plan faktur sprzedażowych ({filtered.length})
      </h3>
      <p style={{ ...(st.muted || {}), marginTop: 0, marginBottom: "0.75rem", fontSize: "0.84rem", maxWidth: "52rem" }}>
        To jest lista od prezesa (lipiec → 2027). <strong>Kierownik</strong> zaznacza „Można fakturować”, gdy
        protokół / klauzula / zakres są OK — wtedy księgowość wie, że może wystawić FS, bez pytania na spotkaniu.
        {moznaUwagi ? (
          <>
            {" "}
            Kolumnę <strong>Uwagi</strong> może edytować każda zalogowana osoba (kliknij komórkę → Zapisz).
          </>
        ) : null}
      </p>

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
                    <td style={{ ...(st.td || {}), maxWidth: "16rem", fontSize: "0.78rem", minWidth: "11rem" }}>
                      {moznaUwagi && uwagiEdycjaId === r.id ? (
                        <div style={{ display: "grid", gap: "0.35rem" }}>
                          <textarea
                            value={uwagiDraft[r.id] ?? ""}
                            onChange={(e) =>
                              setUwagiDraft((prev) => ({ ...prev, [r.id]: e.target.value }))
                            }
                            rows={3}
                            disabled={uwagiZapisId === r.id}
                            style={{
                              width: "100%",
                              resize: "vertical",
                              minHeight: "3.2rem",
                              padding: "0.35rem 0.45rem",
                              borderRadius: "8px",
                              border: "1px solid rgba(148,163,184,0.45)",
                              background: "#0f172a",
                              color: "#e2e8f0",
                              font: "inherit",
                              fontSize: "0.78rem",
                            }}
                            autoFocus
                            placeholder="Wpisz uwagi…"
                          />
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                            <button
                              type="button"
                              style={{ ...(st.btn || {}), fontSize: "0.74rem", padding: "0.2rem 0.5rem" }}
                              disabled={uwagiZapisId === r.id}
                              onClick={() => void zapiszUwagi(r.id)}
                            >
                              {uwagiZapisId === r.id ? "Zapis…" : "Zapisz"}
                            </button>
                            <button
                              type="button"
                              style={{ ...(st.btnGhost || {}), fontSize: "0.74rem", padding: "0.2rem 0.5rem" }}
                              disabled={uwagiZapisId === r.id}
                              onClick={() => anulujEdycjeUwag(r.id)}
                            >
                              Anuluj
                            </button>
                          </div>
                        </div>
                      ) : moznaUwagi ? (
                        <button
                          type="button"
                          onClick={() => rozpocznijEdycjeUwag(r)}
                          title="Edytuj uwagi"
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            background: "rgba(15,23,42,0.55)",
                            border: "1px dashed rgba(251,146,60,0.55)",
                            borderRadius: "8px",
                            padding: "0.35rem 0.45rem",
                            color: r.uwagi ? "#e2e8f0" : "#fdba74",
                            cursor: "pointer",
                            font: "inherit",
                            fontSize: "0.78rem",
                            lineHeight: 1.35,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {r.uwagi?.trim() ? r.uwagi : "＋ Dodaj uwagi…"}
                        </button>
                      ) : (
                        r.uwagi || "—"
                      )}
                    </td>
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
