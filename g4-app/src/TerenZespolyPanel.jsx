import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase.js";
import { op, theme } from "./operationalShell.jsx";
import { s } from "./styles/appDashboardStyles.js";
import { dataDoInputa, dataPLZFormat } from "./utils/dateText.js";

function HelpLinijka({ wlaczony, children }) {
  if (!wlaczony || children == null || children === "") return null;
  return (
    <p style={{ fontSize: "0.68rem", color: "#4ade80", lineHeight: 1.4, margin: "0.2rem 0 0.5rem", maxWidth: "24rem" }}>
      {children}
    </p>
  );
}

function etykietaPrac(pracownicy, nr) {
  const n = String(nr ?? "").trim();
  if (!n) return "—";
  const p = pracownicy.find((x) => String(x.nr).trim() === n);
  return p?.imie_nazwisko?.trim() ? `${p.imie_nazwisko.trim()} (${n})` : n;
}

function pustyFormZespol() {
  return { nazwa: "", notatki: "" };
}

function pustyFormZadanie() {
  return {
    kr: "",
    data_dnia: "",
    opis: "",
    ilosc_plan: "1",
    ilosc_wykonano: "0",
    pracownik_nr: "",
    uwagi: "",
  };
}

/**
 * Praca terenowa: przydziały dzień + KR + pracownik (ten sam zespół ludzi obsługuje różne KR w tygodniu).
 * Nazwane „zespoły” to tylko wygodne grupy pracowników — bez przypięcia do jednego projektu.
 */
export function TerenZespolyPanel({ krList, pracownicy, trybHelp }) {
  const [zespoly, setZespoly] = useState([]);
  const [zespolyErr, setZespolyErr] = useState(null);
  const [selectedZespolId, setSelectedZespolId] = useState(null);
  const [czlonkowie, setCzlonkowie] = useState([]);
  const [czlonkowieErr, setCzlonkowieErr] = useState(null);
  const [dodajPracNr, setDodajPracNr] = useState("");

  const [filterKrZadania, setFilterKrZadania] = useState("");
  const [filterPracZadania, setFilterPracZadania] = useState("");
  const [kalRok, setKalRok] = useState(() => new Date().getFullYear());
  const [kalMiesiac, setKalMiesiac] = useState(() => new Date().getMonth() + 1);
  const [zadania, setZadania] = useState([]);
  const [zadaniaErr, setZadaniaErr] = useState(null);
  const [formZespol, setFormZespol] = useState(pustyFormZespol);
  const [formZadanie, setFormZadanie] = useState(pustyFormZadanie);
  const [zadanieEdycjaId, setZadanieEdycjaId] = useState(null);

  const wybranyZespol = useMemo(
    () => zespoly.find((z) => z.id === selectedZespolId) ?? null,
    [zespoly, selectedZespolId],
  );

  /** Opcje selectów: jak w Zespół — wyłącznie aktywni (`is_active !== false`). */
  const pracownicyOpcjeSelect = useMemo(
    () => pracownicy.filter((p) => p.is_active !== false),
    [pracownicy],
  );

  const zakresMiesiaca = useMemo(() => {
    const y = Number(kalRok);
    const m = Number(kalMiesiac);
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return { od: "", doDnia: "" };
    const ostatni = new Date(y, m, 0).getDate();
    return {
      od: `${y}-${String(m).padStart(2, "0")}-01`,
      doDnia: `${y}-${String(m).padStart(2, "0")}-${String(ostatni).padStart(2, "0")}`,
    };
  }, [kalRok, kalMiesiac]);

  const fetchZespoly = useCallback(async () => {
    setZespolyErr(null);
    const { data, error } = await supabase.from("kr_teren_zespol").select("*").order("nazwa");
    if (error) {
      console.error(error);
      setZespolyErr(error.message);
      setZespoly([]);
      return;
    }
    setZespoly(data ?? []);
  }, []);

  const fetchCzlonkowie = useCallback(async (zespolId) => {
    if (zespolId == null) {
      setCzlonkowie([]);
      return;
    }
    setCzlonkowieErr(null);
    const { data, error } = await supabase
      .from("kr_teren_zespol_pracownik")
      .select("pracownik_nr")
      .eq("zespol_id", zespolId);
    if (error) {
      console.error(error);
      setCzlonkowieErr(error.message);
      setCzlonkowie([]);
      return;
    }
    setCzlonkowie((data ?? []).map((r) => String(r.pracownik_nr).trim()).filter(Boolean));
  }, []);

  const fetchZadania = useCallback(async () => {
    if (!zakresMiesiaca.od) {
      setZadania([]);
      return;
    }
    setZadaniaErr(null);
    let q = supabase
      .from("kr_teren_zadanie")
      .select("*")
      .gte("data_dnia", zakresMiesiaca.od)
      .lte("data_dnia", zakresMiesiaca.doDnia);
    const fk = String(filterKrZadania ?? "").trim();
    if (fk) q = q.eq("kr", fk);
    const fp = String(filterPracZadania ?? "").trim();
    if (fp) q = q.eq("pracownik_nr", fp);
    const { data, error } = await q.order("data_dnia", { ascending: true }).order("kr", { ascending: true }).order("id", { ascending: true });
    if (error) {
      console.error(error);
      setZadaniaErr(error.message);
      setZadania([]);
      return;
    }
    setZadania(data ?? []);
  }, [zakresMiesiaca.doDnia, zakresMiesiaca.od, filterKrZadania, filterPracZadania]);

  useEffect(() => {
    void fetchZespoly();
  }, [fetchZespoly]);

  useEffect(() => {
    void fetchCzlonkowie(selectedZespolId);
  }, [selectedZespolId, fetchCzlonkowie]);

  useEffect(() => {
    void fetchZadania();
  }, [fetchZadania]);

  const zadaniaPoDniu = useMemo(() => {
    const m = new Map();
    for (const z of zadania) {
      const d = dataDoInputa(z.data_dnia);
      if (!d) continue;
      if (!m.has(d)) m.set(d, []);
      m.get(d).push(z);
    }
    return m;
  }, [zadania]);

  async function zapiszZespol(e) {
    e.preventDefault();
    const nazwa = String(formZespol.nazwa ?? "").trim();
    if (!nazwa) {
      alert("Podaj nazwę zespołu.");
      return;
    }
    const { error } = await supabase
      .from("kr_teren_zespol")
      .insert({ nazwa, notatki: String(formZespol.notatki ?? "").trim() || null });
    if (error) {
      console.error(error);
      alert(
        "Zapis zespołu: " +
          error.message +
          (String(error.message).includes("relation") || String(error.message).includes("does not exist")
            ? "\n\nUruchom migrację SQL (kr-teren-zespoly.sql / kr-teren-zespoly-migracja-zasoby.sql) i RLS."
            : "")
      );
      return;
    }
    setFormZespol(pustyFormZespol());
    await fetchZespoly();
  }

  async function usunZespol(id) {
    if (!window.confirm("Usunąć ten nazwany zespół i jego skład? Przydziały w kalendarzu (zadania) pozostaną — nie są powiązane z tą grupą."))
      return;
    const { error } = await supabase.from("kr_teren_zespol").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Usuwanie: " + error.message);
      return;
    }
    if (selectedZespolId === id) {
      setSelectedZespolId(null);
    }
    await fetchZespoly();
  }

  async function dodajCzlonka() {
    if (selectedZespolId == null) return;
    const nr = String(dodajPracNr ?? "").trim();
    if (!nr) {
      alert("Wybierz pracownika z listy.");
      return;
    }
    const { error } = await supabase
      .from("kr_teren_zespol_pracownik")
      .insert({ zespol_id: selectedZespolId, pracownik_nr: nr });
    if (error) {
      console.error(error);
      alert("Dodawanie do zespołu: " + error.message);
      return;
    }
    setDodajPracNr("");
    await fetchCzlonkowie(selectedZespolId);
  }

  async function usunCzlonka(nr) {
    if (selectedZespolId == null) return;
    const { error } = await supabase
      .from("kr_teren_zespol_pracownik")
      .delete()
      .eq("zespol_id", selectedZespolId)
      .eq("pracownik_nr", nr);
    if (error) {
      console.error(error);
      alert("Usuwanie z zespołu: " + error.message);
      return;
    }
    await fetchCzlonkowie(selectedZespolId);
  }

  function wczytajZadanie(row) {
    setZadanieEdycjaId(row.id);
    setFormZadanie({
      kr: row.kr != null ? String(row.kr).trim() : "",
      data_dnia: dataDoInputa(row.data_dnia),
      opis: row.opis != null ? String(row.opis) : "",
      ilosc_plan: row.ilosc_plan != null ? String(row.ilosc_plan) : "1",
      ilosc_wykonano: row.ilosc_wykonano != null ? String(row.ilosc_wykonano) : "0",
      pracownik_nr: row.pracownik_nr != null ? String(row.pracownik_nr).trim() : "",
      uwagi: row.uwagi != null ? String(row.uwagi) : "",
    });
  }

  function anulujZadanieEdycje() {
    setZadanieEdycjaId(null);
    setFormZadanie(pustyFormZadanie());
  }

  async function zapiszZadanie(e) {
    e.preventDefault();
    const kr = String(formZadanie.kr ?? "").trim();
    const dataDnia = String(formZadanie.data_dnia ?? "").trim();
    const opis = String(formZadanie.opis ?? "").trim();
    if (!kr || !dataDnia || !opis) {
      alert("Wybierz KR, dzień i podaj opis zadania.");
      return;
    }
    const plan = Number.parseFloat(String(formZadanie.ilosc_plan ?? "").replace(",", "."));
    const wyk = Number.parseFloat(String(formZadanie.ilosc_wykonano ?? "").replace(",", "."));
    if (!Number.isFinite(plan) || plan < 0 || !Number.isFinite(wyk) || wyk < 0) {
      alert("Ilości muszą być nieujemnymi liczbami.");
      return;
    }
    const payload = {
      kr,
      data_dnia: dataDnia,
      opis,
      ilosc_plan: plan,
      ilosc_wykonano: wyk,
      pracownik_nr: String(formZadanie.pracownik_nr ?? "").trim() || null,
      uwagi: String(formZadanie.uwagi ?? "").trim() || null,
    };
    if (zadanieEdycjaId != null) {
      const { error } = await supabase.from("kr_teren_zadanie").update(payload).eq("id", zadanieEdycjaId);
      if (error) {
        console.error(error);
        alert("Zapis zadania: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("kr_teren_zadanie").insert([payload]);
      if (error) {
        console.error(error);
        alert("Dodawanie zadania: " + error.message);
        return;
      }
    }
    anulujZadanieEdycje();
    await fetchZadania();
  }

  async function usunZadanie(id) {
    if (!window.confirm("Usunąć ten przydział z kalendarza?")) return;
    const { error } = await supabase.from("kr_teren_zadanie").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Usuwanie: " + error.message);
      return;
    }
    if (zadanieEdycjaId === id) anulujZadanieEdycje();
    await fetchZadania();
  }

  const dniWMiesiacu = new Date(kalRok, kalMiesiac, 0).getDate();

  return (
    <>
      <div style={op.heroCard}>
        <h2 style={{ ...op.sectionTitle, marginTop: 0 }}>Praca terenowa</h2>
        {trybHelp ? (
          <p style={{ ...op.muted, marginBottom: 0, maxWidth: "50rem", lineHeight: 1.55 }}>
            <strong>Zasoby</strong> (ludzie) nie są „pod jednym KR”: ten sam pracownik może w poniedziałek pracować przy{" "}
            <strong>jednym projekcie</strong>, we wtorek przy <strong>innym</strong>. W kalendarzu każdy wpis ma własny{" "}
            <strong>KR + dzień + opis</strong> i opcjonalnie kto to robi. Nazwane zespoły niżej to tylko wygodne listy
            osób — nie zastępują modułu <strong>Podwykonawcy</strong> (firmy zewnętrzne są tam osobno).
          </p>
        ) : null}
      </div>

      {(zespolyErr || zadaniaErr) && (
        <div style={s.errBox} role="alert">
          {zespolyErr ? (
            <>
              <strong>Zespoły:</strong> {zespolyErr}
              <br />
            </>
          ) : null}
          {zadaniaErr ? (
            <>
              <strong>Przydziały:</strong> {zadaniaErr}
              <br />
            </>
          ) : null}
          <span style={{ fontSize: "0.88em" }}>
            Świeża baza: <code style={s.code}>kr-teren-zespoly.sql</code>. Istniejąca (stary model):{" "}
            <code style={s.code}>kr-teren-zespoly-migracja-zasoby.sql</code>, potem RLS.
          </span>
        </div>
      )}

      <div style={{ ...op.sectionCard, marginBottom: "1rem" }}>
        <h3 style={{ ...op.sectionTitle, fontSize: "1.05rem", marginTop: 0 }}>Kalendarz przydziałów (KR + dzień)</h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "flex-end",
            marginBottom: "0.85rem",
          }}
        >
          <label style={{ ...s.label, margin: 0, minWidth: "min(13rem, 100%)" }}>
            Filtr KR
            <select style={s.input} value={filterKrZadania} onChange={(ev) => setFilterKrZadania(ev.target.value)}>
              <option value="">— wszystkie —</option>
              {krList.map((row) => (
                <option key={String(row.kr)} value={String(row.kr).trim()}>
                  {String(row.kr).trim()}
                </option>
              ))}
            </select>
          </label>
          <label style={{ ...s.label, margin: 0, minWidth: "min(14rem, 100%)" }}>
            Filtr pracownika
            <select style={s.input} value={filterPracZadania} onChange={(ev) => setFilterPracZadania(ev.target.value)}>
              <option value="">— wszyscy —</option>
              {(() => {
                const cur = String(filterPracZadania ?? "").trim();
                const nrs = new Set(pracownicyOpcjeSelect.map((p) => String(p.nr).trim()));
                const orphan = cur !== "" && !nrs.has(cur);
                return (
                  <>
                    {orphan ? (
                      <option key={`orphan-${cur}`} value={cur}>
                        {cur} (nie w liście)
                      </option>
                    ) : null}
                    {pracownicyOpcjeSelect.map((p) => (
                      <option key={p.nr} value={String(p.nr).trim()}>
                        {etykietaPrac(pracownicy, p.nr)}
                      </option>
                    ))}
                  </>
                );
              })()}
            </select>
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginLeft: "auto" }}>
            <button
              type="button"
              style={{ ...s.btnGhost, padding: "0.35rem 0.65rem", fontSize: "0.78rem" }}
              onClick={() => {
                if (kalMiesiac <= 1) {
                  setKalRok((y) => y - 1);
                  setKalMiesiac(12);
                } else {
                  setKalMiesiac((m) => m - 1);
                }
              }}
            >
              ← Miesiąc
            </button>
            <span style={{ fontSize: "0.88rem", color: "#e2e8f0", minWidth: "10rem", textAlign: "center" }}>
              {new Date(kalRok, kalMiesiac - 1, 15).toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              style={{ ...s.btnGhost, padding: "0.35rem 0.65rem", fontSize: "0.78rem" }}
              onClick={() => {
                if (kalMiesiac >= 12) {
                  setKalRok((y) => y + 1);
                  setKalMiesiac(1);
                } else {
                  setKalMiesiac((m) => m + 1);
                }
              }}
            >
              Miesiąc →
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: "3px", fontSize: "0.68rem" }}>
            <thead>
              <tr>
                {Array.from({ length: dniWMiesiacu }, (_, i) => i + 1).map((dz) => {
                  const iso = `${kalRok}-${String(kalMiesiac).padStart(2, "0")}-${String(dz).padStart(2, "0")}`;
                  const wd = new Date(kalRok, kalMiesiac - 1, dz).getDay();
                  const weekend = wd === 0 || wd === 6;
                  const lista = zadaniaPoDniu.get(iso) ?? [];
                  const sumPlan = lista.reduce((a, r) => a + Number(r.ilosc_plan ?? 0), 0);
                  const sumWyk = lista.reduce((a, r) => a + Number(r.ilosc_wykonano ?? 0), 0);
                  return (
                    <th
                      key={dz}
                      style={{
                        padding: "0.25rem 0.2rem",
                        minWidth: "2.6rem",
                        maxWidth: "3.2rem",
                        verticalAlign: "top",
                        textAlign: "center",
                        background: weekend ? "rgba(30,41,59,0.5)" : "rgba(30,41,59,0.25)",
                        borderRadius: "6px",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: weekend ? "#64748b" : "#94a3b8" }}>{dz}</div>
                      <button
                        type="button"
                        title={`Dodaj przydział na ${dataPLZFormat(iso)}`}
                        onClick={() => {
                          setZadanieEdycjaId(null);
                          setFormZadanie({
                            ...pustyFormZadanie(),
                            data_dnia: iso,
                            kr: filterKrZadania || "",
                          });
                        }}
                        style={{
                          width: "100%",
                          marginTop: "0.2rem",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.58rem",
                          lineHeight: 1.25,
                          padding: "0.2rem 0.1rem",
                          background: lista.length ? "rgba(249,115,22,0.35)" : "rgba(51,65,85,0.4)",
                          color: "#e2e8f0",
                        }}
                      >
                        {lista.length ? (
                          <>
                            {lista.length} wp.
                            <br />
                            <span style={{ opacity: 0.9 }}>
                              Σ {sumPlan.toLocaleString("pl-PL")} / {sumWyk.toLocaleString("pl-PL")}
                            </span>
                          </>
                        ) : (
                          "+"
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
          </table>
        </div>

        <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff", margin: "0 0 0.5rem" }}>
          {zadanieEdycjaId != null ? "Edycja przydziału" : "Nowy przydział"}
        </h4>
        <form style={{ ...s.form, maxWidth: "min(42rem, 100%)", marginBottom: "1rem" }} onSubmit={zapiszZadanie}>
          <label style={s.label}>
            Kod KR <span style={{ color: "#fca5a5" }}>*</span>
            <select
              style={s.input}
              value={formZadanie.kr}
              onChange={(ev) => setFormZadanie((f) => ({ ...f, kr: ev.target.value }))}
              required
            >
              <option value="">— wybierz projekt —</option>
              {krList.map((row) => (
                <option key={String(row.kr)} value={String(row.kr).trim()}>
                  {String(row.kr).trim()}
                </option>
              ))}
            </select>
          </label>
          <label style={s.label}>
            Dzień
            <input
              style={s.input}
              type="date"
              value={formZadanie.data_dnia}
              onChange={(ev) => setFormZadanie((f) => ({ ...f, data_dnia: ev.target.value }))}
              required
            />
          </label>
          <label style={s.label}>
            Opis pracy <span style={{ color: "#fca5a5" }}>*</span>
            <textarea
              style={{ ...s.input, minHeight: "3rem" }}
              value={formZadanie.opis}
              onChange={(ev) => setFormZadanie((f) => ({ ...f, opis: ev.target.value }))}
              required
              placeholder="np. Inwentaryzacja + granica z sąsiadem"
              rows={2}
            />
          </label>
          <label style={s.label}>
            Ilość planowana
            <input
              style={s.input}
              type="text"
              inputMode="decimal"
              value={formZadanie.ilosc_plan}
              onChange={(ev) => setFormZadanie((f) => ({ ...f, ilosc_plan: ev.target.value }))}
            />
          </label>
          <label style={s.label}>
            Ilość wykonana
            <input
              style={s.input}
              type="text"
              inputMode="decimal"
              value={formZadanie.ilosc_wykonano}
              onChange={(ev) => setFormZadanie((f) => ({ ...f, ilosc_wykonano: ev.target.value }))}
            />
          </label>
          <label style={s.label}>
            Kto wykonuje (opcjonalnie)
            <select
              style={s.input}
              value={formZadanie.pracownik_nr}
              onChange={(ev) => setFormZadanie((f) => ({ ...f, pracownik_nr: ev.target.value }))}
            >
              <option value="">— nie przypisano / później —</option>
              {(() => {
                const cur = String(formZadanie.pracownik_nr ?? "").trim();
                const nrs = new Set(pracownicyOpcjeSelect.map((p) => String(p.nr).trim()));
                const orphan = cur !== "" && !nrs.has(cur);
                return (
                  <>
                    {orphan ? (
                      <option key={`orphan-zad-${cur}`} value={cur}>
                        {cur} (nie w liście)
                      </option>
                    ) : null}
                    {pracownicyOpcjeSelect.map((p) => (
                      <option key={p.nr} value={String(p.nr).trim()}>
                        {etykietaPrac(pracownicy, p.nr)}
                      </option>
                    ))}
                  </>
                );
              })()}
            </select>
          </label>
          <label style={s.label}>
            Uwagi
            <input
              style={s.input}
              type="text"
              value={formZadanie.uwagi}
              onChange={(ev) => setFormZadanie((f) => ({ ...f, uwagi: ev.target.value }))}
            />
          </label>
          <div style={s.btnRow}>
            <button type="submit" style={s.btn}>
              {zadanieEdycjaId != null ? "Zapisz zmiany" : "Dodaj przydział"}
            </button>
            {zadanieEdycjaId != null ? (
              <button type="button" style={s.btnGhost} onClick={anulujZadanieEdycje}>
                Anuluj edycję
              </button>
            ) : null}
          </div>
        </form>

        <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff", margin: "0 0 0.5rem" }}>
          Lista w wybranym miesiącu (z uwzględnieniem filtrów)
        </h4>
        <div style={s.tableWrap}>
          <table style={{ ...s.table, fontSize: "0.82rem" }}>
            <thead>
              <tr>
                <th style={s.th}>Dzień</th>
                <th style={s.th}>KR</th>
                <th style={s.th}>Opis</th>
                <th style={s.th}>Plan</th>
                <th style={s.th}>Wykon.</th>
                <th style={s.th}>Kto</th>
                <th style={s.th} />
              </tr>
            </thead>
            <tbody>
              {zadania.length === 0 ? (
                <tr>
                  <td colSpan={7} style={s.td}>
                    <span style={s.muted}>Brak wpisów — dodaj przydział lub zmień filtry / miesiąc.</span>
                  </td>
                </tr>
              ) : (
                zadania.map((row) => (
                  <tr key={row.id}>
                    <td style={s.td}>{dataPLZFormat(dataDoInputa(row.data_dnia))}</td>
                    <td style={s.td}>
                      <strong style={{ color: "#fff" }}>{String(row.kr ?? "").trim() || "—"}</strong>
                    </td>
                    <td style={s.td}>{row.opis?.trim() || "—"}</td>
                    <td style={s.td}>{row.ilosc_plan != null ? String(row.ilosc_plan) : "—"}</td>
                    <td style={s.td}>{row.ilosc_wykonano != null ? String(row.ilosc_wykonano) : "—"}</td>
                    <td style={{ ...s.td, fontSize: "0.78rem" }}>{etykietaPrac(pracownicy, row.pracownik_nr)}</td>
                    <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        style={{ ...s.btnGhost, padding: "0.2rem 0.45rem", fontSize: "0.75rem" }}
                        onClick={() => wczytajZadanie(row)}
                      >
                        Edytuj
                      </button>{" "}
                      <button
                        type="button"
                        style={{ ...s.btnGhost, padding: "0.2rem 0.45rem", fontSize: "0.75rem", color: "#fca5a5" }}
                        onClick={() => void usunZadanie(row.id)}
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...op.sectionCard, marginBottom: "1rem" }}>
        <h3 style={{ ...op.sectionTitle, fontSize: "1.05rem", marginTop: 0 }}>Nazwane zespoły (opcjonalnie)</h3>
        <p style={{ ...s.muted, fontSize: "0.86rem", marginBottom: "0.75rem", maxWidth: "46rem" }}>
          To tylko <strong>listy ludzi</strong> (np. „brygada 2”) — ułatwiają patrzenie, kto zwykle jeździ razem. Nie
          wiążą się z jednym KR; przydziały do projektów ustawiasz wyżej, dzień po dniu.
        </p>

        <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#fff", margin: "0 0 0.5rem" }}>Nowy zespół</h4>
        <form style={{ ...s.form, maxWidth: "min(40rem, 100%)", marginBottom: "1rem" }} onSubmit={zapiszZespol}>
          <label style={s.label}>
            Nazwa <span style={{ color: "#fca5a5" }}>*</span>
            <input
              style={s.input}
              value={formZespol.nazwa}
              onChange={(ev) => setFormZespol((f) => ({ ...f, nazwa: ev.target.value }))}
              placeholder="np. Brygada pomiarowa — noc"
              required
            />
          </label>
          <label style={s.label}>
            Notatki
            <textarea
              style={{ ...s.input, minHeight: "2.5rem" }}
              value={formZespol.notatki}
              onChange={(ev) => setFormZespol((f) => ({ ...f, notatki: ev.target.value }))}
              rows={2}
            />
          </label>
          <div style={s.btnRow}>
            <button type="submit" style={s.btn}>
              Utwórz zespół
            </button>
          </div>
        </form>

        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Nazwa</th>
                <th style={s.th}>Notatki</th>
                <th style={s.th} />
              </tr>
            </thead>
            <tbody>
              {zespoly.length === 0 ? (
                <tr>
                  <td colSpan={3} style={s.td}>
                    <span style={s.muted}>Brak zapisanych grup — możesz korzystać tylko z kalendarza powyżej.</span>
                  </td>
                </tr>
              ) : (
                zespoly.map((z) => {
                  const active = selectedZespolId === z.id;
                  return (
                    <tr
                      key={z.id}
                      style={
                        active
                          ? { background: "rgba(249,115,22,0.08)", boxShadow: "inset 3px 0 0 " + theme.action }
                          : undefined
                      }
                    >
                      <td style={s.td}>
                        <strong style={{ color: "#fff" }}>{z.nazwa?.trim() || "—"}</strong>
                      </td>
                      <td style={{ ...s.td, fontSize: "0.82rem", color: theme.muted }}>{z.notatki?.trim() || "—"}</td>
                      <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          style={{ ...s.btnGhost, padding: "0.25rem 0.5rem", fontSize: "0.78rem" }}
                          onClick={() => setSelectedZespolId(z.id)}
                        >
                          {active ? "Wybrany" : "Skład"}
                        </button>{" "}
                        <button
                          type="button"
                          style={{ ...s.btnGhost, padding: "0.25rem 0.5rem", fontSize: "0.78rem", color: "#fca5a5" }}
                          onClick={() => usunZespol(z.id)}
                        >
                          Usuń
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {wybranyZespol ? (
        <div style={{ ...op.sectionCard, marginBottom: "1rem" }}>
          <h3 style={{ ...op.sectionTitle, fontSize: "1.05rem", marginTop: 0 }}>
            Skład: <span style={{ color: theme.action }}>{wybranyZespol.nazwa?.trim() || "—"}</span>
          </h3>
          {czlonkowieErr ? (
            <div style={{ ...s.errBox, marginBottom: "0.75rem" }} role="alert">
              {czlonkowieErr}
            </div>
          ) : null}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "center" }}>
            <label style={{ ...s.label, margin: 0, flex: "1 1 14rem" }}>
              Dodaj pracownika
              <select style={s.input} value={dodajPracNr} onChange={(ev) => setDodajPracNr(ev.target.value)}>
                <option value="">— wybierz —</option>
                {pracownicyOpcjeSelect
                  .filter((p) => !czlonkowie.includes(String(p.nr).trim()))
                  .map((p) => (
                    <option key={p.nr} value={String(p.nr).trim()}>
                      {etykietaPrac(pracownicy, p.nr)}
                    </option>
                  ))}
              </select>
            </label>
            <button type="button" style={{ ...s.btn, marginTop: "1.35rem" }} onClick={() => void dodajCzlonka()}>
              Dodaj
            </button>
          </div>
          <HelpLinijka wlaczony={trybHelp}>
            Skład zespołu nie blokuje przydziałów — w kalendarzu i tak wybierasz KR i osobę przy każdym wpisie.
          </HelpLinijka>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {czlonkowie.length === 0 ? (
              <span style={s.muted}>Pusta lista — dodaj osoby, jeśli chcesz mieć „szablon” ekipy.</span>
            ) : (
              czlonkowie.map((nr) => (
                <span
                  key={nr}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "8px",
                    background: "rgba(15,23,42,0.75)",
                    border: `1px solid ${theme.border}`,
                    fontSize: "0.82rem",
                    color: "#e2e8f0",
                  }}
                >
                  {etykietaPrac(pracownicy, nr)}
                  <button
                    type="button"
                    style={{ ...s.btnGhost, padding: "0.1rem 0.35rem", fontSize: "0.72rem", color: "#fca5a5" }}
                    onClick={() => void usunCzlonka(nr)}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
