import { useCallback, useEffect, useMemo, useState } from "react";

/** Osoby, które mogą tworzyć zadania z CZAT KR (dopasowanie po imię_nazwisko / e-mail). */
export const CZAT_KR_ZADANIA_OSOBY = [
  { id: "damian", label: "Damian", match: /damian/i },
  { id: "michal", label: "Michał", match: /micha[łl]/i },
  { id: "monika", label: "Monika", match: /monika/i },
  { id: "ania", label: "Ania Homik", match: /homik/i },
  { id: "gosia", label: "Gosia Franczak", match: /franczak/i },
];

export function czyMozeDodawacZadaniaZCzatKr({ imieNazwisko, email, czyAdmin }) {
  if (czyAdmin) return true;
  const blob = `${imieNazwisko ?? ""} ${email ?? ""}`;
  return CZAT_KR_ZADANIA_OSOBY.some((o) => o.match.test(blob));
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
 * CZAT KR — wspólny widok wpisów do projektów (tabela kr_notatka).
 * Wszyscy zalogowani mogą pisać; zadania z czatu tylko wybrani kierownicy.
 */
export function CzatKrPanel({
  supabase,
  autorNazwa,
  autorEmail,
  czyAdmin,
  czyMozePisac,
  krList = [],
  onOtworzKr,
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
  const [filtrKr, setFiltrKr] = useState("wszystkie");

  const [pokazZadanie, setPokazZadanie] = useState(false);
  const [zadanieTytul, setZadanieTytul] = useState("");
  const [zadanieDla, setZadanieDla] = useState(CZAT_KR_ZADANIA_OSOBY[0].label);
  const [zadanieKr, setZadanieKr] = useState("");
  const [zadanieDeadline, setZadanieDeadline] = useState("");
  const [zapisZadania, setZapisZadania] = useState(false);

  const mozeZadania = czyMozeDodawacZadaniaZCzatKr({
    imieNazwisko: autorNazwa,
    email: autorEmail,
    czyAdmin,
  });

  const fetchWpisy = useCallback(async () => {
    setLoading(true);
    setErr(null);
    let q = supabase
      .from("kr_notatka")
      .select("id, kr, tresc, autor, autor_email, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filtrKr && filtrKr !== "wszystkie") {
      q = q.eq("kr", filtrKr);
    }
    const { data, error } = await q;
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
  }, [supabase, filtrKr]);

  useEffect(() => {
    void fetchWpisy();
  }, [fetchWpisy]);

  const widoczne = useMemo(() => {
    if (rozwiniete) return wpisy;
    return wpisy.slice(0, 10);
  }, [wpisy, rozwiniete]);

  const krOpcje = useMemo(() => {
    return [...(krList ?? [])]
      .map((r) => String(r.kr ?? "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "pl", { numeric: true }));
  }, [krList]);

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
      setMsg("Wybierz KR, do którego dopisujesz wpis.");
      return;
    }
    const tekst = String(draft ?? "").trim();
    if (!tekst) return;
    const autor =
      String(autorNazwa ?? "").trim() ||
      String(autorEmail ?? "").trim() ||
      "Użytkownik";
    setMsg(null);
    setWysylanie(true);
    const { data, error } = await supabase
      .from("kr_notatka")
      .insert([
        {
          kr,
          tresc: tekst,
          autor,
          autor_email: String(autorEmail ?? "").trim() || null,
        },
      ])
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
    setMsg(`Dodano wpis do KR ${kr}.`);
  }

  async function utworzZadanie(e) {
    e?.preventDefault?.();
    if (!mozeZadania) {
      alert("Zadania z CZAT KR mogą dodawać: Damian, Michał, Monika, Ania Homik, Gosia Franczak.");
      return;
    }
    const tytul = String(zadanieTytul ?? "").trim();
    if (!tytul) {
      setMsg("Podaj treść zadania.");
      return;
    }
    const dla = String(zadanieDla ?? "").trim();
    const kr = String(zadanieKr || wybranyKr || "").trim() || null;
    const zlecajacy =
      String(autorNazwa ?? "").trim() ||
      String(autorEmail ?? "").trim() ||
      "Kierownik";
    const payload = {
      zadanie: tytul,
      osoba_odpowiedzialna: dla,
      osoba_zlecajaca: zlecajacy,
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
      const info = `✅ Zadanie dla ${dla}: ${tytul}`;
      const autor = zlecajacy;
      const { data } = await supabase
        .from("kr_notatka")
        .insert([
          {
            kr,
            tresc: info,
            autor,
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
    setMsg(`Utworzono zadanie dla ${dla}${kr ? ` (KR ${kr})` : ""}.`);
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
            Wpisy do projektów (KR) — użytkownicy i kierownicy. Ten sam wątek co na Tablicy KR.
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

      <div
        style={{
          marginTop: "0.7rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        <label style={{ fontSize: "0.8rem", color: LIGHT.muted }}>
          Filtr{" "}
          <select
            value={filtrKr}
            onChange={(e) => setFiltrKr(e.target.value)}
            style={{ ...inputSt, width: "auto", minWidth: "8rem", display: "inline-block" }}
          >
            <option value="wszystkie">Wszystkie KR</option>
            {krOpcje.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.4rem" }}>
        {loading ? (
          <p style={{ margin: 0, fontSize: "0.8rem", color: LIGHT.soft }}>Ładowanie…</p>
        ) : wpisy.length === 0 ? (
          <p style={{ margin: 0, fontSize: "0.8rem", color: LIGHT.soft }}>
            Brak wpisów — wybierz KR i napisz pierwszą wiadomość.
          </p>
        ) : (
          <>
            {widoczne.map((w) => (
              <div
                key={w.id}
                style={{
                  border: LIGHT.cardBorder,
                  borderRadius: 10,
                  background: LIGHT.cardBg,
                  padding: "0.45rem 0.6rem",
                }}
              >
                <div style={{ fontSize: "0.7rem", color: LIGHT.soft, marginBottom: 4 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setWybranyKr(String(w.kr ?? "").trim());
                      setFiltrKr(String(w.kr ?? "").trim() || "wszystkie");
                      if (typeof onOtworzKr === "function" && w.kr) onOtworzKr(w.kr);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: LIGHT.accent,
                      fontWeight: 800,
                      cursor: "pointer",
                      font: "inherit",
                      fontSize: "0.7rem",
                    }}
                    title="Ustaw ten KR do wpisu"
                  >
                    KR {w.kr || "—"}
                  </button>
                  {" · "}
                  <strong style={{ color: LIGHT.text }}>{w.autor || w.autor_email || "—"}</strong>
                  {" · "}
                  {formatData(w.created_at) || "—"}
                </div>
                <div style={{ whiteSpace: "pre-wrap", fontSize: "0.84rem", lineHeight: 1.4 }}>{w.tresc}</div>
                {mozeZadania ? (
                  <button
                    type="button"
                    onClick={() => {
                      setZadanieTytul(String(w.tresc ?? "").slice(0, 200));
                      setZadanieKr(String(w.kr ?? "").trim());
                      setPokazZadanie(true);
                    }}
                    style={{
                      marginTop: "0.35rem",
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: LIGHT.accent,
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Utwórz zadanie z tej wiadomości
                  </button>
                ) : null}
              </div>
            ))}
            {wpisy.length > 10 ? (
              <button
                type="button"
                onClick={() => setRozwiniete((v) => !v)}
                style={{
                  justifySelf: "start",
                  background: "none",
                  border: "none",
                  color: LIGHT.accent,
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {rozwiniete ? "Zwiń" : `Pokaż starsze (${wpisy.length - 10})`}
              </button>
            ) : null}
          </>
        )}
      </div>

      {czyMozePisac && !brakTabeli ? (
        <form onSubmit={(e) => void wyslij(e)} style={{ marginTop: "0.85rem", display: "grid", gap: "0.45rem" }}>
          <label style={{ fontSize: "0.75rem", color: LIGHT.muted, display: "grid", gap: 4 }}>
            KR *
            <select
              style={inputSt}
              value={wybranyKr}
              onChange={(e) => setWybranyKr(e.target.value)}
              required
            >
              <option value="">— wybierz projekt —</option>
              {krOpcje.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            disabled={wysylanie}
            placeholder="Wpis do wybranego KR…"
            style={{ ...inputSt, resize: "vertical", minHeight: "3.2rem" }}
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
              disabled={wysylanie || !draft.trim() || !wybranyKr}
              style={{
                background: LIGHT.accent,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0.4rem 0.85rem",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: wysylanie ? "wait" : "pointer",
                opacity: wysylanie || !draft.trim() || !wybranyKr ? 0.65 : 1,
              }}
            >
              {wysylanie ? "Wysyłanie…" : "Dodaj wpis do KR"}
            </button>
            {mozeZadania ? (
              <button
                type="button"
                onClick={() => {
                  setPokazZadanie((v) => !v);
                  if (!pokazZadanie) {
                    if (draft.trim()) setZadanieTytul(draft.trim().slice(0, 200));
                    if (wybranyKr) setZadanieKr(wybranyKr);
                  }
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
            <span style={{ fontSize: "0.7rem", color: LIGHT.soft }}>Ctrl+Enter = wyślij</span>
          </div>
        </form>
      ) : !brakTabeli ? (
        <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: LIGHT.soft }}>
          Zaloguj się, aby dodać wpis do CZAT KR.
        </p>
      ) : null}

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
            Zadanie z CZAT KR (Damian · Michał · Monika · Ania Homik · Gosia Franczak)
          </strong>
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
              gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))",
              gap: "0.45rem",
            }}
          >
            <label style={{ fontSize: "0.75rem", color: LIGHT.muted, display: "grid", gap: 4 }}>
              Dla kogo *
              <select style={inputSt} value={zadanieDla} onChange={(e) => setZadanieDla(e.target.value)}>
                {CZAT_KR_ZADANIA_OSOBY.map((o) => (
                  <option key={o.id} value={o.label}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: "0.75rem", color: LIGHT.muted, display: "grid", gap: 4 }}>
              KR
              <select style={inputSt} value={zadanieKr} onChange={(e) => setZadanieKr(e.target.value)}>
                <option value="">— bez KR —</option>
                {krOpcje.map((k) => (
                  <option key={k} value={k}>
                    {k}
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
    </div>
  );
}

/** @deprecated użyj CzatKrPanel */
export const KierownictwoCzatPanel = CzatKrPanel;
export const KIEROWNICTWO_CZAT_OSOBY = CZAT_KR_ZADANIA_OSOBY;
export const czyDostepCzatKierownictwa = czyMozeDodawacZadaniaZCzatKr;
