import { useEffect, useState } from "react";

/** Widoczny autor notatek z posiedzenia — bez nazwiska osoby, która pisze. */
export const SPOTKANIE_AUTOR_NOTATKA = "Notatka ze spotkania";
/** Autor znaczników początek / koniec. */
export const SPOTKANIE_AUTOR_ZNACZNIK = "Spotkanie kierowników";

const STORAGE_KEY = "g4-czat-kr-spotkanie";
const EVENT = "g4-czat-kr-spotkanie";

const POCZATEK = "Początek spotkania kierowników";
const KONIEC = "Koniec spotkania kierowników";

export function formatDataSpotkania(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatCzasTrwania(startIso, endIso) {
  const a = new Date(startIso || 0).getTime();
  const b = new Date(endIso || 0).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return "";
  const min = Math.max(0, Math.round((b - a) / 60000));
  if (min < 1) return "poniżej minuty";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h} godz. ${r} min` : `${h} godz.`;
}

export function trescPoczatekSpotkania(iso) {
  const kiedy = formatDataSpotkania(iso) || formatDataSpotkania(new Date().toISOString());
  return `${POCZATEK}\n${kiedy}`;
}

export function trescKoniecSpotkania(startIso, endIso) {
  const koniec = formatDataSpotkania(endIso) || formatDataSpotkania(new Date().toISOString());
  const trwanie = formatCzasTrwania(startIso, endIso);
  return trwanie ? `${KONIEC}\n${koniec}\nCzas trwania: ${trwanie}` : `${KONIEC}\n${koniec}`;
}

export function czyZnacznikPoczatek(w) {
  return String(w?.tresc ?? "").startsWith(POCZATEK);
}

export function czyZnacznikKoniec(w) {
  return String(w?.tresc ?? "").startsWith(KONIEC);
}

export function czyWpisSpotkania(w) {
  const a = String(w?.autor ?? "").trim();
  if (a === SPOTKANIE_AUTOR_NOTATKA || a === SPOTKANIE_AUTOR_ZNACZNIK) return true;
  return czyZnacznikPoczatek(w) || czyZnacznikKoniec(w);
}

/** Etykieta w wątku — nigdy imię notującej osoby. */
export function etykietaAutoraWpisu(w) {
  if (czyZnacznikPoczatek(w) || czyZnacznikKoniec(w)) return SPOTKANIE_AUTOR_ZNACZNIK;
  if (czyWpisSpotkania(w)) return SPOTKANIE_AUTOR_NOTATKA;
  return String(w?.autor ?? "").trim() || String(w?.autor_email ?? "").trim() || "—";
}

export function odczytajSpotkanie() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { aktywne: false, startIso: null, startKr: "" };
    const p = JSON.parse(raw);
    return {
      aktywne: Boolean(p?.aktywne),
      startIso: p?.startIso || null,
      startKr: String(p?.startKr ?? "").trim(),
    };
  } catch {
    return { aktywne: false, startIso: null, startKr: "" };
  }
}

export function zapiszSpotkanie(stan) {
  const next = {
    aktywne: Boolean(stan?.aktywne),
    startIso: stan?.startIso || null,
    startKr: String(stan?.startKr ?? "").trim(),
  };
  try {
    if (!next.aktywne) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* prywatny tryb / zablokowany storage */
  }
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* SSR */
  }
  return next;
}

export function useSpotkanieKierownikow() {
  const [stan, setStan] = useState(() => odczytajSpotkanie());
  useEffect(() => {
    function sync() {
      setStan(odczytajSpotkanie());
    }
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return stan;
}
