import { useCallback, useEffect, useMemo, useState } from "react";

const LIGHT = {
  panelBg: "linear-gradient(180deg, #e0f2fe 0%, #f8fafc 100%)",
  panelBorder: "1px solid #7dd3fc",
  text: "#0f172a",
  muted: "#475569",
  soft: "#64748b",
  accent: "#0369a1",
  cardBg: "#ffffff",
  cardBorder: "1px solid #cbd5e1",
  bubbleBg: "#ffffff",
  bubbleBorder: "1px solid #e2e8f0",
  inputBorder: "1px solid #94a3b8",
  dangerBg: "#fef2f2",
  dangerBorder: "1px solid #fecaca",
  dangerText: "#991b1b",
  ok: "#166534",
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

/**
 * Główny czat / notatki projektu KR — na górze Tablicy KR.
 */
export function KrNotatkiCzat({
  supabase,
  kr,
  czyMozeEdytowac,
  autorNazwa,
  autorEmail,
}) {
  const krKod = String(kr ?? "").trim();
  const [wpisy, setWpisy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [brakTabeli, setBrakTabeli] = useState(false);
  const [draft, setDraft] = useState("");
  const [wysylanie, setWysylanie] = useState(false);
  const [rozwiniete, setRozwiniete] = useState(false);
  const [edycjaId, setEdycjaId] = useState(null);
  const [edycjaTresc, setEdycjaTresc] = useState("");
  const [zapisywanieEdycji, setZapisywanieEdycji] = useState(false);

  const fetchWpisy = useCallback(async () => {
    if (!krKod) {
      setWpisy([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("kr_notatka")
      .select("id, kr, tresc, autor, autor_email, created_at")
      .eq("kr", krKod)
      .order("created_at", { ascending: false });
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
  }, [supabase, krKod]);

  useEffect(() => {
    void fetchWpisy();
    setEdycjaId(null);
    setEdycjaTresc("");
  }, [fetchWpisy]);

  const widoczne = useMemo(() => {
    if (rozwiniete) return wpisy;
    return wpisy.slice(0, 3);
  }, [wpisy, rozwiniete]);

  async function wyslij(e) {
    e?.preventDefault?.();
    if (!czyMozeEdytowac) {
      alert("Notatki mogą dodawać zalogowane osoby.");
      return;
    }
    if (brakTabeli) {
      setMsg("Brak tabeli notatek. Uruchom w Supabase SQL: g4-app/supabase/kr-notatki-czat.sql");
      return;
    }
    const tekst = String(draft ?? "").trim();
    if (!tekst || !krKod) return;
    const autor =
      String(autorNazwa ?? "").trim() ||
      String(autorEmail ?? "").trim() ||
      "Zalogowany użytkownik";
    const payload = {
      kr: krKod,
      tresc: tekst,
      autor,
      autor_email: String(autorEmail ?? "").trim() || null,
    };
    setMsg(null);
    setWysylanie(true);
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
        setMsg("Brak tabeli notatek. Uruchom w Supabase SQL: g4-app/supabase/kr-notatki-czat.sql");
        return;
      }
      setMsg(`Nie udało się dodać notatki: ${m}`);
      return;
    }
    setWpisy((prev) => [data, ...prev]);
    setDraft("");
    setMsg("Dodano notatkę.");
  }

  function rozpocznijEdycje(w) {
    if (!czyMozeEdytowac) {
      alert("Notatki mogą edytować zalogowane osoby.");
      return;
    }
    setEdycjaId(w.id);
    setEdycjaTresc(String(w.tresc ?? ""));
    setMsg(null);
  }

  function anulujEdycje() {
    setEdycjaId(null);
    setEdycjaTresc("");
  }

  async function zapiszEdycje(e) {
    e?.preventDefault?.();
    if (!czyMozeEdytowac) {
      alert("Notatki mogą edytować zalogowane osoby.");
      return;
    }
    const id = edycjaId;
    const tekst = String(edycjaTresc ?? "").trim();
    if (!id) return;
    if (!tekst) {
      setMsg("Treść notatki nie może być pusta.");
      return;
    }
    setZapisywanieEdycji(true);
    setMsg(null);
    const { data, error } = await supabase
      .from("kr_notatka")
      .update({ tresc: tekst })
      .eq("id", id)
      .select("id, kr, tresc, autor, autor_email, created_at")
      .single();
    setZapisywanieEdycji(false);
    if (error) {
      setMsg(`Nie udało się zapisać zmian: ${error.message}`);
      return;
    }
    setWpisy((prev) => prev.map((x) => (x.id === data.id ? { ...x, ...data } : x)));
    setEdycjaId(null);
    setEdycjaTresc("");
    setMsg("Zapisano zmiany w notatce.");
  }

  if (!krKod) return null;

  return (
    <div
      id="kr-notatki-czat"
      style={{
        marginBottom: "1rem",
        border: LIGHT.panelBorder,
        borderRadius: 12,
        background: LIGHT.panelBg,
        padding: "0.7rem 0.8rem",
        color: LIGHT.text,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", alignItems: "baseline" }}>
        <strong style={{ fontSize: "0.9rem", color: LIGHT.accent }}>CZAT KR</strong>
        <span style={{ fontSize: "0.72rem", color: LIGHT.soft }}>
          KR {krKod} · najnowsze na górze
        </span>
      </div>
      <p style={{ margin: "0.35rem 0 0.55rem", fontSize: "0.78rem", color: LIGHT.muted, lineHeight: 1.45 }}>
        Wątki projektu — ten sam CZAT KR co w Fakturowaniu. Przy wpisie:{" "}
        <strong style={{ color: LIGHT.accent }}>Edytuj wpis</strong>.
      </p>

      {brakTabeli ? (
        <div
          style={{
            marginBottom: "0.55rem",
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
        <div style={{ marginBottom: "0.5rem", fontSize: "0.8rem", color: LIGHT.dangerText }} role="alert">
          {err}
        </div>
      ) : null}
      {msg ? (
        <div style={{ marginBottom: "0.5rem", fontSize: "0.8rem", color: LIGHT.ok }}>{msg}</div>
      ) : null}

      {loading ? (
        <p style={{ margin: 0, fontSize: "0.8rem", color: LIGHT.soft }}>Ładowanie notatek…</p>
      ) : wpisy.length === 0 ? (
        <p style={{ margin: "0 0 0.55rem", fontSize: "0.8rem", color: LIGHT.soft }}>
          Brak notatek — napisz pierwszą wiadomość poniżej.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "0.4rem", marginBottom: "0.55rem" }}>
          {widoczne.map((w) => (
            <div
              key={w.id}
              style={{
                border: LIGHT.cardBorder,
                borderRadius: 9,
                background: LIGHT.bubbleBg,
                padding: "0.4rem 0.55rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.7rem",
                  color: LIGHT.soft,
                  marginBottom: "0.15rem",
                }}
              >
                <strong style={{ color: LIGHT.accent }}>{w.autor || w.autor_email || "—"}</strong>
                <span>{" · "}{formatData(w.created_at) || "—"}</span>
                {czyMozeEdytowac && edycjaId !== w.id ? (
                  <button
                    type="button"
                    onClick={() => rozpocznijEdycje(w)}
                    style={{
                      marginLeft: "auto",
                      background: "#fff",
                      border: `1px solid ${LIGHT.accent}`,
                      borderRadius: 6,
                      color: LIGHT.accent,
                      font: "inherit",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      padding: "0.12rem 0.4rem",
                      cursor: "pointer",
                    }}
                  >
                    Edytuj wpis
                  </button>
                ) : null}
              </div>
              {edycjaId === w.id ? (
                <div style={{ display: "grid", gap: "0.35rem" }}>
                  <textarea
                    value={edycjaTresc}
                    onChange={(e) => setEdycjaTresc(e.target.value)}
                    rows={3}
                    disabled={zapisywanieEdycji}
                    style={{
                      width: "100%",
                      resize: "vertical",
                      minHeight: "2.8rem",
                      padding: "0.4rem 0.5rem",
                      borderRadius: 8,
                      border: LIGHT.inputBorder,
                      background: "#fff",
                      color: LIGHT.text,
                      font: "inherit",
                      fontSize: "0.82rem",
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    <button
                      type="button"
                      disabled={zapisywanieEdycji || !edycjaTresc.trim()}
                      onClick={() => void zapiszEdycje()}
                      style={{
                        background: LIGHT.accent,
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.6rem",
                        cursor: zapisywanieEdycji ? "wait" : "pointer",
                        fontWeight: 700,
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
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.6rem",
                        cursor: "pointer",
                        fontWeight: 700,
                        color: LIGHT.text,
                      }}
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ whiteSpace: "pre-wrap", fontSize: "0.82rem", lineHeight: 1.4, color: LIGHT.text }}>
                  {w.tresc}
                </div>
              )}
            </div>
          ))}
          {wpisy.length > 3 ? (
            <button
              type="button"
              onClick={() => setRozwiniete((v) => !v)}
              style={{
                justifySelf: "start",
                background: "none",
                border: "none",
                padding: "0.1rem 0",
                color: LIGHT.accent,
                font: "inherit",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {rozwiniete ? "Zwiń" : `Rozwiń starsze (${wpisy.length - 3})`}
            </button>
          ) : null}
        </div>
      )}

      {czyMozeEdytowac && !brakTabeli ? (
        <form onSubmit={(e) => void wyslij(e)} style={{ display: "grid", gap: "0.35rem" }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            disabled={wysylanie}
            placeholder="Dodaj notatkę do projektu…"
            style={{
              width: "100%",
              resize: "vertical",
              minHeight: "2.8rem",
              padding: "0.4rem 0.5rem",
              borderRadius: 8,
              border: LIGHT.inputBorder,
              background: "#fff",
              color: LIGHT.text,
              font: "inherit",
              fontSize: "0.82rem",
              boxSizing: "border-box",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void wyslij();
              }
            }}
          />
          <div style={{ display: "flex", gap: "0.45rem", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={wysylanie || !draft.trim()}
              style={{
                background: LIGHT.accent,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: "0.8rem",
                padding: "0.35rem 0.75rem",
                cursor: wysylanie ? "wait" : "pointer",
                fontWeight: 700,
                opacity: wysylanie || !draft.trim() ? 0.65 : 1,
              }}
            >
              {wysylanie ? "Wysyłanie…" : "Dodaj notatkę"}
            </button>
            <span style={{ fontSize: "0.7rem", color: LIGHT.soft }}>Ctrl+Enter = wyślij</span>
            <button
              type="button"
              onClick={() => void fetchWpisy()}
              style={{
                marginLeft: "auto",
                background: "#fff",
                border: LIGHT.cardBorder,
                borderRadius: 8,
                color: LIGHT.text,
                fontSize: "0.75rem",
                padding: "0.25rem 0.5rem",
                cursor: "pointer",
              }}
            >
              Odśwież
            </button>
          </div>
        </form>
      ) : !brakTabeli ? (
        <span style={{ fontSize: "0.75rem", color: LIGHT.soft }}>Zaloguj się, aby dodać notatkę.</span>
      ) : null}
    </div>
  );
}
