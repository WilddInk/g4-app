import { useState } from "react";
import { supabase } from "./lib/supabase.js";

/** URL powrotu z linku w e-mailu Supabase (reset hasła). Musi być na liście Redirect URLs w panelu. */
function adresPowrotuZMailaAuth() {
  const zEnv = import.meta.env.VITE_AUTH_REDIRECT_URL?.trim();
  if (zEnv) return zEnv;
  return `${window.location.origin}${window.location.pathname}`;
}

const a = {
  page: {
    padding: "clamp(0.75rem, 2vw, 1.75rem) clamp(0.75rem, 3vw, 2rem)",
    width: "100%",
    maxWidth: "100%",
    minHeight: "100vh",
    boxSizing: "border-box",
    fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
    lineHeight: 1.55,
    color: "#e8e8e8",
    background: "#070707",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: "22rem",
    padding: "1.35rem",
    border: "1px solid #2e2e2e",
    borderRadius: "12px",
    background: "#101010",
  },
  title: {
    marginTop: 0,
    marginBottom: "0.35rem",
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#fff",
  },
  hint: {
    marginTop: 0,
    marginBottom: "1.1rem",
    fontSize: "0.86rem",
    color: "#a3a3a3",
  },
  label: {
    display: "block",
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "#c8c8c8",
    marginBottom: "0.35rem",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "0.55rem 0.65rem",
    borderRadius: "8px",
    border: "1px solid #3a3a3a",
    background: "#0d0d0d",
    color: "#eaeaea",
    font: "inherit",
    marginBottom: "0.85rem",
  },
  btn: {
    width: "100%",
    marginTop: "0.35rem",
    padding: "0.6rem 1rem",
    borderRadius: "8px",
    border: "1px solid #e5e5e5",
    background: "#f5f5f5",
    color: "#0a0a0a",
    font: "inherit",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnGhost: {
    width: "100%",
    marginTop: "0.5rem",
    padding: "0.45rem 1rem",
    borderRadius: "8px",
    border: "1px solid #4a4a4a",
    background: "transparent",
    color: "#c4c4c4",
    font: "inherit",
    fontSize: "0.86rem",
    cursor: "pointer",
  },
  btnDisabled: { opacity: 0.65, cursor: "not-allowed" },
  err: {
    marginTop: 0,
    marginBottom: "0.85rem",
    padding: "0.55rem 0.65rem",
    borderRadius: "8px",
    background: "rgba(180, 40, 40, 0.2)",
    border: "1px solid #6a2a2a",
    color: "#ffb4b4",
    fontSize: "0.86rem",
  },
  ok: {
    marginTop: 0,
    marginBottom: "0.85rem",
    padding: "0.55rem 0.65rem",
    borderRadius: "8px",
    background: "rgba(34, 197, 94, 0.15)",
    border: "1px solid #14532d",
    color: "#86efac",
    fontSize: "0.86rem",
  },
  textLink: {
    background: "none",
    border: "none",
    padding: "0.25rem 0",
    marginBottom: "0.85rem",
    color: "#7dd3fc",
    font: "inherit",
    fontSize: "0.86rem",
    cursor: "pointer",
    textDecoration: "underline",
    textAlign: "left",
    display: "inline",
  },
};

/**
 * @param {{ trybNoweHasloPoLinkuZEmaila?: boolean; onNoweHasloZapisane?: () => void }} props
 */
export function AuthScreen({ trybNoweHasloPoLinkuZEmaila = false, onNoweHasloZapisane }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [widokResetu, setWidokResetu] = useState(false);
  const [resetWyslany, setResetWyslany] = useState(false);

  const [hasloNowe, setHasloNowe] = useState("");
  const [hasloNowe2, setHasloNowe2] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    const em = email.trim();
    if (!em || !password) {
      setErr("Podaj adres e-mail i hasło.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: em,
      password,
    });
    setLoading(false);
    if (error) {
      setErr(
        error.message.includes("Invalid login")
          ? "Nieprawidłowy e-mail lub hasło."
          : error.message,
      );
    }
  }

  async function wyslijLinkResetu(e) {
    e.preventDefault();
    setErr(null);
    setResetWyslany(false);
    const em = email.trim();
    if (!em) {
      setErr("Podaj adres e-mail, na który założono jest konto.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(em, {
      redirectTo: adresPowrotuZMailaAuth(),
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setResetWyslany(true);
  }

  async function zapiszNoweHaslo(e) {
    e.preventDefault();
    setErr(null);
    if (hasloNowe.length < 6) {
      setErr("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    if (hasloNowe !== hasloNowe2) {
      setErr("Powtórzone hasło jest inne.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: hasloNowe });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    onNoweHasloZapisane?.();
  }

  if (trybNoweHasloPoLinkuZEmaila) {
    return (
      <div style={a.page}>
        <div style={a.card}>
          <h1 style={a.title}>Nowe hasło</h1>
          <p style={a.hint}>Link z wiadomości e-mail jest ważny przez krótki czas. Ustal nowe hasło do konta.</p>
          <form onSubmit={zapiszNoweHaslo} noValidate>
            {err ? (
              <p style={a.err} role="alert">
                {err}
              </p>
            ) : null}
            <label style={a.label} htmlFor="auth-new-pw">
              Nowe hasło
            </label>
            <input
              id="auth-new-pw"
              type="password"
              name="new-password"
              autoComplete="new-password"
              value={hasloNowe}
              onChange={(ev) => setHasloNowe(ev.target.value)}
              style={a.input}
              disabled={loading}
            />
            <label style={a.label} htmlFor="auth-new-pw2">
              Powtórz hasło
            </label>
            <input
              id="auth-new-pw2"
              type="password"
              name="new-password-confirm"
              autoComplete="new-password"
              value={hasloNowe2}
              onChange={(ev) => setHasloNowe2(ev.target.value)}
              style={a.input}
              disabled={loading}
            />
            <button type="submit" style={loading ? { ...a.btn, ...a.btnDisabled } : a.btn} disabled={loading}>
              {loading ? "Zapisywanie…" : "Zapisz hasło i kontynuuj"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={a.page}>
      <div style={a.card}>
        <h1 style={a.title}>{widokResetu ? "Reset hasła" : "Logowanie"}</h1>
        <p style={a.hint}>
          {widokResetu
            ? "Wyślemy wiadomość z linkiem. Otwórz go w tej samej przeglądarce — wrócisz do aplikacji, by ustawić nowe hasło."
            : "Aplikacja G4 — dostęp po zalogowaniu."}
        </p>
        {widokResetu ? (
          <form onSubmit={wyslijLinkResetu} noValidate>
            {err ? (
              <p style={a.err} role="alert">
                {err}
              </p>
            ) : null}
            {resetWyslany ? (
              <p style={a.ok} role="status">
                Jeśli konto istnieje, za chwilę powinieneś dostać e-mail z linkiem. Sprawdź także folder spam.
              </p>
            ) : null}
            <label style={a.label} htmlFor="auth-email-reset">
              E-mail
            </label>
            <input
              id="auth-email-reset"
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              style={a.input}
              disabled={loading}
            />
            <button type="submit" style={loading ? { ...a.btn, ...a.btnDisabled } : a.btn} disabled={loading}>
              {loading ? "Wysyłanie…" : "Wyślij link resetujący"}
            </button>
            <button
              type="button"
              style={a.btnGhost}
              disabled={loading}
              onClick={() => {
                setWidokResetu(false);
                setErr(null);
                setResetWyslany(false);
              }}
            >
              Wróć do logowania
            </button>
          </form>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            {err ? (
              <p style={a.err} role="alert">
                {err}
              </p>
            ) : null}
            <label style={a.label} htmlFor="auth-email">
              E-mail
            </label>
            <input
              id="auth-email"
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              style={a.input}
              disabled={loading}
            />
            <label style={a.label} htmlFor="auth-password">
              Hasło
            </label>
            <input
              id="auth-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              style={a.input}
              disabled={loading}
            />
            <button type="submit" style={loading ? { ...a.btn, ...a.btnDisabled } : a.btn} disabled={loading}>
              {loading ? "Logowanie…" : "Zaloguj się"}
            </button>
            <button
              type="button"
              style={a.textLink}
              disabled={loading}
              onClick={() => {
                setWidokResetu(true);
                setErr(null);
                setResetWyslany(false);
              }}
            >
              Nie pamiętasz hasła?
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
