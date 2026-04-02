import React from "react";

/** Styl panelu operacyjnego — ciemny, „menedżerski”, bez zewnętrznej biblioteki UI. */
export const op = {
  shellOuter: {
    minHeight: "100vh",
    background: "linear-gradient(165deg, #0a0e14 0%, #0d1117 38%, #080b10 100%)",
    color: "#e6edf3",
    fontFamily: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    WebkitFontSmoothing: "antialiased",
    textAlign: "left",
    boxSizing: "border-box",
  },
  shellGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(272px, 320px)",
    gap: "clamp(1rem, 2vw, 1.75rem)",
    maxWidth: "1560px",
    margin: "0 auto",
    padding: "1rem clamp(0.65rem, 2vw, 1.5rem) 2.75rem",
    boxSizing: "border-box",
    alignItems: "start",
  },
  shellMain: {
    minWidth: 0,
    paddingTop: "0.25rem",
  },
  shellAside: {
    position: "sticky",
    top: "0.85rem",
    alignSelf: "start",
    maxHeight: "calc(100vh - 1.7rem)",
    overflowY: "auto",
    borderRadius: "20px",
    padding: "1.15rem 1rem",
    background: "rgba(17, 24, 32, 0.94)",
    border: "1px solid rgba(148, 163, 184, 0.11)",
    boxShadow: "0 24px 48px -12px rgba(0,0,0,0.5)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  },
  brandKicker: {
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#64748b",
    margin: "0 0 0.25rem",
  },
  brandTitle: {
    fontSize: "clamp(1.2rem, 2.4vw, 1.55rem)",
    fontWeight: 700,
    color: "#f8fafc",
    margin: "0 0 0.35rem",
    letterSpacing: "-0.025em",
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: "0.84rem",
    color: "#94a3b8",
    margin: "0 0 1.1rem",
    lineHeight: 1.45,
    maxWidth: "38rem",
  },
  searchInput: {
    width: "100%",
    padding: "0.55rem 0.75rem",
    borderRadius: "10px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(148,163,184,0.2)",
    background: "rgba(15, 23, 42, 0.65)",
    color: "#f1f5f9",
    font: "inherit",
    fontSize: "0.84rem",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "0.65rem",
  },
  navBtn: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "0.55rem 0.72rem",
    marginBottom: "0.28rem",
    borderRadius: "10px",
    border: "1px solid transparent",
    background: "transparent",
    color: "#e2e8f0",
    font: "inherit",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    lineHeight: 1.35,
  },
  navBtnActive: {
    background: "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(99,102,241,0.12))",
    borderColor: "rgba(56,189,248,0.35)",
    color: "#f0f9ff",
  },
  krListItem: (active, alertDot) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    width: "100%",
    padding: "0.48rem 0.55rem",
    marginBottom: "0.2rem",
    borderRadius: "10px",
    border:
      active
        ? "1px solid rgba(56,189,248,0.45)"
        : "1px solid rgba(255,255,255,0.06)",
    background: active ? "rgba(56,189,248,0.1)" : "rgba(15,23,42,0.4)",
    color: "#e2e8f0",
    font: "inherit",
    fontSize: "0.8rem",
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    textAlign: "left",
  }),
  dot: (color) => ({
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }),
  pillsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
    marginBottom: "1rem",
  },
  pill: (active) => ({
    padding: "0.38rem 0.75rem",
    borderRadius: "999px",
    fontSize: "0.76rem",
    fontWeight: 600,
    border: active
      ? "1px solid rgba(56,189,248,0.5)"
      : "1px solid rgba(148,163,184,0.2)",
    background: active
      ? "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(99,102,241,0.12))"
      : "rgba(15,23,42,0.55)",
    color: active ? "#e0f2fe" : "#94a3b8",
    cursor: "pointer",
    font: "inherit",
  }),
  heroCard: {
    borderRadius: "20px",
    padding: "1.35rem 1.5rem",
    marginBottom: "1.35rem",
    background: "linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.88))",
    border: "1px solid rgba(148,163,184,0.12)",
    boxShadow: "0 20px 40px -16px rgba(0,0,0,0.55)",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "0.85rem",
    marginBottom: "1.35rem",
  },
  kpiCard: (borderTint) => ({
    borderRadius: "16px",
    padding: "1rem 1.05rem",
    background: "rgba(15,23,42,0.65)",
    border: `1px solid ${borderTint}`,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  }),
  sectionCard: {
    borderRadius: "18px",
    padding: "1.2rem 1.35rem",
    marginBottom: "1.15rem",
    background: "rgba(17,24,32,0.72)",
    border: "1px solid rgba(148,163,184,0.1)",
  },
  sectionTitle: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#f1f5f9",
    margin: "0 0 0.85rem",
    letterSpacing: "-0.02em",
  },
  badge: (bg, color) => ({
    display: "inline-block",
    padding: "0.28rem 0.6rem",
    borderRadius: "8px",
    fontSize: "0.74rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    background: bg,
    color,
    lineHeight: 1.35,
  }),
  muted: { color: "#94a3b8", fontSize: "0.84rem", lineHeight: 1.5 },
  alertRow: (severity) => {
    const map = {
      krytyczny: { bg: "rgba(239,68,68,0.1)", border: "rgba(248,113,113,0.35)", c: "#fecaca" },
      wazny: { bg: "rgba(234,179,8,0.1)", border: "rgba(250,204,21,0.35)", c: "#fde68a" },
      info: { bg: "rgba(59,130,246,0.08)", border: "rgba(96,165,250,0.3)", c: "#bfdbfe" },
    };
    const t = map[severity] || map.info;
    return {
      padding: "0.75rem 0.9rem",
      borderRadius: "12px",
      marginBottom: "0.45rem",
      border: `1px solid ${t.border}`,
      background: t.bg,
      color: t.c,
      fontSize: "0.82rem",
      lineHeight: 1.45,
    };
  },
};

export function OpKpiCard({ label, value, hint, border = "rgba(56,189,248,0.22)", onClick, title: kpiTitle }) {
  const interactive = typeof onClick === "function";
  const [hover, setHover] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const baseKpi = op.kpiCard(border);
  const cardStyle = {
    ...baseKpi,
    ...(interactive
      ? {
          cursor: "pointer",
          outline: "none",
          transform: hover || focused ? "translateY(-2px)" : undefined,
          boxShadow: focused
            ? `0 0 0 2px rgba(56,189,248,0.55), inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px -8px rgba(0,0,0,0.45)`
            : hover
              ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px -8px rgba(0,0,0,0.45)`
              : baseKpi.boxShadow,
        }
      : {}),
  };
  return (
    <div
      style={cardStyle}
      onClick={interactive ? () => onClick() : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      onMouseEnter={interactive ? () => setHover(true) : undefined}
      onMouseLeave={interactive ? () => setHover(false) : undefined}
      onFocus={interactive ? () => setFocused(true) : undefined}
      onBlur={
        interactive
          ? () => {
              setFocused(false);
              setHover(false);
            }
          : undefined
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      title={kpiTitle ?? (interactive ? `Kliknij: ${label}` : undefined)}
    >
      <div style={{ ...op.muted, fontSize: "0.72rem", marginBottom: "0.35rem", fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: "1.55rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.03em" }}>
        {value}
      </div>
      {hint ? (
        <div style={{ ...op.muted, fontSize: "0.7rem", marginTop: "0.35rem" }}>{hint}</div>
      ) : null}
    </div>
  );
}

/** Blok „gotowe pod wdrożenie” — koncepcyjny moduł bez danych z bazy. */
export function OpFutureModule({ title, children }) {
  return (
    <div style={{ ...op.sectionCard, borderStyle: "dashed", borderColor: "rgba(148,163,184,0.22)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem" }}>
        <span style={op.badge("rgba(99,102,241,0.25)", "#c7d2fe")}>Wersja koncepcyjna</span>
        <h3 style={{ ...op.sectionTitle, margin: 0, flex: 1 }}>{title}</h3>
      </div>
      <p style={{ ...op.muted, margin: 0 }}>{children}</p>
    </div>
  );
}
