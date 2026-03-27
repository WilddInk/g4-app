import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase.js";

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
  h1: {
    fontSize: "1.65rem",
    marginTop: 0,
    fontWeight: 600,
    color: "#ffffff",
    letterSpacing: "-0.03em",
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
  input: {
    padding: "0.55rem 0.65rem",
    border: "1px solid #3d3d3d",
    borderRadius: "8px",
    font: "inherit",
    boxSizing: "border-box",
    width: "100%",
    background: "#141414",
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

function kmPustyForm() {
  return {
    data_planowana: "",
    etap: "",
    status: "",
    data_realna: "",
    osoba_odpowiedzialna: "",
    uwagi: "",
    osiagniete: "",
    zagrozenie: "",
    zagrozenie_opis: "",
  };
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
    data_planowana: dataDoInputa(row.data_planowana),
    etap: row.etap != null ? String(row.etap) : "",
    status: row.status != null ? String(row.status) : "",
    data_realna: dataDoInputa(row.data_realna),
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
  const [dziennikWpisy, setDziennikWpisy] = useState([]);
  const [dziennikFetchError, setDziennikFetchError] = useState(null);
  const [logForm, setLogForm] = useState(() => logPustyForm());
  const [kmEdycjaId, setKmEdycjaId] = useState(null);
  const [kmForm, setKmForm] = useState(() => kmPustyForm());

  const [zadaniaList, setZadaniaList] = useState([]);
  const [zadaniaFetchError, setZadaniaFetchError] = useState(null);
  const [zadanieEdycjaId, setZadanieEdycjaId] = useState(null);
  const [zadanieForm, setZadanieForm] = useState(() => zadaniePustyForm());

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
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
    setWidok("kr");
    void fetchKR();
    void fetchEtapy();
  }

  function przejdzDoPracownikow() {
    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
    setWidok("pracownik");
    void fetchPracownicy();
  }

  function przejdzDoZadania() {
    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
    setZadanieEdycjaId(null);
    setZadanieForm(zadaniePustyForm());
    setWidok("zadania");
    void fetchZadania();
    void fetchPracownicy();
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

  useEffect(() => {
    void (async () => {
      await fetchKR();
      await fetchEtapy();
      void fetchPracownicy();
      void fetchZadania();
      setInitialFetchDone(true);
    })();
  }, []);

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

  function openEditKr(item) {
    setEditingKrKey(item.kr);
    void fetchPracownicy();
    setEditForm({
      kr: item.kr != null && item.kr !== "" ? String(item.kr) : "",
      nazwa_obiektu: item.nazwa_obiektu ?? "",
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
    setDziennikWpisy([]);
    setDziennikFetchError(null);
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
    setDziennikWpisy([]);
    setDziennikFetchError(null);
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

  function otworzLogDlaKr(item) {
    const k = String(item.kr).trim();
    setWidokLogDlaKr(k);
    setWidokKmDlaKr(null);
    setWidokInfoDlaKr(null);
    setWybranyKrKlucz(null);
    setEditingKrKey(null);
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setLogForm(logPustyForm());
    setDziennikFetchError(null);
    void fetchPracownicy();
    void fetchDziennikForKr(k);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function powrotZLogDoListy() {
    setWidokLogDlaKr(null);
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogForm(logPustyForm());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function otworzInfoDlaKr(item) {
    const k = String(item.kr).trim();
    setWidokInfoDlaKr(k);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWybranyKrKlucz(null);
    setEditingKrKey(null);
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
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
    setDziennikWpisy([]);
    setDziennikFetchError(null);
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

    const payload = {
      kr: widokLogDlaKr,
      typ_zdarzenia: typ,
      opis: String(logForm.opis ?? "").trim() || null,
      data_zdarzenia: dataZdarzenia,
      osoba_zglaszajaca: String(logForm.osoba_zglaszajaca ?? "").trim() || null,
      wymagane_dzialanie: String(logForm.wymagane_dzialanie ?? "").trim() || null,
      osoba_odpowiedzialna_za_zadanie:
        String(logForm.osoba_odpowiedzialna_za_zadanie ?? "").trim() || null,
      status_zdarzenia: statusDoBazy,
    };

    const { error } = await supabase.from("dziennik_zdarzen").insert([payload]).select("id");

    if (error) {
      console.error(error);
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
          "\n\nSprawdź też polityki SELECT/INSERT dla dziennik_zdarzen w rls-policies-anon.sql."
      );
      return;
    }

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

    const payload = {
      kr: widokKmDlaKr,
      data_planowana: String(kmForm.data_planowana ?? "").trim() || null,
      etap: etapTrim,
      status: statusDoBazy,
      data_realna: String(kmForm.data_realna ?? "").trim() || null,
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
              ? "\n\nUruchom w SQL Editor plik g4-app/supabase/kamienie-milowe-kolumny.sql (brakujące kolumny)."
              : "") +
            (String(error.message).toLowerCase().includes("check") ||
            String(error.message).toLowerCase().includes("constraint")
              ? "\n\nStatus musi być z listy w aplikacji lub NULL — zob. kamienie-milowe-status-check.sql."
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
              ? "\n\nUruchom w SQL Editor plik g4-app/supabase/kamienie-milowe-kolumny.sql."
              : "") +
            (String(error.message).toLowerCase().includes("check") ||
            String(error.message).toLowerCase().includes("constraint")
              ? "\n\nZob. kamienie-milowe-status-check.sql (CHECK na status)."
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
      alert("Usuwanie: " + error.message + "\n\nSprawdź politykę DELETE w rls-policies-anon.sql.");
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

  function powrotDoListyKr() {
    setWybranyKrKlucz(null);
    setWidokKmDlaKr(null);
    setWidokLogDlaKr(null);
    setWidokInfoDlaKr(null);
    setDziennikWpisy([]);
    setDziennikFetchError(null);
    setLogForm(logPustyForm());
    setKmEdycjaId(null);
    setKmForm(kmPustyForm());
    setEditingKrKey(null);
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
        "kr, dzial, nazwa_obiektu, osoba_prowadzaca, data_rozpoczecia, status, zleceniodawca, osoba_odpowiedzialna_zleceniodawcy, link_umowy, okres_projektu_od, okres_projektu_do"
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
    }
    setEditingKrKey(null);
    await fetchKR();
    await fetchEtapy();
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

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Dane z bazy</h1>

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
        </span>
      </nav>
      <p style={{ ...s.muted, marginTop: "-0.35rem", marginBottom: "1rem", fontSize: "0.82rem" }}>
        {widok === "kr" ? (
          <>
            Widok: <strong style={{ color: "#d4d4d4" }}>tabela kr + kamienie milowe</strong>
          </>
        ) : widok === "zadania" ? (
          <>
            Widok:{" "}
            <strong style={{ color: "#d4d4d4" }}>
              tabela zadania (sprzęt, organizacja — bez powiązania z KR)
            </strong>
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

      {widok === "kr" && widokKmDlaKr ? (
        <section style={s.krTopWrap} aria-labelledby="km-naglowek">
          <div style={{ marginBottom: "1rem" }}>
            <button type="button" style={s.btnGhost} onClick={powrotZKmDoListy}>
              ← Lista KR
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
            planowane, w trakcie, zrealizowane itd.).
          </p>

          <div style={s.tableWrap}>
            <table style={s.kmTable}>
              <colgroup>
                <col style={{ width: "9%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "6.5%" }} />
                <col style={{ width: "6.5%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "7%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={s.kmTh}>Etap</th>
                  <th style={s.kmTh}>Status</th>
                  <th style={s.kmTh}>Plan</th>
                  <th style={s.kmTh}>Real</th>
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
                      <td style={{ ...s.kmTd, ...s.statusKr, fontSize: "0.68rem" }}>
                        {row.status ?? "—"}
                      </td>
                      <td style={s.kmTd}>
                        {row.data_planowana ? dataDoInputa(row.data_planowana) : "—"}
                      </td>
                      <td style={s.kmTd}>{row.data_realna ? dataDoInputa(row.data_realna) : "—"}</td>
                      <td style={s.kmTd}>
                        {podpisOsobyProwadzacej(row.osoba_odpowiedzialna, mapaProwadzacychId) ?? "—"}
                      </td>
                      <td style={s.kmTd}>
                        {row.osiagniete === true ? "tak" : row.osiagniete === false ? "nie" : "—"}
                      </td>
                      <td style={s.kmTd}>
                        {row.zagrozenie === true ? "tak" : row.zagrozenie === false ? "nie" : "—"}
                      </td>
                      <td style={s.kmTd} title={uw.title || undefined}>
                        {uw.text}
                      </td>
                      <td style={s.kmTd} title={oz.title || undefined}>
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
              Data planowania
              <input
                style={s.input}
                type="date"
                value={kmForm.data_planowana}
                onChange={(ev) => setKmForm((f) => ({ ...f, data_planowana: ev.target.value }))}
              />
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
                style={{ ...s.input, ...s.statusKr }}
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
              Data realizacji (realna)
              <input
                style={s.input}
                type="date"
                value={kmForm.data_realna}
                onChange={(ev) => setKmForm((f) => ({ ...f, data_realna: ev.target.value }))}
              />
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
                style={s.input}
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
                style={{ ...s.input, minHeight: "3.5rem", resize: "vertical" }}
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

      {widok === "kr" && widokLogDlaKr ? (
        <section style={s.krTopWrap} aria-labelledby="log-naglowek">
          <div style={{ marginBottom: "1rem" }}>
            <button type="button" style={s.btnGhost} onClick={powrotZLogDoListy}>
              ← Lista KR
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
            oczekuje. <em>Data zdarzenia</em> — tylko dzień; puste przy zapisie = dzisiaj.
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
                    <td style={s.td}>{row.wymagane_dzialanie?.trim() ? row.wymagane_dzialanie : "—"}</td>
                    <td style={s.td}>
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
            Nowe zdarzenie
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
                style={{ ...s.input, minHeight: "3rem", resize: "vertical" }}
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
                style={s.input}
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
                Dodaj wpis
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {widok === "kr" && widokInfoDlaKr ? (
        <section style={s.krTopWrap} aria-labelledby="info-naglowek">
          <div style={{ marginBottom: "1rem" }}>
            <button type="button" style={s.btnGhost} onClick={powrotZInfoDoListy}>
              ← Lista KR
            </button>
          </div>
          <h2 id="info-naglowek" style={{ ...s.krTopTitle, fontSize: "0.98rem" }}>
            INFO — KR {widokInfoDlaKr}
          </h2>
          <p style={{ ...s.muted, marginBottom: "1rem", fontSize: "0.82rem" }}>
            Podgląd tylko do odczytu: <code style={s.code}>kr</code>,{" "}
            <code style={s.code}>kamienie_milowe</code> i{" "}
            <code style={s.code}>dziennik_zdarzen</code>. Aby zmieniać dane, użyj na liście przycisków{" "}
            <strong style={{ color: "#e5e5e5" }}>KR</strong>, <strong style={{ color: "#e5e5e5" }}>KM</strong>{" "}
            lub <strong style={{ color: "#e5e5e5" }}>LOG</strong>.
          </p>
          {!rekordKrInfo ? (
            <div style={s.errBox} role="alert">
              Brak projektu <strong style={{ color: "#fff" }}>{widokInfoDlaKr}</strong> na aktualnej
              liście — odśwież stronę lub wróć do listy.
              <div style={{ marginTop: "0.75rem" }}>
                <button type="button" style={s.btnGhost} onClick={powrotZInfoDoListy}>
                  Wróć do listy
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
                    Kamienie milowe
                  </h3>
                  {listaKmDlaInfo.length === 0 ? (
                    <p style={s.muted}>Brak wierszy w tabeli kamienie milowe dla tego KR.</p>
                  ) : (
                    <div style={s.tableWrap}>
                      <table style={s.kmTable}>
                        <colgroup>
                          <col style={{ width: "10%" }} />
                          <col style={{ width: "9%" }} />
                          <col style={{ width: "8%" }} />
                          <col style={{ width: "8%" }} />
                          <col style={{ width: "12%" }} />
                          <col style={{ width: "7%" }} />
                          <col style={{ width: "7%" }} />
                          <col style={{ width: "19%" }} />
                          <col style={{ width: "20%" }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th style={s.kmTh}>Etap</th>
                            <th style={s.kmTh}>Status</th>
                            <th style={s.kmTh}>Plan</th>
                            <th style={s.kmTh}>Real</th>
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
                                <td style={{ ...s.kmTd, ...s.statusKr, fontSize: "0.68rem" }}>
                                  {row.status ?? "—"}
                                </td>
                                <td style={s.kmTd}>
                                  {row.data_planowana ? dataDoInputa(row.data_planowana) : "—"}
                                </td>
                                <td style={s.kmTd}>
                                  {row.data_realna ? dataDoInputa(row.data_realna) : "—"}
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
                                <td style={s.kmTd}>
                                  {row.zagrozenie === true
                                    ? "tak"
                                    : row.zagrozenie === false
                                      ? "nie"
                                      : "—"}
                                </td>
                                <td style={s.kmTd} title={uw.title || undefined}>
                                  {uw.text}
                                </td>
                                <td style={s.kmTd} title={oz.title || undefined}>
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
                              <td style={s.td}>
                                {row.wymagane_dzialanie?.trim() ? row.wymagane_dzialanie : "—"}
                              </td>
                              <td style={s.td}>
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
              ← Lista KR
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
                      {!isEditing && item.dzial ? (
                        <span style={s.dzialWartosc}> · dział: {item.dzial}</span>
                      ) : null}
                      {!isEditing && item.status ? (
                        <span style={s.statusKr}> · {item.status}</span>
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
                            style={s.input}
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

                    <h2 style={{ ...s.h2, marginTop: 0 }}>Etapy projektu</h2>

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
                            {et.data_planowana ? (
                              <span style={s.muted}> · plan: {et.data_planowana}</span>
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

      {widok === "kr" && !wybranyKrKlucz && !widokKmDlaKr && !widokLogDlaKr && !widokInfoDlaKr &&
      krList.length > 0 ? (
        <section style={s.krTopWrap} aria-labelledby="kr-introduced-heading">
          <h2 id="kr-introduced-heading" style={s.krTopTitle}>
            Wprowadzone KR ({krList.length})
          </h2>
          <p style={{ ...s.muted, marginTop: 0, marginBottom: "0.65rem", fontSize: "0.88rem" }}>
            Kliknij nagłówek <strong style={{ color: "#7dd3fc" }}>Dział</strong> lub{" "}
            <strong style={{ color: "#a7f3d0" }}>Status</strong>, by zmienić kolejność (drugi klik —
            odwrotnie). Bez sortowania — jak w bazie (numer KR).{" "}
            <strong style={{ color: "#e5e5e5" }}>KM</strong> — kamienie milowe (tabela{" "}
            <code style={s.code}>kamienie_milowe</code>).{" "}
            <strong style={{ color: "#e5e5e5" }}>LOG</strong> — dziennik zdarzeń (
            <code style={s.code}>dziennik_zdarzen</code>).{" "}
            <strong style={{ color: "#e5e5e5" }}>INFO</strong> — podgląd KR + KM + LOG bez edycji.{" "}
            <strong style={{ color: "#e5e5e5" }}>KR</strong> — edycja{" "}
            <code style={s.code}>kr</code> i podgląd etapów w karcie. Nowy rekord dodasz formularzem
            poniżej tabeli.
          </p>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>KR</th>
                  <th style={s.th}>Nazwa obiektu</th>
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
                {krListPosortowana.map((item) => (
                  <tr key={item.kr}>
                    <td style={s.td}>
                      <strong style={{ color: "#fff" }}>{item.kr}</strong>
                    </td>
                    <td style={s.td}>{item.nazwa_obiektu?.trim() ? item.nazwa_obiektu : "—"}</td>
                    <td style={{ ...s.td, ...s.dzialWartosc }}>
                      {item.dzial?.trim() ? item.dzial : "—"}
                    </td>
                    <td style={{ ...s.td, ...s.statusKr }}>
                      {item.status?.trim() ? item.status : "—"}
                    </td>
                    <td style={{ ...s.td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          style={{
                            ...s.btnGhost,
                            padding: "0.35rem 0.7rem",
                            fontSize: "0.8rem",
                          }}
                          onClick={() => otworzInfoDlaKr(item)}
                        >
                          INFO
                        </button>
                        <button
                          type="button"
                          style={{
                            ...s.btnGhost,
                            padding: "0.35rem 0.7rem",
                            fontSize: "0.8rem",
                          }}
                          onClick={() => otworzKmDlaKr(item)}
                        >
                          KM
                        </button>
                        <button
                          type="button"
                          style={{
                            ...s.btnGhost,
                            padding: "0.35rem 0.7rem",
                            fontSize: "0.8rem",
                          }}
                          onClick={() => otworzLogDlaKr(item)}
                        >
                          LOG
                        </button>
                        <button
                          type="button"
                          style={{
                            ...s.btnGhost,
                            padding: "0.35rem 0.7rem",
                            fontSize: "0.8rem",
                          }}
                          onClick={() => otworzEdycjeKrZTabeli(item)}
                        >
                          KR
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : widok === "kr" && !wybranyKrKlucz && !widokKmDlaKr && !widokLogDlaKr && !widokInfoDlaKr &&
      !krFetchError ? (
        <p style={{ ...s.muted, marginTop: "-0.5rem", marginBottom: "1.5rem" }}>
          {initialFetchDone
            ? "Brak wprowadzonych KR — dodaj pierwszy rekord formularzem poniżej."
            : "Ładowanie listy KR…"}
        </p>
      ) : null}

      {widok === "kr" && !wybranyKrKlucz && !widokKmDlaKr && !widokLogDlaKr && !widokInfoDlaKr ? (
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
