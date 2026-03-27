import { useState } from "react";
import { supabase } from "./lib/supabase.js";

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
};

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

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
          : error.message
      );
    }
  }

  return (
    <div style={a.page}>
      <div style={a.card}>
        <h1 style={a.title}>Logowanie</h1>
        <p style={a.hint}>Aplikacja G4 — dostęp po zalogowaniu.</p>
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
          <button
            type="submit"
            style={loading ? { ...a.btn, ...a.btnDisabled } : a.btn}
            disabled={loading}
          >
            {loading ? "Logowanie…" : "Zaloguj się"}
          </button>
        </form>
      </div>
    </div>
  );
}
