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

/**
 * Kolejka planowanych faktur sprzedażowych.
 * Kierownik zaznacza „Można fakturować” — księgowość widzi to w APP / sync.
 */
export function PlanFakturPanel({ supabase, styles: s, op, czyMozeEdytowac }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtrHoryzont, setFiltrHoryzont] = useState("wszystkie");
  const [tylkoGotowe, setTylkoGotowe] = useState(false);
  const [tylkoBlokady, setTylkoBlokady] = useState(false);

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

  const st = s || {};
  const shell = op || {};

  return (
    <div style={{ ...(shell.sectionCard || {}), marginTop: "0.85rem" }}>
      <h3 style={{ ...(shell.sectionTitle || {}), marginTop: 0, marginBottom: "0.35rem" }}>
        Plan faktur sprzedażowych ({filtered.length})
      </h3>
      <p style={{ ...(st.muted || {}), marginTop: 0, marginBottom: "0.75rem", fontSize: "0.84rem", maxWidth: "52rem" }}>
        To jest lista od prezesa (lipiec → 2027). <strong>Kierownik</strong> zaznacza „Można fakturować”, gdy
        protokół / klauzula / zakres są OK — wtedy księgowość wie, że może wystawić FS, bez pytania na spotkaniu.
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
      ) : filtered.length === 0 ? (
        <p style={st.muted}>Brak pozycji dla wybranego filtra.</p>
      ) : (
        <div style={{ ...(st.tableWrap || {}), borderRadius: "12px", overflow: "auto" }}>
          <table style={{ ...(st.table || {}), fontSize: "0.82rem" }}>
            <thead>
              <tr>
                <th style={st.th}>Horyzont</th>
                <th style={st.th}>KR</th>
                <th style={st.th}>Klient</th>
                <th style={st.th}>Opis</th>
                <th style={st.th}>Kwota</th>
                <th style={st.th}>Bloker</th>
                <th style={st.th}>Odpowiedzialny</th>
                <th style={st.th}>Uwagi</th>
                <th style={st.th}>Można fakturować</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
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
                    <td style={{ ...(st.td || {}), whiteSpace: "nowrap" }}>{formatPln(r.kwota_netto)}</td>
                    <td style={st.td}>{BLOKER_LABEL[r.bloker] || r.bloker || "—"}</td>
                    <td style={st.td}>{r.odpowiedzialny || "—"}</td>
                    <td style={{ ...(st.td || {}), maxWidth: "14rem", fontSize: "0.78rem" }}>
                      {r.uwagi || "—"}
                    </td>
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
