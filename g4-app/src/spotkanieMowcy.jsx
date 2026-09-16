import {
  dopiszPrefiksMowcy,
  htmlTresciZGlosami,
  inicjalyZNazwy,
  kolorInicjalow,
  normalizujNrMowcy,
  rozbijNaGlosy,
  trescProtokoluZGlosow,
  zPrefiksemMowcy,
} from "./lib/spotkanieMowcy.js";

export {
  dopiszPrefiksMowcy,
  htmlTresciZGlosami,
  inicjalyZNazwy,
  kolorInicjalow,
  normalizujNrMowcy,
  rozbijNaGlosy,
  trescProtokoluZGlosow,
  zPrefiksemMowcy,
};

export function InicjalyBadge({ inicjaly, nr, title, size = "1.55rem" }) {
  const ini = String(inicjaly || "?").slice(0, 2);
  return (
    <span
      title={title || ini}
      aria-label={title || ini}
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        borderRadius: 999,
        background: kolorInicjalow(nr, ini),
        color: "#fff",
        fontSize: size === "1.55rem" ? "0.62rem" : "0.58rem",
        fontWeight: 800,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      {ini}
    </span>
  );
}

export function TrescZGlosami({ tresc, mowcy = [], style }) {
  const glosy = rozbijNaGlosy(tresc, mowcy);
  if (!glosy.length) return null;
  if (glosy.length === 1 && !glosy[0].inicjaly) {
    return (
      <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", ...style }}>{glosy[0].tresc}</div>
    );
  }
  return (
    <div style={{ display: "grid", gap: "0.35rem", ...style }}>
      {glosy.map((g, i) => (
        <div key={i} style={{ display: "flex", gap: "0.45rem", alignItems: "flex-start" }}>
          {g.inicjaly ? <InicjalyBadge inicjaly={g.inicjaly} nr={g.nr} title={g.nazwa} /> : null}
          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", minWidth: 0 }}>{g.tresc}</div>
        </div>
      ))}
    </div>
  );
}

export function ChipsMowcow({ mowcy = [], wybranyNr, onWybierz }) {
  if (!mowcy.length) return null;
  return (
    <div>
      <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: 4, fontWeight: 700 }}>
        Kto mówi — kliknij inicjały, potem pisz
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
        {mowcy.map((p) => {
          const nr = normalizujNrMowcy(p.nr);
          const ini = inicjalyZNazwy(p.imie_nazwisko, nr);
          const aktywny = wybranyNr && nr === String(wybranyNr).trim();
          return (
            <button
              key={nr || ini}
              type="button"
              title={String(p.imie_nazwisko ?? "").trim() || ini}
              onClick={() => onWybierz?.(p)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: aktywny ? "1px solid #0369a1" : "1px solid #e2e8f0",
                background: aktywny ? "#e0f2fe" : "#fff",
                borderRadius: 999,
                padding: "0.12rem 0.45rem 0.12rem 0.12rem",
                cursor: "pointer",
                font: "inherit",
              }}
            >
              <InicjalyBadge inicjaly={ini} nr={nr} title={p.imie_nazwisko} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#334155" }}>{ini}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
