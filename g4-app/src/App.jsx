import { useEffect, useMemo, useState } from "react";
import { AuthScreen } from "./AuthScreen.jsx";
import { supabase } from "./lib/supabase.js";

/**
 * `true` — tylko zalogowani widzą dane (ustaw w .env przy deployu: VITE_REQUIRE_AUTH=true).
 * Domyślnie / brak zmiennej — aplikacja publiczna (jak dotychczas, klucz anon w RLS).
 */
const requireAuth =
  import.meta.env.VITE_REQUIRE_AUTH === "true" ||
  import.meta.env.VITE_REQUIRE_AUTH === "1";

/** Ciemny motyw, czytelna typografia — style inline, bez biblioteki UI. */
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
    color: "#e8e8e8",
    background: "#070707",
    textAlign: "left",
  },
  h2: {
    fontSize: "1.15rem",
    marginTop: "2rem",
    marginBottom: "0.65rem",
    fontWeight: 600,
    color: "#ffffff",
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
    gap: "0.75rem",
    maxWidth: "min(28rem, 100%)",
    padding: "1.15rem",
    border: "1px solid #2e2e2e",
    borderRadius: "10px",
    background: "#101010",
    marginBottom: "2rem",
  },
  /** Rozbite border / tło — żeby nie mieszać shorthand z `borderColor` / `backgroundColor` przy podświetleniach (React 19). */
  input: {
    padding: "0.55rem 0.65rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#3d3d3d",
    borderRadius: "8px",
    font: "inherit",
    boxSizing: "border-box",
    width: "100%",
    backgroundColor: "#141414",
    color: "#f5f5f5",
    outline: "none",
  },
  label: {
    display: "grid",
    gap: "0.35rem",
    fontSize: "0.82rem",
    color: "#a3a3a3",
    fontWeight: 500,
  },
  btn: {
    padding: "0.55rem 1.1rem",
    borderRadius: "8px",
    border: "1px solid #d4d4d4",
    background: "#f5f5f5",
    color: "#0a0a0a",
    font: "inherit",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnGhost: {
    padding: "0.5rem 0.95rem",
    borderRadius: "8px",
    border: "1px solid #525252",
    background: "transparent",
    color: "#e5e5e5",
    font: "inherit",
    cursor: "pointer",
  },
  btnRow: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.35rem" },
  krBlock: {
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    marginBottom: "1rem",
    overflow: "hidden",
    background: "#0d0d0d",
  },
  krHead: {
    padding: "0.9rem 1.1rem",
    background: "#141414",
    borderBottom: "1px solid #2a2a2a",
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
  muted: { color: "#a3a3a3", fontSize: "0.92rem" },
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
    padding: "1rem 1.15rem",
    border: "1px solid #2e2e2e",
    borderRadius: "12px",
    background: "#101010",
    boxSizing: "border-box",
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
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    background: "#0d0d0d",
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
  /** Tabela kamieni milowych — mniejsza czcionka, więcej kolumn na ekranie. */
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

/** Kamień milowy uznany za „domknięty” — nie podświetlamy przeterminowania. */
const KM_STATUS_PULPIT_ZAMKNIETE = new Set(["zrealizowane", "rozliczone", "anulowane"]);

/** KR wymaga koordynacji (spotkanie / decyzja zleceniodawcy). */
function pulpitKrRekordWymagaUwagi(rekord) {
  if (!rekord) return false;
  return tekstTrim(rekord.status).toLowerCase() === "oczekuje na zamawiającego";
}

/** Plan KM minął (dzień), a etap nie jest zamknięty — jak na pulpicie. */
function pulpitKmPlanPrzeterminowany(row, dziśYYYYMMDD) {
  const plan = dataDoSortuYYYYMMDD(row.data_planowana);
  if (!plan || !dziśYYYYMMDD) return false;
  if (plan >= dziśYYYYMMDD) return false;
  const st = tekstTrim(row.status).toLowerCase();
  if (KM_STATUS_PULPIT_ZAMKNIETE.has(st)) return false;
  return true;
}

/** KM: zagrożenie, opis ryzyka lub plan po terminie przy etapie jeszcze „otwartym”. */
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

const PULPIT_KIND_ORDER = { kr_start: 0, km: 1, pw: 2, log: 3 };

/** Przy tym samym dniu na osi: PW — najpierw data zlecenia, potem termin planowy, na końcu oddanie faktyczne. */
const PW_PULPIT_ANCHOR_ORDER = { data_zlecenia: 0, termin_zlecenia: 1, data_oddania: 2 };

/** Mała ikonka typu wpisu na osi czasu pulpitu (KM / PW / LOG / start KR). */
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
    case "km":
      return svg(
        "KM — kamień milowy",
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

/** Zgodnie z CHECK w supabase/kr-add-status.sql — muszą być identyczne jak w bazie. */
const KR_STATUS_W_BAZIE = [
  "w trakcie",
  "zakończone",
  "oczekuje na zamawiającego",
];

/** Zgodnie z supabase/kamienie-milowe-status-check.sql (CHECK opcjonalny) — wartości statusu kamienia milowego. */
const KM_STATUS_W_BAZIE = [
  "planowane",
  "w trakcie",
  "zrealizowane",
  "rozliczone",
  "oczekuje",
  "anulowane",
];

/** Zgodnie z supabase/kamienie-milowe-typ-odniesienia.sql — co oznacza data odniesienia. */
const KM_TYP_ODNIESIENIA_W_BAZIE = ["linia", "zlecenie"];

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
    zadanie: "",
    dzial: "",
    osoba_odpowiedzialna: "",
    osoba_zlecajaca: "",
    status: "",
    data_planowana: "",
    data_realna: "",
    zagrozenie: "",
    opis: "",
  };
}

function zadanieWierszDoFormu(row) {
  return {
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

/** Tekst do komórki KM: „—” gdy pusto; `title` z pełną treścią pod podpowiedź. */
function kmTekstDoKomorki(val) {
  const t = val != null && String(val).trim() !== "" ? String(val).trim() : "";
  return { text: t || "—", title: t };
}

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

  /** Widok górnych przycisków: KR | ID (pracownik) | TASK (zadania). */
  const [widok, setWidok] = useState("kr");
  /** Otwarty rekord KR (szczegóły + etapy); null = główny ekran z samą listą. */
  const [wybranyKrKlucz, setWybranyKrKlucz] = useState(null);
  /** Widok kamieni milowych dla wybranego kodu KR (z listy głównej). */
  const [widokKmDlaKr, setWidokKmDlaKr] = useState(null);
  /** Dziennik zdarzeń (LOG) dla jednego KR — tabela dziennik_zdarzen. */
  const [widokLogDlaKr, setWidokLogDlaKr] = useState(null);
  /** Podgląd INFO: KR + KM + LOG tylko do odczytu. */
  const [widokInfoDlaKr, setWidokInfoDlaKr] = useState(null);
  /** Zlecenia PW dla wybranego kodu KR (osobny widok z listy — przycisk PW). */
  const [widokPwDlaKr, setWidokPwDlaKr] = useState(null);
  /** Pulpit / oś czasu — złączone KM, PW, LOG chronologicznie dla jednego KR. */
  const [widokPulpitDlaKr, setWidokPulpitDlaKr] = useState(null);
  /** Pulpit: pierwszy klucz sortowania — data; potem typ (KM/PW/LOG), potem kolejność dodania. */
  const [pulpitSortDaty, setPulpitSortDaty] = useState("asc");
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

  const [podwykonawcyList, setPodwykonawcyList] = useState([]);
  const [podwykonawcyFetchError, setPodwykonawcyFetchError] = useState(null);
  const [pwEdycjaId, setPwEdycjaId] = useState(null);
  const [pwForm, setPwForm] = useState(() => podwykonawcaPustyForm());

  const [krZleceniaPwList, setKrZleceniaPwList] = useState([]);
  const [krZleceniaPwFetchError, setKrZleceniaPwFetchError] = useState(null);
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

  /** Sortowanie listy KR w tabeli (i kolejności kart poniżej): dział / status albo domyślnie wg numeru KR. */
  const [krListaSort, setKrListaSort] = useState({ key: null, dir: "asc" });

  const krListPosortowana = useMemo(() => {
    if (krListaSort.key !== "dzial" && krListaSort.key !== "status") {
      return krList;
    }
    const dirMnoznik = krListaSort.dir === "asc" ? 1 : -1;
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
      .from("kamienie_milowe")
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
    void fetchKR();
    void fetchEtapy();
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
    setWidok("zadania");
    void fetchZadania();
    void fetchPracownicy();
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

    const { error } = await supabase.from("pracownik").insert([
      {
        nr,
        imie_nazwisko: imie,
        dzial: newPracDzial.trim() || null,
        email: newPracEmail.trim() || null,
        telefon: newPracTelefon.trim() || null,
      },
    ]);

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
    await fetchPracownicy();
  }

  function wczytajZadanieDoEdycji(row) {
    setZadanieEdycjaId(row.id);
    setZadanieForm(zadanieWierszDoFormu(row));
  }

  function anulujZadanieEdycje() {
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
  }

  async function zapiszZadanie(e) {
    e.preventDefault();
    const zTxt = String(zadanieForm.zadanie ?? "").trim();
    if (!zTxt) {
      alert('Pole „Zadanie” jest wymagane.');
      return;
    }

    const st = String(zadanieForm.status ?? "").trim();
    const statusDoBazy = st === "" ? null : st;

    const payload = {
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
              ? "\n\nSprawdź strukturę tabeli zadania w bazie."
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
            "\n\nUruchom sekcję zadania w g4-app/supabase/rls-policies-anon.sql."
        );
        return;
      }
    }

    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
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
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!requireAuth) {
      void (async () => {
        await fetchKR();
        await fetchEtapy();
        void fetchPracownicy();
        void fetchZadania();
        void fetchPodwykonawcy();
        setInitialFetchDone(true);
      })();
      return;
    }
    if (!session?.user) {
      setInitialFetchDone(false);
      return;
    }
    void (async () => {
      await fetchKR();
      await fetchEtapy();
      void fetchPracownicy();
      void fetchZadania();
      void fetchPodwykonawcy();
      setInitialFetchDone(true);
    })();
  }, [requireAuth, session?.user?.id]);

  useEffect(() => {
    if (widok !== "kr") return;
    const kInfo = widokInfoDlaKr != null ? String(widokInfoDlaKr).trim() : "";
    const kPw = widokPwDlaKr != null ? String(widokPwDlaKr).trim() : "";
    const kPulpit = widokPulpitDlaKr != null ? String(widokPulpitDlaKr).trim() : "";
    const k = kInfo || kPw || kPulpit;
    if (!k) {
      setKrZleceniaPwList([]);
      setKrZleceniaPwFetchError(null);
      return;
    }
    void fetchKrZleceniaPwForKr(k);
    void fetchPodwykonawcy();
  }, [widok, widokInfoDlaKr, widokPwDlaKr, widokPulpitDlaKr]);

  /** Pulpit korzysta z tej samej tablicy co widok LOG; po KM edycja czyści `dziennikWpisy` — odśwież przy powrocie na oś. */
  useEffect(() => {
    if (widok !== "kr") return;
    const kP = widokPulpitDlaKr != null ? String(widokPulpitDlaKr).trim() : "";
    if (!kP) return;
    const pulpitNaWierzchu =
      widokKmDlaKr == null &&
      widokLogDlaKr == null &&
      widokPwDlaKr == null &&
      widokInfoDlaKr == null &&
      wybranyKrKlucz == null;
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

  /** Kamienie milowe dla wybranego KR — osobny widok z listą i formularzem. */
  function otworzKmDlaKr(item) {
    const k = String(item.kr).trim();
    setWidokKmDlaKr(k);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    setWybranyKrKlucz(null);
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
    const k = String(item.kr).trim();
    const edytujRow = opts?.edytujRow ?? null;
    setWidokLogDlaKr(k);
    setWidokKmDlaKr(null);
    setWidokInfoDlaKr(null);
    setWidokPwDlaKr(null);
    setWybranyKrKlucz(null);
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
    setWidokLogDlaKr(null);
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
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

  /** Pulpit — jedna oś czasu: KM, PW, LOG + skrót kontaktów (przycisk przy wierszu KR). */
  function otworzPulpitDlaKr(item) {
    const k = String(item.kr).trim();
    setWidokPulpitDlaKr(k);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
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
    void fetchPodwykonawcy();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function powrotZPulpituDoListy() {
    setWidokPulpitDlaKr(null);
    setPulpitSortDaty("asc");
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setKrZleceniaPwList([]);
    setKrZleceniaPwFetchError(null);
    setLogEdycjaId(null);
    setLogForm(logPustyForm());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Zlecenia PW dla wybranego KR — osobny widok z listy (przycisk PW obok KR). */
  function otworzPwDlaKr(item) {
    const k = String(item.kr).trim();
    setWidokPwDlaKr(k);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setWybranyKrKlucz(null);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      alert("Pole „Etap” jest wymagane przy zapisie kamienia milowego.");
      return;
    }

    const statusWart = String(kmForm.status ?? "").trim();
    const statusDoBazy =
      statusWart === "" ? null : KM_STATUS_W_BAZIE.includes(statusWart) ? statusWart : null;
    if (statusWart !== "" && statusDoBazy === null) {
      alert("Nieprawidłowy status kamienia milowego. Wybierz jedną z opcji listy lub „— brak —”.");
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
        : KM_TYP_ODNIESIENIA_W_BAZIE.includes(typOdnWart)
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
        .from("kamienie_milowe")
        .update(payload)
        .eq("id", kmEdycjaId)
        .select("id");

      if (error) {
        console.error(error);
        alert(
          "Zapis kamienia milowego: " +
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
      const { error } = await supabase.from("kamienie_milowe").insert([payload]).select("id");

      if (error) {
        console.error(error);
        alert(
          "Dodawanie kamienia milowego: " +
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
    if (!window.confirm("Usunąć ten wiersz kamienia milowego?")) return;
    const { error } = await supabase.from("kamienie_milowe").delete().eq("id", id);
    if (error) {
      console.error(error);
      const msg = String(error.message);
      const fkFaktury =
        msg.toLowerCase().includes("foreign key") && msg.toLowerCase().includes("faktury");
      alert(
        "Usuwanie: " +
          msg +
          (fkFaktury
            ? "\n\nDo tego etapu są przypisane faktury (tabela faktury). Domyślnie baza nie pozwala usunąć kamienia milowego, dopóki coś na niego wskazuje.\n\nRozwiązanie: w SQL Editor uruchom plik g4-app/supabase/faktury-etap-on-delete.sql (ustalenie co się dzieje z fakturami przy usuwaniu KM), albo w panelu usuń lub zmień powiązane faktury."
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
    if (karta.kind === "kr_start") {
      otworzEdycjeKrZTabeli(rekordKrPulpit);
      return;
    }
    if (karta.kind === "km") {
      const row = etapy.find((e) => e.id === karta.edytujId);
      if (!row) {
        alert("Nie znaleziono kamienia milowego — odśwież pulpit.");
        return;
      }
      otworzKmDlaKr(rekordKrPulpit);
      wczytajKmDoEdycji(row);
      return;
    }
    if (karta.kind === "pw") {
      const z = krZleceniaPwList.find((x) => x.id === karta.edytujId);
      if (!z) {
        alert("Nie znaleziono zlecenia PW — odśwież pulpit.");
        return;
      }
      otworzPwDlaKr(rekordKrPulpit);
      wczytajKrZleceniePwDoEdycji(z);
      return;
    }
    if (karta.kind === "log") {
      const row = dziennikWpisy.find((r) => String(r.id) === String(karta.edytujId));
      if (!row) {
        alert("Nie znaleziono wpisu dziennika — odśwież pulpit.");
        return;
      }
      otworzLogDlaKr(rekordKrPulpit, { edytujRow: row });
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
   * Oznaczenie wiersza na liście KR (status „oczekuje na …” albo problematyczny KM).
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
        kind: "km",
        edytujId: row.id,
        title: `KM · ${et}`,
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
   * powiązania (np. ON UPDATE CASCADE na `kamienie_milowe.kr`), inaczej Postgres zwróci błąd FK.
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

  return (
    <div style={s.page}>
      <nav style={s.topNav} aria-label="Wybór tabeli">
        <span style={s.navGroup}>
          <button
            type="button"
            style={widok === "kr" ? s.btnNavActive : s.btnNav}
            onClick={przejdzDoKr}
          >
            KR
          </button>
          <button
            type="button"
            style={widok === "pracownik" ? s.btnNavActive : s.btnNav}
            onClick={przejdzDoPracownikow}
          >
            ID
          </button>
          <button
            type="button"
            style={widok === "zadania" ? s.btnNavActive : s.btnNav}
            onClick={przejdzDoZadania}
          >
            TASK
          </button>
          <button
            type="button"
            style={widok === "podwykonawca" ? s.btnNavActive : s.btnNav}
            onClick={przejdzDoPodwykonawcow}
            title="Podwykonawcy (PW)"
          >
            PW
          </button>
          <button
            type="button"
            style={widok === "zagrozenia" ? s.btnNavActive : s.btnNav}
            onClick={przejdzDoInfoZagrozen}
            title="Kiedy wiersze są na czerwono — pulpit i lista KR"
          >
            INFO · zagrożenia
          </button>
        </span>
        {requireAuth && session?.user ? (
          <>
            <span style={s.navSep} aria-hidden="true" />
            <span style={{ ...s.navGroup, marginLeft: "auto" }}>
              <span
                style={{
                  ...s.muted,
                  fontSize: "0.8rem",
                  maxWidth: "min(14rem, 40vw)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={session.user.email ?? ""}
              >
                {session.user.email}
              </span>
              <button
                type="button"
                style={s.btnNav}
                onClick={() => void supabase.auth.signOut()}
              >
                Wyloguj
              </button>
            </span>
          </>
        ) : null}
      </nav>
      <p style={{ ...s.muted, marginTop: "-0.35rem", marginBottom: "1rem", fontSize: "0.82rem" }}>
        {widok === "kr" ? (
          <>
            Widok: <strong style={{ color: "#d4d4d4" }}>tabela kr + kamienie milowe</strong>
          </>
        ) : widok === "zagrozenia" ? (
          <>
            Pomoc:{" "}
            <strong style={{ color: "#fca5a5" }}>czerwone podświetlenia</strong> na pulpicie i liście KR —
            poniżej pełna lista reguł
          </>
        ) : widok === "zadania" ? (
          <>
            Widok:{" "}
            <strong style={{ color: "#d4d4d4" }}>
              tabela zadania (sprzęt, organizacja — bez powiązania z KR)
            </strong>
          </>
        ) : widok === "podwykonawca" ? (
          <>
            Widok:{" "}
            <strong style={{ color: "#d4d4d4" }}>tabela podwykonawca</strong> (PW — firmy
            zewnętrzne)
          </>
        ) : (
          <>
            Widok: <strong style={{ color: "#d4d4d4" }}>tabela pracownik</strong> (identyfikatory
            osób)
          </>
        )}
      </p>

      {widok === "kr" && (krFetchError || etapyFetchError) ? (
        <div style={s.errBox} role="alert">
          <strong>Błąd pobierania z Supabase.</strong>
          <br />
          {krFetchError ? <>KR: {krFetchError}<br /></> : null}
          {etapyFetchError ? <>Etapy: {etapyFetchError}</> : null}
        </div>
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
              <strong style={{ color: "#f87171" }}>KM</strong> — <strong>którykolwiek</strong> z warunków: pole
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
            Pod przyciskami <strong>KM / PW / LOG / …</strong> pojawia się podsumowanie, jeśli na osi jest co najmniej{" "}
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
              <strong>którykolwiek kamień milowy</strong> przypisany do tego kodu KR spełnia reguły „uwagi” jak dla{" "}
              <strong style={{ color: "#f87171" }}>KM</strong> na pulpicie (zagrożenie / opis / plan po terminie przy
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
            <li>KR / KM: zmień status lub usuń zagrożenie / zaktualizuj plan, domknij etap zgodnie z regułami powyżej.</li>
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

      {widok === "pracownik" ? (
        <>
          <h2 style={{ ...s.h2, marginTop: 0 }}>Pracownicy</h2>
          <p style={s.muted}>
            Rekordy z tabeli <code style={s.code}>pracownik</code> — kolumna <code style={s.code}>nr</code>{" "}
            to identyfikator używany w KR (osoba prowadząca itd.). Nowego pracownika dodasz formularzem
            pod tabelą.
          </p>

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
          <h2 style={{ ...s.h2, marginTop: 0 }}>TASK — zadania ogólne</h2>
          <p style={{ ...s.muted, marginBottom: "0.75rem" }}>
            Tabela <code style={s.code}>zadania</code>: zadania nie przypisane do KR (np. sprzęt,
            organizacja). Osoby wybierasz z zakładki <strong style={{ color: "#92c9ff" }}>ID</strong>{" "}
            (kolumny <code style={s.code}>osoba_odpowiedzialna</code>,{" "}
            <code style={s.code}>osoba_zlecajaca</code> — opcjonalnie).
          </p>

          {zadaniaFetchError ? null : zadaniaList.length === 0 ? (
            <p style={s.muted}>Brak zadań — dodaj pierwsze formularzem poniżej.</p>
          ) : (
            <div style={s.tableWrap}>
              <table style={{ ...s.table, fontSize: "0.86rem" }}>
                <thead>
                  <tr>
                    <th style={s.th}>Zadanie</th>
                    <th style={{ ...s.th, color: "#7dd3fc" }}>Dział</th>
                    <th style={s.th}>Odpow.</th>
                    <th style={s.th}>Zlecający</th>
                    <th style={{ ...s.th, color: "#a7f3d0" }}>Status</th>
                    <th style={s.th}>Plan</th>
                    <th style={s.th}>Real</th>
                    <th style={s.th}>Zagr.</th>
                    <th style={s.th}>Opis</th>
                    <th style={s.th} />
                  </tr>
                </thead>
                <tbody>
                  {zadaniaList.map((row) => {
                    const zt = kmTekstDoKomorki(row.zadanie);
                    const op = kmTekstDoKomorki(row.opis);
                    return (
                      <tr key={row.id}>
                        <td style={s.td} title={zt.title || undefined}>
                          <strong style={{ color: "#f5f5f5" }}>{zt.text}</strong>
                        </td>
                        <td style={{ ...s.td, ...s.dzialWartosc }}>
                          {row.dzial?.trim() ? row.dzial : "—"}
                        </td>
                        <td style={s.td}>
                          {podpisOsobyProwadzacej(row.osoba_odpowiedzialna, mapaProwadzacychId) ?? "—"}
                        </td>
                        <td style={s.td}>
                          {podpisOsobyProwadzacej(row.osoba_zlecajaca, mapaProwadzacychId) ?? "—"}
                        </td>
                        <td style={{ ...s.td, ...s.statusKr, fontSize: "0.8rem" }}>
                          {row.status?.trim() ? row.status : "—"}
                        </td>
                        <td style={s.td}>
                          {row.data_planowana ? dataDoInputa(row.data_planowana) : "—"}
                        </td>
                        <td style={s.td}>
                          {row.data_realna ? dataDoInputa(row.data_realna) : "—"}
                        </td>
                        <td style={s.td}>
                          {row.zagrozenie === true ? "tak" : row.zagrozenie === false ? "nie" : "—"}
                        </td>
                        <td style={s.td} title={op.title || undefined}>
                          {op.text}
                        </td>
                        <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            style={{ ...s.btnGhost, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                            onClick={() => wczytajZadanieDoEdycji(row)}
                          >
                            Edytuj
                          </button>{" "}
                          <button
                            type="button"
                            style={{ ...s.btnGhost, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
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
          <p style={{ ...s.muted, marginBottom: "0.75rem" }}>
            Tabela <code style={s.code}>podwykonawca</code>: nazwa firmy, osoba kontaktowa, telefon.
            Skrót <strong style={{ color: "#d4d4d4" }}>PW</strong> w menu to katalog firm. Zlecenia przy
            konkretnym KR dodajesz na liście projektów → przycisk <strong>PW</strong> przy wierszu (nie zakładka{" "}
            <strong>PW</strong>).
          </p>

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
          <p style={{ ...s.muted, marginBottom: "0.65rem", fontSize: "0.82rem" }}>
            Tabela <code style={s.code}>kr_zlecenie_podwykonawcy</code> — podgląd zbiorczy. Edytuj lub usuń z
            tej tabeli albo z wiersza projektu na liście KR (przycisk <strong>PW</strong>).
          </p>
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

      {widok === "kr" && widokKmDlaKr ? (
        <section style={s.krTopWrap} aria-labelledby="km-naglowek">
          <div style={{ marginBottom: "1rem" }}>
            <button type="button" style={s.btnGhost} onClick={powrotZKmDoListy}>
              {widokPulpitDlaKr != null && String(widokPulpitDlaKr) === String(widokKmDlaKr)
                ? "← Pulpit"
                : "← Lista KR"}
            </button>
          </div>
          <h2
            id="km-naglowek"
            style={{ ...s.krTopTitle, fontSize: "0.98rem" }}
          >
            Kamienie milowe — KR {widokKmDlaKr}
          </h2>
          <p style={{ ...s.muted, marginBottom: "0.75rem", fontSize: "0.82rem" }}>
            Wiersze w tabeli <code style={s.code}>kamienie_milowe</code> przypisane do tego KR. Pole{" "}
            <strong style={{ color: "#e5e5e5" }}>Etap</strong> jest wymagane przy zapisie.{" "}
            <strong style={{ color: "#a7f3d0" }}>Status</strong> wybierasz z listy (jak status KR —
            planowane, w trakcie, zrealizowane itd.).{" "}
            <strong style={{ color: "#e5e5e5" }}>Typ odniesienia</strong> (linia albo zlecenie)
            wskazuje, czego dotyczy data kotwicy;{" "}
            <strong style={{ color: "#e5e5e5" }}>data odniesienia</strong> i{" "}
            <strong style={{ color: "#e5e5e5" }}>offset (miesiące)</strong> służą do naliczania
            terminu planowego; przy triggerze w bazie (
            <code style={s.code}>kamienie-milowe-data-planowana-wylicz.sql</code>) data planu ustawi
            się po zapisie, gdy oba pola są wypełnione.{" "}
            <strong style={{ color: "#fca5a5" }}>Czerwień w tabeli i formularzu</strong> — te same
            pola co ostrzeżenie na pulpicie: zagrożenie, opis zagrożenia, przeterminowany plan (przy
            etapie niezamkniętym), status przy takim planie.
          </p>

          <div style={s.tableWrap}>
            <table style={s.kmTable}>
              <colgroup>
                <col style={{ width: "8%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "6.5%" }} />
                <col style={{ width: "4.5%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "4.5%" }} />
                <col style={{ width: "4.5%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "7%" }} />
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
                  <th style={s.kmTh} />
                </tr>
              </thead>
              <tbody>
                {listaKmDlaWidoku.map((row) => {
                  const uw = kmTekstDoKomorki(row.uwagi);
                  const oz = kmTekstDoKomorki(row.zagrozenie_opis);
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
            <p style={s.muted}>Brak kamieni milowych — uzupełnij formularz poniżej.</p>
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
                  const orphan = cur !== "" && !KM_TYP_ODNIESIENIA_W_BAZIE.includes(cur);
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
              Status kamienia milowego
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
                  const orphan = cur !== "" && !KM_STATUS_W_BAZIE.includes(cur);
                  return (
                    <>
                      {orphan ? (
                        <option value={cur}>
                          {cur} (nie ma na liście — wybierz status z listy poniżej i zapisz)
                        </option>
                      ) : null}
                      {KM_STATUS_W_BAZIE.map((st) => (
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
              {widokPulpitDlaKr != null && String(widokPulpitDlaKr) === String(widokPwDlaKr)
                ? "← Pulpit"
                : "← Lista KR"}
            </button>
          </div>
          <h2 id="pw-kr-naglowek" style={{ ...s.krTopTitle, fontSize: "0.98rem" }}>
            Zlecenia PW — KR {widokPwDlaKr}
          </h2>
          <p style={{ ...s.muted, fontSize: "0.82rem", marginBottom: "0.65rem" }}>
            Tabela <code style={s.code}>kr_zlecenie_podwykonawcy</code>: podwykonawca z bazy (
            zakładka <strong style={{ color: "#d4d4d4" }}>PW</strong>) + szczegóły zlecenia przy tym KR.{" "}
            <strong style={{ color: "#e5e5e5" }}>Weryfikacja</strong> — kto u Was pilnuje sprawdzenia / rozliczenia z
            PW (<code style={s.code}>pracownik.nr</code>).{" "}
            <strong style={{ color: "#e5e5e5" }}>Kontakt fakturowy</strong> — po stronie firmy PW. Pełny podgląd
            read-only — przycisk <strong style={{ color: "#e5e5e5" }}>INFO</strong> na pulpicie projektu.{" "}
            <strong style={{ color: "#fca5a5" }}>Czerwień</strong> — <strong>termin zlecenia (planowany)</strong> minął,
            a <strong style={{ color: "#e5e5e5" }}>odebrane</strong> nie jest zaznaczone (jak na pulpicie).
          </p>
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
              {widokPulpitDlaKr != null && String(widokPulpitDlaKr) === String(widokLogDlaKr)
                ? "← Pulpit"
                : "← Lista KR"}
            </button>
          </div>
          <h2 id="log-naglowek" style={{ ...s.krTopTitle, fontSize: "0.98rem" }}>
            LOG (dziennik zdarzeń) — KR {widokLogDlaKr}
          </h2>
          <p style={{ ...s.muted, marginBottom: "0.75rem", fontSize: "0.82rem" }}>
            Wpisy w tabeli <code style={s.code}>dziennik_zdarzen</code> dla tego projektu.{" "}
            <strong style={{ color: "#e5e5e5" }}>Osoba zgłaszająca</strong> — z bazy{" "}
            <code style={s.code}>pracownik</code>.{" "}
            <strong style={{ color: "#e5e5e5" }}>Wymagane działanie</strong> — opis zadania.{" "}
            <strong style={{ color: "#e5e5e5" }}>Odpowiedzialny</strong> — osoba z bazy ID, której
            zadanie jest adresowane i która odpowiada za wykonanie.{" "}
            <strong style={{ color: "#a7f3d0" }}>Status zdarzenia</strong>: w trakcie, ukończone,
            oczekuje. <em>Data zdarzenia</em> — tylko dzień; puste przy zapisie = dzisiaj.{" "}
            <strong style={{ color: "#fca5a5" }}>Czerwień</strong> — przy statusie innym niż
            „ukończone”: brak <strong style={{ color: "#e5e5e5" }}>wymaganego działania</strong> lub brak{" "}
            <strong style={{ color: "#e5e5e5" }}>osoby odpowiedzialnej</strong>.
          </p>

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
      !wybranyKrKlucz ? (
        <section style={s.krTopWrap} aria-labelledby="pulpit-naglowek">
          <div style={{ marginBottom: "0.65rem" }}>
            <button type="button" style={s.btnGhost} onClick={powrotZPulpituDoListy}>
              ← Lista KR
            </button>
          </div>
          <h2 id="pulpit-naglowek" style={{ ...s.krTopTitle, fontSize: "0.9rem" }}>
            Pulpit projektu — KR {widokPulpitDlaKr}
          </h2>
          <p style={{ ...s.muted, marginBottom: "0.5rem", fontSize: "0.74rem", lineHeight: 1.45 }}>
            Oś czasu: <strong>najpierw data</strong>, potem ikonka (
            <strong style={{ color: "#f87171" }}>KM</strong>,{" "}
            <strong style={{ color: "#fbbf24" }}>PW</strong>,{" "}
            <strong style={{ color: "#38bdf8" }}>LOG</strong>, zielony — start), potem skrót.{" "}
            <strong style={{ color: "#4ade80" }}>Zielona linia</strong> — dziś. Poniżej: dane projektu i skrót kontaktów; edycja całego KR — przyciski pod nagłówkiem, pojedynczej pozycji — przycisk „Edytuj” przy wierszu osi.
          </p>
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
            <>
              {(() => {
                const r = rekordKrPulpit;
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
                const okresWar =
                  okA || okB ? `${okA || "—"} → ${okB || "—"}` : null;
                const krKartaUwaga = pulpitKrRekordWymagaUwagi(r);
                return (
                  <div
                    style={{
                      marginBottom: "0.55rem",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "8px",
                      border: krKartaUwaga ? "1px solid rgba(248,113,113,0.45)" : "1px solid #2a2a2a",
                      borderLeft: krKartaUwaga ? "4px solid #f87171" : undefined,
                      background: krKartaUwaga ? "rgba(248,113,113,0.08)" : "#121212",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.65rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: krKartaUwaga ? "#fca5a5" : "#737373",
                        marginBottom: "0.35rem",
                      }}
                    >
                      Dane projektu
                      {krKartaUwaga ? (
                        <span style={{ marginLeft: "0.5rem", color: "#f87171", fontWeight: 700 }}>
                          — uwaga: status KR
                        </span>
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
              })()}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.35rem",
                  marginBottom: "0.65rem",
                }}
              >
                <button
                  type="button"
                  style={{ ...s.btnGhost, padding: "0.32rem 0.65rem", fontSize: "0.78rem" }}
                  onClick={() => otworzKmDlaKr(rekordKrPulpit)}
                >
                  KM
                </button>
                <button
                  type="button"
                  style={{ ...s.btnGhost, padding: "0.32rem 0.65rem", fontSize: "0.78rem" }}
                  onClick={() => otworzPwDlaKr(rekordKrPulpit)}
                >
                  PW
                </button>
                <button
                  type="button"
                  style={{ ...s.btnGhost, padding: "0.32rem 0.65rem", fontSize: "0.78rem" }}
                  onClick={() => otworzLogDlaKr(rekordKrPulpit)}
                >
                  LOG
                </button>
                <button
                  type="button"
                  style={{ ...s.btnGhost, padding: "0.32rem 0.65rem", fontSize: "0.78rem" }}
                  onClick={() => otworzEdycjeKrZTabeli(rekordKrPulpit)}
                >
                  Edytuj KR
                </button>
                <button
                  type="button"
                  style={{ ...s.btnGhost, padding: "0.32rem 0.65rem", fontSize: "0.78rem" }}
                  onClick={() => otworzInfoDlaKr(rekordKrPulpit)}
                >
                  INFO
                </button>
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
                    {n === 1 ? "pozycja" : "pozycje"} na osi. Reguły: zagrożenie lub przeterminowany plan KM (etap nie
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
                  Brak pozycji na osi — dodaj wpisy KM, PW lub LOG dla tego projektu.
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
          <p style={{ ...s.muted, marginBottom: "1rem", fontSize: "0.82rem" }}>
            Podgląd tylko do odczytu: <code style={s.code}>kr</code>, zlecenia{" "}
            <strong style={{ color: "#e5e5e5" }}>PW</strong>,{" "}
            <code style={s.code}>kamienie_milowe</code>,{" "}
            <code style={s.code}>dziennik_zdarzen</code>. Edycja — przyciski{" "}
            <strong style={{ color: "#e5e5e5" }}>KM</strong>, <strong style={{ color: "#e5e5e5" }}>PW</strong>,{" "}
            <strong style={{ color: "#e5e5e5" }}>LOG</strong>, <strong style={{ color: "#e5e5e5" }}>Edytuj KR</strong> na pulpicie
            projektu.
          </p>
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
                    Kamienie milowe
                  </h3>
                  {listaKmDlaInfo.length === 0 ? (
                    <p style={s.muted}>Brak wierszy w tabeli kamienie milowe dla tego KR.</p>
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

      {widok === "kr" && wybranyKrKlucz ? (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <button type="button" style={s.btnGhost} onClick={powrotDoListyKr}>
              {widokPulpitDlaKr != null && String(widokPulpitDlaKr) === String(wybranyKrKlucz)
                ? "← Pulpit"
                : "← Lista KR"}
            </button>
          </div>
          {!wybranyRekordKr ? (
            <div style={s.errBox} role="alert">
              Nie znaleziono projektu o kodzie{" "}
              <strong style={{ color: "#fff" }}>{wybranyKrKlucz}</strong> w aktualnej liście.
              <div style={{ marginTop: "0.75rem" }}>
                <button type="button" style={s.btnGhost} onClick={powrotDoListyKr}>
                  {widokPulpitDlaKr != null && String(widokPulpitDlaKr) === String(wybranyKrKlucz)
                    ? "Wróć do pulpitu"
                    : "Wróć do listy"}
                </button>
              </div>
            </div>
          ) : (
            (() => {
              const item = wybranyRekordKr;
              const listaEtapow = etapyWedlugKr.get(item.kr) ?? [];
              const isEditing = editingKrKey === item.kr;
              return (
                <section
                  id={`kr-card-${item.kr}`}
                  style={s.krBlock}
                  aria-label={`KR ${item.kr}`}
                >
                  <header style={s.krHead}>
                    <span>
                      <strong>{item.kr}</strong>
                      {!isEditing && item.nazwa_obiektu ? ` — ${item.nazwa_obiektu}` : ""}
                      {!isEditing && item.rodzaj_pracy?.trim() ? (
                        <span style={s.muted}> · {item.rodzaj_pracy.trim()}</span>
                      ) : null}
                      {!isEditing && item.dzial ? (
                        <span style={s.dzialWartosc}> · dział: {item.dzial}</span>
                      ) : null}
                      {!isEditing && item.status ? (
                        <span
                          style={{
                            ...s.statusKr,
                            ...stylEtykietyUwagiPulpitu(pulpitKrRekordWymagaUwagi(item)),
                          }}
                        >
                          {" "}
                          · {item.status}
                        </span>
                      ) : null}
                      {!isEditing &&
                      podpisOsobyProwadzacej(item.osoba_prowadzaca, mapaProwadzacychId) ? (
                        <span style={s.muted}>
                          {" "}
                          · prowadzący:{" "}
                          <strong style={{ color: "#e5e5e5" }}>
                            {podpisOsobyProwadzacej(item.osoba_prowadzaca, mapaProwadzacychId)}
                          </strong>
                        </span>
                      ) : null}
                      {!isEditing ? (
                        <span style={s.muted}>
                          {" "}
                          · start: {etykietaDatyStartu(item.data_rozpoczecia)}
                        </span>
                      ) : null}
                    </span>
                    {!isEditing ? (
                      <button type="button" style={s.btnGhost} onClick={() => openEditKr(item)}>
                        Edytuj KR
                      </button>
                    ) : null}
                  </header>
                  <div style={s.krBody}>
                    {!isEditing &&
                    (item.zleceniodawca?.trim() ||
                      item.osoba_odpowiedzialna_zleceniodawcy?.trim() ||
                      item.link_umowy?.trim() ||
                      item.okres_projektu_od ||
                      item.okres_projektu_do) ? (
                      <div
                        style={{
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
                          <div style={{ marginBottom: "0.35rem" }}>
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
                        {item.okres_projektu_od || item.okres_projektu_do ? (
                          <div>
                            <span style={s.muted}>Okres trwania: </span>
                            {item.okres_projektu_od
                              ? dataDoInputa(item.okres_projektu_od)
                              : "—"}{" "}
                            —{" "}
                            {item.okres_projektu_do
                              ? dataDoInputa(item.okres_projektu_do)
                              : "—"}
                          </div>
                        ) : null}
                      </div>
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

                    {isEditing ? <hr style={s.divider} /> : null}

                    <h2 style={{ ...s.h2, marginTop: isEditing ? "0.5rem" : 0 }}>Etapy projektu</h2>

                    {listaEtapow.length === 0 ? (
                      <p style={s.muted}>Brak etapów</p>
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
      !widokPulpitDlaKr &&
      krList.length > 0 ? (
        <section style={s.krTopWrap} aria-labelledby="kr-introduced-heading">
          <h2 id="kr-introduced-heading" style={s.krTopTitle}>
            Wprowadzone KR ({krList.length})
          </h2>
          <p style={{ ...s.muted, marginTop: 0, marginBottom: "0.65rem", fontSize: "0.88rem" }}>
            Kliknij nagłówek <strong style={{ color: "#7dd3fc" }}>Dział</strong> lub{" "}
            <strong style={{ color: "#a7f3d0" }}>Status</strong>, by zmienić kolejność (drugi klik — odwrotnie). Bez
            sortowania — jak w bazie (numer KR).             Przy projekcie użyj <strong style={{ color: "#fda4af" }}>Pulpit</strong>
            — tam dane KR, oś czasu (KM / PW / LOG) i przyciski edycji.{" "}
            <strong style={{ color: "#f87171" }}>Różowe tło</strong> wiersza — status „oczekuje na zamawiającego” lub
            kamień milowy z ryzykiem / przeterminowanym planem (reszta uwag tylko na pulpicie). Nowy rekord — poniżej
            tabeli.
          </p>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>KR</th>
                  <th style={s.th}>Nazwa obiektu</th>
                  <th style={s.th}>Rodzaj pracy</th>
                  <th style={{ ...s.th, color: "#7dd3fc" }}>
                    <button
                      type="button"
                      style={s.thBtn}
                      onClick={() => przestawSortKr("dzial")}
                      aria-label="Sortuj po dziale"
                    >
                      Dział
                      {krListaSort.key === "dzial"
                        ? krListaSort.dir === "asc"
                          ? " ▲"
                          : " ▼"
                        : ""}
                    </button>
                  </th>
                  <th style={{ ...s.th, color: "#a7f3d0" }}>
                    <button
                      type="button"
                      style={s.thBtn}
                      onClick={() => przestawSortKr("status")}
                      aria-label="Sortuj po statusie"
                    >
                      Status
                      {krListaSort.key === "status"
                        ? krListaSort.dir === "asc"
                          ? " ▲"
                          : " ▼"
                        : ""}
                    </button>
                  </th>
                  <th style={s.th} />
                </tr>
              </thead>
              <tbody>
                {krListPosortowana.map((item) => {
                  const wierszUwaga = kodyKrZWyroznieniemUwagi.has(String(item.kr).trim());
                  return (
                  <tr
                    key={item.kr}
                    style={
                      wierszUwaga
                        ? { background: "rgba(248,113,113,0.07)" }
                        : undefined
                    }
                  >
                    <td style={s.td}>
                      <strong style={{ color: wierszUwaga ? "#fecaca" : "#fff" }}>{item.kr}</strong>
                      {wierszUwaga ? (
                        <span
                          title="Status KR lub kamień milowy wymaga uwagi — szczegóły na pulpicie"
                          style={{
                            marginLeft: "0.35rem",
                            color: "#f87171",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          !
                        </span>
                      ) : null}
                    </td>
                    <td style={s.td}>{item.nazwa_obiektu?.trim() ? item.nazwa_obiektu : "—"}</td>
                    <td style={s.td}>{item.rodzaj_pracy?.trim() ? item.rodzaj_pracy : "—"}</td>
                    <td style={{ ...s.td, ...s.dzialWartosc }}>
                      {item.dzial?.trim() ? item.dzial : "—"}
                    </td>
                    <td style={{ ...s.td, ...s.statusKr }}>
                      {item.status?.trim() ? item.status : "—"}
                    </td>
                    <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        style={{
                          ...s.btnGhost,
                          padding: "0.4rem 0.85rem",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "#fecdd3",
                          borderColor: "rgba(253,164,175,0.55)",
                        }}
                        onClick={() => otworzPulpitDlaKr(item)}
                      >
                        Pulpit
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
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
    </div>
  );
}
