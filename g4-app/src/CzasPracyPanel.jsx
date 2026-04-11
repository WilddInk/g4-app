import { useCallback, useEffect, useMemo, useState } from "react";
import { theme } from "./operationalShell.jsx";
import {
  czyDzienRoboczyPl,
  infoDniaKalendarzaPl,
  liczDniRoboczeWMiesiacu,
  normaGodzinMiesiaca,
} from "./lib/swietoPl.js";

/** Typy wpisów — rozszerzalne bez migracji (CHECK w bazie jest luźny). */
export const CZAS_TYP_WPISU = [
  { value: "praca_stacjonarna", label: "Praca stacjonarna", grupa: "praca" },
  { value: "praca_zdalna", label: "Praca zdalna", grupa: "praca" },
  { value: "delegacja", label: "Delegacja", grupa: "praca" },
  { value: "szkolenie", label: "Szkolenie", grupa: "praca" },
  { value: "urlop", label: "Urlop", grupa: "nieobecnosc" },
  { value: "urlop_na_zadanie", label: "Urlop na żądanie", grupa: "nieobecnosc" },
  { value: "zwolnienie_lekarskie", label: "Zwolnienie lekarskie", grupa: "nieobecnosc" },
  { value: "opieka_nad_dzieckiem", label: "Opieka nad dzieckiem", grupa: "nieobecnosc" },
  { value: "inne", label: "Inne (uwagi w polu)", grupa: "inne" },
];

function grupaTypu(typ) {
  const row = CZAS_TYP_WPISU.find((t) => t.value === typ);
  return row?.grupa ?? "inne";
}

function czyTypLiczyGodzinyPracy(typ) {
  return grupaTypu(typ) === "praca";
}

function dataIsoZDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDataIso(s) {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function stawkaDlaDaty(stawki, dataIso) {
  const pas = (stawki ?? [])
    .filter((r) => dataIso >= r.data_od && dataIso <= r.data_do)
    .sort((a, b) => String(b.data_od).localeCompare(String(a.data_od)));
  return pas[0] ?? null;
}

function formatPln(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return (
    new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " zł"
  );
}

/**
 * @param {object} props
 * @param {import("@supabase/supabase-js").SupabaseClient} props.supabase
 * @param {Array} props.krList — rekordy z tabeli kr (pole .kr)
 * @param {Array} props.pracownicy
 * @param {object | null} props.pracownikSesja — zalogowany użytkownik (konto)
 * @param {object | null} props.pracownikWidokEfektywny — kto jest „widziany” (w tym podgląd admina)
 * @param {boolean} props.wymagaKonta — VITE_REQUIRE_AUTH
 */
const NORMA_H_NA_DZIEN_ROBOCZY = 8;

/** Siatka minut w polach Od/Do (np. 00, 15, 30, 45). */
const KROK_MINUT_CZAS_PRACY = 15;
/** Dla `input type="time"` — krok w sekundach (15 min = 900 s). */
const TIME_INPUT_STEP_SEKUND = KROK_MINUT_CZAS_PRACY * 60;

function minutyZZaokragleniemDoKroku(minutyOdPolnocy) {
  const k = KROK_MINUT_CZAS_PRACY;
  if (!Number.isFinite(minutyOdPolnocy)) return 0;
  let m = Math.round(minutyOdPolnocy / k) * k;
  if (m >= 24 * 60) m = 24 * 60 - k;
  return Math.max(0, m);
}

function minutyZCzasuHHMM(s) {
  const m = String(s ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return NaN;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return NaN;
  return h * 60 + min;
}

/** Zwraca długość w godzinach; jeśli „do” < „od”, traktujemy jako przejście przez północ. */
function obliczGodzinyZZakresu(od, dol) {
  const t1 = minutyZCzasuHHMM(od);
  let t2 = minutyZCzasuHHMM(dol);
  if (!Number.isFinite(t1) || !Number.isFinite(t2)) return NaN;
  let diffMin = t2 - t1;
  if (diffMin < 0) diffMin += 24 * 60;
  return Math.round((diffMin / 60) * 10000) / 10000;
}

function normalizeTimeInput(t) {
  const m = String(t ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return "";
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  const total = minutyZZaokragleniemDoKroku(h * 60 + min);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function dodajGodzinyDoCzasu(czasHHMM, godziny) {
  const base = minutyZCzasuHHMM(czasHHMM);
  if (!Number.isFinite(base)) return "08:00";
  const g = Number(godziny);
  if (!Number.isFinite(g) || g <= 0) return czasHHMM;
  const raw = ((base + Math.round(g * 60)) % (24 * 60) + 24 * 60) % (24 * 60);
  const total = minutyZZaokragleniemDoKroku(raw);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Odczyt zakresu zapisu z pola uwagi: „HH:MM–HH:MM” lub „HH:MM–HH:MM · reszta”. */
function parsujZakresCzasuZUwag(full) {
  const s = String(full ?? "").trim();
  const m = s.match(/^(\d{1,2}:\d{2})\s*[–\-—]\s*(\d{1,2}:\d{2})(?:\s*·\s*([\s\S]*))?$/);
  if (m) {
    return {
      czasOd: normalizeTimeInput(m[1]),
      czasDo: normalizeTimeInput(m[2]),
      reszta: String(m[3] ?? "").trim(),
    };
  }
  return { czasOd: "", czasDo: "", reszta: s };
}

function zlozUwagiZZakresu(czasOd, czasDo, uwagiDodatkowe) {
  const od = normalizeTimeInput(czasOd);
  const dol = normalizeTimeInput(czasDo);
  const dod = String(uwagiDodatkowe ?? "").trim();
  const rd = `${od}–${dol}`;
  return dod ? `${rd} · ${dod}` : rd;
}

export function CzasPracyPanel({
  supabase,
  krList = [],
  pracownicy = [],
  pracownikSesja,
  pracownikWidokEfektywny,
  wymagaKonta,
}) {
  const rolaSesji = String(pracownikSesja?.app_role ?? "").trim();
  const mozeWybieracPracownika = rolaSesji === "admin" || rolaSesji === "kierownik";
  const mozeZarzadzacStawkami = rolaSesji === "admin";

  const domyslnyNr = String(pracownikWidokEfektywny?.nr ?? "").trim();
  const [wybranyNr, setWybranyNr] = useState(domyslnyNr);

  useEffect(() => {
    setWybranyNr(domyslnyNr);
  }, [domyslnyNr]);

  const [rok, setRok] = useState(() => new Date().getFullYear());
  const [miesiac, setMiesiac] = useState(() => new Date().getMonth());

  const [wpisy, setWpisy] = useState([]);
  const [stawki, setStawki] = useState([]);
  const [fetchErr, setFetchErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const [modal, setModal] = useState(null);
  /** @type {{ id?: string, data: string, kr: string, typ: string, czas_od: string, czas_do: string, uwagi_dodatkowe: string } | null} */
  const [form, setForm] = useState(null);

  const [stForm, setStForm] = useState({ data_od: "", data_do: "", stawka_za_godzine: "", uwagi: "" });
  const [stMsg, setStMsg] = useState(null);

  const pierwszyOstatniDzien = useMemo(() => {
    const pierwszy = new Date(rok, miesiac, 1);
    const ostatni = new Date(rok, miesiac + 1, 0);
    return { pierwszy, ostatni, odIso: dataIsoZDate(pierwszy), doIso: dataIsoZDate(ostatni) };
  }, [rok, miesiac]);

  const kalendarzKomorki = useMemo(() => {
    const { pierwszy, ostatni } = pierwszyOstatniDzien;
    const startDow = (pierwszy.getDay() + 6) % 7;
    const dniWMiesiacu = ostatni.getDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push({ pusty: true, key: `p-${i}` });
    for (let d = 1; d <= dniWMiesiacu; d++) {
      const date = new Date(rok, miesiac, d);
      cells.push({ pusty: false, date, iso: dataIsoZDate(date), key: `d-${d}` });
    }
    while (cells.length % 7 !== 0) cells.push({ pusty: true, key: `t-${cells.length}` });
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [rok, miesiac]);

  const wpisyDlaWybranego = useMemo(() => {
    const nr = String(wybranyNr ?? "").trim();
    if (!nr) return [];
    return wpisy.filter((w) => String(w.pracownik_nr ?? "").trim() === nr);
  }, [wpisy, wybranyNr]);

  const pracownikRekord = useMemo(() => {
    const n = String(wybranyNr ?? "").trim();
    return pracownicy.find((p) => String(p.nr ?? "").trim() === n) ?? null;
  }, [pracownicy, wybranyNr]);

  const formaZatrudnienia = String(pracownikRekord?.forma_zatrudnienia ?? "uop").trim() || "uop";

  const wpisyPoDniu = useMemo(() => {
    const m = new Map();
    for (const w of wpisyDlaWybranego) {
      const ds = String(w.data ?? "").slice(0, 10);
      if (!m.has(ds)) m.set(ds, []);
      m.get(ds).push(w);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => String(a.id ?? "").localeCompare(String(b.id ?? "")));
    }
    return m;
  }, [wpisyDlaWybranego]);

  /** Suma godzin z bloków „praca” (kilka KR dziennie = kilka wierszy). Nadgodziny zapisane w starych wierszach są wliczane w sumę zapisu. */
  const podsumowanie = useMemo(() => {
    let sumaPracy = 0;
    const poKr = {};
    for (const w of wpisyDlaWybranego) {
      if (!czyTypLiczyGodzinyPracy(w.typ)) continue;
      const g = Number(w.godziny) || 0;
      const legacyNd = Number(w.nadgodziny) || 0;
      const razem = g + legacyNd;
      sumaPracy += razem;
      const kr = String(w.kr ?? "").trim();
      if (kr) {
        poKr[kr] = (poKr[kr] || 0) + razem;
      }
    }
    return { sumaPracy, poKr };
  }, [wpisyDlaWybranego]);

  const rozliczenieMiesiac = useMemo(() => {
    const dniRobocze = liczDniRoboczeWMiesiacu(rok, miesiac);
    const norma = normaGodzinMiesiaca(rok, miesiac, NORMA_H_NA_DZIEN_ROBOCZY);
    const suma = podsumowanie.sumaPracy;
    if (formaZatrudnienia === "uz") {
      return {
        dniRobocze,
        norma,
        sumaZalogowanych: suma,
        nadgodzinyRozliczeniowe: suma,
        brakDoNormy: 0,
        tryb: "uz",
      };
    }
    return {
      dniRobocze,
      norma,
      sumaZalogowanych: suma,
      nadgodzinyRozliczeniowe: Math.max(0, suma - norma),
      brakDoNormy: Math.max(0, norma - suma),
      tryb: formaZatrudnienia === "inne" ? "inne" : "uop",
    };
  }, [rok, miesiac, podsumowanie.sumaPracy, formaZatrudnienia]);

  const kwotaSzacunekPoKr = useMemo(() => {
    if (!mozeZarzadzacStawkami) return {};
    const out = {};
    for (const w of wpisyDlaWybranego) {
      if (!czyTypLiczyGodzinyPracy(w.typ)) continue;
      const kr = String(w.kr ?? "").trim();
      if (!kr) continue;
      const ds = String(w.data ?? "").slice(0, 10);
      const st = stawkaDlaDaty(stawki, ds);
      if (!st) continue;
      const h = (Number(w.godziny) || 0) + (Number(w.nadgodziny) || 0); // legacy pole nd w starych wpisach
      const kw = h * Number(st.stawka_za_godzine);
      out[kr] = (out[kr] || 0) + kw;
    }
    return out;
  }, [wpisyDlaWybranego, stawki, mozeZarzadzacStawkami]);

  const load = useCallback(async () => {
    const nr = String(wybranyNr ?? "").trim();
    if (!nr) return;
    setFetchErr(null);
    setBusy(true);
    try {
      const { data: w, error: e1 } = await supabase
        .from("czas_pracy_wpis")
        .select("*")
        .eq("pracownik_nr", nr)
        .gte("data", pierwszyOstatniDzien.odIso)
        .lte("data", pierwszyOstatniDzien.doIso)
        .order("data", { ascending: true });
      if (e1) throw e1;
      setWpisy(w ?? []);

      if (mozeZarzadzacStawkami) {
        const { data: s, error: e2 } = await supabase
          .from("pracownik_stawka_okres")
          .select("*")
          .eq("pracownik_nr", nr)
          .order("data_od", { ascending: true });
        if (e2) throw e2;
        setStawki(s ?? []);
      } else {
        setStawki([]);
      }
    } catch (e) {
      setFetchErr(e?.message ?? String(e));
      setWpisy([]);
      setStawki([]);
    } finally {
      setBusy(false);
    }
  }, [supabase, wybranyNr, pierwszyOstatniDzien.odIso, pierwszyOstatniDzien.doIso, mozeZarzadzacStawkami]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!modal || form != null) return;
    const list = wpisyPoDniu.get(modal.dzien) ?? [];
    setModal((prev) => (prev && prev.dzien ? { ...prev, lista: list } : prev));
  }, [wpisyPoDniu, modal?.dzien, form]);

  /** Edycja wpisów: wyłącznie administrator (wszyscy) albo własny nr (pracownik i kierownik). Kierownik widzi listę wszystkich, ale edytuje tylko siebie. */
  const mozeEdytowacWybraneWpisy = useMemo(() => {
    if (!pracownikSesja?.nr) return false;
    if (String(pracownikSesja.app_role ?? "").trim() === "admin") return true;
    return String(pracownikSesja.nr).trim() === String(wybranyNr ?? "").trim();
  }, [pracownikSesja, wybranyNr]);

  const widokTylkoDoOdczytuCudzychGodzin = useMemo(() => {
    if (!pracownikSesja?.nr) return false;
    if (String(pracownikSesja.app_role ?? "").trim() === "admin") return false;
    return String(pracownikSesja.nr).trim() !== String(wybranyNr ?? "").trim();
  }, [pracownikSesja, wybranyNr]);

  function otworzDzien(iso) {
    const list = wpisyPoDniu.get(iso) ?? [];
    setModal({ dzien: iso, lista: list });
  }

  function startDodaj(iso) {
    setForm({
      id: undefined,
      data: iso,
      kr: "",
      typ: "praca_stacjonarna",
      czas_od: "08:00",
      czas_do: "11:00",
      uwagi_dodatkowe: "",
    });
  }

  function startEdytuj(w) {
    const g = Number(w.godziny) || 0;
    const nd = Number(w.nadgodziny) || 0;
    const godzRazem = nd > 0 ? g + nd : g;
    const uw = String(w.uwagi ?? "");
    const parsed = parsujZakresCzasuZUwag(uw);
    let czasOd = parsed.czasOd ? normalizeTimeInput(parsed.czasOd) : "";
    let czasDo = parsed.czasDo ? normalizeTimeInput(parsed.czasDo) : "";
    let uwagiDodatkowe = parsed.reszta;
    if (!czasOd || !czasDo) {
      czasOd = "08:00";
      czasDo = dodajGodzinyDoCzasu("08:00", godzRazem > 0 ? godzRazem : 3);
      uwagiDodatkowe = uw.trim();
    }
    setForm({
      id: w.id,
      data: String(w.data ?? "").slice(0, 10),
      kr: String(w.kr ?? ""),
      typ: w.typ || "praca_stacjonarna",
      czas_od: czasOd,
      czas_do: czasDo,
      uwagi_dodatkowe: uwagiDodatkowe,
    });
  }

  async function zapiszWpis(ev) {
    ev.preventDefault();
    if (!mozeEdytowacWybraneWpisy || !form) return;
    const od = normalizeTimeInput(form.czas_od);
    const dol = normalizeTimeInput(form.czas_do);
    if (!od || !dol) {
      alert("Uzupełnij godzinę początku i końca (Od / Do).");
      return;
    }
    const godzWyliczone = obliczGodzinyZZakresu(od, dol);
    if (!Number.isFinite(godzWyliczone) || godzWyliczone <= 0) {
      alert("Zakres Od–Do musi dawać dodatnią liczbę godzin (np. 08:00–11:00).");
      return;
    }
    const nr = String(wybranyNr).trim();
    const payload = {
      pracownik_nr: nr,
      data: form.data,
      kr: String(form.kr ?? "").trim(),
      typ: form.typ,
      godziny: godzWyliczone,
      nadgodziny: 0,
      uwagi: zlozUwagiZZakresu(od, dol, form.uwagi_dodatkowe) || null,
    };
    if (grupaTypu(payload.typ) === "nieobecnosc") {
      payload.kr = "";
    }
    setBusy(true);
    try {
      if (form.id) {
        const { error } = await supabase.from("czas_pracy_wpis").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("czas_pracy_wpis").insert([payload]);
        if (error) throw error;
      }
      setForm(null);
      await load();
    } catch (e) {
      alert(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function usunWpis(id) {
    if (!mozeEdytowacWybraneWpisy || !id) return;
    if (!window.confirm("Usunąć ten wpis?")) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("czas_pracy_wpis").delete().eq("id", id);
      if (error) throw error;
      setForm(null);
      setModal(null);
      await load();
    } catch (e) {
      alert(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function zapiszStawke(ev) {
    ev.preventDefault();
    if (!mozeZarzadzacStawkami) return;
    const nr = String(wybranyNr).trim();
    const data_od = String(stForm.data_od).trim();
    const data_do = String(stForm.data_do).trim();
    const st = Number(String(stForm.stawka_za_godzine).replace(",", "."));
    if (!data_od || !data_do || !st || st <= 0) {
      setStMsg("Uzupełnij daty i dodatnią stawkę.");
      return;
    }
    setBusy(true);
    setStMsg(null);
    try {
      const { error } = await supabase.from("pracownik_stawka_okres").insert([
        {
          pracownik_nr: nr,
          data_od,
          data_do,
          stawka_za_godzine: st,
          uwagi: String(stForm.uwagi ?? "").trim() || null,
        },
      ]);
      if (error) throw error;
      setStForm({ data_od: "", data_do: "", stawka_za_godzine: "", uwagi: "" });
      await load();
      setStMsg("Zapisano okres stawki.");
    } catch (e) {
      setStMsg(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function usunStawke(id) {
    if (!mozeZarzadzacStawkami || !id) return;
    if (!window.confirm("Usunąć ten okres stawki?")) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("pracownik_stawka_okres").delete().eq("id", id);
      if (error) throw error;
      await load();
    } catch (e) {
      alert(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  if (wymagaKonta && !pracownikSesja?.nr) {
    return (
      <section style={{ maxWidth: "40rem" }}>
        <p style={{ color: theme.muted, fontSize: "0.9rem" }}>
          Kalendarz czasu pracy jest dostępny po zalogowaniu i powiązaniu konta z rekordem w{" "}
          <code style={{ fontSize: "0.85em" }}>pracownik</code>.
        </p>
      </section>
    );
  }

  const nazwyMies = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Październik",
    "Listopad",
    "Grudzień",
  ];

  return (
    <section style={{ maxWidth: "min(1200px, 100%)" }}>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff", marginTop: 0, letterSpacing: "-0.02em" }}>
        Czas pracy i rozliczenie godzin
      </h2>
      <p style={{ color: theme.muted, fontSize: "0.86rem", lineHeight: 1.55, marginBottom: "1rem" }}>
        W jednym dniu możesz dodać <strong style={{ color: theme.text }}>wiele wpisów</strong> (np. 7–10 jedna KR, potem
        kolejna) — każdy wpis to osobny blok godzin. <strong style={{ color: theme.text }}>Nadgodziny</strong> liczone są
        na koniec miesiąca: najpierw wg kalendarza PL obliczana jest norma (dni robocze × {NORMA_H_NA_DZIEN_ROBOCZY} h), potem
        porównanie z sumą zapisanych godzin pracy. Przy{" "}
        <strong style={{ color: theme.text }}>umowie zlecenie</strong> wszystkie zapisane godziny traktujemy jak nadgodziny
        rozliczeniowe; przy <strong style={{ color: theme.text }}>UoP</strong> — nadgodziny to nadwyżka ponad normę.
        Formę zatrudnienia ustawia administrator w <strong style={{ color: theme.text }}>Zespół</strong>.
        {mozeZarzadzacStawkami ? (
          <>
            {" "}
            <strong style={{ color: theme.text }}>Stawki godzinowe</strong> i szacunek kosztu na KR są dostępne tylko
            administratorowi.
          </>
        ) : (
          <>
            {" "}
            Szczegóły <strong style={{ color: theme.text }}>stawek płacowych</strong> i kosztów na KR wprowadza wyłącznie
            administrator — w tym widoku nie są wyświetlane.
          </>
        )}
      </p>

      {fetchErr ? (
        <div
          role="alert"
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            border: "1px solid rgba(239,68,68,0.4)",
            background: "rgba(239,68,68,0.08)",
            color: "#fecaca",
            fontSize: "0.88rem",
            marginBottom: "1rem",
          }}
        >
          <strong>Nie udało się wczytać danych.</strong> {fetchErr}
          <br />
          <span style={{ fontSize: "0.82em", opacity: 0.95 }}>
            Uruchom w Supabase: <code>g4-app/supabase/czas-pracy-stawki-i-wpisy.sql</code>
          </span>
        </div>
      ) : null}

      {widokTylkoDoOdczytuCudzychGodzin ? (
        <div
          role="status"
          style={{
            marginBottom: "1rem",
            padding: "0.65rem 0.85rem",
            borderRadius: "10px",
            border: "1px solid rgba(56,189,248,0.35)",
            background: "rgba(56,189,248,0.08)",
            color: "#bae6fd",
            fontSize: "0.86rem",
            lineHeight: 1.45,
          }}
        >
          <strong>Podgląd godzin innej osoby.</strong> Jako kierownik możesz je przeglądać; edytować i dodawać wpisy może
          tylko ta osoba lub <strong>administrator</strong>.
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.65rem",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        {mozeWybieracPracownika ? (
          <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.82rem", color: theme.muted }}>
            Pracownik
            <select
              value={wybranyNr}
              onChange={(e) => setWybranyNr(e.target.value)}
              style={{
                padding: "0.45rem 0.6rem",
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
                background: "#111827",
                color: theme.text,
                minWidth: "14rem",
              }}
            >
              {pracownicy.map((p) => (
                <option key={String(p.nr)} value={String(p.nr).trim()}>
                  {String(p.nr)} — {p.imie_nazwisko ?? ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span style={{ fontSize: "0.85rem", color: theme.text }}>
            <strong>{pracownikWidokEfektywny?.imie_nazwisko ?? "—"}</strong>
            <span style={{ color: theme.muted }}>
              {" "}
              (nr {wybranyNr}) ·{" "}
              {formaZatrudnienia === "uz"
                ? "um. zlecenie"
                : formaZatrudnienia === "inne"
                  ? "forma: inna"
                  : "UoP"}
            </span>
          </span>
        )}
        {mozeWybieracPracownika && pracownikRekord ? (
          <span style={{ fontSize: "0.78rem", color: theme.muted }}>
            Forma:{" "}
            {formaZatrudnienia === "uz" ? "umowa zlecenie" : formaZatrudnienia === "inne" ? "inna" : "umowa o pracę"}
          </span>
        ) : null}
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.82rem", color: theme.muted }}>
          Rok
          <input
            type="number"
            value={rok}
            min={2000}
            max={2100}
            onChange={(e) => setRok(Number(e.target.value))}
            style={{
              width: "5.5rem",
              padding: "0.45rem",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              background: "#111827",
              color: theme.text,
            }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem", fontSize: "0.82rem", color: theme.muted }}>
          Miesiąc
          <select
            value={miesiac}
            onChange={(e) => setMiesiac(Number(e.target.value))}
            style={{
              padding: "0.45rem 0.6rem",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              background: "#111827",
              color: theme.text,
              minWidth: "10rem",
            }}
          >
            {nazwyMies.map((n, i) => (
              <option key={n} value={i}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void load()}
          style={{
            marginTop: "1.15rem",
            padding: "0.45rem 0.85rem",
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
            background: "rgba(249,115,22,0.12)",
            color: theme.action,
            fontWeight: 600,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          Odśwież
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "0.65rem",
          marginBottom: "1.25rem",
          fontSize: "0.82rem",
          color: theme.muted,
        }}
      >
        <div style={{ padding: "0.65rem 0.75rem", borderRadius: "10px", border: `1px solid ${theme.border}`, background: "#111827" }}>
          <div style={{ fontWeight: 700, color: theme.text, marginBottom: "0.35rem" }}>Norma miesiąca (PL)</div>
          <div>Dni robocze: {rozliczenieMiesiac.dniRobocze}</div>
          <div>
            Norma godzin: {rozliczenieMiesiac.norma.toFixed(0)} h ({NORMA_H_NA_DZIEN_ROBOCZY} h × dni)
          </div>
          <div style={{ marginTop: "0.35rem", color: theme.text }}>
            Suma zapisanych godzin pracy: <strong>{rozliczenieMiesiac.sumaZalogowanych.toFixed(2)} h</strong>
          </div>
          {rozliczenieMiesiac.tryb === "uz" ? (
            <div style={{ marginTop: "0.45rem", color: "#fdba74", lineHeight: 1.45 }}>
              <strong>Um. zlecenie:</strong> do rozliczeń nadgodzin przyjmujemy całą sumę zapisów ({rozliczenieMiesiac.nadgodzinyRozliczeniowe.toFixed(2)} h).
            </div>
          ) : (
            <>
              <div style={{ marginTop: "0.45rem", color: rozliczenieMiesiac.brakDoNormy > 0 ? "#fca5a5" : "#86efac" }}>
                Brak do normy: {rozliczenieMiesiac.brakDoNormy.toFixed(2)} h
              </div>
              <div style={{ marginTop: "0.2rem", color: "#fdba74" }}>
                Nadgodziny rozliczeniowe: {rozliczenieMiesiac.nadgodzinyRozliczeniowe.toFixed(2)} h
              </div>
              {rozliczenieMiesiac.tryb === "inne" ? (
                <div style={{ marginTop: "0.35rem", fontSize: "0.78rem", opacity: 0.9 }}>
                  Forma „inne” — jak UoP (norma vs suma); doprecyzuj politykę w kadrach.
                </div>
              ) : null}
            </>
          )}
        </div>
        <div style={{ padding: "0.65rem 0.75rem", borderRadius: "10px", border: `1px solid ${theme.border}`, background: "#111827" }}>
          <div style={{ fontWeight: 700, color: theme.text, marginBottom: "0.25rem" }}>Godziny na KR (miesiąc)</div>
          <div style={{ lineHeight: 1.45 }}>
            {Object.keys(podsumowanie.poKr).length === 0 ? (
              "—"
            ) : (
              Object.entries(podsumowanie.poKr).map(([k, h]) => (
                <div key={k}>
                  <strong style={{ color: theme.action }}>{k}</strong>: {h.toFixed(2)} h
                </div>
              ))
            )}
          </div>
        </div>
        {mozeZarzadzacStawkami ? (
          <div
            style={{
              padding: "0.65rem 0.75rem",
              borderRadius: "10px",
              border: `1px solid ${theme.border}`,
              background: "#111827",
            }}
          >
            <div style={{ fontWeight: 700, color: theme.text, marginBottom: "0.25rem" }}>
              Szacunek kosztu na KR (wg stawek) — tylko administrator
            </div>
            <div style={{ lineHeight: 1.45 }}>
              {Object.keys(kwotaSzacunekPoKr).length === 0 ? (
                <span>Brak dopasowanej stawki lub brak godzin z polem KR.</span>
              ) : (
                Object.entries(kwotaSzacunekPoKr).map(([k, v]) => (
                  <div key={k}>
                    <strong style={{ color: theme.action }}>{k}</strong>: {formatPln(v)}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="czas-pracy-kalendarz-wrap" style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
        <table
          style={{
            borderCollapse: "collapse",
            borderSpacing: 0,
            tableLayout: "fixed",
            width: "100%",
            minWidth: "640px",
            fontSize: "0.78rem",
          }}
        >
          <colgroup>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <col key={i} style={{ width: `${100 / 7}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((d) => (
                <th
                  key={d}
                  style={{
                    boxSizing: "border-box",
                    minWidth: 0,
                    padding: "0.35rem",
                    color: theme.muted,
                    fontWeight: 700,
                    textAlign: "center",
                    borderBottom: `1px solid ${theme.border}`,
                  }}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kalendarzKomorki.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell) => {
                  if (cell.pusty) {
                    return (
                      <td
                        key={`${ri}-${cell.key}`}
                        style={{
                          boxSizing: "border-box",
                          minWidth: 0,
                          padding: "0.25rem",
                          background: "rgba(15,23,42,0.35)",
                          minHeight: "3.2rem",
                        }}
                      />
                    );
                  }
                  const inf = infoDniaKalendarzaPl(cell.date);
                  const rob = czyDzienRoboczyPl(cell.date);
                  const lista = wpisyPoDniu.get(cell.iso) ?? [];
                  const sumaDzien = lista.reduce((acc, w) => {
                    if (!czyTypLiczyGodzinyPracy(w.typ)) return acc;
                    return acc + (Number(w.godziny) || 0) + (Number(w.nadgodziny) || 0);
                  }, 0);
                  let bg = "rgba(17,24,39,0.65)";
                  if (inf.swieto) bg = "rgba(88,28,135,0.22)";
                  else if (inf.weekend) bg = "rgba(30,41,59,0.55)";
                  else if (!rob) bg = "rgba(30,41,59,0.4)";
                  return (
                    <td
                      key={`${ri}-${cell.key}`}
                      style={{
                        boxSizing: "border-box",
                        minWidth: 0,
                        padding: "0.28rem",
                        verticalAlign: "top",
                        border: `1px solid ${theme.border}`,
                        background: bg,
                        minHeight: "4rem",
                        cursor: "pointer",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                      }}
                      title={inf.nazwaSwieta ?? (inf.weekend ? "Weekend" : "")}
                      onClick={() => otworzDzien(cell.iso)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          otworzDzien(cell.iso);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div style={{ fontWeight: 800, color: "#fff", marginBottom: "0.2rem" }}>{cell.date.getDate()}</div>
                      {lista.length === 0 ? (
                        <span style={{ color: theme.muted, fontSize: "0.72rem" }}>—</span>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          {lista.slice(0, 3).map((w, wi) => (
                            <span
                              key={w.id != null ? String(w.id) : `${cell.iso}-${wi}`}
                              style={{
                                fontSize: "0.68rem",
                                lineHeight: 1.2,
                                color: grupaTypu(w.typ) === "nieobecnosc" ? "#f472b6" : "#fdba74",
                              }}
                            >
                              {w.typ?.replace(/_/g, " ")?.slice(0, 14)}
                              {String(w.kr ?? "").trim() ? ` · ${w.kr}` : ""}
                            </span>
                          ))}
                          {lista.length > 3 ? (
                            <span style={{ fontSize: "0.65rem", color: theme.muted }}>+{lista.length - 3}</span>
                          ) : null}
                          {sumaDzien > 0 ? (
                            <span style={{ fontSize: "0.68rem", color: "#86efac" }}>{sumaDzien.toFixed(1)} h</span>
                          ) : null}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (!form) setModal(null);
          }}
        >
          <div
            style={{
              background: "#111827",
              border: `1px solid ${theme.border}`,
              borderRadius: "12px",
              padding: "1.1rem",
              maxWidth: "26rem",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", color: "#fff" }}>
              Dzień {modal.dzien}
              {infoDniaKalendarzaPl(parseDataIso(modal.dzien)).nazwaSwieta
                ? ` · ${infoDniaKalendarzaPl(parseDataIso(modal.dzien)).nazwaSwieta}`
                : ""}
            </h3>
            {!form ? (
              <>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: theme.muted }}>
                  Wpisy tego dnia ({(modal.lista ?? []).length}) — kolejne bloki (inne KR lub inny typ):
                </p>
                <ul style={{ margin: "0 0 1rem", paddingLeft: "1.1rem", color: theme.text, fontSize: "0.88rem" }}>
                  {(modal.lista ?? []).map((w) => (
                    <li key={w.id} style={{ marginBottom: "0.35rem" }}>
                      {mozeEdytowacWybraneWpisy ? (
                        <button
                          type="button"
                          onClick={() => startEdytuj(w)}
                          style={{
                            background: "none",
                            border: "none",
                            color: theme.action,
                            cursor: "pointer",
                            textAlign: "left",
                            font: "inherit",
                            textDecoration: "underline",
                          }}
                        >
                          {w.typ} {String(w.kr ?? "").trim() ? `· ${w.kr}` : ""} — {(Number(w.godziny) || 0) + (Number(w.nadgodziny) || 0)} h
                        </button>
                      ) : (
                        <span>
                          {w.typ} {String(w.kr ?? "").trim() ? `· ${w.kr}` : ""} — {(Number(w.godziny) || 0) + (Number(w.nadgodziny) || 0)} h
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {mozeEdytowacWybraneWpisy ? (
                  <button type="button" style={{ ...btnPrimary, width: "100%", marginBottom: "0.5rem" }} onClick={() => startDodaj(modal.dzien)}>
                    Dodaj kolejny blok (np. inna KR)
                  </button>
                ) : null}
                <button type="button" style={{ ...btnGhost, marginLeft: "0.5rem" }} onClick={() => setModal(null)}>
                  Zamknij
                </button>
              </>
            ) : (
              <form onSubmit={zapiszWpis}>
                <label style={lbl}>
                  Rodzaj
                  <select
                    required
                    value={form.typ}
                    onChange={(e) => setForm({ ...form, typ: e.target.value })}
                    style={inp}
                  >
                    {CZAS_TYP_WPISU.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={lbl}>
                  KR (opcjonalnie — praca na projekcie; kwoty ze stawek widzi tylko administrator)
                  <select value={form.kr} onChange={(e) => setForm({ ...form, kr: e.target.value })} style={inp}>
                    <option value="">— brak / praca ogólna —</option>
                    {[...krList]
                      .sort((a, b) => String(a.kr).localeCompare(String(b.kr), "pl", { numeric: true }))
                      .map((r) => (
                        <option key={String(r.kr)} value={String(r.kr).trim()}>
                          {String(r.kr).trim()}
                          {r.nazwa_obiektu?.trim() ? ` — ${r.nazwa_obiektu.trim()}` : ""}
                        </option>
                      ))}
                  </select>
                </label>
                <div style={{ ...lbl, marginBottom: "0.65rem" }}>
                  <span>Blok czasu (kilka wpisów w tym samym dniu = kilka bloków)</span>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                      alignItems: "flex-end",
                      marginTop: "0.35rem",
                    }}
                  >
                    <label style={{ ...lbl, marginBottom: 0 }}>
                      Od
                      <input
                        type="time"
                        required
                        step={TIME_INPUT_STEP_SEKUND}
                        value={form.czas_od}
                        onChange={(e) => setForm({ ...form, czas_od: e.target.value })}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (!v?.trim()) return;
                          setForm((f) => (f ? { ...f, czas_od: normalizeTimeInput(v) } : f));
                        }}
                        style={{ ...inp, width: "auto", minWidth: "7.5rem" }}
                      />
                    </label>
                    <label style={{ ...lbl, marginBottom: 0 }}>
                      Do
                      <input
                        type="time"
                        required
                        step={TIME_INPUT_STEP_SEKUND}
                        value={form.czas_do}
                        onChange={(e) => setForm({ ...form, czas_do: e.target.value })}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (!v?.trim()) return;
                          setForm((f) => (f ? { ...f, czas_do: normalizeTimeInput(v) } : f));
                        }}
                        style={{ ...inp, width: "auto", minWidth: "7.5rem" }}
                      />
                    </label>
                    <div
                      style={{
                        fontSize: "0.88rem",
                        color: theme.text,
                        paddingBottom: "0.35rem",
                        fontWeight: 600,
                      }}
                      aria-live="polite"
                    >
                      {(() => {
                        const odN = normalizeTimeInput(form.czas_od);
                        const dolN = normalizeTimeInput(form.czas_do);
                        const h = obliczGodzinyZZakresu(odN || form.czas_od, dolN || form.czas_do);
                        if (!Number.isFinite(h) || h <= 0) return "— h (wybierz Od i Do)";
                        const t = h % 1 !== 0 ? h.toFixed(2).replace(".", ",") : String(h);
                        return `→ ${t} h`;
                      })()}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.78rem", color: theme.muted, display: "block", marginTop: "0.35rem" }}>
                    Minuty co {KROK_MINUT_CZAS_PRACY} min (np. :00, :15, :30, :45). Godziny pracy liczą się z przedziału.
                    Jeśli „Do” jest wcześniej niż „Od”, liczymy przez północ (np. nocna zmiana).
                  </span>
                </div>
                <label style={lbl}>
                  Uwagi dodatkowe (opcjonalnie — dołączane do zakresu w zapisie)
                  <input
                    value={form.uwagi_dodatkowe}
                    onChange={(e) => setForm({ ...form, uwagi_dodatkowe: e.target.value })}
                    style={inp}
                    placeholder="np. dojazd, notatka"
                  />
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                  <button type="submit" disabled={busy} style={btnPrimary}>
                    Zapisz
                  </button>
                  <button type="button" style={btnGhost} onClick={() => setForm(null)}>
                    Wstecz
                  </button>
                  {form.id ? (
                    <button type="button" style={{ ...btnGhost, color: "#fecaca" }} onClick={() => usunWpis(form.id)}>
                      Usuń
                    </button>
                  ) : null}
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {mozeZarzadzacStawkami ? (
        <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: `1px solid ${theme.border}` }}>
          <h3 style={{ fontSize: "0.95rem", color: "#fff", margin: "0 0 0.5rem" }}>
            Stawki za godzinę (okresy) — widoczne tylko dla administratora
          </h3>
          <p style={{ color: theme.muted, fontSize: "0.82rem", marginBottom: "0.75rem" }}>
            Zakres dat nie powinien się nakładać z innym wierszem — przy nakładaniu się koszt na KR bierze ostatni pasujący
            okres (wg <code style={{ fontSize: "0.85em" }}>data_od</code>). Inne role nie widzą tej sekcji ani kwot (przy
            migracji RLS: <code style={{ fontSize: "0.85em" }}>pracownik-stawka-okres-rls-tylko-admin.sql</code>).
          </p>
          {stMsg ? <p style={{ fontSize: "0.82rem", color: stMsg.startsWith("Zapisano") ? "#86efac" : "#fecaca" }}>{stMsg}</p> : null}
          <form onSubmit={zapiszStawke} style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "flex-end", marginBottom: "1rem" }}>
            <label style={lbl}>
              Od
              <input
                type="date"
                required
                value={stForm.data_od}
                onChange={(e) => setStForm((f) => ({ ...f, data_od: e.target.value }))}
                style={inp}
              />
            </label>
            <label style={lbl}>
              Do
              <input
                type="date"
                required
                value={stForm.data_do}
                onChange={(e) => setStForm((f) => ({ ...f, data_do: e.target.value }))}
                style={inp}
              />
            </label>
            <label style={lbl}>
              PLN / h
              <input
                value={stForm.stawka_za_godzine}
                onChange={(e) => setStForm((f) => ({ ...f, stawka_za_godzine: e.target.value }))}
                style={{ ...inp, width: "6rem" }}
                inputMode="decimal"
              />
            </label>
            <label style={{ ...lbl, flex: "1 1 12rem" }}>
              Uwagi
              <input
                value={stForm.uwagi}
                onChange={(e) => setStForm((f) => ({ ...f, uwagi: e.target.value }))}
                style={inp}
              />
            </label>
            <button type="submit" disabled={busy} style={{ ...btnPrimary, marginBottom: "0.15rem" }}>
              Dodaj okres
            </button>
          </form>
          <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.85rem", color: theme.text }}>
            {(stawki ?? []).map((s) => (
              <li key={s.id} style={{ marginBottom: "0.35rem" }}>
                {s.data_od} → {s.data_do}: <strong>{formatPln(Number(s.stawka_za_godzine))}</strong> / h
                {s.uwagi ? ` — ${s.uwagi}` : ""}
                <button
                  type="button"
                  onClick={() => usunStawke(s.id)}
                  style={{
                    marginLeft: "0.5rem",
                    background: "none",
                    border: "none",
                    color: "#fca5a5",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  usuń
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

const lbl = { display: "grid", gap: "0.25rem", fontSize: "0.82rem", color: theme.muted, marginBottom: "0.5rem" };
const inp = {
  padding: "0.45rem 0.55rem",
  borderRadius: "8px",
  border: `1px solid ${theme.border}`,
  background: "#0b0f14",
  color: theme.text,
  font: "inherit",
  fontSize: "0.88rem",
};
const btnPrimary = {
  padding: "0.5rem 1rem",
  borderRadius: "8px",
  border: "none",
  background: "linear-gradient(180deg, rgba(249,115,22,0.95), rgba(234,88,12,0.95))",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};
const btnGhost = {
  padding: "0.5rem 0.85rem",
  borderRadius: "8px",
  border: `1px solid ${theme.border}`,
  background: "transparent",
  color: theme.text,
  cursor: "pointer",
};
