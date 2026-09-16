import { useEffect, useState } from "react";
import { normalizujKrZArkusza } from "./lib/krNormalize.js";

export const KR_STATUS_NOWA = ["w trakcie", "zakończone", "oczekuje na zamawiającego"];

/**
 * INSERT do `public.kr` (ten sam słownik, który ciągnie księgowość z Supabase).
 * @returns {{ ok: true, kr: string } | { ok: false, error: string }}
 */
export async function utworzKrWSupabase(supabase, { kr, nazwaObiektu, status }, krList = []) {
  const kod = normalizujKrZArkusza(kr);
  if (!kod) return { ok: false, error: "Podaj numer KR." };
  const nazwa = String(nazwaObiektu ?? "").trim();
  if (!nazwa) return { ok: false, error: "Podaj nazwę obiektu." };
  const stRaw = String(status ?? "").trim();
  const st = stRaw === "" ? "w trakcie" : stRaw;
  if (!KR_STATUS_NOWA.includes(st)) {
    return { ok: false, error: "Nieprawidłowy status. Wybierz jedną z opcji listy." };
  }
  const istnieje = (krList ?? []).some((r) => String(r?.kr ?? "").trim() === kod);
  if (istnieje) {
    return { ok: false, error: `KR ${kod} już jest w bazie.` };
  }

  const { data, error } = await supabase
    .from("kr")
    .insert([
      {
        kr: kod,
        nazwa_obiektu: nazwa,
        status: st,
      },
    ])
    .select("kr")
    .single();

  if (error) {
    const msg = String(error.message ?? error);
    if (/duplicate|unique|already exists/i.test(msg)) {
      return { ok: false, error: `KR ${kod} już istnieje w bazie.` };
    }
    return { ok: false, error: msg };
  }
  if (!data?.kr) {
    return {
      ok: false,
      error:
        "INSERT nie zwrócił wiersza (często RLS / GRANT). Uruchom rls-policies-anon.sql w Supabase.",
    };
  }
  return { ok: true, kr: String(data.kr).trim() || kod };
}

const fieldSt = {
  width: "100%",
  boxSizing: "border-box",
  padding: "0.4rem 0.55rem",
  borderRadius: 8,
  border: "1px solid #94a3b8",
  background: "#fff",
  color: "#0f172a",
  font: "inherit",
  fontSize: "0.84rem",
};

/**
 * Kompaktowy formularz nowej KR (CZAT KR / Bieżące KR).
 */
export function NowaKrForm({
  supabase,
  krList = [],
  czyMozeTworzyc = false,
  poczatkowyKod = "",
  onUtworzono,
  onAnuluj,
}) {
  const [kod, setKod] = useState(() => normalizujKrZArkusza(poczatkowyKod));
  const [nazwa, setNazwa] = useState("");
  const [status, setStatus] = useState("w trakcie");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const n = normalizujKrZArkusza(poczatkowyKod);
    if (n) setKod(n);
  }, [poczatkowyKod]);

  async function zapisz(e) {
    e?.preventDefault?.();
    if (!czyMozeTworzyc) {
      setErr("Nowe KR mogą dodawać role: admin i kierownik.");
      return;
    }
    setErr(null);
    setBusy(true);
    const wynik = await utworzKrWSupabase(
      supabase,
      { kr: kod, nazwaObiektu: nazwa, status },
      krList,
    );
    setBusy(false);
    if (!wynik.ok) {
      setErr(wynik.error);
      return;
    }
    setNazwa("");
    setKod("");
    setStatus("w trakcie");
    if (typeof onUtworzono === "function") await onUtworzono(wynik.kr);
  }

  return (
    <form
      onSubmit={(e) => void zapisz(e)}
      style={{
        marginTop: "0.65rem",
        padding: "0.7rem 0.8rem",
        borderRadius: 10,
        background: "#fff",
        border: "1px solid #7dd3fc",
        display: "grid",
        gap: "0.45rem",
      }}
    >
      <strong style={{ fontSize: "0.88rem", color: "#0369a1" }}>Nowa KR</strong>
      <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", lineHeight: 1.4 }}>
        Zapis idzie do bazy portalu. W księgowości: Słownik KR → „Pobierz nowe KR z portalu”.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(8.5rem, 1fr))",
          gap: "0.45rem",
          alignItems: "end",
        }}
      >
        <label style={{ display: "grid", gap: 4, fontSize: "0.75rem", color: "#475569" }}>
          Numer KR
          <input
            style={fieldSt}
            value={kod}
            onChange={(e) => setKod(e.target.value)}
            onBlur={() => setKod((v) => normalizujKrZArkusza(v))}
            placeholder="np. 0998"
            autoComplete="off"
            required
          />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: "0.75rem", color: "#475569" }}>
          Nazwa obiektu
          <input
            style={fieldSt}
            value={nazwa}
            onChange={(e) => setNazwa(e.target.value)}
            placeholder="np. Warszawa, ul. …"
            required
          />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: "0.75rem", color: "#475569" }}>
          Status
          <select style={fieldSt} value={status} onChange={(e) => setStatus(e.target.value)}>
            {KR_STATUS_NOWA.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </label>
      </div>
      {err ? (
        <div style={{ color: "#991b1b", fontSize: "0.8rem" }} role="alert">
          {err}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
        <button
          type="submit"
          disabled={busy || !czyMozeTworzyc}
          style={{
            background: "#0369a1",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: "0.82rem",
            fontWeight: 800,
            padding: "0.4rem 0.85rem",
            cursor: busy || !czyMozeTworzyc ? "not-allowed" : "pointer",
            opacity: busy || !czyMozeTworzyc ? 0.65 : 1,
          }}
        >
          {busy ? "Zapisywanie…" : "Zapisz KR"}
        </button>
        {typeof onAnuluj === "function" ? (
          <button
            type="button"
            onClick={() => onAnuluj()}
            disabled={busy}
            style={{
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              color: "#0f172a",
              fontSize: "0.82rem",
              fontWeight: 700,
              padding: "0.4rem 0.75rem",
              cursor: "pointer",
            }}
          >
            Anuluj
          </button>
        ) : null}
      </div>
    </form>
  );
}
