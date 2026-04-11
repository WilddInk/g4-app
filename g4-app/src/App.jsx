import { useEffect, useMemo, useState } from "react";
import { AuthScreen } from "./AuthScreen.jsx";
import { CzasPracyPanel, CZAS_TYP_WPISU } from "./CzasPracyPanel.jsx";
import { PasekWersjiG4 } from "./PasekWersjiG4.jsx";
import { supabase } from "./lib/supabase.js";
import { op, OpKpiCard, OpFutureModule, theme, OpStatusBadge } from "./operationalShell.jsx";

/**
 * `true` — tylko zalogowani widzą dane (ustaw w .env przy deployu: VITE_REQUIRE_AUTH=true).
 * Domyślnie / brak zmiennej — aplikacja publiczna (jak dotychczas, klucz anon w RLS).
 */
const requireAuth =
  import.meta.env.VITE_REQUIRE_AUTH === "true" ||
  import.meta.env.VITE_REQUIRE_AUTH === "1";

function grupaTypuCzasuWpisu(typ) {
  const row = CZAS_TYP_WPISU.find((t) => t.value === typ);
  return row?.grupa ?? "inne";
}

/** Ciemny motyw dashboard — spójny z operationalShell (theme). */
const s = {
  page: {
    padding: "clamp(0.75rem, 2vw, 1.75rem) clamp(0.75rem, 3vw, 2rem)",
    width: "100%",
    maxWidth: "100%",
    margin: 0,
    flex: "1 1 auto",
    minHeight: "100vh",
    boxSizing: "border-box",
    fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
    lineHeight: 1.55,
    color: theme.text,
    background: theme.bg,
    textAlign: "left",
  },
  h2: {
    fontSize: "1.2rem",
    marginTop: "2rem",
    marginBottom: "0.75rem",
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.02em",
  },
  code: {
    fontSize: "0.88em",
    padding: "0.12rem 0.4rem",
    borderRadius: "4px",
    background: "#242424",
    color: "#d4d4d4",
    border: "1px solid #333",
  },
  form: {
    display: "grid",
    gap: "0.85rem",
    maxWidth: "min(28rem, 100%)",
    padding: "1.25rem 1.35rem",
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    background: theme.surface,
    marginBottom: "2rem",
    boxShadow: "0 4px 24px -10px rgba(0,0,0,0.4)",
  },
  /** Rozbite border / tło — żeby nie mieszać shorthand z `borderColor` / `backgroundColor` przy podświetleniach (React 19). */
  input: {
    padding: "0.55rem 0.65rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: theme.border,
    borderRadius: "10px",
    font: "inherit",
    boxSizing: "border-box",
    width: "100%",
    backgroundColor: "rgba(11,15,20,0.6)",
    color: theme.text,
    outline: "none",
  },
  label: {
    display: "grid",
    gap: "0.35rem",
    fontSize: "0.82rem",
    color: theme.muted,
    fontWeight: 500,
  },
  btn: {
    padding: "0.6rem 1.15rem",
    borderRadius: "10px",
    border: `1px solid ${theme.action}`,
    background: theme.action,
    color: "#ffffff",
    font: "inherit",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 14px -4px rgba(249,115,22,0.45)",
    transition: "filter 0.15s ease, transform 0.12s ease",
  },
  btnGhost: {
    padding: "0.5rem 0.95rem",
    borderRadius: "10px",
    border: `1px solid rgba(249,115,22,0.35)`,
    background: "transparent",
    color: theme.text,
    font: "inherit",
    cursor: "pointer",
    transition: "background 0.15s ease, border-color 0.15s ease",
  },
  btnRow: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.35rem" },
  krBlock: {
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    marginBottom: "1rem",
    overflow: "hidden",
    background: theme.surface,
    boxShadow: "0 4px 20px -8px rgba(0,0,0,0.35)",
  },
  krHead: {
    padding: "1rem 1.2rem",
    background: "rgba(17,24,39,0.95)",
    borderBottom: `1px solid ${theme.border}`,
    fontWeight: 600,
    color: "#fff",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.65rem",
  },
  krBody: { padding: "1.1rem" },
  etapItem: {
    padding: "0.55rem 0",
    borderBottom: "1px solid #222",
    color: "#d4d4d4",
  },
  muted: { color: theme.muted, fontSize: "0.92rem" },
  /** Teksty o działach KR — błękit na ciemnym tle */
  dzialInfo: {
    color: "#93c5fd",
    fontSize: "0.92rem",
    lineHeight: 1.5,
  },
  dzialWartosc: { color: "#93c5fd" },
  statusKr: { color: "#a7f3d0", fontSize: "0.9rem" },
  krTopWrap: {
    width: "100%",
    maxWidth: "100%",
    marginBottom: "1.5rem",
    padding: "1.2rem 1.35rem",
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    background: theme.surface,
    boxSizing: "border-box",
    boxShadow: "0 4px 24px -10px rgba(0,0,0,0.4)",
  },
  krTopTitle: { margin: "0 0 0.6rem", fontSize: "1.05rem", fontWeight: 600, color: "#fff" },
  krTopList: { margin: 0, paddingLeft: "1.2rem", color: "#d4d4d4" },
  krTopLi: { marginBottom: "0.35rem" },
  errBox: {
    padding: "0.9rem 1.1rem",
    marginBottom: "1rem",
    borderRadius: "10px",
    border: "1px solid #7f1d1d",
    background: "#1c1010",
    color: "#fecaca",
    fontSize: "0.95rem",
  },
  hintBox: {
    padding: "0.9rem 1.1rem",
    marginBottom: "1rem",
    borderRadius: "10px",
    border: "1px solid #854d0e",
    background: "#1c1410",
    fontSize: "0.92rem",
    color: "#fde68a",
  },
  editPanel: {
    marginBottom: "1rem",
    padding: "1rem",
    borderRadius: "10px",
    border: "1px solid #333",
    background: "#121212",
    display: "grid",
    gap: "0.65rem",
  },
  divider: { border: 0, borderTop: "1px solid #252525", margin: "1rem 0" },
  topNav: {
    display: "flex",
    gap: "0.85rem",
    marginTop: "0.35rem",
    marginBottom: "1.15rem",
    flexWrap: "wrap",
    alignItems: "center",
  },
  navGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
    alignItems: "center",
  },
  navSep: {
    width: "1px",
    height: "1.75rem",
    background: "#333",
    alignSelf: "center",
  },
  btnNavAdd: {
    padding: "0.48rem 0.85rem",
    borderRadius: "8px",
    border: "1px solid #5c9cfc",
    background: "transparent",
    color: "#7eb6ff",
    font: "inherit",
    fontWeight: 600,
    fontSize: "0.88rem",
    cursor: "pointer",
  },
  btnNav: {
    padding: "0.55rem 1.35rem",
    borderRadius: "8px",
    border: "1px solid #3f3f3f",
    background: "#141414",
    color: "#a3a3a3",
    font: "inherit",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnNavActive: {
    padding: "0.55rem 1.35rem",
    borderRadius: "8px",
    border: "1px solid #e5e5e5",
    background: "#f5f5f5",
    color: "#0a0a0a",
    font: "inherit",
    fontWeight: 600,
    cursor: "pointer",
  },
  tableWrap: {
    overflowX: "auto",
    width: "100%",
    maxWidth: "100%",
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    background: theme.surface,
    marginBottom: "1.5rem",
    boxSizing: "border-box",
    WebkitOverflowScrolling: "touch",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.9rem",
    color: "#e5e5e5",
  },
  th: {
    textAlign: "left",
    padding: "0.65rem 0.75rem",
    borderBottom: "1px solid #2a2a2a",
    background: "#141414",
    color: "#fff",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  td: {
    textAlign: "left",
    padding: "0.55rem 0.75rem",
    borderBottom: "1px solid #222",
    verticalAlign: "top",
  },
  thBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.28rem",
    margin: 0,
    padding: 0,
    border: "none",
    background: "transparent",
    color: "inherit",
    font: "inherit",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  /** Tabela etapów (`public.etapy`) — mniejsza czcionka, więcej kolumn na ekranie. */
  kmTable: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.7rem",
    lineHeight: 1.35,
    color: "#ddd",
    tableLayout: "fixed",
  },
  kmTh: {
    textAlign: "left",
    padding: "0.35rem 0.4rem",
    borderBottom: "1px solid #2a2a2a",
    background: "#141414",
    color: "#f0f0f0",
    fontWeight: 600,
    fontSize: "0.68rem",
    verticalAlign: "bottom",
    wordBreak: "break-word",
  },
  kmTd: {
    textAlign: "left",
    padding: "0.32rem 0.4rem",
    borderBottom: "1px solid #222",
    verticalAlign: "top",
    fontSize: "0.7rem",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  },
  kmTdAkcje: {
    textAlign: "right",
    whiteSpace: "nowrap",
    width: "4.5rem",
  },
  /** Oś czasu — karty operacyjne (pulpit). */
  pulpitLiNowy: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    minWidth: 0,
    padding: "0.5rem 0",
    paddingLeft: "0.15rem",
    marginLeft: 0,
    borderBottom: "1px solid rgba(148,163,184,0.08)",
    listStyle: "none",
    borderRadius: "12px",
  },
  pulpitLiUwaga: {
    paddingLeft: "0.5rem",
    marginLeft: "-0.1rem",
    borderLeft: "3px solid #f87171",
    background: "rgba(248,113,113,0.06)",
  },
  pulpitDataCol: {
    flex: "0 0 5rem",
    color: "#94a3b8",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
    fontSize: "0.72rem",
    lineHeight: 1.35,
    paddingTop: "0.15rem",
  },
  pulpitDataColUwaga: { color: "#fca5a5", fontWeight: 600 },
  pulpitKartaTekst: {
    flex: "1 1 auto",
    minWidth: 0,
    fontSize: "0.78rem",
    lineHeight: 1.4,
    color: "#e2e8f0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    paddingTop: "0.1rem",
  },
  pulpitKartaTekstUwaga: { color: "#fecaca", fontWeight: 600 },
  pulpitTerazLinia: {
    flex: "1 1 auto",
    height: "2px",
    background: "linear-gradient(90deg, transparent, #4ade80 10%, #4ade80 90%, transparent)",
    minWidth: "1rem",
  },
};

/** Skraca ISO z bazy do YYYY-MM-DD pod input type="date"; puste → "". */
function dataDoInputa(v) {
  if (v == null || v === "") return "";
  return String(v).slice(0, 10);
}

/** YYYY-MM-DD do sortowania osi czasu; niepoprawne → null. */
function dataDoSortuYYYYMMDD(v) {
  const s = dataDoInputa(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

/** Wyświetlanie daty DD.MM.RRRR. */
function dataPLZFormat(yyyymmdd) {
  if (!yyyymmdd || !/^\d{4}-\d{2}-\d{2}$/.test(String(yyyymmdd))) return "—";
  const s = String(yyyymmdd).slice(0, 10);
  return `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`;
}

/** Tekst z pola bazy — bezpiecznie; `x?.trim()` na liczbie/bool daje crash (`undefined()`). */
function tekstTrim(v) {
  if (v == null || v === "") return "";
  return String(v).trim();
}

/** Status etapu uznany za „domknięty” — nie podświetlamy przeterminowania. */
const ETAP_STATUS_PULPIT_ZAMKNIETE = new Set(["zrealizowane", "rozliczone", "anulowane"]);

/** Wariant badge dla statusu projektu KR (wizualny skrót). */
function badgeVariantDlaStatusuKr(statusRaw) {
  const t = String(statusRaw ?? "").trim().toLowerCase();
  if (t === "zakończone") return "ok";
  if (t.includes("oczekuje")) return "danger";
  return "progress";
}

/** KR wymaga koordynacji (spotkanie / decyzja zleceniodawcy). */
function pulpitKrRekordWymagaUwagi(rekord) {
  if (!rekord) return false;
  return tekstTrim(rekord.status).toLowerCase() === "oczekuje na zamawiającego";
}

/** Plan etapu minął (dzień), a etap nie jest zamknięty — jak na pulpicie. */
function pulpitKmPlanPrzeterminowany(row, dziśYYYYMMDD) {
  const plan = dataDoSortuYYYYMMDD(row.data_planowana);
  if (!plan || !dziśYYYYMMDD) return false;
  if (plan >= dziśYYYYMMDD) return false;
  const st = tekstTrim(row.status).toLowerCase();
  if (ETAP_STATUS_PULPIT_ZAMKNIETE.has(st)) return false;
  return true;
}

/** ETAP (wiersz w `etapy`): zagrożenie, opis ryzyka lub plan po terminie przy etapie jeszcze „otwartym”. */
function pulpitKmWymagaUwagi(row, dziśYYYYMMDD) {
  if (row.zagrozenie === "tak" || row.zagrozenie === true) return true;
  if (tekstTrim(row.zagrozenie_opis)) return true;
  return pulpitKmPlanPrzeterminowany(row, dziśYYYYMMDD);
}

/** LOG: nierozwiązane zdarzenie — do dokończenia na spotkaniu. */
function pulpitLogWymagaUwagi(row) {
  const st = tekstTrim(row.status_zdarzenia).toLowerCase();
  return st === "w trakcie" || st === "oczekuje";
}

/** Widok LOG: jest tekst w „Wymagane działanie” — podświetl to pole i „Odpowiedzialny”. */
function logWidokPodswietlGdyJestWymaganeDzialanie(row) {
  return !!tekstTrim(row.wymagane_dzialanie);
}

/** PW: planowy termin zlecenia minął (dzień kalendarzowy), a „Odebrane” nie jest zaznaczone. */
function pulpitPwWymagaUwagi(z, dziśYYYYMMDD) {
  if (z.czy_odebrane === true) return false;
  const term = dataDoSortuYYYYMMDD(z.termin_zlecenia);
  if (!term || !dziśYYYYMMDD) return false;
  return term < dziśYYYYMMDD;
}

/**
 * BRUDNOPIS / RAMA: obecnie tabela `faktury` traktowana jako **faktury sprzedażowe** (powiązane z etapem przez
 * `etap_id`). **Faktury kosztowe** (klauzule, paliwo, RBGH, faktury PW…) — osobna przestrzeń w UI + docelowo osobna
 * tabela lub `faktury.typ` + inne FK — zob. zakładkę „Faktury kosztowe” w karcie KR.
 */
function fakturaJestZafakturowana(row) {
  if (row == null) return false;
  if (row.zafakturowane === false || row.czy_zafakturowane === false) return false;
  if (row.anulowana === true || row.anulowane === true) return false;
  return true;
}

/**
 * Odbiór (protokół) dla **faktury sprzedażowej** — kolumny opcjonalne w schemacie.
 * Priorytet: `protokol_odbioru`, `odebrane_protokolem`, …; brak pola → null („—” w UI).
 */
function fakturaOdebranaProtokolem(row) {
  if (row == null) return null;
  const v =
    row.odebrane_protokolem ??
    row.protokol_odbioru ??
    row.odbior_protokolem ??
    row.czy_odebrane_protokolem;
  if (v === true) return true;
  if (v === false) return false;
  const s = tekstTrim(row.status_odbioru).toLowerCase();
  if (s && (s.includes("protok") || s === "odebrane" || s.includes("odbiór"))) return true;
  return null;
}

/**
 * BRUDNOPIS: jeden etap może mieć wiele FS — nagłówek pokazuje skrót. Później: rozwinięcie listy dokumentów pod etapem,
 * linki do PDF, walidacja „wszystkie etapy rozliczone”.
 */
function fakturySprzedazAgregatDlaEtapu(fList) {
  const list = fList ?? [];
  if (list.length === 0) {
    return { zafakturowane: false, protokol: null, dataPokaz: "" };
  }
  const zaf = list.some(fakturaJestZafakturowana);
  let prot = null;
  if (list.some((f) => fakturaOdebranaProtokolem(f) === true)) prot = true;
  else if (list.some((f) => fakturaOdebranaProtokolem(f) === false)) prot = false;
  const daty = list
    .map((f) => dataDoSortuYYYYMMDD(f.data_wystawienia ?? f.data_faktury ?? f.data_sprzedazy ?? f.data))
    .filter(Boolean)
    .sort();
  const dataPokaz = daty.length ? daty[daty.length - 1] : "";
  return { zafakturowane: zaf, protokol: prot, dataPokaz };
}

function pulpitInvFormatTakNieNieznane(v) {
  if (v === true) return "tak";
  if (v === false) return "nie";
  return "—";
}

/** Podświetlenie inputu/selecta zgodne z regułami „wymaga uwagi” na pulpicie. */
function stylPolaUwagiPulpitu(czyUwaga) {
  if (!czyUwaga) return {};
  return {
    borderColor: "rgba(248,113,113,0.95)",
    boxShadow: "0 0 0 1px rgba(248,113,113,0.45)",
    backgroundColor: "rgba(248,113,113,0.14)",
  };
}

function stylKomorkiTabeliUwagi(czyUwaga) {
  if (!czyUwaga) return {};
  return {
    backgroundColor: "rgba(248,113,113,0.14)",
    boxShadow: "inset 0 0 0 1px rgba(248,113,113,0.45)",
  };
}

/** Krótka etykieta inline (np. status w nagłówku karty KR). */
function stylEtykietyUwagiPulpitu(czyUwaga) {
  if (!czyUwaga) return {};
  return {
    color: "#fecaca",
    backgroundColor: "rgba(248,113,113,0.18)",
    padding: "0.1rem 0.35rem",
    borderRadius: "4px",
    border: "1px solid rgba(248,113,113,0.5)",
  };
}

const PULPIT_KIND_ORDER = { kr_start: 0, etap: 1, pw: 2, log: 3 };

/** Przy tym samym dniu na osi: PW — najpierw data zlecenia, potem termin planowy, na końcu oddanie faktyczne. */
const PW_PULPIT_ANCHOR_ORDER = { data_zlecenia: 0, termin_zlecenia: 1, data_oddania: 2 };

/** Mała ikonka typu wpisu na osi czasu pulpitu (ETAP / PW / LOG / start KR). */
function pulpitIkonTypu(kind) {
  const box = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "1.35rem",
    height: "1.35rem",
    flexShrink: 0,
  };
  const svg = (aria, color, pathD) => (
    <span role="img" aria-label={aria} style={{ ...box, color }}>
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden style={{ display: "block" }}>
        <path fill="currentColor" d={pathD} />
      </svg>
    </span>
  );
  switch (kind) {
    case "etap":
      return svg(
        "ETAP — wiersz etapu",
        "#f87171",
        "M6 3v18h2V9l11-3V6L8 8V3H6z",
      );
    case "pw":
      return svg(
        "PW — podwykonawca",
        "#fbbf24",
        "M10 2h4a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2zm0 4h4V4h-4v2z",
      );
    case "log":
      return svg(
        "LOG — dziennik",
        "#38bdf8",
        "M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h12v2H4v-2Z",
      );
    default:
      return svg(
        "Start projektu (KR)",
        "#4ade80",
        "M6 2h12v5H6V2Zm0 8h12v14H6V10Z",
      );
  }
}

/** Dziś w formacie YYYY-MM-DD (domyślna data zdarzenia w LOG). */
function dzisiajDataYYYYMMDD() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Wiersz harmonogramu terminów — obramowanie/tło przy po terminie lub „w ciągu 7 dni”. */
function stylTerminuHarmonogramu(planRaw, dziśYmd) {
  const plan = dataDoSortuYYYYMMDD(planRaw);
  if (!plan || !dziśYmd) {
    return {
      border: "1px solid rgba(148,163,184,0.15)",
      background: "rgba(15,23,42,0.45)",
      color: "#cbd5e1",
    };
  }
  if (plan < dziśYmd) {
    return {
      border: "1px solid rgba(248,113,113,0.45)",
      background: "rgba(239,68,68,0.08)",
      color: "#fecaca",
    };
  }
  const p = new Date(`${plan}T12:00:00`);
  const d0 = new Date(`${dziśYmd}T12:00:00`);
  const diff = Math.ceil((p - d0) / 86400000);
  if (diff <= 7) {
    return {
      border: "1px solid rgba(234,179,8,0.4)",
      background: "rgba(234,179,8,0.07)",
      color: "#fde68a",
    };
  }
  return {
    border: "1px solid rgba(148,163,184,0.12)",
    background: "rgba(15,23,42,0.35)",
    color: "#e2e8f0",
  };
}

/** Heurystyka kategorii zadania ogólnego (pole dział + słowa kluczowe) — bez zmian w bazie. */
function zadaniaEtykietaKategorii(row) {
  const blob = [row.zadanie, row.dzial, row.opis]
    .map((x) => (x != null ? String(x).toLowerCase() : ""))
    .join(" ");
  if (/\b(auto|samoch|pojazd|flota)\b/.test(blob)) return "Samochody";
  if (/\b(komputer|laptop|pc|serwer|it|drukark)\b/.test(blob)) return "Komputery";
  if (/\b(sprzęt|sprzet|narzędz|narzedz|gps|tachimetr|rtk)\b/.test(blob)) return "Sprzęt";
  if (/\b(biur|archiw|papier|poczt|ksero)\b/.test(blob)) return "Biuro";
  if (/\b(organi|szkolen|proced|kadrow|sprawy administr)\b/.test(blob)) return "Organizacyjne";
  const dz = tekstTrim(row.dzial);
  return dz || "Inne";
}

/** Tekst do podglądu: sformatowana data albo „brak daty”. */
function etykietaDatyStartu(v) {
  if (v == null || v === "") return "brak daty";
  const fragment = String(v).slice(0, 10).trim();
  return fragment || "brak daty";
}

/** URL pod <a href> — brak schematu → https:// (np. wklejona domena). */
function hrefLinkuZewnetrznego(raw) {
  const s = raw != null ? String(raw).trim() : "";
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

/** Wartości `dzial` w bazie — te same wpisują przyciski w edycji KR. */
const DZIAL_W_BAZIE = {
  prawny: "dział prawny",
  inzynieryjny: "dział inżynieryjny",
};

/** Zgodnie z CHECK w pracownik-kolumny-auth-dzial-check.sql — kolumna pracownik.dzial. */
const PRACOWNIK_DZIAL_ETYKIETA = {
  administracja: "Administracja",
  dzial_prawny: "Dział prawny",
  dzial_inzynieryjny: "Dział inżynierski",
  dzial_nieruchomosci: "Dział nieruchomości",
  dzial_terenowy: "Dział terenowy",
};

function etykietaDzialuPracownika(kod) {
  const k = kod != null ? String(kod).trim() : "";
  if (!k) return "";
  return PRACOWNIK_DZIAL_ETYKIETA[k] ?? k;
}

/** Wiersze z listy Box (wiele na osobę) — pracownik-dokument-box-import.sql */
const PRACOWNIK_DOKUMENT_TYP_BOX_IMPORT = "zaimportowane_box";

const PRACOWNIK_FIRMA_Z_KODU = {
  A: "G4 Geodezja Michał Jakubowski",
  B: "G4 Geodezja Monika Jakubowska",
  C: "G4 Geodezja spółka z o.o.",
};

/** Porównanie ID z nazwy pliku (np. 001) z kolumną pracownik.nr (np. 01). */
function nrPlikuPasujeDoPracownika(nrZPliku, nrWbazie) {
  const a = String(nrZPliku ?? "").trim();
  const b = String(nrWbazie ?? "").trim();
  if (!a || !b) return false;
  const ia = parseInt(a, 10);
  const ib = parseInt(b, 10);
  if (!Number.isNaN(ia) && !Number.isNaN(ib)) return ia === ib;
  return a === b;
}

/**
 * Linia: „HR---B---001-…---data” + tab/spacja + https://…box.com/…
 * Zwraca { ok, url, nazwa_pliku, firma_kod, pracownik_nr_raw, … } lub { ok:false, blad }.
 */
function parseWierszeListyBoxHr(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const rows = [];
  for (const line of lines) {
    const m = line.match(/https?:\/\/[^\s]+/i);
    if (!m) {
      rows.push({ ok: false, blad: "Brak adresu http(s) w linii", raw: line });
      continue;
    }
    const url = m[0].replace(/[),.;]+$/u, "");
    const i = line.indexOf(m[0]);
    const nazwa = line.slice(0, i).trim().replace(/[\t ]+$/u, "");
    const parts = nazwa
      .split("---")
      .map((s) => s.trim())
      .filter((p) => p.length > 0);
    let firma_kod = null;
    let pracownik_nr_raw = null;
    if (parts.length >= 3 && /^hr$/i.test(parts[0]) && /^[ABC]$/i.test(parts[1])) {
      firma_kod = parts[1].toUpperCase();
      pracownik_nr_raw = parts[2];
    }
    rows.push({
      ok: true,
      nazwa_pliku: nazwa || url,
      url,
      firma_kod,
      pracownik_nr_raw,
      firma_etykieta: firma_kod ? PRACOWNIK_FIRMA_Z_KODU[firma_kod] ?? null : null,
      raw: line,
    });
  }
  return rows;
}

/**
 * Segment kategorii z nazwy HR---C---011-HomikAnna---Nieobecności---… (czwarty po ---,
 * zaraz po części z numerem i nazwiskiem/imieniem). Dla innych formatów — null.
 */
function kategoriaZNazwyPlikuBox(nazwa) {
  const parts = String(nazwa ?? "")
    .split("---")
    .map((s) => s.trim())
    .filter((p) => p.length > 0);
  if (parts.length < 4) return null;
  if (!/^hr$/i.test(parts[0]) || !/^[ABC]$/i.test(parts[1])) return null;
  const kat = parts[3];
  return kat && kat.length > 0 ? kat : null;
}

/** Etykieta sekcji w UI (np. DaneOsobowe → Dane Osobowe). */
function etykietaKategoriiImportu(k) {
  const t = String(k ?? "").trim();
  if (!t) return "Inne";
  if (t === "Inne") return "Inne";
  return t
    .replace(/([a-ząćęłńóśźż])([A-ZĄĆĘŁŃÓŚŹŻ])/g, "$1 $2")
    .replace(/_/g, " ");
}

function kategoriaImportuDlaWiersza(row) {
  const zBazy = row?.kategoria_importu != null ? String(row.kategoria_importu).trim() : "";
  if (zBazy) return zBazy;
  return kategoriaZNazwyPlikuBox(row?.nazwa_pliku) ?? "Inne";
}

function firmaKodZWierszaDokumentu(row) {
  return row?.firma_kod != null ? String(row.firma_kod).trim().toUpperCase() : "";
}

function etykietaFirmyImportuBox(kod) {
  const k = kod != null ? String(kod).trim().toUpperCase() : "";
  if (!k) return "Bez kodu firmy";
  return PRACOWNIK_FIRMA_Z_KODU[k] ?? `Firma — kod „${k}”`;
}

/** Kolejność A, B, C, potem pozostałe kody, na końcu brak kodu. */
function sortujKodyFirmDlaBoxa(kody) {
  const pri = { A: 1, B: 2, C: 3 };
  return [...kody].sort((a, b) => {
    const pa = a ? pri[a] : null;
    const pb = b ? pri[b] : null;
    if (pa != null && pb != null) return pa - pb;
    if (pa != null) return -1;
    if (pb != null) return 1;
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b, "pl", { sensitivity: "base", numeric: true });
  });
}

/** Najpóźniejsza data RRRR-MM-DD występująca w nazwie (np. wiele dat — bierzemy max). */
function najnowszaDataIsoZNazwyPlikuBox(nazwa) {
  const raw = String(nazwa ?? "");
  const re = /\d{4}-\d{2}-\d{2}/g;
  let max = null;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const s = m[0];
    if (!max || s > max) max = s;
  }
  return max;
}

/** Dzień do sortu/filtru: pierwszeństwo ma data z nazwy; inaczej data importu (`created_at`). */
function dzienReferencyjnyDlaWierszaBox(row) {
  const zNazwy = najnowszaDataIsoZNazwyPlikuBox(row?.nazwa_pliku);
  if (zNazwy) return zNazwy;
  return dataDoSortuYYYYMMDD(row?.created_at);
}

function sortujWierszeBoxOdNajnowszych(rows) {
  return [...rows].sort((a, b) => {
    const da = dzienReferencyjnyDlaWierszaBox(a);
    const db = dzienReferencyjnyDlaWierszaBox(b);
    if (da && db) {
      const c = db.localeCompare(da);
      if (c !== 0) return c;
    } else if (da && !db) return -1;
    else if (!da && db) return 1;
    const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });
}

function czyWierszBoxWPasujeDoFiltruDat(row, dataOd, dataDo) {
  const od = String(dataOd ?? "").trim();
  const ddo = String(dataDo ?? "").trim();
  if (!od && !ddo) return true;
  const d = dzienReferencyjnyDlaWierszaBox(row);
  if (!d) return false;
  if (od && d < od) return false;
  if (ddo && d > ddo) return false;
  return true;
}

function idSekcjiKategoriiDokumentow(kategoria) {
  const src = String(kategoria ?? "").trim().toLowerCase();
  const cleaned = src
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `dok-kat-${cleaned || "inne"}`;
}

/** Kolory segmentów nazwy HR---A---…------… (--- białe; A/B/C czerwone; nr+imię niebieskie; typ zielony; daty niebieskie). */
const NAZWA_PLIKU_BOX_KOL = {
  sep: "#f8fafc",
  firmaKod: "#f87171",
  pracownik: "#7dd3fc",
  typ: "#86efac",
  data: "#38bdf8",
};

function fragmentyKolorowejNazwyPlikuBox(nazwa) {
  const raw = String(nazwa ?? "");
  const out = [];
  if (!raw) return [{ text: "—", color: NAZWA_PLIKU_BOX_KOL.sep }];

  const parts = raw.split("---");
  const czyFormatHr =
    parts.length >= 4 &&
    /^hr$/i.test((parts[0] ?? "").trim()) &&
    /^[ABC]$/i.test((parts[1] ?? "").trim());

  const dopiszSep = () => out.push({ text: "---", color: NAZWA_PLIKU_BOX_KOL.sep });

  const dopiszReszteZDatami = (segment) => {
    if (segment === "") return;
    const re = /\d{4}-\d{2}-\d{2}/g;
    let last = 0;
    let m;
    let znaleziono = false;
    while ((m = re.exec(segment)) !== null) {
      znaleziono = true;
      if (m.index > last) {
        out.push({ text: segment.slice(last, m.index), color: NAZWA_PLIKU_BOX_KOL.sep });
      }
      out.push({ text: m[0], color: NAZWA_PLIKU_BOX_KOL.data });
      last = m.index + m[0].length;
    }
    if (znaleziono && last < segment.length) {
      out.push({ text: segment.slice(last), color: NAZWA_PLIKU_BOX_KOL.sep });
    }
    if (!znaleziono) {
      out.push({ text: segment, color: NAZWA_PLIKU_BOX_KOL.sep });
    }
  };

  if (!czyFormatHr) {
    dopiszReszteZDatami(raw);
    return out;
  }

  for (let i = 0; i < parts.length; i++) {
    if (i > 0) dopiszSep();
    const seg = parts[i];
    if (i === 0) {
      out.push({ text: seg, color: NAZWA_PLIKU_BOX_KOL.sep });
    } else if (i === 1) {
      out.push({ text: seg, color: NAZWA_PLIKU_BOX_KOL.firmaKod });
    } else if (i === 2) {
      out.push({ text: seg, color: NAZWA_PLIKU_BOX_KOL.pracownik });
    } else if (i === 3) {
      out.push({ text: seg, color: NAZWA_PLIKU_BOX_KOL.typ });
    } else {
      dopiszReszteZDatami(seg);
    }
  }
  return out;
}

/** Zgodnie z CHECK w supabase/kr-add-status.sql — muszą być identyczne jak w bazie. */
const KR_STATUS_W_BAZIE = [
  "w trakcie",
  "zakończone",
  "oczekuje na zamawiającego",
];

/** Zgodnie z supabase/kamienie-milowe-status-check.sql (CHECK opcjonalny) — wartości statusu etapu. */
const ETAP_STATUS_W_BAZIE = [
  "planowane",
  "w trakcie",
  "zrealizowane",
  "rozliczone",
  "oczekuje",
  "anulowane",
];

/** Zgodnie z supabase/kamienie-milowe-typ-odniesienia.sql — co oznacza data odniesienia. */
const ETAP_TYP_ODNIESIENIA_W_BAZIE = ["linia", "zlecenie"];

/** Etykieta w UI / tabeli dla wartości typ_odniesienia. */
function kmEtykietaTypuOdniesienia(typ) {
  const t = String(typ ?? "").trim();
  if (!t) return "";
  if (t === "linia") return "Linia";
  if (t === "zlecenie") return "Zlecenie";
  return t;
}

/** Komórka tabeli: typ (linia / zlecenie) + data odniesienia. */
function kmKomorkaOdniesienia(row) {
  const typRaw = String(row.typ_odniesienia ?? "").trim();
  const typLbl = typRaw ? kmEtykietaTypuOdniesienia(typRaw) : "";
  const dataStr = row.data_odniesienia ? dataDoInputa(row.data_odniesienia) : "";
  if (!typLbl && !dataStr) return "—";
  return (
    <>
      {typLbl ? (
        <span
          style={{
            display: "block",
            fontSize: "0.68rem",
            color: "#94a3b8",
            fontWeight: 500,
            marginBottom: dataStr ? "0.12rem" : 0,
            lineHeight: 1.25,
          }}
        >
          {typLbl}
        </span>
      ) : null}
      <span>{dataStr || "—"}</span>
    </>
  );
}

/** Zgodnie z dziennik-zdarzen-kolumny.sql (CHECK) — status wpisu w LOG. */
const LOG_STATUS_ZDARZENIA_W_BAZIE = ["w trakcie", "ukończone", "oczekuje"];

/** Status zadania ogólnego (tabela zadania) — te same etykiety co w LOG. */
const ZADANIE_STATUS_W_BAZIE = LOG_STATUS_ZDARZENIA_W_BAZIE;

function zadanieCzyUkonczoneStatus(statusRaw) {
  const st = String(statusRaw ?? "").trim().toLowerCase();
  return st === "ukończone" || st === "ukonczone" || st === "zakończone" || st === "zakonczone";
}

function zadanieKluczKolumnyKanban(statusRaw) {
  const st = String(statusRaw ?? "").trim().toLowerCase();
  if (zadanieCzyUkonczoneStatus(st)) return "ukonczone";
  if (st === "w trakcie") return "w_trakcie";
  if (st === "oczekuje") return "oczekuje";
  return "inne";
}

/** Typ sprzętu w tabeli `sprzet` (lista + pole własne przy „z bazy”). */
const SPRZET_TYP_W_BAZIE = ["komputer", "drukarka", "ksero", "inne"];

/** Status zgłoszenia faktury kosztowej do opłacenia (księgowość). */
const FAKTURA_DO_ZAPLATY_STATUS_W_BAZIE = ["do_zaplaty", "oplacone", "anulowane"];

function etykietaFakturyDoZaplatyStatus(st) {
  const s = String(st ?? "").trim();
  if (s === "do_zaplaty") return "Do opłacenia";
  if (s === "oplacone") return "Opłacone";
  if (s === "anulowane") return "Anulowane";
  return s || "—";
}

/** Porównanie tekstów z pustymi na końcu przy sortowaniu rosnącym (locale pl). */
function porownajTekstSort(a, b) {
  const na = a == null || String(a).trim() === "" ? "" : String(a).trim();
  const nb = b == null || String(b).trim() === "" ? "" : String(b).trim();
  if (na === "" && nb === "") return 0;
  if (na === "") return 1;
  if (nb === "") return -1;
  return na.localeCompare(nb, "pl", { sensitivity: "base", numeric: true });
}

/** Mapa nr → rekord pracownika (klucze jako string). */
function mapaNrPracownika(lista) {
  const m = new Map();
  for (const p of lista) m.set(String(p.nr), p);
  return m;
}

/** Tekst do nagłówka karty: nr lub „nr — imię i nazwisko”. */
function podpisOsobyProwadzacej(nrWart, mapaNr) {
  if (nrWart == null || String(nrWart).trim() === "") return null;
  const key = String(nrWart).trim();
  const p = mapaNr.get(key);
  if (p?.imie_nazwisko) return `${key} — ${p.imie_nazwisko}`;
  return key;
}

/** Kolor komórki kalendarza rezerwacji — stały dla danego nr pracownika. */
function kolorRezerwacjiDlaPracownika(nr) {
  const s = String(nr ?? "").trim();
  if (!s) return "rgba(51,65,85,0.55)";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 37 + s.charCodeAt(i)) >>> 0;
  return `hsla(${h % 360}, 55%, 40%, 0.88)`;
}

/** Niepuste pole „wymagane naprawy” — podświetlenie w tabeli i informacja na panelu. */
function samochodWymagaNaprawy(row) {
  return row != null && tekstTrim(row.wymagane_naprawy) !== "";
}

function logPustyForm() {
  return {
    typ_zdarzenia: "",
    opis: "",
    data_zdarzenia: "",
    osoba_zglaszajaca: "",
    wymagane_dzialanie: "",
    osoba_odpowiedzialna_za_zadanie: "",
    status_zdarzenia: "w trakcie",
  };
}

function logWierszDoFormu(row) {
  const stRaw = String(row.status_zdarzenia ?? "").trim();
  const status = LOG_STATUS_ZDARZENIA_W_BAZIE.includes(stRaw) ? stRaw : "w trakcie";
  return {
    typ_zdarzenia: row.typ_zdarzenia != null ? String(row.typ_zdarzenia) : "",
    opis: row.opis != null ? String(row.opis) : "",
    data_zdarzenia: dataDoInputa(row.data_zdarzenia),
    osoba_zglaszajaca:
      row.osoba_zglaszajaca != null && row.osoba_zglaszajaca !== ""
        ? String(row.osoba_zglaszajaca)
        : "",
    wymagane_dzialanie: row.wymagane_dzialanie != null ? String(row.wymagane_dzialanie) : "",
    osoba_odpowiedzialna_za_zadanie:
      row.osoba_odpowiedzialna_za_zadanie != null && row.osoba_odpowiedzialna_za_zadanie !== ""
        ? String(row.osoba_odpowiedzialna_za_zadanie)
        : "",
    status_zdarzenia: status,
  };
}

function zadaniePustyForm() {
  return {
    kr: "",
    zadanie: "",
    dzial: "",
    osoba_odpowiedzialna: "",
    osoba_zlecajaca: "",
    status: "oczekuje",
    data_planowana: "",
    data_realna: "",
    zagrozenie: "",
    opis: "",
  };
}

function zadanieWierszDoFormu(row) {
  return {
    kr: row.kr != null && String(row.kr).trim() !== "" ? String(row.kr).trim() : "",
    zadanie: row.zadanie != null ? String(row.zadanie) : "",
    dzial: row.dzial != null ? String(row.dzial) : "",
    osoba_odpowiedzialna:
      row.osoba_odpowiedzialna != null && row.osoba_odpowiedzialna !== ""
        ? String(row.osoba_odpowiedzialna)
        : "",
    osoba_zlecajaca:
      row.osoba_zlecajaca != null && row.osoba_zlecajaca !== ""
        ? String(row.osoba_zlecajaca)
        : "",
    status: row.status != null ? String(row.status) : "",
    data_planowana: dataDoInputa(row.data_planowana),
    data_realna: dataDoInputa(row.data_realna),
    zagrozenie: boolDoTakNie(row.zagrozenie),
    opis: row.opis != null ? String(row.opis) : "",
  };
}

function podwykonawcaPustyForm() {
  return {
    nazwa_firmy: "",
    osoba_kontaktowa: "",
    telefon: "",
  };
}

function podwykonawcaWierszDoFormu(row) {
  return {
    nazwa_firmy: row.nazwa_firmy != null ? String(row.nazwa_firmy) : "",
    osoba_kontaktowa: row.osoba_kontaktowa != null ? String(row.osoba_kontaktowa) : "",
    telefon: row.telefon != null ? String(row.telefon) : "",
  };
}

function samochodPustyForm() {
  return {
    nazwa: "",
    numer_rejestracyjny: "",
    polisa_numer: "",
    polisa_wazna_do: "",
    przeglad_wazny_do: "",
    uwagi_eksploatacja: "",
    wymagane_naprawy: "",
    notatki: "",
  };
}

function samochodWierszDoFormu(row) {
  return {
    nazwa: row.nazwa != null ? String(row.nazwa) : "",
    numer_rejestracyjny: row.numer_rejestracyjny != null ? String(row.numer_rejestracyjny) : "",
    polisa_numer: row.polisa_numer != null ? String(row.polisa_numer) : "",
    polisa_wazna_do: dataDoInputa(row.polisa_wazna_do),
    przeglad_wazny_do: dataDoInputa(row.przeglad_wazny_do),
    uwagi_eksploatacja: row.uwagi_eksploatacja != null ? String(row.uwagi_eksploatacja) : "",
    wymagane_naprawy: row.wymagane_naprawy != null ? String(row.wymagane_naprawy) : "",
    notatki: row.notatki != null ? String(row.notatki) : "",
  };
}

function sprzetPustyForm() {
  return {
    typ: "komputer",
    nazwa: "",
    numer_inwentarzowy: "",
    data_przegladu: "",
    pracownik_nr: "",
    notatki: "",
  };
}

function sprzetWierszDoFormu(row) {
  const typRaw = String(row.typ ?? "").trim();
  return {
    typ: typRaw || "komputer",
    nazwa: row.nazwa != null ? String(row.nazwa) : "",
    numer_inwentarzowy: row.numer_inwentarzowy != null ? String(row.numer_inwentarzowy) : "",
    data_przegladu: dataDoInputa(row.data_przegladu),
    pracownik_nr: row.pracownik_nr != null && row.pracownik_nr !== "" ? String(row.pracownik_nr) : "",
    notatki: row.notatki != null ? String(row.notatki) : "",
  };
}

function rezerwacjaPustyForm() {
  return {
    samochod_id: "",
    data_dnia: "",
    pracownik_nr: "",
    opis_krotki: "",
  };
}

function fakturaDoZaplatyPustyForm() {
  return {
    komu: "",
    nr_konta: "",
    kwota_brutto: "",
    link_faktury: "",
    numer_faktury: "",
    zgloszil_pracownik_nr: "",
    notatki: "",
  };
}

function kwotaBruttoDoPayload(raw) {
  const t = String(raw ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  if (t === "") return null;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function kwotaBruttoEtykieta(wartosc) {
  if (wartosc == null || wartosc === "") return "—";
  const n =
    typeof wartosc === "number"
      ? wartosc
      : Number.parseFloat(String(wartosc).replace(",", ".").replace(/\s/g, ""));
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł brutto";
}

function krZleceniePwKwotaDoPayload(raw) {
  const t = String(raw ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  if (t === "") return null;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function krZleceniePwKwotaEtykieta(wartosc) {
  if (wartosc == null || wartosc === "") return "—";
  const n =
    typeof wartosc === "number"
      ? wartosc
      : Number.parseFloat(String(wartosc).replace(",", ".").replace(/\s/g, ""));
  if (!Number.isFinite(n)) return "—";
  return (
    new Intl.NumberFormat("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n) + "\u00a0zł"
  );
}

function krZleceniePwPustyForm() {
  return {
    podwykonawca_id: "",
    numer_zlecenia: "",
    opis_zakresu: "",
    data_zlecenia: "",
    termin_zlecenia: "",
    data_oddania: "",
    cena_netto: "",
    czy_sprawdzone: false,
    czy_odebrane: false,
    status: "",
    pracownik_weryfikacja: "",
    osoba_faktury_nazwa: "",
    osoba_faktury_email: "",
    osoba_faktury_telefon: "",
    uwagi: "",
  };
}

function krZleceniePwWierszDoFormu(row) {
  let cenaStr = "";
  if (row.cena_netto != null && row.cena_netto !== "") {
    const n =
      typeof row.cena_netto === "number"
        ? row.cena_netto
        : Number.parseFloat(String(row.cena_netto).replace(",", "."));
    cenaStr = Number.isFinite(n) ? String(n).replace(".", ",") : String(row.cena_netto);
  }
  return {
    podwykonawca_id: row.podwykonawca_id != null ? String(row.podwykonawca_id) : "",
    numer_zlecenia: row.numer_zlecenia != null ? String(row.numer_zlecenia) : "",
    opis_zakresu: row.opis_zakresu != null ? String(row.opis_zakresu) : "",
    data_zlecenia: dataDoInputa(row.data_zlecenia),
    termin_zlecenia: dataDoInputa(row.termin_zlecenia),
    data_oddania: dataDoInputa(row.data_oddania),
    cena_netto: cenaStr,
    czy_sprawdzone: row.czy_sprawdzone === true,
    czy_odebrane: row.czy_odebrane === true,
    status: row.status != null ? String(row.status) : "",
    pracownik_weryfikacja:
      row.pracownik_weryfikacja != null && row.pracownik_weryfikacja !== ""
        ? String(row.pracownik_weryfikacja)
        : "",
    osoba_faktury_nazwa: row.osoba_faktury_nazwa != null ? String(row.osoba_faktury_nazwa) : "",
    osoba_faktury_email: row.osoba_faktury_email != null ? String(row.osoba_faktury_email) : "",
    osoba_faktury_telefon: row.osoba_faktury_telefon != null ? String(row.osoba_faktury_telefon) : "",
    uwagi: row.uwagi != null ? String(row.uwagi) : "",
  };
}

function kmPustyForm() {
  return {
    typ_odniesienia: "",
    data_odniesienia: "",
    offset_miesiecy: "",
    data_planowana: "",
    etap: "",
    status: "",
    osoba_odpowiedzialna: "",
    uwagi: "",
    osiagniete: "",
    zagrozenie: "",
    zagrozenie_opis: "",
  };
}

/** Puste → null; liczba całkowita ≥ 0 → wartość; inaczej null (walidacja przy zapisie). */
function offsetMiesiecyDoBazy(v) {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** „tak” / „nie” / „” → boolean lub null (pusto w bazie). */
function takNieDoBool(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "tak") return true;
  if (s === "nie") return false;
  return null;
}

function boolDoTakNie(b) {
  if (b === true) return "tak";
  if (b === false) return "nie";
  return "";
}

/** Tekst do komórki tabeli etapów: „—” gdy pusto; `title` z pełną treścią pod podpowiedź. */
function kmTekstDoKomorki(val) {
  const t = val != null && String(val).trim() !== "" ? String(val).trim() : "";
  return { text: t || "—", title: t };
}

const STORAGE_TRYB_HELP = "g4_tryb_help";
/** Zapamiętanie podglądu „jako inny pracownik” (tylko dla app_role admin). */
const STORAGE_ADMIN_PODGLAD_NR = "g4_admin_podglad_pracownik_nr";

/**
 * Konto z JWT vs efektywny pracownik do list „Moje …” / pulpitu.
 * Podgląd innej osoby włączany wyłącznie przy app_role admin + wybranym `adminPodgladPracownikNr`.
 */
function obliczPracownikWidokuDlaSesji(pracownicy, session, adminPodgladPracownikNr) {
  const uid = session?.user?.id;
  const pracownikSesja =
    uid == null
      ? null
      : pracownicy.find((p) => p.auth_user_id != null && String(p.auth_user_id) === String(uid)) ?? null;
  const czyAdminAktywny = Boolean(
    pracownikSesja &&
      pracownikSesja.is_active !== false &&
      String(pracownikSesja.app_role ?? "").trim() === "admin",
  );
  let pracownikWidokEfektywny = pracownikSesja;
  if (czyAdminAktywny) {
    const want = String(adminPodgladPracownikNr ?? "").trim();
    if (want) {
      const znaleziony = pracownicy.find((p) => String(p.nr ?? "").trim() === want);
      if (znaleziony) pracownikWidokEfektywny = znaleziony;
    }
  }
  return { pracownikSesja, pracownikWidokEfektywny, czyAdminAktywny };
}

/** Kto widzi/edytuje pole „wymagane naprawy” przy flocie (zgodnie z pracownik.odpowiedzialny_flota + role). */
function pracownikWidziNaprawyFloty(p) {
  if (!p) return false;
  const role = String(p.app_role ?? "").trim();
  if (role === "admin" || role === "kierownik") return true;
  return p.odpowiedzialny_flota === true;
}

/** Wartości `pracownik.app_role` (CHECK w bazie) — etykiety UI. */
const APP_ROLE_OPCJE = [
  { value: "uzytkownik", label: "Pracownik" },
  { value: "kierownik", label: "Kierownik" },
  { value: "admin", label: "Administrator" },
];

/** `pracownik.forma_zatrudnienia` — po migracji `pracownik-forma-zatrudnienia.sql`. */
const FORMA_ZATRUDNIENIA_OPCJE = [
  { value: "uop", label: "UoP" },
  { value: "uz", label: "Um. zlecenie" },
  { value: "inne", label: "Inna" },
];

/** Podpowiedź pod przyciskiem — tylko przy włączonym trybie HELP (prezentacja). */
const stylHelpPodPrzycisk = {
  fontSize: "0.68rem",
  color: "#4ade80",
  lineHeight: 1.4,
  margin: "0.2rem 0 0.5rem",
  maxWidth: "20rem",
};

function HelpLinijka({ wlaczony, children }) {
  if (!wlaczony || children == null || children === "") return null;
  return <p style={stylHelpPodPrzycisk}>{children}</p>;
}

/** Menu sekcji karty projektu (hub KR) — nazwy „po ludzku” dla rady / kierowników. */
const KR_PROJEKT_MENU = [
  {
    id: "przeglad",
    label: "Przegląd",
    help: "Pierwszy ekran projektu: skrót etapów, co pilne, ostatnie zgłoszenia i szybkie przejścia.",
  },
  {
    id: "faktury",
    label: "Faktury kosztowe",
    help: "Zgłoszenia do księgowości: komu zapłacić, konto, brutto, link do faktury. FS sprzedaż — przy etapach i INV.",
  },
  {
    id: "koszty",
    label: "Koszty",
    help: "Godziny pracy zarejestrowane na ten KR (pole KR w module Czas pracy). Kierownik i admin widzą zespół; pracownik — tylko siebie (RLS).",
  },
  {
    id: "zadania_kr",
    label: "Zadania",
    help: "Zadania ogólne przypisane do tego KR — ten sam moduł co Zadania ogólne w menu, z ustalonym projektem.",
  },
  {
    id: "etapy",
    label: "Etapy",
    help: "Lista etapów prac i terminów tylko dla tego projektu — tu je wpisujesz i poprawiasz.",
  },
  {
    id: "rozszerzenia",
    label: "Rozszerzenia zakresu",
    help: "Na później: aneksy i dopłaty poza pierwotną umową.",
  },
  {
    id: "zlecenia",
    label: "Zlecenia",
    help: "Zlecenia dla firm zewnętrznych powiązane z tym projektem.",
  },
  {
    id: "podwykonawcy",
    label: "Podwykonawcy",
    help: "Kto z zewnątrz realizuje prace — firmy i kontakty przy zleceniach.",
  },
  { id: "umowa", label: "Umowa", help: "Zleceniodawca, link do umowy, okres. Na razie jeden link, później więcej." },
  {
    id: "terminy",
    label: "Terminy",
    help: "Ważne daty z projektu, etapów i zleceń w jednym miejscu.",
  },
  {
    id: "zgloszenia",
    label: "Zgłoszenia",
    help: "Dziennik zdarzeń przy tym projekcie — krótszy podgląd niż pełny LOG.",
  },
  {
    id: "ryzyka",
    label: "Problemy / ryzyka",
    help: "Co wymaga uwagi: status projektu, etapy, zgłoszenia i zlecenia.",
  },
  { id: "os", label: "Oś czasu", help: "Jak pulpit: jedna oś dnia z etapami, PW i LOG." },
  {
    id: "zespol",
    label: "Zespół / odpowiedzialności",
    help: "Kto prowadzi projekt i kto odpowiada przy etapach oraz zgłoszeniach.",
  },
];

function kmWierszDoFormu(row) {
  return {
    typ_odniesienia:
      row.typ_odniesienia != null && String(row.typ_odniesienia).trim() !== ""
        ? String(row.typ_odniesienia).trim()
        : "",
    data_odniesienia: dataDoInputa(row.data_odniesienia),
    offset_miesiecy:
      row.offset_miesiecy != null && row.offset_miesiecy !== ""
        ? String(row.offset_miesiecy)
        : "",
    data_planowana: dataDoInputa(row.data_planowana),
    etap: row.etap != null ? String(row.etap) : "",
    status: row.status != null ? String(row.status) : "",
    osoba_odpowiedzialna:
      row.osoba_odpowiedzialna != null && row.osoba_odpowiedzialna !== ""
        ? String(row.osoba_odpowiedzialna)
        : "",
    uwagi: row.uwagi != null ? String(row.uwagi) : "",
    osiagniete: boolDoTakNie(row.osiagniete),
    zagrozenie: boolDoTakNie(row.zagrozenie),
    zagrozenie_opis: row.zagrozenie_opis != null ? String(row.zagrozenie_opis) : "",
  };
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  /** Po linku „reset hasła” z e-maila — najpierw wymuś ustawienie nowego hasła w AuthScreen. */
  const [wymusNoweHasloPoReset, setWymusNoweHasloPoReset] = useState(false);

  /** Widok modułu: panel startowy | KR | pracownik | zadania | … */
  const [widok, setWidok] = useState("dashboard");
  /** Sekcja „karty projektu” (hub KR) — zsynchronizowana z zakładkami/pills. */
  const [krProjektSekcja, setKrProjektSekcja] = useState("przeglad");
  /** Filtrowanie listy KR w prawym panelu. */
  const [panelKrSzukaj, setPanelKrSzukaj] = useState("");
  /** Otwarty rekord KR (szczegóły + etapy); null = główny ekran z samą listą. */
  const [wybranyKrKlucz, setWybranyKrKlucz] = useState(null);
  /** Widok etapów (tabela `etapy`) dla wybranego kodu KR (z listy głównej). */
  const [widokKmDlaKr, setWidokKmDlaKr] = useState(null);
  /** Dziennik zdarzeń (LOG) dla jednego KR — tabela dziennik_zdarzen. */
  const [widokLogDlaKr, setWidokLogDlaKr] = useState(null);
  /** Podgląd INFO: KR + etapy + LOG tylko do odczytu. */
  const [widokInfoDlaKr, setWidokInfoDlaKr] = useState(null);
  /** Zlecenia PW dla wybranego kodu KR (osobny widok z listy — przycisk PW). */
  const [widokPwDlaKr, setWidokPwDlaKr] = useState(null);
  /** Pulpit / oś czasu — złączone ETAP, PW, LOG chronologicznie dla jednego KR. */
  const [widokPulpitDlaKr, setWidokPulpitDlaKr] = useState(null);
  /** Pulpit: pierwszy klucz sortowania — data; potem typ (ETAP/PW/LOG), potem kolejność dodania. */
  const [pulpitSortDaty, setPulpitSortDaty] = useState("asc");
  /** Podstrona pulpitu: przegląd (skrót), pełna oś, lub treść jak zakładki karty projektu. */
  const [pulpitPodstrona, setPulpitPodstrona] = useState("przeglad");
  /** Drzewo nawigacji pulpitu — gałąź KR rozwinięta domyślnie. */
  const [pulpitDrzewoRozwinProjekty, setPulpitDrzewoRozwinProjekty] = useState(true);
  /** Prezentacja: zielone podpowiedzi pod przyciskami; zapamiętane w przeglądarce. */
  const [trybHelp, setTrybHelp] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_TRYB_HELP) === "1";
    } catch {
      return false;
    }
  });
  const [dziennikWpisy, setDziennikWpisy] = useState([]);
  const [dziennikFetchError, setDziennikFetchError] = useState(null);
  const [logForm, setLogForm] = useState(() => logPustyForm());
  const [logEdycjaId, setLogEdycjaId] = useState(null);
  const [kmEdycjaId, setKmEdycjaId] = useState(null);
  const [kmForm, setKmForm] = useState(() => kmPustyForm());

  const [zadaniaList, setZadaniaList] = useState([]);
  const [zadaniaFetchError, setZadaniaFetchError] = useState(null);
  const [zadanieEdycjaId, setZadanieEdycjaId] = useState(null);
  const [zadanieForm, setZadanieForm] = useState(() => zadaniePustyForm());
  const [zadaniaWidok, setZadaniaWidok] = useState("tabela");
  const [zadaniaFiltrPracNr, setZadaniaFiltrPracNr] = useState("");
  const [zadaniaFiltrTylkoOdpowiedzialny, setZadaniaFiltrTylkoOdpowiedzialny] = useState(false);
  /** "" = wszystkie, "__bez_kr__" = tylko ogólne (bez projektu), inaczej kod KR */
  const [zadaniaFiltrKr, setZadaniaFiltrKr] = useState("");

  const [podwykonawcyList, setPodwykonawcyList] = useState([]);
  const [podwykonawcyFetchError, setPodwykonawcyFetchError] = useState(null);
  const [samochodyList, setSamochodyList] = useState([]);
  const [samochodyFetchError, setSamochodyFetchError] = useState(null);
  const [sprzetList, setSprzetList] = useState([]);
  const [sprzetFetchError, setSprzetFetchError] = useState(null);
  const [rezerwacjeList, setRezerwacjeList] = useState([]);
  const [rezerwacjeFetchError, setRezerwacjeFetchError] = useState(null);
  const [samochodEdycjaId, setSamochodEdycjaId] = useState(null);
  const [samochodForm, setSamochodForm] = useState(() => samochodPustyForm());
  const [sprzetEdycjaId, setSprzetEdycjaId] = useState(null);
  const [sprzetForm, setSprzetForm] = useState(() => sprzetPustyForm());
  const [rezerwacjaForm, setRezerwacjaForm] = useState(() => rezerwacjaPustyForm());
  const [kalFlotaRok, setKalFlotaRok] = useState(() => new Date().getFullYear());
  const [kalFlotaMiesiac, setKalFlotaMiesiac] = useState(() => new Date().getMonth() + 1);
  const [pwEdycjaId, setPwEdycjaId] = useState(null);
  const [pwForm, setPwForm] = useState(() => podwykonawcaPustyForm());

  const [krZleceniaPwList, setKrZleceniaPwList] = useState([]);
  const [krZleceniaPwFetchError, setKrZleceniaPwFetchError] = useState(null);
  /** Zgłoszenia faktur kosztowych do opłacenia — lista przy otwartym KR (zakładka Faktury kosztowe). */
  const [krFakturyDoZaplatyList, setKrFakturyDoZaplatyList] = useState([]);
  const [krFakturyDoZaplatyFetchError, setKrFakturyDoZaplatyFetchError] = useState(null);
  /** Wpisy czasu pracy z przypisanym KR — zakładka Koszty na karcie projektu. */
  const [krCzasPracyWpisyList, setKrCzasPracyWpisyList] = useState([]);
  const [krCzasPracyWpisyFetchError, setKrCzasPracyWpisyFetchError] = useState(null);
  /** Suma roboczogodzin (tylko typy „praca”) dla KR na pulpicie projektu — przegląd. */
  const [pulpitRoboczogodziny, setPulpitRoboczogodziny] = useState({
    suma: null,
    err: null,
    loading: false,
  });
  /** Wszystkie zgłoszenia ze statusem „do_zaplaty” — panel główny / księgowość. */
  const [fakturyDoZaplatyOczekujaceList, setFakturyDoZaplatyOczekujaceList] = useState([]);
  const [fakturyDoZaplatyOczekujaceFetchError, setFakturyDoZaplatyOczekujaceFetchError] = useState(null);
  const [fakturaDoZaplatyForm, setFakturaDoZaplatyForm] = useState(() => fakturaDoZaplatyPustyForm());
  /**
   * **Faktury sprzedażowe** dla aktualnie wybranego KR (pulpit / karta projektu / tabela etapów) — odczyt z `faktury`
   * po `etap_id`. BRUDNOPIS: docelowo filtr `typ = 'sprzedaz'` albo osobna tabela `faktury_sprzedaz`.
   */
  const [krFakturySprzedazList, setKrFakturySprzedazList] = useState([]);
  const [krFakturySprzedazFetchError, setKrFakturySprzedazFetchError] = useState(null);
  const [krZleceniePwEdycjaId, setKrZleceniePwEdycjaId] = useState(null);
  const [krZleceniePwForm, setKrZleceniePwForm] = useState(() => krZleceniePwPustyForm());
  /** Kod KR dla zapisywanego zlecenia — wypełniany przy edycji z zakładki PW (gdy brak widokPwDlaKr). */
  const [krZleceniePwKontekstKr, setKrZleceniePwKontekstKr] = useState(null);

  /** Wszystkie wiersze z kr_zlecenie_podwykonawcy — widok zakładki PW. */
  const [pwZleceniaWszystkieList, setPwZleceniaWszystkieList] = useState([]);
  const [pwZleceniaWszystkieFetchError, setPwZleceniaWszystkieFetchError] = useState(null);

  const [krList, setKrList] = useState([]);
  const [etapy, setEtapy] = useState([]);
  const [krFetchError, setKrFetchError] = useState(null);
  const [etapyFetchError, setEtapyFetchError] = useState(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const [pracownicy, setPracownicy] = useState([]);
  const [pracFetchError, setPracFetchError] = useState(null);
  const [pracLoading, setPracLoading] = useState(false);
  const [mojeDokumentyList, setMojeDokumentyList] = useState([]);
  const [mojeDokumentyFetchError, setMojeDokumentyFetchError] = useState(null);
  const [mojeDokEdycja, setMojeDokEdycja] = useState({ arkusz: "" });
  const [mojeDokSaveMsg, setMojeDokSaveMsg] = useState(null);
  const [mojeDokBulkWklejka, setMojeDokBulkWklejka] = useState("");
  const [mojeDokBulkMsg, setMojeDokBulkMsg] = useState(null);
  /** Kategorie listy Box — domyślnie zwinięte; klawisz rozwija sekcję po prawej. */
  const [mojeDokKategorieRozwiniete, setMojeDokKategorieRozwiniete] = useState(() => new Set());
  /** Filtr listy Box: zakres po dniu referencyjnym (nazwa pliku → max data, inaczej import). */
  const [mojeDokFiltrDataOd, setMojeDokFiltrDataOd] = useState("");
  const [mojeDokFiltrDataDo, setMojeDokFiltrDataDo] = useState("");
  /** Dla roli admin: `pracownik.nr` — podgląd aplikacji jak dla wybranej osoby (bez wylogowania). */
  const [adminPodgladPracownikNr, setAdminPodgladPracownikNr] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_ADMIN_PODGLAD_NR) ?? "";
    } catch {
      return "";
    }
  });

  const [newKr, setNewKr] = useState("");
  const [newNazwaObiektu, setNewNazwaObiektu] = useState("");
  const [newRodzajPracy, setNewRodzajPracy] = useState("");
  const [newDzial, setNewDzial] = useState("");
  const [newOsobaProwadzaca, setNewOsobaProwadzaca] = useState("");
  const [newDataRozpoczecia, setNewDataRozpoczecia] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newZleceniodawca, setNewZleceniodawca] = useState("");
  const [newOsobaZleceniodawcy, setNewOsobaZleceniodawcy] = useState("");
  const [newLinkUmowy, setNewLinkUmowy] = useState("");
  const [newOkresProjektuOd, setNewOkresProjektuOd] = useState("");
  const [newOkresProjektuDo, setNewOkresProjektuDo] = useState("");

  const [newPracNr, setNewPracNr] = useState("");
  const [newPracImie, setNewPracImie] = useState("");
  const [newPracDzial, setNewPracDzial] = useState("");
  const [newPracEmail, setNewPracEmail] = useState("");
  const [newPracTelefon, setNewPracTelefon] = useState("");
  const [newPracAppRole, setNewPracAppRole] = useState("uzytkownik");
  const [newPracForma, setNewPracForma] = useState("uop");

  /** Który rekord KR jest w trybie edycji (klucz główny `kr`). */
  const [editingKrKey, setEditingKrKey] = useState(null);
  const [editForm, setEditForm] = useState({
    kr: "",
    nazwa_obiektu: "",
    rodzaj_pracy: "",
    dzial: "",
    osoba_prowadzaca: "",
    data_rozpoczecia: "",
    status: "",
    zleceniodawca: "",
    osoba_odpowiedzialna_zleceniodawcy: "",
    link_umowy: "",
    okres_projektu_od: "",
    okres_projektu_do: "",
  });

  /** Sortowanie listy KR w tabeli (i kolejności kart poniżej): KR / dział / status albo kolejność z bazy. */
  const [krListaSort, setKrListaSort] = useState({ key: null, dir: "asc" });

  const krListPosortowana = useMemo(() => {
    if (krListaSort.key !== "dzial" && krListaSort.key !== "status" && krListaSort.key !== "kr") {
      return krList;
    }
    const dirMnoznik = krListaSort.dir === "asc" ? 1 : -1;
    if (krListaSort.key === "kr") {
      return [...krList].sort((x, y) => {
        const c = String(x.kr).localeCompare(String(y.kr), "pl", {
          sensitivity: "base",
          numeric: true,
        });
        return c * dirMnoznik;
      });
    }
    const pole = krListaSort.key;
    return [...krList].sort((x, y) => {
      const c = porownajTekstSort(x[pole], y[pole]);
      if (c !== 0) return c * dirMnoznik;
      return String(x.kr).localeCompare(String(y.kr), "pl", {
        sensitivity: "base",
        numeric: true,
      });
    });
  }, [krList, krListaSort]);

  function przestawSortKr(kolumna) {
    setKrListaSort((prev) => {
      if (prev.key !== kolumna) return { key: kolumna, dir: "asc" };
      return { key: kolumna, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  }

  async function fetchKR() {
    const { data, error } = await supabase
      .from("kr")
      .select("*")
      .order("kr", { ascending: true });

    if (error) {
      console.error("Błąd pobierania KR:", error);
      setKrFetchError(error.message);
      return;
    }
    setKrFetchError(null);
    setKrList(data ?? []);
  }

  async function fetchEtapy() {
    const { data, error } = await supabase
      .from("etapy")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Błąd pobierania etapów:", error);
      setEtapyFetchError(error.message);
      return;
    }
    setEtapyFetchError(null);
    setEtapy(data ?? []);
  }

  /** Odczyt tabeli `pracownik` (przycisk „ID” na górze). */
  async function fetchPracownicy() {
    setPracLoading(true);
    setPracFetchError(null);
    const { data, error } = await supabase
      .from("pracownik")
      .select("*")
      .order("imie_nazwisko", { ascending: true });

    setPracLoading(false);

    if (error) {
      console.error("Błąd pobierania pracowników:", error);
      setPracFetchError(error.message);
      setPracownicy([]);
      return;
    }
    setPracownicy(data ?? []);
  }

  async function zapiszMojeDokumenty() {
    const uid = session?.user?.id;
    if (!uid) return;
    const { pracownikSesja, pracownikWidokEfektywny, czyAdminAktywny } = obliczPracownikWidokuDlaSesji(
      pracownicy,
      session,
      adminPodgladPracownikNr,
    );
    if (!pracownikSesja?.nr || !pracownikWidokEfektywny?.nr) return;
    if (!czyAdminAktywny) {
      setMojeDokSaveMsg("Tylko rola administratora może zapisywać skrót do arkusza.");
      return;
    }
    const nr = String(pracownikWidokEfektywny.nr).trim();
    setMojeDokSaveMsg(null);
    const arkusz = mojeDokEdycja.arkusz.trim() || null;
    const { error: eUpd } = await supabase.from("pracownik").update({ link_google_arkusz: arkusz }).eq("nr", nr);
    if (eUpd) {
      setMojeDokSaveMsg(String(eUpd.message));
      return;
    }
    await fetchPracownicy();
    const { data, error: e2 } = await supabase.from("pracownik_dokument").select("*").eq("pracownik_nr", nr);
    if (e2) {
      setMojeDokSaveMsg(String(e2.message));
      return;
    }
    setMojeDokumentyList(data ?? []);
    setMojeDokSaveMsg("Zapisano.");
  }

  async function importujWklejoneZListyBox() {
    const uid = session?.user?.id;
    if (!uid) return;
    const { pracownikSesja, pracownikWidokEfektywny, czyAdminAktywny } = obliczPracownikWidokuDlaSesji(
      pracownicy,
      session,
      adminPodgladPracownikNr,
    );
    if (!pracownikSesja?.nr || !pracownikWidokEfektywny?.nr) return;
    if (!czyAdminAktywny) {
      setMojeDokBulkMsg("Błąd: import z Box jest dostępny tylko dla administratora.");
      return;
    }
    const nr = String(pracownikWidokEfektywny.nr).trim();
    setMojeDokBulkMsg(null);
    const parsed = parseWierszeListyBoxHr(mojeDokBulkWklejka);
    const bledy = parsed.filter((r) => !r.ok);
    const okRows = parsed.filter((r) => r.ok);
    if (okRows.length === 0) {
      setMojeDokBulkMsg(
        bledy.length
          ? `Nie znaleziono poprawnych linii z URL. ${bledy.map((b) => b.blad).join("; ")}`
          : "Wklej co najmniej jedną linię (nazwa + link).",
      );
      return;
    }
    const dopasowane = okRows.filter((r) =>
      r.pracownik_nr_raw != null && r.pracownik_nr_raw !== ""
        ? nrPlikuPasujeDoPracownika(r.pracownik_nr_raw, nr)
        : false,
    );
    const pomija = okRows.filter(
      (r) =>
        r.pracownik_nr_raw == null ||
        r.pracownik_nr_raw === "" ||
        !nrPlikuPasujeDoPracownika(r.pracownik_nr_raw, nr),
    );
    let wstawiono = 0;
    let pominietoDuplikat = 0;
    for (const r of dopasowane) {
      const { data: istn } = await supabase
        .from("pracownik_dokument")
        .select("id")
        .eq("pracownik_nr", nr)
        .eq("url", r.url)
        .maybeSingle();
      if (istn?.id) {
        pominietoDuplikat++;
        continue;
      }
      const { error } = await supabase.from("pracownik_dokument").insert({
        pracownik_nr: nr,
        typ: PRACOWNIK_DOKUMENT_TYP_BOX_IMPORT,
        url: r.url,
        nazwa_pliku: r.nazwa_pliku,
        firma_kod: r.firma_kod,
      });
      if (error) {
        setMojeDokBulkMsg(`Błąd: ${error.message}`);
        return;
      }
      wstawiono++;
    }
    const { data: lista } = await supabase.from("pracownik_dokument").select("*").eq("pracownik_nr", nr);
    setMojeDokumentyList(lista ?? []);
    const frag = [
      `Dodano ${wstawiono} nowych linków.`,
      pominietoDuplikat ? `Pominięto duplikaty URL: ${pominietoDuplikat}.` : null,
      pomija.length
        ? `Nie zaimportowano ${pomija.length} linii (inny ID w nazwie niż docelowy „${nr}” lub brak formatu HR---A---…).`
        : null,
      bledy.length ? `Błędne linie (bez URL): ${bledy.length}.` : null,
    ]
      .filter(Boolean)
      .join(" ");
    setMojeDokBulkMsg(frag);
    setMojeDokBulkWklejka("");
  }

  async function usunZaimportowanyDokumentBox(id) {
    const uid = session?.user?.id;
    if (!uid || id == null) return;
    const { pracownikSesja, pracownikWidokEfektywny, czyAdminAktywny } = obliczPracownikWidokuDlaSesji(
      pracownicy,
      session,
      adminPodgladPracownikNr,
    );
    if (!pracownikSesja?.nr || !pracownikWidokEfektywny?.nr) return;
    if (!czyAdminAktywny) {
      setMojeDokBulkMsg("Błąd: usuwanie wpisów z listy Box jest dostępne tylko dla administratora.");
      return;
    }
    const nr = String(pracownikWidokEfektywny.nr).trim();
    setMojeDokBulkMsg(null);
    const { error } = await supabase.from("pracownik_dokument").delete().eq("id", id).eq("pracownik_nr", nr);
    if (error) {
      setMojeDokBulkMsg(`Błąd: ${error.message}`);
      return;
    }
    setMojeDokumentyList((prev) => prev.filter((x) => x.id !== id));
    setMojeDokBulkMsg("Usunięto wpis.");
  }

  async function fetchZadania() {
    const { data, error } = await supabase
      .from("zadania")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Błąd pobierania zadań:", error);
      setZadaniaFetchError(error.message);
      setZadaniaList([]);
      return;
    }
    setZadaniaFetchError(null);
    setZadaniaList(data ?? []);
  }

  async function fetchPodwykonawcy() {
    setPodwykonawcyFetchError(null);
    const { data, error } = await supabase
      .from("podwykonawca")
      .select("*")
      .order("nazwa_firmy", { ascending: true });

    if (error) {
      console.error("Błąd pobierania podwykonawców:", error);
      setPodwykonawcyFetchError(error.message);
      setPodwykonawcyList([]);
      return;
    }
    setPodwykonawcyList(data ?? []);
  }

  async function fetchSamochody() {
    setSamochodyFetchError(null);
    const { data, error } = await supabase
      .from("samochod_lista")
      .select("*")
      .order("nazwa", { ascending: true });

    if (error) {
      console.error("Błąd pobierania samochodów:", error);
      setSamochodyFetchError(error.message);
      setSamochodyList([]);
      return;
    }
    setSamochodyList(data ?? []);
  }

  async function fetchSprzet() {
    setSprzetFetchError(null);
    const { data, error } = await supabase
      .from("sprzet")
      .select("*")
      .order("typ", { ascending: true })
      .order("nazwa", { ascending: true });

    if (error) {
      console.error("Błąd pobierania sprzętu:", error);
      setSprzetFetchError(error.message);
      setSprzetList([]);
      return;
    }
    setSprzetList(data ?? []);
  }

  async function fetchRezerwacjeMiesiac(rok, miesiac1_12) {
    const y = Number(rok);
    const m = Number(miesiac1_12);
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
      setRezerwacjeList([]);
      return;
    }
    setRezerwacjeFetchError(null);
    const ostatni = new Date(y, m, 0).getDate();
    const od = `${y}-${String(m).padStart(2, "0")}-01`;
    const doDnia = `${y}-${String(m).padStart(2, "0")}-${String(ostatni).padStart(2, "0")}`;
    const { data, error } = await supabase
      .from("samochod_rezerwacja")
      .select("*")
      .gte("data_dnia", od)
      .lte("data_dnia", doDnia)
      .order("data_dnia", { ascending: true });

    if (error) {
      console.error("Błąd pobierania rezerwacji:", error);
      setRezerwacjeFetchError(error.message);
      setRezerwacjeList([]);
      return;
    }
    setRezerwacjeList(data ?? []);
  }

  async function fetchKrZleceniaPwForKr(krKod) {
    const k = String(krKod ?? "").trim();
    if (!k) {
      setKrZleceniaPwList([]);
      setKrZleceniaPwFetchError(null);
      return;
    }
    setKrZleceniaPwFetchError(null);
    const { data, error } = await supabase
      .from("kr_zlecenie_podwykonawcy")
      .select("*, podwykonawca(nazwa_firmy)")
      .eq("kr", k)
      .order("id", { ascending: true });

    if (error) {
      console.error("Błąd pobierania zleceń PW dla KR:", error);
      setKrZleceniaPwFetchError(error.message);
      setKrZleceniaPwList([]);
      return;
    }
    setKrZleceniaPwList(data ?? []);
  }

  async function fetchKrFakturyDoZaplatyForKr(krKod) {
    const k = String(krKod ?? "").trim();
    if (!k) {
      setKrFakturyDoZaplatyList([]);
      setKrFakturyDoZaplatyFetchError(null);
      return;
    }
    setKrFakturyDoZaplatyFetchError(null);
    const { data, error } = await supabase
      .from("kr_faktura_do_zaplaty")
      .select("*")
      .eq("kr", k)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Błąd pobierania zgłoszeń faktur do zapłaty:", error);
      setKrFakturyDoZaplatyFetchError(error.message);
      setKrFakturyDoZaplatyList([]);
      return;
    }
    setKrFakturyDoZaplatyList(data ?? []);
  }

  async function fetchCzasPracyWpisyDlaKr(krKod) {
    const k = String(krKod ?? "").trim();
    if (!k) {
      setKrCzasPracyWpisyList([]);
      setKrCzasPracyWpisyFetchError(null);
      return;
    }
    setKrCzasPracyWpisyFetchError(null);
    const { data, error } = await supabase
      .from("czas_pracy_wpis")
      .select("id, pracownik_nr, data, kr, typ, godziny, nadgodziny, uwagi, wykonywane_zadanie")
      .eq("kr", k)
      .order("data", { ascending: false })
      .order("id", { ascending: false })
      .limit(800);

    if (error) {
      console.error("Błąd pobierania czasu pracy dla KR:", error);
      setKrCzasPracyWpisyFetchError(error.message);
      setKrCzasPracyWpisyList([]);
      return;
    }
    setKrCzasPracyWpisyList(data ?? []);
    void fetchRoboczogodzinyPulpitDlaKr(k);
  }

  /** Roboczogodziny na pulpicie: suma godzin z wpisów, gdzie typ należy do grupy „praca” (jak w module Czas pracy). */
  async function fetchRoboczogodzinyPulpitDlaKr(krKod) {
    const k = String(krKod ?? "").trim();
    if (!k) {
      setPulpitRoboczogodziny({ suma: null, err: null, loading: false });
      return;
    }
    setPulpitRoboczogodziny((prev) => ({ ...prev, loading: true, err: null }));
    const { data, error } = await supabase
      .from("czas_pracy_wpis")
      .select("typ, godziny, nadgodziny")
      .eq("kr", k);

    if (error) {
      console.error("Błąd pobierania roboczogodzin dla pulpitu:", error);
      setPulpitRoboczogodziny({ suma: null, err: error.message, loading: false });
      return;
    }
    const suma = (data ?? []).reduce((acc, w) => {
      if (grupaTypuCzasuWpisu(w.typ) !== "praca") return acc;
      return acc + (Number(w.godziny) || 0) + (Number(w.nadgodziny) || 0);
    }, 0);
    setPulpitRoboczogodziny({ suma, err: null, loading: false });
  }

  async function fetchFakturyDoZaplatyOczekujace() {
    setFakturyDoZaplatyOczekujaceFetchError(null);
    const { data, error } = await supabase
      .from("kr_faktura_do_zaplaty")
      .select("*")
      .eq("status", "do_zaplaty")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Błąd pobierania faktur oczekujących na płatność:", error);
      setFakturyDoZaplatyOczekujaceFetchError(error.message);
      setFakturyDoZaplatyOczekujaceList([]);
      return;
    }
    setFakturyDoZaplatyOczekujaceList(data ?? []);
  }

  async function zapiszKrFakturaDoZaplaty(e, krKod) {
    e.preventDefault();
    const k = String(krKod ?? "").trim();
    const komu = String(fakturaDoZaplatyForm.komu ?? "").trim();
    if (!k || !komu) {
      alert("Podaj kod KR i pole „Komu / odbiorca”.");
      return;
    }
    const kw = kwotaBruttoDoPayload(fakturaDoZaplatyForm.kwota_brutto);
    if (kw == null || kw < 0) {
      alert("Podaj prawidłową kwotę brutto (np. 1234,56).");
      return;
    }
    const payload = {
      kr: k,
      komu,
      nr_konta: String(fakturaDoZaplatyForm.nr_konta ?? "").trim() || null,
      kwota_brutto: kw,
      link_faktury: String(fakturaDoZaplatyForm.link_faktury ?? "").trim() || null,
      numer_faktury: String(fakturaDoZaplatyForm.numer_faktury ?? "").trim() || null,
      zgloszil_pracownik_nr: String(fakturaDoZaplatyForm.zgloszil_pracownik_nr ?? "").trim() || null,
      notatki: String(fakturaDoZaplatyForm.notatki ?? "").trim() || null,
      status: "do_zaplaty",
    };
    const { error } = await supabase.from("kr_faktura_do_zaplaty").insert([payload]).select("id");
    if (error) {
      console.error(error);
      alert(
        "Zapis zgłoszenia: " +
          error.message +
          (String(error.message).includes("relation") || String(error.message).includes("does not exist")
            ? "\n\nUruchom g4-app/supabase/kr-faktura-do-zaplaty.sql oraz RLS w rls-policies-anon.sql."
            : "")
      );
      return;
    }
    setFakturaDoZaplatyForm(fakturaDoZaplatyPustyForm());
    await fetchKrFakturyDoZaplatyForKr(k);
    void fetchFakturyDoZaplatyOczekujace();
  }

  async function zapiszStatusKrFakturaDoZaplaty(rowId, status, krKod) {
    const st = String(status ?? "").trim();
    if (!FAKTURA_DO_ZAPLATY_STATUS_W_BAZIE.includes(st)) return;
    const { error } = await supabase.from("kr_faktura_do_zaplaty").update({ status: st }).eq("id", rowId);
    if (error) {
      console.error(error);
      alert("Zmiana statusu: " + error.message);
      return;
    }
    const k = String(krKod ?? "").trim();
    if (k) await fetchKrFakturyDoZaplatyForKr(k);
    void fetchFakturyDoZaplatyOczekujace();
  }

  /** Pobiera **faktury sprzedażowe** (wiersze `faktury` z `etap_id` należącym do etapów tego KR). */
  async function fetchKrFakturySprzedazForKr(krKod) {
    const k = String(krKod ?? "").trim();
    if (!k) {
      setKrFakturySprzedazList([]);
      setKrFakturySprzedazFetchError(null);
      return;
    }
    setKrFakturySprzedazFetchError(null);
    const { data: etapyIdsRows, error: e1 } = await supabase
      .from("etapy")
      .select("id")
      .eq("kr", k);

    if (e1) {
      console.error("Błąd pobierania etapów pod faktury sprzedażowe:", e1);
      setKrFakturySprzedazFetchError(e1.message);
      setKrFakturySprzedazList([]);
      return;
    }
    const ids = (etapyIdsRows ?? []).map((r) => r.id).filter((id) => id != null);
    if (ids.length === 0) {
      setKrFakturySprzedazList([]);
      return;
    }
    const { data, error } = await supabase.from("faktury").select("*").in("etap_id", ids);
    if (error) {
      console.error("Błąd pobierania faktur sprzedażowych dla KR:", error);
      setKrFakturySprzedazFetchError(error.message);
      setKrFakturySprzedazList([]);
      return;
    }
    setKrFakturySprzedazList(data ?? []);
  }

  async function fetchWszystkieZleceniaPw() {
    setPwZleceniaWszystkieFetchError(null);
    const { data, error } = await supabase
      .from("kr_zlecenie_podwykonawcy")
      .select("*, podwykonawca(nazwa_firmy)")
      .order("kr", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error("Błąd pobierania listy zleceń PW:", error);
      setPwZleceniaWszystkieFetchError(error.message);
      setPwZleceniaWszystkieList([]);
      return;
    }
    setPwZleceniaWszystkieList(data ?? []);
  }

  async function fetchDziennikForKr(krKod) {
    const k = String(krKod ?? "").trim();
    if (!k) {
      setDziennikWpisy([]);
      return;
    }
    setDziennikFetchError(null);
    const { data, error } = await supabase
      .from("dziennik_zdarzen")
      .select("*")
      .eq("kr", k)
      .order("data_zdarzenia", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Błąd pobierania dziennika zdarzeń:", error);
      setDziennikFetchError(error.message);
      setDziennikWpisy([]);
      return;
    }
    setDziennikWpisy(data ?? []);
  }

  function przejdzDoKr() {
    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    setKrZleceniePwEdycjaId(null);
    setKrZleceniePwKontekstKr(null);
    setKrZleceniePwForm(krZleceniePwPustyForm());
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
    setPwEdycjaId(null);
    setPwForm(podwykonawcaPustyForm());
    setWidok("kr");
    setKrProjektSekcja("przeglad");
    void fetchKR();
    void fetchEtapy();
  }

  /** Dashboard: lista „Księgowość — faktury do opłacenia” (scroll na tym samym widoku lub po przejściu z innego). */
  function przewinDoDashboardFakturyDoOplacenia() {
    const run = () =>
      document.getElementById("dashboard-faktury-do-oplacenia")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    if (widok === "dashboard") {
      run();
    } else {
      przejdzDoDashboard();
      requestAnimationFrame(() => requestAnimationFrame(run));
      window.setTimeout(run, 160);
    }
  }

  /** Panel operacyjny — ekran startowy z KPI (demo dla kierownictwa). */
  function przejdzDoDashboard() {
    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    setPulpitSortDaty("asc");
    setKrZleceniePwEdycjaId(null);
    setKrZleceniePwKontekstKr(null);
    setKrZleceniePwForm(krZleceniePwPustyForm());
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
    setPwEdycjaId(null);
    setPwForm(podwykonawcaPustyForm());
    setKrProjektSekcja("przeglad");
    setWidok("dashboard");
    void fetchKR();
    void fetchEtapy();
    void fetchZadania();
    void fetchWszystkieZleceniaPw();
    void fetchSamochody();
    void fetchFakturyDoZaplatyOczekujace();
  }

  /** Lista alertów operacyjnych (bez osobnej tabeli w bazie — reguły z istniejących danych). */
  function przejdzDoOstrzezeniaPanel() {
    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    setPulpitSortDaty("asc");
    setKrZleceniePwEdycjaId(null);
    setKrZleceniePwKontekstKr(null);
    setKrZleceniePwForm(krZleceniePwPustyForm());
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
    setPwEdycjaId(null);
    setPwForm(podwykonawcaPustyForm());
    setWidok("ostrzezenia");
    void fetchKR();
    void fetchEtapy();
    void fetchZadania();
    void fetchWszystkieZleceniaPw();
    void fetchPodwykonawcy();
    void fetchFakturyDoZaplatyOczekujace();
  }

  function przejdzDoPracownikow() {
    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    setKrZleceniePwEdycjaId(null);
    setKrZleceniePwKontekstKr(null);
    setKrZleceniePwForm(krZleceniePwPustyForm());
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
    setPwEdycjaId(null);
    setPwForm(podwykonawcaPustyForm());
    setWidok("pracownik");
    void fetchPracownicy();
  }

  function przejdzDoCzasPracy() {
    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    setKrZleceniePwEdycjaId(null);
    setKrZleceniePwKontekstKr(null);
    setKrZleceniePwForm(krZleceniePwPustyForm());
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
    setPwEdycjaId(null);
    setPwForm(podwykonawcaPustyForm());
    setWidok("czas_pracy");
    void fetchPracownicy();
    void fetchKR();
  }

  function przejdzDoMojeDokumenty() {
    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    setKrZleceniePwEdycjaId(null);
    setKrZleceniePwKontekstKr(null);
    setKrZleceniePwForm(krZleceniePwPustyForm());
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
    setPwEdycjaId(null);
    setPwForm(podwykonawcaPustyForm());
    setKrProjektSekcja("przeglad");
    setMojeDokSaveMsg(null);
    setWidok("moje_dokumenty");
    void fetchPracownicy();
  }

  function przejdzDoZadanDlaNr(nr) {
    setZadaniaFiltrPracNr(String(nr ?? "").trim());
    przejdzDoZadania();
  }

  function przejdzDoZadania() {
    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    setKrZleceniePwEdycjaId(null);
    setKrZleceniePwKontekstKr(null);
    setKrZleceniePwForm(krZleceniePwPustyForm());
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
    setPwEdycjaId(null);
    setPwForm(podwykonawcaPustyForm());
    setKrProjektSekcja("przeglad");
    setWidok("zadania");
    void fetchZadania();
    void fetchPracownicy();
  }

  /** Moduł Zadania: filtr „tylko zadania przypisane do kodów KR z listy kart (nie ogólne, nie osierocone kody). */
  function przejdzDoZadanTylkoZKartamiKr() {
    setZadaniaFiltrKr("__tylko_z_kr__");
    przejdzDoZadania();
  }

  function przejdzDoPodwykonawcow() {
    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    setPulpitSortDaty("asc");
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
    setPwEdycjaId(null);
    setPwForm(podwykonawcaPustyForm());
    setWidok("podwykonawca");
    void fetchPodwykonawcy();
    void fetchPracownicy();
  }

  function przejdzDoSamochody() {
    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    setPulpitSortDaty("asc");
    setKrZleceniePwEdycjaId(null);
    setKrZleceniePwKontekstKr(null);
    setKrZleceniePwForm(krZleceniePwPustyForm());
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
    setPwEdycjaId(null);
    setPwForm(podwykonawcaPustyForm());
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    setKalFlotaRok(y);
    setKalFlotaMiesiac(m);
    setSamochodEdycjaId(null);
    setSamochodForm(samochodPustyForm());
    setRezerwacjaForm(rezerwacjaPustyForm());
    setWidok("samochody");
    void fetchPracownicy();
    void fetchSamochody();
    void fetchRezerwacjeMiesiac(y, m);
  }

  function przejdzDoSprzet() {
    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    setPulpitSortDaty("asc");
    setKrZleceniePwEdycjaId(null);
    setKrZleceniePwKontekstKr(null);
    setKrZleceniePwForm(krZleceniePwPustyForm());
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
    setPwEdycjaId(null);
    setPwForm(podwykonawcaPustyForm());
    setSprzetEdycjaId(null);
    setSprzetForm(sprzetPustyForm());
    setWidok("sprzet");
    void fetchPracownicy();
    void fetchSprzet();
  }

  /** Ekran pomocy: kiedy aplikacja podświetla „zagrożenia” / wymagające uwagi (pulpit, lista KR). */
  function przejdzDoInfoZagrozen() {
    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    setPulpitSortDaty("asc");
    setKrZleceniePwEdycjaId(null);
    setKrZleceniePwKontekstKr(null);
    setKrZleceniePwForm(krZleceniePwPustyForm());
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
    setPwEdycjaId(null);
    setPwForm(podwykonawcaPustyForm());
    setWidok("zagrozenia");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function addPracownik(e) {
    e.preventDefault();
    const nr = newPracNr.trim();
    const imie = newPracImie.trim();
    if (!nr || !imie) {
      alert("Podaj co najmniej nr (ID) i imię i nazwisko.");
      return;
    }

    const { czyAdminAktywny: jestAdmin } = obliczPracownikWidokuDlaSesji(
      pracownicy,
      session,
      adminPodgladPracownikNr,
    );
    const wiersz = {
      nr,
      imie_nazwisko: imie,
      dzial: newPracDzial.trim() || null,
      email: newPracEmail.trim() || null,
      telefon: newPracTelefon.trim() || null,
    };
    if (jestAdmin) {
      const ar = String(newPracAppRole ?? "uzytkownik").trim();
      if (["admin", "kierownik", "uzytkownik"].includes(ar)) wiersz.app_role = ar;
      const fz = String(newPracForma ?? "uop").trim();
      if (["uop", "uz", "inne"].includes(fz)) wiersz.forma_zatrudnienia = fz;
    }

    const { error } = await supabase.from("pracownik").insert([wiersz]);

    if (error) {
      console.error(error);
      alert(
        "Nie udało się dodać pracownika: " +
          error.message +
          "\n\nJeśli to uprawnienia — uruchom ponownie plik z polityką INSERT (anon_insert_pracownik)."
      );
      return;
    }

    setNewPracNr("");
    setNewPracImie("");
    setNewPracDzial("");
    setNewPracEmail("");
    setNewPracTelefon("");
    setNewPracAppRole("uzytkownik");
    setNewPracForma("uop");
    await fetchPracownicy();
  }

  async function ustawFormaZatrudnienia(nr, forma) {
    const { czyAdminAktywny: jestAdmin } = obliczPracownikWidokuDlaSesji(
      pracownicy,
      session,
      adminPodgladPracownikNr,
    );
    if (!jestAdmin) {
      alert("Tylko administrator może zmieniać formę zatrudnienia.");
      return;
    }
    const f = String(forma ?? "").trim();
    if (!["uop", "uz", "inne"].includes(f)) return;
    const { error } = await supabase.from("pracownik").update({ forma_zatrudnienia: f }).eq("nr", nr);
    if (error) {
      console.error(error);
      alert(
        "Zapis formy zatrudnienia: " +
          error.message +
          (String(error.message).includes("column") || String(error.message).includes("schema")
            ? "\n\nUruchom w Supabase: g4-app/supabase/pracownik-forma-zatrudnienia.sql"
            : ""),
      );
      return;
    }
    await fetchPracownicy();
  }

  async function ustawOdpowiedzialnyFlota(nr, wartosc) {
    const { czyAdminAktywny: jestAdmin } = obliczPracownikWidokuDlaSesji(
      pracownicy,
      session,
      adminPodgladPracownikNr,
    );
    if (!jestAdmin) {
      alert("Tylko administrator może przypisywać odpowiedzialność za flotę.");
      return;
    }
    const { error } = await supabase
      .from("pracownik")
      .update({ odpowiedzialny_flota: wartosc })
      .eq("nr", nr);
    if (error) {
      console.error(error);
      alert("Zapis „odpowiedzialny za flotę”: " + error.message);
      return;
    }
    await fetchPracownicy();
  }

  async function ustawAppRolePracownika(nr, appRoleNowa) {
    const { pracownikSesja, czyAdminAktywny: jestAdmin } = obliczPracownikWidokuDlaSesji(
      pracownicy,
      session,
      adminPodgladPracownikNr,
    );
    if (!jestAdmin) {
      alert("Tylko administrator może zmieniać role użytkowników.");
      return;
    }
    const rola = String(appRoleNowa ?? "").trim();
    if (!["admin", "kierownik", "uzytkownik"].includes(rola)) return;
    if (
      pracownikSesja &&
      String(pracownikSesja.nr ?? "").trim() === String(nr).trim() &&
      String(pracownikSesja.app_role ?? "").trim() === "admin" &&
      rola !== "admin"
    ) {
      if (!window.confirm("Zdejmujesz sobie rolę administratora. Kontynuować?")) return;
    }
    const { error } = await supabase.from("pracownik").update({ app_role: rola }).eq("nr", nr);
    if (error) {
      console.error(error);
      alert("Zapis roli: " + error.message);
      return;
    }
    await fetchPracownicy();
  }

  function wczytajZadanieDoEdycji(row) {
    setZadanieEdycjaId(row.id);
    setZadanieForm(zadanieWierszDoFormu(row));
  }

  function anulujZadanieEdycje() {
    setZadanieEdycjaId(null);
    if (krProjektSekcja === "zadania_kr" && wybranyKrKlucz != null) {
      const k = String(wybranyKrKlucz).trim();
      setZadanieForm({ ...zadaniePustyForm(), kr: k });
    } else {
      setZadanieForm(zadaniePustyForm());
    }
  }

  async function zapiszZadanie(e, opts) {
    e.preventDefault();
    const zTxt = String(zadanieForm.zadanie ?? "").trim();
    if (!zTxt) {
      alert('Pole „Zadanie” jest wymagane.');
      return;
    }

    const st = String(zadanieForm.status ?? "").trim();
    const statusDoBazy = st === "" ? null : st;

    const krForced =
      opts?.krWymuszony != null && String(opts.krWymuszony).trim() !== ""
        ? String(opts.krWymuszony).trim()
        : null;
    const payload = {
      kr: krForced ?? (String(zadanieForm.kr ?? "").trim() || null),
      zadanie: zTxt,
      dzial: String(zadanieForm.dzial ?? "").trim() || null,
      osoba_odpowiedzialna: String(zadanieForm.osoba_odpowiedzialna ?? "").trim() || null,
      osoba_zlecajaca: String(zadanieForm.osoba_zlecajaca ?? "").trim() || null,
      status: statusDoBazy,
      data_planowana: String(zadanieForm.data_planowana ?? "").trim() || null,
      data_realna: String(zadanieForm.data_realna ?? "").trim() || null,
      zagrozenie: takNieDoBool(zadanieForm.zagrozenie),
      opis: String(zadanieForm.opis ?? "").trim() || null,
    };

    if (zadanieEdycjaId != null) {
      const { error } = await supabase
        .from("zadania")
        .update(payload)
        .eq("id", zadanieEdycjaId)
        .select("id");

      if (error) {
        console.error(error);
        alert(
          "Zapis zadania: " +
            error.message +
            (String(error.message).includes("column") || String(error.message).includes("schema")
              ? "\n\nSprawdź strukturę tabeli zadania w bazie. Kolumna kr: g4-app/supabase/zadania-kolumna-kr.sql"
              : "") +
            "\n\nUruchom sekcję zadania w g4-app/supabase/rls-policies-anon.sql (RLS + GRANT)."
        );
        return;
      }
    } else {
      const { error } = await supabase.from("zadania").insert([payload]).select("id");

      if (error) {
        console.error(error);
        alert(
          "Dodawanie zadania: " +
            error.message +
            (String(error.message).toLowerCase().includes("kr")
              ? "\n\nUruchom g4-app/supabase/zadania-kolumna-kr.sql w SQL Editor."
              : "") +
            "\n\nUruchom sekcję zadania w g4-app/supabase/rls-policies-anon.sql."
        );
        return;
      }
    }

    setZadanieEdycjaId(null);
    const kReset =
      opts?.krWymuszony != null && String(opts.krWymuszony).trim() !== ""
        ? String(opts.krWymuszony).trim()
        : "";
    if (kReset) {
      setZadanieForm({ ...zadaniePustyForm(), kr: kReset });
    } else {
      setZadanieForm(zadaniePustyForm());
    }
    await fetchZadania();
  }

  async function ustawStatusZadaniaSzybko(rowId, nowyStatus) {
    const st = String(nowyStatus ?? "").trim();
    if (!st || !ZADANIE_STATUS_W_BAZIE.includes(st)) return;
    const row = zadaniaList.find((z) => z.id === rowId);
    const patch = { status: st };
    if (zadanieCzyUkonczoneStatus(st)) {
      const maReal =
        row != null &&
        row.data_realna != null &&
        String(row.data_realna).trim() !== "" &&
        dataDoInputa(row.data_realna) !== "";
      if (!maReal) patch.data_realna = dzisiajDataYYYYMMDD();
    }
    const { error } = await supabase.from("zadania").update(patch).eq("id", rowId);
    if (error) {
      console.error(error);
      alert("Zmiana statusu: " + error.message);
      return;
    }
    await fetchZadania();
  }

  async function usunZadanie(id) {
    if (!window.confirm("Usunąć to zadanie?")) return;
    const { error } = await supabase.from("zadania").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Usuwanie: " + error.message + "\n\nSprawdź politykę DELETE dla zadania (rls-policies-anon.sql).");
      return;
    }
    if (zadanieEdycjaId === id) {
      anulujZadanieEdycje();
    }
    await fetchZadania();
  }

  function wczytajPwDoEdycji(row) {
    setPwEdycjaId(row.id);
    setPwForm(podwykonawcaWierszDoFormu(row));
  }

  function anulujPwEdycje() {
    setPwEdycjaId(null);
    setPwForm(podwykonawcaPustyForm());
  }

  async function zapiszPodwykonawce(e) {
    e.preventDefault();
    const nazwa = String(pwForm.nazwa_firmy ?? "").trim();
    if (!nazwa) {
      alert("Pole „Nazwa firmy” jest wymagane.");
      return;
    }

    const payload = {
      nazwa_firmy: nazwa,
      osoba_kontaktowa: String(pwForm.osoba_kontaktowa ?? "").trim() || null,
      telefon: String(pwForm.telefon ?? "").trim() || null,
    };

    if (pwEdycjaId != null) {
      const { error } = await supabase
        .from("podwykonawca")
        .update(payload)
        .eq("id", pwEdycjaId)
        .select("id");

      if (error) {
        console.error(error);
        alert(
          "Zapis podwykonawcy: " +
            error.message +
            (String(error.message).includes("relation") || String(error.message).includes("schema")
              ? "\n\nUtwórz tabelę: g4-app/supabase/podwykonawca-tabela.sql, potem RLS (rls-policies-anon.sql)."
              : "") +
            "\n\nSprawdź polityki INSERT/UPDATE dla podwykonawca."
        );
        return;
      }
    } else {
      const { error } = await supabase.from("podwykonawca").insert([payload]).select("id");

      if (error) {
        console.error(error);
        alert(
          "Dodawanie podwykonawcy: " +
            error.message +
            (String(error.message).includes("relation") || String(error.message).includes("schema")
              ? "\n\nUruchom podwykonawca-tabela.sql oraz sekcję podwykonawca w rls-policies-anon.sql."
              : "")
        );
        return;
      }
    }

    setPwEdycjaId(null);
    setPwForm(podwykonawcaPustyForm());
    await fetchPodwykonawcy();
  }

  async function usunPodwykonawce(id) {
    if (!window.confirm("Usunąć tego podwykonawcę z bazy?")) return;
    const { error } = await supabase.from("podwykonawca").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert(
        "Usuwanie: " +
          error.message +
          "\n\nSprawdź politykę DELETE dla podwykonawca (rls-policies-anon.sql)."
      );
      return;
    }
    if (pwEdycjaId === id) {
      anulujPwEdycje();
    }
    await fetchPodwykonawcy();
  }

  function wczytajSamochodDoEdycji(row) {
    setSamochodEdycjaId(row.id);
    setSamochodForm(samochodWierszDoFormu(row));
  }

  function anulujSamochodEdycje() {
    setSamochodEdycjaId(null);
    setSamochodForm(samochodPustyForm());
  }

  async function zapiszSamochod(e) {
    e.preventDefault();
    const { pracownikWidokEfektywny: pw } = obliczPracownikWidokuDlaSesji(
      pracownicy,
      session,
      adminPodgladPracownikNr,
    );
    const widziFlote = pracownikWidziNaprawyFloty(pw);
    const nazwa = String(samochodForm.nazwa ?? "").trim();
    if (!nazwa) {
      alert("Podaj nazwę pojazdu (np. model + rejestracja).");
      return;
    }
    const payload = {
      nazwa,
      numer_rejestracyjny: String(samochodForm.numer_rejestracyjny ?? "").trim() || null,
      polisa_numer: String(samochodForm.polisa_numer ?? "").trim() || null,
      polisa_wazna_do: String(samochodForm.polisa_wazna_do ?? "").trim() || null,
      przeglad_wazny_do: String(samochodForm.przeglad_wazny_do ?? "").trim() || null,
      uwagi_eksploatacja: String(samochodForm.uwagi_eksploatacja ?? "").trim() || null,
      notatki: String(samochodForm.notatki ?? "").trim() || null,
    };
    if (widziFlote) {
      payload.wymagane_naprawy = String(samochodForm.wymagane_naprawy ?? "").trim() || null;
    }

    if (samochodEdycjaId != null) {
      const { error } = await supabase.from("samochod").update(payload).eq("id", samochodEdycjaId).select("id");
      if (error) {
        console.error(error);
        alert(
          "Zapis samochodu: " +
            error.message +
            (String(error.message).includes("relation") || String(error.message).includes("does not exist")
              ? "\n\nUruchom samochody-sprzet-rezerwacje.sql i sekcję samochod w rls-policies-anon.sql."
              : "")
        );
        return;
      }
    } else {
      const { error } = await supabase.from("samochod").insert([payload]).select("id");
      if (error) {
        console.error(error);
        alert("Dodawanie samochodu: " + error.message);
        return;
      }
    }
    setSamochodEdycjaId(null);
    setSamochodForm(samochodPustyForm());
    await fetchSamochody();
  }

  async function usunSamochod(id) {
    if (!window.confirm("Usunąć ten samochód? Powiązane rezerwacje w kalendarzu też znikną.")) return;
    const { error } = await supabase.from("samochod").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Usuwanie: " + error.message);
      return;
    }
    if (samochodEdycjaId === id) {
      anulujSamochodEdycje();
    }
    await fetchSamochody();
    await fetchRezerwacjeMiesiac(kalFlotaRok, kalFlotaMiesiac);
  }

  async function zapiszRezerwacje(e) {
    e.preventDefault();
    const sid = Number.parseInt(String(rezerwacjaForm.samochod_id ?? "").trim(), 10);
    const dataDnia = String(rezerwacjaForm.data_dnia ?? "").trim();
    const pnr = String(rezerwacjaForm.pracownik_nr ?? "").trim();
    if (!Number.isFinite(sid) || !dataDnia || !pnr) {
      alert("Wybierz samochód, datę dnia i pracownika (ID z listy).");
      return;
    }
    const { error } = await supabase.from("samochod_rezerwacja").upsert(
      {
        samochod_id: sid,
        data_dnia: dataDnia,
        pracownik_nr: pnr,
        opis_krotki: String(rezerwacjaForm.opis_krotki ?? "").trim() || null,
      },
      { onConflict: "samochod_id,data_dnia" }
    );
    if (error) {
      console.error(error);
      alert(
        "Rezerwacja: " +
          error.message +
          (String(error.message).includes("relation") || String(error.message).includes("does not exist")
            ? "\n\nUruchom samochody-sprzet-rezerwacje.sql i RLS dla samochod_rezerwacja."
            : "")
      );
      return;
    }
    setRezerwacjaForm(rezerwacjaPustyForm());
    await fetchRezerwacjeMiesiac(kalFlotaRok, kalFlotaMiesiac);
  }

  async function usunRezerwacje(id) {
    if (!window.confirm("Usunąć ten wpis z kalendarza?")) return;
    const { error } = await supabase.from("samochod_rezerwacja").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Usuwanie rezerwacji: " + error.message);
      return;
    }
    await fetchRezerwacjeMiesiac(kalFlotaRok, kalFlotaMiesiac);
  }

  function wczytajSprzetDoEdycji(row) {
    setSprzetEdycjaId(row.id);
    setSprzetForm(sprzetWierszDoFormu(row));
  }

  function anulujSprzetEdycje() {
    setSprzetEdycjaId(null);
    setSprzetForm(sprzetPustyForm());
  }

  async function zapiszSprzetEwidencja(e) {
    e.preventDefault();
    const nazwa = String(sprzetForm.nazwa ?? "").trim();
    if (!nazwa) {
      alert("Podaj nazwę sprzętu.");
      return;
    }
    const typ = String(sprzetForm.typ ?? "").trim() || "inne";
    const payload = {
      typ,
      nazwa,
      numer_inwentarzowy: String(sprzetForm.numer_inwentarzowy ?? "").trim() || null,
      data_przegladu: String(sprzetForm.data_przegladu ?? "").trim() || null,
      pracownik_nr: String(sprzetForm.pracownik_nr ?? "").trim() || null,
      notatki: String(sprzetForm.notatki ?? "").trim() || null,
    };

    if (sprzetEdycjaId != null) {
      const { error } = await supabase.from("sprzet").update(payload).eq("id", sprzetEdycjaId).select("id");
      if (error) {
        console.error(error);
        alert(
          "Zapis sprzętu: " +
            error.message +
            (String(error.message).includes("relation") || String(error.message).includes("does not exist")
              ? "\n\nUruchom samochody-sprzet-rezerwacje.sql i RLS dla sprzet."
              : "")
        );
        return;
      }
    } else {
      const { error } = await supabase.from("sprzet").insert([payload]).select("id");
      if (error) {
        console.error(error);
        alert("Dodawanie sprzętu: " + error.message);
        return;
      }
    }
    setSprzetEdycjaId(null);
    setSprzetForm(sprzetPustyForm());
    await fetchSprzet();
  }

  async function usunSprzet(id) {
    if (!window.confirm("Usunąć ten wpis sprzętu z ewidencji?")) return;
    const { error } = await supabase.from("sprzet").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Usuwanie: " + error.message);
      return;
    }
    if (sprzetEdycjaId === id) {
      anulujSprzetEdycje();
    }
    await fetchSprzet();
  }

  function wczytajKrZleceniePwDoEdycji(row) {
    setKrZleceniePwKontekstKr(row.kr != null ? String(row.kr).trim() : "");
    setKrZleceniePwEdycjaId(row.id);
    setKrZleceniePwForm(krZleceniePwWierszDoFormu(row));
  }

  function anulujKrZleceniePwEdycje() {
    setKrZleceniePwEdycjaId(null);
    setKrZleceniePwKontekstKr(null);
    setKrZleceniePwForm(krZleceniePwPustyForm());
  }

  async function zapiszKrZleceniePw(e) {
    e.preventDefault();
    const k =
      (widokPwDlaKr != null ? String(widokPwDlaKr).trim() : "") ||
      (krZleceniePwKontekstKr != null ? String(krZleceniePwKontekstKr).trim() : "");
    if (!k) return;

    const pwId = Number.parseInt(String(krZleceniePwForm.podwykonawca_id ?? "").trim(), 10);
    if (!Number.isFinite(pwId)) {
      alert("Wybierz podwykonawcę z listy. Nową firmę dodasz w zakładce PW.");
      return;
    }

    const payload = {
      kr: k,
      podwykonawca_id: pwId,
      numer_zlecenia: String(krZleceniePwForm.numer_zlecenia ?? "").trim() || null,
      opis_zakresu: String(krZleceniePwForm.opis_zakresu ?? "").trim() || null,
      data_zlecenia: String(krZleceniePwForm.data_zlecenia ?? "").trim() || null,
      termin_zlecenia: String(krZleceniePwForm.termin_zlecenia ?? "").trim() || null,
      data_oddania: String(krZleceniePwForm.data_oddania ?? "").trim() || null,
      cena_netto: krZleceniePwKwotaDoPayload(krZleceniePwForm.cena_netto),
      czy_sprawdzone: !!krZleceniePwForm.czy_sprawdzone,
      czy_odebrane: !!krZleceniePwForm.czy_odebrane,
      status: String(krZleceniePwForm.status ?? "").trim() || null,
      pracownik_weryfikacja: String(krZleceniePwForm.pracownik_weryfikacja ?? "").trim() || null,
      osoba_faktury_nazwa: String(krZleceniePwForm.osoba_faktury_nazwa ?? "").trim() || null,
      osoba_faktury_email: String(krZleceniePwForm.osoba_faktury_email ?? "").trim() || null,
      osoba_faktury_telefon: String(krZleceniePwForm.osoba_faktury_telefon ?? "").trim() || null,
      uwagi: String(krZleceniePwForm.uwagi ?? "").trim() || null,
    };

    if (krZleceniePwEdycjaId != null) {
      const { error } = await supabase
        .from("kr_zlecenie_podwykonawcy")
        .update(payload)
        .eq("id", krZleceniePwEdycjaId)
        .select("id");

      if (error) {
        console.error(error);
        const msg = String(error.message);
        const brakKolumny =
          msg.includes("cena_netto") ||
          msg.includes("termin_zlecenia") ||
          msg.includes("data_oddania") ||
          msg.includes("czy_sprawdzone") ||
          msg.includes("czy_odebrane") ||
          /column.*schema cache/i.test(msg);
        alert(
          "Zapis zlecenia PW: " +
            msg +
            (msg.includes("relation") || msg.includes("schema") || brakKolumny
              ? "\n\nUruchom w SQL Editor: g4-app/supabase/kr-zlecenie-podwykonawcy-kolumny-netto-termin-odbior.sql (istniejąca tabela bez nowych pól). Przy pustej bazie wystarczy pełny kr-zlecenie-podwykonawcy.sql."
              : "") +
            (msg.includes("relation") || (msg.includes("schema") && !brakKolumny)
              ? "\n\nSekcja kr_zlecenie w rls-policies-anon.sql (i przy logowaniu: rls-policies-authenticated.sql)."
              : "")
        );
        return;
      }
    } else {
      const { error } = await supabase.from("kr_zlecenie_podwykonawcy").insert([payload]).select("id");

      if (error) {
        console.error(error);
        const msg = String(error.message);
        const brakKolumny =
          msg.includes("cena_netto") ||
          msg.includes("termin_zlecenia") ||
          msg.includes("data_oddania") ||
          msg.includes("czy_sprawdzone") ||
          msg.includes("czy_odebrane") ||
          /column.*schema cache/i.test(msg);
        alert(
          "Dodawanie zlecenia PW: " +
            msg +
            (msg.includes("relation") || msg.includes("schema") || brakKolumny
              ? "\n\nUruchom w SQL Editor: kr-zlecenie-podwykonawcy-kolumny-netto-termin-odbior.sql albo pełny kr-zlecenie-podwykonawcy.sql oraz RLS."
              : "")
        );
        return;
      }
    }

    anulujKrZleceniePwEdycje();
    await fetchKrZleceniaPwForKr(k);
    void fetchWszystkieZleceniaPw();
  }

  async function usunKrZleceniePw(id, krRef) {
    if (!window.confirm("Usunąć to zlecenie podwykonawcy przy tym KR?")) return;
    const k =
      (widokPwDlaKr != null ? String(widokPwDlaKr).trim() : "") ||
      (krRef != null ? String(krRef).trim() : "") ||
      (krZleceniePwKontekstKr != null ? String(krZleceniePwKontekstKr).trim() : "");
    const { error } = await supabase.from("kr_zlecenie_podwykonawcy").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Usuwanie: " + error.message + "\n\nSprawdź politykę DELETE (rls-policies-anon.sql).");
      return;
    }
    if (krZleceniePwEdycjaId === id) {
      anulujKrZleceniePwEdycje();
    }
    if (k) await fetchKrZleceniaPwForKr(k);
    void fetchWszystkieZleceniaPw();
  }

  useEffect(() => {
    if (widok !== "podwykonawca") return;
    void fetchWszystkieZleceniaPw();
  }, [widok]);

  useEffect(() => {
    if (!requireAuth) {
      setAuthReady(true);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (!mounted) return;
      setSession(sess);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === "PASSWORD_RECOVERY") {
        setWymusNoweHasloPoReset(true);
      }
      setSession(sess);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!requireAuth || !authReady) return;
    try {
      const raw = `${window.location.hash}${window.location.search}`;
      const h = decodeURIComponent(raw);
      if (h.includes("type=recovery")) setWymusNoweHasloPoReset(true);
    } catch {
      /* ignore */
    }
  }, [requireAuth, authReady, session?.user?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TRYB_HELP, trybHelp ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [trybHelp]);

  useEffect(() => {
    if (widok !== "samochody") return;
    void fetchPracownicy();
    void fetchSamochody();
    void fetchRezerwacjeMiesiac(kalFlotaRok, kalFlotaMiesiac);
  }, [widok, kalFlotaRok, kalFlotaMiesiac]);

  useEffect(() => {
    if (widok !== "sprzet") return;
    void fetchPracownicy();
    void fetchSprzet();
  }, [widok]);

  useEffect(() => {
    if (!requireAuth) {
      void (async () => {
        try {
          await fetchKR();
          await fetchEtapy();
          void fetchPracownicy();
          void fetchZadania();
          void fetchPodwykonawcy();
          void fetchSamochody();
          void fetchFakturyDoZaplatyOczekujace();
        } finally {
          setInitialFetchDone(true);
        }
      })();
      return;
    }
    if (!session?.user) {
      setInitialFetchDone(false);
      return;
    }
    void (async () => {
      try {
        await fetchKR();
        await fetchEtapy();
        void fetchPracownicy();
        void fetchZadania();
        void fetchPodwykonawcy();
        void fetchSamochody();
        void fetchFakturyDoZaplatyOczekujace();
      } finally {
        setInitialFetchDone(true);
      }
    })();
  }, [requireAuth, session?.user?.id]);

  useEffect(() => {
    if (widok !== "kr") return;
    const kInfo = widokInfoDlaKr != null ? String(widokInfoDlaKr).trim() : "";
    const kPw = widokPwDlaKr != null ? String(widokPwDlaKr).trim() : "";
    const kPulpit = widokPulpitDlaKr != null ? String(widokPulpitDlaKr).trim() : "";
    const hubBezPodwidoku =
      wybranyKrKlucz != null &&
      widokKmDlaKr == null &&
      widokLogDlaKr == null &&
      widokPwDlaKr == null &&
      widokPulpitDlaKr == null &&
      widokInfoDlaKr == null
        ? String(wybranyKrKlucz).trim()
        : "";
    const k = kInfo || kPw || kPulpit || hubBezPodwidoku;
    if (!k) {
      setKrZleceniaPwList([]);
      setKrZleceniaPwFetchError(null);
      setKrFakturyDoZaplatyList([]);
      setKrFakturyDoZaplatyFetchError(null);
      return;
    }
    void fetchKrZleceniaPwForKr(k);
    void fetchKrFakturyDoZaplatyForKr(k);
    void fetchPodwykonawcy();
  }, [
    widok,
    widokInfoDlaKr,
    widokPwDlaKr,
    widokPulpitDlaKr,
    wybranyKrKlucz,
    widokKmDlaKr,
    widokLogDlaKr,
  ]);

  /** Jeden kod KR do podglądu FS: pulpit, tabela etapów lub karta projektu (hub). BRUDNOPIS: ewent. dodać widok INFO. */
  const krKodDoPobraniaFakturSprzedaz = useMemo(() => {
    if (widok !== "kr") return "";
    const p = widokPulpitDlaKr != null ? String(widokPulpitDlaKr).trim() : "";
    if (p) return p;
    const km = widokKmDlaKr != null ? String(widokKmDlaKr).trim() : "";
    if (km) return km;
    const hub = wybranyKrKlucz != null ? String(wybranyKrKlucz).trim() : "";
    if (hub) return hub;
    return "";
  }, [widok, widokPulpitDlaKr, widokKmDlaKr, wybranyKrKlucz]);

  useEffect(() => {
    const k = String(krKodDoPobraniaFakturSprzedaz ?? "").trim();
    if (!k) {
      setKrFakturySprzedazList([]);
      setKrFakturySprzedazFetchError(null);
      return;
    }
    void fetchKrFakturySprzedazForKr(k);
  }, [krKodDoPobraniaFakturSprzedaz]);

  /** Pulpit korzysta z tej samej tablicy co widok LOG; po edycji etapu czyści `dziennikWpisy` — odśwież przy powrocie na oś. */
  useEffect(() => {
    if (widok !== "kr") return;
    const kP = widokPulpitDlaKr != null ? String(widokPulpitDlaKr).trim() : "";
    if (!kP) return;
    const pulpitNaWierzchu =
      widokKmDlaKr == null &&
      widokLogDlaKr == null &&
      widokPwDlaKr == null &&
      widokInfoDlaKr == null;
    if (!pulpitNaWierzchu) return;
    void fetchDziennikForKr(kP);
  }, [
    widok,
    widokPulpitDlaKr,
    widokKmDlaKr,
    widokLogDlaKr,
    widokPwDlaKr,
    widokInfoDlaKr,
    wybranyKrKlucz,
  ]);

  const etapyWedlugKr = useMemo(() => {
    const mapa = new Map();
    for (const e of etapy) {
      if (!mapa.has(e.kr)) mapa.set(e.kr, []);
      mapa.get(e.kr).push(e);
    }
    return mapa;
  }, [etapy]);

  const rezerwacjaMapKalendarz = useMemo(() => {
    const m = new Map();
    for (const r of rezerwacjeList) {
      const dzien = dataDoInputa(r.data_dnia);
      m.set(`${r.samochod_id}|${dzien}`, r);
    }
    return m;
  }, [rezerwacjeList]);

  const samochodyWymagajaceNaprawyLista = useMemo(
    () => samochodyList.filter((car) => samochodWymagaNaprawy(car)),
    [samochodyList],
  );

  /** Mapa etap_id → wiersze FS — wspólna dla pulpitu, karty KR i tabeli etapów (przy aktualnym `krKodDoPobrania…`). */
  const fakturySprzedazMapaPoEtapId = useMemo(() => {
    const m = new Map();
    for (const f of krFakturySprzedazList) {
      const id = f.etap_id;
      if (id == null) continue;
      if (!m.has(id)) m.set(id, []);
      m.get(id).push(f);
    }
    return m;
  }, [krFakturySprzedazList]);

  /** Pulpit — INV sprzedaż: FS wg etapu (+ data skrótowa); PW = koszt/odbiór, nie mylić z FS. */
  const pulpitInvWiersze = useMemo(() => {
    const k = widokPulpitDlaKr != null ? String(widokPulpitDlaKr).trim() : "";
    if (!k) return { etapy: [], pw: [] };
    const listaKm = etapy.filter((e) => String(e.kr).trim() === k);
    const etapyOut = listaKm.map((km) => {
      const fList = fakturySprzedazMapaPoEtapId.get(km.id) ?? [];
      const agg = fakturySprzedazAgregatDlaEtapu(fList);
      return {
        key: `etap-${km.id}`,
        zrodlo: "ETAP",
        opis: tekstTrim(km.etap) || `Etap #${km.id}`,
        zafakturowane: agg.zafakturowane,
        protokol: agg.protokol,
        dataFs: agg.dataPokaz,
      };
    });
    const pwOut = krZleceniaPwList.map((z) => ({
      key: `pw-${z.id}`,
      zrodlo: "PW",
      opis:
        [z.podwykonawca?.nazwa_firmy, z.numer_zlecenia].filter(Boolean).join(" · ") || `Zlecenie #${z.id}`,
      zafakturowane: null,
      protokol: z.czy_odebrane === true ? true : z.czy_odebrane === false ? false : null,
      dataFs: "",
    }));
    return { etapy: etapyOut, pw: pwOut };
  }, [widokPulpitDlaKr, etapy, fakturySprzedazMapaPoEtapId, krZleceniaPwList]);

  const wybranyRekordKr = useMemo(() => {
    if (wybranyKrKlucz == null || String(wybranyKrKlucz).trim() === "") return null;
    const k = String(wybranyKrKlucz).trim();
    return krList.find((row) => String(row.kr) === k) ?? null;
  }, [krList, wybranyKrKlucz]);

  const pracownicyPosortowani = useMemo(
    () =>
      [...pracownicy].sort((a, b) =>
        String(a.imie_nazwisko ?? "").localeCompare(String(b.imie_nazwisko ?? ""), "pl", {
          sensitivity: "base",
          numeric: true,
        })
      ),
    [pracownicy]
  );

  const mapaProwadzacychId = useMemo(() => mapaNrPracownika(pracownicy), [pracownicy]);

  const { pracownikSesja: pracownikPowiazanyZSesja, pracownikWidokEfektywny, czyAdminAktywny } =
    useMemo(
      () => obliczPracownikWidokuDlaSesji(pracownicy, session, adminPodgladPracownikNr),
      [pracownicy, session, adminPodgladPracownikNr],
    );

  const czyWidziNaprawyFloty = useMemo(
    () => pracownikWidziNaprawyFloty(pracownikWidokEfektywny),
    [pracownikWidokEfektywny],
  );

  const podgladJakoInny = useMemo(() => {
    if (!czyAdminAktywny || !pracownikPowiazanyZSesja || !pracownikWidokEfektywny) return false;
    return (
      String(pracownikWidokEfektywny.nr ?? "").trim() !== String(pracownikPowiazanyZSesja.nr ?? "").trim()
    );
  }, [czyAdminAktywny, pracownikPowiazanyZSesja, pracownikWidokEfektywny]);

  useEffect(() => {
    if (!pracownikPowiazanyZSesja || czyAdminAktywny || !adminPodgladPracownikNr) return;
    setAdminPodgladPracownikNr("");
    try {
      localStorage.removeItem(STORAGE_ADMIN_PODGLAD_NR);
    } catch {
      /* ignore */
    }
  }, [pracownikPowiazanyZSesja, czyAdminAktywny, adminPodgladPracownikNr]);

  useEffect(() => {
    if (!czyAdminAktywny) return;
    try {
      const t = adminPodgladPracownikNr.trim();
      if (t) localStorage.setItem(STORAGE_ADMIN_PODGLAD_NR, t);
      else localStorage.removeItem(STORAGE_ADMIN_PODGLAD_NR);
    } catch {
      /* ignore */
    }
  }, [czyAdminAktywny, adminPodgladPracownikNr]);

  const dashboardMojeZadania = useMemo(() => {
    const nr = pracownikWidokEfektywny?.nr != null ? String(pracownikWidokEfektywny.nr).trim() : "";
    if (!nr) return [];
    return zadaniaList.filter((z) => {
      const o = String(z.osoba_odpowiedzialna ?? "").trim();
      const zl = String(z.osoba_zlecajaca ?? "").trim();
      return o === nr || zl === nr;
    });
  }, [zadaniaList, pracownikWidokEfektywny?.nr]);

  const dashboardMojeKr = useMemo(() => {
    const nr = pracownikWidokEfektywny?.nr != null ? String(pracownikWidokEfektywny.nr).trim() : "";
    if (!nr) return [];
    return krList.filter((k) => String(k.osoba_prowadzaca ?? "").trim() === nr);
  }, [krList, pracownikWidokEfektywny?.nr]);

  const dashboardMojeEtapy = useMemo(() => {
    const nr = pracownikWidokEfektywny?.nr != null ? String(pracownikWidokEfektywny.nr).trim() : "";
    if (!nr) return [];
    return etapy.filter((e) => String(e.osoba_odpowiedzialna ?? "").trim() === nr);
  }, [etapy, pracownikWidokEfektywny?.nr]);

  useEffect(() => {
    if (widok !== "moje_dokumenty") return;
    const p = pracownikWidokEfektywny;
    const nr = p?.nr != null ? String(p.nr).trim() : "";
    const arkuszBase = p?.link_google_arkusz != null ? String(p.link_google_arkusz) : "";
    if (!nr) {
      setMojeDokumentyList([]);
      setMojeDokumentyFetchError(null);
      setMojeDokEdycja({ arkusz: arkuszBase });
      return;
    }
    let cancelled = false;
    void (async () => {
      setMojeDokumentyFetchError(null);
      const { data, error } = await supabase.from("pracownik_dokument").select("*").eq("pracownik_nr", nr);
      if (cancelled) return;
      if (error) {
        setMojeDokumentyFetchError(error.message);
        setMojeDokumentyList([]);
        return;
      }
      const list = data ?? [];
      setMojeDokumentyList(list);
      setMojeDokEdycja({ arkusz: arkuszBase });
    })();
    return () => {
      cancelled = true;
    };
  }, [widok, pracownikWidokEfektywny?.nr, pracownikWidokEfektywny?.link_google_arkusz]);

  useEffect(() => {
    setMojeDokKategorieRozwiniete(new Set());
    setMojeDokFiltrDataOd("");
    setMojeDokFiltrDataDo("");
  }, [widok, pracownikWidokEfektywny?.nr]);

  const podwykonawcyPosortowani = useMemo(
    () =>
      [...podwykonawcyList].sort((a, b) =>
        String(a.nazwa_firmy ?? "").localeCompare(String(b.nazwa_firmy ?? ""), "pl", {
          sensitivity: "base",
          numeric: true,
        })
      ),
    [podwykonawcyList]
  );

  function openEditKr(item) {
    setEditingKrKey(item.kr);
    void fetchPracownicy();
    setEditForm({
      kr: item.kr != null && item.kr !== "" ? String(item.kr) : "",
      nazwa_obiektu: item.nazwa_obiektu ?? "",
      rodzaj_pracy: item.rodzaj_pracy != null ? String(item.rodzaj_pracy) : "",
      dzial: item.dzial ?? "",
      osoba_prowadzaca:
        item.osoba_prowadzaca != null && item.osoba_prowadzaca !== ""
          ? String(item.osoba_prowadzaca)
          : "",
      data_rozpoczecia: dataDoInputa(item.data_rozpoczecia),
      status: item.status ?? "",
      zleceniodawca: item.zleceniodawca != null ? String(item.zleceniodawca) : "",
      osoba_odpowiedzialna_zleceniodawcy:
        item.osoba_odpowiedzialna_zleceniodawcy != null
          ? String(item.osoba_odpowiedzialna_zleceniodawcy)
          : "",
      link_umowy: item.link_umowy != null ? String(item.link_umowy) : "",
      okres_projektu_od: dataDoInputa(item.okres_projektu_od),
      okres_projektu_do: dataDoInputa(item.okres_projektu_do),
    });
  }

  /** Z tabeli — szczegóły KR z od razu włączoną edycją wszystkich pól tabeli `kr`. */
  function otworzEdycjeKrZTabeli(item) {
    setWybranyKrKlucz(String(item.kr).trim());
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    void fetchEtapy();
    void fetchPracownicy();
    openEditKr(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Etapy dla wybranego KR — osobny widok z listą i formularzem. `opts.hub` zachowuje wybór projektu w karcie KR. */
  function otworzKmDlaKr(item, opts) {
    const hub = opts?.hub === true;
    const k = String(item.kr).trim();
    setWidokKmDlaKr(k);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    if (!hub) {
      setDziennikWpisy([]);
      setDziennikFetchError(null);
      setLogEdycjaId(null);
      setLogForm(logPustyForm());
      setWybranyKrKlucz(null);
    } else {
      setWybranyKrKlucz(k);
    }
    setEditingKrKey(null);
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    void fetchEtapy();
    void fetchPracownicy();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function powrotZKmDoListy() {
    setWidokKmDlaKr(null);
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function otworzLogDlaKr(item, opts) {
    const hub = opts?.hub === true;
    const k = String(item.kr).trim();
    const edytujRow = opts?.edytujRow ?? null;
    setWidokLogDlaKr(k);
    setWidokKmDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    if (!hub) setWybranyKrKlucz(null);
    else setWybranyKrKlucz(k);
    setEditingKrKey(null);
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    if (edytujRow != null && edytujRow.id != null && String(edytujRow.id).trim() !== "") {
      setLogEdycjaId(String(edytujRow.id));
      setLogForm(logWierszDoFormu(edytujRow));
    } else {
      setLogEdycjaId(null);
      setLogForm(logPustyForm());
    }
    setDziennikFetchError(null);
    void fetchPracownicy();
    void fetchDziennikForKr(k);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function powrotZLogDoListy() {
    const kHub = wybranyKrKlucz != null ? String(wybranyKrKlucz).trim() : "";
    setWidokLogDlaKr(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    if (kHub) {
      setKrProjektSekcja("przeglad");
      void fetchDziennikForKr(kHub);
    } else {
      setDziennikWpisy([]);
      setDziennikFetchError(null);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function wczytajLogDoEdycji(row) {
    const rid = row?.id;
    if (rid == null || String(rid).trim() === "") {
      alert(
        "Brak identyfikatora wpisu w bazie — nie można otworzyć edycji. Odśwież listę (w LOG jest ponowne pobranie dziennika)."
      );
      return;
    }
    setLogEdycjaId(String(rid));
    setLogForm(logWierszDoFormu(row));
  }

  function anulujEdycjeLog() {
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
  }

  function otworzInfoDlaKr(item) {
    const k = String(item.kr).trim();
    setWidokInfoDlaKr(k);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokPwDlaKr(null);
    setWybranyKrKlucz(null);
    setEditingKrKey(null);
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setDziennikFetchError(null);
    void fetchKR();
    void fetchEtapy();
    void fetchPracownicy();
    void fetchDziennikForKr(k);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function powrotZInfoDoListy() {
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    const kHub = widokPulpitDlaKr != null ? String(widokPulpitDlaKr).trim() : "";
    if (kHub) void fetchDziennikForKr(kHub);
    else {
      setDziennikWpisy([]);
      setDziennikFetchError(null);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Mapowanie podstrony pulpitu → zakładka `krProjektSekcja` (wspólne UI z kartą projektu). */
  function pulpitPodstronaDoKrSekcji(pod) {
    const m = {
      przeglad: "przeglad",
      os: "przeglad",
      faktury: "faktury",
      koszty: "koszty",
      podwykonawcy: "podwykonawcy",
      zlecenia: "zlecenia",
      dziennik: "zgloszenia",
      karta: "przeglad",
      umowa: "umowa",
      zadania: "zadania_kr",
      informacja: "ryzyka",
      terminy: "terminy",
      zespol: "zespol",
      rozszerzenia: "rozszerzenia",
    };
    return m[pod] ?? "przeglad";
  }

  function pulpitZastosujMapePodstrony(pod, k, opts) {
    const kr = String(k).trim();
    setPulpitPodstrona(pod);
    setKrProjektSekcja(pulpitPodstronaDoKrSekcji(pod));
    void fetchDziennikForKr(kr);
    if (pod === "faktury") void fetchKrFakturyDoZaplatyForKr(kr);
    if (pod === "koszty") {
      void fetchCzasPracyWpisyDlaKr(kr);
      void fetchPracownicy();
    }
    void fetchRoboczogodzinyPulpitDlaKr(kr);
    if (pod === "podwykonawcy" || pod === "zlecenia") {
      void fetchKrZleceniaPwForKr(kr);
      void fetchPodwykonawcy();
    }
    if (pod === "umowa" || pod === "informacja") void fetchKrZleceniaPwForKr(kr);
    if (pod === "zadania") {
      void fetchZadania();
      void fetchPracownicy();
      if (opts?.otworzZadanie != null && opts.otworzZadanie.id != null) {
        setZadanieEdycjaId(opts.otworzZadanie.id);
        setZadanieForm(zadanieWierszDoFormu(opts.otworzZadanie));
      } else {
        setZadanieEdycjaId(null);
        setZadanieForm({ ...zadaniePustyForm(), kr: kr });
      }
    }
  }

  function pulpitNavUstawPodstrone(pod, item, opts) {
    const k = String(item.kr).trim();
    const kompakt = wybranyKrKlucz == null || String(wybranyKrKlucz).trim() !== k;
    const tylkoPulpit =
      pod === "przeglad" || pod === "os" || pod === "karta";
    if (!tylkoPulpit || !kompakt) {
      if (!tylkoPulpit) setWybranyKrKlucz(k);
    }
    pulpitZastosujMapePodstrony(pod, k, opts);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Pulpit — jedna oś czasu: ETAP, PW, LOG + skrót kontaktów (przycisk przy wierszu KR). */
  function otworzPulpitDlaKr(item, opts) {
    const hub = opts?.hub === true;
    const k = String(item.kr).trim();
    const podWejscie = opts?.podstrona ?? "przeglad";
    setWidokPulpitDlaKr(k);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    if (!hub) setWybranyKrKlucz(null);
    else setWybranyKrKlucz(k);
    setEditingKrKey(null);
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setDziennikFetchError(null);
    setPulpitRoboczogodziny({ suma: null, err: null, loading: true });
    void fetchKR();
    void fetchEtapy();
    void fetchPracownicy();
    void fetchDziennikForKr(k);
    void fetchPodwykonawcy();
    void fetchZadania();
    pulpitZastosujMapePodstrony(podWejscie, k, opts);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function powrotZPulpituDoListy() {
    const kHub = wybranyKrKlucz != null ? String(wybranyKrKlucz).trim() : "";
    setWidokPulpitDlaKr(null);
    setPulpitRoboczogodziny({ suma: null, err: null, loading: false });
    setPulpitPodstrona("przeglad");
    setPulpitSortDaty("asc");
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    if (kHub) {
      setKrProjektSekcja("przeglad");
      void fetchDziennikForKr(kHub);
      void fetchKrZleceniaPwForKr(kHub);
    } else {
      setDziennikWpisy([]);
      setDziennikFetchError(null);
      setKrZleceniaPwList([]);
      setKrZleceniaPwFetchError(null);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Zlecenia PW dla wybranego KR — osobny widok z listy (przycisk PW obok KR). */
  function otworzPwDlaKr(item, opts) {
    const hub = opts?.hub === true;
    const k = String(item.kr).trim();
    setWidokPwDlaKr(k);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPulpitDlaKr(null);
    if (!hub) setWybranyKrKlucz(null);
    else setWybranyKrKlucz(k);
    setEditingKrKey(null);
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setDziennikFetchError(null);
    setKrZleceniePwEdycjaId(null);
    setKrZleceniePwKontekstKr(null);
    setKrZleceniePwForm(krZleceniePwPustyForm());
    void fetchPodwykonawcy();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function powrotZPwDoListy() {
    setWidokPwDlaKr(null);
    setKrZleceniePwEdycjaId(null);
    setKrZleceniePwKontekstKr(null);
    setKrZleceniePwForm(krZleceniePwPustyForm());
    setKrProjektSekcja("przeglad");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Wybór projektu z prawego panelu — karta KR bez pełnoekranowego „wyjścia” z contextu. */
  function wybierzKrWPanelu(item) {
    const k = String(item.kr).trim();
    setWybranyKrKlucz(k);
    setWidok("kr");
    setKrProjektSekcja("przeglad");
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    setWidokInfoDlaKr(null);
    setEditingKrKey(null);
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    void fetchDziennikForKr(k);
    void fetchKrZleceniaPwForKr(k);
    void fetchEtapy();
    void fetchPracownicy();
    void fetchPodwykonawcy();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Panel główny → karta KR, zakładka „Faktury kosztowe” (zgłoszenia do opłacenia). */
  function otworzKrZakladkaFakturyKosztowe(krKod) {
    const k = String(krKod ?? "").trim();
    if (!k) return;
    const rekord = krList.find((r) => String(r.kr).trim() === k);
    setWidok("kr");
    if (rekord) {
      przejdzDoSekcjiKr(rekord, "faktury");
    } else {
      setWybranyKrKlucz(k);
      setKrProjektSekcja("faktury");
      setWidokKmDlaKr(null);
      setWidokLogDlaKr(null);
      setWidokPwDlaKr(null);
      setWidokPulpitDlaKr(null);
      setWidokInfoDlaKr(null);
      void fetchDziennikForKr(k);
      void fetchKrZleceniaPwForKr(k);
      void fetchKrFakturyDoZaplatyForKr(k);
      void fetchPracownicy();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Nawigacja zakładkami karty projektu — łączy stany podwidoków z istniejącą logiką. */
  function przejdzDoSekcjiKr(item, sekcjaId, opts) {
    if (!item) return;
    const k = String(item.kr).trim();
    const naPulpicie = widokPulpitDlaKr != null && String(widokPulpitDlaKr).trim() === k;

    if (naPulpicie && sekcjaId === "etapy") {
      setKrProjektSekcja(sekcjaId);
      otworzKmDlaKr(item, { hub: true });
      if (opts?.otworzKm != null && opts.otworzKm.id != null) {
        const kmRow = opts.otworzKm;
        window.setTimeout(() => wczytajKmDoEdycji(kmRow), 0);
      }
      return;
    }

    if (naPulpicie) {
      const pillDoPod = {
        przeglad: "przeglad",
        os: "os",
        faktury: "faktury",
        koszty: "koszty",
        zadania_kr: "zadania",
        zlecenia: "zlecenia",
        podwykonawcy: "podwykonawcy",
        zgloszenia: "dziennik",
        umowa: "umowa",
        terminy: "terminy",
        ryzyka: "informacja",
        zespol: "zespol",
        rozszerzenia: "rozszerzenia",
      };
      const pod = pillDoPod[sekcjaId];
      if (pod) {
        pulpitNavUstawPodstrone(pod, item, opts);
        return;
      }
    }

    setKrProjektSekcja(sekcjaId);
    if (sekcjaId === "przeglad") {
      setWidokKmDlaKr(null);
      setWidokLogDlaKr(null);
      setWidokPwDlaKr(null);
      setWidokPulpitDlaKr(null);
      void fetchDziennikForKr(String(item.kr).trim());
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (sekcjaId === "etapy") {
      otworzKmDlaKr(item, { hub: true });
      if (opts?.otworzKm != null && opts.otworzKm.id != null) {
        const kmRow = opts.otworzKm;
        window.setTimeout(() => wczytajKmDoEdycji(kmRow), 0);
      }
      return;
    }
    if (sekcjaId === "zgloszenia") {
      setWybranyKrKlucz(k);
      setWidokKmDlaKr(null);
      setWidokLogDlaKr(null);
      setWidokPwDlaKr(null);
      setWidokPulpitDlaKr(null);
      setWidokInfoDlaKr(null);
      void fetchDziennikForKr(k);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (sekcjaId === "zlecenia" || sekcjaId === "podwykonawcy") {
      setWybranyKrKlucz(k);
      setWidokKmDlaKr(null);
      setWidokLogDlaKr(null);
      setWidokPwDlaKr(null);
      setWidokPulpitDlaKr(null);
      setWidokInfoDlaKr(null);
      void fetchKrZleceniaPwForKr(k);
      void fetchPodwykonawcy();
      void fetchDziennikForKr(k);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (sekcjaId === "os") {
      otworzPulpitDlaKr(item, { hub: true, podstrona: "os" });
      return;
    }
    /** Sekcje tylko w karcie hub (umowa, koszty, terminy…) — jak zgłoszenia: zawsze TRZYMAJ wybrany KR i wyłącz INFO. */
    const sekcjeTylkoKarta = new Set([
      "faktury",
      "koszty",
      "zadania_kr",
      "umowa",
      "terminy",
      "ryzyka",
      "zespol",
      "rozszerzenia",
    ]);
    if (sekcjeTylkoKarta.has(sekcjaId)) {
      setWybranyKrKlucz(k);
      setWidokKmDlaKr(null);
      setWidokLogDlaKr(null);
      setWidokPwDlaKr(null);
      setWidokPulpitDlaKr(null);
      setWidokInfoDlaKr(null);
      void fetchDziennikForKr(k);
      void fetchKrZleceniaPwForKr(k);
      if (sekcjaId === "faktury") void fetchKrFakturyDoZaplatyForKr(k);
      if (sekcjaId === "koszty") {
        void fetchCzasPracyWpisyDlaKr(k);
        void fetchPracownicy();
      }
      if (sekcjaId === "zadania_kr") {
        void fetchZadania();
        void fetchPracownicy();
        if (opts?.otworzZadanie != null && opts.otworzZadanie.id != null) {
          setZadanieEdycjaId(opts.otworzZadanie.id);
          setZadanieForm(zadanieWierszDoFormu(opts.otworzZadanie));
        } else {
          setZadanieEdycjaId(null);
          setZadanieForm({ ...zadaniePustyForm(), kr: k });
        }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokPwDlaKr(null);
    setWidokPulpitDlaKr(null);
    void fetchDziennikForKr(String(item.kr).trim());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Klik w alert operacyjny → odpowiednia sekcja karty KR (lub moduł Zadania). */
  function przejdzZAlertuOperacyjnego(target) {
    if (target == null || target.kind == null) return;
    setEditingKrKey(null);

    if (target.kind === "zadanie") {
      const row = target.row;
      const krZ = row?.kr != null && String(row.kr).trim() !== "" ? String(row.kr).trim() : "";
      if (krZ) {
        setWidok("kr");
        const r2 = krList.find((x) => String(x.kr).trim() === krZ);
        if (r2) przejdzDoSekcjiKr(r2, "zadania_kr", { otworzZadanie: row });
        else alert("Nie znaleziono projektu w liście KR — odśwież dane.");
      } else {
        przejdzDoZadania();
        window.setTimeout(() => {
          if (row?.id != null) wczytajZadanieDoEdycji(row);
        }, 0);
      }
      return;
    }

    setWidok("kr");
    if (target.kind === "kr_status") {
      const r = krList.find((x) => String(x.kr).trim() === String(target.kr).trim());
      if (r) przejdzDoSekcjiKr(r, "ryzyka");
      else alert("Nie znaleziono projektu w liście KR — odśwież dane.");
      return;
    }
    if (target.kind === "km_etap") {
      const r = krList.find((x) => String(x.kr).trim() === String(target.kr).trim());
      if (r) przejdzDoSekcjiKr(r, "etapy", { otworzKm: target.kmRow });
      else alert("Nie znaleziono projektu w liście KR — odśwież dane.");
      return;
    }
    if (target.kind === "pw_zlecenie") {
      const r = krList.find((x) => String(x.kr).trim() === String(target.kr).trim());
      if (r) przejdzDoSekcjiKr(r, "zlecenia");
      else alert("Nie znaleziono projektu w liście KR — odśwież dane.");
    }
  }

  async function zapiszLogWpis(e) {
    e.preventDefault();
    if (!widokLogDlaKr) return;

    const typ = String(logForm.typ_zdarzenia ?? "").trim();
    if (!typ) {
      alert('Pole „Typ zdarzenia” jest wymagane.');
      return;
    }

    const zInputu = String(logForm.data_zdarzenia ?? "").trim();
    const dataZdarzenia = zInputu ? dataDoInputa(zInputu) : dzisiajDataYYYYMMDD();
    if (zInputu && !/^\d{4}-\d{2}-\d{2}$/.test(dataZdarzenia)) {
      alert("Nieprawidłowy format daty zdarzenia.");
      return;
    }

    const statusWart = String(logForm.status_zdarzenia ?? "").trim();
    const statusDoBazy = LOG_STATUS_ZDARZENIA_W_BAZIE.includes(statusWart) ? statusWart : null;
    if (statusDoBazy === null) {
      alert(
        "Nieprawidłowy status zdarzenia. Wybierz: w trakcie, ukończone lub oczekuje."
      );
      return;
    }

    const payloadWspolne = {
      typ_zdarzenia: typ,
      opis: String(logForm.opis ?? "").trim() || null,
      data_zdarzenia: dataZdarzenia,
      osoba_zglaszajaca: String(logForm.osoba_zglaszajaca ?? "").trim() || null,
      wymagane_dzialanie: String(logForm.wymagane_dzialanie ?? "").trim() || null,
      osoba_odpowiedzialna_za_zadanie:
        String(logForm.osoba_odpowiedzialna_za_zadanie ?? "").trim() || null,
      status_zdarzenia: statusDoBazy,
    };
    const payloadInsert = { kr: widokLogDlaKr, ...payloadWspolne };

    let error;
    if (logEdycjaId != null) {
      const idStr = String(logEdycjaId).trim();
      const res = await supabase
        .from("dziennik_zdarzen")
        .update(payloadWspolne)
        .eq("id", idStr)
        .select("id");
      error = res.error;
      if (
        !error &&
        (!Array.isArray(res.data) || res.data.length === 0)
      ) {
        error = {
          message:
            "Aktualizacja nie zmieniła żadnego wiersza (zły identyfikator, wpis usunięty albo brak uprawnień UPDATE/SELECT dla dziennik_zdarzen).",
        };
      }
    } else {
      const res = await supabase
        .from("dziennik_zdarzen")
        .insert([payloadInsert])
        .select("id");
      error = res.error;
      if (
        !error &&
        (!Array.isArray(res.data) || res.data.length === 0)
      ) {
        error = {
          message:
            "INSERT nie zwrócił wiersza — sprawdź uprawnienia INSERT i SELECT (RETURNING) dla dziennik_zdarzen.",
        };
      }
    }

    if (error) {
      console.error(error);
      const hintRls =
        session?.user != null
          ? "\n\nJesteś zalogowany — PostgREST używa roli authenticated (nie anon). Uruchom w SQL Editor plik g4-app/supabase/rls-policies-authenticated.sql (sekcja dziennik_zdarzen), jeśli jeszcze tego nie zrobiłeś."
          : "\n\nSprawdź polityki SELECT/INSERT/UPDATE dla dziennik_zdarzen w g4-app/supabase/rls-policies-anon.sql.";
      alert(
        "Zapis do dziennika: " +
          error.message +
          (String(error.message).includes("column") || String(error.message).includes("schema")
            ? "\n\nUruchom w SQL Editor plik g4-app/supabase/dziennik-zdarzen-kolumny.sql."
            : "") +
          (String(error.message).toLowerCase().includes("check") ||
          String(error.message).toLowerCase().includes("constraint")
            ? "\n\nStatus musi być jedną z wartości: w trakcie, ukończone, oczekuje (CHECK w bazie)."
            : "") +
          hintRls
      );
      return;
    }

    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    await fetchDziennikForKr(widokLogDlaKr);
  }

  function wczytajKmDoEdycji(row) {
    setKmEdycjaId(row.id);
    setKmForm(kmWierszDoFormu(row));
  }

  function anulujEdycjeKm() {
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
  }

  async function zapiszKm(e) {
    e.preventDefault();
    if (!widokKmDlaKr) return;

    const etapTrim = String(kmForm.etap ?? "").trim();
    if (!etapTrim) {
      alert("Pole „Etap” jest wymagane przy zapisie wiersza etapu.");
      return;
    }

    const statusWart = String(kmForm.status ?? "").trim();
    const statusDoBazy =
      statusWart === "" ? null : ETAP_STATUS_W_BAZIE.includes(statusWart) ? statusWart : null;
    if (statusWart !== "" && statusDoBazy === null) {
      alert("Nieprawidłowy status etapu. Wybierz jedną z opcji listy lub „— brak —”.");
      return;
    }

    const offsetStr = String(kmForm.offset_miesiecy ?? "").trim();
    if (offsetStr !== "" && offsetMiesiecyDoBazy(kmForm.offset_miesiecy) === null) {
      alert('Offset (miesiące) musi być pusty albo liczbą całkowitą ≥ 0.');
      return;
    }

    const typOdnWart = String(kmForm.typ_odniesienia ?? "").trim();
    const typOdnDoBazy =
      typOdnWart === ""
        ? null
        : ETAP_TYP_ODNIESIENIA_W_BAZIE.includes(typOdnWart)
          ? typOdnWart
          : null;
    if (typOdnWart !== "" && typOdnDoBazy === null) {
      alert(
        'Typ odniesienia: wybierz „— brak —”, Linia lub Zlecenie (wartości zgodne z bazą).'
      );
      return;
    }

    const payload = {
      kr: widokKmDlaKr,
      typ_odniesienia: typOdnDoBazy,
      data_odniesienia: String(kmForm.data_odniesienia ?? "").trim() || null,
      offset_miesiecy: offsetMiesiecyDoBazy(kmForm.offset_miesiecy),
      data_planowana: String(kmForm.data_planowana ?? "").trim() || null,
      etap: etapTrim,
      status: statusDoBazy,
      osoba_odpowiedzialna: String(kmForm.osoba_odpowiedzialna ?? "").trim() || null,
      uwagi: String(kmForm.uwagi ?? "").trim() || null,
      osiagniete: takNieDoBool(kmForm.osiagniete),
      zagrozenie: takNieDoBool(kmForm.zagrozenie),
      zagrozenie_opis: String(kmForm.zagrozenie_opis ?? "").trim() || null,
    };

    if (kmEdycjaId != null) {
      const { error } = await supabase
        .from("etapy")
        .update(payload)
        .eq("id", kmEdycjaId)
        .select("id");

      if (error) {
        console.error(error);
        alert(
          "Zapis etapu: " +
            error.message +
            (String(error.message).includes("column") || String(error.message).includes("schema")
              ? "\n\nUruchom w SQL Editor: kamienie-milowe-kolumny.sql, kamienie-milowe-odniesienie-offset.sql, kamienie-milowe-typ-odniesienia.sql (brakujące kolumny)."
              : "") +
            (String(error.message).toLowerCase().includes("check") ||
            String(error.message).toLowerCase().includes("constraint")
              ? "\n\nStatus / typ odniesienia — zob. kamienie-milowe-status-check.sql i kamienie-milowe-typ-odniesienia.sql."
              : "") +
            "\n\nSprawdź też polityki INSERT/UPDATE w rls-policies-anon.sql."
        );
        return;
      }
    } else {
      const { error } = await supabase.from("etapy").insert([payload]).select("id");

      if (error) {
        console.error(error);
        alert(
          "Dodawanie etapu: " +
            error.message +
            (String(error.message).includes("column") || String(error.message).includes("schema")
              ? "\n\nUruchom w SQL Editor: kamienie-milowe-kolumny.sql, kamienie-milowe-odniesienie-offset.sql, kamienie-milowe-typ-odniesienia.sql."
              : "") +
            (String(error.message).toLowerCase().includes("check") ||
            String(error.message).toLowerCase().includes("constraint")
              ? "\n\nZob. kamienie-milowe-status-check.sql i kamienie-milowe-typ-odniesienia.sql."
              : "") +
            "\n\nSprawdź też polityki INSERT w rls-policies-anon.sql."
        );
        return;
      }
    }

    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    await fetchEtapy();
  }

  async function usunKm(id) {
    if (!window.confirm("Usunąć ten wiersz etapu?")) return;
    const { error } = await supabase.from("etapy").delete().eq("id", id);
    if (error) {
      console.error(error);
      const msg = String(error.message);
      const fkFaktury =
        msg.toLowerCase().includes("foreign key") && msg.toLowerCase().includes("faktury");
      alert(
        "Usuwanie: " +
          msg +
          (fkFaktury
            ? "\n\nDo tego etapu są przypisane faktury sprzedażowe (tabela faktury, etap_id). Domyślnie baza nie pozwala usunąć wiersza etapu, dopóki coś na niego wskazuje.\n\nRozwiązanie: w SQL Editor uruchom plik g4-app/supabase/faktury-etap-on-delete.sql (ustalenie co się dzieje z fakturami przy usuwaniu etapu), albo w panelu usuń lub zmień powiązane faktury. (Koszty — inna przestrzeń / tabele — patrz zakładka Faktury kosztowe — brudnopis.)"
            : "\n\nJeśli to nie jest powiązanie z inną tabelą — sprawdź politykę DELETE w rls-policies-anon.sql.")
      );
      return;
    }
    if (kmEdycjaId === id) {
      anulujEdycjeKm();
    }
    await fetchEtapy();
  }

  const listaKmDlaWidoku = useMemo(() => {
    if (!widokKmDlaKr) return [];
    return etapy
      .filter((row) => String(row.kr) === String(widokKmDlaKr))
      .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  }, [etapy, widokKmDlaKr]);

  const listaKmDlaInfo = useMemo(() => {
    if (!widokInfoDlaKr) return [];
    return etapy
      .filter((row) => String(row.kr) === String(widokInfoDlaKr))
      .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  }, [etapy, widokInfoDlaKr]);

  const rekordKrInfo = useMemo(() => {
    if (widokInfoDlaKr == null || String(widokInfoDlaKr).trim() === "") return null;
    const k = String(widokInfoDlaKr).trim();
    return krList.find((row) => String(row.kr) === k) ?? null;
  }, [krList, widokInfoDlaKr]);

  const rekordKrPulpit = useMemo(() => {
    if (widokPulpitDlaKr == null || String(widokPulpitDlaKr).trim() === "") return null;
    const k = String(widokPulpitDlaKr).trim();
    return krList.find((row) => String(row.kr) === k) ?? null;
  }, [krList, widokPulpitDlaKr]);

  function pulpitEdytujKarte(karta) {
    if (!rekordKrPulpit) return;
    const hub =
      wybranyKrKlucz != null &&
      String(wybranyKrKlucz).trim() === String(rekordKrPulpit.kr).trim();
    if (karta.kind === "kr_start") {
      otworzEdycjeKrZTabeli(rekordKrPulpit);
      return;
    }
    if (karta.kind === "etap") {
      const row = etapy.find((e) => e.id === karta.edytujId);
      if (!row) {
        alert("Nie znaleziono wiersza etapu — odśwież pulpit.");
        return;
      }
      otworzKmDlaKr(rekordKrPulpit, hub ? { hub: true } : undefined);
      wczytajKmDoEdycji(row);
      return;
    }
    if (karta.kind === "pw") {
      const z = krZleceniaPwList.find((x) => x.id === karta.edytujId);
      if (!z) {
        alert("Nie znaleziono zlecenia PW — odśwież pulpit.");
        return;
      }
      otworzPwDlaKr(rekordKrPulpit, hub ? { hub: true } : undefined);
      wczytajKrZleceniePwDoEdycji(z);
      return;
    }
    if (karta.kind === "log") {
      const row = dziennikWpisy.find((r) => String(r.id) === String(karta.edytujId));
      if (!row) {
        alert("Nie znaleziono wpisu dziennika — odśwież pulpit.");
        return;
      }
      otworzLogDlaKr(rekordKrPulpit, { edytujRow: row, ...(hub ? { hub: true } : {}) });
    }
  }

  /** Telefony / e-maile ze zleceń PW na pulpicie (szybki podgląd). */
  const pulpitSkrotKontaktow = useMemo(() => {
    if (widokPulpitDlaKr == null) return { telefony: [], emaile: [] };
    const tel = new Set();
    const em = new Set();
    for (const z of krZleceniaPwList) {
      const t = z.osoba_faktury_telefon != null ? String(z.osoba_faktury_telefon).trim() : "";
      if (t) tel.add(t);
      const e = z.osoba_faktury_email != null ? String(z.osoba_faktury_email).trim() : "";
      if (e) em.add(e);
    }
    return { telefony: [...tel], emaile: [...em] };
  }, [widokPulpitDlaKr, krZleceniaPwList]);

  /**
   * Oznaczenie wiersza na liście KR (status „oczekuje na …” albo problematyczny etap).
   * Pełny podział uwag (LOG / PW) jest na pulpicie projektu.
   */
  const kodyKrZWyroznieniemUwagi = useMemo(() => {
    const set = new Set();
    const dziś = dzisiajDataYYYYMMDD();
    for (const row of krList) {
      if (pulpitKrRekordWymagaUwagi(row)) set.add(String(row.kr).trim());
    }
    for (const e of etapy) {
      if (pulpitKmWymagaUwagi(e, dziś)) set.add(String(e.kr).trim());
    }
    return set;
  }, [krList, etapy]);

  const pulpitOśKarty = useMemo(() => {
    const k = widokPulpitDlaKr != null ? String(widokPulpitDlaKr).trim() : "";
    if (!k) return [];
    const dziś = dzisiajDataYYYYMMDD();
    const out = [];
    let tie = 0;
    const rekord = krList.find((row) => String(row.kr) === k) ?? null;

    const sortKeyStart = dataDoSortuYYYYMMDD(rekord?.data_rozpoczecia);
    if (rekord && sortKeyStart) {
      const dzialT = tekstTrim(rekord.dzial);
      const statusT = tekstTrim(rekord.status);
      const zlecT = tekstTrim(rekord.zleceniodawca);
      const zlKontaktT = tekstTrim(rekord.osoba_odpowiedzialna_zleceniodawcy);
      out.push({
        sortKey: sortKeyStart,
        tieBreak: tie++,
        kind: "kr_start",
        edytujId: null,
        title: "KR",
        subtitle: tekstTrim(rekord.nazwa_obiektu) || null,
        wymagaUwagi: pulpitKrRekordWymagaUwagi(rekord),
        bodyLines: [
          dzialT ? `Dział: ${dzialT}` : null,
          statusT ? `Status KR: ${statusT}` : null,
          podpisOsobyProwadzacej(rekord.osoba_prowadzaca, mapaProwadzacychId)
            ? `Osoba prowadząca: ${podpisOsobyProwadzacej(rekord.osoba_prowadzaca, mapaProwadzacychId)}`
            : null,
          zlecT ? `Zleceniodawca: ${zlecT}` : null,
          zlKontaktT ? `Kontakt ZL: ${zlKontaktT}` : null,
        ].filter(Boolean),
      });
    }

    const kmRows = etapy
      .filter((row) => String(row.kr) === k)
      .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
    for (const row of kmRows) {
      const sortKey =
        dataDoSortuYYYYMMDD(row.data_planowana) ||
        dataDoSortuYYYYMMDD(row.data_odniesienia) ||
        null;
      const et = row.etap != null ? String(row.etap) : "—";
      const osiagnT = tekstTrim(row.osiagniete);
      const uwagiT = tekstTrim(row.uwagi);
      const zagrozOpisT = tekstTrim(row.zagrozenie_opis);
      const lines = [
        tekstTrim(row.status) ? `Status etapu: ${tekstTrim(row.status)}` : null,
        row.data_planowana
          ? `Data planowana: ${dataPLZFormat(dataDoInputa(row.data_planowana))}`
          : null,
        row.data_odniesienia
          ? `Data odniesienia: ${dataPLZFormat(dataDoInputa(row.data_odniesienia))}`
          : null,
        tekstTrim(row.typ_odniesienia)
          ? `Typ odniesienia: ${kmEtykietaTypuOdniesienia(row.typ_odniesienia)}`
          : null,
        row.offset_miesiecy != null && row.offset_miesiecy !== ""
          ? `Offset: +${row.offset_miesiecy} mc`
          : null,
        osiagnT ? `Osiągnięte: ${osiagnT}` : null,
        uwagiT ? `Uwagi: ${uwagiT}` : null,
        row.zagrozenie === "tak" || row.zagrozenie === true
          ? `Zagrożenie: ${zagrozOpisT || "tak"}`
          : zagrozOpisT
            ? `Zagrożenie (opis): ${zagrozOpisT}`
            : null,
      ].filter(Boolean);
      out.push({
        sortKey,
        tieBreak: tie++,
        kind: "etap",
        edytujId: row.id,
        title: `ETAP · ${et}`,
        subtitle: null,
        wymagaUwagi: pulpitKmWymagaUwagi(row, dziś),
        bodyLines: lines,
      });
    }

    for (const z of krZleceniaPwList) {
      const firma =
        z.podwykonawca && typeof z.podwykonawca === "object" && !Array.isArray(z.podwykonawca)
          ? z.podwykonawca.nazwa_firmy
          : null;
      const pwFlag = [
        z.czy_sprawdzone === true ? "sprawdzone" : null,
        z.czy_odebrane === true ? "odebrane" : null,
      ]
        .filter(Boolean)
        .join(", ");
      const zakresT = tekstTrim(z.opis_zakresu);
      const lines = [
        tekstTrim(z.numer_zlecenia) ? `Nr zlecenia: ${tekstTrim(z.numer_zlecenia)}` : null,
        z.data_zlecenia ? `Data zlecenia: ${dataPLZFormat(dataDoInputa(z.data_zlecenia))}` : null,
        z.termin_zlecenia
          ? `Termin zlecenia (plan): ${dataPLZFormat(dataDoInputa(z.termin_zlecenia))}`
          : null,
        z.data_oddania ? `Data oddania (faktyczna): ${dataPLZFormat(dataDoInputa(z.data_oddania))}` : null,
        z.cena_netto != null && z.cena_netto !== ""
          ? `Cena netto: ${krZleceniePwKwotaEtykieta(z.cena_netto)}`
          : null,
        tekstTrim(z.status) ? `Status: ${tekstTrim(z.status)}` : null,
        pwFlag ? `Stan: ${pwFlag}` : null,
        zakresT
          ? `Zakres: ${zakresT.length > 280 ? `${zakresT.slice(0, 277)}…` : zakresT}`
          : null,
        tekstTrim(z.osoba_faktury_nazwa)
          ? `Osoba (faktury PW): ${tekstTrim(z.osoba_faktury_nazwa)}`
          : null,
        tekstTrim(z.osoba_faktury_telefon) ? `Tel.: ${tekstTrim(z.osoba_faktury_telefon)}` : null,
        tekstTrim(z.osoba_faktury_email) ? `E-mail: ${tekstTrim(z.osoba_faktury_email)}` : null,
        tekstTrim(z.uwagi) ? `Uwagi: ${tekstTrim(z.uwagi)}` : null,
      ].filter(Boolean);
      const firmaT = firma != null ? tekstTrim(firma) : "";
      const dZ = dataDoSortuYYYYMMDD(z.data_zlecenia);
      const dT = dataDoSortuYYYYMMDD(z.termin_zlecenia);
      const dO = dataDoSortuYYYYMMDD(z.data_oddania);
      const pwPunkty = [
        dZ ? { sortKey: dZ, pwAnchor: "data_zlecenia", subtitle: "Data zlecenia", uwaga: false } : null,
        dT
          ? {
              sortKey: dT,
              pwAnchor: "termin_zlecenia",
              subtitle: "Termin zlecenia (plan)",
              uwaga: pulpitPwWymagaUwagi(z, dziś),
            }
          : null,
        dO
          ? { sortKey: dO, pwAnchor: "data_oddania", subtitle: "Data oddania (faktyczna)", uwaga: false }
          : null,
      ].filter(Boolean);
      const punkty =
        pwPunkty.length > 0
          ? pwPunkty
          : [{ sortKey: null, pwAnchor: "data_zlecenia", subtitle: null, uwaga: false }];
      for (const p of punkty) {
        out.push({
          sortKey: p.sortKey,
          tieBreak: tie++,
          kind: "pw",
          pwAnchor: p.pwAnchor,
          edytujId: z.id,
          title: `PW · ${firmaT || "—"}`,
          subtitle: p.subtitle,
          wymagaUwagi: p.uwaga === true,
          bodyLines: lines,
        });
      }
    }

    const dziennikDlaProjektu = dziennikWpisy.filter((row) => String(row.kr ?? "").trim() === k);
    for (const row of dziennikDlaProjektu) {
      const sortKey = dataDoSortuYYYYMMDD(row.data_zdarzenia) || null;
      const typZdT = tekstTrim(row.typ_zdarzenia);
      const lines = [
        tekstTrim(row.status_zdarzenia) ? `Status zdarzenia: ${tekstTrim(row.status_zdarzenia)}` : null,
        tekstTrim(row.opis) ? `Opis: ${tekstTrim(row.opis)}` : null,
        tekstTrim(row.wymagane_dzialanie)
          ? `Wymagane działanie: ${tekstTrim(row.wymagane_dzialanie)}`
          : null,
        typZdT ? `Typ: ${typZdT}` : null,
        podpisOsobyProwadzacej(row.osoba_zglaszajaca, mapaProwadzacychId)
          ? `Zgłaszający: ${podpisOsobyProwadzacej(row.osoba_zglaszajaca, mapaProwadzacychId)}`
          : null,
        podpisOsobyProwadzacej(row.osoba_odpowiedzialna_za_zadanie, mapaProwadzacychId)
          ? `Odpowiedzialny: ${podpisOsobyProwadzacej(row.osoba_odpowiedzialna_za_zadanie, mapaProwadzacychId)}`
          : null,
      ].filter(Boolean);
      out.push({
        sortKey,
        tieBreak: tie++,
        kind: "log",
        edytujId: row.id,
        title: "LOG",
        subtitle: typZdT || null,
        wymagaUwagi: pulpitLogWymagaUwagi(row),
        bodyLines: lines,
      });
    }

    const cmpData =
      pulpitSortDaty === "desc"
        ? (ka, kb) => kb.localeCompare(ka)
        : (ka, kb) => ka.localeCompare(kb);
    out.sort((a, b) => {
      const ha = a.sortKey != null && a.sortKey !== "";
      const hb = b.sortKey != null && b.sortKey !== "";
      if (ha !== hb) return ha ? -1 : 1;
      if (ha && hb) {
        const ka = a.sortKey;
        const kb = b.sortKey;
        if (ka !== kb) return cmpData(ka, kb);
      }
      const oa = PULPIT_KIND_ORDER[a.kind] ?? 9;
      const ob = PULPIT_KIND_ORDER[b.kind] ?? 9;
      if (oa !== ob) return oa - ob;
      if (a.kind === "pw" && b.kind === "pw" && a.pwAnchor && b.pwAnchor) {
        const da = PW_PULPIT_ANCHOR_ORDER[a.pwAnchor] ?? 9;
        const db = PW_PULPIT_ANCHOR_ORDER[b.pwAnchor] ?? 9;
        if (da !== db) return da - db;
      }
      return a.tieBreak - b.tieBreak;
    });
    return out;
  }, [
    widokPulpitDlaKr,
    pulpitSortDaty,
    etapy,
    krZleceniaPwList,
    dziennikWpisy,
    krList,
    mapaProwadzacychId,
  ]);

  /** Wiersze pulpitu z jednym skokiem „teraz” (dzisiaj) — zależnie od sortowania listy. */
  const pulpitWierszeZTeraz = useMemo(() => {
    const karty = pulpitOśKarty;
    const dziś = dzisiajDataYYYYMMDD();
    const n = karty.length;
    if (n === 0) return [{ typ: "teraz", klucz: "teraz-pusta" }];
    let insertAt;
    if (pulpitSortDaty === "asc") {
      const t = karty.findIndex((k) => k.sortKey && k.sortKey > dziś);
      if (t === -1) {
        let lastD = -1;
        for (let i = 0; i < n; i++) if (karty[i].sortKey) lastD = i;
        insertAt = lastD + 1;
      } else insertAt = t;
    } else {
      const t = karty.findIndex((k) => !(k.sortKey && k.sortKey > dziś));
      if (t === -1) insertAt = n;
      else insertAt = t;
    }
    const wiersze = [];
    for (let i = 0; i < n; i++) {
      if (i === insertAt) wiersze.push({ typ: "teraz", klucz: `teraz-przed-${i}` });
      wiersze.push({ typ: "karta", karta: karty[i], idx: i });
    }
    if (insertAt === n) wiersze.push({ typ: "teraz", klucz: "teraz-po-ostatniej" });
    return wiersze;
  }, [pulpitOśKarty, pulpitSortDaty]);

  function powrotDoListyKr() {
    const kWr = wybranyKrKlucz != null ? String(wybranyKrKlucz).trim() : "";
    const kPu = widokPulpitDlaKr != null ? String(widokPulpitDlaKr).trim() : "";
    const naPulpit = kWr !== "" && kPu !== "" && kWr === kPu;

    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    if (!naPulpit) {
      setWidokPulpitDlaKr(null);
      setPulpitSortDaty("asc");
      setDziennikWpisy([]);
      setDziennikFetchError(null);
      setKrZleceniaPwList([]);
      setKrZleceniaPwFetchError(null);
    }
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    if (!naPulpit) {
      setKrZleceniePwEdycjaId(null);
      setKrZleceniePwKontekstKr(null);
      setKrZleceniePwForm(krZleceniePwPustyForm());
    }
    void fetchKR();
    if (naPulpit) void fetchDziennikForKr(kPu);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditKr() {
    setEditingKrKey(null);
  }

  /**
   * Zapis pól tabeli `kr`. `staryKrWiersza` — wartość klucza z bazy przy otwarciu edycji (WHERE).
   * `editForm.kr` może być nowym kodem KR; przy zmianie kodu w bazie muszą być zsynchronizowane
   * powiązania (np. ON UPDATE CASCADE na `etapy.kr`), inaczej Postgres zwróci błąd FK.
   */
  async function saveEditKr(staryKrWiersza) {
    const staryKr = String(staryKrWiersza).trim();
    const nowyKr = String(editForm.kr ?? "").trim();
    if (!nowyKr) {
      alert("Pole KR jest wymagane.");
      return;
    }

    if (nowyKr !== staryKr) {
      const kolizja = krList.some(
        (r) => String(r.kr).trim() === nowyKr && String(r.kr).trim() !== staryKr
      );
      if (kolizja) {
        alert("Ten kod KR już istnieje w tabeli. Podaj unikalny kod.");
        return;
      }
    }

    const dzialWart =
      editForm.dzial != null && String(editForm.dzial).trim() !== ""
        ? String(editForm.dzial).trim()
        : null;

    const statusWart = String(editForm.status ?? "").trim();
    const statusDoBazy =
      statusWart === "" ? null : KR_STATUS_W_BAZIE.includes(statusWart) ? statusWart : null;
    if (statusWart !== "" && statusDoBazy === null) {
      alert("Nieprawidłowy status. Wybierz jedną z opcji listy.");
      return;
    }

    const { data, error } = await supabase
      .from("kr")
      .update({
        kr: nowyKr,
        nazwa_obiektu: editForm.nazwa_obiektu.trim() || null,
        rodzaj_pracy: String(editForm.rodzaj_pracy ?? "").trim() || null,
        dzial: dzialWart,
        osoba_prowadzaca: editForm.osoba_prowadzaca.trim() || null,
        data_rozpoczecia: editForm.data_rozpoczecia.trim() || null,
        status: statusDoBazy,
        zleceniodawca: String(editForm.zleceniodawca ?? "").trim() || null,
        osoba_odpowiedzialna_zleceniodawcy:
          String(editForm.osoba_odpowiedzialna_zleceniodawcy ?? "").trim() || null,
        link_umowy: String(editForm.link_umowy ?? "").trim() || null,
        okres_projektu_od: String(editForm.okres_projektu_od ?? "").trim() || null,
        okres_projektu_do: String(editForm.okres_projektu_do ?? "").trim() || null,
      })
      .eq("kr", staryKr)
      .select(
        "kr, dzial, nazwa_obiektu, rodzaj_pracy, osoba_prowadzaca, data_rozpoczecia, status, zleceniodawca, osoba_odpowiedzialna_zleceniodawcy, link_umowy, okres_projektu_od, okres_projektu_do"
      );

    if (error) {
      console.error(error);
      const msg = String(error.message);
      alert(
        "Zapis KR: " +
          msg +
          "\n\nJeśli to „brak uprawnień”, uruchom rls-policies-anon.sql. " +
          (msg.toLowerCase().includes("foreign") || msg.toLowerCase().includes("fk")
            ? "\nZmiana kodu KR wymaga aktualizacji powiązanych wierszy (np. etapy) lub CASCADE w bazie."
            : "") +
          (msg.toLowerCase().includes("column") || msg.toLowerCase().includes("schema")
            ? "\n\nOpcjonalne pola KR: g4-app/supabase/kr-dodatkowe-pola.sql."
            : "")
      );
      return;
    }

    if (!data?.length) {
      alert(
        "Nie zapisano żadnego wiersza (baza zwróciła 0 rekordów). " +
          "Zwykle przyczyna: brak polityki UPDATE dla roli anon na tabeli kr albo brak GRANT UPDATE. " +
          "Uruchom ponownie plik g4-app/supabase/rls-policies-anon.sql w SQL Editor."
      );
      return;
    }

    if (nowyKr !== staryKr) {
      setWybranyKrKlucz(nowyKr);
      const { error: errPw } = await supabase
        .from("kr_zlecenie_podwykonawcy")
        .update({ kr: nowyKr })
        .eq("kr", staryKr);
      if (errPw) {
        console.error(errPw);
        alert(
          "Kod KR zaktualizowany, ale powiązania zleceń PW mogły nie zostać przeniesione: " +
            errPw.message +
            "\n\nSprawdź tabelę kr_zlecenie_podwykonawcy lub uruchom migrację kr-zlecenie-podwykonawcy.sql."
        );
      }
    }
    setEditingKrKey(null);
    await fetchKR();
    await fetchEtapy();
    await fetchKrZleceniaPwForKr(nowyKr);
    void fetchWszystkieZleceniaPw();
  }

  async function addKR(e) {
    e.preventDefault();

    const dzialIns =
      newDzial != null && String(newDzial).trim() !== "" ? String(newDzial).trim() : null;

    const st = String(newStatus ?? "").trim();
    const statusIns = st === "" ? null : KR_STATUS_W_BAZIE.includes(st) ? st : null;
    if (st !== "" && statusIns === null) {
      alert("Nieprawidłowy status. Wybierz jedną z opcji listy.");
      return;
    }

    const { data, error } = await supabase
      .from("kr")
      .insert([
        {
          kr: newKr.trim(),
          nazwa_obiektu: newNazwaObiektu.trim() || null,
          rodzaj_pracy: newRodzajPracy.trim() || null,
          dzial: dzialIns,
          osoba_prowadzaca: newOsobaProwadzaca.trim() || null,
          data_rozpoczecia: newDataRozpoczecia.trim() || null,
          status: statusIns,
          zleceniodawca: newZleceniodawca.trim() || null,
          osoba_odpowiedzialna_zleceniodawcy: newOsobaZleceniodawcy.trim() || null,
          link_umowy: newLinkUmowy.trim() || null,
          okres_projektu_od: newOkresProjektuOd.trim() || null,
          okres_projektu_do: newOkresProjektuDo.trim() || null,
        },
      ])
      .select("kr, dzial, status");

    if (error) {
      console.error(error);
      const msg = String(error.message);
      alert(
        "Nie udało się dodać KR: " +
          msg +
          (msg.includes("status")
            ? "\n\nUruchom w SQL Editor plik g4-app/supabase/kr-add-status.sql (kolumna status)."
            : "") +
          (msg.includes("column") || msg.includes("schema")
            ? "\n\nOpcjonalne pola zleceniodawcy: g4-app/supabase/kr-dodatkowe-pola.sql."
            : "")
      );
      return;
    }

    if (!data?.length) {
      alert(
        "INSERT nie zwrócił wiersza (często RLS / GRANT). Uruchom rls-policies-anon.sql w Supabase."
      );
      return;
    }

    setNewKr("");
    setNewNazwaObiektu("");
    setNewRodzajPracy("");
    setNewDzial("");
    setNewOsobaProwadzaca("");
    setNewDataRozpoczecia("");
    setNewStatus("");
    setNewZleceniodawca("");
    setNewOsobaZleceniodawcy("");
    setNewLinkUmowy("");
    setNewOkresProjektuOd("");
    setNewOkresProjektuDo("");
    await fetchKR();
  }

  const showEmptyKrHint =
    widok === "kr" &&
    initialFetchDone &&
    !krFetchError &&
    krList.length === 0;

  const dziśUwagiPulpitu = dzisiajDataYYYYMMDD();
  const kmFormWierszRegulPulpitu = {
    zagrozenie: kmForm.zagrozenie,
    zagrozenie_opis: kmForm.zagrozenie_opis,
    data_planowana: kmForm.data_planowana,
    status: kmForm.status,
  };
  const kmFormPlanPrzeterminowany = pulpitKmPlanPrzeterminowany(
    kmFormWierszRegulPulpitu,
    dziśUwagiPulpitu,
  );
  const kmFormZagrozenieTak = kmForm.zagrozenie === "tak";
  const kmFormOpisZagrozeniaWypelniony = !!tekstTrim(kmForm.zagrozenie_opis);
  const logFormPodswWymDzialIPerson = logWidokPodswietlGdyJestWymaganeDzialanie({
    wymagane_dzialanie: logForm.wymagane_dzialanie,
  });
  const pwFormWymagaUwagiPulpitu = pulpitPwWymagaUwagi(
    {
      termin_zlecenia: krZleceniePwForm.termin_zlecenia,
      czy_odebrane: !!krZleceniePwForm.czy_odebrane,
    },
    dziśUwagiPulpitu,
  );
  const krEdycjaStatusWymagaUwagi = pulpitKrRekordWymagaUwagi({ status: editForm.status });

  const dziśDash = dzisiajDataYYYYMMDD();

  const panelKrListaFiltrowana = useMemo(() => {
    const q = panelKrSzukaj.trim().toLowerCase();
    if (!q) return krListPosortowana;
    return krListPosortowana.filter((row) => {
      const blob = [
        row.kr,
        row.nazwa_obiektu,
        row.dzial,
        row.status,
        row.zleceniodawca,
      ]
        .map((x) => (x != null ? String(x).toLowerCase() : ""))
        .join(" ");
      return blob.includes(q);
    });
  }, [krListPosortowana, panelKrSzukaj]);

  const liczbaTematowUwagi = useMemo(() => {
    let n = 0;
    for (const row of krList) {
      if (kodyKrZWyroznieniemUwagi.has(String(row.kr).trim())) n++;
    }
    return n;
  }, [krList, kodyKrZWyroznieniemUwagi]);

  /** Kody KR z aktualnej listy kart — do liczników KPI na widoku KR i filtra „tylko z KR”. */
  const kodyAktywnychKr = useMemo(
    () => new Set(krList.map((r) => String(r.kr ?? "").trim()).filter(Boolean)),
    [krList],
  );

  const zadaniaTylkoPowiazaneZKr = useMemo(() => {
    return zadaniaList.filter((z) => {
      const k = String(z.kr ?? "").trim();
      return k !== "" && kodyAktywnychKr.has(k);
    });
  }, [zadaniaList, kodyAktywnychKr]);

  const liczbaZadanTylkoPowiazanychZKr = zadaniaTylkoPowiazaneZKr.length;

  const liczbaOtwartychZadanTylkoPowiazanychZKr = useMemo(
    () => zadaniaTylkoPowiazaneZKr.filter((z) => !zadanieCzyUkonczoneStatus(z.status)).length,
    [zadaniaTylkoPowiazaneZKr],
  );

  const zadaniaPrzefiltrowane = useMemo(() => {
    let list = zadaniaList;
    const fk = String(zadaniaFiltrKr ?? "").trim();
    if (fk === "__bez_kr__") {
      list = list.filter((z) => !tekstTrim(z.kr));
    } else if (fk === "__tylko_z_kr__") {
      list = list.filter((z) => {
        const k = String(z.kr ?? "").trim();
        return k !== "" && kodyAktywnychKr.has(k);
      });
    } else if (fk !== "") {
      list = list.filter((z) => String(z.kr ?? "").trim() === fk);
    }
    const fnr = String(zadaniaFiltrPracNr ?? "").trim();
    if (!fnr) return list;
    return list.filter((z) => {
      const o = String(z.osoba_odpowiedzialna ?? "").trim();
      const zl = String(z.osoba_zlecajaca ?? "").trim();
      if (zadaniaFiltrTylkoOdpowiedzialny) return o === fnr;
      return o === fnr || zl === fnr;
    });
  }, [
    zadaniaList,
    zadaniaFiltrPracNr,
    zadaniaFiltrTylkoOdpowiedzialny,
    zadaniaFiltrKr,
    kodyAktywnychKr,
  ]);

  const zadaniaKanbanBuckets = useMemo(() => {
    const buckets = { oczekuje: [], w_trakcie: [], ukonczone: [], inne: [] };
    for (const row of zadaniaPrzefiltrowane) {
      buckets[zadanieKluczKolumnyKanban(row.status)].push(row);
    }
    const sortWiersze = (rows) =>
      [...rows].sort((a, b) => {
        const ka = String(a.kr ?? "").trim();
        const kb = String(b.kr ?? "").trim();
        if (ka === "" && kb !== "") return 1;
        if (ka !== "" && kb === "") return -1;
        const c = ka.localeCompare(kb, "pl", { numeric: true, sensitivity: "base" });
        if (c !== 0) return c;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });
    for (const k of Object.keys(buckets)) {
      buckets[k] = sortWiersze(buckets[k]);
    }
    return buckets;
  }, [zadaniaPrzefiltrowane]);

  const liczbaOpoznionychEtapow = useMemo(() => {
    let n = 0;
    for (const e of etapy) {
      if (pulpitKmWymagaUwagi(e, dziśDash)) n++;
    }
    return n;
  }, [etapy, dziśDash]);

  const liczbaZlecenDoOdbioru = useMemo(() => {
    let n = 0;
    for (const z of pwZleceniaWszystkieList) {
      if (pulpitPwWymagaUwagi(z, dziśDash)) n++;
    }
    return n;
  }, [pwZleceniaWszystkieList, dziśDash]);

  /**
   * Otwarte zgłoszenia globalnie — pełna liczba wymagałaby zapytania SQL / materialized view.
   * Na demo: placeholder „—”; w kodzie miejsce pod przyszłe podłączenie.
   */
  const liczbaOtwartychZgloszenGlobal = "—";

  const listaAlertowOperacyjnych = useMemo(() => {
    const out = [];
    for (const row of krList) {
      if (pulpitKrRekordWymagaUwagi(row)) {
        out.push({
          severity: "wazny",
          text: `KR ${row.kr}: status „oczekuje na zamawiającego” — decyzja zleceniodawcy.`,
          target: { kind: "kr_status", kr: row.kr },
        });
      }
    }
    for (const e of etapy) {
      if (pulpitKmPlanPrzeterminowany(e, dziśDash)) {
        out.push({
          severity: "krytyczny",
          text: `Etap „${e.etap ?? "—"}” (KR ${e.kr}): plan po terminie.`,
          target: { kind: "km_etap", kr: e.kr, kmRow: e },
        });
      } else if (
        e.zagrozenie === "tak" ||
        e.zagrozenie === true ||
        tekstTrim(e.zagrozenie_opis)
      ) {
        out.push({
          severity: "wazny",
          text: `Ryzyko na etapie „${e.etap ?? "—"}” (KR ${e.kr}).`,
          target: { kind: "km_etap", kr: e.kr, kmRow: e },
        });
      }
    }
    for (const z of pwZleceniaWszystkieList) {
      if (pulpitPwWymagaUwagi(z, dziśDash)) {
        out.push({
          severity: "krytyczny",
          text: `PW / KR ${z.kr}: termin minął, brak odbioru.`,
          target: { kind: "pw_zlecenie", kr: z.kr },
        });
      }
    }
    for (const row of zadaniaList) {
      const plan = dataDoSortuYYYYMMDD(row.data_planowana);
      if (
        plan &&
        plan < dziśDash &&
        !tekstTrim(row.data_realna) &&
        !zadanieCzyUkonczoneStatus(row.status)
      ) {
        const krTxt = tekstTrim(row.kr);
        const zadLabel = tekstTrim(row.zadanie) || row.id;
        out.push({
          severity: "wazny",
          text: krTxt
            ? `Zadanie przeterminowane (${row.kr}): ${zadLabel}.`
            : `Zadanie ogólne przeterminowane: ${zadLabel}.`,
          target: { kind: "zadanie", row },
        });
      }
    }
    return out;
  }, [krList, etapy, pwZleceniaWszystkieList, zadaniaList, dziśDash]);

  /** Zakładki „karty projektu” — wspólne dla widoku KR i trybu hub (etapy / LOG / PW / pulpit). */
  function renderKrProjektPills(item) {
    if (!item) return null;
    const podDoAktywnejPill = {
      przeglad: "przeglad",
      os: "os",
      faktury: "faktury",
      koszty: "koszty",
      podwykonawcy: "podwykonawcy",
      zlecenia: "zlecenia",
      dziennik: "zgloszenia",
      karta: "przeglad",
      umowa: "umowa",
      zadania: "zadania_kr",
      informacja: "ryzyka",
      terminy: "terminy",
      zespol: "zespol",
      rozszerzenia: "rozszerzenia",
    };
    const activeId = widokPulpitDlaKr
      ? podDoAktywnejPill[pulpitPodstrona] ?? "przeglad"
      : widokKmDlaKr
        ? "etapy"
        : widokLogDlaKr
          ? "zgloszenia"
          : widokPwDlaKr
            ? krProjektSekcja === "podwykonawcy"
              ? "podwykonawcy"
              : "zlecenia"
            : krProjektSekcja;
    return (
      <nav style={op.pillsRow} aria-label="Sekcje projektu">
        {KR_PROJEKT_MENU.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              maxWidth: trybHelp ? "min(100%, 12.5rem)" : undefined,
            }}
          >
            <button type="button" style={op.pill(activeId === m.id)} onClick={() => przejdzDoSekcjiKr(item, m.id)}>
              {m.label}
            </button>
            <HelpLinijka wlaczony={trybHelp}>{m.help}</HelpLinijka>
          </div>
        ))}
      </nav>
    );
  }

  /** Lewe drzewo nawigacji pulpitu (jak panel KR na starcie). */
  function renderPulpitDrzewoNav(item) {
    const k = String(item.kr ?? "").trim();
    const btnLeaf = (pod, label) => {
      const active = pulpitPodstrona === pod;
      return (
        <button
          type="button"
          key={pod}
          onClick={() => pulpitNavUstawPodstrone(pod, item)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "0.44rem 0.55rem 0.44rem 1.35rem",
            marginBottom: "0.12rem",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.8rem",
            background: active ? "rgba(249,115,22,0.14)" : "transparent",
            color: active ? theme.action : theme.text,
            borderLeft: active ? `3px solid ${theme.action}` : "3px solid transparent",
            fontWeight: active ? 650 : 500,
            transition: "background 0.12s ease, border-color 0.12s ease",
          }}
        >
          {label}
        </button>
      );
    };
    return (
      <nav
        aria-label="Nawigacja pulpitu projektu"
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: "12px",
          padding: "14px 12px",
          position: "sticky",
          top: "0.75rem",
          maxHeight: "calc(100vh - 6rem)",
          overflowY: "auto",
          boxShadow: "0 4px 22px -12px rgba(0,0,0,0.5)",
        }}
      >
        <button
          type="button"
          onClick={() => setPulpitDrzewoRozwinProjekty((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "0.48rem 0.55rem",
            marginBottom: "0.4rem",
            border: "none",
            borderRadius: "8px",
            background: "rgba(148,163,184,0.08)",
            color: theme.text,
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <span>KR</span>
          <span style={{ color: theme.muted, fontSize: "0.75rem" }}>{pulpitDrzewoRozwinProjekty ? "▼" : "▶"}</span>
        </button>
        {pulpitDrzewoRozwinProjekty ? (
          <div style={{ marginBottom: "0.35rem" }}>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: theme.muted,
                padding: "0.3rem 0.5rem 0.45rem 0.65rem",
                letterSpacing: "0.04em",
              }}
            >
              {k}
            </div>
            {btnLeaf("przeglad", "Przegląd — zagrożenia i zadania")}
            {btnLeaf("os", "Oś czasu (ETAP · PW · LOG)")}
            {btnLeaf("faktury", "Faktury kosztowe")}
            {btnLeaf("koszty", "Koszty — czas pracy")}
            {btnLeaf("zlecenia", "Zlecenia PW")}
            {btnLeaf("podwykonawcy", "Podwykonawcy")}
            {btnLeaf("dziennik", "Dziennik zdarzeń")}
            {btnLeaf("zadania", "Zadania")}
            {btnLeaf("karta", "Karta projektu — dane")}
            {btnLeaf("umowa", "Umowa")}
            {btnLeaf("informacja", "Informacja / ryzyka")}
          </div>
        ) : null}
      </nav>
    );
  }

  /** Strona startowa pulpitu: alerty i zadania dla jednego KR (bez pełnej osi). */
  function renderPulpitPrzegladKr(item) {
    const kr = String(item.kr ?? "").trim();
    const d0 = dzisiajDataYYYYMMDD();
    const alerty = listaAlertowOperacyjnych.filter((a) => {
      const t = a.target;
      if (!t) return false;
      if (t.kind === "kr_status" && String(t.kr ?? "").trim() === kr) return true;
      if (t.kind === "km_etap" && String(t.kr ?? "").trim() === kr) return true;
      if (t.kind === "pw_zlecenie" && String(t.kr ?? "").trim() === kr) return true;
      if (t.kind === "zadanie" && String(t.row?.kr ?? "").trim() === kr) return true;
      return false;
    });
    const zadaniaKr = zadaniaList.filter((z) => String(z.kr ?? "").trim() === kr);
    const zadaniaOtwarte = zadaniaKr.filter((z) => !zadanieCzyUkonczoneStatus(z.status));
    const krytyczne = alerty.filter((a) => a.severity === "krytyczny").length;
    const wazne = alerty.filter((a) => a.severity === "wazny").length;
    const listaEtapow = etapyWedlugKr.get(item.kr) ?? [];
    const etapyRyzyko = listaEtapow.filter((e) => pulpitKmWymagaUwagi(e, d0)).length;
    const rg = pulpitRoboczogodziny;
    const rgWart =
      rg.loading || rg.suma == null
        ? rg.loading
          ? "…"
          : "—"
        : rg.suma.toLocaleString("pl-PL", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    const rgHint = rg.err
      ? `Błąd: ${rg.err}`
      : rg.loading
        ? "Wczytywanie z modułu Czas pracy…"
        : "Suma godzin (typ praca) z wpisów na ten KR";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.35rem" }}>
        <div>
          <h2
            style={{
              margin: "0 0 0.35rem",
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            {item.kr}
            <span
              style={{
                display: "block",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: theme.muted,
                marginTop: "0.4rem",
              }}
            >
              {tekstTrim(item.nazwa_obiektu) || "—"}
            </span>
          </h2>
          {trybHelp ? (
            <p style={{ ...op.muted, margin: 0, fontSize: "0.86rem", lineHeight: 1.55, maxWidth: "44rem" }}>
              Najważniejsze na start: zagrożenia operacyjne i otwarte zadania. Pełna oś czasu, finanse (INV) i formularze
              — w sekcjach po lewej.
            </p>
          ) : null}
        </div>
        <div style={op.kpiGrid}>
          <OpKpiCard
            label="Alerty (ten projekt)"
            value={alerty.length}
            hint={alerty.length ? `${krytyczne} krytycznych · ${wazne} ważnych` : "Brak pozycji z listy operacyjnej"}
            accent={alerty.length ? "danger" : "success"}
            border={alerty.length ? "rgba(239,68,68,0.28)" : "rgba(34,197,94,0.28)"}
            onClick={() => pulpitNavUstawPodstrone(alerty.length ? "informacja" : "os", item)}
            title={alerty.length ? "Panel ryzyk i szczegóły" : "Oś czasu projektu"}
          />
          <OpKpiCard
            label="Etapy z uwagą"
            value={etapyRyzyko}
            hint="Ryzyko / plan / status KR"
            accent={etapyRyzyko ? "danger" : "success"}
            border={etapyRyzyko ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.22)"}
            onClick={() => pulpitNavUstawPodstrone(etapyRyzyko ? "informacja" : "os", item)}
          />
          <OpKpiCard
            label="Zadania otwarte"
            value={zadaniaOtwarte.length}
            hint={`Łącznie przy KR: ${zadaniaKr.length}`}
            accent={zadaniaOtwarte.length ? "action" : "success"}
            border="rgba(249,115,22,0.26)"
            onClick={() => pulpitNavUstawPodstrone("zadania", item)}
          />
          <OpKpiCard
            label="Roboczogodziny"
            value={rg.err ? "!" : rgWart}
            hint={rgHint}
            accent={rg.err ? "danger" : (Number(rg.suma) || 0) > 0 ? "action" : "success"}
            border={
              rg.err
                ? "rgba(239,68,68,0.28)"
                : (Number(rg.suma) || 0) > 0
                  ? "rgba(251,191,36,0.3)"
                  : "rgba(34,197,94,0.22)"
            }
            onClick={() => pulpitNavUstawPodstrone("koszty", item)}
            title="Szczegóły: zakładka Koszty — czas pracy na tym KR"
          />
          <OpKpiCard
            label="Pulpit operacyjny"
            value="Oś"
            hint="Chronologia ETAP · PW · LOG"
            accent="action"
            border="rgba(249,115,22,0.22)"
            onClick={() => pulpitNavUstawPodstrone("os", item)}
          />
        </div>
        <div
          style={{
            ...op.sectionCard,
            borderStyle: "solid",
            borderColor: "rgba(148,163,184,0.15)",
            padding: "1.1rem 1.25rem",
          }}
        >
          <h3 style={{ ...op.sectionTitle, marginTop: 0, fontSize: "0.95rem" }}>Zagrożenia i alerty dla tego KR</h3>
          {alerty.length === 0 ? (
            <p style={{ ...op.muted, margin: 0, fontSize: "0.88rem" }}>
              <OpStatusBadge variant="ok">OK</OpStatusBadge>
              <span style={{ marginLeft: "0.5rem" }}>Brak wpisów z automatycznej listy operacyjnej.</span>
            </p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {alerty.map((a, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => przejdzZAlertuOperacyjnego(a.target)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "0.85rem 1rem",
                      borderRadius: "12px",
                      border: `1px solid ${
                        a.severity === "krytyczny" ? "rgba(239,68,68,0.35)" : "rgba(249,115,22,0.25)"
                      }`,
                      background: theme.surface,
                      color: theme.text,
                      fontSize: "0.86rem",
                      lineHeight: 1.45,
                      cursor: "pointer",
                      transition: "transform 0.12s ease, box-shadow 0.12s ease",
                    }}
                  >
                    <span style={{ marginRight: "0.45rem", verticalAlign: "middle" }}>
                      {a.severity === "krytyczny" ? (
                        <OpStatusBadge variant="danger">Krytyczne</OpStatusBadge>
                      ) : (
                        <OpStatusBadge variant="progress">Ważne</OpStatusBadge>
                      )}
                    </span>
                    {a.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div
          style={{
            ...op.sectionCard,
            borderStyle: "solid",
            borderColor: "rgba(148,163,184,0.15)",
            padding: "1.1rem 1.25rem",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.65rem" }}>
            <h3 style={{ ...op.sectionTitle, margin: 0, fontSize: "0.95rem" }}>Zadania</h3>
            <button type="button" style={{ ...s.btnGhost, fontSize: "0.82rem" }} onClick={() => pulpitNavUstawPodstrone("zadania", item)}>
              Pełna lista i formularz
            </button>
          </div>
          {zadaniaKr.length === 0 ? (
            <p style={{ ...op.muted, margin: "0.75rem 0 0", fontSize: "0.88rem" }}>Brak zadań przypisanych do tego KR.</p>
          ) : (
            <ul style={{ margin: "0.85rem 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {zadaniaKr.slice(0, 8).map((row) => {
                const zt = kmTekstDoKomorki(row.zadanie);
                const plan = dataDoSortuYYYYMMDD(row.data_planowana);
                const przeterm =
                  plan &&
                  plan < d0 &&
                  !tekstTrim(row.data_realna) &&
                  !zadanieCzyUkonczoneStatus(row.status);
                const ukoncz = zadanieCzyUkonczoneStatus(row.status);
                return (
                  <li
                    key={row.id}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "12px",
                      border: `1px solid ${przeterm ? "rgba(239,68,68,0.35)" : theme.border}`,
                      background: theme.surface,
                      boxShadow: "0 2px 14px -8px rgba(0,0,0,0.35)",
                    }}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
                      {ukoncz ? <OpStatusBadge variant="ok">Zakończone</OpStatusBadge> : <OpStatusBadge variant="progress">W toku</OpStatusBadge>}
                      {przeterm ? <OpStatusBadge variant="danger">Po terminie</OpStatusBadge> : null}
                      {row.status?.trim() ? (
                        <span style={{ fontSize: "0.75rem", color: theme.muted }}>{row.status}</span>
                      ) : null}
                    </div>
                    <div style={{ fontWeight: 650, color: "#fff", fontSize: "0.92rem" }} title={zt.title}>
                      {zt.text}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: theme.muted, marginTop: "0.35rem" }}>
                      Plan: {row.data_planowana ? dataDoInputa(row.data_planowana) : "—"} · Realizacja:{" "}
                      {row.data_realna ? dataDoInputa(row.data_realna) : "—"}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {zadaniaKr.length > 8 ? (
            <p style={{ ...op.muted, margin: "0.65rem 0 0", fontSize: "0.78rem" }}>
              Pokazano 8 z {zadaniaKr.length} — reszta w sekcji „Zadania”.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  /** Kompaktowa karta „Dane projektu” na pulpicie (ta sama treść co wcześniej pod nagłówkiem). */
  function renderPulpitDaneProjektuCard(r) {
    const siatka = {
      display: "grid",
      gridTemplateColumns: "minmax(5.5rem, auto) 1fr",
      gap: "0.22rem 0.65rem",
      alignItems: "start",
      fontSize: "0.72rem",
      color: "#d4d4d4",
    };
    const dd = { margin: 0, wordBreak: "break-word" };
    const ok_od = dataDoInputa(r.okres_projektu_od);
    const ok_do = dataDoInputa(r.okres_projektu_do);
    const okA = ok_od && /^\d{4}-\d{2}-\d{2}$/.test(ok_od) ? dataPLZFormat(ok_od) : null;
    const okB = ok_do && /^\d{4}-\d{2}-\d{2}$/.test(ok_do) ? dataPLZFormat(ok_do) : null;
    const okresWar = okA || okB ? `${okA || "—"} → ${okB || "—"}` : null;
    const krKartaUwaga = pulpitKrRekordWymagaUwagi(r);
    return (
      <div
        style={{
          marginBottom: "0.55rem",
          padding: "0.55rem 0.75rem",
          borderRadius: "12px",
          border: krKartaUwaga ? `1px solid rgba(239,68,68,0.45)` : `1px solid ${theme.border}`,
          borderLeft: krKartaUwaga ? `4px solid ${theme.danger}` : undefined,
          background: krKartaUwaga ? "rgba(239,68,68,0.08)" : theme.surface,
        }}
      >
        <div
          style={{
            fontSize: "0.65rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: krKartaUwaga ? "#fca5a5" : theme.muted,
            marginBottom: "0.35rem",
          }}
        >
          Dane projektu
          {krKartaUwaga ? (
            <span style={{ marginLeft: "0.5rem", color: theme.danger, fontWeight: 700 }}>— uwaga: status KR</span>
          ) : null}
        </div>
        <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#fafafa", marginBottom: "0.45rem" }}>
          {tekstTrim(r.nazwa_obiektu) || "—"}
        </div>
        <dl style={{ ...siatka, margin: 0 }}>
          {tekstTrim(r.rodzaj_pracy) ? (
            <>
              <dt style={{ ...s.muted, margin: 0 }}>Rodzaj</dt>
              <dd style={dd}>{tekstTrim(r.rodzaj_pracy)}</dd>
            </>
          ) : null}
          {tekstTrim(r.dzial) ? (
            <>
              <dt style={{ ...s.muted, margin: 0 }}>Dział</dt>
              <dd style={{ ...dd, ...s.dzialWartosc }}>{tekstTrim(r.dzial)}</dd>
            </>
          ) : null}
          {tekstTrim(r.status) ? (
            <>
              <dt style={{ ...s.muted, margin: 0 }}>Status</dt>
              <dd style={{ ...dd, ...s.statusKr }}>{tekstTrim(r.status)}</dd>
            </>
          ) : null}
          {r.data_rozpoczecia ? (
            <>
              <dt style={{ ...s.muted, margin: 0 }}>Start</dt>
              <dd style={dd}>{etykietaDatyStartu(r.data_rozpoczecia)}</dd>
            </>
          ) : null}
          {podpisOsobyProwadzacej(r.osoba_prowadzaca, mapaProwadzacychId) ? (
            <>
              <dt style={{ ...s.muted, margin: 0 }}>Prowadzący</dt>
              <dd style={dd}>{podpisOsobyProwadzacej(r.osoba_prowadzaca, mapaProwadzacychId)}</dd>
            </>
          ) : null}
          {tekstTrim(r.zleceniodawca) ? (
            <>
              <dt style={{ ...s.muted, margin: 0 }}>Zleceniodawca</dt>
              <dd style={dd}>{tekstTrim(r.zleceniodawca)}</dd>
            </>
          ) : null}
          {tekstTrim(r.osoba_odpowiedzialna_zleceniodawcy) ? (
            <>
              <dt style={{ ...s.muted, margin: 0 }}>Kontakt ZL</dt>
              <dd style={dd}>{tekstTrim(r.osoba_odpowiedzialna_zleceniodawcy)}</dd>
            </>
          ) : null}
          {okresWar ? (
            <>
              <dt style={{ ...s.muted, margin: 0 }}>Okres</dt>
              <dd style={dd}>{okresWar}</dd>
            </>
          ) : null}
          {tekstTrim(r.link_umowy) ? (
            <>
              <dt style={{ ...s.muted, margin: 0 }}>Umowa</dt>
              <dd style={dd}>
                <a
                  href={hrefLinkuZewnetrznego(r.link_umowy)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#7dd3fc" }}
                >
                  link
                </a>
              </dd>
            </>
          ) : null}
        </dl>
      </div>
    );
  }

  function kolorKropkiKrWPanelu(row) {
    const k = String(row.kr ?? "").trim();
    if (k && kodyKrZWyroznieniemUwagi.has(k)) return "#f87171";
    if (pulpitKrRekordWymagaUwagi(row)) return "#fbbf24";
    const st = String(row.status ?? "").toLowerCase();
    if (st.includes("zakończ") || st.includes("zakoncz") || st.includes("rozlicz")) return "#4ade80";
    return "#64748b";
  }

  /** Treść zakładek karty projektu (bez pozycji otwierających pełny widok etapów / pulpit). */
  function renderKrKartaSekcja(item) {
    const listaEtapow = etapyWedlugKr.get(item.kr) ?? [];
    const d0 = dzisiajDataYYYYMMDD();
    const sekcja = krProjektSekcja;
    const logOrd = [...dziennikWpisy].sort((a, b) => {
      const x = dataDoSortuYYYYMMDD(b.data_zdarzenia) ?? "";
      const y = dataDoSortuYYYYMMDD(a.data_zdarzenia) ?? "";
      return x.localeCompare(y);
    });

    const umowaBlok = (
      <div
        style={{
          marginBottom: "1rem",
          padding: "1rem 1.15rem",
          borderRadius: "16px",
          border: "1px solid rgba(148,163,184,0.12)",
          background: "rgba(15,23,42,0.55)",
          fontSize: "0.88rem",
          color: "#d4d4d4",
        }}
      >
        <div
          style={{
            fontSize: "0.72rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#94a3b8",
            marginBottom: "0.65rem",
          }}
        >
          Umowa i zleceniodawca
        </div>
        {!item.zleceniodawca?.trim() &&
        !item.osoba_odpowiedzialna_zleceniodawcy?.trim() &&
        !item.link_umowy?.trim() &&
        !item.okres_projektu_od &&
        !item.okres_projektu_do ? (
          <p style={{ ...op.muted, margin: 0 }}>
            Brak uzupełnionych pól umowy — uzupełnij je przyciskiem <strong>Edytuj KR</strong>.
          </p>
        ) : null}
        {item.zleceniodawca?.trim() ? (
          <div style={{ marginBottom: "0.45rem" }}>
            <span style={s.muted}>Zleceniodawca: </span>
            <strong style={{ color: "#f5f5f5" }}>{item.zleceniodawca.trim()}</strong>
          </div>
        ) : null}
        {item.osoba_odpowiedzialna_zleceniodawcy?.trim() ? (
          <div style={{ marginBottom: "0.45rem" }}>
            <span style={s.muted}>Osoba po stronie zleceniodawcy: </span>
            {item.osoba_odpowiedzialna_zleceniodawcy.trim()}
          </div>
        ) : null}
        {item.link_umowy?.trim() ? (
          <div style={{ marginBottom: "0.45rem" }}>
            <span style={s.muted}>Link do umowy: </span>
            <a
              href={hrefLinkuZewnetrznego(item.link_umowy)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#7dd3fc", wordBreak: "break-all" }}
            >
              {item.link_umowy.trim()}
            </a>
          </div>
        ) : null}
        {item.okres_projektu_od || item.okres_projektu_do ? (
          <div>
            <span style={s.muted}>Okres trwania: </span>
            {item.okres_projektu_od ? dataDoInputa(item.okres_projektu_od) : "—"} —{" "}
            {item.okres_projektu_do ? dataDoInputa(item.okres_projektu_do) : "—"}
          </div>
        ) : null}
        <div style={{ marginTop: "0.9rem", paddingTop: "0.85rem", borderTop: "1px solid rgba(148,163,184,0.15)" }}>
          <div style={{ ...op.muted, fontSize: "0.78rem", marginBottom: "0.5rem", lineHeight: 1.45 }}>
            <strong style={{ color: "#fde68a" }}>Faktury kosztowe (zgłoszenie do opłacenia)</strong> — osobna zakładka:
            komu przelew, konto, kwota brutto. To <strong>nie</strong> jest blok „Koszty (placeholder)” na pulpicie
            (INV).
          </div>
          <button
            type="button"
            style={{
              ...s.btnGhost,
              padding: "0.35rem 0.75rem",
              fontSize: "0.8rem",
              borderColor: "rgba(250,204,21,0.5)",
              color: "#fef9c3",
              fontWeight: 600,
            }}
            onClick={() => przejdzDoSekcjiKr(item, "faktury")}
          >
            Przejdź do zgłoszenia faktury do opłacenia
          </button>
        </div>
        <p style={{ ...op.muted, margin: "0.85rem 0 0", fontSize: "0.78rem" }}>
          BRUDNOPIS: docelowo <strong>osobna tabela</strong> (np. wiele linków / wersji umowy do wklejenia, aneksy) —
          na razie jedno pole <code style={s.code}>link_umowy</code> w rekordzie KR („Edytuj KR”). Warunki i uwagi —
          nadal koncepcyjnie pod przyszłe pola lub powiązanie z aneksami.
        </p>
      </div>
    );

    if (sekcja === "przeglad") {
      const etapyRyzyko = listaEtapow.filter((e) => pulpitKmWymagaUwagi(e, d0)).length;
      const logOtwarte = dziennikWpisy.filter((r) => pulpitLogWymagaUwagi(r)).length;
      const pwPoTerminie = krZleceniaPwList.filter((z) => pulpitPwWymagaUwagi(z, d0)).length;
      return (
        <>
          <div style={{ ...op.kpiGrid, marginBottom: "1rem" }}>
            <div style={op.kpiCard("rgba(56,189,248,0.22)")}>
              <div style={{ ...op.muted, fontSize: "0.7rem" }}>Etapy</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#f8fafc" }}>{listaEtapow.length}</div>
            </div>
            <div style={op.kpiCard("rgba(147,197,253,0.22)")}>
              <div style={{ ...op.muted, fontSize: "0.7rem" }}>Zgłoszenia (otwarte)</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#f8fafc" }}>{logOtwarte}</div>
            </div>
            <div style={op.kpiCard("rgba(251,191,36,0.25)")}>
              <div style={{ ...op.muted, fontSize: "0.7rem" }}>PW — uwaga termin</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#f8fafc" }}>{pwPoTerminie}</div>
            </div>
            <div style={op.kpiCard("rgba(248,113,113,0.28)")}>
              <div style={{ ...op.muted, fontSize: "0.7rem" }}>Etapy z ryzykiem</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#f8fafc" }}>{etapyRyzyko}</div>
            </div>
          </div>

          {listaEtapow.length > 0 ? (
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ ...op.sectionTitle, fontSize: "0.88rem" }}>Etapy — skrót</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: "0.65rem",
                }}
              >
                {listaEtapow.map((et) => {
                  const uw = pulpitKmWymagaUwagi(et, d0);
                  const fList = fakturySprzedazMapaPoEtapId.get(et.id) ?? [];
                  const fsAgg = fakturySprzedazAgregatDlaEtapu(fList);
                  return (
                    <div
                      key={et.id}
                      style={{
                        padding: "0.75rem 0.85rem",
                        borderRadius: "14px",
                        border: uw ? "1px solid rgba(248,113,113,0.4)" : "1px solid rgba(148,163,184,0.12)",
                        background: uw ? "rgba(248,113,113,0.07)" : "rgba(15,23,42,0.5)",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: "0.25rem" }}>
                        {et.etap ?? "—"}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
                        {et.status ? <span>Status: {et.status} · </span> : null}
                        {et.data_planowana ? (
                          <span>Plan: {dataDoInputa(et.data_planowana)}</span>
                        ) : (
                          <span>Plan: —</span>
                        )}
                      </div>
                      {/* BRUDNOPIS FS: skrót sprzedaży — pełna lista dokumentów później pod etapem / modal. */}
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#c4b5fd",
                          marginTop: "0.4rem",
                          lineHeight: 1.35,
                        }}
                      >
                        FS: zafakt. {pulpitInvFormatTakNieNieznane(fsAgg.zafakturowane)} · prot.{" "}
                        {pulpitInvFormatTakNieNieznane(fsAgg.protokol)}
                        {fsAgg.dataPokaz ? (
                          <>
                            {" "}
                            · data: {dataPLZFormat(fsAgg.dataPokaz)}
                          </>
                        ) : null}
                      </div>
                      {et.osoba_odpowiedzialna ? (
                        <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.35rem" }}>
                          Odp.: {et.osoba_odpowiedzialna}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div style={{ marginBottom: "1rem" }}>
            <h3 style={{ ...op.sectionTitle, fontSize: "0.88rem" }}>Ostatnie zdarzenia</h3>
            {logOrd.length === 0 ? (
              <p style={{ ...op.muted, margin: 0 }}>Brak wpisów w dzienniku dla tego KR.</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {logOrd.slice(0, 4).map((row) => (
                  <li
                    key={row.id}
                    style={{
                      padding: "0.65rem 0.75rem",
                      marginBottom: "0.45rem",
                      borderRadius: "12px",
                      border: "1px solid rgba(148,163,184,0.1)",
                      background: "rgba(15,23,42,0.45)",
                      fontSize: "0.8rem",
                      color: "#e2e8f0",
                    }}
                  >
                    <span style={op.badge("rgba(59,130,246,0.2)", "#bfdbfe")}>
                      {row.typ_zdarzenia ?? "—"}
                    </span>{" "}
                    <span style={{ color: "#94a3b8" }}>
                      {row.data_zdarzenia ? dataDoInputa(row.data_zdarzenia) : "—"}
                    </span>
                    <div style={{ marginTop: "0.35rem" }}>
                      {row.opis?.trim() ? row.opis : "—"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={s.btnRow}>
            <button
              type="button"
              style={s.btn}
              onClick={() => otworzPulpitDlaKr(item, { hub: true, podstrona: "os" })}
            >
              Oś czasu (pełny pulpit)
            </button>
            <button type="button" style={s.btnGhost} onClick={() => otworzKmDlaKr(item, { hub: true })}>
              Tabela etapów (ETAP)
            </button>
            <button type="button" style={s.btnGhost} onClick={() => otworzLogDlaKr(item, { hub: true })}>
              Pełna obsługa zgłoszeń (LOG)
            </button>
            <button type="button" style={s.btnGhost} onClick={() => otworzPwDlaKr(item, { hub: true })}>
              Edycja zleceń PW
            </button>
            <button type="button" style={s.btnGhost} onClick={() => przejdzDoSekcjiKr(item, "faktury")}>
              Faktury kosztowe (rama)
            </button>
            <button type="button" style={s.btnGhost} onClick={() => przejdzDoSekcjiKr(item, "zadania_kr")}>
              Zadania przy tym KR
            </button>
          </div>

          <OpFutureModule title="Budżet / finanse (koncepcja przy tej KR)">
            Szczegóły kosztów i szkic list — w zakładce{" "}
            <button
              type="button"
              onClick={() => przejdzDoSekcjiKr(item, "faktury")}
              style={{
                background: "none",
                border: "none",
                color: "#7dd3fc",
                cursor: "pointer",
                font: "inherit",
                fontWeight: 600,
                textDecoration: "underline",
                padding: 0,
              }}
            >
              Faktury kosztowe
            </button>
            . FS (sprzedaż) — przy etapach i na pulpicie (INV).
          </OpFutureModule>
        </>
      );
    }

    if (sekcja === "umowa") return umowaBlok;

    if (sekcja === "rozszerzenia") {
      return (
        <OpFutureModule title="Rozszerzenia zakresu">
          Moduł gotowy do wdrożenia — aneksy, dodatkowe uzgodnienia i rozliczenie rozszerzeń w ramach tego KR.
          Obecnie brak osobnej tabeli w bazie; UI przygotowane pod przyszłe pola.
        </OpFutureModule>
      );
    }

    if (sekcja === "zadania_kr") {
      const krK = String(item.kr ?? "").trim();
      const listaZadaniaKr = zadaniaList.filter((z) => String(z.kr ?? "").trim() === krK);
      return (
        <div style={{ ...op.sectionCard, borderStyle: "solid", borderColor: "rgba(148,163,184,0.18)" }}>
          <h3 style={{ ...op.sectionTitle, marginTop: 0 }}>Zadania przy projekcie KR {krK}</h3>
          <p style={{ ...op.muted, marginBottom: "0.85rem", fontSize: "0.8rem", lineHeight: 1.5 }}>
            To są te same <strong>zadania ogólne</strong> co w module <strong>Zadania ogólne</strong> — z polem{" "}
            <code style={s.code}>kr</code> ustawionym na ten projekt. Pełny widok (Kanban, filtry): przejdź do
            modułu.
          </p>
          <div style={{ ...s.btnRow, marginBottom: "1rem" }}>
            <button
              type="button"
              style={s.btnGhost}
              onClick={() => {
                przejdzDoZadania();
                setZadaniaFiltrKr(krK);
                setZadaniaFiltrPracNr("");
                setZadaniaFiltrTylkoOdpowiedzialny(false);
              }}
            >
              Otwórz moduł Zadania (filtr: ten KR)
            </button>
          </div>
          {zadaniaFetchError ? (
            <div style={{ ...s.errBox, marginBottom: "1rem" }} role="alert">
              <strong>Nie wczytano listy zadań.</strong> {zadaniaFetchError}
            </div>
          ) : null}
          {listaZadaniaKr.length === 0 ? (
            <p style={{ ...op.muted, marginBottom: "1rem" }}>Brak zadań przypisanych do tego KR — dodaj pierwsze poniżej.</p>
          ) : (
            <div style={{ ...s.tableWrap, marginBottom: "1.25rem", borderRadius: "12px", overflow: "hidden" }}>
              <table style={{ ...s.table, fontSize: "0.9rem", lineHeight: 1.45 }}>
                <thead>
                  <tr>
                    <th style={{ ...s.th, fontSize: "0.88rem", whiteSpace: "normal" }}>Zadanie</th>
                    <th style={{ ...s.th, fontSize: "0.88rem", whiteSpace: "normal" }}>Kategoria</th>
                    <th style={{ ...s.th, fontSize: "0.88rem", whiteSpace: "normal", color: "#7dd3fc" }}>Dział</th>
                    <th style={{ ...s.th, fontSize: "0.88rem", whiteSpace: "normal" }}>Odpow.</th>
                    <th style={{ ...s.th, fontSize: "0.88rem", whiteSpace: "normal" }}>Zlecający</th>
                    <th style={{ ...s.th, fontSize: "0.88rem", whiteSpace: "normal", color: "#a7f3d0" }}>Status</th>
                    <th style={{ ...s.th, fontSize: "0.88rem", whiteSpace: "normal" }}>Plan</th>
                    <th style={{ ...s.th, fontSize: "0.88rem", whiteSpace: "normal" }}>Real</th>
                    <th style={{ ...s.th, fontSize: "0.88rem", whiteSpace: "normal" }} />
                  </tr>
                </thead>
                <tbody>
                  {listaZadaniaKr.map((row) => {
                    const zt = kmTekstDoKomorki(row.zadanie);
                    const kat = zadaniaEtykietaKategorii(row);
                    const stRow = String(row.status ?? "").trim();
                    const plan = dataDoSortuYYYYMMDD(row.data_planowana);
                    const przeterm =
                      plan &&
                      plan < d0 &&
                      !tekstTrim(row.data_realna) &&
                      !zadanieCzyUkonczoneStatus(row.status);
                    return (
                      <tr
                        key={row.id}
                        style={
                          przeterm
                            ? { background: "rgba(248,113,113,0.07)", boxShadow: "inset 3px 0 0 #f87171" }
                            : undefined
                        }
                      >
                        <td style={{ ...s.td, padding: "0.55rem 0.7rem" }} title={zt.title}>
                          <strong style={{ color: "#f5f5f5" }}>{zt.text}</strong>
                        </td>
                        <td style={{ ...s.td, padding: "0.55rem 0.7rem" }}>
                          <span
                            style={{
                              ...op.badge("rgba(99,102,241,0.22)", "#c7d2fe"),
                              fontSize: "0.75rem",
                              padding: "0.3rem 0.55rem",
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              maxWidth: "12rem",
                            }}
                          >
                            {kat}
                          </span>
                        </td>
                        <td style={{ ...s.td, ...s.dzialWartosc, padding: "0.55rem 0.7rem" }}>
                          {row.dzial?.trim() ? row.dzial : "—"}
                        </td>
                        <td style={{ ...s.td, padding: "0.55rem 0.7rem" }}>
                          {podpisOsobyProwadzacej(row.osoba_odpowiedzialna, mapaProwadzacychId) ?? "—"}
                        </td>
                        <td style={{ ...s.td, padding: "0.55rem 0.7rem" }}>
                          {podpisOsobyProwadzacej(row.osoba_zlecajaca, mapaProwadzacychId) ?? "—"}
                        </td>
                        <td style={{ ...s.td, padding: "0.55rem 0.7rem" }}>
                          <select
                            style={{ ...s.input, padding: "0.45rem 0.5rem", fontSize: "0.88rem", minWidth: "10rem" }}
                            value={ZADANIE_STATUS_W_BAZIE.includes(stRow) ? stRow : ""}
                            onChange={(ev) => {
                              const v = ev.target.value;
                              if (v) void ustawStatusZadaniaSzybko(row.id, v);
                            }}
                          >
                            <option value="">— {stRow && !ZADANIE_STATUS_W_BAZIE.includes(stRow) ? stRow : "brak"} —</option>
                            {ZADANIE_STATUS_W_BAZIE.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ ...s.td, padding: "0.55rem 0.7rem" }}>
                          {row.data_planowana ? dataDoInputa(row.data_planowana) : "—"}
                        </td>
                        <td style={{ ...s.td, padding: "0.55rem 0.7rem" }}>
                          {row.data_realna ? dataDoInputa(row.data_realna) : "—"}
                        </td>
                        <td style={{ ...s.td, padding: "0.55rem 0.7rem", textAlign: "right", whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            style={{ ...s.btnGhost, padding: "0.3rem 0.5rem", fontSize: "0.8rem" }}
                            onClick={() => wczytajZadanieDoEdycji(row)}
                          >
                            Edytuj
                          </button>{" "}
                          <button
                            type="button"
                            style={{ ...s.btnGhost, padding: "0.3rem 0.5rem", fontSize: "0.8rem" }}
                            onClick={() => usunZadanie(row.id)}
                          >
                            Usuń
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e2e8f0", margin: "0 0 0.65rem" }}>
            {zadanieEdycjaId != null ? "Edycja zadania" : "Nowe zadanie"} (KR {krK})
          </h4>
          <p style={{ ...op.muted, margin: "0 0 0.75rem", fontSize: "0.78rem" }}>
            Projekt jest <strong>ustawiony automatycznie</strong> — nie trzeba wybierać KR na liście.
          </p>
          <form
            style={{ ...s.form, maxWidth: "min(40rem, 100%)", marginBottom: "1rem" }}
            onSubmit={(e) => void zapiszZadanie(e, { krWymuszony: krK })}
          >
            <label style={s.label}>
              Zadanie (wymagane)
              <input
                style={s.input}
                type="text"
                value={zadanieForm.zadanie}
                onChange={(ev) => setZadanieForm((f) => ({ ...f, zadanie: ev.target.value }))}
                required
              />
            </label>
            <label style={s.label}>
              Dział
              <input
                style={s.input}
                type="text"
                value={zadanieForm.dzial}
                onChange={(ev) => setZadanieForm((f) => ({ ...f, dzial: ev.target.value }))}
              />
            </label>
            <label style={s.label}>
              Osoba odpowiedzialna — <code style={s.code}>pracownik.nr</code>
              <select
                style={s.input}
                value={String(zadanieForm.osoba_odpowiedzialna ?? "")}
                onChange={(ev) =>
                  setZadanieForm((f) => ({ ...f, osoba_odpowiedzialna: ev.target.value }))
                }
              >
                <option value="">— brak —</option>
                {(() => {
                  const cur = String(zadanieForm.osoba_odpowiedzialna ?? "").trim();
                  const nrs = new Set(pracownicyPosortowani.map((p) => String(p.nr)));
                  const orphan = cur !== "" && !nrs.has(cur);
                  return (
                    <>
                      {orphan ? (
                        <option value={cur}>{cur} (nie w liście ID)</option>
                      ) : null}
                      {pracownicyPosortowani.map((p) => (
                        <option key={String(p.nr)} value={String(p.nr)}>
                          {String(p.nr)} — {p.imie_nazwisko ?? ""}
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </label>
            <label style={s.label}>
              Osoba zlecająca — <code style={s.code}>pracownik.nr</code>
              <select
                style={s.input}
                value={String(zadanieForm.osoba_zlecajaca ?? "")}
                onChange={(ev) =>
                  setZadanieForm((f) => ({ ...f, osoba_zlecajaca: ev.target.value }))
                }
              >
                <option value="">— brak —</option>
                {(() => {
                  const cur = String(zadanieForm.osoba_zlecajaca ?? "").trim();
                  const nrs = new Set(pracownicyPosortowani.map((p) => String(p.nr)));
                  const orphan = cur !== "" && !nrs.has(cur);
                  return (
                    <>
                      {orphan ? (
                        <option value={cur}>{cur} (nie w liście ID)</option>
                      ) : null}
                      {pracownicyPosortowani.map((p) => (
                        <option key={String(p.nr)} value={String(p.nr)}>
                          {String(p.nr)} — {p.imie_nazwisko ?? ""}
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </label>
            <label style={s.label}>
              Status
              <select
                style={s.input}
                value={zadanieForm.status}
                onChange={(ev) => setZadanieForm((f) => ({ ...f, status: ev.target.value }))}
              >
                <option value="">— brak —</option>
                {(() => {
                  const cur = String(zadanieForm.status ?? "").trim();
                  const znane = new Set(ZADANIE_STATUS_W_BAZIE);
                  const orphan = cur !== "" && !znane.has(cur);
                  return (
                    <>
                      {orphan ? (
                        <option value={cur}>{cur} (z bazy)</option>
                      ) : null}
                      {ZADANIE_STATUS_W_BAZIE.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </label>
            <label style={s.label}>
              Data planowana
              <input
                style={s.input}
                type="date"
                value={zadanieForm.data_planowana}
                onChange={(ev) =>
                  setZadanieForm((f) => ({ ...f, data_planowana: ev.target.value }))
                }
              />
            </label>
            <label style={s.label}>
              Data realna
              <input
                style={s.input}
                type="date"
                value={zadanieForm.data_realna}
                onChange={(ev) => setZadanieForm((f) => ({ ...f, data_realna: ev.target.value }))}
              />
            </label>
            <label style={s.label}>
              Zagrożenie
              <select
                style={s.input}
                value={zadanieForm.zagrozenie}
                onChange={(ev) =>
                  setZadanieForm((f) => ({ ...f, zagrozenie: ev.target.value }))
                }
              >
                <option value="">— nie ustawiono —</option>
                <option value="tak">tak</option>
                <option value="nie">nie</option>
              </select>
            </label>
            <label style={s.label}>
              Opis
              <textarea
                style={{ ...s.input, minHeight: "4rem", resize: "vertical" }}
                value={zadanieForm.opis}
                onChange={(ev) => setZadanieForm((f) => ({ ...f, opis: ev.target.value }))}
                rows={3}
              />
            </label>
            {pracFetchError ? (
              <p style={{ ...s.muted, margin: 0, fontSize: "0.82rem", color: "#fca5a5" }}>
                Lista ID: {pracFetchError}
              </p>
            ) : null}
            <div style={s.btnRow}>
              <button type="submit" style={s.btn}>
                {zadanieEdycjaId != null ? "Zapisz zmiany" : "Dodaj zadanie"}
              </button>
              {zadanieEdycjaId != null ? (
                <button type="button" style={s.btnGhost} onClick={anulujZadanieEdycje}>
                  Anuluj edycję
                </button>
              ) : null}
            </div>
          </form>
        </div>
      );
    }

    if (sekcja === "koszty") {
      const krK = String(item.kr ?? "").trim();
      const nazwaPrac = (nr) => {
        const n = String(nr ?? "").trim();
        if (!n) return "—";
        const p = pracownicyPosortowani.find((x) => String(x.nr ?? "").trim() === n);
        return p?.imie_nazwisko?.trim() ? `${n} — ${p.imie_nazwisko.trim()}` : n;
      };
      const sumaWszystkich = krCzasPracyWpisyList.reduce(
        (acc, w) => acc + (Number(w.godziny) || 0) + (Number(w.nadgodziny) || 0),
        0
      );
      const sumaPracy = krCzasPracyWpisyList.reduce((acc, w) => {
        if (grupaTypuCzasuWpisu(w.typ) !== "praca") return acc;
        return acc + (Number(w.godziny) || 0) + (Number(w.nadgodziny) || 0);
      }, 0);
      return (
        <div style={{ ...op.sectionCard, borderStyle: "solid", borderColor: "rgba(148,163,184,0.18)" }}>
          <h3 style={{ ...op.sectionTitle, marginTop: 0 }}>Koszty — czas pracy na KR {krK}</h3>
          <p style={{ ...op.muted, marginBottom: "0.85rem", fontSize: "0.8rem", lineHeight: 1.5 }}>
            Wpisy z modułu <strong>Czas pracy</strong>, w których przy wpisie wybrano ten kod KR. Suma „godziny pracy”
            liczy tylko typy pracy (bez urlopów itd.); „łącznie” obejmuje wszystkie wpisy w tabeli.
          </p>
          <div style={{ ...s.btnRow, marginBottom: "1rem" }}>
            <button type="button" style={s.btnGhost} onClick={() => przejdzDoCzasPracy()}>
              Otwórz moduł Czas pracy
            </button>
            <button type="button" style={s.btnGhost} onClick={() => void fetchCzasPracyWpisyDlaKr(krK)}>
              Odśwież listę
            </button>
          </div>
          {krCzasPracyWpisyFetchError ? (
            <div style={{ ...s.errBox, marginBottom: "1rem" }} role="alert">
              <strong>Nie wczytano czasu pracy.</strong> {krCzasPracyWpisyFetchError}
              <br />
              <span style={{ fontSize: "0.88em" }}>
                Uruchom migracje <code style={s.code}>czas-pracy-stawki-i-wpisy.sql</code> oraz{" "}
                <code style={s.code}>czas-pracy-wpis-rls-role.sql</code>.
              </span>
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.65rem",
              marginBottom: "1rem",
              fontSize: "0.82rem",
              color: "#e2e8f0",
            }}
          >
            <div
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "10px",
                border: "1px solid rgba(56,189,248,0.35)",
                background: "rgba(56,189,248,0.08)",
              }}
            >
              Godziny pracy (typ „praca”): <strong>{sumaPracy.toFixed(2)} h</strong>
            </div>
            <div
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "10px",
                border: "1px solid rgba(148,163,184,0.25)",
                background: "rgba(15,23,42,0.45)",
              }}
            >
              Łącznie (wszystkie typy): <strong>{sumaWszystkich.toFixed(2)} h</strong>
            </div>
          </div>
          {krCzasPracyWpisyList.length === 0 ? (
            <p style={{ ...op.muted, marginBottom: "1rem" }}>
              Brak wpisów z tym KR — w module Czas pracy dodaj blok z wybranym kodem projektu (pole KR).
            </p>
          ) : (
            <div style={{ ...s.tableWrap, marginBottom: "1.25rem", borderRadius: "12px", overflow: "hidden" }}>
              <table style={{ ...s.table, fontSize: "0.82rem" }}>
                <thead>
                  <tr>
                    <th style={s.th}>Data</th>
                    <th style={s.th}>Pracownik</th>
                    <th style={s.th}>Typ</th>
                    <th style={s.th}>Zadanie</th>
                    <th style={s.th}>Godz.</th>
                    <th style={s.th}>Uwagi</th>
                  </tr>
                </thead>
                <tbody>
                  {krCzasPracyWpisyList.map((row) => {
                    const h = (Number(row.godziny) || 0) + (Number(row.nadgodziny) || 0);
                    const typLbl = String(row.typ ?? "—").replace(/_/g, " ");
                    return (
                      <tr key={row.id}>
                        <td style={s.td}>{row.data ? dataDoInputa(row.data) : "—"}</td>
                        <td style={s.td}>{nazwaPrac(row.pracownik_nr)}</td>
                        <td style={s.td}>
                          <span
                            style={{
                              ...op.badge(
                                grupaTypuCzasuWpisu(row.typ) === "nieobecnosc"
                                  ? "rgba(244,114,182,0.2)"
                                  : grupaTypuCzasuWpisu(row.typ) === "praca"
                                    ? "rgba(251,191,36,0.18)"
                                    : "rgba(148,163,184,0.15)",
                                grupaTypuCzasuWpisu(row.typ) === "nieobecnosc"
                                  ? "#f9a8d4"
                                  : "#fde68a"
                              ),
                              fontSize: "0.75rem",
                            }}
                          >
                            {typLbl}
                          </span>
                        </td>
                        <td style={{ ...s.td, maxWidth: "14rem", wordBreak: "break-word", fontSize: "0.8rem" }}>
                          {String(row.wykonywane_zadanie ?? "").trim() ? row.wykonywane_zadanie.trim() : "—"}
                        </td>
                        <td style={{ ...s.td, fontVariantNumeric: "tabular-nums" }}>{h.toFixed(2)}</td>
                        <td style={{ ...s.td, maxWidth: "18rem", wordBreak: "break-word" }}>
                          {row.uwagi?.trim() ? row.uwagi.trim() : "—"}
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

    if (sekcja === "faktury") {
      const krK = String(item.kr ?? "").trim();
      return (
        <div style={{ ...op.sectionCard, borderStyle: "solid", borderColor: "rgba(148,163,184,0.18)" }}>
          <h3 style={{ ...op.sectionTitle, marginTop: 0 }}>Faktury kosztowe — do opłacenia (zgłoszenie)</h3>
          <p style={{ ...op.muted, marginBottom: "0.85rem", fontSize: "0.8rem", lineHeight: 1.5 }}>
            <strong>Nie mylić z FS:</strong> faktury <strong>sprzedażowe</strong> są przy etapach i pulpicie (
            <strong>INV</strong>). Tu pracownik zgłasza <strong>koszt do przelewu</strong> — wpisy ze statusem „do
            opłacenia” widać na panelu głównym dla księgowości.
          </p>
          {krFakturyDoZaplatyFetchError ? (
            <div style={{ ...s.errBox, marginBottom: "1rem" }} role="alert">
              <strong>Nie wczytano listy zgłoszeń.</strong> {krFakturyDoZaplatyFetchError}
              <br />
              <span style={{ fontSize: "0.88em" }}>
                Uruchom <code style={s.code}>kr-faktura-do-zaplaty.sql</code> i RLS dla{" "}
                <code style={s.code}>kr_faktura_do_zaplaty</code>.
              </span>
            </div>
          ) : null}

          {krFakturyDoZaplatyList.length === 0 ? (
            <p style={{ ...op.muted, marginBottom: "1rem" }}>Brak zgłoszeń dla tego KR — dodaj pierwsze poniżej.</p>
          ) : (
            <div style={{ ...s.tableWrap, marginBottom: "1.25rem", borderRadius: "12px", overflow: "hidden" }}>
              <table style={{ ...s.table, fontSize: "0.82rem" }}>
                <thead>
                  <tr>
                    <th style={s.th}>Data</th>
                    <th style={s.th}>Komu</th>
                    <th style={s.th}>Konto</th>
                    <th style={s.th}>Brutto</th>
                    <th style={s.th}>Nr faktury</th>
                    <th style={s.th}>Link</th>
                    <th style={s.th}>Zgłosił</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Notatki</th>
                  </tr>
                </thead>
                <tbody>
                  {krFakturyDoZaplatyList.map((row) => {
                    const nt = kmTekstDoKomorki(row.notatki);
                    const st = String(row.status ?? "do_zaplaty").trim();
                    const opl = st === "oplacone";
                    return (
                      <tr
                        key={row.id}
                        style={
                          st === "do_zaplaty"
                            ? { background: "rgba(251,191,36,0.1)", boxShadow: "inset 3px 0 0 #fbbf24" }
                            : undefined
                        }
                      >
                        <td style={s.td}>
                          {row.created_at
                            ? new Date(row.created_at).toLocaleString("pl-PL", { dateStyle: "short" })
                            : "—"}
                        </td>
                        <td style={s.td}>
                          <strong style={{ color: opl ? "#94a3b8" : "#f8fafc" }}>{row.komu?.trim() || "—"}</strong>
                        </td>
                        <td style={{ ...s.td, fontFamily: "ui-monospace, monospace", fontSize: "0.78rem" }}>
                          {row.nr_konta?.trim() ? row.nr_konta : "—"}
                        </td>
                        <td style={{ ...s.td, fontWeight: 600, color: opl ? "#86efac" : "#fde68a" }}>
                          {kwotaBruttoEtykieta(row.kwota_brutto)}
                        </td>
                        <td style={s.td}>{row.numer_faktury?.trim() ? row.numer_faktury : "—"}</td>
                        <td style={s.td}>
                          {row.link_faktury?.trim() ? (
                            <a
                              href={hrefLinkuZewnetrznego(row.link_faktury)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#7dd3fc" }}
                            >
                              otwórz
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td style={s.td}>
                          {podpisOsobyProwadzacej(row.zgloszil_pracownik_nr, mapaProwadzacychId) ?? "—"}
                        </td>
                        <td style={s.td}>
                          <select
                            style={{ ...s.input, padding: "0.25rem 0.35rem", fontSize: "0.78rem", minWidth: "8.5rem" }}
                            value={FAKTURA_DO_ZAPLATY_STATUS_W_BAZIE.includes(st) ? st : "do_zaplaty"}
                            onChange={(ev) => void zapiszStatusKrFakturaDoZaplaty(row.id, ev.target.value, krK)}
                          >
                            {FAKTURA_DO_ZAPLATY_STATUS_W_BAZIE.map((v) => (
                              <option key={v} value={v}>
                                {etykietaFakturyDoZaplatyStatus(v)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={s.td} title={nt.title}>
                          {nt.text}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e2e8f0", margin: "0 0 0.65rem" }}>
            Nowe zgłoszenie (projekt {krK})
          </h4>
          <form style={{ ...s.form, maxWidth: "min(40rem, 100%)" }} onSubmit={(e) => void zapiszKrFakturaDoZaplaty(e, krK)}>
            <label style={s.label}>
              Komu / odbiorca przelewu <span style={{ color: "#fca5a5" }}>*</span>
              <input
                style={s.input}
                type="text"
                value={fakturaDoZaplatyForm.komu}
                onChange={(ev) => setFakturaDoZaplatyForm((f) => ({ ...f, komu: ev.target.value }))}
                required
                placeholder="np. nazwa firmy z faktury"
              />
            </label>
            <label style={s.label}>
              Nr konta bankowego
              <input
                style={s.input}
                type="text"
                value={fakturaDoZaplatyForm.nr_konta}
                onChange={(ev) => setFakturaDoZaplatyForm((f) => ({ ...f, nr_konta: ev.target.value }))}
                placeholder="np. 12 3456…"
              />
            </label>
            <label style={s.label}>
              Kwota brutto <span style={{ color: "#fca5a5" }}>*</span>
              <input
                style={s.input}
                type="text"
                inputMode="decimal"
                value={fakturaDoZaplatyForm.kwota_brutto}
                onChange={(ev) => setFakturaDoZaplatyForm((f) => ({ ...f, kwota_brutto: ev.target.value }))}
                required
                placeholder="np. 1234,56"
              />
            </label>
            <label style={s.label}>
              Nr faktury (opcjonalnie)
              <input
                style={s.input}
                type="text"
                value={fakturaDoZaplatyForm.numer_faktury}
                onChange={(ev) => setFakturaDoZaplatyForm((f) => ({ ...f, numer_faktury: ev.target.value }))}
              />
            </label>
            <label style={s.label}>
              Link do faktury / skanu (opcjonalnie)
              <input
                style={s.input}
                type="url"
                value={fakturaDoZaplatyForm.link_faktury}
                onChange={(ev) => setFakturaDoZaplatyForm((f) => ({ ...f, link_faktury: ev.target.value }))}
                placeholder="https://…"
              />
            </label>
            <label style={s.label}>
              Zgłasza — <code style={s.code}>pracownik.nr</code>
              <select
                style={s.input}
                value={String(fakturaDoZaplatyForm.zgloszil_pracownik_nr ?? "")}
                onChange={(ev) =>
                  setFakturaDoZaplatyForm((f) => ({ ...f, zgloszil_pracownik_nr: ev.target.value }))
                }
              >
                <option value="">— bez wyboru —</option>
                {(() => {
                  const cur = String(fakturaDoZaplatyForm.zgloszil_pracownik_nr ?? "").trim();
                  const nrs = new Set(pracownicyPosortowani.map((p) => String(p.nr)));
                  const orphan = cur !== "" && !nrs.has(cur);
                  return (
                    <>
                      {orphan ? (
                        <option value={cur}>{cur} (nie w liście)</option>
                      ) : null}
                      {pracownicyPosortowani.map((p) => (
                        <option key={String(p.nr)} value={String(p.nr)}>
                          {String(p.nr)} — {p.imie_nazwisko ?? ""}
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </label>
            <label style={s.label}>
              Notatki (opcjonalnie)
              <textarea
                style={{ ...s.input, minHeight: "2.8rem" }}
                value={fakturaDoZaplatyForm.notatki}
                onChange={(ev) => setFakturaDoZaplatyForm((f) => ({ ...f, notatki: ev.target.value }))}
                rows={2}
              />
            </label>
            <div style={s.btnRow}>
              <button type="submit" style={s.btn}>
                Zgłoś do opłacenia
              </button>
            </div>
          </form>

          <OpFutureModule title="Szersza ewidencja kosztów (później)">
            Kategorie kosztów, powiązanie z PW, netto / VAT, terminy płatności — można rozwinąć obok tej tabeli.
          </OpFutureModule>
        </div>
      );
    }

    if (sekcja === "terminy") {
      const rows = [];
      if (item.data_rozpoczecia)
        rows.push({ t: "Data rozpoczęcia (KR)", d: item.data_rozpoczecia });
      if (item.okres_projektu_od) rows.push({ t: "Okres projektu — od", d: item.okres_projektu_od });
      if (item.okres_projektu_do) rows.push({ t: "Okres projektu — do", d: item.okres_projektu_do });
      for (const e of listaEtapow) {
        if (e.data_planowana) rows.push({ t: `Etap: ${e.etap ?? "—"}`, d: e.data_planowana });
      }
      for (const z of krZleceniaPwList) {
        if (z.termin_zlecenia)
          rows.push({ t: `PW: ${z.numer_zlecenia?.trim() ? z.numer_zlecenia : "zlecenie"}`, d: z.termin_zlecenia });
      }
      rows.sort((a, b) => {
        const x = dataDoSortuYYYYMMDD(a.d) ?? "";
        const y = dataDoSortuYYYYMMDD(b.d) ?? "";
        return x.localeCompare(y);
      });
      return (
        <>
          <h3 style={{ ...op.sectionTitle, fontSize: "0.95rem" }}>Harmonogram terminów</h3>
          {rows.length === 0 ? (
            <p style={{ ...op.muted, margin: 0 }}>Brak zapisanych terminów dla tego projektu.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {rows.map((r, i) => {
                const stl = stylTerminuHarmonogramu(r.d, d0);
                return (
                  <li
                    key={`${r.t}-${i}`}
                    style={{
                      ...stl,
                      padding: "0.65rem 0.85rem",
                      marginBottom: "0.4rem",
                      borderRadius: "12px",
                      fontSize: "0.82rem",
                    }}
                  >
                    <strong>{r.t}</strong> — {dataPLZFormat(dataDoSortuYYYYMMDD(r.d) ?? "")}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      );
    }

    if (sekcja === "zgloszenia") {
      return (
        <>
          <div style={s.btnRow}>
            <button type="button" style={s.btn} onClick={() => otworzLogDlaKr(item, { hub: true })}>
              Pełny widok z formularzem (LOG)
            </button>
          </div>
          {logOrd.length === 0 ? (
            <p style={{ ...op.muted, marginTop: "0.75rem" }}>Brak zgłoszeń dla tego KR.</p>
          ) : (
            <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {logOrd.map((row) => {
                const uw = pulpitLogWymagaUwagi(row);
                return (
                  <div
                    key={row.id}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "14px",
                      border: uw ? "1px solid rgba(251,191,36,0.35)" : "1px solid rgba(148,163,184,0.12)",
                      background: uw ? "rgba(251,191,36,0.06)" : "rgba(15,23,42,0.5)",
                    }}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.35rem" }}>
                      <span style={op.badge("rgba(56,189,248,0.22)", "#bae6fd")}>
                        {row.typ_zdarzenia ?? "—"}
                      </span>
                      <span style={op.badge("rgba(52,211,153,0.15)", "#a7f3d0")}>
                        {row.status_zdarzenia?.trim() ? row.status_zdarzenia : "—"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {row.data_zdarzenia != null && String(row.data_zdarzenia).trim() !== ""
                          ? dataDoInputa(row.data_zdarzenia)
                          : "—"}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 0.45rem", color: "#e2e8f0", fontSize: "0.85rem" }}>
                      {row.opis?.trim() ? row.opis : "—"}
                    </p>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.45 }}>
                      <div>
                        Zgłaszający:{" "}
                        {podpisOsobyProwadzacej(row.osoba_zglaszajaca, mapaProwadzacychId) ?? "—"}
                      </div>
                      <div>
                        Wymagane działanie: {row.wymagane_dzialanie?.trim() ? row.wymagane_dzialanie : "—"}
                      </div>
                      <div>
                        Odpowiedzialny:{" "}
                        {podpisOsobyProwadzacej(row.osoba_odpowiedzialna_za_zadanie, mapaProwadzacychId) ??
                          "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      );
    }

    if (sekcja === "ryzyka") {
      const lista = [];
      if (pulpitKrRekordWymagaUwagi(item))
        lista.push({
          pr: "Wysoki",
          txt: "Projekt oczekuje na decyzję zleceniodawcy.",
          onNavigate: () => przejdzDoSekcjiKr(item, "przeglad"),
        });
      for (const e of listaEtapow) {
        if (pulpitKmWymagaUwagi(e, d0))
          lista.push({
            pr: pulpitKmPlanPrzeterminowany(e, d0) ? "Krytyczny" : "Ważny",
            txt: `Etap „${e.etap ?? "—"}” — zagrożenie lub termin.`,
            onNavigate: () => przejdzDoSekcjiKr(item, "etapy", { otworzKm: e }),
          });
      }
      for (const row of dziennikWpisy) {
        if (pulpitLogWymagaUwagi(row))
          lista.push({
            pr: "Ważny",
            txt: `Zgłoszenie (${row.typ_zdarzenia ?? "—"}) wymaga domknięcia.`,
            onNavigate: () => otworzLogDlaKr(item, { hub: true, edytujRow: row }),
          });
      }
      for (const z of krZleceniaPwList) {
        if (pulpitPwWymagaUwagi(z, d0))
          lista.push({
            pr: "Krytyczny",
            txt: `Zlecenie PW po terminie — ${z.numer_zlecenia ?? "—"}.`,
            onNavigate: () => przejdzDoSekcjiKr(item, "zlecenia"),
          });
      }
      return (
        <>
          <h3 style={{ ...op.sectionTitle }}>Panel ryzyk</h3>
          {trybHelp ? (
            <p style={{ ...op.muted, margin: "0 0 0.65rem", fontSize: "0.8rem" }}>
              Kliknij pozycję — przejdziesz do etapów, zgłoszeń (LOG), zleceń PW lub przeglądu projektu.
            </p>
          ) : null}
          {lista.length === 0 ? (
            <p style={{ ...op.muted, margin: 0 }}>Brak pozycji spełniających reguły ryzyka — utrzymuj tak dalej.</p>
          ) : (
            lista.map((x, i) => (
              <button
                key={i}
                type="button"
                onClick={x.onNavigate}
                title="Przejdź do szczegółów"
                style={{
                  ...op.alertRow(x.pr === "Krytyczny" ? "krytyczny" : "wazny"),
                  display: "block",
                  width: "100%",
                  cursor: "pointer",
                  font: "inherit",
                  textAlign: "left",
                  boxSizing: "border-box",
                }}
              >
                <strong>{x.pr}</strong> — {x.txt}
              </button>
            ))
          )}
        </>
      );
    }

    if (sekcja === "zespol") {
      const linie = [];
      const p = podpisOsobyProwadzacej(item.osoba_prowadzaca, mapaProwadzacychId);
      if (p) linie.push({ r: "Prowadzenie projektu", o: p });
      for (const e of listaEtapow) {
        if (tekstTrim(e.osoba_odpowiedzialna))
          linie.push({ r: `Etap: ${e.etap ?? "—"}`, o: String(e.osoba_odpowiedzialna) });
      }
      for (const row of dziennikWpisy) {
        const zg = podpisOsobyProwadzacej(row.osoba_zglaszajaca, mapaProwadzacychId);
        const od = podpisOsobyProwadzacej(row.osoba_odpowiedzialna_za_zadanie, mapaProwadzacychId);
        if (zg) linie.push({ r: "Zgłoszenie — zgłaszający", o: zg });
        if (od) linie.push({ r: "Zgłoszenie — odpowiedzialny", o: od });
      }
      for (const z of krZleceniaPwList) {
        const w = podpisOsobyProwadzacej(z.pracownik_weryfikacja, mapaProwadzacychId);
        if (w) linie.push({ r: `PW ${z.numer_zlecenia ?? ""} — weryfikacja`, o: w });
      }
      return (
        <>
          <h3 style={{ ...op.sectionTitle }}>Zespół i odpowiedzialności</h3>
          {linie.length === 0 ? (
            <p style={{ ...op.muted, margin: 0 }}>Brak przypisanych osób w danych projektu.</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {linie.map((ln, i) => (
                <li
                  key={i}
                  style={{
                    padding: "0.55rem 0.75rem",
                    marginBottom: "0.35rem",
                    borderRadius: "10px",
                    border: "1px solid rgba(148,163,184,0.12)",
                    background: "rgba(15,23,42,0.45)",
                    fontSize: "0.82rem",
                    color: "#cbd5e1",
                  }}
                >
                  <span style={{ color: "#94a3b8" }}>{ln.r}: </span>
                  <strong style={{ color: "#f1f5f9" }}>{ln.o}</strong>
                </li>
              ))}
            </ul>
          )}
        </>
      );
    }

    if (sekcja === "zlecenia") {
      return (
        <>
          <div style={s.btnRow}>
            <button type="button" style={s.btn} onClick={() => otworzPwDlaKr(item, { hub: true })}>
              Pełna tabela i formularz PW
            </button>
          </div>
          {krZleceniaPwList.length === 0 ? (
            <p style={{ ...op.muted, marginTop: "0.75rem" }}>Brak zleceń PW przypisanych do tego KR.</p>
          ) : (
            <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.55rem" }}>
              {krZleceniaPwList.map((z) => {
                const firma =
                  z.podwykonawca && typeof z.podwykonawca === "object" && !Array.isArray(z.podwykonawca)
                    ? z.podwykonawca.nazwa_firmy
                    : "—";
                const zak = kmTekstDoKomorki(z.opis_zakresu);
                return (
                  <div
                    key={z.id}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "14px",
                      border: pulpitPwWymagaUwagi(z, d0)
                        ? "1px solid rgba(248,113,113,0.4)"
                        : "1px solid rgba(148,163,184,0.12)",
                      background: "rgba(15,23,42,0.5)",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#f8fafc" }}>
                      {z.numer_zlecenia?.trim() ? z.numer_zlecenia : "—"}{" "}
                      <span style={{ fontWeight: 500, color: "#94a3b8" }}>· {firma}</span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#cbd5e1", marginTop: "0.35rem" }} title={zak.title}>
                      {zak.text}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "0.35rem" }}>
                      Termin: {z.termin_zlecenia ? dataDoInputa(z.termin_zlecenia) : "—"} · Status:{" "}
                      {z.status?.trim() ? z.status : "—"} · Netto: {krZleceniePwKwotaEtykieta(z.cena_netto)}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#64748b" }}>
                      Weryfikacja: {podpisOsobyProwadzacej(z.pracownik_weryfikacja, mapaProwadzacychId) ?? "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      );
    }

    if (sekcja === "podwykonawcy") {
      return (
        <>
          <div style={s.btnRow}>
            <button type="button" style={s.btn} onClick={() => otworzPwDlaKr(item, { hub: true })}>
              Pełna lista PW z edycją
            </button>
          </div>
          {krZleceniaPwList.length === 0 ? (
            <p style={{ ...op.muted, marginTop: "0.75rem" }}>Brak podwykonawców / zleceń przy tym KR.</p>
          ) : (
            <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.55rem" }}>
              {krZleceniaPwList.map((z) => {
                const pw = z.podwykonawca && typeof z.podwykonawca === "object" && !Array.isArray(z.podwykonawca) ? z.podwykonawca : null;
                return (
                  <div
                    key={z.id}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "14px",
                      border: "1px solid rgba(148,163,184,0.12)",
                      background: "rgba(15,23,42,0.5)",
                      fontSize: "0.82rem",
                      color: "#e2e8f0",
                    }}
                  >
                    <strong>{pw?.nazwa_firmy?.trim() ? pw.nazwa_firmy : "—"}</strong>
                    <div style={{ color: "#94a3b8", marginTop: "0.35rem" }}>
                      Kontakt: {pw?.osoba_kontaktowa?.trim() || "—"} · Tel: {pw?.telefon?.trim() || "—"} · E-mail
                      (faktury): {tekstTrim(z.osoba_faktury_email) || "—"}
                    </div>
                    <div style={{ marginTop: "0.35rem", color: "#64748b" }}>
                      Zlecenie {z.numer_zlecenia ?? "—"} · Termin:{" "}
                      {z.termin_zlecenia ? dataDoInputa(z.termin_zlecenia) : "—"} · Odebrane:{" "}
                      {z.czy_odebrane === true ? "tak" : "nie"} · Sprawdzone: {z.czy_sprawdzone === true ? "tak" : "nie"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      );
    }

    return null;
  }

  if (requireAuth) {
    if (!authReady) {
      return (
        <div
          style={{
            ...s.page,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <p style={s.muted}>Ładowanie…</p>
        </div>
      );
    }

    if (!session?.user) {
      return <AuthScreen />;
    }
    if (wymusNoweHasloPoReset) {
      return (
        <AuthScreen
          trybNoweHasloPoLinkuZEmaila
          onNoweHasloZapisane={() => {
            setWymusNoweHasloPoReset(false);
            try {
              const u = new URL(window.location.href);
              u.hash = "";
              window.history.replaceState(null, "", u.pathname + u.search);
            } catch {
              /* ignore */
            }
          }}
        />
      );
    }
  }

  return (
    <div style={op.shellOuter}>
      <div style={op.shellLayout}>
        <main style={op.shellMain}>
          <header style={{ marginBottom: "1.35rem" }}>
            <PasekWersjiG4
              style={{
                ...op.muted,
                fontSize: "0.75rem",
                marginBottom: "0.35rem",
                letterSpacing: "0.02em",
              }}
            />
            <h1 style={op.brandTitle}>
              <span style={{ color: theme.danger }}>G</span>
              4 Geodezja · Panel przepływu informacji
            </h1>
          </header>
          {requireAuth && session?.user ? (
            <div style={{ width: "100%", marginBottom: "0.75rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.65rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    ...op.muted,
                    fontSize: "0.8rem",
                    textAlign: "right",
                    lineHeight: 1.45,
                    maxWidth: "min(100%, 22rem)",
                  }}
                  title={session.user.email ?? ""}
                >
                  <span style={{ display: "block", color: theme.text, fontWeight: 600 }}>
                    {pracownikPowiazanyZSesja?.imie_nazwisko?.trim()
                      ? pracownikPowiazanyZSesja.imie_nazwisko.trim()
                      : session.user.email}
                  </span>
                  {pracownikPowiazanyZSesja?.imie_nazwisko?.trim() ? (
                    <span style={{ display: "block", fontSize: "0.76rem", marginTop: "0.12rem" }}>
                      {session.user.email}
                    </span>
                  ) : null}
                  {pracownikPowiazanyZSesja ? (
                    etykietaDzialuPracownika(pracownikPowiazanyZSesja.dzial) ? (
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.78rem",
                          marginTop: "0.25rem",
                          fontWeight: 600,
                          ...s.dzialWartosc,
                        }}
                      >
                        Dział: {etykietaDzialuPracownika(pracownikPowiazanyZSesja.dzial)}
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.76rem",
                          marginTop: "0.25rem",
                          color: theme.muted,
                        }}
                      >
                        Dział: nie uzupełniony w Zespół
                      </span>
                    )
                  ) : initialFetchDone ? (
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.72rem",
                        marginTop: "0.25rem",
                        color: "#fca5a5",
                      }}
                    >
                      Brak powiązania z kartoteką — ustaw <code style={s.code}>auth_user_id</code> w{" "}
                      <code style={s.code}>pracownik</code>
                    </span>
                  ) : null}
                </span>
                {czyAdminAktywny ? (
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2rem",
                      fontSize: "0.72rem",
                      color: theme.muted,
                      minWidth: "min(16rem, 100%)",
                    }}
                  >
                    Podgląd jako użytkownik
                    <select
                      value={adminPodgladPracownikNr}
                      onChange={(ev) => setAdminPodgladPracownikNr(ev.target.value)}
                      style={{
                        padding: "0.4rem 0.5rem",
                        borderRadius: "8px",
                        border: `1px solid ${theme.border}`,
                        background: theme.surface,
                        color: theme.text,
                        fontSize: "0.8rem",
                      }}
                    >
                      <option value="">— Ja (normalny widok) —</option>
                      {pracownicyPosortowani.map((p) => (
                        <option key={String(p.nr)} value={String(p.nr ?? "").trim()}>
                          {String(p.imie_nazwisko ?? "").trim() || "—"} (nr {String(p.nr ?? "").trim()})
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <button type="button" style={s.btnGhost} onClick={() => void supabase.auth.signOut()}>
                  Wyloguj
                </button>
              </div>
              {podgladJakoInny ? (
                <div
                  role="status"
                  style={{
                    marginTop: "0.65rem",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "10px",
                    border: "1px solid rgba(251, 191, 36, 0.45)",
                    background: "rgba(251, 191, 36, 0.1)",
                    color: theme.text,
                    fontSize: "0.84rem",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "0.65rem",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    <strong>Podgląd roboczy</strong> — widzisz pulpit i dokumenty tak jak{" "}
                    <strong>
                      {pracownikWidokEfektywny?.imie_nazwisko?.trim() || "—"} (nr{" "}
                      {pracownikWidokEfektywny?.nr != null ? String(pracownikWidokEfektywny.nr).trim() : "—"})
                    </strong>
                    . Nie wylogowujesz się z konta administratora.
                  </span>
                  <button
                    type="button"
                    style={{ ...s.btnGhost, flexShrink: 0 }}
                    onClick={() => setAdminPodgladPracownikNr("")}
                  >
                    Zakończ podgląd
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {requireAuth && session?.user && !initialFetchDone ? (
            <p style={{ ...op.muted, margin: "0 0 1rem", fontSize: "0.9rem" }} role="status">
              Ładowanie danych z bazy…
            </p>
          ) : null}

      {(widok === "kr" ||
        widok === "dashboard" ||
        widok === "ostrzezenia") &&
      (krFetchError || etapyFetchError) ? (
        <div style={s.errBox} role="alert">
          <strong>Błąd pobierania z Supabase.</strong>
          <br />
          {krFetchError ? <>KR: {krFetchError}<br /></> : null}
          {etapyFetchError ? <>Etapy: {etapyFetchError}</> : null}
        </div>
      ) : null}

      {widok === "dashboard" ? (
        <>
          <div style={op.heroCard}>
            <div
              role="button"
              tabIndex={0}
              title="Kliknij: moduł Ostrzeżenia"
              onClick={() => przejdzDoOstrzezeniaPanel()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  przejdzDoOstrzezeniaPanel();
                }
              }}
              style={{
                cursor: "pointer",
                outline: "none",
                margin: "-0.35rem",
                padding: "0.35rem",
                borderRadius: "10px",
                marginBottom: "0.65rem",
              }}
            >
              <h2 style={{ ...op.sectionTitle, marginTop: 0 }}>Stan operacyjny</h2>
              {trybHelp ? (
                <p style={{ ...op.muted, marginBottom: 0, maxWidth: "42rem" }}>
                  Skrót sytuacji w firmie — liczby z aktualnej bazy. Szczegóły ryzyk otwierasz w{" "}
                  <strong style={{ color: "#fde68a" }}>Ostrzeżeniach</strong> lub na kartach projektów.
                </p>
              ) : null}
            </div>
            {requireAuth && session?.user ? (
              <div
                style={{
                  ...op.sectionCard,
                  marginBottom: "1rem",
                  borderStyle: "solid",
                  borderColor: "rgba(148,163,184,0.15)",
                }}
              >
                <h2 style={{ ...op.sectionTitle, marginTop: 0, fontSize: "1.05rem" }}>
                  {podgladJakoInny ? "Zakres użytkownika (podgląd)" : "Twój zakres"}
                </h2>
                {pracownikPowiazanyZSesja ? (
                  <>
                    {trybHelp ? (
                      <p style={{ ...op.muted, marginTop: 0, marginBottom: "0.85rem", fontSize: "0.86rem" }}>
                        {podgladJakoInny ? (
                          <>
                            Podgląd dla ID{" "}
                            <strong style={{ color: theme.text }}>
                              {pracownikWidokEfektywny?.nr != null
                                ? String(pracownikWidokEfektywny.nr).trim()
                                : "—"}
                            </strong>
                            — zadania (odpowiedzialny / zlecający), KR (osoba prowadząca), etapy (osoba odpowiedzialna).
                          </>
                        ) : (
                          <>
                            Przypisane do Twojego ID{" "}
                            <strong style={{ color: theme.text }}>{String(pracownikPowiazanyZSesja.nr).trim()}</strong>:
                            zadania (jako odpowiedzialny lub zlecający), projekty KR (osoba prowadząca), etapy (osoba
                            odpowiedzialna).
                          </>
                        )}
                      </p>
                    ) : null}
                    <div style={{ ...op.kpiGrid, marginBottom: "1rem" }}>
                      <OpKpiCard
                        label="Moje zadania"
                        value={dashboardMojeZadania.length}
                        hint="Filtr po Twoim numerze ID"
                        accent="action"
                        border="rgba(249,115,22,0.3)"
                        onClick={() =>
                          przejdzDoZadanDlaNr(pracownikPowiazanyZSesja ? String(pracownikPowiazanyZSesja.nr).trim() : "")
                        }
                        title="Otwórz moduł zadań z filtrem"
                      />
                      <OpKpiCard
                        label="Moje KR (prowadzę)"
                        value={dashboardMojeKr.length}
                        hint="Osoba prowadząca = Twoje ID"
                        accent="success"
                        border="rgba(34,197,94,0.28)"
                        onClick={przejdzDoKr}
                        title="Lista projektów — wybierz swój w panelu"
                      />
                      <OpKpiCard
                        label="Moje etapy"
                        value={dashboardMojeEtapy.length}
                        hint="Osoba odpowiedzialna = Twoje ID"
                        accent="action"
                        border="rgba(56,189,248,0.25)"
                        onClick={przejdzDoKr}
                        title="Szczegóły przy projekcie — zakładka etapów"
                      />
                      <OpKpiCard
                        label="Moje dokumenty"
                        value="→"
                        hint="Import z Box (nazwa pliku), skrót do arkusza"
                        accent="default"
                        border="rgba(148,163,184,0.2)"
                        onClick={przejdzDoMojeDokumenty}
                        title="Panel dokumentów pracownika"
                      />
                    </div>
                    {dashboardMojeZadania.length > 0 ? (
                      <div style={{ marginBottom: "1rem" }}>
                        <h3 style={{ ...op.sectionTitle, fontSize: "0.88rem", marginBottom: "0.5rem" }}>
                          Zadania (skrót)
                        </h3>
                        <ul
                          style={{
                            margin: 0,
                            padding: 0,
                            listStyle: "none",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.4rem",
                          }}
                        >
                          {dashboardMojeZadania.slice(0, 6).map((z) => {
                            const zt = kmTekstDoKomorki(z.zadanie);
                            return (
                              <li key={z.id}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    przejdzDoZadanDlaNr(
                                      pracownikWidokEfektywny?.nr != null
                                        ? String(pracownikWidokEfektywny.nr).trim()
                                        : "",
                                    )
                                  }
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "0.55rem 0.65rem",
                                    borderRadius: "10px",
                                    border: `1px solid ${theme.border}`,
                                    background: theme.surface,
                                    color: theme.text,
                                    fontSize: "0.82rem",
                                    cursor: "pointer",
                                  }}
                                >
                                  {z.kr ? (
                                    <span style={{ color: theme.action, fontWeight: 700 }}>{String(z.kr).trim()} </span>
                                  ) : null}
                                  <span title={zt.title}>{zt.text}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                        {dashboardMojeZadania.length > 6 ? (
                          <p style={{ ...op.muted, fontSize: "0.75rem", margin: "0.45rem 0 0" }}>
                            +{dashboardMojeZadania.length - 6} więcej — zobacz w module Zadania.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {dashboardMojeKr.length > 0 ? (
                      <div style={{ marginBottom: "1rem" }}>
                        <h3 style={{ ...op.sectionTitle, fontSize: "0.88rem", marginBottom: "0.5rem" }}>
                          KR, które prowadzisz
                        </h3>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                          {dashboardMojeKr.slice(0, 8).map((row) => (
                            <button
                              key={String(row.kr)}
                              type="button"
                              onClick={() => wybierzKrWPanelu(row)}
                              style={{
                                ...s.btnGhost,
                                fontSize: "0.8rem",
                                padding: "0.35rem 0.65rem",
                              }}
                            >
                              {String(row.kr).trim()}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {dashboardMojeEtapy.length > 0 ? (
                      <div style={{ marginBottom: 0 }}>
                        <h3 style={{ ...op.sectionTitle, fontSize: "0.88rem", marginBottom: "0.5rem" }}>
                          Etapy z Twoją odpowiedzialnością
                        </h3>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: "0.82rem", color: theme.muted }}>
                          {dashboardMojeEtapy.slice(0, 8).map((e) => {
                            const rek = krList.find((k) => String(k.kr) === String(e.kr));
                            return (
                              <li key={e.id} style={{ marginBottom: "0.35rem" }}>
                                <button
                                  type="button"
                                  onClick={() => rek && wybierzKrWPanelu(rek)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    cursor: rek ? "pointer" : "default",
                                    color: rek ? theme.action : theme.muted,
                                    font: "inherit",
                                    textAlign: "left",
                                    textDecoration: rek ? "underline" : "none",
                                  }}
                                >
                                  <strong>{String(e.kr).trim()}</strong> — {e.etap ?? "—"}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                  </>
                ) : initialFetchDone ? (
                  <p style={{ ...op.muted, margin: 0, fontSize: "0.86rem" }}>
                    Nie znaleziono powiązania konta z tabelą <code style={s.code}>pracownik</code>. Ustaw kolumnę{" "}
                    <code style={s.code}>auth_user_id</code> (UUID z Authentication → Users) przy swoim rekordzie.
                  </p>
                ) : null}
              </div>
            ) : null}
            <div style={{ ...op.muted, fontSize: "0.78rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
              Skróty:{" "}
              <button
                type="button"
                onClick={przejdzDoPodwykonawcow}
                style={{
                  background: "none",
                  border: "none",
                  color: theme.action,
                  cursor: "pointer",
                  font: "inherit",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                PW po terminie: {liczbaZlecenDoOdbioru}
              </button>
              {czyWidziNaprawyFloty ? (
                <>
                  {" · "}
                  <button
                    type="button"
                    onClick={przejdzDoSamochody}
                    style={{
                      background: "none",
                      border: "none",
                      color: theme.muted,
                      cursor: "pointer",
                      font: "inherit",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    Flota (naprawy): {samochodyWymagajaceNaprawyLista.length}
                  </button>
                </>
              ) : null}
              {" · "}
              <button
                type="button"
                onClick={przewinDoDashboardFakturyDoOplacenia}
                style={{
                  background: "none",
                  border: "none",
                  color: theme.muted,
                  cursor: "pointer",
                  font: "inherit",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                Faktury do opłacenia: {fakturyDoZaplatyOczekujaceList.length}
              </button>
            </div>
          </div>

          {fakturyDoZaplatyOczekujaceFetchError ? (
            <div style={{ ...s.errBox, marginBottom: "1rem" }} role="alert">
              <strong>Faktury do zapłaty (panel):</strong> {fakturyDoZaplatyOczekujaceFetchError}
              <br />
              <span style={{ fontSize: "0.88em" }}>
                Uruchom <code style={s.code}>kr-faktura-do-zaplaty.sql</code> i RLS dla{" "}
                <code style={s.code}>kr_faktura_do_zaplaty</code>.
              </span>
            </div>
          ) : null}

          <div style={op.sectionCard}>
            <h3 style={op.sectionTitle}>Najważniejsze dziś</h3>
            <ul style={{ margin: 0, paddingLeft: "1.15rem", color: "#cbd5e1", fontSize: "0.88rem", lineHeight: 1.6 }}>
              <li>
                <strong>{listaAlertowOperacyjnych.length}</strong> automatycznych alertów w systemie (zob. moduł
                Ostrzeżenia).
              </li>
              <li>
                Karty KR z oznaczeniem uwagi na liście: <strong>{liczbaTematowUwagi}</strong>.
              </li>
              <li>
                Zlecenia podwykonawcze wymagające domknięcia: <strong>{liczbaZlecenDoOdbioru}</strong>.
              </li>
              {czyWidziNaprawyFloty ? (
                <li>
                  Pojazdy z zapisem o wymaganej naprawie:{" "}
                  <strong
                    style={{
                      color: samochodyWymagajaceNaprawyLista.length ? "#fecaca" : "#e2e8f0",
                    }}
                  >
                    {samochodyWymagajaceNaprawyLista.length}
                  </strong>
                  {samochodyWymagajaceNaprawyLista.length
                    ? " — szczegóły w karcie „Flota” poniżej lub w zakładce Samochody."
                    : "."}
                </li>
              ) : null}
              <li>
                Faktury kosztowe oczekujące na przelew:{" "}
                <strong
                  style={{
                    color: fakturyDoZaplatyOczekujaceList.length ? "#fde68a" : "#e2e8f0",
                  }}
                >
                  {fakturyDoZaplatyOczekujaceList.length}
                </strong>
                {fakturyDoZaplatyOczekujaceList.length
                  ? " — lista w karcie „Księgowość” obok; status zmienisz w karcie projektu."
                  : "."}
              </li>
            </ul>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            <div
              id="dashboard-faktury-do-oplacenia"
              style={{
                scrollMarginTop: "0.85rem",
                ...op.sectionCard,
                ...(fakturyDoZaplatyOczekujaceList.length
                  ? {
                      borderColor: "rgba(251,191,36,0.45)",
                      boxShadow: "0 0 0 1px rgba(251,191,36,0.2)",
                      background: "linear-gradient(145deg, rgba(120,53,15,0.15), rgba(15,23,42,0.92))",
                    }
                  : {}),
              }}
            >
              <h3
                style={{
                  ...op.sectionTitle,
                  ...(fakturyDoZaplatyOczekujaceList.length ? { color: "#fde68a" } : {}),
                }}
              >
                Księgowość — faktury do opłacenia
              </h3>
              {fakturyDoZaplatyOczekujaceList.length === 0 ? (
                <p style={{ ...op.muted, margin: 0 }}>
                  Brak zgłoszeń ze statusem „do opłacenia”. Pracownik dodaje je w karcie projektu →{" "}
                  <strong>Faktury kosztowe</strong>.
                </p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "#fde68a", fontSize: "0.84rem" }}>
                  {fakturyDoZaplatyOczekujaceList.slice(0, 10).map((z) => (
                    <li key={z.id} style={{ marginBottom: "0.55rem" }}>
                      <button
                        type="button"
                        onClick={() => otworzKrZakladkaFakturyKosztowe(z.kr)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#fcd34d",
                          cursor: "pointer",
                          fontWeight: 700,
                          padding: 0,
                          textDecoration: "underline",
                          font: "inherit",
                        }}
                      >
                        {String(z.kr).trim()}
                      </button>
                      {" · "}
                      <strong>{z.komu?.trim() || "—"}</strong>
                      <span style={{ display: "block", color: "#fef3c7", fontSize: "0.8rem", marginTop: "0.15rem" }}>
                        {kwotaBruttoEtykieta(z.kwota_brutto)}
                        {z.nr_konta?.trim() ? ` · ${z.nr_konta}` : ""}
                        {z.link_faktury?.trim() ? (
                          <>
                            {" · "}
                            <a
                              href={hrefLinkuZewnetrznego(z.link_faktury)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#7dd3fc" }}
                            >
                              link
                            </a>
                          </>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {czyWidziNaprawyFloty ? (
            <div
              style={{
                ...op.sectionCard,
                ...(samochodyWymagajaceNaprawyLista.length
                  ? {
                      borderColor: "rgba(248,113,113,0.45)",
                      boxShadow: "0 0 0 1px rgba(248,113,113,0.15)",
                      background: "linear-gradient(145deg, rgba(127,29,29,0.12), rgba(15,23,42,0.92))",
                    }
                  : {}),
              }}
            >
              <h3
                style={{
                  ...op.sectionTitle,
                  ...(samochodyWymagajaceNaprawyLista.length ? { color: "#fecaca" } : {}),
                }}
              >
                Flota — wymagane naprawy
              </h3>
              {samochodyWymagajaceNaprawyLista.length === 0 ? (
                <p style={{ ...op.muted, margin: 0 }}>Brak zgłoszonych napraw (pole „wymagane naprawy” puste u wszystkich aut).</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "#fecaca", fontSize: "0.84rem" }}>
                  {samochodyWymagajaceNaprawyLista.slice(0, 8).map((car) => (
                    <li key={car.id} style={{ marginBottom: "0.5rem" }}>
                      <strong>{car.nazwa?.trim() || "Pojazd"}</strong>
                      {car.numer_rejestracyjny?.trim() ? ` · ${car.numer_rejestracyjny}` : ""}
                      {car.wymagane_naprawy?.trim() ? (
                        <span
                          style={{ display: "block", color: "#fca5a5", fontSize: "0.8rem", marginTop: "0.2rem", lineHeight: 1.4 }}
                        >
                          {car.wymagane_naprawy.trim().length > 140
                            ? `${car.wymagane_naprawy.trim().slice(0, 138)}…`
                            : car.wymagane_naprawy.trim()}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {samochodyWymagajaceNaprawyLista.length > 0 ? (
                <button
                  type="button"
                  style={{ ...s.btnGhost, marginTop: "0.85rem", fontSize: "0.8rem", borderColor: "rgba(248,113,113,0.35)" }}
                  onClick={przejdzDoSamochody}
                >
                  Otwórz Samochody
                </button>
              ) : null}
            </div>
            ) : null}
            <div style={op.sectionCard}>
              <h3 style={op.sectionTitle}>Terminy zagrożone</h3>
              {listaAlertowOperacyjnych.filter((a) => a.severity === "krytyczny").length === 0 ? (
                <p style={{ ...op.muted, margin: 0 }}>Brak krytycznych z automatycznej reguły — dobry znak.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", color: "#fecaca", fontSize: "0.84rem" }}>
                  {listaAlertowOperacyjnych
                    .filter((a) => a.severity === "krytyczny")
                    .slice(0, 6)
                    .map((a, i) => (
                      <li key={`k-${i}`} style={{ marginBottom: "0.4rem" }}>
                        <button
                          type="button"
                          onClick={() => przejdzZAlertuOperacyjnego(a.target)}
                          title="Przejdź do szczegółów"
                          style={{
                            margin: 0,
                            padding: 0,
                            border: "none",
                            background: "none",
                            color: "inherit",
                            font: "inherit",
                            textAlign: "left",
                            cursor: "pointer",
                            textDecoration: "underline",
                            textDecorationColor: "rgba(248,113,113,0.45)",
                            textUnderlineOffset: "0.15em",
                          }}
                        >
                          {a.text}
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <div style={op.sectionCard}>
              <h3 style={op.sectionTitle}>Ostatnie zgłoszenia</h3>
              <p style={{ ...op.muted, margin: 0 }}>
                Pełny podgląd zbiorczy zgłoszeń —{" "}
                <strong style={{ color: "#93c5fd" }}>pole gotowe pod wdrożenie</strong> (widok SQL lub synchronizacja
                dziennika). W projekcie zobaczysz listę w zakładce <em>Zgłoszenia</em>.
              </p>
            </div>
            <div style={op.sectionCard}>
              <h3 style={op.sectionTitle}>KR wymagające decyzji</h3>
              {krList.filter((r) => pulpitKrRekordWymagaUwagi(r)).length === 0 ? (
                <p style={{ ...op.muted, margin: 0 }}>Brak KR ze statusem „oczekuje na zamawiającego”.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "#fde68a", fontSize: "0.84rem" }}>
                  {krList
                    .filter((r) => pulpitKrRekordWymagaUwagi(r))
                    .slice(0, 6)
                    .map((r) => (
                      <li key={r.kr} style={{ marginBottom: "0.35rem" }}>
                        <strong>{r.kr}</strong>
                        {r.nazwa_obiektu ? ` — ${r.nazwa_obiektu}` : ""}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          <OpFutureModule title="Budżet / finanse projektu (koncepcja)">
            Karta na przyszłe KPI: budżet umowy, faktury wystawione, koszty podwykonawców, saldo. UI przygotowane —
            podłączenie pod tabele lub eksport z FK.
          </OpFutureModule>
          <OpFutureModule title="Roboczogodziny · teren (przyszły moduł)">
            Miejsce na ewidencję godzin i zadania terenowe — <strong>wersja koncepcyjna</strong>, bez zmian w bazie.
          </OpFutureModule>
        </>
      ) : null}

      {widok === "ostrzezenia" ? (
        <>
          <div style={op.heroCard}>
            <h2 style={{ ...op.sectionTitle, marginTop: 0 }}>Ostrzeżenia operacyjne</h2>
            <p style={{ ...op.muted, marginBottom: "1rem", maxWidth: "44rem" }}>
              Lista zbudowana automatycznie z danych już w systemie (KR, etapy, zlecenia PW, zadania ogólne). Priorytet
              poniżej to skrót dla kierownictwa — <strong style={{ color: "#e2e8f0" }}>kliknij wiersz</strong>, aby
              przejść do właściwej sekcji (karta projektu lub moduł Zadania).
            </p>
            <div style={{ marginBottom: "0.75rem" }}>
              <span style={op.badge("rgba(239,68,68,0.25)", "#fecaca")}>Krytyczne</span>{" "}
              <span style={op.badge("rgba(234,179,8,0.2)", "#fde68a")}>Ważne</span>{" "}
              <span style={op.badge("rgba(59,130,246,0.2)", "#bfdbfe")}>Informacyjne</span>
            </div>
            {listaAlertowOperacyjnych.length === 0 ? (
              <p style={{ ...op.muted, margin: 0 }}>Brak wpisów spełniających reguły alertów — gratulacje zespołu.</p>
            ) : (
              listaAlertowOperacyjnych.map((a, i) => {
                const st = op.alertRow(a.severity);
                return (
                  <button
                    key={`al-${i}`}
                    type="button"
                    onClick={() => przejdzZAlertuOperacyjnego(a.target)}
                    title="Przejdź do szczegółów"
                    style={{
                      ...st,
                      display: "block",
                      width: "100%",
                      cursor: "pointer",
                      font: "inherit",
                      textAlign: "left",
                      boxSizing: "border-box",
                    }}
                  >
                    <strong style={{ display: "block", marginBottom: "0.2rem" }}>
                      {a.severity === "krytyczny" ? "Krytyczne" : a.severity === "wazny" ? "Ważne" : "Informacja"}
                    </strong>
                    {a.text}
                  </button>
                );
              })
            )}
          </div>
          <button type="button" style={{ ...s.btnGhost, marginBottom: "1rem" }} onClick={przejdzDoInfoZagrozen}>
            Pełna dokumentacja reguł podświecania (INFO)
          </button>
        </>
      ) : null}

      {widok === "pracownik" && pracFetchError ? (
        <div style={s.errBox} role="alert">
          <strong>Błąd pobierania pracowników.</strong>
          <br />
          {pracFetchError}
          <br />
          <span style={{ fontSize: "0.88em", opacity: 0.95 }}>
            Jeśli to brak uprawnień — dopisz polityki <code style={s.code}>anon_select_pracownik</code> oraz{" "}
            przy dodawaniu <code style={s.code}>anon_insert_pracownik</code> (pliki w{" "}
            <code style={s.code}>g4-app/supabase/</code>) i uruchom w SQL Editor.
          </span>
        </div>
      ) : null}

      {widok === "zadania" && zadaniaFetchError ? (
        <div style={s.errBox} role="alert">
          <strong>Błąd pobierania zadań.</strong> {zadaniaFetchError}
          <br />
          <span style={{ fontSize: "0.88em" }}>
            Przy włączonym RLS uruchom sekcję <code style={s.code}>zadania</code> w{" "}
            <code style={s.code}>g4-app/supabase/rls-policies-anon.sql</code>.
          </span>
        </div>
      ) : null}

      {widok === "podwykonawca" && podwykonawcyFetchError ? (
        <div style={s.errBox} role="alert">
          <strong>Błąd pobierania podwykonawców.</strong> {podwykonawcyFetchError}
          <br />
          <span style={{ fontSize: "0.88em" }}>
            Utwórz tabelę <code style={s.code}>podwykonawca</code>{" "}
            (<code style={s.code}>podwykonawca-tabela.sql</code>) i sekcję PW w{" "}
            <code style={s.code}>rls-policies-anon.sql</code>.
          </span>
        </div>
      ) : null}

      {widok === "samochody" && (samochodyFetchError || rezerwacjeFetchError) ? (
        <div style={s.errBox} role="alert">
          {samochodyFetchError ? (
            <>
              <strong>Samochody:</strong> {samochodyFetchError}
              <br />
            </>
          ) : null}
          {rezerwacjeFetchError ? (
            <>
              <strong>Rezerwacje:</strong> {rezerwacjeFetchError}
              <br />
            </>
          ) : null}
          <span style={{ fontSize: "0.88em" }}>
            Uruchom <code style={s.code}>g4-app/supabase/samochody-sprzet-rezerwacje.sql</code>, potem sekcje{" "}
            <code style={s.code}>samochod</code> / <code style={s.code}>samochod_rezerwacja</code> w{" "}
            <code style={s.code}>rls-policies-anon.sql</code>.
          </span>
        </div>
      ) : null}

      {widok === "sprzet" && sprzetFetchError ? (
        <div style={s.errBox} role="alert">
          <strong>Błąd pobierania sprzętu.</strong> {sprzetFetchError}
          <br />
          <span style={{ fontSize: "0.88em" }}>
            Uruchom <code style={s.code}>samochody-sprzet-rezerwacje.sql</code> i RLS dla{" "}
            <code style={s.code}>sprzet</code>.
          </span>
        </div>
      ) : null}

      {widok === "zagrozenia" ? (
        <section style={s.krTopWrap} aria-labelledby="zagrozenia-naglowek">
          <h2 id="zagrozenia-naglowek" style={{ ...s.krTopTitle, fontSize: "1rem", marginTop: 0 }}>
            INFO — zagrożenia i podświetlenia „wymaga uwagi”
          </h2>
          <p style={{ ...s.muted, fontSize: "0.88rem", lineHeight: 1.55, marginBottom: "1.25rem" }}>
            Poniżej reguły <strong style={{ color: "#fecaca" }}>obowiązujące w tej wersji aplikacji</strong>. Chodzi
            o szybki odczyt przed spotkaniem: co wymaga decyzji, domknięcia lub koordynacji. Podświetlenia nie
            zastępują ludzkiej oceny — bazują na polach w bazie (statusy, daty, zaznaczenia).
          </p>

          <h3 style={{ ...s.h2, marginTop: "1rem", fontSize: "0.95rem", color: "#fecaca" }}>
            Pulpit projektu — oś czasu (wiersz listy)
          </h3>
          <p style={{ ...s.muted, fontSize: "0.85rem", lineHeight: 1.55, marginBottom: "0.65rem" }}>
            Wiersz jest traktowany jako <strong style={{ color: "#f87171" }}>wymagający uwagi</strong> (czerwony
            pasek z lewej, jaśniejszy tekst, wykrzyknik przed skrótem, delikatne tło), gdy spełnia{" "}
            <strong>którykolwiek</strong> warunek dla danego typu wpisu:
          </p>
          <ul
            style={{
              margin: "0 0 1.15rem 0",
              paddingLeft: "1.25rem",
              fontSize: "0.85rem",
              lineHeight: 1.65,
              color: "#e5e5e5",
            }}
          >
            <li style={{ marginBottom: "0.5rem" }}>
              <strong style={{ color: "#4ade80" }}>KR</strong> (pozycja startu projektu na osi): status projektu w
              tabeli <code style={s.code}>kr</code> to dokładnie{" "}
              <strong style={{ color: "#fecaca" }}>„oczekuje na zamawiającego”</strong>.
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <strong style={{ color: "#f87171" }}>ETAP</strong> — <strong>którykolwiek</strong> z warunków: pole
              zagrożenia ustawione na tak (lub równoważna wartość w bazie); albo wypełniony{" "}
              <strong>opis zagrożenia</strong>; albo <strong>data planowana</strong> jest wcześniejsza niż{" "}
              <strong>dziś</strong>, przy czym status etapu <strong>nie</strong> należy do zamkniętych:{" "}
              <em>zrealizowane</em>, <em>rozliczone</em>, <em>anulowane</em>.
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <strong style={{ color: "#38bdf8" }}>LOG</strong>: status zdarzenia to{" "}
              <strong>„w trakcie”</strong> lub <strong>„oczekuje”</strong> (wpis nie jest uznany za domknięty —
              status <em>ukończone</em> wyłącza podświetlenie).
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <strong style={{ color: "#fbbf24" }}>PW</strong> na osi: do trzech punktów w czasie (data zlecenia,
              termin planowy, data oddania — jeśli jest). <strong>Czerwień</strong> tylko przy punkcie{" "}
              <strong>termin zlecenia (plan)</strong>, gdy ten dzień jest przed <strong>dziś</strong>, a{" "}
              <strong>odebrane</strong> nie jest zaznaczone; punkt „data zlecenia” nie oznacza zagrożenia sam z siebie.
            </li>
          </ul>

          <h3 style={{ ...s.h2, marginTop: "1rem", fontSize: "0.95rem", color: "#fecaca" }}>
            Pulpit — karta „Dane projektu”
          </h3>
          <p style={{ ...s.muted, fontSize: "0.85rem", lineHeight: 1.55, marginBottom: "1.15rem" }}>
            <strong>Czerwona ramka</strong> i dopisek przy nagłówku karty, gdy status KR tego projektu to{" "}
            <strong style={{ color: "#fecaca" }}>„oczekuje na zamawiającego”</strong> (ta sama reguła co dla wiersza
            startu KR na osi).
          </p>

          <h3 style={{ ...s.h2, marginTop: "1rem", fontSize: "0.95rem", color: "#fecaca" }}>
            Pulpit — zielona linia „Teraz”
          </h3>
          <p style={{ ...s.muted, fontSize: "0.85rem", lineHeight: 1.55, marginBottom: "1.15rem" }}>
            To <strong>nie</strong> jest zagrożenie — oznacza <strong style={{ color: "#86efac" }}>aktualną datę
            (dziś)</strong> na osi czasu, żeby widać było „gdzie jesteśmy” względem przeszłych i przyszłych wpisów.
          </p>

          <h3 style={{ ...s.h2, marginTop: "1rem", fontSize: "0.95rem", color: "#fecaca" }}>
            Pulpit — skrzynka „Wymaga uwagi”
          </h3>
          <p style={{ ...s.muted, fontSize: "0.85rem", lineHeight: 1.55, marginBottom: "1.15rem" }}>
            Pod przyciskami <strong>ETAP / PW / LOG / …</strong> pojawia się podsumowanie, jeśli na osi jest co najmniej{" "}
            <strong>jedna</strong> pozycja spełniająca powyższe reguły — z liczbą takich pozycji.
          </p>

          <h3 style={{ ...s.h2, marginTop: "1rem", fontSize: "0.95rem", color: "#fecaca" }}>
            Lista główna KR (tabela przed wejściem w Pulpit)
          </h3>
          <p style={{ ...s.muted, fontSize: "0.85rem", lineHeight: 1.55, marginBottom: "0.65rem" }}>
            <strong>Różowe tło</strong> wiersza i <strong style={{ color: "#f87171" }}>!</strong> przy kodzie KR, gdy:
          </p>
          <ul
            style={{
              margin: "0 0 0.35rem 0",
              paddingLeft: "1.25rem",
              fontSize: "0.85rem",
              lineHeight: 1.65,
              color: "#e5e5e5",
            }}
          >
            <li style={{ marginBottom: "0.5rem" }}>
              status tego KR to <strong>„oczekuje na zamawiającego”</strong>, <strong>albo</strong>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <strong>którykolwiek etap</strong> przypisany do tego kodu KR spełnia reguły „uwagi” jak dla{" "}
              <strong style={{ color: "#f87171" }}>ETAP</strong> na pulpicie (zagrożenie / opis / plan po terminie przy
              etapie nie zamkniętym).
            </li>
          </ul>
          <p style={{ ...s.muted, fontSize: "0.82rem", lineHeight: 1.55, marginBottom: "1.15rem" }}>
            Lista <strong>nie</strong> ma wczytanego całego dziennika ani wszystkich terminów PW dla każdego projektu —
            dlatego <strong>LOG</strong> i <strong>PW</strong> „na czerwono” zobaczysz dopiero na{" "}
            <strong>pulpicie</strong> danego KR.
          </p>

          <h3 style={{ ...s.h2, marginTop: "1rem", fontSize: "0.95rem", color: "#a3a3a3" }}>
            Jak „zgasić” czerwień (skrót)
          </h3>
          <ul
            style={{
              margin: "0 0 1.5rem 0",
              paddingLeft: "1.25rem",
              fontSize: "0.82rem",
              lineHeight: 1.6,
              color: "#c4c4c4",
            }}
          >
            <li>KR / ETAP: zmień status lub usuń zagrożenie / zaktualizuj plan, domknij etap zgodnie z regułami powyżej.</li>
            <li>LOG: ustaw status na <strong>ukończone</strong>, gdy sprawa jest załatwiona.</li>
            <li>PW: odhacz <strong>odebrane</strong> lub skoryguj termin w bazie.</li>
          </ul>

          <p style={{ ...s.muted, fontSize: "0.8rem", marginBottom: 0 }}>
            Wróć do pracy: <strong style={{ color: "#d4d4d4" }}>KR</strong> (lista projektów) lub inna zakładka w menu
            u góry.
          </p>
        </section>
      ) : null}

      {showEmptyKrHint ? (
        <div style={s.hintBox}>
          W Table Editor widać wiersze w <code style={s.code}>kr</code>, a tu pusto — niemal zawsze
          winna jest <strong>RLS</strong>. Uruchom{" "}
          <code style={s.code}>g4-app/supabase/rls-policies-anon.sql</code>{" "}
          w <strong>SQL Editor</strong>, potem odśwież stronę.
        </div>
      ) : null}

      {widok === "czas_pracy" ? (
        <CzasPracyPanel
          supabase={supabase}
          krList={krList}
          pracownicy={pracownicyPosortowani}
          pracownikSesja={pracownikPowiazanyZSesja}
          pracownikWidokEfektywny={pracownikWidokEfektywny}
          wymagaKonta={requireAuth}
        />
      ) : null}

      {widok === "moje_dokumenty" ? (
        <>
          <h2 style={{ ...s.h2, marginTop: 0 }}>Moje dokumenty</h2>
          {podgladJakoInny ? (
            <p style={{ ...op.muted, fontSize: "0.86rem", maxWidth: "44rem", color: "#fcd34d", marginBottom: "0.65rem" }}>
              <strong>Podgląd administratora</strong> — edytujesz dokumenty dla{" "}
              <strong>{pracownikWidokEfektywny?.imie_nazwisko?.trim() || "—"}</strong> (nr{" "}
              {pracownikWidokEfektywny?.nr != null ? String(pracownikWidokEfektywny.nr).trim() : "—"}). Zapis i import
              trafiają do tej kartoteki (RLS: rola admin).
            </p>
          ) : null}
          {czyAdminAktywny ? (
            <>
              <p style={{ ...s.muted, maxWidth: "44rem" }}>
                Pliki HR dodajesz przez <strong>import listy z Box</strong> — kategoria (np. Nieobecności, BHP) wynika z
                nazwy pliku (<code style={s.code}>HR---…---Typ---…</code>). Opcjonalnie zapisz <strong>skrót do
                arkusza</strong> (Google Sheet itd.); aplikacja nie synchronizuje komórek.
              </p>
              <p style={{ ...s.muted, fontSize: "0.82rem", maxWidth: "44rem" }}>
                W bazie: import → <code style={s.code}>pracownik_dokument</code> (<code style={s.code}>typ</code> ={" "}
                <code style={s.code}>zaimportowane_box</code>), arkusz → <code style={s.code}>pracownik.link_google_arkusz</code>{" "}
                (<code style={s.code}>pracownik-dokumenty-i-arkusz.sql</code>,{" "}
                <code style={s.code}>pracownik-dokument-box-import.sql</code>).
              </p>
            </>
          ) : null}
          {!requireAuth ? (
            <div style={s.hintBox}>Włącz logowanie (<code style={s.code}>VITE_REQUIRE_AUTH=true</code>), aby korzystać z tego panelu.</div>
          ) : !session?.user ? (
            <p style={s.muted}>Zaloguj się.</p>
          ) : !pracownikPowiazanyZSesja ? (
            <div style={s.hintBox}>
              <strong>Brak powiązania konta z rekordem w</strong> <code style={s.code}>pracownik</code> (
              <code style={s.code}>auth_user_id</code>). Aplikacja dopasowuje zalogowanego użytkownika do kartoteki{" "}
              <strong>tylko po tej kolumnie</strong> — bez ustawionego UUID z Supabase Auth panel „Moje dokumenty” nie
              wczyta linków z <code style={s.code}>pracownik_dokument</code>, nawet jeśli administrator wcześniej je
              zapisał. W SQL Editor uruchom np.{" "}
              <code style={s.code}>g4-app/supabase/pracownik-auth-user-powiazanie.sql</code> (dopasuj e-mail i
              imię/nazwisko lub <code style={s.code}>nr</code>).
            </div>
          ) : (
            <>
              {mojeDokumentyFetchError ? (
                <div style={s.errBox} role="alert">
                  Nie udało się wczytać dokumentów: {mojeDokumentyFetchError}
                  <br />
                  Uruchom migrację SQL i ponownie <code style={s.code}>rls-policies-authenticated.sql</code> / anon.
                </div>
              ) : null}
              {mojeDokSaveMsg ? (
                <p style={{ ...s.muted, color: mojeDokSaveMsg === "Zapisano." ? theme.success : "#fca5a5" }}>
                  {mojeDokSaveMsg}
                </p>
              ) : null}
              {mojeDokBulkMsg ? (
                <p
                  style={{
                    ...s.muted,
                    marginBottom: "0.65rem",
                    fontSize: "0.86rem",
                    color: mojeDokBulkMsg.startsWith("Błąd:") ? "#fca5a5" : "#86efac",
                  }}
                >
                  {mojeDokBulkMsg}
                </p>
              ) : null}
              {czyAdminAktywny ? (
                <div style={{ ...op.sectionCard, marginBottom: "1rem" }}>
                  <h3 style={{ ...op.sectionTitle, marginTop: 0, fontSize: "0.95rem" }}>
                    Wklej wiele plików (lista z Box)
                  </h3>
                  <p style={{ ...op.muted, fontSize: "0.82rem", marginTop: 0 }}>
                    Jedna linia = <strong>pełna nazwa z listy</strong>, potem spacja lub <kbd>Tab</kbd>, potem adres{" "}
                    <code style={s.code}>https://…box.com/…</code>. Program wycina URL, z nazwy odczytuje firmę (A/B/C) i
                    numer ID;{" "}
                    <strong>
                      {podgladJakoInny
                        ? "do bazy trafiają tylko wiersze, gdzie ID zgadza się z numerem wybranej osoby (podgląd)"
                        : "do bazy trafiają tylko wiersze, gdzie ID zgadza się z Twoim"}
                    </strong>{" "}
                    <code style={s.code}>pracownik.nr</code> (np. <code style={s.code}>001</code> i{" "}
                    <code style={s.code}>01</code> są traktowane jak to samo). Duplikaty tego samego URL są pomijane.
                  </p>
                  <p style={{ ...op.muted, fontSize: "0.76rem", marginBottom: "0.5rem", lineHeight: 1.45 }}>
                    <strong>A</strong> — {PRACOWNIK_FIRMA_Z_KODU.A}
                    <br />
                    <strong>B</strong> — {PRACOWNIK_FIRMA_Z_KODU.B}
                    <br />
                    <strong>C</strong> — {PRACOWNIK_FIRMA_Z_KODU.C}
                  </p>
                  <textarea
                    style={{
                      ...s.input,
                      minHeight: "7.5rem",
                      resize: "vertical",
                      fontFamily: "ui-monospace, monospace",
                    }}
                    placeholder={"HR---B---001-JakubowskaMonika---…\nhttps://g4geodezja.box.com/s/…"}
                    value={mojeDokBulkWklejka}
                    onChange={(ev) => setMojeDokBulkWklejka(ev.target.value)}
                  />
                  <div style={{ ...s.btnRow, marginTop: "0.65rem" }}>
                    <button type="button" style={s.btn} onClick={() => void importujWklejoneZListyBox()}>
                      {podgladJakoInny
                        ? "Zaimportuj do bazy (dopasuj ID w nazwie do wybranej osoby)"
                        : "Zaimportuj do bazy (tylko moje ID)"}
                    </button>
                  </div>
                </div>
              ) : null}
              {czyAdminAktywny ? (
                <div style={{ ...op.sectionCard, marginBottom: "1rem" }}>
                  <h3 style={{ ...op.sectionTitle, marginTop: 0, fontSize: "0.95rem" }}>Google Sheet / skrót</h3>
                  <label style={s.label}>
                    URL (arkusz, Box, Drive — link „Udostępnij” / kopiuj adres)
                    <input
                      style={s.input}
                      type="text"
                      inputMode="url"
                      autoComplete="url"
                      placeholder="https://docs.google.com/… lub https://…box.com/…"
                      value={mojeDokEdycja.arkusz}
                      onChange={(ev) => setMojeDokEdycja((prev) => ({ ...prev, arkusz: ev.target.value }))}
                    />
                  </label>
                  {tekstTrim(mojeDokEdycja.arkusz) ? (
                    <p style={{ margin: "0.4rem 0 0", fontSize: "0.82rem" }}>
                      <a
                        href={hrefLinkuZewnetrznego(mojeDokEdycja.arkusz)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#7dd3fc", fontWeight: 600 }}
                      >
                        Otwórz w nowej karcie ↗
                      </a>
                    </p>
                  ) : null}
                  <div style={{ ...s.btnRow, marginTop: "0.75rem" }}>
                    <button type="button" style={s.btn} onClick={() => void zapiszMojeDokumenty()}>
                      Zapisz skrót
                    </button>
                  </div>
                </div>
              ) : (
                (() => {
                  const maArkusz = !!tekstTrim(mojeDokEdycja.arkusz);
                  const maPlikiBoxImport = mojeDokumentyList.some(
                    (row) => row.typ === PRACOWNIK_DOKUMENT_TYP_BOX_IMPORT,
                  );
                  if (!maArkusz && !maPlikiBoxImport) {
                    return (
                      <p
                        style={{
                          ...op.muted,
                          margin: "0 0 1rem 0",
                          fontSize: "0.84rem",
                          maxWidth: "44rem",
                        }}
                      >
                        Brak zaimportowanych plików z Box i skrótu do arkusza. Gdy administrator coś doda, linki pojawią
                        się tutaj.
                      </p>
                    );
                  }
                  if (!maArkusz && maPlikiBoxImport) {
                    return null;
                  }
                  return (
                    <ul
                      style={{
                        listStyle: "none",
                        margin: "0 0 1rem 0",
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.85rem",
                      }}
                    >
                      {maArkusz ? (
                        <li
                          key="__arkusz__"
                          style={{
                            padding: "0.65rem 0.75rem",
                            borderRadius: "10px",
                            border: `1px solid ${theme.border}`,
                            background: theme.surface,
                          }}
                        >
                          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: theme.text, marginBottom: "0.35rem" }}>
                            Arkusz Google / skrót
                          </div>
                          <a
                            href={hrefLinkuZewnetrznego(mojeDokEdycja.arkusz)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#7dd3fc", fontWeight: 600, fontSize: "0.84rem" }}
                          >
                            Otwórz w nowej karcie ↗
                          </a>
                        </li>
                      ) : null}
                    </ul>
                  );
                })()
              )}
              <div style={{ ...op.sectionCard }}>
                {mojeDokumentyList.filter((r) => r.typ === PRACOWNIK_DOKUMENT_TYP_BOX_IMPORT).length === 0 ? (
                  <p style={{ ...op.muted, margin: 0, fontSize: "0.84rem" }}>
                    Pusto
                    {!czyAdminAktywny ? (
                      <> — dokumenty z listy Box dodaje administrator.</>
                    ) : podgladJakoInny ? (
                      <> — ten użytkownik nie ma zaimportowanych pozycji z Box.</>
                    ) : (
                      <>
                        {" "}
                        — użyj importu powyżej (po migracji <code style={s.code}>pracownik-dokument-box-import.sql</code>
                        ).
                      </>
                    )}
                  </p>
                ) : (
                  (() => {
                    const boxRowsWszystkie = mojeDokumentyList.filter(
                      (row) => row.typ === PRACOWNIK_DOKUMENT_TYP_BOX_IMPORT,
                    );
                    const boxRows = boxRowsWszystkie.filter((r) =>
                      czyWierszBoxWPasujeDoFiltruDat(r, mojeDokFiltrDataOd, mojeDokFiltrDataDo),
                    );
                    const grupy = new Map();
                    for (const r of boxRows) {
                      const k = kategoriaImportuDlaWiersza(r);
                      if (!grupy.has(k)) grupy.set(k, []);
                      grupy.get(k).push(r);
                    }
                    const kolejnoscKategorii = [...grupy.keys()].sort((a, b) =>
                      a.localeCompare(b, "pl", { sensitivity: "base", numeric: true }),
                    );
                    const filtrAktywny =
                      tekstTrim(mojeDokFiltrDataOd) !== "" || tekstTrim(mojeDokFiltrDataDo) !== "";
                    if (boxRows.length === 0) {
                      return (
                        <div>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "flex-end",
                              gap: "0.65rem 1rem",
                              marginBottom: "1rem",
                              padding: "0.65rem 0.75rem",
                              borderRadius: "10px",
                              border: `1px solid ${theme.border}`,
                              background: theme.surface,
                            }}
                          >
                            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                              <div style={{ ...op.muted, fontSize: "0.78rem", marginBottom: "0.35rem" }}>
                                Okres (dzień referencyjny: <strong>najpóźniejsza data z nazwy</strong>, inaczej dzień importu)
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", alignItems: "flex-end" }}>
                                <label style={{ ...s.label, marginBottom: 0, fontSize: "0.8rem" }}>
                                  Od
                                  <input
                                    style={{ ...s.input, maxWidth: "11rem" }}
                                    type="date"
                                    value={mojeDokFiltrDataOd}
                                    onChange={(ev) => setMojeDokFiltrDataOd(ev.target.value)}
                                  />
                                </label>
                                <label style={{ ...s.label, marginBottom: 0, fontSize: "0.8rem" }}>
                                  Do
                                  <input
                                    style={{ ...s.input, maxWidth: "11rem" }}
                                    type="date"
                                    value={mojeDokFiltrDataDo}
                                    onChange={(ev) => setMojeDokFiltrDataDo(ev.target.value)}
                                  />
                                </label>
                                <button
                                  type="button"
                                  style={{ ...s.btnGhost, fontSize: "0.78rem", padding: "0.35rem 0.6rem" }}
                                  onClick={() => {
                                    setMojeDokFiltrDataOd("");
                                    setMojeDokFiltrDataDo("");
                                  }}
                                >
                                  Wyczyść okres
                                </button>
                              </div>
                            </div>
                          </div>
                          <p style={{ ...op.muted, margin: 0, fontSize: "0.84rem" }}>
                            {filtrAktywny ? (
                              <>
                                <strong>Brak plików</strong> w wybranym przedziale (
                                {mojeDokFiltrDataOd || "…"} — {mojeDokFiltrDataDo || "…"}). Zmień daty lub wyczyść filtr
                                — w bazie jest {boxRowsWszystkie.length}{" "}
                                {boxRowsWszystkie.length === 1 ? "pozycja" : "pozycji"}.
                              </>
                            ) : (
                              <>Brak pozycji do wyświetlenia.</>
                            )}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "flex-end",
                            gap: "0.65rem 1rem",
                            marginBottom: "1rem",
                            padding: "0.65rem 0.75rem",
                            borderRadius: "10px",
                            border: `1px solid ${theme.border}`,
                            background: theme.surface,
                          }}
                        >
                          <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                            <div style={{ ...op.muted, fontSize: "0.78rem", marginBottom: "0.35rem" }}>
                              Okres (dzień referencyjny: <strong>najpóźniejsza data z nazwy</strong>, inaczej dzień importu).
                              Lista od <strong>najnowszych</strong>.
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", alignItems: "flex-end" }}>
                              <label style={{ ...s.label, marginBottom: 0, fontSize: "0.8rem" }}>
                                Od
                                <input
                                  style={{ ...s.input, maxWidth: "11rem" }}
                                  type="date"
                                  value={mojeDokFiltrDataOd}
                                  onChange={(ev) => setMojeDokFiltrDataOd(ev.target.value)}
                                />
                              </label>
                              <label style={{ ...s.label, marginBottom: 0, fontSize: "0.8rem" }}>
                                Do
                                <input
                                  style={{ ...s.input, maxWidth: "11rem" }}
                                  type="date"
                                  value={mojeDokFiltrDataDo}
                                  onChange={(ev) => setMojeDokFiltrDataDo(ev.target.value)}
                                />
                              </label>
                              <button
                                type="button"
                                style={{ ...s.btnGhost, fontSize: "0.78rem", padding: "0.35rem 0.6rem" }}
                                onClick={() => {
                                  setMojeDokFiltrDataOd("");
                                  setMojeDokFiltrDataDo("");
                                }}
                              >
                                Wyczyść okres
                              </button>
                            </div>
                          </div>
                          {filtrAktywny ? (
                            <div
                              style={{
                                fontSize: "0.76rem",
                                color: theme.muted,
                                whiteSpace: "nowrap",
                                alignSelf: "center",
                              }}
                            >
                              Widzisz {boxRows.length} z {boxRowsWszystkie.length}
                            </div>
                          ) : null}
                        </div>
                        <div
                        style={{
                          display: "grid",
                          gap: "1rem",
                          gridTemplateColumns: "minmax(170px, 220px) minmax(0, 1fr)",
                          alignItems: "start",
                        }}
                      >
                        <aside
                          style={{
                            position: "sticky",
                            top: "0.75rem",
                            alignSelf: "start",
                            border: `1px solid ${theme.border}`,
                            background: theme.bgSoft,
                            borderRadius: "10px",
                            padding: "0.6rem",
                          }}
                        >
                          <div style={{ fontSize: "0.76rem", color: theme.muted, marginBottom: "0.5rem" }}>Kategorie</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                            {kolejnoscKategorii.map((kat) => {
                              const targetId = idSekcjiKategoriiDokumentow(kat);
                              const wcisniety = mojeDokKategorieRozwiniete.has(kat);
                              return (
                                <button
                                  key={kat}
                                  type="button"
                                  aria-pressed={wcisniety}
                                  title={wcisniety ? "Zwiń" : "Rozwiń"}
                                  style={{
                                    width: "100%",
                                    cursor: "pointer",
                                    borderRadius: "8px",
                                    fontSize: "0.82rem",
                                    letterSpacing: "0.02em",
                                    textAlign: "left",
                                    padding: "0.55rem 0.65rem",
                                    lineHeight: 1.35,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "0.5rem",
                                    outline: "none",
                                    WebkitTapHighlightColor: "transparent",
                                    ...(wcisniety
                                      ? {
                                          border: "2px solid #38bdf8",
                                          background:
                                            "linear-gradient(180deg, rgba(56,189,248,0.28) 0%, rgba(15,23,42,0.92) 55%)",
                                          color: "#f0f9ff",
                                          fontWeight: 800,
                                          boxShadow:
                                            "inset 0 2px 8px rgba(0,0,0,0.45), 0 0 0 1px rgba(56,189,248,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
                                          transform: "translateY(1px)",
                                        }
                                      : {
                                          border: "2px solid rgba(148,163,184,0.55)",
                                          background:
                                            "linear-gradient(180deg, rgba(71,85,105,0.55) 0%, rgba(30,41,59,0.92) 100%)",
                                          color: "#f1f5f9",
                                          fontWeight: 600,
                                          boxShadow:
                                            "0 2px 0 rgba(255,255,255,0.14) inset, 0 5px 0 #0f172a, 0 8px 20px rgba(0,0,0,0.4)",
                                        }),
                                  }}
                                  onClick={() => {
                                    setMojeDokKategorieRozwiniete((prev) => {
                                      const next = new Set(prev);
                                      const rozwija = !next.has(kat);
                                      if (rozwija) next.add(kat);
                                      else next.delete(kat);
                                      requestAnimationFrame(() => {
                                        if (rozwija) {
                                          const el = document.getElementById(targetId);
                                          if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                                        }
                                      });
                                      return next;
                                    });
                                  }}
                                >
                                  <span style={{ flex: "1 1 auto", minWidth: 0, textAlign: "left" }}>
                                    {etykietaKategoriiImportu(kat)}
                                  </span>
                                  <span
                                    aria-hidden
                                    style={{
                                      flex: "0 0 auto",
                                      fontSize: "0.68rem",
                                      fontWeight: 800,
                                      letterSpacing: 0,
                                      color: wcisniety ? "#7dd3fc" : "#94a3b8",
                                      lineHeight: 1,
                                    }}
                                  >
                                    {wcisniety ? "▼" : "▶"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </aside>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.15rem", minWidth: 0 }}>
                          {trybHelp && kolejnoscKategorii.filter((kat) => mojeDokKategorieRozwiniete.has(kat)).length === 0 ? (
                            <p
                              style={{
                                ...op.muted,
                                margin: 0,
                                fontSize: "0.84rem",
                                maxWidth: "36rem",
                                padding: "0.75rem 0",
                              }}
                            >
                              Wszystkie kategorie są zwinięte. Kliknij <strong>klawisz</strong> po lewej, aby rozwinąć
                              listę dokumentów.
                            </p>
                          ) : null}
                          {kolejnoscKategorii.filter((kat) => mojeDokKategorieRozwiniete.has(kat)).map((kat) => {
                            const wierszeKat = grupy.get(kat);
                            const firmyMap = new Map();
                            for (const r of wierszeKat) {
                              const fk = firmaKodZWierszaDokumentu(r);
                              if (!firmyMap.has(fk)) firmyMap.set(fk, []);
                              firmyMap.get(fk).push(r);
                            }
                            const kolejnoscFirm = sortujKodyFirmDlaBoxa([...firmyMap.keys()]);
                            return (
                              <section key={kat} id={idSekcjiKategoriiDokumentow(kat)}>
                                <h3
                                  style={{
                                    ...op.sectionTitle,
                                    fontSize: "0.95rem",
                                    marginTop: 0,
                                    marginBottom: "0.5rem",
                                    color: theme.text,
                                  }}
                                >
                                  {etykietaKategoriiImportu(kat)}
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                                  {kolejnoscFirm.map((fk) => (
                                    <div key={fk || "__brak_kodu__"}>
                                      <h4
                                        style={{
                                          fontSize: "0.88rem",
                                          fontWeight: 700,
                                          color: theme.text,
                                          margin: "0 0 0.45rem 0",
                                          lineHeight: 1.35,
                                        }}
                                      >
                                        {etykietaFirmyImportuBox(fk)}
                                      </h4>
                                      <ul
                                        style={{
                                          margin: 0,
                                          padding: 0,
                                          listStyle: "none",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "0.55rem",
                                        }}
                                      >
                                        {sortujWierszeBoxOdNajnowszych(firmyMap.get(fk)).map((r) => (
                                          <li
                                            key={r.id}
                                            style={{
                                              padding: "0.65rem 0.75rem",
                                              borderRadius: "10px",
                                              border: `1px solid ${theme.border}`,
                                              background: theme.surface,
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                alignItems: "flex-start",
                                                gap: "0.5rem 0.85rem",
                                                rowGap: "0.35rem",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  fontSize: "0.84rem",
                                                  lineHeight: 1.45,
                                                  wordBreak: "break-word",
                                                  flex: "1 1 140px",
                                                  minWidth: 0,
                                                }}
                                              >
                                                {fragmentyKolorowejNazwyPlikuBox(r.nazwa_pliku).map((fr, fi) => (
                                                  <span key={fi} style={{ color: fr.color }}>
                                                    {fr.text}
                                                  </span>
                                                ))}
                                              </div>
                                              <div
                                                style={{
                                                  display: "flex",
                                                  flexWrap: "wrap",
                                                  gap: "0.5rem",
                                                  alignItems: "center",
                                                  flexShrink: 0,
                                                }}
                                              >
                                                <a
                                                  href={hrefLinkuZewnetrznego(r.url)}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  style={{
                                                    color: "#7dd3fc",
                                                    fontWeight: 600,
                                                    fontSize: "0.82rem",
                                                    whiteSpace: "nowrap",
                                                  }}
                                                >
                                                  Otwórz w Box ↗
                                                </a>
                                                {czyAdminAktywny ? (
                                                  <button
                                                    type="button"
                                                    style={{ ...s.btnGhost, fontSize: "0.78rem", padding: "0.25rem 0.5rem" }}
                                                    onClick={() => void usunZaimportowanyDokumentBox(r.id)}
                                                  >
                                                    Usuń z listy
                                                  </button>
                                                ) : null}
                                              </div>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </section>
                            );
                          })}
                        </div>
                      </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </>
          )}
        </>
      ) : null}

      {widok === "pracownik" ? (
        <>
          <h2 style={{ ...s.h2, marginTop: 0 }}>Pracownicy</h2>
          <p style={s.muted}>
            Rekordy z tabeli <code style={s.code}>pracownik</code> — kolumna <code style={s.code}>nr</code>{" "}
            to identyfikator używany w KR (osoba prowadząca itd.). Nowego pracownika dodasz formularzem
            pod tabelą.
          </p>
          {czyAdminAktywny ? (
            <p style={{ ...s.muted, fontSize: "0.86rem", maxWidth: "48rem", marginBottom: "0.75rem" }}>
              <strong style={{ color: "#e5e7eb" }}>Administrator:</strong> w kolumnie{" "}
              <strong style={{ color: "#7dd3fc" }}>Forma</strong> ustawiasz{" "}
              <strong>umowę o pracę / umowę zlecenie / inną</strong> — to steruje rozliczeniem normy i nadgodzin w
              module <strong>Czas pracy</strong>. Zmiana zapisuje się od razu (wymaga kolumny{" "}
              <code style={s.code}>forma_zatrudnienia</code> — migracja{" "}
              <code style={s.code}>pracownik-forma-zatrudnienia.sql</code>).
            </p>
          ) : null}

          {pracLoading ? (
            <p style={s.muted}>Ładowanie…</p>
          ) : pracFetchError ? null : pracownicy.length === 0 ? (
            <div style={s.hintBox}>
              <strong>W panelu Table Editor widać pracowników, a tu „brak danych”?</strong> To nie
              oznacza, że tabela jest pusta — zapytanie z przeglądarki idzie jako rola{" "}
              <code style={s.code}>anon</code>. Przy włączonym RLS musisz dodać politykę{" "}
              <strong>SELECT dla anon</strong> na <code style={s.code}>public.pracownik</code>.
              Wklej w <strong>SQL Editor</strong> i uruchom{" "}
              <code style={s.code}>pracownik-rls-anon-only.sql</code> lub sekcję Pracownicy z{" "}
              <code style={s.code}>rls-policies-anon.sql</code> (SELECT + INSERT dla formularza),
              potem odśwież stronę lub ponownie wybierz <strong>ID</strong>.
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>nr (ID)</th>
                    <th style={s.th}>Imię i nazwisko</th>
                    <th style={{ ...s.th, color: "#7dd3fc" }}>Dział</th>
                    {czyAdminAktywny ? (
                      <th style={{ ...s.th, whiteSpace: "nowrap" }} title="Uprawnienia w aplikacji — tylko administrator">
                        Rola
                      </th>
                    ) : null}
                    {czyAdminAktywny ? (
                      <th style={{ ...s.th, textAlign: "center", whiteSpace: "nowrap" }} title="Odpowiedzialność za flotę — tylko administrator">
                        Flota
                      </th>
                    ) : null}
                    {czyAdminAktywny ? (
                      <th style={{ ...s.th, whiteSpace: "nowrap", color: "#7dd3fc" }} title="UoP vs um. zlecenie — moduł Czas pracy; edycja tylko administrator">
                        Forma zatrudnienia
                      </th>
                    ) : null}
                    <th style={s.th}>E-mail</th>
                    <th style={s.th}>Telefon</th>
                  </tr>
                </thead>
                <tbody>
                  {pracownicy.map((p) => (
                    <tr key={p.nr}>
                      <td style={s.td}>
                        <strong style={{ color: "#fff" }}>{p.nr}</strong>
                      </td>
                      <td style={s.td}>{p.imie_nazwisko}</td>
                      <td style={{ ...s.td, ...s.dzialWartosc }}>{p.dzial ?? "—"}</td>
                      {czyAdminAktywny ? (
                        <td style={s.td}>
                          <select
                            value={String(p.app_role ?? "uzytkownik").trim() || "uzytkownik"}
                            onChange={(ev) => void ustawAppRolePracownika(p.nr, ev.target.value)}
                            style={{
                              ...s.input,
                              fontSize: "0.82rem",
                              padding: "0.35rem 0.45rem",
                              maxWidth: "11rem",
                            }}
                            aria-label={`Rola: ${p.imie_nazwisko ?? p.nr}`}
                          >
                            {APP_ROLE_OPCJE.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      ) : null}
                      {czyAdminAktywny ? (
                        <td style={{ ...s.td, textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={p.odpowiedzialny_flota === true}
                            onChange={(ev) => void ustawOdpowiedzialnyFlota(p.nr, ev.target.checked)}
                            title="Odpowiedzialny za flotę (naprawy)"
                          />
                        </td>
                      ) : null}
                      {czyAdminAktywny ? (
                        <td style={s.td}>
                          <select
                            value={String(p.forma_zatrudnienia ?? "uop").trim() || "uop"}
                            onChange={(ev) => void ustawFormaZatrudnienia(p.nr, ev.target.value)}
                            style={{
                              ...s.input,
                              fontSize: "0.78rem",
                              padding: "0.3rem 0.4rem",
                              maxWidth: "9.5rem",
                            }}
                            aria-label={`Forma zatrudnienia: ${p.imie_nazwisko ?? p.nr}`}
                          >
                            {FORMA_ZATRUDNIENIA_OPCJE.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      ) : null}
                      <td style={s.td}>{p.email ?? "—"}</td>
                      <td style={s.td}>{p.telefon ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#fff",
              margin: "1.5rem 0 0.65rem",
            }}
          >
            Dodaj pracownika (nowe ID)
          </h3>
          <form style={{ ...s.form, marginBottom: "1.25rem" }} onSubmit={addPracownik}>
            <input
              style={s.input}
              type="text"
              placeholder="Nr / ID (wymagane, np. 024 — unikalny w tabeli)"
              value={newPracNr}
              onChange={(ev) => setNewPracNr(ev.target.value)}
              required
            />
            <input
              style={s.input}
              type="text"
              placeholder="Imię i nazwisko (wymagane)"
              value={newPracImie}
              onChange={(ev) => setNewPracImie(ev.target.value)}
              required
            />
            <input
              style={s.input}
              type="text"
              placeholder="Dział"
              value={newPracDzial}
              onChange={(ev) => setNewPracDzial(ev.target.value)}
            />
            {czyAdminAktywny ? (
              <label style={s.label}>
                Rola w aplikacji
                <select
                  style={s.input}
                  value={newPracAppRole}
                  onChange={(ev) => setNewPracAppRole(ev.target.value)}
                >
                  {APP_ROLE_OPCJE.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {czyAdminAktywny ? (
              <label style={s.label}>
                Forma zatrudnienia (norma i nadgodziny w „Czas pracy”)
                <select style={s.input} value={newPracForma} onChange={(ev) => setNewPracForma(ev.target.value)}>
                  {FORMA_ZATRUDNIENIA_OPCJE.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <input
              style={s.input}
              type="email"
              placeholder="E-mail (unikalny w bazie — puste OK)"
              value={newPracEmail}
              onChange={(ev) => setNewPracEmail(ev.target.value)}
            />
            <input
              style={s.input}
              type="text"
              placeholder="Telefon"
              value={newPracTelefon}
              onChange={(ev) => setNewPracTelefon(ev.target.value)}
            />
            <button type="submit" style={s.btn}>
              Dodaj do bazy pracowników
            </button>
          </form>
        </>
      ) : null}

      {widok === "zadania" ? (
        <>
          <div style={op.heroCard}>
            <h2 style={{ ...op.sectionTitle, marginTop: 0 }}>Zadania ogólne</h2>
            {trybHelp ? (
              <>
                <p style={{ ...op.muted, marginBottom: "0.35rem", maxWidth: "44rem" }}>
                  Zadania <strong>ogólne</strong> i <strong>przy konkretnym KR</strong> — pole <strong>Projekt (KR)</strong>{" "}
                  w formularzu wiąże kartkę Kanban z projektem; puste = zadanie poza KR. <strong>Przydział:</strong> osoba
                  odpowiedzialna (wykonanie) i opcjonalnie zlecająca. Kategoria w tabeli to <strong>heurystyka</strong> z
                  treści i działu.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.15rem" }}>
                  {["Samochody", "Komputery", "Sprzęt", "Biuro", "Organizacyjne"].map((kat) => (
                    <span key={kat} style={op.badge("rgba(71,85,105,0.35)", "#cbd5e1")}>
                      {kat}
                    </span>
                  ))}
                </div>
                <p style={{ ...op.muted, margin: 0, fontSize: "0.76rem" }}>
                  Tabela <code style={s.code}>zadania</code> — kolumna <code style={s.code}>kr</code> (SQL:{" "}
                  <code style={s.code}>zadania-kolumna-kr.sql</code>). Filtr <strong>Projekt (KR)</strong> działa w tabeli i
                  Kanbanie. Osoby z zakładki <strong style={{ color: "#93c5fd" }}>Pracownicy</strong>.
                </p>
              </>
            ) : null}
          </div>

          <div
            style={{
              ...op.sectionCard,
              marginBottom: "1rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.85rem",
              alignItems: "flex-end",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span style={{ color: "#cbd5e1", fontSize: "0.82rem", fontWeight: 600 }}>Widok</span>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={{
                    ...s.btnGhost,
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    padding: "0.48rem 0.85rem",
                    ...(zadaniaWidok === "tabela"
                      ? {
                          borderColor: "rgba(56,189,248,0.55)",
                          color: "#7dd3fc",
                          background: "rgba(56,189,248,0.12)",
                        }
                      : {}),
                  }}
                  onClick={() => setZadaniaWidok("tabela")}
                >
                  Tabela
                </button>
                <button
                  type="button"
                  style={{
                    ...s.btnGhost,
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    padding: "0.48rem 0.85rem",
                    ...(zadaniaWidok === "kanban"
                      ? {
                          borderColor: "rgba(56,189,248,0.55)",
                          color: "#7dd3fc",
                          background: "rgba(56,189,248,0.12)",
                        }
                      : {}),
                  }}
                  onClick={() => setZadaniaWidok("kanban")}
                >
                  Kanban
                </button>
              </div>
            </div>
            <label
              style={{
                ...s.label,
                marginBottom: 0,
                minWidth: "min(18rem, 100%)",
                fontSize: "0.88rem",
                color: "#cbd5e1",
              }}
            >
              Pracownik (filtr)
              <select
                style={{ ...s.input, fontSize: "0.9rem", padding: "0.55rem 0.7rem" }}
                value={zadaniaFiltrPracNr}
                onChange={(ev) => {
                  setZadaniaFiltrPracNr(ev.target.value);
                  if (!ev.target.value) setZadaniaFiltrTylkoOdpowiedzialny(false);
                }}
              >
                <option value="">— wszyscy —</option>
                {pracownicyPosortowani.map((p) => (
                  <option key={String(p.nr)} value={String(p.nr)}>
                    {String(p.nr)} — {p.imie_nazwisko ?? ""}
                  </option>
                ))}
              </select>
            </label>
            <label
              style={{
                ...s.label,
                marginBottom: 0,
                minWidth: "min(16rem, 100%)",
                fontSize: "0.88rem",
                color: "#cbd5e1",
              }}
            >
              Projekt (filtr KR)
              <select
                style={{ ...s.input, fontSize: "0.9rem", padding: "0.55rem 0.7rem" }}
                value={zadaniaFiltrKr}
                onChange={(ev) => setZadaniaFiltrKr(ev.target.value)}
              >
                <option value="">— wszystkie / dowolny KR —</option>
                <option value="__tylko_z_kr__">— tylko z przypisanym KR (karty z listy) —</option>
                <option value="__bez_kr__">— tylko bez KR (ogólne) —</option>
                {[...krList]
                  .sort((a, b) =>
                    String(a.kr ?? "").localeCompare(String(b.kr ?? ""), "pl", {
                      numeric: true,
                      sensitivity: "base",
                    })
                  )
                  .map((r) => (
                    <option key={String(r.kr)} value={String(r.kr).trim()}>
                      {String(r.kr).trim()}
                      {r.nazwa_obiektu?.trim() ? ` — ${r.nazwa_obiektu.trim()}` : ""}
                    </option>
                  ))}
              </select>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: zadaniaFiltrPracNr ? "pointer" : "default",
                color: zadaniaFiltrPracNr ? "#f1f5f9" : "#94a3b8",
                fontSize: "0.9rem",
                fontWeight: 500,
                marginBottom: "0.15rem",
                maxWidth: "min(22rem, 100%)",
                lineHeight: 1.4,
              }}
            >
              <input
                type="checkbox"
                style={{ width: "1.05rem", height: "1.05rem", flexShrink: 0, accentColor: "#38bdf8" }}
                checked={zadaniaFiltrTylkoOdpowiedzialny}
                disabled={!zadaniaFiltrPracNr}
                onChange={(ev) => setZadaniaFiltrTylkoOdpowiedzialny(ev.target.checked)}
              />
              Tylko jako osoba odpowiedzialna
            </label>
            {zadaniaFiltrPracNr || zadaniaFiltrKr ? (
              <span style={{ color: "#94a3b8", fontSize: "0.86rem", alignSelf: "center" }}>
                Wynik: {zadaniaPrzefiltrowane.length}
                {zadaniaFiltrKr === "__bez_kr__"
                  ? " (bez KR)"
                  : zadaniaFiltrKr === "__tylko_z_kr__"
                    ? " (tylko zadania z polem KR — karty w systemie)"
                    : zadaniaFiltrKr
                      ? ` (KR ${zadaniaFiltrKr})`
                      : ""}
                {zadaniaFiltrPracNr
                  ? zadaniaFiltrTylkoOdpowiedzialny
                    ? " · tylko wykonawca"
                    : " · wykonawca lub zlecający"
                  : ""}
              </span>
            ) : null}
          </div>

          {zadaniaFetchError ? null : zadaniaList.length === 0 ? (
            <p style={s.muted}>Brak zadań — dodaj pierwsze formularzem poniżej.</p>
          ) : zadaniaPrzefiltrowane.length === 0 ? (
            <p style={s.muted}>
              Brak zadań dla wybranego filtra — zmień pracownika, projekt KR lub odznacz „tylko odpowiedzialny”.
            </p>
          ) : zadaniaWidok === "kanban" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              {[
                { key: "oczekuje", label: "Oczekuje", sub: "kolejka / backlog" },
                { key: "w_trakcie", label: "W trakcie", sub: "robocze" },
                { key: "ukonczone", label: "Ukończone", sub: "zamknięte" },
                { key: "inne", label: "Inny / brak statusu", sub: "ustaw status w formularzu" },
              ].map((col) => (
                <div
                  key={col.key}
                  style={{
                    borderRadius: "14px",
                    border: "1px solid rgba(148,163,184,0.18)",
                    background: "rgba(15,23,42,0.65)",
                    padding: "0.65rem 0.55rem",
                    minHeight: "8rem",
                  }}
                >
                  <div style={{ marginBottom: "0.55rem", padding: "0 0.25rem" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f1f5f9" }}>{col.label}</div>
                    <div style={{ ...op.muted, fontSize: "0.68rem" }}>{col.sub}</div>
                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                      {zadaniaKanbanBuckets[col.key].length} kart
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                    {zadaniaKanbanBuckets[col.key].map((row) => {
                      const zt = kmTekstDoKomorki(row.zadanie);
                      const cur = String(row.status ?? "").trim();
                      return (
                        <div
                          key={row.id}
                          style={{
                            borderRadius: "10px",
                            border: "1px solid rgba(51,65,85,0.55)",
                            background: "rgba(30,41,59,0.92)",
                            padding: "0.5rem 0.55rem",
                          }}
                        >
                          <div
                            title={zt.title}
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: "#f8fafc",
                              marginBottom: "0.35rem",
                              lineHeight: 1.35,
                            }}
                          >
                            {zt.text}
                          </div>
                          {tekstTrim(row.kr) ? (
                            <div style={{ marginBottom: "0.35rem" }}>
                              <span
                                style={{
                                  ...op.badge("rgba(56,189,248,0.2)", "#7dd3fc"),
                                  fontSize: "0.72rem",
                                  padding: "0.22rem 0.5rem",
                                }}
                              >
                                KR {String(row.kr).trim()}
                              </span>
                            </div>
                          ) : (
                            <div style={{ ...op.muted, fontSize: "0.65rem", marginBottom: "0.3rem" }}>
                              Ogólne (bez KR)
                            </div>
                          )}
                          <div
                            style={{
                              fontSize: "0.68rem",
                              color: "#94a3b8",
                              marginBottom: "0.35rem",
                              lineHeight: 1.4,
                            }}
                          >
                            <div>
                              <strong style={{ color: "#7dd3fc" }}>Odp.:</strong>{" "}
                              {podpisOsobyProwadzacej(row.osoba_odpowiedzialna, mapaProwadzacychId) ?? "—"}
                            </div>
                            <div>
                              <strong style={{ color: "#fcd34d" }}>Zlec.:</strong>{" "}
                              {podpisOsobyProwadzacej(row.osoba_zlecajaca, mapaProwadzacychId) ?? "—"}
                            </div>
                            {row.data_planowana ? (
                              <div>Plan: {dataDoInputa(row.data_planowana)}</div>
                            ) : null}
                            {row.data_realna ? (
                              <div style={{ color: "#86efac" }}>
                                Realizacja: {dataDoInputa(row.data_realna)}
                              </div>
                            ) : null}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.35rem" }}>
                            {ZADANIE_STATUS_W_BAZIE.map((st) => (
                              <button
                                key={`${row.id}-${st}`}
                                type="button"
                                style={{
                                  ...s.btnGhost,
                                  padding: "0.15rem 0.35rem",
                                  fontSize: "0.65rem",
                                  borderColor:
                                    cur === st ? "rgba(74,222,128,0.55)" : "rgba(148,163,184,0.25)",
                                  color: cur === st ? "#bbf7d0" : "#cbd5e1",
                                }}
                                onClick={() => void ustawStatusZadaniaSzybko(row.id, st)}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              style={{ ...s.btnGhost, padding: "0.2rem 0.45rem", fontSize: "0.7rem" }}
                              onClick={() => wczytajZadanieDoEdycji(row)}
                            >
                              Edytuj
                            </button>
                            <button
                              type="button"
                              style={{ ...s.btnGhost, padding: "0.2rem 0.45rem", fontSize: "0.7rem" }}
                              onClick={() => usunZadanie(row.id)}
                            >
                              Usuń
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ ...s.tableWrap, borderRadius: "16px", overflow: "hidden" }}>
              <table style={{ ...s.table, fontSize: "0.95rem", lineHeight: 1.45 }}>
                <thead>
                  <tr>
                    {[
                      { ch: "Zadanie", extra: null },
                      { ch: "KR", extra: { color: "#93c5fd" } },
                      { ch: "Kategoria", extra: null },
                      { ch: "Dział", extra: { color: "#7dd3fc" } },
                      { ch: "Odpow.", extra: null },
                      { ch: "Zlecający", extra: null },
                      { ch: "Status", extra: { color: "#a7f3d0" } },
                      { ch: "Plan", extra: null },
                      { ch: "Real", extra: null },
                      { ch: "Zagr.", extra: null },
                      { ch: "Opis", extra: null },
                      { ch: "", extra: null },
                    ].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          ...s.th,
                          fontSize: "0.88rem",
                          padding: "0.75rem 0.85rem",
                          whiteSpace: "normal",
                          lineHeight: 1.35,
                          verticalAlign: "bottom",
                          ...(h.extra ?? {}),
                        }}
                      >
                        {h.ch}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {zadaniaPrzefiltrowane.map((row) => {
                    const zt = kmTekstDoKomorki(row.zadanie);
                    const opisKom = kmTekstDoKomorki(row.opis);
                    const kat = zadaniaEtykietaKategorii(row);
                    const plan = dataDoSortuYYYYMMDD(row.data_planowana);
                    const stRow = String(row.status ?? "").trim();
                    const przeterm =
                      plan &&
                      plan < dzisiajDataYYYYMMDD() &&
                      !tekstTrim(row.data_realna) &&
                      !zadanieCzyUkonczoneStatus(row.status);
                    return (
                      <tr
                        key={row.id}
                        style={
                          przeterm
                            ? { background: "rgba(248,113,113,0.07)", boxShadow: "inset 3px 0 0 #f87171" }
                            : row.zagrozenie === true
                              ? { background: "rgba(251,191,36,0.06)", boxShadow: "inset 3px 0 0 #fbbf24" }
                              : undefined
                        }
                      >
                        <td style={{ ...s.td, padding: "0.65rem 0.85rem" }} title={zt.title || undefined}>
                          <strong style={{ color: "#f5f5f5", fontSize: "0.98rem", fontWeight: 600 }}>{zt.text}</strong>
                        </td>
                        <td style={{ ...s.td, padding: "0.65rem 0.85rem", fontFamily: "ui-monospace, monospace" }}>
                          {tekstTrim(row.kr) ? (
                            <span style={{ color: "#93c5fd", fontWeight: 600 }}>{String(row.kr).trim()}</span>
                          ) : (
                            <span style={{ color: "#64748b" }}>—</span>
                          )}
                        </td>
                        <td style={{ ...s.td, padding: "0.65rem 0.85rem" }}>
                          <span
                            style={{
                              ...op.badge("rgba(99,102,241,0.22)", "#c7d2fe"),
                              fontSize: "0.78rem",
                              padding: "0.35rem 0.65rem",
                              letterSpacing: "0.02em",
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                              maxWidth: "14rem",
                            }}
                          >
                            {kat}
                          </span>
                        </td>
                        <td style={{ ...s.td, ...s.dzialWartosc, padding: "0.65rem 0.85rem", fontSize: "0.95rem" }}>
                          {row.dzial?.trim() ? row.dzial : "—"}
                        </td>
                        <td style={{ ...s.td, padding: "0.65rem 0.85rem" }}>
                          {podpisOsobyProwadzacej(row.osoba_odpowiedzialna, mapaProwadzacychId) ?? "—"}
                        </td>
                        <td style={{ ...s.td, padding: "0.65rem 0.85rem" }}>
                          {podpisOsobyProwadzacej(row.osoba_zlecajaca, mapaProwadzacychId) ?? "—"}
                        </td>
                        <td style={{ ...s.td, ...s.statusKr, fontSize: "0.92rem", padding: "0.65rem 0.85rem" }}>
                          <select
                            style={{
                              ...s.input,
                              padding: "0.5rem 0.55rem",
                              fontSize: "0.9rem",
                              fontWeight: 500,
                              minWidth: "11rem",
                              lineHeight: 1.4,
                            }}
                            value={ZADANIE_STATUS_W_BAZIE.includes(stRow) ? stRow : ""}
                            onChange={(ev) => {
                              const v = ev.target.value;
                              if (v) void ustawStatusZadaniaSzybko(row.id, v);
                            }}
                          >
                            <option value="">— {stRow && !ZADANIE_STATUS_W_BAZIE.includes(stRow) ? stRow : "brak"} —</option>
                            {ZADANIE_STATUS_W_BAZIE.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ ...s.td, padding: "0.65rem 0.85rem" }}>
                          {row.data_planowana ? dataDoInputa(row.data_planowana) : "—"}
                        </td>
                        <td style={{ ...s.td, padding: "0.65rem 0.85rem" }}>
                          {row.data_realna ? dataDoInputa(row.data_realna) : "—"}
                        </td>
                        <td style={{ ...s.td, padding: "0.65rem 0.85rem" }}>
                          {row.zagrozenie === true ? "tak" : row.zagrozenie === false ? "nie" : "—"}
                        </td>
                        <td style={{ ...s.td, padding: "0.65rem 0.85rem" }} title={opisKom.title || undefined}>
                          {opisKom.text}
                        </td>
                        <td
                          style={{
                            ...s.td,
                            padding: "0.65rem 0.85rem",
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <button
                            type="button"
                            style={{ ...s.btnGhost, padding: "0.35rem 0.55rem", fontSize: "0.85rem" }}
                            onClick={() => wczytajZadanieDoEdycji(row)}
                          >
                            Edytuj
                          </button>{" "}
                          <button
                            type="button"
                            style={{ ...s.btnGhost, padding: "0.35rem 0.55rem", fontSize: "0.85rem" }}
                            onClick={() => usunZadanie(row.id)}
                          >
                            Usuń
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#fff",
              margin: "1.5rem 0 0.65rem",
            }}
          >
            {zadanieEdycjaId != null ? "Edycja zadania" : "Nowe zadanie"}
          </h3>
          <form
            style={{ ...s.form, maxWidth: "min(40rem, 100%)", marginBottom: "2rem" }}
            onSubmit={zapiszZadanie}
          >
            <label style={s.label}>
              Projekt (KR) — opcjonalnie
              <select
                style={s.input}
                value={String(zadanieForm.kr ?? "")}
                onChange={(ev) => setZadanieForm((f) => ({ ...f, kr: ev.target.value }))}
              >
                <option value="">— brak: zadanie ogólne (nie przy projekcie) —</option>
                {[...krList]
                  .sort((a, b) =>
                    String(a.kr ?? "").localeCompare(String(b.kr ?? ""), "pl", {
                      numeric: true,
                      sensitivity: "base",
                    })
                  )
                  .map((r) => (
                    <option key={String(r.kr)} value={String(r.kr).trim()}>
                      {String(r.kr).trim()}
                      {r.nazwa_obiektu?.trim() ? ` — ${r.nazwa_obiektu.trim()}` : ""}
                    </option>
                  ))}
              </select>
            </label>
            <p style={{ ...s.muted, margin: "-0.35rem 0 0", fontSize: "0.78rem" }}>
              Przy wybranym KR zadanie widać w filtrze i na kartach Kanban z etykietą projektu.
            </p>
            <label style={s.label}>
              Zadanie (wymagane)
              <input
                style={s.input}
                type="text"
                value={zadanieForm.zadanie}
                onChange={(ev) => setZadanieForm((f) => ({ ...f, zadanie: ev.target.value }))}
                required
              />
            </label>
            <label style={s.label}>
              Dział
              <input
                style={s.input}
                type="text"
                value={zadanieForm.dzial}
                onChange={(ev) => setZadanieForm((f) => ({ ...f, dzial: ev.target.value }))}
              />
            </label>
            <label style={s.label}>
              Osoba odpowiedzialna — <code style={s.code}>pracownik.nr</code>
              <select
                style={s.input}
                value={String(zadanieForm.osoba_odpowiedzialna ?? "")}
                onChange={(ev) =>
                  setZadanieForm((f) => ({ ...f, osoba_odpowiedzialna: ev.target.value }))
                }
              >
                <option value="">— brak —</option>
                {(() => {
                  const cur = String(zadanieForm.osoba_odpowiedzialna ?? "").trim();
                  const nrs = new Set(pracownicyPosortowani.map((p) => String(p.nr)));
                  const orphan = cur !== "" && !nrs.has(cur);
                  return (
                    <>
                      {orphan ? (
                        <option value={cur}>{cur} (nie w liście ID)</option>
                      ) : null}
                      {pracownicyPosortowani.map((p) => (
                        <option key={String(p.nr)} value={String(p.nr)}>
                          {String(p.nr)} — {p.imie_nazwisko ?? ""}
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </label>
            <label style={s.label}>
              Osoba zlecająca — <code style={s.code}>pracownik.nr</code>
              <select
                style={s.input}
                value={String(zadanieForm.osoba_zlecajaca ?? "")}
                onChange={(ev) =>
                  setZadanieForm((f) => ({ ...f, osoba_zlecajaca: ev.target.value }))
                }
              >
                <option value="">— brak —</option>
                {(() => {
                  const cur = String(zadanieForm.osoba_zlecajaca ?? "").trim();
                  const nrs = new Set(pracownicyPosortowani.map((p) => String(p.nr)));
                  const orphan = cur !== "" && !nrs.has(cur);
                  return (
                    <>
                      {orphan ? (
                        <option value={cur}>{cur} (nie w liście ID)</option>
                      ) : null}
                      {pracownicyPosortowani.map((p) => (
                        <option key={String(p.nr)} value={String(p.nr)}>
                          {String(p.nr)} — {p.imie_nazwisko ?? ""}
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </label>
            <label style={s.label}>
              Status
              <select
                style={s.input}
                value={zadanieForm.status}
                onChange={(ev) => setZadanieForm((f) => ({ ...f, status: ev.target.value }))}
              >
                <option value="">— brak —</option>
                {(() => {
                  const cur = String(zadanieForm.status ?? "").trim();
                  const znane = new Set(ZADANIE_STATUS_W_BAZIE);
                  const orphan = cur !== "" && !znane.has(cur);
                  return (
                    <>
                      {orphan ? (
                        <option value={cur}>{cur} (z bazy)</option>
                      ) : null}
                      {ZADANIE_STATUS_W_BAZIE.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </label>
            <label style={s.label}>
              Data planowana
              <input
                style={s.input}
                type="date"
                value={zadanieForm.data_planowana}
                onChange={(ev) =>
                  setZadanieForm((f) => ({ ...f, data_planowana: ev.target.value }))
                }
              />
            </label>
            <label style={s.label}>
              Data realna
              <input
                style={s.input}
                type="date"
                value={zadanieForm.data_realna}
                onChange={(ev) =>
                  setZadanieForm((f) => ({ ...f, data_realna: ev.target.value }))
                }
              />
            </label>
            <label style={s.label}>
              Zagrożenie
              <select
                style={s.input}
                value={zadanieForm.zagrozenie}
                onChange={(ev) =>
                  setZadanieForm((f) => ({ ...f, zagrozenie: ev.target.value }))
                }
              >
                <option value="">— nie ustawiono —</option>
                <option value="tak">tak</option>
                <option value="nie">nie</option>
              </select>
            </label>
            <label style={s.label}>
              Opis
              <textarea
                style={{ ...s.input, minHeight: "4rem", resize: "vertical" }}
                value={zadanieForm.opis}
                onChange={(ev) => setZadanieForm((f) => ({ ...f, opis: ev.target.value }))}
                rows={3}
              />
            </label>
            {pracFetchError ? (
              <p style={{ ...s.muted, margin: 0, fontSize: "0.82rem", color: "#fca5a5" }}>
                Lista ID: {pracFetchError}
              </p>
            ) : null}
            <div style={s.btnRow}>
              <button type="submit" style={s.btn}>
                {zadanieEdycjaId != null ? "Zapisz zmiany" : "Dodaj zadanie"}
              </button>
              {zadanieEdycjaId != null ? (
                <button type="button" style={s.btnGhost} onClick={anulujZadanieEdycje}>
                  Anuluj edycję
                </button>
              ) : null}
            </div>
          </form>
        </>
      ) : null}

      {widok === "podwykonawca" ? (
        <>
          <h2 style={{ ...s.h2, marginTop: 0 }}>PW — podwykonawcy</h2>
          {trybHelp ? (
            <p style={{ ...s.muted, marginBottom: "0.75rem" }}>
              Skrót <strong style={{ color: "#d4d4d4" }}>PW</strong> w menu to katalog firm. Zlecenia przy konkretnym KR
              dodajesz na liście projektów przez przycisk <strong>PW</strong> przy danym wierszu projektu.
            </p>
          ) : null}

          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 0.5rem",
            }}
          >
            Aktualne zlecenia PW (wszystkie KR)
          </h3>
          {trybHelp ? (
            <p style={{ ...s.muted, marginBottom: "0.65rem", fontSize: "0.82rem" }}>
              To jest podgląd zbiorczy wszystkich zleceń PW. Możesz je edytować lub usuwać tutaj albo z poziomu listy KR
              (przycisk <strong>PW</strong>).
            </p>
          ) : null}
          {pwZleceniaWszystkieFetchError ? (
            <div style={{ ...s.errBox, marginBottom: "1rem" }} role="alert">
              <strong>Nie udało się wczytać zleceń PW.</strong> {pwZleceniaWszystkieFetchError}
              <br />
              <span style={{ fontSize: "0.88em" }}>
                Uruchom <code style={s.code}>kr-zlecenie-podwykonawcy.sql</code> i RLS w{" "}
                <code style={s.code}>rls-policies-anon.sql</code>.
              </span>
            </div>
          ) : pwZleceniaWszystkieList.length === 0 ? (
            <p style={{ ...s.muted, marginBottom: "1.25rem" }}>Brak zapisanych zleceń PW w bazie.</p>
          ) : (
            <>
              <div style={{ ...s.tableWrap, marginBottom: "1rem" }}>
                <table style={{ ...s.table, fontSize: "0.82rem" }}>
                  <thead>
                    <tr>
                      <th style={s.th}>KR</th>
                      <th style={s.th}>Podwykonawca</th>
                      <th style={s.th}>Nr zlecenia</th>
                      <th style={s.th}>Zakres</th>
                      <th style={s.th}>Data zlecenia</th>
                      <th style={s.th}>Termin zlecenia</th>
                      <th style={s.th}>Data oddania</th>
                      <th style={s.th}>Netto</th>
                      <th style={s.th}>Status</th>
                      <th style={s.th}>Spr.</th>
                      <th style={s.th}>Odb.</th>
                      <th style={s.th}>Weryfikacja (nasz)</th>
                      <th style={s.th}>Faktury (PW)</th>
                      <th style={s.th} />
                    </tr>
                  </thead>
                  <tbody>
                    {pwZleceniaWszystkieList.map((z) => {
                      const zakres = kmTekstDoKomorki(z.opis_zakresu);
                      const fakt =
                        [z.osoba_faktury_nazwa, z.osoba_faktury_email, z.osoba_faktury_telefon]
                          .filter((x) => x != null && String(x).trim() !== "")
                          .join(" · ") || "—";
                      const firma =
                        z.podwykonawca &&
                        typeof z.podwykonawca === "object" &&
                        !Array.isArray(z.podwykonawca)
                          ? z.podwykonawca.nazwa_firmy
                          : null;
                      return (
                        <tr key={z.id}>
                          <td style={s.td}>
                            <strong style={{ color: "#7dd3fc" }}>{z.kr?.trim() ? z.kr : "—"}</strong>
                          </td>
                          <td style={s.td}>
                            <strong style={{ color: "#f5f5f5" }}>{firma?.trim() ? firma : "—"}</strong>
                          </td>
                          <td style={s.td}>{z.numer_zlecenia?.trim() ? z.numer_zlecenia : "—"}</td>
                          <td style={s.td} title={zakres.title || undefined}>
                            {zakres.text}
                          </td>
                          <td style={s.td}>{z.data_zlecenia ? dataDoInputa(z.data_zlecenia) : "—"}</td>
                          <td style={s.td}>{z.termin_zlecenia ? dataDoInputa(z.termin_zlecenia) : "—"}</td>
                          <td style={s.td}>{z.data_oddania ? dataDoInputa(z.data_oddania) : "—"}</td>
                          <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                            {krZleceniePwKwotaEtykieta(z.cena_netto)}
                          </td>
                          <td style={s.td}>{z.status?.trim() ? z.status : "—"}</td>
                          <td style={s.td}>{z.czy_sprawdzone === true ? "tak" : "nie"}</td>
                          <td style={s.td}>{z.czy_odebrane === true ? "tak" : "nie"}</td>
                          <td style={s.td}>
                            {podpisOsobyProwadzacej(z.pracownik_weryfikacja, mapaProwadzacychId) ?? "—"}
                          </td>
                          <td style={{ ...s.td, maxWidth: "10rem" }} title={fakt !== "—" ? fakt : undefined}>
                            {fakt === "—" ? "—" : fakt.length > 32 ? `${fakt.slice(0, 30)}…` : fakt}
                          </td>
                          <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                            <button
                              type="button"
                              style={{ ...s.btnGhost, padding: "0.2rem 0.45rem", fontSize: "0.72rem" }}
                              onClick={() => wczytajKrZleceniePwDoEdycji(z)}
                            >
                              Edytuj
                            </button>{" "}
                            <button
                              type="button"
                              style={{ ...s.btnGhost, padding: "0.2rem 0.45rem", fontSize: "0.72rem" }}
                              onClick={() => usunKrZleceniePw(z.id, z.kr)}
                            >
                              Usuń
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {krZleceniePwEdycjaId != null ? (
                <>
                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "#fff",
                      margin: "0 0 0.5rem",
                    }}
                  >
                    Edycja zlecenia PW — KR{" "}
                    <strong style={{ color: "#7dd3fc" }}>{krZleceniePwKontekstKr ?? "—"}</strong>
                  </h3>
                  <form
                    style={{ ...s.form, maxWidth: "min(40rem, 100%)", marginBottom: "1.75rem" }}
                    onSubmit={zapiszKrZleceniePw}
                  >
                    <label style={s.label}>
                      Podwykonawca <span style={{ color: "#fca5a5" }}>*</span>
                      <select
                        style={s.input}
                        value={krZleceniePwForm.podwykonawca_id}
                        onChange={(ev) =>
                          setKrZleceniePwForm((f) => ({ ...f, podwykonawca_id: ev.target.value }))
                        }
                        required
                      >
                        <option value="">— wybierz z bazy PW —</option>
                        {podwykonawcyPosortowani.map((p) => (
                          <option key={String(p.id)} value={String(p.id)}>
                            {String(p.nazwa_firmy ?? "").trim() || `id ${p.id}`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={s.label}>
                      Numer zlecenia (u nas / u PW)
                      <input
                        style={s.input}
                        type="text"
                        value={krZleceniePwForm.numer_zlecenia}
                        onChange={(ev) =>
                          setKrZleceniePwForm((f) => ({ ...f, numer_zlecenia: ev.target.value }))
                        }
                      />
                    </label>
                    <label style={s.label}>
                      Zakres / opis zlecenia
                      <textarea
                        style={{ ...s.input, minHeight: "3.5rem", resize: "vertical" }}
                        value={krZleceniePwForm.opis_zakresu}
                        onChange={(ev) =>
                          setKrZleceniePwForm((f) => ({ ...f, opis_zakresu: ev.target.value }))
                        }
                        rows={2}
                      />
                    </label>
                    <label style={s.label}>
                      Data zlecenia
                      <input
                        style={s.input}
                        type="date"
                        value={krZleceniePwForm.data_zlecenia}
                        onChange={(ev) =>
                          setKrZleceniePwForm((f) => ({ ...f, data_zlecenia: ev.target.value }))
                        }
                      />
                    </label>
                    <label style={s.label}>
                      Termin zlecenia — planowany
                      <input
                        style={s.input}
                        type="date"
                        value={krZleceniePwForm.termin_zlecenia}
                        onChange={(ev) =>
                          setKrZleceniePwForm((f) => ({ ...f, termin_zlecenia: ev.target.value }))
                        }
                      />
                    </label>
                    <label style={s.label}>
                      Data oddania — faktyczna
                      <input
                        style={s.input}
                        type="date"
                        value={krZleceniePwForm.data_oddania}
                        onChange={(ev) =>
                          setKrZleceniePwForm((f) => ({ ...f, data_oddania: ev.target.value }))
                        }
                      />
                    </label>
                    <label style={s.label}>
                      Cena netto (PLN)
                      <input
                        style={s.input}
                        type="text"
                        inputMode="decimal"
                        placeholder="np. 12500,50"
                        value={krZleceniePwForm.cena_netto}
                        onChange={(ev) =>
                          setKrZleceniePwForm((f) => ({ ...f, cena_netto: ev.target.value }))
                        }
                      />
                    </label>
                    <div style={{ marginBottom: "0.85rem" }}>
                      <span
                        style={{ display: "block", marginBottom: "0.4rem", color: "#d4d4d4", fontSize: "0.82rem" }}
                      >
                        Odbiór / weryfikacja
                      </span>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                          marginBottom: "0.35rem",
                          color: "#e5e5e5",
                          fontSize: "0.88rem",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={krZleceniePwForm.czy_sprawdzone}
                          onChange={(ev) =>
                            setKrZleceniePwForm((f) => ({ ...f, czy_sprawdzone: ev.target.checked }))
                          }
                        />
                        Sprawdzone
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                          color: "#e5e5e5",
                          fontSize: "0.88rem",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={krZleceniePwForm.czy_odebrane}
                          onChange={(ev) =>
                            setKrZleceniePwForm((f) => ({ ...f, czy_odebrane: ev.target.checked }))
                          }
                        />
                        Odebrane
                      </label>
                    </div>
                    <label style={s.label}>
                      Status
                      <input
                        style={s.input}
                        type="text"
                        placeholder="np. w trakcie, rozliczone"
                        value={krZleceniePwForm.status}
                        onChange={(ev) =>
                          setKrZleceniePwForm((f) => ({ ...f, status: ev.target.value }))
                        }
                      />
                    </label>
                    <label style={s.label}>
                      Osoba weryfikacji — nasz pracownik (<code style={s.code}>pracownik</code>)
                      <select
                        style={s.input}
                        value={String(krZleceniePwForm.pracownik_weryfikacja ?? "")}
                        onChange={(ev) =>
                          setKrZleceniePwForm((f) => ({
                            ...f,
                            pracownik_weryfikacja: ev.target.value,
                          }))
                        }
                      >
                        <option value="">— brak —</option>
                        {pracownicyPosortowani.map((p) => (
                          <option key={String(p.nr)} value={String(p.nr)}>
                            {String(p.nr)} — {p.imie_nazwisko ?? ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={s.label}>
                      Kontakt fakturowy — osoba (PW)
                      <input
                        style={s.input}
                        type="text"
                        value={krZleceniePwForm.osoba_faktury_nazwa}
                        onChange={(ev) =>
                          setKrZleceniePwForm((f) => ({
                            ...f,
                            osoba_faktury_nazwa: ev.target.value,
                          }))
                        }
                      />
                    </label>
                    <label style={s.label}>
                      E-mail do faktur (PW)
                      <input
                        style={s.input}
                        type="email"
                        autoComplete="email"
                        value={krZleceniePwForm.osoba_faktury_email}
                        onChange={(ev) =>
                          setKrZleceniePwForm((f) => ({
                            ...f,
                            osoba_faktury_email: ev.target.value,
                          }))
                        }
                      />
                    </label>
                    <label style={s.label}>
                      Telefon fakturowy (PW)
                      <input
                        style={s.input}
                        type="text"
                        inputMode="tel"
                        value={krZleceniePwForm.osoba_faktury_telefon}
                        onChange={(ev) =>
                          setKrZleceniePwForm((f) => ({
                            ...f,
                            osoba_faktury_telefon: ev.target.value,
                          }))
                        }
                      />
                    </label>
                    <label style={s.label}>
                      Uwagi
                      <textarea
                        style={{ ...s.input, minHeight: "2.75rem", resize: "vertical" }}
                        value={krZleceniePwForm.uwagi}
                        onChange={(ev) =>
                          setKrZleceniePwForm((f) => ({ ...f, uwagi: ev.target.value }))
                        }
                        rows={2}
                      />
                    </label>
                    <div style={s.btnRow}>
                      <button type="submit" style={s.btn}>
                        Zapisz zmiany
                      </button>
                      <button type="button" style={s.btnGhost} onClick={anulujKrZleceniePwEdycje}>
                        Anuluj edycję
                      </button>
                    </div>
                  </form>
                </>
              ) : null}
            </>
          )}

          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 0.5rem",
            }}
          >
            Katalog firm (podwykonawca)
          </h3>

          {podwykonawcyFetchError ? null : podwykonawcyList.length === 0 ? (
            <p style={s.muted}>Brak wpisów — dodaj pierwszego podwykonawcę poniżej.</p>
          ) : (
            <div style={s.tableWrap}>
              <table style={{ ...s.table, fontSize: "0.88rem" }}>
                <thead>
                  <tr>
                    <th style={s.th}>Nazwa firmy</th>
                    <th style={s.th}>Osoba kontaktowa</th>
                    <th style={s.th}>Telefon</th>
                    <th style={s.th} />
                  </tr>
                </thead>
                <tbody>
                  {podwykonawcyList.map((row) => (
                    <tr key={row.id}>
                      <td style={s.td}>
                        <strong style={{ color: "#f5f5f5" }}>
                          {row.nazwa_firmy?.trim() ? row.nazwa_firmy : "—"}
                        </strong>
                      </td>
                      <td style={s.td}>{row.osoba_kontaktowa?.trim() ? row.osoba_kontaktowa : "—"}</td>
                      <td style={s.td}>{row.telefon?.trim() ? row.telefon : "—"}</td>
                      <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          style={{ ...s.btnGhost, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          onClick={() => wczytajPwDoEdycji(row)}
                        >
                          Edytuj
                        </button>{" "}
                        <button
                          type="button"
                          style={{ ...s.btnGhost, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          onClick={() => usunPodwykonawce(row.id)}
                        >
                          Usuń
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#fff",
              margin: "1.5rem 0 0.65rem",
            }}
          >
            {pwEdycjaId != null ? "Edycja podwykonawcy" : "Nowy podwykonawca"}
          </h3>
          <form
            style={{ ...s.form, maxWidth: "min(36rem, 100%)", marginBottom: "2rem" }}
            onSubmit={zapiszPodwykonawce}
          >
            <label style={s.label}>
              Nazwa firmy <span style={{ color: "#fca5a5" }}>*</span>
              <input
                style={s.input}
                type="text"
                value={pwForm.nazwa_firmy}
                onChange={(ev) => setPwForm((f) => ({ ...f, nazwa_firmy: ev.target.value }))}
                required
              />
            </label>
            <label style={s.label}>
              Osoba kontaktowa
              <input
                style={s.input}
                type="text"
                value={pwForm.osoba_kontaktowa}
                onChange={(ev) =>
                  setPwForm((f) => ({ ...f, osoba_kontaktowa: ev.target.value }))
                }
              />
            </label>
            <label style={s.label}>
              Telefon
              <input
                style={s.input}
                type="text"
                inputMode="tel"
                autoComplete="tel"
                value={pwForm.telefon}
                onChange={(ev) => setPwForm((f) => ({ ...f, telefon: ev.target.value }))}
              />
            </label>
            <div style={s.btnRow}>
              <button type="submit" style={s.btn}>
                {pwEdycjaId != null ? "Zapisz zmiany" : "Dodaj podwykonawcę"}
              </button>
              {pwEdycjaId != null ? (
                <button type="button" style={s.btnGhost} onClick={anulujPwEdycje}>
                  Anuluj edycję
                </button>
              ) : null}
            </div>
          </form>
        </>
      ) : null}

      {widok === "samochody" ? (
        <>
          <div style={op.heroCard}>
            <h2 style={{ ...op.sectionTitle, marginTop: 0 }}>Samochody</h2>
            {trybHelp ? (
              <p style={{ ...op.muted, marginBottom: 0, maxWidth: "46rem", lineHeight: 1.5 }}>
                Lista pojazdów: ważność polisy i przeglądu, uwagi o działaniu oraz naprawach. W kalendarzu kliknij komórkę,
                aby ustawić lub poprawić przypisanie: samochód, dzień i pracownik.
              </p>
            ) : null}
          </div>

          {samochodyList.length === 0 && !samochodyFetchError ? (
            <p style={s.muted}>Brak pojazdów w bazie — dodaj pierwszy formularzem poniżej, żeby pojawiły się w kalendarzu.</p>
          ) : samochodyList.length > 0 ? (
            <div style={{ ...s.tableWrap, marginBottom: "1.25rem", borderRadius: "12px", overflow: "hidden" }}>
              <table style={{ ...s.table, fontSize: "0.82rem" }}>
                <thead>
                  <tr>
                    <th style={s.th}>Pojazd</th>
                    <th style={s.th}>Rej.</th>
                    <th style={s.th}>Polisa ważna</th>
                    <th style={s.th}>Nr polisy</th>
                    <th style={s.th}>Przegląd</th>
                    <th style={s.th}>Uwagi (ekspl.)</th>
                    <th style={s.th}>Naprawy</th>
                    <th style={s.th} />
                  </tr>
                </thead>
                <tbody>
                  {samochodyList.map((car) => {
                    const u = kmTekstDoKomorki(car.uwagi_eksploatacja);
                    const nap = kmTekstDoKomorki(car.wymagane_naprawy);
                    const naprawa = samochodWymagaNaprawy(car);
                    return (
                      <tr
                        key={car.id}
                        style={
                          naprawa
                            ? {
                                background: "rgba(248,113,113,0.12)",
                                boxShadow: "inset 4px 0 0 #ef4444",
                              }
                            : undefined
                        }
                      >
                        <td style={s.td}>
                          <strong style={{ color: naprawa ? "#fecaca" : "#fafafa" }}>
                            {car.nazwa?.trim() || "—"}
                            {naprawa ? (
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  color: "#f87171",
                                  marginTop: "0.2rem",
                                }}
                              >
                                Wymaga naprawy
                              </span>
                            ) : null}
                          </strong>
                        </td>
                        <td style={s.td}>{car.numer_rejestracyjny?.trim() ? car.numer_rejestracyjny : "—"}</td>
                        <td style={s.td}>
                          {car.polisa_wazna_do ? dataDoInputa(car.polisa_wazna_do) : "—"}
                        </td>
                        <td style={s.td}>{car.polisa_numer?.trim() ? car.polisa_numer : "—"}</td>
                        <td style={s.td}>
                          {car.przeglad_wazny_do ? dataDoInputa(car.przeglad_wazny_do) : "—"}
                        </td>
                        <td style={s.td} title={u.title}>
                          {u.text}
                        </td>
                        <td
                          style={{
                            ...s.td,
                            ...(naprawa
                              ? { color: "#fecaca", fontWeight: 600 }
                              : {}),
                          }}
                          title={nap.title}
                        >
                          {nap.text}
                        </td>
                        <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            style={{ ...s.btnGhost, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                            onClick={() => wczytajSamochodDoEdycji(car)}
                          >
                            Edytuj
                          </button>{" "}
                          <button
                            type="button"
                            style={{ ...s.btnGhost, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                            onClick={() => usunSamochod(car.id)}
                          >
                            Usuń
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 0.65rem",
            }}
          >
            {samochodEdycjaId != null ? "Edycja pojazdu" : "Nowy pojazd"}
          </h3>
          <form style={{ ...s.form, maxWidth: "min(40rem, 100%)", marginBottom: "1.75rem" }} onSubmit={zapiszSamochod}>
            <label style={s.label}>
              Nazwa / opis pojazdu <span style={{ color: "#fca5a5" }}>*</span>
              <input
                style={s.input}
                type="text"
                value={samochodForm.nazwa}
                onChange={(ev) => setSamochodForm((f) => ({ ...f, nazwa: ev.target.value }))}
                required
                placeholder="np. Skoda Octavia · WX 12345"
              />
            </label>
            <label style={s.label}>
              Numer rejestracyjny
              <input
                style={s.input}
                type="text"
                value={samochodForm.numer_rejestracyjny}
                onChange={(ev) => setSamochodForm((f) => ({ ...f, numer_rejestracyjny: ev.target.value }))}
              />
            </label>
            <label style={s.label}>
              Nr polisy (na później można rozwinąć osobną tabelę ubezpieczeń)
              <input
                style={s.input}
                type="text"
                value={samochodForm.polisa_numer}
                onChange={(ev) => setSamochodForm((f) => ({ ...f, polisa_numer: ev.target.value }))}
              />
            </label>
            <label style={s.label}>
              Polisa ważna do
              <input
                style={s.input}
                type="date"
                value={samochodForm.polisa_wazna_do}
                onChange={(ev) => setSamochodForm((f) => ({ ...f, polisa_wazna_do: ev.target.value }))}
              />
            </label>
            <label style={s.label}>
              Przegląd ważny do
              <input
                style={s.input}
                type="date"
                value={samochodForm.przeglad_wazny_do}
                onChange={(ev) => setSamochodForm((f) => ({ ...f, przeglad_wazny_do: ev.target.value }))}
              />
            </label>
            <label style={s.label}>
              Zgłoszone uwagi o działaniu / stanie
              <textarea
                style={{ ...s.input, minHeight: "3.5rem" }}
                value={samochodForm.uwagi_eksploatacja}
                onChange={(ev) => setSamochodForm((f) => ({ ...f, uwagi_eksploatacja: ev.target.value }))}
                rows={2}
              />
            </label>
            {czyWidziNaprawyFloty ? (
              <label style={s.label}>
                Zgłoszenie — wymagane naprawy
                <textarea
                  style={{ ...s.input, minHeight: "3.5rem" }}
                  value={samochodForm.wymagane_naprawy}
                  onChange={(ev) => setSamochodForm((f) => ({ ...f, wymagane_naprawy: ev.target.value }))}
                  rows={2}
                />
              </label>
            ) : null}
            <label style={s.label}>
              Inne notatki
              <textarea
                style={{ ...s.input, minHeight: "2.5rem" }}
                value={samochodForm.notatki}
                onChange={(ev) => setSamochodForm((f) => ({ ...f, notatki: ev.target.value }))}
                rows={2}
              />
            </label>
            <div style={s.btnRow}>
              <button type="submit" style={s.btn}>
                {samochodEdycjaId != null ? "Zapisz pojazd" : "Dodaj pojazd"}
              </button>
              {samochodEdycjaId != null ? (
                <button type="button" style={s.btnGhost} onClick={anulujSamochodEdycje}>
                  Anuluj edycję
                </button>
              ) : null}
            </div>
          </form>

          <div style={{ ...op.sectionCard, marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.65rem", marginBottom: "0.75rem" }}>
              <h3 style={{ ...op.sectionTitle, margin: 0, fontSize: "1.05rem" }}>Kalendarz — kto ma które auto</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginLeft: "auto" }}>
                <button
                  type="button"
                  style={{ ...s.btnGhost, padding: "0.35rem 0.65rem", fontSize: "0.78rem" }}
                  onClick={() => {
                    if (kalFlotaMiesiac <= 1) {
                      setKalFlotaRok((y) => y - 1);
                      setKalFlotaMiesiac(12);
                    } else {
                      setKalFlotaMiesiac((m) => m - 1);
                    }
                  }}
                >
                  ← Miesiąc
                </button>
                <span style={{ fontSize: "0.88rem", color: "#e2e8f0", minWidth: "10rem", textAlign: "center" }}>
                  {new Date(kalFlotaRok, kalFlotaMiesiac - 1, 15).toLocaleDateString("pl-PL", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <button
                  type="button"
                  style={{ ...s.btnGhost, padding: "0.35rem 0.65rem", fontSize: "0.78rem" }}
                  onClick={() => {
                    if (kalFlotaMiesiac >= 12) {
                      setKalFlotaRok((y) => y + 1);
                      setKalFlotaMiesiac(1);
                    } else {
                      setKalFlotaMiesiac((m) => m + 1);
                    }
                  }}
                >
                  Miesiąc →
                </button>
              </div>
            </div>
            {samochodyList.length === 0 ? (
              <p style={{ ...op.muted, margin: 0 }}>Dodaj pojazd — wtedy zobaczysz siatkę dni.</p>
            ) : (
              <div style={{ overflowX: "auto", marginBottom: "0.85rem" }}>
                <table style={{ borderCollapse: "separate", borderSpacing: "2px", fontSize: "0.68rem" }}>
                  <thead>
                    <tr>
                      <th
                        style={{
                          position: "sticky",
                          left: 0,
                          zIndex: 2,
                          background: "#0f172a",
                          color: "#94a3b8",
                          textAlign: "left",
                          padding: "0.35rem 0.5rem",
                          minWidth: "7.5rem",
                          borderRadius: "6px 0 0 0",
                        }}
                      >
                        Auto
                      </th>
                      {Array.from(
                        { length: new Date(kalFlotaRok, kalFlotaMiesiac, 0).getDate() },
                        (_, i) => i + 1
                      ).map((dz) => {
                        const iso = `${kalFlotaRok}-${String(kalFlotaMiesiac).padStart(2, "0")}-${String(dz).padStart(2, "0")}`;
                        const wd = new Date(kalFlotaRok, kalFlotaMiesiac - 1, dz).getDay();
                        const weekend = wd === 0 || wd === 6;
                        return (
                          <th
                            key={dz}
                            style={{
                              padding: "0.2rem 0.15rem",
                              minWidth: "1.65rem",
                              textAlign: "center",
                              color: weekend ? "#64748b" : "#94a3b8",
                              fontWeight: 600,
                              background: weekend ? "rgba(30,41,59,0.6)" : "rgba(30,41,59,0.35)",
                            }}
                            title={iso}
                          >
                            {dz}
                            <span
                              style={{
                                display: "block",
                                fontSize: "0.58rem",
                                fontWeight: 500,
                                opacity: 0.85,
                              }}
                            >
                              {new Date(kalFlotaRok, kalFlotaMiesiac - 1, dz).toLocaleDateString("pl-PL", {
                                weekday: "short",
                              })}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {samochodyList.map((car) => {
                      const naprawaKal = samochodWymagaNaprawy(car);
                      return (
                      <tr key={car.id}>
                        <td
                          style={{
                            position: "sticky",
                            left: 0,
                            zIndex: 1,
                            background: naprawaKal ? "rgba(127,29,29,0.55)" : "#111a24",
                            color: naprawaKal ? "#fecaca" : "#e2e8f0",
                            padding: "0.35rem 0.5rem",
                            fontWeight: 600,
                            fontSize: "0.74rem",
                            borderTop: "1px solid rgba(148,163,184,0.12)",
                            maxWidth: "9rem",
                            boxShadow: naprawaKal ? "inset 3px 0 0 #ef4444" : undefined,
                          }}
                          title={naprawaKal ? "Zgłoszona naprawa — sprawdź pole w tabeli floty" : (car.nazwa ?? "")}
                        >
                          {car.nazwa?.trim() || "—"}
                        </td>
                        {Array.from(
                          { length: new Date(kalFlotaRok, kalFlotaMiesiac, 0).getDate() },
                          (_, i) => i + 1
                        ).map((dz) => {
                          const iso = `${kalFlotaRok}-${String(kalFlotaMiesiac).padStart(2, "0")}-${String(dz).padStart(2, "0")}`;
                          const rez = rezerwacjaMapKalendarz.get(`${car.id}|${iso}`);
                          const wd = new Date(kalFlotaRok, kalFlotaMiesiac - 1, dz).getDay();
                          const weekend = wd === 0 || wd === 6;
                          const krotki =
                            rez && rez.pracownik_nr
                              ? String(rez.pracownik_nr).slice(0, 5)
                              : "";
                          const pod = rez
                            ? podpisOsobyProwadzacej(rez.pracownik_nr, mapaProwadzacychId) ?? String(rez.pracownik_nr)
                            : "Wolne — kliknij, aby przypisać";
                          return (
                            <td key={dz} title={pod} style={{ padding: 0, verticalAlign: "middle" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setRezerwacjaForm({
                                    samochod_id: String(car.id),
                                    data_dnia: iso,
                                    pracownik_nr: rez ? String(rez.pracownik_nr) : "",
                                    opis_krotki: rez?.opis_krotki != null ? String(rez.opis_krotki) : "",
                                  });
                                }}
                                style={{
                                  width: "100%",
                                  minHeight: "2.1rem",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "0.62rem",
                                  fontWeight: 700,
                                  color: rez ? "#f8fafc" : "#475569",
                                  background: rez
                                    ? kolorRezerwacjiDlaPracownika(rez.pracownik_nr)
                                    : weekend
                                      ? "rgba(30,41,59,0.25)"
                                      : "rgba(30,41,59,0.12)",
                                }}
                              >
                                {krotki || "·"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginBottom: "0.35rem" }}>Legenda — kolory wg pracownika (ID):</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {[...new Set(rezerwacjeList.map((r) => String(r.pracownik_nr ?? "").trim()).filter(Boolean))].map((nr) => (
                <span
                  key={nr}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.2rem 0.45rem",
                    borderRadius: "6px",
                    background: "rgba(15,23,42,0.6)",
                    fontSize: "0.72rem",
                    color: "#e2e8f0",
                  }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      background: kolorRezerwacjiDlaPracownika(nr),
                    }}
                  />
                  {podpisOsobyProwadzacej(nr, mapaProwadzacychId) ?? nr}
                </span>
              ))}
            </div>
          </div>

          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 0.65rem",
            }}
          >
            Zapis rezerwacji (lub zmień po kliknięciu komórki)
          </h3>
          <form style={{ ...s.form, maxWidth: "min(36rem, 100%)", marginBottom: "1.25rem" }} onSubmit={zapiszRezerwacje}>
            <label style={s.label}>
              Samochód
              <select
                style={s.input}
                value={rezerwacjaForm.samochod_id}
                onChange={(ev) => setRezerwacjaForm((f) => ({ ...f, samochod_id: ev.target.value }))}
                required
              >
                <option value="">— wybierz —</option>
                {samochodyList.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nazwa?.trim() || c.id}
                  </option>
                ))}
              </select>
            </label>
            <label style={s.label}>
              Dzień
              <input
                style={s.input}
                type="date"
                value={rezerwacjaForm.data_dnia}
                onChange={(ev) => setRezerwacjaForm((f) => ({ ...f, data_dnia: ev.target.value }))}
                required
              />
            </label>
            <label style={s.label}>
              Pracownik (ID)
              <select
                style={s.input}
                value={String(rezerwacjaForm.pracownik_nr ?? "")}
                onChange={(ev) => setRezerwacjaForm((f) => ({ ...f, pracownik_nr: ev.target.value }))}
                required
              >
                <option value="">— wybierz —</option>
                {(() => {
                  const cur = String(rezerwacjaForm.pracownik_nr ?? "").trim();
                  const nrs = new Set(pracownicyPosortowani.map((p) => String(p.nr)));
                  const orphan = cur !== "" && !nrs.has(cur);
                  return (
                    <>
                      {orphan ? (
                        <option value={cur}>{cur} (nie w liście)</option>
                      ) : null}
                      {pracownicyPosortowani.map((p) => (
                        <option key={String(p.nr)} value={String(p.nr)}>
                          {String(p.nr)} — {p.imie_nazwisko ?? ""}
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </label>
            <label style={s.label}>
              Krótki opis (np. trasa, projekt — opcjonalnie)
              <input
                style={s.input}
                type="text"
                value={rezerwacjaForm.opis_krotki}
                onChange={(ev) => setRezerwacjaForm((f) => ({ ...f, opis_krotki: ev.target.value }))}
              />
            </label>
            {pracFetchError ? (
              <p style={{ ...s.muted, margin: 0, fontSize: "0.82rem", color: "#fca5a5" }}>
                Lista pracowników: {pracFetchError}
              </p>
            ) : null}
            <div style={s.btnRow}>
              <button type="submit" style={s.btn}>
                Zapisz / nadpisz ten dzień
              </button>
            </div>
          </form>

          {rezerwacjeList.length > 0 ? (
            <>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e2e8f0", margin: "0 0 0.5rem" }}>
                Wpisy w tym miesiącu
              </h3>
              <div style={{ ...s.tableWrap, borderRadius: "12px", overflow: "hidden", marginBottom: "2rem" }}>
                <table style={{ ...s.table, fontSize: "0.8rem" }}>
                  <thead>
                    <tr>
                      <th style={s.th}>Data</th>
                      <th style={s.th}>Auto</th>
                      <th style={s.th}>Pracownik</th>
                      <th style={s.th}>Opis</th>
                      <th style={s.th} />
                    </tr>
                  </thead>
                  <tbody>
                    {rezerwacjeList.map((rz) => {
                      const auto = samochodyList.find((c) => c.id === rz.samochod_id);
                      return (
                        <tr key={rz.id}>
                          <td style={s.td}>{dataDoInputa(rz.data_dnia)}</td>
                          <td style={s.td}>{auto?.nazwa?.trim() ?? rz.samochod_id}</td>
                          <td style={s.td}>
                            {podpisOsobyProwadzacej(rz.pracownik_nr, mapaProwadzacychId) ?? rz.pracownik_nr}
                          </td>
                          <td style={s.td}>{rz.opis_krotki?.trim() ? rz.opis_krotki : "—"}</td>
                          <td style={{ ...s.td, textAlign: "right" }}>
                            <button
                              type="button"
                              style={{ ...s.btnGhost, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                              onClick={() => usunRezerwacje(rz.id)}
                            >
                              Usuń
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {widok === "sprzet" ? (
        <>
          <div style={op.heroCard}>
            <h2 style={{ ...op.sectionTitle, marginTop: 0 }}>Sprzęt</h2>
            {trybHelp ? (
              <p style={{ ...op.muted, marginBottom: 0, maxWidth: "44rem", lineHeight: 1.5 }}>
                Komputery, drukarki i urządzenia wielofunkcyjne — z datą przeglądu/serwisu i opcjonalnym przypisaniem do
                pracownika.
              </p>
            ) : null}
          </div>

          {sprzetList.length === 0 && !sprzetFetchError ? (
            <p style={s.muted}>Brak wpisów — dodaj pierwszy sprzęt formularzem poniżej.</p>
          ) : sprzetList.length > 0 ? (
            <div style={{ ...s.tableWrap, marginBottom: "1.25rem", borderRadius: "12px", overflow: "hidden" }}>
              <table style={{ ...s.table, fontSize: "0.84rem" }}>
                <thead>
                  <tr>
                    <th style={s.th}>Typ</th>
                    <th style={s.th}>Nazwa</th>
                    <th style={s.th}>Inwentarz</th>
                    <th style={s.th}>Przegląd / serwis</th>
                    <th style={s.th}>Przypisany</th>
                    <th style={s.th}>Notatki</th>
                    <th style={s.th} />
                  </tr>
                </thead>
                <tbody>
                  {sprzetList.map((row) => {
                    const nt = kmTekstDoKomorki(row.notatki);
                    return (
                      <tr key={row.id}>
                        <td style={s.td}>
                          <span style={op.badge("rgba(99,102,241,0.22)", "#c7d2fe")}>
                            {row.typ?.trim() ? row.typ : "—"}
                          </span>
                        </td>
                        <td style={s.td}>
                          <strong style={{ color: "#fafafa" }}>{row.nazwa?.trim() || "—"}</strong>
                        </td>
                        <td style={s.td}>{row.numer_inwentarzowy?.trim() ? row.numer_inwentarzowy : "—"}</td>
                        <td style={s.td}>
                          {row.data_przegladu ? dataDoInputa(row.data_przegladu) : "—"}
                        </td>
                        <td style={s.td}>
                          {podpisOsobyProwadzacej(row.pracownik_nr, mapaProwadzacychId) ?? "—"}
                        </td>
                        <td style={s.td} title={nt.title}>
                          {nt.text}
                        </td>
                        <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            style={{ ...s.btnGhost, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                            onClick={() => wczytajSprzetDoEdycji(row)}
                          >
                            Edytuj
                          </button>{" "}
                          <button
                            type="button"
                            style={{ ...s.btnGhost, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                            onClick={() => usunSprzet(row.id)}
                          >
                            Usuń
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 0.65rem",
            }}
          >
            {sprzetEdycjaId != null ? "Edycja sprzętu" : "Nowy wpis"}
          </h3>
          <form style={{ ...s.form, maxWidth: "min(38rem, 100%)", marginBottom: "2rem" }} onSubmit={zapiszSprzetEwidencja}>
            <label style={s.label}>
              Typ
              <select
                style={s.input}
                value={sprzetForm.typ}
                onChange={(ev) => setSprzetForm((f) => ({ ...f, typ: ev.target.value }))}
              >
                {(() => {
                  const cur = String(sprzetForm.typ ?? "").trim();
                  const znane = new Set(SPRZET_TYP_W_BAZIE);
                  const orphan = cur !== "" && !znane.has(cur);
                  return (
                    <>
                      {orphan ? (
                        <option value={cur}>{cur} (z bazy)</option>
                      ) : null}
                      {SPRZET_TYP_W_BAZIE.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </label>
            <label style={s.label}>
              Nazwa <span style={{ color: "#fca5a5" }}>*</span>
              <input
                style={s.input}
                type="text"
                value={sprzetForm.nazwa}
                onChange={(ev) => setSprzetForm((f) => ({ ...f, nazwa: ev.target.value }))}
                required
              />
            </label>
            <label style={s.label}>
              Numer inwentarzowy
              <input
                style={s.input}
                type="text"
                value={sprzetForm.numer_inwentarzowy}
                onChange={(ev) => setSprzetForm((f) => ({ ...f, numer_inwentarzowy: ev.target.value }))}
              />
            </label>
            <label style={s.label}>
              Data przeglądu / serwisu (np. ksero, drukarka)
              <input
                style={s.input}
                type="date"
                value={sprzetForm.data_przegladu}
                onChange={(ev) => setSprzetForm((f) => ({ ...f, data_przegladu: ev.target.value }))}
              />
            </label>
            <label style={s.label}>
              Przypisany pracownik — <code style={s.code}>pracownik.nr</code>
              <select
                style={s.input}
                value={String(sprzetForm.pracownik_nr ?? "")}
                onChange={(ev) => setSprzetForm((f) => ({ ...f, pracownik_nr: ev.target.value }))}
              >
                <option value="">— biuro / magazyn —</option>
                {(() => {
                  const cur = String(sprzetForm.pracownik_nr ?? "").trim();
                  const nrs = new Set(pracownicyPosortowani.map((p) => String(p.nr)));
                  const orphan = cur !== "" && !nrs.has(cur);
                  return (
                    <>
                      {orphan ? (
                        <option value={cur}>{cur} (nie w liście)</option>
                      ) : null}
                      {pracownicyPosortowani.map((p) => (
                        <option key={String(p.nr)} value={String(p.nr)}>
                          {String(p.nr)} — {p.imie_nazwisko ?? ""}
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </label>
            <label style={s.label}>
              Notatki
              <textarea
                style={{ ...s.input, minHeight: "3rem" }}
                value={sprzetForm.notatki}
                onChange={(ev) => setSprzetForm((f) => ({ ...f, notatki: ev.target.value }))}
                rows={2}
              />
            </label>
            {pracFetchError ? (
              <p style={{ ...s.muted, margin: 0, fontSize: "0.82rem", color: "#fca5a5" }}>
                Lista pracowników: {pracFetchError}
              </p>
            ) : null}
            <div style={s.btnRow}>
              <button type="submit" style={s.btn}>
                {sprzetEdycjaId != null ? "Zapisz zmiany" : "Dodaj sprzęt"}
              </button>
              {sprzetEdycjaId != null ? (
                <button type="button" style={s.btnGhost} onClick={anulujSprzetEdycje}>
                  Anuluj edycję
                </button>
              ) : null}
            </div>
          </form>
        </>
      ) : null}

      {widok === "kr" && widokKmDlaKr ? (
        <section style={s.krTopWrap} aria-labelledby="etap-naglowek">
          <div style={{ marginBottom: "1rem" }}>
            <button type="button" style={s.btnGhost} onClick={powrotZKmDoListy}>
              {wybranyKrKlucz != null && String(wybranyKrKlucz).trim() === String(widokKmDlaKr).trim()
                ? "← Karta projektu"
                : widokPulpitDlaKr != null && String(widokPulpitDlaKr) === String(widokKmDlaKr)
                  ? "← Pulpit"
                  : "← Lista KR"}
            </button>
          </div>
          {wybranyRekordKr &&
          wybranyKrKlucz != null &&
          String(wybranyKrKlucz).trim() === String(widokKmDlaKr).trim()
            ? renderKrProjektPills(wybranyRekordKr)
            : null}
          <h2
            id="etap-naglowek"
            style={{ ...s.krTopTitle, fontSize: "0.98rem" }}
          >
            Etapy — KR {widokKmDlaKr}
          </h2>
          {trybHelp ? (
            <p style={{ ...s.muted, marginBottom: "0.75rem", fontSize: "0.82rem" }}>
              Etapy przypisane do tego KR. Pole <strong style={{ color: "#e5e5e5" }}>Etap</strong> jest wymagane, a{" "}
              <strong style={{ color: "#a7f3d0" }}>Status</strong> wybierasz z listy. Czerwień oznacza ryzyko lub braki
              wymagające reakcji.
            </p>
          ) : null}

          <div style={s.tableWrap}>
            <table style={s.kmTable}>
              <colgroup>
                <col style={{ width: "7%" }} />
                <col style={{ width: "6.5%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "4%" }} />
                <col style={{ width: "6.5%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "4%" }} />
                <col style={{ width: "4%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "6.5%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={s.kmTh}>Etap</th>
                  <th style={s.kmTh}>Status</th>
                  <th style={s.kmTh}>
                    <span>Odniesienie</span>
                    <span
                      style={{
                        display: "block",
                        fontWeight: 400,
                        fontSize: "0.6rem",
                        color: "#737373",
                        marginTop: "0.2rem",
                        lineHeight: 1.2,
                      }}
                    >
                      linia / zlecenie
                    </span>
                  </th>
                  <th style={s.kmTh}>+ mc</th>
                  <th style={s.kmTh}>Plan</th>
                  <th style={s.kmTh}>Odpow.</th>
                  <th style={s.kmTh}>Osiąg.</th>
                  <th style={s.kmTh}>Zagr.</th>
                  <th style={s.kmTh} title="Faktura sprzedażowa — skrót z tabeli faktury">
                    FS
                  </th>
                  <th style={s.kmTh} title="Protokół odbioru (faktura sprzedażowa)">
                    Prot.
                  </th>
                  <th style={s.kmTh} title="Data FS (najnowsza z wierszy)">
                    Data FS
                  </th>
                  <th style={s.kmTh}>Uwagi</th>
                  <th style={s.kmTh}>Opis zagrożenia</th>
                  <th style={s.kmTh} />
                </tr>
              </thead>
              <tbody>
                {listaKmDlaWidoku.map((row) => {
                  const uw = kmTekstDoKomorki(row.uwagi);
                  const oz = kmTekstDoKomorki(row.zagrozenie_opis);
                  const fsAgg = fakturySprzedazAgregatDlaEtapu(fakturySprzedazMapaPoEtapId.get(row.id));
                  return (
                    <tr key={row.id}>
                      <td style={s.kmTd}>
                        <strong style={{ color: "#f5f5f5", fontWeight: 600 }}>{row.etap ?? "—"}</strong>
                      </td>
                      <td
                        style={{
                          ...s.kmTd,
                          ...s.statusKr,
                          fontSize: "0.68rem",
                          ...stylKomorkiTabeliUwagi(pulpitKmPlanPrzeterminowany(row, dziśUwagiPulpitu)),
                        }}
                      >
                        {row.status ?? "—"}
                      </td>
                      <td style={s.kmTd}>{kmKomorkaOdniesienia(row)}</td>
                      <td style={s.kmTd}>
                        {row.offset_miesiecy != null && row.offset_miesiecy !== ""
                          ? String(row.offset_miesiecy)
                          : "—"}
                      </td>
                      <td
                        style={{
                          ...s.kmTd,
                          ...stylKomorkiTabeliUwagi(pulpitKmPlanPrzeterminowany(row, dziśUwagiPulpitu)),
                        }}
                      >
                        {row.data_planowana ? dataDoInputa(row.data_planowana) : "—"}
                      </td>
                      <td style={s.kmTd}>
                        {podpisOsobyProwadzacej(row.osoba_odpowiedzialna, mapaProwadzacychId) ?? "—"}
                      </td>
                      <td style={s.kmTd}>
                        {row.osiagniete === true ? "tak" : row.osiagniete === false ? "nie" : "—"}
                      </td>
                      <td
                        style={{
                          ...s.kmTd,
                          ...stylKomorkiTabeliUwagi(
                            row.zagrozenie === true || row.zagrozenie === "tak",
                          ),
                        }}
                      >
                        {row.zagrozenie === true ? "tak" : row.zagrozenie === false ? "nie" : "—"}
                      </td>
                      <td style={{ ...s.kmTd, fontSize: "0.65rem", color: "#d4c4f7" }}>
                        {pulpitInvFormatTakNieNieznane(fsAgg.zafakturowane)}
                      </td>
                      <td style={{ ...s.kmTd, fontSize: "0.65rem", color: "#d4c4f7" }}>
                        {pulpitInvFormatTakNieNieznane(fsAgg.protokol)}
                      </td>
                      <td style={{ ...s.kmTd, fontSize: "0.65rem", color: "#d4c4f7", whiteSpace: "nowrap" }}>
                        {fsAgg.dataPokaz ? dataPLZFormat(fsAgg.dataPokaz) : "—"}
                      </td>
                      <td style={s.kmTd} title={uw.title || undefined}>
                        {uw.text}
                      </td>
                      <td
                        style={{
                          ...s.kmTd,
                          ...stylKomorkiTabeliUwagi(!!tekstTrim(row.zagrozenie_opis)),
                        }}
                        title={oz.title || undefined}
                      >
                        {oz.text}
                      </td>
                      <td style={{ ...s.kmTd, ...s.kmTdAkcje }}>
                        <button
                          type="button"
                          style={{ ...s.btnGhost, padding: "0.22rem 0.4rem", fontSize: "0.65rem" }}
                          onClick={() => wczytajKmDoEdycji(row)}
                        >
                          Edytuj
                        </button>{" "}
                        <button
                          type="button"
                          style={{ ...s.btnGhost, padding: "0.22rem 0.4rem", fontSize: "0.65rem" }}
                          onClick={() => usunKm(row.id)}
                        >
                          Usuń
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {listaKmDlaWidoku.length === 0 ? (
            <p style={s.muted}>Brak zapisanych etapów — uzupełnij formularz poniżej.</p>
          ) : null}

          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#fff",
              marginTop: "1.35rem",
              marginBottom: "0.5rem",
            }}
          >
            {kmEdycjaId != null ? "Edycja wiersza" : "Nowy wiersz"}
          </h3>
          <form
            style={{
              ...s.form,
              maxWidth: "min(42rem, 100%)",
              width: "100%",
              marginBottom: 0,
              fontSize: "0.88rem",
            }}
            onSubmit={zapiszKm}
          >
            <label style={s.label}>
              Typ odniesienia — co oznacza data poniżej
              <select
                style={s.input}
                value={kmForm.typ_odniesienia}
                onChange={(ev) =>
                  setKmForm((f) => ({ ...f, typ_odniesienia: ev.target.value }))
                }
              >
                <option value="">— brak —</option>
                {(() => {
                  const cur = String(kmForm.typ_odniesienia ?? "").trim();
                  const orphan = cur !== "" && !ETAP_TYP_ODNIESIENIA_W_BAZIE.includes(cur);
                  return (
                    <>
                      {orphan ? (
                        <option value={cur}>
                          {cur} (spoza listy — wybierz Linia lub Zlecenie i zapisz)
                        </option>
                      ) : null}
                      <option value="linia">Linia (np. oś dokumentacji)</option>
                      <option value="zlecenie">Zlecenie</option>
                    </>
                  );
                })()}
              </select>
            </label>
            <label style={s.label}>
              Data odniesienia (od kiedy liczyć termin)
              <input
                style={s.input}
                type="date"
                value={kmForm.data_odniesienia}
                onChange={(ev) =>
                  setKmForm((f) => ({ ...f, data_odniesienia: ev.target.value }))
                }
              />
            </label>
            <label style={s.label}>
              Offset — liczba miesięcy
              <input
                style={s.input}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                placeholder="np. 6"
                value={kmForm.offset_miesiecy}
                onChange={(ev) =>
                  setKmForm((f) => ({ ...f, offset_miesiecy: ev.target.value }))
                }
              />
            </label>
            <label style={s.label}>
              Data planowania
              <input
                style={{ ...s.input, ...stylPolaUwagiPulpitu(kmFormPlanPrzeterminowany) }}
                type="date"
                value={kmForm.data_planowana}
                onChange={(ev) => setKmForm((f) => ({ ...f, data_planowana: ev.target.value }))}
              />
              <span style={{ ...s.muted, display: "block", marginTop: "0.35rem", fontSize: "0.8rem" }}>
                Przy obu polach powyżej i triggerze w bazie data planu zwykle ustawi się automatycznie;
                możesz też wpisać plan ręcznie (np. bez offsetu).
              </span>
            </label>
            <label style={s.label}>
              Etap <span style={{ color: "#fca5a5" }}>*</span>
              <input
                style={s.input}
                type="text"
                value={kmForm.etap}
                onChange={(ev) => setKmForm((f) => ({ ...f, etap: ev.target.value }))}
                required
              />
            </label>
            <label style={s.label}>
              Status etapu
              <select
                style={{
                  ...s.input,
                  ...s.statusKr,
                  ...stylPolaUwagiPulpitu(kmFormPlanPrzeterminowany),
                }}
                value={kmForm.status}
                onChange={(ev) => setKmForm((f) => ({ ...f, status: ev.target.value }))}
              >
                <option value="">— brak —</option>
                {(() => {
                  const cur = String(kmForm.status ?? "").trim();
                  const orphan = cur !== "" && !ETAP_STATUS_W_BAZIE.includes(cur);
                  return (
                    <>
                      {orphan ? (
                        <option value={cur}>
                          {cur} (nie ma na liście — wybierz status z listy poniżej i zapisz)
                        </option>
                      ) : null}
                      {ETAP_STATUS_W_BAZIE.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </label>
            <label style={s.label}>
              Osoba odpowiedzialna — z bazy <code style={s.code}>pracownik</code>
              <select
                style={s.input}
                value={kmForm.osoba_odpowiedzialna}
                onChange={(ev) =>
                  setKmForm((f) => ({ ...f, osoba_odpowiedzialna: ev.target.value }))
                }
              >
                <option value="">— brak —</option>
                {pracownicyPosortowani.map((p) => (
                  <option key={String(p.nr)} value={String(p.nr)}>
                    {String(p.nr)} — {p.imie_nazwisko ?? ""}
                  </option>
                ))}
              </select>
            </label>
            <label style={s.label}>
              Uwagi
              <textarea
                style={{ ...s.input, minHeight: "4.5rem", resize: "vertical" }}
                value={kmForm.uwagi}
                onChange={(ev) => setKmForm((f) => ({ ...f, uwagi: ev.target.value }))}
                rows={3}
              />
            </label>
            <label style={s.label}>
              Osiągnięte
              <select
                style={s.input}
                value={kmForm.osiagniete}
                onChange={(ev) => setKmForm((f) => ({ ...f, osiagniete: ev.target.value }))}
              >
                <option value="">— nie ustawiono —</option>
                <option value="tak">tak</option>
                <option value="nie">nie</option>
              </select>
            </label>
            <label style={s.label}>
              Zagrożenie
              <select
                style={{ ...s.input, ...stylPolaUwagiPulpitu(kmFormZagrozenieTak) }}
                value={kmForm.zagrozenie}
                onChange={(ev) => setKmForm((f) => ({ ...f, zagrozenie: ev.target.value }))}
              >
                <option value="">— nie ustawiono —</option>
                <option value="tak">tak</option>
                <option value="nie">nie</option>
              </select>
            </label>
            <label style={s.label}>
              Opis zagrożenia
              <textarea
                style={{
                  ...s.input,
                  minHeight: "3.5rem",
                  resize: "vertical",
                  ...stylPolaUwagiPulpitu(kmFormOpisZagrozeniaWypelniony),
                }}
                value={kmForm.zagrozenie_opis}
                onChange={(ev) =>
                  setKmForm((f) => ({ ...f, zagrozenie_opis: ev.target.value }))
                }
                rows={2}
              />
            </label>
            <div style={s.btnRow}>
              <button type="submit" style={s.btn}>
                {kmEdycjaId != null ? "Zapisz zmiany" : "Dodaj wiersz"}
              </button>
              {kmEdycjaId != null ? (
                <button type="button" style={s.btnGhost} onClick={anulujEdycjeKm}>
                  Anuluj edycję
                </button>
              ) : null}
            </div>
          </form>
        </section>
      ) : null}

      {widok === "kr" && widokPwDlaKr ? (
        <section style={s.krTopWrap} aria-labelledby="pw-kr-naglowek">
          <div style={{ marginBottom: "1rem" }}>
            <button type="button" style={s.btnGhost} onClick={powrotZPwDoListy}>
              {wybranyKrKlucz != null && String(wybranyKrKlucz).trim() === String(widokPwDlaKr).trim()
                ? "← Karta projektu"
                : widokPulpitDlaKr != null && String(widokPulpitDlaKr) === String(widokPwDlaKr)
                  ? "← Pulpit"
                  : "← Lista KR"}
            </button>
          </div>
          {wybranyRekordKr &&
          wybranyKrKlucz != null &&
          String(wybranyKrKlucz).trim() === String(widokPwDlaKr).trim()
            ? renderKrProjektPills(wybranyRekordKr)
            : null}
          <h2 id="pw-kr-naglowek" style={{ ...s.krTopTitle, fontSize: "0.98rem" }}>
            Zlecenia i podwykonawcy (PW) — KR {widokPwDlaKr}
          </h2>
          {trybHelp ? (
            <p style={{ ...s.muted, fontSize: "0.82rem", marginBottom: "0.65rem" }}>
              Zlecenia podwykonawcze dla tego KR. Czerwień oznacza zlecenie po terminie bez potwierdzenia odbioru.
            </p>
          ) : null}
          {krZleceniaPwFetchError ? (
            <div style={{ ...s.errBox, marginBottom: "0.75rem" }} role="alert">
              {krZleceniaPwFetchError}
              <br />
              <span style={{ fontSize: "0.88em" }}>
                Uruchom <code style={s.code}>kr-zlecenie-podwykonawcy.sql</code> oraz sekcję{" "}
                <code style={s.code}>kr_zlecenie_podwykonawcy</code> w{" "}
                <code style={s.code}>rls-policies-anon.sql</code>.
              </span>
            </div>
          ) : null}
          {krZleceniaPwFetchError ? null : krZleceniaPwList.length === 0 ? (
            <p style={s.muted}>Brak zapisanych zleceń PW dla tego KR.</p>
          ) : (
            <div style={{ ...s.tableWrap, marginBottom: "1rem" }}>
              <table style={{ ...s.table, fontSize: "0.82rem" }}>
                <thead>
                  <tr>
                    <th style={s.th}>Podwykonawca</th>
                    <th style={s.th}>Nr zlecenia</th>
                    <th style={s.th}>Zakres</th>
                    <th style={s.th}>Data zlec.</th>
                    <th style={s.th}>Termin</th>
                    <th style={s.th}>Netto</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Spr.</th>
                    <th style={s.th}>Odb.</th>
                    <th style={s.th}>Weryfikacja (nasz)</th>
                    <th style={s.th}>Faktury (PW)</th>
                    <th style={s.th} />
                  </tr>
                </thead>
                <tbody>
                  {krZleceniaPwList.map((z) => {
                    const zakres = kmTekstDoKomorki(z.opis_zakresu);
                    const fakt =
                      [z.osoba_faktury_nazwa, z.osoba_faktury_email, z.osoba_faktury_telefon]
                        .filter((x) => x != null && String(x).trim() !== "")
                        .join(" · ") || "—";
                    const firma =
                      z.podwykonawca && typeof z.podwykonawca === "object" && !Array.isArray(z.podwykonawca)
                        ? z.podwykonawca.nazwa_firmy
                        : null;
                    return (
                      <tr key={z.id}>
                        <td style={s.td}>
                          <strong style={{ color: "#f5f5f5" }}>{firma?.trim() ? firma : "—"}</strong>
                        </td>
                        <td style={s.td}>{z.numer_zlecenia?.trim() ? z.numer_zlecenia : "—"}</td>
                        <td style={s.td} title={zakres.title || undefined}>
                          {zakres.text}
                        </td>
                        <td style={s.td}>{z.data_zlecenia ? dataDoInputa(z.data_zlecenia) : "—"}</td>
                        <td
                          style={{
                            ...s.td,
                            ...stylKomorkiTabeliUwagi(pulpitPwWymagaUwagi(z, dziśUwagiPulpitu)),
                          }}
                        >
                          {z.termin_zlecenia ? dataDoInputa(z.termin_zlecenia) : "—"}
                        </td>
                        <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                          {krZleceniePwKwotaEtykieta(z.cena_netto)}
                        </td>
                        <td style={s.td}>{z.status?.trim() ? z.status : "—"}</td>
                        <td style={s.td}>{z.czy_sprawdzone === true ? "tak" : "nie"}</td>
                        <td
                          style={{
                            ...s.td,
                            ...stylKomorkiTabeliUwagi(pulpitPwWymagaUwagi(z, dziśUwagiPulpitu)),
                          }}
                        >
                          {z.czy_odebrane === true ? "tak" : "nie"}
                        </td>
                        <td style={s.td}>
                          {podpisOsobyProwadzacej(z.pracownik_weryfikacja, mapaProwadzacychId) ?? "—"}
                        </td>
                        <td style={{ ...s.td, maxWidth: "12rem" }} title={fakt !== "—" ? fakt : undefined}>
                          {fakt === "—" ? "—" : fakt.length > 42 ? `${fakt.slice(0, 40)}…` : fakt}
                        </td>
                        <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            style={{ ...s.btnGhost, padding: "0.2rem 0.45rem", fontSize: "0.72rem" }}
                            onClick={() => wczytajKrZleceniePwDoEdycji(z)}
                          >
                            Edytuj
                          </button>{" "}
                          <button
                            type="button"
                            style={{ ...s.btnGhost, padding: "0.2rem 0.45rem", fontSize: "0.72rem" }}
                            onClick={() => usunKrZleceniePw(z.id)}
                          >
                            Usuń
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 0.5rem",
            }}
          >
            {krZleceniePwEdycjaId != null ? "Edycja zlecenia PW" : "Nowe zlecenie PW"}
          </h3>
          <form
            style={{ ...s.form, maxWidth: "min(40rem, 100%)", marginBottom: "1.25rem" }}
            onSubmit={zapiszKrZleceniePw}
          >
            <label style={s.label}>
              Podwykonawca <span style={{ color: "#fca5a5" }}>*</span>
              <select
                style={s.input}
                value={krZleceniePwForm.podwykonawca_id}
                onChange={(ev) =>
                  setKrZleceniePwForm((f) => ({ ...f, podwykonawca_id: ev.target.value }))
                }
                required
              >
                <option value="">— wybierz z bazy PW —</option>
                {podwykonawcyPosortowani.map((p) => (
                  <option key={String(p.id)} value={String(p.id)}>
                    {String(p.nazwa_firmy ?? "").trim() || `id ${p.id}`}
                  </option>
                ))}
              </select>
              {podwykonawcyPosortowani.length === 0 ? (
                <span style={{ ...s.muted, fontSize: "0.78rem" }}>
                  Brak firm w bazie — dodaj je w zakładce <strong>PW</strong>.
                </span>
              ) : null}
            </label>
            <label style={s.label}>
              Numer zlecenia (u nas / u PW)
              <input
                style={s.input}
                type="text"
                value={krZleceniePwForm.numer_zlecenia}
                onChange={(ev) =>
                  setKrZleceniePwForm((f) => ({ ...f, numer_zlecenia: ev.target.value }))
                }
              />
            </label>
            <label style={s.label}>
              Zakres / opis zlecenia
              <textarea
                style={{ ...s.input, minHeight: "3.5rem", resize: "vertical" }}
                value={krZleceniePwForm.opis_zakresu}
                onChange={(ev) =>
                  setKrZleceniePwForm((f) => ({ ...f, opis_zakresu: ev.target.value }))
                }
                rows={2}
              />
            </label>
            <label style={s.label}>
              Data zlecenia
              <input
                style={s.input}
                type="date"
                value={krZleceniePwForm.data_zlecenia}
                onChange={(ev) =>
                  setKrZleceniePwForm((f) => ({ ...f, data_zlecenia: ev.target.value }))
                }
              />
            </label>
            <label style={s.label}>
              Termin zlecenia — planowany
              <input
                style={{ ...s.input, ...stylPolaUwagiPulpitu(pwFormWymagaUwagiPulpitu) }}
                type="date"
                value={krZleceniePwForm.termin_zlecenia}
                onChange={(ev) =>
                  setKrZleceniePwForm((f) => ({ ...f, termin_zlecenia: ev.target.value }))
                }
              />
            </label>
            <label style={s.label}>
              Data oddania — faktyczna
              <input
                style={s.input}
                type="date"
                value={krZleceniePwForm.data_oddania}
                onChange={(ev) =>
                  setKrZleceniePwForm((f) => ({ ...f, data_oddania: ev.target.value }))
                }
              />
            </label>
            <label style={s.label}>
              Cena netto (PLN)
              <input
                style={s.input}
                type="text"
                inputMode="decimal"
                placeholder="np. 12500,50"
                value={krZleceniePwForm.cena_netto}
                onChange={(ev) =>
                  setKrZleceniePwForm((f) => ({ ...f, cena_netto: ev.target.value }))
                }
              />
            </label>
            <div style={{ marginBottom: "0.85rem" }}>
              <span
                style={{ display: "block", marginBottom: "0.4rem", color: "#d4d4d4", fontSize: "0.82rem" }}
              >
                Odbiór / weryfikacja
              </span>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  marginBottom: "0.35rem",
                  color: "#e5e5e5",
                  fontSize: "0.88rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={krZleceniePwForm.czy_sprawdzone}
                  onChange={(ev) =>
                    setKrZleceniePwForm((f) => ({ ...f, czy_sprawdzone: ev.target.checked }))
                  }
                />
                Sprawdzone
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  color: "#e5e5e5",
                  fontSize: "0.88rem",
                  padding: "0.35rem 0.45rem",
                  borderRadius: "6px",
                  ...stylPolaUwagiPulpitu(pwFormWymagaUwagiPulpitu),
                }}
              >
                <input
                  type="checkbox"
                  checked={krZleceniePwForm.czy_odebrane}
                  onChange={(ev) =>
                    setKrZleceniePwForm((f) => ({ ...f, czy_odebrane: ev.target.checked }))
                  }
                />
                Odebrane
              </label>
            </div>
            <label style={s.label}>
              Status
              <input
                style={s.input}
                type="text"
                placeholder="np. w trakcie, rozliczone"
                value={krZleceniePwForm.status}
                onChange={(ev) =>
                  setKrZleceniePwForm((f) => ({ ...f, status: ev.target.value }))
                }
              />
            </label>
            <label style={s.label}>
              Osoba weryfikacji — nasz pracownik (<code style={s.code}>pracownik</code>)
              <select
                style={s.input}
                value={String(krZleceniePwForm.pracownik_weryfikacja ?? "")}
                onChange={(ev) =>
                  setKrZleceniePwForm((f) => ({
                    ...f,
                    pracownik_weryfikacja: ev.target.value,
                  }))
                }
              >
                <option value="">— brak —</option>
                {pracownicyPosortowani.map((p) => (
                  <option key={String(p.nr)} value={String(p.nr)}>
                    {String(p.nr)} — {p.imie_nazwisko ?? ""}
                  </option>
                ))}
              </select>
            </label>
            <label style={s.label}>
              Kontakt fakturowy — osoba (PW)
              <input
                style={s.input}
                type="text"
                value={krZleceniePwForm.osoba_faktury_nazwa}
                onChange={(ev) =>
                  setKrZleceniePwForm((f) => ({
                    ...f,
                    osoba_faktury_nazwa: ev.target.value,
                  }))
                }
              />
            </label>
            <label style={s.label}>
              E-mail do faktur (PW)
              <input
                style={s.input}
                type="email"
                autoComplete="email"
                value={krZleceniePwForm.osoba_faktury_email}
                onChange={(ev) =>
                  setKrZleceniePwForm((f) => ({
                    ...f,
                    osoba_faktury_email: ev.target.value,
                  }))
                }
              />
            </label>
            <label style={s.label}>
              Telefon fakturowy (PW)
              <input
                style={s.input}
                type="text"
                inputMode="tel"
                value={krZleceniePwForm.osoba_faktury_telefon}
                onChange={(ev) =>
                  setKrZleceniePwForm((f) => ({
                    ...f,
                    osoba_faktury_telefon: ev.target.value,
                  }))
                }
              />
            </label>
            <label style={s.label}>
              Uwagi
              <textarea
                style={{ ...s.input, minHeight: "2.75rem", resize: "vertical" }}
                value={krZleceniePwForm.uwagi}
                onChange={(ev) =>
                  setKrZleceniePwForm((f) => ({ ...f, uwagi: ev.target.value }))
                }
                rows={2}
              />
            </label>
            <div style={s.btnRow}>
              <button type="submit" style={s.btn}>
                {krZleceniePwEdycjaId != null ? "Zapisz zmiany" : "Dodaj zlecenie"}
              </button>
              {krZleceniePwEdycjaId != null ? (
                <button type="button" style={s.btnGhost} onClick={anulujKrZleceniePwEdycje}>
                  Anuluj edycję
                </button>
              ) : null}
            </div>
          </form>
        </section>
      ) : null}

      {widok === "kr" && widokLogDlaKr ? (
        <section style={s.krTopWrap} aria-labelledby="log-naglowek">
          <div style={{ marginBottom: "1rem" }}>
            <button type="button" style={s.btnGhost} onClick={powrotZLogDoListy}>
              {wybranyKrKlucz != null && String(wybranyKrKlucz).trim() === String(widokLogDlaKr).trim()
                ? "← Karta projektu"
                : widokPulpitDlaKr != null && String(widokPulpitDlaKr) === String(widokLogDlaKr)
                  ? "← Pulpit"
                  : "← Lista KR"}
            </button>
          </div>
          {wybranyRekordKr &&
          wybranyKrKlucz != null &&
          String(wybranyKrKlucz).trim() === String(widokLogDlaKr).trim()
            ? renderKrProjektPills(wybranyRekordKr)
            : null}
          <h2 id="log-naglowek" style={{ ...s.krTopTitle, fontSize: "0.98rem" }}>
            Zgłoszenia (dziennik zdarzeń) — KR {widokLogDlaKr}
          </h2>
          {trybHelp ? (
            <p style={{ ...s.muted, marginBottom: "0.75rem", fontSize: "0.82rem" }}>
              Zgłoszenia dla tego projektu. Czerwień oznacza wpis wymagający uzupełnienia lub domknięcia.
            </p>
          ) : null}

          {dziennikFetchError ? (
            <div style={s.errBox} role="alert">
              <strong>Nie udało się wczytać dziennika.</strong> {dziennikFetchError}
              <br />
              <span style={{ fontSize: "0.88em" }}>
                Jeśli to RLS — uruchom sekcję <code style={s.code}>dziennik_zdarzen</code> z{" "}
                <code style={s.code}>rls-policies-anon.sql</code>.
              </span>
            </div>
          ) : null}

          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Data</th>
                  <th style={s.th}>Typ</th>
                  <th style={{ ...s.th, color: "#a7f3d0" }}>Status</th>
                  <th style={s.th}>Opis</th>
                  <th style={s.th}>Zgłaszający</th>
                  <th style={s.th}>Wymagane działanie</th>
                  <th style={s.th}>Odpowiedzialny</th>
                  <th style={s.th}> </th>
                </tr>
              </thead>
              <tbody>
                {dziennikWpisy.map((row) => (
                  <tr key={row.id}>
                    <td style={s.td}>
                      {row.data_zdarzenia != null && String(row.data_zdarzenia).trim() !== ""
                        ? dataDoInputa(row.data_zdarzenia)
                        : "—"}
                    </td>
                    <td style={s.td}>
                      <strong style={{ color: "#f5f5f5" }}>{row.typ_zdarzenia ?? "—"}</strong>
                    </td>
                    <td style={{ ...s.td, ...s.statusKr, fontSize: "0.82rem" }}>
                      {row.status_zdarzenia?.trim() ? row.status_zdarzenia : "—"}
                    </td>
                    <td style={s.td}>{row.opis?.trim() ? row.opis : "—"}</td>
                    <td style={s.td}>
                      {podpisOsobyProwadzacej(row.osoba_zglaszajaca, mapaProwadzacychId) ?? "—"}
                    </td>
                    <td
                      style={{
                        ...s.td,
                        ...stylKomorkiTabeliUwagi(logWidokPodswietlGdyJestWymaganeDzialanie(row)),
                      }}
                    >
                      {row.wymagane_dzialanie?.trim() ? row.wymagane_dzialanie : "—"}
                    </td>
                    <td
                      style={{
                        ...s.td,
                        ...stylKomorkiTabeliUwagi(logWidokPodswietlGdyJestWymaganeDzialanie(row)),
                      }}
                    >
                      {podpisOsobyProwadzacej(
                        row.osoba_odpowiedzialna_za_zadanie,
                        mapaProwadzacychId
                      ) ?? "—"}
                    </td>
                    <td style={s.td}>
                      <button
                        type="button"
                        style={{ ...s.btnGhost, padding: "0.22rem 0.5rem", fontSize: "0.74rem" }}
                        onClick={() => wczytajLogDoEdycji(row)}
                      >
                        Edytuj
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {dziennikWpisy.length === 0 && !dziennikFetchError ? (
            <p style={s.muted}>Brak wpisów — dodaj zdarzenie formularzem poniżej.</p>
          ) : null}

          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#fff",
              marginTop: "1.35rem",
              marginBottom: "0.5rem",
            }}
          >
            {logEdycjaId != null ? "Edycja zdarzenia" : "Nowe zdarzenie"}
          </h3>
          <form
            style={{
              ...s.form,
              maxWidth: "min(42rem, 100%)",
              width: "100%",
            }}
            onSubmit={zapiszLogWpis}
          >
            <label style={s.label}>
              Typ zdarzenia (wymagane)
              <input
                style={s.input}
                type="text"
                value={logForm.typ_zdarzenia}
                onChange={(ev) => setLogForm((f) => ({ ...f, typ_zdarzenia: ev.target.value }))}
                required
              />
            </label>
            <label style={s.label}>
              Status zdarzenia
              <select
                style={s.input}
                value={logForm.status_zdarzenia}
                onChange={(ev) =>
                  setLogForm((f) => ({ ...f, status_zdarzenia: ev.target.value }))
                }
              >
                {LOG_STATUS_ZDARZENIA_W_BAZIE.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>
            <label style={s.label}>
              Opis
              <textarea
                style={{ ...s.input, minHeight: "4rem", resize: "vertical" }}
                value={logForm.opis}
                onChange={(ev) => setLogForm((f) => ({ ...f, opis: ev.target.value }))}
                rows={3}
              />
            </label>
            <label style={s.label}>
              Data zdarzenia (puste = dzisiaj)
              <input
                style={s.input}
                type="date"
                value={logForm.data_zdarzenia}
                onChange={(ev) => setLogForm((f) => ({ ...f, data_zdarzenia: ev.target.value }))}
              />
            </label>
            <label style={s.label}>
              Osoba zgłaszająca — z bazy <code style={s.code}>pracownik</code>
              <select
                style={s.input}
                value={logForm.osoba_zglaszajaca}
                onChange={(ev) =>
                  setLogForm((f) => ({ ...f, osoba_zglaszajaca: ev.target.value }))
                }
              >
                <option value="">— brak —</option>
                {pracownicyPosortowani.map((p) => (
                  <option key={String(p.nr)} value={String(p.nr)}>
                    {String(p.nr)} — {p.imie_nazwisko ?? ""}
                  </option>
                ))}
              </select>
            </label>
            <label style={s.label}>
              Wymagane działanie (opis zadania)
              <textarea
                style={{
                  ...s.input,
                  minHeight: "3rem",
                  resize: "vertical",
                  ...stylPolaUwagiPulpitu(logFormPodswWymDzialIPerson),
                }}
                value={logForm.wymagane_dzialanie}
                onChange={(ev) =>
                  setLogForm((f) => ({ ...f, wymagane_dzialanie: ev.target.value }))
                }
                rows={2}
              />
            </label>
            <label style={s.label}>
              Osoba odpowiedzialna za zadanie — z bazy <code style={s.code}>pracownik</code>
              <select
                style={{ ...s.input, ...stylPolaUwagiPulpitu(logFormPodswWymDzialIPerson) }}
                value={logForm.osoba_odpowiedzialna_za_zadanie}
                onChange={(ev) =>
                  setLogForm((f) => ({
                    ...f,
                    osoba_odpowiedzialna_za_zadanie: ev.target.value,
                  }))
                }
              >
                <option value="">— brak —</option>
                {pracownicyPosortowani.map((p) => (
                  <option key={String(p.nr)} value={String(p.nr)}>
                    {String(p.nr)} — {p.imie_nazwisko ?? ""}
                  </option>
                ))}
              </select>
            </label>
            {pracFetchError ? (
              <p style={{ ...s.muted, margin: 0, fontSize: "0.82rem", color: "#fca5a5" }}>
                Lista ID: {pracFetchError}
              </p>
            ) : null}
            <div style={s.btnRow}>
              <button type="submit" style={s.btn}>
                {logEdycjaId != null ? "Zapisz zmiany" : "Dodaj wpis"}
              </button>
              {logEdycjaId != null ? (
                <button type="button" style={s.btnGhost} onClick={anulujEdycjeLog}>
                  Anuluj edycję
                </button>
              ) : null}
            </div>
          </form>
        </section>
      ) : null}

      {widok === "kr" &&
      widokPulpitDlaKr &&
      !widokKmDlaKr &&
      !widokLogDlaKr &&
      !widokPwDlaKr &&
      !widokInfoDlaKr &&
      (wybranyKrKlucz == null ||
        String(wybranyKrKlucz).trim() === String(widokPulpitDlaKr ?? "").trim()) ? (
        <section style={s.krTopWrap} aria-labelledby="pulpit-naglowek">
          <div style={{ marginBottom: "0.65rem" }}>
            <button type="button" style={s.btnGhost} onClick={powrotZPulpituDoListy}>
              {wybranyKrKlucz != null &&
              String(wybranyKrKlucz).trim() === String(widokPulpitDlaKr ?? "").trim()
                ? "← Karta projektu"
                : "← Lista KR"}
            </button>
            <HelpLinijka wlaczony={trybHelp}>
              {wybranyKrKlucz != null &&
              String(wybranyKrKlucz).trim() === String(widokPulpitDlaKr ?? "").trim()
                ? "Wróć do zakładek projektu zamiast samej osi na czasie."
                : "Wróć do tabeli wszystkich projektów."}
            </HelpLinijka>
          </div>
          <h2 id="pulpit-naglowek" style={{ ...s.krTopTitle, fontSize: "1.05rem" }}>
            Pulpit projektu — KR {widokPulpitDlaKr}
          </h2>
          {trybHelp ? (
            <p style={{ ...s.muted, marginBottom: "0.85rem", fontSize: "0.8rem", lineHeight: 1.5, maxWidth: "48rem" }}>
              Nawigacja jak na stronie startowej:{" "}
              <strong style={{ color: theme.action }}>drzewo po lewej</strong> (KR → ten projekt). Domyślnie{" "}
              <strong style={{ color: theme.text }}>przegląd</strong> — zagrożenia i zadania. Pełna oś czasu, FIN (INV) i
              skróty ETAP / PW / LOG — pozycja <strong style={{ color: theme.action }}>Oś czasu</strong>.
            </p>
          ) : null}
          {!rekordKrPulpit ? (
            <div style={s.errBox} role="alert">
              Brak projektu na aktualnej liście — odśwież stronę lub wróć.
              <div style={{ marginTop: "0.75rem" }}>
                <button type="button" style={s.btnGhost} onClick={powrotZPulpituDoListy}>
                  Wróć do listy
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(240px, 280px) minmax(0, 1fr)",
                gap: "1.35rem",
                alignItems: "start",
              }}
            >
              {renderPulpitDrzewoNav(rekordKrPulpit)}
              <div style={{ minWidth: 0 }}>
                {pulpitPodstrona === "przeglad" ? (
                  renderPulpitPrzegladKr(rekordKrPulpit)
                ) : pulpitPodstrona === "karta" ? (
                  <>
                    {renderPulpitDaneProjektuCard(rekordKrPulpit)}
                    <div style={{ marginTop: "0.85rem" }}>
                      <button type="button" style={s.btn} onClick={() => otworzEdycjeKrZTabeli(rekordKrPulpit)}>
                        Edytuj kartę projektu (KR)
                      </button>
                      <HelpLinijka wlaczony={trybHelp}>
                        Pełna edycja rekordu w bazie — pola umowy, status, prowadzący.
                      </HelpLinijka>
                    </div>
                  </>
                ) : pulpitPodstrona === "os" ? (
                  <>
                    {renderPulpitDaneProjektuCard(rekordKrPulpit)}
                    <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.45rem 0.65rem",
                  marginBottom: "0.65rem",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <button
                    type="button"
                    style={{ ...s.btnGhost, padding: "0.32rem 0.65rem", fontSize: "0.78rem" }}
                    onClick={() => otworzKmDlaKr(rekordKrPulpit)}
                  >
                    ETAP
                  </button>
                  <HelpLinijka wlaczony={trybHelp}>Lista etapów tego projektu — terminy, status, „co w toku”.</HelpLinijka>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <button
                    type="button"
                    style={{ ...s.btnGhost, padding: "0.32rem 0.65rem", fontSize: "0.78rem" }}
                    onClick={() => otworzPwDlaKr(rekordKrPulpit)}
                  >
                    PW
                  </button>
                  <HelpLinijka wlaczony={trybHelp}>Zlecenia dla firm zewnętrznych pod tym projektem.</HelpLinijka>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <button
                    type="button"
                    style={{ ...s.btnGhost, padding: "0.32rem 0.65rem", fontSize: "0.78rem" }}
                    onClick={() => otworzLogDlaKr(rekordKrPulpit)}
                  >
                    LOG
                  </button>
                  <HelpLinijka wlaczony={trybHelp}>Dziennik zdarzeń — pełna lista wpisów i możliwość edycji.</HelpLinijka>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <button
                    type="button"
                    style={{ ...s.btnGhost, padding: "0.32rem 0.65rem", fontSize: "0.78rem" }}
                    onClick={() => przejdzDoSekcjiKr(rekordKrPulpit, "zadania_kr")}
                  >
                    Zadania
                  </button>
                  <HelpLinijka wlaczony={trybHelp}>
                    Lista zadań przypisanych do tego KR — Kanban, terminy i wykonanie.
                  </HelpLinijka>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <button
                    type="button"
                    style={{ ...s.btnGhost, padding: "0.32rem 0.65rem", fontSize: "0.78rem" }}
                    onClick={() => otworzEdycjeKrZTabeli(rekordKrPulpit)}
                  >
                    Edytuj KR
                  </button>
                  <HelpLinijka wlaczony={trybHelp}>Zmiana danych karty: nazwa, status, umowa, prowadzący…</HelpLinijka>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <button
                    type="button"
                    style={{
                      ...s.btnGhost,
                      padding: "0.32rem 0.65rem",
                      fontSize: "0.78rem",
                      borderColor: "rgba(251,191,36,0.45)",
                      color: "#fde68a",
                    }}
                    title="Karta projektu → zakładka Umowa (dziś: pola KR). Wkrótce: osobna tabela na wiele linków."
                    onClick={() => przejdzDoSekcjiKr(rekordKrPulpit, "umowa")}
                  >
                    UMOWA
                  </button>
                  <HelpLinijka wlaczony={trybHelp}>
                    Przechodzisz do zakładki Umowa na karcie projektu (link, okres, zleceniodawca).
                  </HelpLinijka>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <button
                    type="button"
                    style={{ ...s.btnGhost, padding: "0.32rem 0.65rem", fontSize: "0.78rem" }}
                    onClick={() => otworzInfoDlaKr(rekordKrPulpit)}
                  >
                    INFO
                  </button>
                  <HelpLinijka wlaczony={trybHelp}>
                    Podgląd ostrzeżeń i reguł dla tego projektu — krócej niż pełna zakładka z dokumentacją.
                  </HelpLinijka>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <button
                    type="button"
                    style={{
                      ...s.btnGhost,
                      padding: "0.32rem 0.65rem",
                      fontSize: "0.78rem",
                      borderColor: "rgba(196,181,253,0.5)",
                      color: "#ede9fe",
                    }}
                    title="Przewiń do finansów: FS (sprzedaż) i koszty (rama) na tym pulpicie"
                    onClick={() =>
                      document.getElementById("pulpit-finanse")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                    }
                  >
                    INV
                  </button>
                  <HelpLinijka wlaczony={trybHelp}>
                    Przewija w dół do faktur dla klienta i ramy kosztów — bez zmiany widoku.
                  </HelpLinijka>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <button
                    type="button"
                    style={{
                      ...s.btnGhost,
                      padding: "0.32rem 0.65rem",
                      fontSize: "0.78rem",
                      borderColor: "rgba(250,204,21,0.55)",
                      color: "#fef08a",
                      fontWeight: 700,
                    }}
                    title="Formularz zgłoszenia kosztu do przelewu (komu, konto, brutto) — zakładka Faktury kosztowe"
                    onClick={() => przejdzDoSekcjiKr(rekordKrPulpit, "faktury")}
                  >
                    Koszt do przelewu
                  </button>
                  <HelpLinijka wlaczony={trybHelp}>
                    To samo co zakładka „Faktury kosztowe” — zapis do księgowości, nie tylko podgląd na pulpicie.
                  </HelpLinijka>
                </div>
              </div>
              <div id="pulpit-finanse" style={{ scrollMarginTop: "0.85rem" }}>
                <div
                  style={{
                    fontSize: "0.62rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#a78bfa",
                    marginBottom: "0.45rem",
                    fontWeight: 700,
                  }}
                  id="pulpit-finanse-naglowek"
                >
                  Finanse na pulpicie — sprzedaż (FS) i koszty
                </div>
                <div
                  style={{
                    marginBottom: "0.65rem",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "8px",
                    border: "1px solid #3d3550",
                    background: "#18141f",
                  }}
                  aria-labelledby="pulpit-inv-naglowek"
                >
                  <div
                    style={{
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#c4b5fd",
                      marginBottom: "0.35rem",
                    }}
                    id="pulpit-inv-naglowek"
                  >
                    Sprzedaż — FS i odbiór (etap / PW)
                  </div>
                  <p style={{ ...s.muted, margin: "0 0 0.45rem", fontSize: "0.68rem", lineHeight: 1.45 }}>
                    <strong style={{ color: "#e7e5ff" }}>ETAP / FS:</strong> faktury sprzedażowe z{" "}
                    <code style={s.code}>faktury</code> (<code style={s.code}>etap_id</code>).{" "}
                    <strong style={{ color: "#e7e5ff" }}>PW:</strong> kolumna „Odebrane” (nie to samo co protokół FS).
                  </p>
                  {krFakturySprzedazFetchError ? (
                    <p style={{ ...s.muted, margin: "0 0 0.4rem", fontSize: "0.72rem", color: "#fca5a5" }} role="alert">
                      Faktury sprzedażowe: {krFakturySprzedazFetchError}
                    </p>
                  ) : null}
                  {pulpitInvWiersze.etapy.length === 0 && pulpitInvWiersze.pw.length === 0 ? (
                    <p style={{ ...s.muted, margin: 0, fontSize: "0.72rem" }}>
                      Brak etapów i zleceń PW dla tego KR — zestawienie puste.
                    </p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "0.72rem",
                          color: "#e8e8e8",
                        }}
                      >
                        <thead>
                          <tr style={{ borderBottom: "1px solid #3d3550" }}>
                            <th style={{ textAlign: "left", padding: "0.35rem 0.5rem 0.35rem 0", color: "#a3a3a3" }}>
                              Źródło
                            </th>
                            <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: "#a3a3a3" }}>
                              Pozycja
                            </th>
                            <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: "#a3a3a3" }}>
                              Zafakturowane
                            </th>
                            <th style={{ textAlign: "left", padding: "0.35rem 0.5rem", color: "#a3a3a3" }}>
                              Protokół (odbiór)
                            </th>
                            <th style={{ textAlign: "left", padding: "0.35rem 0", color: "#a3a3a3" }}>
                              Data (FS)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pulpitInvWiersze.etapy.map((w) => (
                            <tr key={w.key} style={{ borderBottom: "1px solid #2a2435" }}>
                              <td style={{ padding: "0.35rem 0.5rem 0.35rem 0", whiteSpace: "nowrap", color: "#c4b5fd" }}>
                                {w.zrodlo}
                              </td>
                              <td style={{ padding: "0.35rem 0.5rem", wordBreak: "break-word" }}>{w.opis}</td>
                              <td style={{ padding: "0.35rem 0.5rem" }}>
                                {pulpitInvFormatTakNieNieznane(w.zafakturowane)}
                              </td>
                              <td style={{ padding: "0.35rem 0.5rem" }}>
                                {pulpitInvFormatTakNieNieznane(w.protokol)}
                              </td>
                              <td style={{ padding: "0.35rem 0", whiteSpace: "nowrap" }}>
                                {w.dataFs ? dataPLZFormat(w.dataFs) : "—"}
                              </td>
                            </tr>
                          ))}
                          {pulpitInvWiersze.pw.map((w) => (
                            <tr key={w.key} style={{ borderBottom: "1px solid #2a2435" }}>
                              <td style={{ padding: "0.35rem 0.5rem 0.35rem 0", whiteSpace: "nowrap", color: "#fbbf24" }}>
                                {w.zrodlo}
                              </td>
                              <td style={{ padding: "0.35rem 0.5rem", wordBreak: "break-word" }}>{w.opis}</td>
                              <td style={{ padding: "0.35rem 0.5rem" }}>{pulpitInvFormatTakNieNieznane(w.zafakturowane)}</td>
                              <td style={{ padding: "0.35rem 0.5rem" }}>
                                {pulpitInvFormatTakNieNieznane(w.protokol)}
                              </td>
                              <td style={{ padding: "0.35rem 0" }}>—</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    marginBottom: "0.65rem",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(52,211,153,0.28)",
                    background: "rgba(6,78,59,0.12)",
                  }}
                  aria-labelledby="pulpit-koszty-naglowek"
                >
                  <div
                    style={{
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#6ee7b7",
                      marginBottom: "0.35rem",
                    }}
                    id="pulpit-koszty-naglowek"
                  >
                    Koszty (rama — ten sam pulpit)
                  </div>
                  <p style={{ ...s.muted, margin: "0 0 0.5rem", fontSize: "0.68rem", lineHeight: 1.45 }}>
                    Klauzule, paliwo, faktury PW, RBGH / wycena później —{" "}
                    <strong style={{ color: "#a7f3d0" }}>bez sprzedaży FS</strong> (ta jest w tabeli powyżej). BRUDNOPIS:
                    podłączenie pod osobną tabelę w bazie.
                  </p>
                  <p style={{ ...s.muted, margin: "0 0 0.55rem", fontSize: "0.68rem", lineHeight: 1.45, color: "#fde68a" }}>
                    <strong>Zgłoszenie kosztu do przelewu</strong> (komu, konto, kwota brutto) — osobna funkcja: przycisk
                    poniżej, nie w ramce „placeholder”.
                  </p>
                  <div style={{ display: "grid", gap: "0.45rem", fontSize: "0.72rem", color: "#94a3b8" }}>
                    <div
                      style={{
                        padding: "0.45rem 0.55rem",
                        borderRadius: "8px",
                        border: "1px dashed rgba(52,211,153,0.22)",
                        background: "rgba(15,23,42,0.35)",
                      }}
                    >
                      <strong style={{ color: "#d1fae5" }}>Szablony kosztów</strong> — typ, umowa, limity (placeholder).
                    </div>
                    <div
                      style={{
                        padding: "0.45rem 0.55rem",
                        borderRadius: "8px",
                        border: "1px dashed rgba(52,211,153,0.22)",
                        background: "rgba(15,23,42,0.35)",
                      }}
                    >
                      <strong style={{ color: "#d1fae5" }}>Faktury od podwykonawców</strong> — powiązanie z PW (placeholder).
                    </div>
                    <div
                      style={{
                        padding: "0.45rem 0.55rem",
                        borderRadius: "8px",
                        border: "1px dashed rgba(52,211,153,0.22)",
                        background: "rgba(15,23,42,0.35)",
                      }}
                    >
                      <strong style={{ color: "#d1fae5" }}>Roboczogodziny</strong> — suma h, stawka / wycena (placeholder).
                    </div>
                  </div>
                  <div style={{ marginTop: "0.55rem" }}>
                    <button
                      type="button"
                      style={{
                        ...s.btnGhost,
                        padding: "0.32rem 0.65rem",
                        fontSize: "0.74rem",
                        borderColor: "rgba(253,224,71,0.45)",
                        color: "#fef9c3",
                        fontWeight: 600,
                      }}
                      title="Otwiera formularz zgłoszenia do księgowości dla tego projektu"
                      onClick={() => przejdzDoSekcjiKr(rekordKrPulpit, "faktury")}
                    >
                      Nowe zgłoszenie — faktury kosztowe do opłacenia
                    </button>
                    <HelpLinijka wlaczony={trybHelp}>
                      To samo co zakładka „Faktury kosztowe” w górnej nawigacji karty projektu. Działa także po wejściu
                      na pulpit skrótem z listy KR (bez osobnego „otwarcia karty”).
                    </HelpLinijka>
                  </div>
                </div>
              </div>
              {(() => {
                const n = pulpitOśKarty.filter((c) => c.wymagaUwagi).length;
                if (n === 0) return null;
                return (
                  <div
                    role="status"
                    style={{
                      marginBottom: "0.55rem",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(248,113,113,0.45)",
                      background: "rgba(248,113,113,0.1)",
                      fontSize: "0.74rem",
                      lineHeight: 1.45,
                      color: "#fecaca",
                    }}
                  >
                    <strong style={{ color: "#f87171" }}>Wymaga uwagi</strong> — {n}{" "}
                    {n === 1 ? "pozycja" : "pozycje"} na osi. Reguły: zagrożenie lub przeterminowany plan etapu (etap nie
                    zamknięty), LOG w statusie „w trakcie” lub „oczekuje”, PW po terminie bez odbioru, status KR
                    „oczekuje na zamawiającego”.
                  </div>
                );
              })()}
              <div
                style={{
                  marginBottom: "0.65rem",
                  padding: "0.5rem 0.7rem",
                  borderRadius: "8px",
                  border: "1px solid #333",
                  background: "#141414",
                }}
              >
                <div
                  style={{
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#737373",
                    marginBottom: "0.35rem",
                  }}
                >
                  Telefony i e-maile ze zleceń PW
                </div>
                {pulpitSkrotKontaktow.telefony.length === 0 &&
                pulpitSkrotKontaktow.emaile.length === 0 ? (
                  <p style={{ ...s.muted, margin: 0, fontSize: "0.72rem" }}>
                    Brak danych kontaktowych w zleceniach — uzupełnij je na ekranie PW.
                  </p>
                ) : (
                  <div style={{ fontSize: "0.76rem", color: "#e5e5e5", lineHeight: 1.4 }}>
                    {pulpitSkrotKontaktow.telefony.length ? (
                      <div>
                        <span style={s.muted}>Tel.: </span>
                        {pulpitSkrotKontaktow.telefony.join(" · ")}
                      </div>
                    ) : null}
                    {pulpitSkrotKontaktow.emaile.length ? (
                      <div>
                        <span style={s.muted}>E-mail: </span>
                        {pulpitSkrotKontaktow.emaile.join(" · ")}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              {krZleceniaPwFetchError || dziennikFetchError ? (
                <div style={{ ...s.errBox, marginBottom: "0.65rem" }} role="alert">
                  {krZleceniaPwFetchError ? (
                    <>
                      Zlecenia PW: {krZleceniaPwFetchError}
                      <br />
                    </>
                  ) : null}
                  {dziennikFetchError ? <>Dziennik: {dziennikFetchError}</> : null}
                </div>
              ) : null}
              {pulpitOśKarty.length === 0 ? (
                <p style={{ ...s.muted, fontSize: "0.76rem", marginBottom: "0.35rem" }}>
                  Brak pozycji na osi — dodaj wpisy ETAP, PW lub LOG dla tego projektu.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    marginBottom: "0.45rem",
                    flexWrap: "wrap",
                  }}
                >
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.7rem",
                      color: "#a3a3a3",
                      margin: 0,
                    }}
                  >
                    <span style={{ whiteSpace: "nowrap" }}>Sortuj według daty, potem typu</span>
                    <select
                      value={pulpitSortDaty}
                      onChange={(e) => setPulpitSortDaty(e.target.value === "desc" ? "desc" : "asc")}
                      style={{
                        fontSize: "0.7rem",
                        padding: "0.15rem 0.35rem",
                        borderRadius: "6px",
                        border: "1px solid #404040",
                        background: "#1a1a1a",
                        color: "#e8e8e8",
                        maxWidth: "100%",
                      }}
                    >
                      <option value="asc">Data rosnąco</option>
                      <option value="desc">Data malejąco</option>
                    </select>
                  </label>
                </div>
              )}
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                {pulpitWierszeZTeraz.map((w, wi) => {
                  if (w.typ === "teraz") {
                    const dziś = dzisiajDataYYYYMMDD();
                    return (
                      <li
                        key={`pulpit-${w.klucz}-${wi}`}
                        aria-label={`Dziś — ${dataPLZFormat(dziś)} — czas teraźniejszy na osi`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          minWidth: 0,
                          padding: "0.4rem 0",
                          margin: "0.1rem 0",
                          listStyle: "none",
                          borderTop: "2px solid #4ade80",
                          borderBottom: "2px solid #4ade80",
                          background: "rgba(74, 222, 128, 0.1)",
                          borderRadius: "4px",
                        }}
                      >
                        <span
                          style={{
                            flex: "0 0 4.85em",
                            color: "#4ade80",
                            fontVariantNumeric: "tabular-nums",
                            whiteSpace: "nowrap",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            lineHeight: 1.35,
                          }}
                        >
                          {dataPLZFormat(dziś)}
                        </span>
                        <span
                          role="img"
                          aria-hidden
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "1.35rem",
                            height: "1.35rem",
                            flexShrink: 0,
                            color: "#4ade80",
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" style={{ display: "block" }}>
                            <circle cx="12" cy="12" r="4" fill="currentColor" />
                            <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </span>
                        <div
                          style={{
                            flex: "1 1 auto",
                            minWidth: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.45rem",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            color: "#86efac",
                          }}
                        >
                          <span
                            style={{
                              flex: "1 1 auto",
                              height: "2px",
                              background: "linear-gradient(90deg, transparent, #4ade80 12%, #4ade80 88%, transparent)",
                              minWidth: "1rem",
                            }}
                          />
                          <span style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}>Teraz</span>
                          <span
                            style={{
                              flex: "1 1 auto",
                              height: "2px",
                              background: "linear-gradient(90deg, transparent, #4ade80 12%, #4ade80 88%, transparent)",
                              minWidth: "1rem",
                            }}
                          />
                        </div>
                      </li>
                    );
                  }
                  const karta = w.karta;
                  const idx = w.idx;
                  const bodyLines = Array.isArray(karta.bodyLines) ? karta.bodyLines : [];
                  const bodyJednaLinia = bodyLines.join(" · ");
                  const st = tekstTrim(karta.subtitle);
                  const opisCzesci = [karta.title];
                  if (st) opisCzesci.push(`(${st})`);
                  if (bodyJednaLinia) opisCzesci.push(bodyJednaLinia);
                  const opisPelny = opisCzesci.join(" · ");
                  const uwaga = karta.wymagaUwagi === true;
                  return (
                    <li
                      key={`pulpit-${karta.kind}-${karta.tieBreak}-${idx}`}
                      aria-label={uwaga ? `${opisPelny} — wymaga uwagi` : opisPelny}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.4rem",
                        minWidth: 0,
                        padding: "0.35rem 0",
                        paddingLeft: uwaga ? "0.4rem" : 0,
                        marginLeft: uwaga ? "-0.15rem" : 0,
                        borderLeft: uwaga ? "3px solid #f87171" : undefined,
                        background: uwaga ? "rgba(248,113,113,0.07)" : undefined,
                        borderBottom: "1px solid #1f1f1f",
                        listStyle: "none",
                        borderRadius: uwaga ? "4px" : 0,
                      }}
                    >
                      <span
                        style={{
                          flex: "0 0 4.85em",
                          color: uwaga ? "#fca5a5" : "#9ca3af",
                          fontVariantNumeric: "tabular-nums",
                          whiteSpace: "nowrap",
                          fontSize: "0.7rem",
                          lineHeight: 1.35,
                          paddingTop: "0.12rem",
                        }}
                        title={karta.sortKey ? karta.sortKey : undefined}
                      >
                        {karta.sortKey ? dataPLZFormat(karta.sortKey) : "—"}
                      </span>
                      {pulpitIkonTypu(karta.kind)}
                      <div
                        title={opisPelny}
                        style={{
                          flex: "1 1 auto",
                          minWidth: 0,
                          fontSize: "0.72rem",
                          lineHeight: 1.35,
                          color: uwaga ? "#fecaca" : "#d4d4d4",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          paddingTop: "0.08rem",
                          fontWeight: uwaga ? 600 : 400,
                        }}
                      >
                        {uwaga ? (
                          <span style={{ color: "#f87171", fontWeight: 700, marginRight: "0.2rem" }}>!</span>
                        ) : null}
                        {opisPelny}
                      </div>
                      <button
                        type="button"
                        title="Otwórz edycję tej pozycji"
                        style={{
                          ...s.btnGhost,
                          flex: "0 0 auto",
                          alignSelf: "flex-start",
                          padding: "0.18rem 0.42rem",
                          fontSize: "0.62rem",
                          lineHeight: 1.2,
                        }}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          pulpitEdytujKarte(karta);
                        }}
                      >
                        Edytuj
                      </button>
                    </li>
                  );
                })}
              </ul>
                  </>
                ) : (
                  <div style={{ marginTop: "0.15rem" }}>{renderKrKartaSekcja(rekordKrPulpit)}</div>
                )}
              </div>
            </div>
          )}
        </section>
      ) : null}

      {widok === "kr" &&
      widokInfoDlaKr &&
      !widokKmDlaKr &&
      !widokLogDlaKr &&
      !widokPwDlaKr &&
      !wybranyKrKlucz ? (
        <section style={s.krTopWrap} aria-labelledby="info-naglowek">
          <div style={{ marginBottom: "1rem" }}>
            <button type="button" style={s.btnGhost} onClick={powrotZInfoDoListy}>
              {widokPulpitDlaKr != null && String(widokPulpitDlaKr) === String(widokInfoDlaKr)
                ? "← Pulpit"
                : "← Lista KR"}
            </button>
          </div>
          <h2 id="info-naglowek" style={{ ...s.krTopTitle, fontSize: "0.98rem" }}>
            INFO — KR {widokInfoDlaKr}
          </h2>
          {trybHelp ? (
            <p style={{ ...s.muted, marginBottom: "1rem", fontSize: "0.82rem" }}>
              To ekran podglądu. Edycję wykonasz z poziomu przycisków ETAP, PW, LOG lub Edytuj KR na pulpicie projektu.
            </p>
          ) : null}
          {!rekordKrInfo ? (
            <div style={s.errBox} role="alert">
              Brak projektu <strong style={{ color: "#fff" }}>{widokInfoDlaKr}</strong> na aktualnej
              liście — odśwież stronę lub wróć do listy.
              <div style={{ marginTop: "0.75rem" }}>
                <button type="button" style={s.btnGhost} onClick={powrotZInfoDoListy}>
                  {widokPulpitDlaKr != null && String(widokPulpitDlaKr) === String(widokInfoDlaKr)
                    ? "Wróć do pulpitu"
                    : "Wróć do listy"}
                </button>
              </div>
            </div>
          ) : (
            (() => {
              const item = rekordKrInfo;
              return (
                <>
                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "#fff",
                      margin: "0 0 0.5rem",
                    }}
                  >
                    Dane projektu
                  </h3>
                  <div style={s.tableWrap}>
                    <table style={s.table}>
                      <tbody>
                        <tr>
                          <th style={{ ...s.th, width: "40%", textAlign: "left" }}>KR</th>
                          <td style={s.td}>
                            <strong style={{ color: "#fff" }}>{item.kr}</strong>
                          </td>
                        </tr>
                        <tr>
                          <th style={{ ...s.th, textAlign: "left" }}>Nazwa obiektu</th>
                          <td style={s.td}>{item.nazwa_obiektu?.trim() ? item.nazwa_obiektu : "—"}</td>
                        </tr>
                        <tr>
                          <th style={{ ...s.th, textAlign: "left" }}>Rodzaj pracy</th>
                          <td style={s.td}>{item.rodzaj_pracy?.trim() ? item.rodzaj_pracy : "—"}</td>
                        </tr>
                        <tr>
                          <th style={{ ...s.th, textAlign: "left", color: "#7dd3fc" }}>Dział</th>
                          <td style={{ ...s.td, ...s.dzialWartosc }}>
                            {item.dzial?.trim() ? item.dzial : "—"}
                          </td>
                        </tr>
                        <tr>
                          <th style={{ ...s.th, textAlign: "left", color: "#a7f3d0" }}>Status</th>
                          <td style={{ ...s.td, ...s.statusKr }}>
                            {item.status?.trim() ? item.status : "—"}
                          </td>
                        </tr>
                        <tr>
                          <th style={{ ...s.th, textAlign: "left" }}>Osoba prowadząca</th>
                          <td style={s.td}>
                            {podpisOsobyProwadzacej(item.osoba_prowadzaca, mapaProwadzacychId) ?? "—"}
                          </td>
                        </tr>
                        <tr>
                          <th style={{ ...s.th, textAlign: "left" }}>Data rozpoczęcia projektu</th>
                          <td style={s.td}>{etykietaDatyStartu(item.data_rozpoczecia)}</td>
                        </tr>
                        <tr>
                          <th style={{ ...s.th, textAlign: "left" }}>Okres trwania (od — do)</th>
                          <td style={s.td}>
                            {item.okres_projektu_od || item.okres_projektu_do ? (
                              <>
                                {item.okres_projektu_od
                                  ? dataDoInputa(item.okres_projektu_od)
                                  : "—"}{" "}
                                —{" "}
                                {item.okres_projektu_do
                                  ? dataDoInputa(item.okres_projektu_do)
                                  : "—"}
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {(item.zleceniodawca?.trim() ||
                    item.osoba_odpowiedzialna_zleceniodawcy?.trim() ||
                    item.link_umowy?.trim()) ? (
                    <div
                      style={{
                        marginTop: "1rem",
                        marginBottom: "1rem",
                        padding: "0.85rem 1rem",
                        borderRadius: "10px",
                        border: "1px solid #2e2e2e",
                        background: "#121212",
                        fontSize: "0.88rem",
                        color: "#d4d4d4",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.72rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#737373",
                          marginBottom: "0.5rem",
                        }}
                      >
                        Zleceniodawca i umowa
                      </div>
                      {item.zleceniodawca?.trim() ? (
                        <div style={{ marginBottom: "0.35rem" }}>
                          <span style={s.muted}>Zleceniodawca: </span>
                          <strong style={{ color: "#f5f5f5" }}>{item.zleceniodawca.trim()}</strong>
                        </div>
                      ) : null}
                      {item.osoba_odpowiedzialna_zleceniodawcy?.trim() ? (
                        <div style={{ marginBottom: "0.35rem" }}>
                          <span style={s.muted}>Osoba po stronie zleceniodawcy: </span>
                          {item.osoba_odpowiedzialna_zleceniodawcy.trim()}
                        </div>
                      ) : null}
                      {item.link_umowy?.trim() ? (
                        <div>
                          <span style={s.muted}>Umowa: </span>
                          <a
                            href={hrefLinkuZewnetrznego(item.link_umowy)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#7dd3fc", wordBreak: "break-all" }}
                          >
                            {item.link_umowy.trim()}
                          </a>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "#fff",
                      margin: "1.25rem 0 0.5rem",
                    }}
                  >
                    Zlecenia PW (podwykonawcy)
                  </h3>
                  {krZleceniaPwFetchError ? (
                    <p style={{ ...s.muted, color: "#fca5a5" }}>{krZleceniaPwFetchError}</p>
                  ) : krZleceniaPwList.length === 0 ? (
                    <p style={s.muted}>Brak zleceń PW dla tego KR.</p>
                  ) : (
                    <div style={{ ...s.tableWrap, marginBottom: "1rem" }}>
                      <table style={{ ...s.table, fontSize: "0.82rem" }}>
                        <thead>
                          <tr>
                            <th style={s.th}>Podwykonawca</th>
                            <th style={s.th}>Nr zlecenia</th>
                            <th style={s.th}>Zakres</th>
                            <th style={s.th}>Data zlecenia</th>
                            <th style={s.th}>Termin zlecenia</th>
                            <th style={s.th}>Data oddania</th>
                            <th style={s.th}>Netto</th>
                            <th style={s.th}>Status</th>
                            <th style={s.th}>Spr.</th>
                            <th style={s.th}>Odb.</th>
                            <th style={s.th}>Weryfikacja (nasz)</th>
                            <th style={s.th}>Faktury (PW)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {krZleceniaPwList.map((z) => {
                            const zakres = kmTekstDoKomorki(z.opis_zakresu);
                            const fakt =
                              [z.osoba_faktury_nazwa, z.osoba_faktury_email, z.osoba_faktury_telefon]
                                .filter((x) => x != null && String(x).trim() !== "")
                                .join(" · ") || "—";
                            const firma =
                              z.podwykonawca &&
                              typeof z.podwykonawca === "object" &&
                              !Array.isArray(z.podwykonawca)
                                ? z.podwykonawca.nazwa_firmy
                                : null;
                            return (
                              <tr key={z.id}>
                                <td style={s.td}>
                                  <strong style={{ color: "#f5f5f5" }}>
                                    {firma?.trim() ? firma : "—"}
                                  </strong>
                                </td>
                                <td style={s.td}>{z.numer_zlecenia?.trim() ? z.numer_zlecenia : "—"}</td>
                                <td style={s.td} title={zakres.title || undefined}>
                                  {zakres.text}
                                </td>
                                <td style={s.td}>
                                  {z.data_zlecenia ? dataDoInputa(z.data_zlecenia) : "—"}
                                </td>
                                <td
                                  style={{
                                    ...s.td,
                                    ...stylKomorkiTabeliUwagi(pulpitPwWymagaUwagi(z, dziśUwagiPulpitu)),
                                  }}
                                >
                                  {z.termin_zlecenia ? dataDoInputa(z.termin_zlecenia) : "—"}
                                </td>
                                <td style={s.td}>
                                  {z.data_oddania ? dataDoInputa(z.data_oddania) : "—"}
                                </td>
                                <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                                  {krZleceniePwKwotaEtykieta(z.cena_netto)}
                                </td>
                                <td style={s.td}>{z.status?.trim() ? z.status : "—"}</td>
                                <td style={s.td}>{z.czy_sprawdzone === true ? "tak" : "nie"}</td>
                                <td
                                  style={{
                                    ...s.td,
                                    ...stylKomorkiTabeliUwagi(pulpitPwWymagaUwagi(z, dziśUwagiPulpitu)),
                                  }}
                                >
                                  {z.czy_odebrane === true ? "tak" : "nie"}
                                </td>
                                <td style={s.td}>
                                  {podpisOsobyProwadzacej(z.pracownik_weryfikacja, mapaProwadzacychId) ??
                                    "—"}
                                </td>
                                <td style={{ ...s.td, maxWidth: "11rem" }} title={fakt !== "—" ? fakt : undefined}>
                                  {fakt === "—" ? "—" : fakt.length > 36 ? `${fakt.slice(0, 34)}…` : fakt}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "#fff",
                      margin: "1.25rem 0 0.5rem",
                    }}
                  >
                    Etapy
                  </h3>
                  {listaKmDlaInfo.length === 0 ? (
                    <p style={s.muted}>Brak zapisanych etapów dla tego KR.</p>
                  ) : (
                    <div style={s.tableWrap}>
                      <table style={s.kmTable}>
                        <colgroup>
                          <col style={{ width: "9%" }} />
                          <col style={{ width: "8%" }} />
                          <col style={{ width: "7%" }} />
                          <col style={{ width: "5%" }} />
                          <col style={{ width: "8%" }} />
                          <col style={{ width: "11%" }} />
                          <col style={{ width: "6%" }} />
                          <col style={{ width: "6%" }} />
                          <col style={{ width: "18%" }} />
                          <col style={{ width: "18%" }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th style={s.kmTh}>Etap</th>
                            <th style={s.kmTh}>Status</th>
                            <th style={s.kmTh}>
                              <span>Odniesienie</span>
                              <span
                                style={{
                                  display: "block",
                                  fontWeight: 400,
                                  fontSize: "0.6rem",
                                  color: "#737373",
                                  marginTop: "0.2rem",
                                  lineHeight: 1.2,
                                }}
                              >
                                linia / zlecenie
                              </span>
                            </th>
                            <th style={s.kmTh}>+ mc</th>
                            <th style={s.kmTh}>Plan</th>
                            <th style={s.kmTh}>Odpow.</th>
                            <th style={s.kmTh}>Osiąg.</th>
                            <th style={s.kmTh}>Zagr.</th>
                            <th style={s.kmTh}>Uwagi</th>
                            <th style={s.kmTh}>Opis zagrożenia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listaKmDlaInfo.map((row) => {
                            const uw = kmTekstDoKomorki(row.uwagi);
                            const oz = kmTekstDoKomorki(row.zagrozenie_opis);
                            return (
                              <tr key={row.id}>
                                <td style={s.kmTd}>
                                  <strong style={{ color: "#f5f5f5", fontWeight: 600 }}>
                                    {row.etap ?? "—"}
                                  </strong>
                                </td>
                                <td
                                  style={{
                                    ...s.kmTd,
                                    ...s.statusKr,
                                    fontSize: "0.68rem",
                                    ...stylKomorkiTabeliUwagi(
                                      pulpitKmPlanPrzeterminowany(row, dziśUwagiPulpitu),
                                    ),
                                  }}
                                >
                                  {row.status ?? "—"}
                                </td>
                                <td style={s.kmTd}>{kmKomorkaOdniesienia(row)}</td>
                                <td style={s.kmTd}>
                                  {row.offset_miesiecy != null && row.offset_miesiecy !== ""
                                    ? String(row.offset_miesiecy)
                                    : "—"}
                                </td>
                                <td
                                  style={{
                                    ...s.kmTd,
                                    ...stylKomorkiTabeliUwagi(
                                      pulpitKmPlanPrzeterminowany(row, dziśUwagiPulpitu),
                                    ),
                                  }}
                                >
                                  {row.data_planowana ? dataDoInputa(row.data_planowana) : "—"}
                                </td>
                                <td style={s.kmTd}>
                                  {podpisOsobyProwadzacej(row.osoba_odpowiedzialna, mapaProwadzacychId) ??
                                    "—"}
                                </td>
                                <td style={s.kmTd}>
                                  {row.osiagniete === true
                                    ? "tak"
                                    : row.osiagniete === false
                                      ? "nie"
                                      : "—"}
                                </td>
                                <td
                                  style={{
                                    ...s.kmTd,
                                    ...stylKomorkiTabeliUwagi(
                                      row.zagrozenie === true || row.zagrozenie === "tak",
                                    ),
                                  }}
                                >
                                  {row.zagrozenie === true
                                    ? "tak"
                                    : row.zagrozenie === false
                                      ? "nie"
                                      : "—"}
                                </td>
                                <td style={s.kmTd} title={uw.title || undefined}>
                                  {uw.text}
                                </td>
                                <td
                                  style={{
                                    ...s.kmTd,
                                    ...stylKomorkiTabeliUwagi(!!tekstTrim(row.zagrozenie_opis)),
                                  }}
                                  title={oz.title || undefined}
                                >
                                  {oz.text}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <h3
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "#fff",
                      margin: "1.25rem 0 0.5rem",
                    }}
                  >
                    Dziennik zdarzeń (LOG)
                  </h3>
                  {dziennikFetchError ? (
                    <div style={s.errBox} role="alert">
                      <strong>Nie udało się wczytać dziennika.</strong> {dziennikFetchError}
                    </div>
                  ) : null}
                  {!dziennikFetchError && dziennikWpisy.length === 0 ? (
                    <p style={s.muted}>Brak wpisów w dzienniku dla tego KR.</p>
                  ) : null}
                  {!dziennikFetchError && dziennikWpisy.length > 0 ? (
                    <div style={s.tableWrap}>
                      <table style={s.table}>
                        <thead>
                          <tr>
                            <th style={s.th}>Data</th>
                            <th style={s.th}>Typ</th>
                            <th style={{ ...s.th, color: "#a7f3d0" }}>Status</th>
                            <th style={s.th}>Opis</th>
                            <th style={s.th}>Zgłaszający</th>
                            <th style={s.th}>Wymagane działanie</th>
                            <th style={s.th}>Odpowiedzialny</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dziennikWpisy.map((row) => (
                            <tr key={row.id}>
                              <td style={s.td}>
                                {row.data_zdarzenia != null && String(row.data_zdarzenia).trim() !== ""
                                  ? dataDoInputa(row.data_zdarzenia)
                                  : "—"}
                              </td>
                              <td style={s.td}>
                                <strong style={{ color: "#f5f5f5" }}>{row.typ_zdarzenia ?? "—"}</strong>
                              </td>
                              <td style={{ ...s.td, ...s.statusKr, fontSize: "0.82rem" }}>
                                {row.status_zdarzenia?.trim() ? row.status_zdarzenia : "—"}
                              </td>
                              <td style={s.td}>{row.opis?.trim() ? row.opis : "—"}</td>
                              <td style={s.td}>
                                {podpisOsobyProwadzacej(row.osoba_zglaszajaca, mapaProwadzacychId) ??
                                  "—"}
                              </td>
                              <td
                                style={{
                                  ...s.td,
                                  ...stylKomorkiTabeliUwagi(logWidokPodswietlGdyJestWymaganeDzialanie(row)),
                                }}
                              >
                                {row.wymagane_dzialanie?.trim() ? row.wymagane_dzialanie : "—"}
                              </td>
                              <td
                                style={{
                                  ...s.td,
                                  ...stylKomorkiTabeliUwagi(logWidokPodswietlGdyJestWymaganeDzialanie(row)),
                                }}
                              >
                                {podpisOsobyProwadzacej(
                                  row.osoba_odpowiedzialna_za_zadanie,
                                  mapaProwadzacychId
                                ) ?? "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </>
              );
            })()
          )}
        </section>
      ) : null}

      {widok === "kr" &&
      wybranyKrKlucz &&
      !widokKmDlaKr &&
      !widokLogDlaKr &&
      !widokPwDlaKr &&
      !widokPulpitDlaKr ? (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <button type="button" style={s.btnGhost} onClick={powrotDoListyKr}>
              ← Lista KR / panel
            </button>
          </div>
          {!wybranyRekordKr ? (
            <div style={s.errBox} role="alert">
              Nie znaleziono projektu o kodzie{" "}
              <strong style={{ color: "#fff" }}>{wybranyKrKlucz}</strong> w aktualnej liście.
              <div style={{ marginTop: "0.75rem" }}>
                <button type="button" style={s.btnGhost} onClick={powrotDoListyKr}>
                  Wróć do listy
                </button>
              </div>
            </div>
          ) : (
            (() => {
              const item = wybranyRekordKr;
              const listaEtapow = etapyWedlugKr.get(item.kr) ?? [];
              const isEditing = editingKrKey === item.kr;
              const etapyZagrozony = listaEtapow.some((e) => pulpitKmWymagaUwagi(e, dziśDash));
              const stKr = String(item.status ?? "").toLowerCase();
              return (
                <section
                  id={`kr-card-${item.kr}`}
                  style={{
                    borderRadius: "20px",
                    marginBottom: "1.25rem",
                    overflow: "hidden",
                    background: "linear-gradient(145deg, rgba(30,41,59,0.52), rgba(15,23,42,0.85))",
                    border: "1px solid rgba(148,163,184,0.12)",
                    boxShadow: "0 24px 48px -20px rgba(0,0,0,0.55)",
                  }}
                  aria-label={`KR ${item.kr}`}
                >
                  <header
                    style={{
                      ...s.krHead,
                      background: "rgba(15,23,42,0.92)",
                      flexDirection: "column",
                      alignItems: "stretch",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        gap: "0.65rem",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>
                          <strong>{item.kr}</strong>
                          {!isEditing && item.nazwa_obiektu ? (
                            <span style={{ fontWeight: 600 }}> — {item.nazwa_obiektu}</span>
                          ) : null}
                        </div>
                        {!isEditing ? (
                          <div
                            style={{
                              marginTop: "0.45rem",
                              fontSize: "0.82rem",
                              color: "#94a3b8",
                              lineHeight: 1.45,
                              whiteSpace: "nowrap",
                              overflowX: "auto",
                              overflowY: "hidden",
                            }}
                          >
                            {item.dzial ? (
                              <span style={s.dzialWartosc}>Dział: {item.dzial}</span>
                            ) : null}
                            {item.dzial && item.status ? <span> · </span> : null}
                            {item.status ? (
                              <span
                                style={{
                                  ...stylEtykietyUwagiPulpitu(pulpitKrRekordWymagaUwagi(item)),
                                  color: pulpitKrRekordWymagaUwagi(item) ? "#fecaca" : "#a7f3d0",
                                }}
                              >
                                {item.status}
                              </span>
                            ) : null}
                            {podpisOsobyProwadzacej(item.osoba_prowadzaca, mapaProwadzacychId) ? (
                              <span>
                                {" "}
                                · Prowadzący:{" "}
                                <strong style={{ color: "#e2e8f0" }}>
                                  {podpisOsobyProwadzacej(item.osoba_prowadzaca, mapaProwadzacychId)}
                                </strong>
                              </span>
                            ) : null}
                            <span> · Start: {etykietaDatyStartu(item.data_rozpoczecia)}</span>
                            {item.zleceniodawca?.trim() ? (
                              <span>
                                {" "}
                                · ZL: <strong style={{ color: "#cbd5e1" }}>{item.zleceniodawca.trim()}</strong>
                              </span>
                            ) : null}
                            {item.link_umowy?.trim() ? (
                              <span>
                                {" "}
                                ·{" "}
                                <a
                                  href={hrefLinkuZewnetrznego(item.link_umowy)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "#7dd3fc" }}
                                >
                                  Umowa
                                </a>
                              </span>
                            ) : null}
                            {item.okres_projektu_od || item.okres_projektu_do ? (
                              <span>
                                {" "}
                                · Okres:{" "}
                                {item.okres_projektu_od ? dataDoInputa(item.okres_projektu_od) : "—"} →{" "}
                                {item.okres_projektu_do ? dataDoInputa(item.okres_projektu_do) : "—"}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      {!isEditing ? (
                        <button type="button" style={s.btnGhost} onClick={() => openEditKr(item)}>
                          Edytuj KR
                        </button>
                      ) : null}
                    </div>
                    {!isEditing ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                        {stKr.includes("w toku") || stKr.includes("realiz") ? (
                          <span style={op.badge("rgba(56,189,248,0.22)", "#bae6fd")}>W toku</span>
                        ) : null}
                        {pulpitKrRekordWymagaUwagi(item) ? (
                          <span style={op.badge("rgba(234,179,8,0.22)", "#fde68a")}>Oczekuje</span>
                        ) : null}
                        {etapyZagrozony ? (
                          <span style={op.badge("rgba(248,113,113,0.2)", "#fecaca")}>Zagrożone</span>
                        ) : null}
                        {stKr.includes("zakończ") ||
                        stKr.includes("zakoncz") ||
                        stKr.includes("rozlicz") ? (
                          <span style={op.badge("rgba(52,211,153,0.22)", "#a7f3d0")}>Zakończone</span>
                        ) : null}
                      </div>
                    ) : null}
                  </header>
                  <div style={{ ...s.krBody, background: "rgba(8,12,18,0.45)" }}>
                    {!isEditing ? (
                      <>
                        {renderKrProjektPills(item)}
                        {renderKrKartaSekcja(item)}
                      </>
                    ) : null}
                    {isEditing ? (
                      <div style={s.editPanel}>
                        <p style={{ ...s.muted, margin: 0, fontSize: "0.85rem" }}>
                          Edycja rekordu tabeli <code style={s.code}>kr</code> — pierwotnie{" "}
                          <strong style={{ color: "#fff" }}>{item.kr}</strong>
                        </p>
                        <label style={s.label}>
                          KR (kod projektu)
                          <input
                            style={s.input}
                            type="text"
                            value={editForm.kr}
                            onChange={(ev) =>
                              setEditForm((f) => ({ ...f, kr: ev.target.value }))
                            }
                            required
                          />
                        </label>
                        <label style={s.label}>
                          Nazwa obiektu
                          <input
                            style={s.input}
                            type="text"
                            value={editForm.nazwa_obiektu}
                            onChange={(ev) =>
                              setEditForm((f) => ({ ...f, nazwa_obiektu: ev.target.value }))
                            }
                          />
                        </label>
                        <label style={s.label}>
                          Rodzaj pracy (opcjonalnie)
                          <input
                            style={s.input}
                            type="text"
                            value={editForm.rodzaj_pracy}
                            onChange={(ev) =>
                              setEditForm((f) => ({ ...f, rodzaj_pracy: ev.target.value }))
                            }
                            placeholder="np. nadzór, ekspertyza, organizacja"
                          />
                        </label>
                        <div style={s.label}>
                          <span style={{ color: "#7dd3fc", fontWeight: 600 }}>Dział</span>
                          <input
                            style={s.input}
                            type="text"
                            value={editForm.dzial}
                            onChange={(ev) =>
                              setEditForm((f) => ({ ...f, dzial: ev.target.value }))
                            }
                          />
                          <span style={{ ...s.dzialInfo, fontSize: "0.78rem" }}>
                            Szybki wybór — ustawia pole na standardową wartość działu w bazie:
                          </span>
                          <div style={s.btnRow}>
                            <button
                              type="button"
                              style={s.btnGhost}
                              onClick={() =>
                                setEditForm((f) => ({
                                  ...f,
                                  dzial: DZIAL_W_BAZIE.prawny,
                                }))
                              }
                            >
                              Dział prawny
                            </button>
                            <button
                              type="button"
                              style={s.btnGhost}
                              onClick={() =>
                                setEditForm((f) => ({
                                  ...f,
                                  dzial: DZIAL_W_BAZIE.inzynieryjny,
                                }))
                              }
                            >
                              Dział inżynieryjny
                            </button>
                          </div>
                        </div>
                        <p
                          style={{
                            ...s.muted,
                            margin: "0.5rem 0 0",
                            fontSize: "0.8rem",
                            color: "#94a3b8",
                          }}
                        >
                          Zleceniodawca i umowa (opcjonalnie)
                        </p>
                        <label style={s.label}>
                          Zleceniodawca
                          <input
                            style={s.input}
                            type="text"
                            value={editForm.zleceniodawca}
                            onChange={(ev) =>
                              setEditForm((f) => ({ ...f, zleceniodawca: ev.target.value }))
                            }
                          />
                        </label>
                        <label style={s.label}>
                          Osoba odpowiedzialna po stronie zleceniodawcy
                          <input
                            style={s.input}
                            type="text"
                            value={editForm.osoba_odpowiedzialna_zleceniodawcy}
                            onChange={(ev) =>
                              setEditForm((f) => ({
                                ...f,
                                osoba_odpowiedzialna_zleceniodawcy: ev.target.value,
                              }))
                            }
                          />
                        </label>
                        <label style={s.label}>
                          Link do umowy
                          <input
                            style={s.input}
                            type="text"
                            placeholder="https://…"
                            value={editForm.link_umowy}
                            onChange={(ev) =>
                              setEditForm((f) => ({ ...f, link_umowy: ev.target.value }))
                            }
                          />
                        </label>
                        <label style={s.label}>
                          Okres trwania projektu — od
                          <input
                            style={s.input}
                            type="date"
                            value={editForm.okres_projektu_od}
                            onChange={(ev) =>
                              setEditForm((f) => ({ ...f, okres_projektu_od: ev.target.value }))
                            }
                          />
                        </label>
                        <label style={s.label}>
                          Okres trwania projektu — do
                          <input
                            style={s.input}
                            type="date"
                            value={editForm.okres_projektu_do}
                            onChange={(ev) =>
                              setEditForm((f) => ({ ...f, okres_projektu_do: ev.target.value }))
                            }
                          />
                        </label>
                        <div style={s.btnRow}>
                          <button
                            type="button"
                            style={s.btnGhost}
                            onClick={() =>
                              setEditForm((f) => ({
                                ...f,
                                okres_projektu_od: "",
                                okres_projektu_do: "",
                              }))
                            }
                          >
                            Wyczyść okres (obie daty)
                          </button>
                        </div>
                        <label style={s.label}>
                          Status projektu
                          <select
                            style={{
                              ...s.input,
                              ...stylPolaUwagiPulpitu(krEdycjaStatusWymagaUwagi),
                            }}
                            value={editForm.status}
                            onChange={(ev) =>
                              setEditForm((f) => ({ ...f, status: ev.target.value }))
                            }
                          >
                            <option value="">— brak —</option>
                            {KR_STATUS_W_BAZIE.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label style={s.label}>
                          Osoba prowadząca — wybór z bazy{" "}
                          <code style={s.code}>pracownik</code> (zakładka ID)
                          <select
                            style={s.input}
                            value={String(editForm.osoba_prowadzaca ?? "")}
                            onChange={(ev) =>
                              setEditForm((f) => ({ ...f, osoba_prowadzaca: ev.target.value }))
                            }
                          >
                            <option value="">— brak —</option>
                            {(() => {
                              const cur = String(editForm.osoba_prowadzaca ?? "").trim();
                              const nrs = new Set(pracownicyPosortowani.map((p) => String(p.nr)));
                              const orphan = cur !== "" && !nrs.has(cur);
                              return (
                                <>
                                  {orphan ? (
                                    <option value={cur}>
                                      {cur} (nie ma w aktualnej liście ID — zapisz lub wybierz inną
                                      osobę)
                                    </option>
                                  ) : null}
                                  {pracownicyPosortowani.map((p) => (
                                    <option key={String(p.nr)} value={String(p.nr)}>
                                      {String(p.nr)} — {p.imie_nazwisko ?? ""}
                                    </option>
                                  ))}
                                </>
                              );
                            })()}
                          </select>
                        </label>
                        {pracFetchError ? (
                          <p
                            style={{
                              ...s.muted,
                              margin: 0,
                              fontSize: "0.82rem",
                              color: "#fca5a5",
                            }}
                          >
                            Nie wczytano listy pracowników: {pracFetchError}. Sprawdź SELECT dla{" "}
                            <code style={s.code}>pracownik</code>.
                          </p>
                        ) : pracownicy.length === 0 ? (
                          <p style={{ ...s.muted, margin: 0, fontSize: "0.82rem" }}>
                            Brak osób w bazie ID — najpierw dodaj je w zakładce{" "}
                            <strong style={{ color: "#d4d4d4" }}>ID</strong>.
                          </p>
                        ) : null}
                        <label style={s.label}>
                          Data rozpoczęcia (pusto = brak daty)
                          <input
                            style={s.input}
                            type="date"
                            value={editForm.data_rozpoczecia}
                            onChange={(ev) =>
                              setEditForm((f) => ({ ...f, data_rozpoczecia: ev.target.value }))
                            }
                          />
                        </label>
                        <div style={s.btnRow}>
                          <button
                            type="button"
                            style={s.btnGhost}
                            onClick={() =>
                              setEditForm((f) => ({ ...f, data_rozpoczecia: "" }))
                            }
                          >
                            Wyczyść datę (brak daty)
                          </button>
                        </div>
                        <div style={s.btnRow}>
                          <button type="button" style={s.btn} onClick={() => saveEditKr(item.kr)}>
                            Zapisz zmiany
                          </button>
                          <button type="button" style={s.btnGhost} onClick={cancelEditKr}>
                            Anuluj
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {isEditing ? (
                      <>
                        <hr style={s.divider} />
                        <h2 style={{ ...s.h2, marginTop: "0.5rem" }}>Etapy projektu (edycja w tabeli etapów)</h2>
                        {listaEtapow.length === 0 ? (
                          <p style={s.muted}>Brak etapów — dodaj je w zakładce Etapy.</p>
                        ) : (
                          <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                            {listaEtapow.map((et) => (
                              <li key={et.id} style={s.etapItem}>
                                <strong style={{ color: "#fff" }}>{et.etap}</strong>
                                {et.status ? (
                                  <span style={s.muted}> · status: {et.status}</span>
                                ) : null}
                                {et.typ_odniesienia || et.data_odniesienia ? (
                                  <span style={s.muted}>
                                    {" "}
                                    · odn.
                                    {et.typ_odniesienia
                                      ? ` (${kmEtykietaTypuOdniesienia(et.typ_odniesienia)})`
                                      : ""}
                                    {et.data_odniesienia
                                      ? `: ${dataDoInputa(et.data_odniesienia)}`
                                      : ""}
                                  </span>
                                ) : null}
                                {et.offset_miesiecy != null && et.offset_miesiecy !== "" ? (
                                  <span style={s.muted}> · +{et.offset_miesiecy} mc</span>
                                ) : null}
                                {et.data_planowana ? (
                                  <span style={s.muted}>
                                    {" "}
                                    · plan:{" "}
                                    {dataDoInputa(et.data_planowana)}
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : null}
                  </div>
                </section>
              );
            })()
          )}
        </>
      ) : null}

      {widok === "kr" &&
      !wybranyKrKlucz &&
      !widokKmDlaKr &&
      !widokLogDlaKr &&
      !widokInfoDlaKr &&
      !widokPwDlaKr &&
      !widokPulpitDlaKr ? (
        <section style={{ marginBottom: "1.25rem" }} aria-label="Skróty KPI — KR i zadania">
          <div style={op.kpiGrid}>
            <OpKpiCard
              label="KR"
              value={krList.length}
              hint="Aktywne karty w systemie"
              accent="success"
              border="rgba(34,197,94,0.28)"
              onClick={przejdzDoKr}
              title="Kliknij: lista KR"
            />
            <OpKpiCard
              label="Zagrożenia i alerty"
              value={listaAlertowOperacyjnych.length}
              hint="Automatyczna lista operacyjna"
              accent="danger"
              border="rgba(239,68,68,0.32)"
              onClick={przejdzDoOstrzezeniaPanel}
              title="Kliknij: raporty / ostrzeżenia"
            />
            <OpKpiCard
              label="Zadania z KR"
              value={liczbaZadanTylkoPowiazanychZKr}
              hint="Przypisane do kodów z listy kart KR (nie zadania ogólne)"
              accent="action"
              border="rgba(249,115,22,0.32)"
              onClick={przejdzDoZadanTylkoZKartamiKr}
              title="Kliknij: moduł Zadania z filtrem „tylko z KR”"
            />
            <OpKpiCard
              label="Otwarte zadania z KR"
              value={liczbaOtwartychZadanTylkoPowiazanychZKr}
              hint="Bez statusu domknięcia — tylko przy kodzie z listy powyżej"
              accent="action"
              border="rgba(249,115,22,0.22)"
              onClick={przejdzDoZadanTylkoZKartamiKr}
              title="Kliknij: moduł Zadania z filtrem „tylko z KR”"
            />
          </div>
        </section>
      ) : null}

      {widok === "kr" &&
      !wybranyKrKlucz &&
      !widokKmDlaKr &&
      !widokLogDlaKr &&
      !widokInfoDlaKr &&
      !widokPwDlaKr &&
      !widokPulpitDlaKr &&
      krList.length > 0 ? (
        <section style={s.krTopWrap} aria-labelledby="kr-introduced-heading">
          <h2 id="kr-introduced-heading" style={s.krTopTitle}>
            Wprowadzone KR ({krList.length})
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "0.5rem 0.65rem",
              marginBottom: "1rem",
              padding: "14px 18px",
              background: theme.surface,
              borderRadius: "12px",
              border: `1px solid ${theme.border}`,
              boxShadow: "0 4px 16px -8px rgba(0,0,0,0.35)",
            }}
          >
            <span style={{ ...s.muted, fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Sortuj
            </span>
            <button type="button" style={{ ...s.btnGhost, fontSize: "0.82rem" }} onClick={() => przestawSortKr("kr")}>
              Kod KR
              {krListaSort.key === "kr" ? (krListaSort.dir === "asc" ? " ▲" : " ▼") : ""}
            </button>
            <button type="button" style={{ ...s.btnGhost, fontSize: "0.82rem" }} onClick={() => przestawSortKr("dzial")}>
              Dział
              {krListaSort.key === "dzial" ? (krListaSort.dir === "asc" ? " ▲" : " ▼") : ""}
            </button>
            <button type="button" style={{ ...s.btnGhost, fontSize: "0.82rem" }} onClick={() => przestawSortKr("status")}>
              Status
              {krListaSort.key === "status" ? (krListaSort.dir === "asc" ? " ▲" : " ▼") : ""}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            {krListPosortowana.map((item) => {
              const wierszUwaga = kodyKrZWyroznieniemUwagi.has(String(item.kr).trim());
              const st = item.status?.trim();
              return (
                <div
                  key={item.kr}
                  style={{
                    borderRadius: "10px",
                    padding: "12px 14px",
                    background: theme.surface,
                    border: `1px solid ${wierszUwaga ? "rgba(239,68,68,0.4)" : theme.border}`,
                    boxShadow: "0 2px 12px -10px rgba(0,0,0,0.4)",
                    transition: "border-color 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease",
                  }}
                  onMouseEnter={(ev) => {
                    const el = ev.currentTarget;
                    el.style.boxShadow = "0 10px 32px -10px rgba(0,0,0,0.5)";
                    el.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(ev) => {
                    const el = ev.currentTarget;
                    el.style.boxShadow = "0 4px 22px -10px rgba(0,0,0,0.4)";
                    el.style.transform = "none";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      gap: "0.55rem",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        minWidth: 0,
                        flex: "1 1 220px",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "0.45rem",
                        fontSize: "0.88rem",
                        lineHeight: 1.25,
                      }}
                    >
                      <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em" }}>
                        {item.kr}
                      </span>
                      {wierszUwaga ? <OpStatusBadge variant="danger">Uwaga</OpStatusBadge> : null}
                      {st ? <OpStatusBadge variant={badgeVariantDlaStatusuKr(st)}>{st}</OpStatusBadge> : null}
                      <span style={{ color: theme.text, fontWeight: 650 }}>
                        {item.nazwa_obiektu?.trim() ? item.nazwa_obiektu : "—"}
                      </span>
                      <span style={{ color: theme.muted }}>·</span>
                      <span style={{ color: theme.action, fontWeight: 600 }}>
                        {item.rodzaj_pracy?.trim() ? item.rodzaj_pracy : "—"}
                      </span>
                      {item.dzial?.trim() ? (
                        <>
                          <span style={{ color: theme.muted }}>·</span>
                          <span style={{ color: theme.text }}>{item.dzial}</span>
                        </>
                      ) : null}
                    </div>
                    <button type="button" style={{ ...s.btn, flexShrink: 0, alignSelf: "center" }} onClick={() => otworzPulpitDlaKr(item)}>
                      Pulpit projektu
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : widok === "kr" &&
      !wybranyKrKlucz &&
      !widokKmDlaKr &&
      !widokLogDlaKr &&
      !widokInfoDlaKr &&
      !widokPwDlaKr &&
      !widokPulpitDlaKr &&
      !krFetchError ? (
        <p style={{ ...s.muted, marginTop: "-0.5rem", marginBottom: "1.5rem" }}>
          {initialFetchDone
            ? "Brak wprowadzonych KR — dodaj pierwszy rekord formularzem poniżej."
            : "Ładowanie listy KR…"}
        </p>
      ) : null}

      {widok === "kr" &&
      !wybranyKrKlucz &&
      !widokKmDlaKr &&
      !widokLogDlaKr &&
      !widokInfoDlaKr &&
      !widokPwDlaKr &&
      !widokPulpitDlaKr ? (
        <>
      <h2 style={s.h2}>Dodaj nowy KR</h2>
      <form style={s.form} onSubmit={addKR}>
        <input
          style={s.input}
          type="text"
          placeholder="KR (wymagane)"
          value={newKr}
          onChange={(ev) => setNewKr(ev.target.value)}
          required
        />
        <input
          style={s.input}
          type="text"
          placeholder="Nazwa obiektu"
          value={newNazwaObiektu}
          onChange={(ev) => setNewNazwaObiektu(ev.target.value)}
        />
        <input
          style={s.input}
          type="text"
          placeholder="Rodzaj pracy (opcjonalnie)"
          value={newRodzajPracy}
          onChange={(ev) => setNewRodzajPracy(ev.target.value)}
        />
        <input
          style={s.input}
          type="text"
          placeholder="Dział"
          value={newDzial}
          onChange={(ev) => setNewDzial(ev.target.value)}
        />
        <p style={{ ...s.muted, margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
          Zleceniodawca i umowa — opcjonalnie
        </p>
        <input
          style={s.input}
          type="text"
          placeholder="Zleceniodawca"
          value={newZleceniodawca}
          onChange={(ev) => setNewZleceniodawca(ev.target.value)}
        />
        <input
          style={s.input}
          type="text"
          placeholder="Osoba odpowiedzialna po stronie zleceniodawcy"
          value={newOsobaZleceniodawcy}
          onChange={(ev) => setNewOsobaZleceniodawcy(ev.target.value)}
        />
        <input
          style={s.input}
          type="text"
          placeholder="Link do umowy (np. https://…)"
          value={newLinkUmowy}
          onChange={(ev) => setNewLinkUmowy(ev.target.value)}
        />
        <label style={s.label}>
          Okres trwania projektu — od (opcjonalnie)
          <input
            style={s.input}
            type="date"
            value={newOkresProjektuOd}
            onChange={(ev) => setNewOkresProjektuOd(ev.target.value)}
          />
        </label>
        <label style={s.label}>
          Okres trwania projektu — do (opcjonalnie)
          <input
            style={s.input}
            type="date"
            value={newOkresProjektuDo}
            onChange={(ev) => setNewOkresProjektuDo(ev.target.value)}
          />
        </label>
        <label style={s.label}>
          Osoba prowadząca — z bazy <code style={s.code}>pracownik</code>
          <select
            style={s.input}
            value={newOsobaProwadzaca}
            onChange={(ev) => setNewOsobaProwadzaca(ev.target.value)}
          >
            <option value="">— brak —</option>
            {pracownicyPosortowani.map((p) => (
              <option key={String(p.nr)} value={String(p.nr)}>
                {String(p.nr)} — {p.imie_nazwisko ?? ""}
              </option>
            ))}
          </select>
        </label>
        {pracFetchError ? (
          <p style={{ ...s.muted, margin: 0, fontSize: "0.82rem", color: "#fca5a5" }}>
            Lista ID niedostępna: {pracFetchError}
          </p>
        ) : pracownicy.length === 0 ? (
          <p style={{ ...s.muted, margin: 0, fontSize: "0.82rem" }}>
            Dodaj pracowników w zakładce <strong style={{ color: "#d4d4d4" }}>ID</strong>, aby móc tu
            wybrać osobę.
          </p>
        ) : null}
        <label style={s.label}>
          Data rozpoczęcia projektu (opcjonalnie — pusto = brak daty w bazie)
          <input
            style={s.input}
            type="date"
            value={newDataRozpoczecia}
            onChange={(ev) => setNewDataRozpoczecia(ev.target.value)}
          />
        </label>
        <label style={s.label}>
          Status projektu
          <select
            style={s.input}
            value={newStatus}
            onChange={(ev) => setNewStatus(ev.target.value)}
          >
            <option value="">— brak —</option>
            {KR_STATUS_W_BAZIE.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </label>
        <div style={s.btnRow}>
          <button type="submit" style={s.btn}>
            Zapisz nowy KR
          </button>
        </div>
      </form>

        </>
      ) : null}
        </main>

        <aside style={op.shellSidebar} aria-label="Nawigacja główna">
          <div style={{ ...op.brandKicker, marginBottom: "0.15rem" }}>G4 · Geodezja</div>
          <div
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              marginBottom: "1rem",
              lineHeight: 1.2,
            }}
          >
            Operacje
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.45rem",
              cursor: "pointer",
              fontSize: "0.8rem",
              color: theme.text,
              marginBottom: "0.55rem",
              lineHeight: 1.35,
            }}
          >
            <input
              type="checkbox"
              checked={trybHelp}
              onChange={(e) => setTrybHelp(e.target.checked)}
              style={{ marginTop: "0.2rem", flexShrink: 0 }}
            />
            <span>
              <strong style={{ color: theme.success }}>Tryb HELP</strong>
            </span>
          </label>
          <input
            type="search"
            aria-label="Szukaj KR"
            placeholder="Szukaj KR, obiekt, dział…"
            value={panelKrSzukaj}
            onChange={(e) => setPanelKrSzukaj(e.target.value)}
            style={op.searchInput}
          />
          <HelpLinijka wlaczony={trybHelp}>
            Ogranicza listę projektów po kodzie KR, nazwie obiektu lub dziale — tylko w tym panelu.
          </HelpLinijka>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.35rem",
              marginBottom: "0.75rem",
              fontSize: "0.68rem",
              color: theme.muted,
            }}
          >
            <span title="Automatyczne alerty">Alerty: {listaAlertowOperacyjnych.length}</span>
            <span title="KR z podświetleniem">Uwaga KR: {liczbaTematowUwagi}</span>
          </div>
          <div style={{ ...op.navSectionLabel }}>Menu</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginBottom: "0.85rem" }}>
            {[
              {
                id: "dashboard",
                label: "Dashboard",
                fn: przejdzDoDashboard,
                w: "dashboard",
                help: "Start aplikacji — liczby, skróty i ogólny obraz sytuacji.",
              },
              {
                id: "kr",
                label: "KR",
                fn: przejdzDoKr,
                w: "kr",
                help: "Lista kodów KR, karty i pulpity projektów.",
              },
              {
                id: "zadania",
                label: "Zadania",
                fn: przejdzDoZadania,
                w: "zadania",
                help: "Zadania ogólne — terminy, Kanban, filtr KR.",
              },
              {
                id: "czas_pracy",
                label: "Czas pracy",
                fn: przejdzDoCzasPracy,
                w: "czas_pracy",
                help: "Kalendarz godzin, KR, urlopy — sumy miesięczne i szacunek kosztu (stawki).",
              },
              {
                id: "podwykonawca",
                label: "Podwykonawcy",
                fn: przejdzDoPodwykonawcow,
                w: "podwykonawca",
                help: "Katalog firm zewnętrznych.",
              },
              {
                id: "sprzet",
                label: "Sprzęt",
                fn: przejdzDoSprzet,
                w: "sprzet",
                help: "Komputery, drukarki, ksera — inwentaryzacja.",
              },
              {
                id: "ostrzezenia",
                label: "Raporty",
                fn: przejdzDoOstrzezeniaPanel,
                w: "ostrzezenia",
                help: "Alerty operacyjne i lista wymagających reakcji.",
              },
            ].map((b) => (
              <div key={b.id}>
                <button
                  type="button"
                  style={{ ...op.navBtn, ...(widok === b.w ? op.navBtnActive : {}), marginBottom: 0 }}
                  onClick={() => b.fn()}
                >
                  {b.label}
                </button>
                <HelpLinijka wlaczony={trybHelp}>{b.help}</HelpLinijka>
              </div>
            ))}
            <div style={op.navSectionLabel}>Zasoby</div>
            {[
              ...(requireAuth
                ? [
                    {
                      id: "moje_dokumenty",
                      label: "Moje dokumenty",
                      fn: przejdzDoMojeDokumenty,
                      w: "moje_dokumenty",
                      help: "Pliki z Box (kategoria z nazwy), opcjonalnie skrót do Google Sheet.",
                    },
                  ]
                : []),
              {
                id: "samochody",
                label: "Pojazdy",
                fn: przejdzDoSamochody,
                w: "samochody",
                help: "Flota, polisy, przeglądy, rezerwacje.",
              },
              {
                id: "pracownik",
                label: "Zespół",
                fn: przejdzDoPracownikow,
                w: "pracownik",
                help: "Pracownicy i numery ID w systemie.",
              },
            ].map((b) => (
              <div key={b.id}>
                <button
                  type="button"
                  style={{ ...op.navBtn, ...(widok === b.w ? op.navBtnActive : {}), marginBottom: 0 }}
                  onClick={() => b.fn()}
                >
                  {b.label}
                </button>
                <HelpLinijka wlaczony={trybHelp}>{b.help}</HelpLinijka>
              </div>
            ))}
            <div>
              <button type="button" style={{ ...op.navBtn, marginBottom: 0 }} onClick={przejdzDoInfoZagrozen}>
                Reguły podświetleń (INFO)
              </button>
              <HelpLinijka wlaczony={trybHelp}>
                Treść wyjaśniająca kolory i zasady — do czytania, bez edycji projektów.
              </HelpLinijka>
            </div>
          </div>
          <div style={{ ...op.muted, fontSize: "0.72rem", marginBottom: "0.45rem" }}>KR</div>
          <HelpLinijka wlaczony={trybHelp}>
            Kliknij wiersz — otworzy się ten projekt w środkowej części ekranu. Kropka to przybliżony stan (uwaga /
            spokój).
          </HelpLinijka>
          <div style={{ maxHeight: "min(38vh, 420px)", overflowY: "auto", marginBottom: "0.65rem" }}>
            {panelKrListaFiltrowana.length === 0 ? (
              <p style={{ ...op.muted, fontSize: "0.76rem", margin: 0 }}>Brak pozycji przy tym filtrze.</p>
            ) : (
              panelKrListaFiltrowana.map((row) => {
                const active =
                  wybranyKrKlucz != null && String(wybranyKrKlucz).trim() === String(row.kr).trim();
                return (
                  <button
                    key={String(row.kr)}
                    type="button"
                    style={op.krListItem(active, kodyKrZWyroznieniemUwagi.has(String(row.kr).trim()))}
                    onClick={() => wybierzKrWPanelu(row)}
                  >
                    <span style={{ minWidth: 0, textAlign: "left", lineHeight: 1.25 }}>
                      <strong style={{ fontSize: "0.78rem" }}>{row.kr}</strong>
                      {row.nazwa_obiektu ? (
                        <span
                          style={{
                            display: "block",
                            fontWeight: 500,
                            color: "#94a3b8",
                            fontSize: "0.66rem",
                            marginTop: "0.04rem",
                          }}
                        >
                          {String(row.nazwa_obiektu).length > 38
                            ? `${String(row.nazwa_obiektu).slice(0, 36)}…`
                            : row.nazwa_obiektu}
                        </span>
                      ) : null}
                    </span>
                    <span style={op.dot(kolorKropkiKrWPanelu(row))} title="Status przybliżony" />
                  </button>
                );
              })
            )}
          </div>
          {widok === "kr" && wybranyRekordKr ? (
            <div style={{ borderTop: "1px solid rgba(148,163,184,0.12)", paddingTop: "0.75rem" }}>
              <div style={{ ...op.muted, fontSize: "0.72rem", marginBottom: "0.35rem" }}>
                Sekcje: {wybranyRekordKr.kr}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                {KR_PROJEKT_MENU.map((m) => (
                  <div key={m.id}>
                    <button
                      type="button"
                      style={{
                        ...op.navBtn,
                        fontSize: "0.78rem",
                        padding: "0.4rem 0.55rem",
                        marginBottom: 0,
                      }}
                      onClick={() => przejdzDoSekcjiKr(wybranyRekordKr, m.id)}
                    >
                      {m.label}
                    </button>
                    <HelpLinijka wlaczony={trybHelp}>{m.help}</HelpLinijka>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
