import React from "react";

/** Tokeny kolorystyczne — dashboard / system operacyjny. */
export const theme = {
  bg: "#0b0f14",
  surface: "#111827",
  sidebar: "#080c10",
  text: "#e5e7eb",
  muted: "#9ca3af",
  success: "#22c55e",
  action: "#f97316",
  danger: "#ef4444",
  border: "rgba(148, 163, 184, 0.1)",
};

/** Styl panelu operacyjnego — ciemny, „menedżerski”, bez zewnętrznej biblioteki UI. */
export const op = {
  shellOuter: {
    minHeight: "100vh",
    background: theme.bg,
    color: theme.text,
    fontFamily: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    WebkitFontSmoothing: "antialiased",
    textAlign: "left",
    boxSizing: "border-box",
  },
  shellLayout: {
    display: "grid",
    gridTemplateColumns: "240px minmax(0, 1fr)",
    gridTemplateAreas: '"sidebar main"',
    minHeight: "100vh",
    width: "100%",
    maxWidth: "100%",
    margin: 0,
    boxSizing: "border-box",
    alignItems: "stretch",
  },
  shellSidebar: {
    gridArea: "sidebar",
    boxSizing: "border-box",
    background: theme.sidebar,
    borderRight: `1px solid ${theme.border}`,
    padding: "1.25rem 0.9rem",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    minHeight: "100vh",
    overflowY: "auto",
    alignSelf: "stretch",
  },
  shellMain: {
    gridArea: "main",
    minWidth: 0,
    padding: "clamp(1.25rem, 2.5vw, 2rem)",
    boxSizing: "border-box",
    background: theme.bg,
  },
  brandKicker: {
    fontSize: "0.62rem",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: theme.muted,
    margin: "0 0 0.2rem",
  },
  brandTitle: {
    fontSize: "clamp(1.35rem, 2.2vw, 1.75rem)",
    fontWeight: 700,
    color: "#ffffff",
    margin: "0 0 0.4rem",
    letterSpacing: "-0.03em",
    lineHeight: 1.15,
  },
  brandSub: {
    fontSize: "0.9rem",
    color: theme.muted,
    margin: "0 0 1.25rem",
    lineHeight: 1.55,
    maxWidth: "44rem",
  },
  searchInput: {
    width: "100%",
    padding: "0.6rem 0.75rem",
    borderRadius: "10px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: theme.border,
    background: "rgba(17,24,39,0.85)",
    color: theme.text,
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
    padding: "0.6rem 0.85rem",
    marginBottom: "0.2rem",
    borderRadius: "10px",
    border: "1px solid rgba(248,250,252,0.28)",
    background: "rgba(15,23,42,0.22)",
    color: theme.text,
    font: "inherit",
    fontSize: "0.88rem",
    fontWeight: 600,
    cursor: "pointer",
    lineHeight: 1.35,
    transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
  },
  navBtnHover: {
    background: "rgba(249,115,22,0.08)",
    borderColor: "rgba(249,115,22,0.28)",
  },
  navBtnActive: {
    background: "rgba(249,115,22,0.18)",
    borderColor: "rgba(249,115,22,0.55)",
    color: "#fff",
    boxShadow: "inset 0 0 0 1px rgba(249,115,22,0.25)",
  },
  navSectionLabel: {
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: theme.muted,
    margin: "1rem 0 0.35rem",
    paddingLeft: "0.35rem",
  },
  krListItem: (active, alertDot) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.35rem",
    width: "100%",
    padding: "0.32rem 0.5rem",
    marginBottom: "0.12rem",
    borderRadius: "8px",
    border:
      active
        ? "1px solid rgba(249,115,22,0.45)"
        : `1px solid ${theme.border}`,
    background: active ? "rgba(249,115,22,0.12)" : theme.surface,
    color: theme.text,
    font: "inherit",
    fontSize: "0.76rem",
    lineHeight: 1.25,
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.15s ease, border-color 0.15s ease, transform 0.12s ease",
    boxShadow: active ? "0 3px 10px -5px rgba(0,0,0,0.32)" : "0 1px 6px -4px rgba(0,0,0,0.22)",
  }),
  dot: (color) => ({
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }),
  pillsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.45rem",
    marginBottom: "1rem",
  },
  pill: (active) => ({
    padding: "0.4rem 0.85rem",
    borderRadius: "999px",
    fontSize: "0.78rem",
    fontWeight: 600,
    border: active ? "1px solid rgba(249,115,22,0.55)" : `1px solid ${theme.border}`,
    background: active ? "rgba(249,115,22,0.15)" : theme.surface,
    color: active ? "#fff" : theme.muted,
    cursor: "pointer",
    font: "inherit",
    transition: "background 0.15s ease, border-color 0.15s ease",
  }),
  heroCard: {
    borderRadius: "12px",
    padding: "1.25rem 1.35rem",
    marginBottom: "1.35rem",
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    boxShadow: "0 8px 32px -12px rgba(0,0,0,0.45)",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  kpiCard: (borderTint) => ({
    borderRadius: "12px",
    padding: "1.1rem 1.25rem",
    background: theme.surface,
    border: `1px solid ${borderTint}`,
    boxShadow: "0 4px 20px -8px rgba(0,0,0,0.4)",
  }),
  sectionCard: {
    borderRadius: "12px",
    padding: "1.15rem 1.35rem",
    marginBottom: "1.15rem",
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    boxShadow: "0 4px 20px -8px rgba(0,0,0,0.35)",
  },
  sectionTitle: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#ffffff",
    margin: "0 0 0.9rem",
    letterSpacing: "-0.02em",
  },
  badge: (bg, color) => ({
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "0.72rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    background: bg,
    color,
    lineHeight: 1.35,
  }),
  muted: { color: theme.muted, fontSize: "0.875rem", lineHeight: 1.55 },
  alertRow: (severity) => {
    const map = {
      krytyczny: {
        bg: "rgba(239,68,68,0.1)",
        border: "rgba(239,68,68,0.35)",
        c: "#fecaca",
      },
      wazny: {
        bg: "rgba(249,115,22,0.1)",
        border: "rgba(249,115,22,0.35)",
        c: "#fdba74",
      },
      info: {
        bg: "rgba(148,163,184,0.08)",
        border: "rgba(148,163,184,0.2)",
        c: theme.muted,
      },
    };
    const t = map[severity] || map.info;
    return {
      padding: "0.85rem 1rem",
      borderRadius: "12px",
      marginBottom: "0.5rem",
      border: `1px solid ${t.border}`,
      background: t.bg,
      color: t.c,
      fontSize: "0.84rem",
      lineHeight: 1.5,
    };
  },
};

/** Badge statusu: OK / w toku / zagrożony — kolory z theme. */
export function OpStatusBadge({ variant = "progress", children }) {
  const map = {
    ok: {
      bg: "rgba(34,197,94,0.15)",
      color: theme.success,
      border: "rgba(34,197,94,0.35)",
    },
    progress: {
      bg: "rgba(249,115,22,0.12)",
      color: theme.action,
      border: "rgba(249,115,22,0.35)",
    },
    danger: {
      bg: "rgba(239,68,68,0.12)",
      color: theme.danger,
      border: "rgba(239,68,68,0.35)",
    },
  };
  const t = map[variant] || map.progress;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "0.72rem",
        fontWeight: 700,
        background: t.bg,
        color: t.color,
        border: `1px solid ${t.border}`,
      }}
    >
      {children}
    </span>
  );
}

const kpiAccentValue = {
  success: theme.success,
  action: theme.action,
  danger: theme.danger,
  default: "#ffffff",
};

export function OpKpiCard({
  label,
  value,
  hint,
  border = "rgba(148,163,184,0.12)",
  accent = "default",
  onClick,
  title: kpiTitle,
}) {
  const interactive = typeof onClick === "function";
  const [hover, setHover] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const baseKpi = op.kpiCard(border);
  const valColor = kpiAccentValue[accent] ?? kpiAccentValue.default;
  const cardStyle = {
    ...baseKpi,
    ...(interactive
      ? {
          cursor: "pointer",
          outline: "none",
          transform: hover || focused ? "translateY(-2px)" : undefined,
          boxShadow: focused
            ? `0 0 0 2px rgba(249,115,22,0.45), 0 12px 28px -12px rgba(0,0,0,0.5)`
            : hover
              ? `0 10px 28px -10px rgba(0,0,0,0.45)`
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
      <div
        style={{
          ...op.muted,
          fontSize: "0.75rem",
          marginBottom: "0.45rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "clamp(1.85rem, 4vw, 2.35rem)",
          fontWeight: 800,
          color: valColor,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      {hint ? (
        <div style={{ ...op.muted, fontSize: "0.78rem", marginTop: "0.5rem" }}>{hint}</div>
      ) : null}
    </div>
  );
}

/** Blok „gotowe pod wdrożenie” — koncepcyjny moduł bez danych z bazy. */
export function OpFutureModule({ title, children }) {
  return (
    <div
      style={{
        ...op.sectionCard,
        borderStyle: "dashed",
        borderColor: "rgba(148,163,184,0.22)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.65rem" }}>
        <span style={op.badge("rgba(249,115,22,0.2)", "#fdba74")}>Wersja koncepcyjna</span>
        <h3 style={{ ...op.sectionTitle, margin: 0, flex: 1 }}>{title}</h3>
      </div>
      <p style={{ ...op.muted, margin: 0 }}>{children}</p>
    </div>
  );
}
