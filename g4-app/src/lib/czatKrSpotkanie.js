import { useEffect, useState } from "react";

/** Widoczny autor notatek z posiedzenia — bez nazwiska osoby, która pisze. */
export const SPOTKANIE_AUTOR_NOTATKA = "Notatka ze spotkania kierowników";
/** Autor znaczników początek / koniec. */
export const SPOTKANIE_AUTOR_ZNACZNIK = "Spotkanie kierowników";

const STORAGE_KEY = "g4-czat-kr-spotkanie";
const EVENT = "g4-czat-kr-spotkanie";

const POCZATEK = "Początek spotkania kierowników";
const KONIEC = "Koniec spotkania kierowników";

const AUTORZY_SPOTKANIA = new Set([
  SPOTKANIE_AUTOR_NOTATKA,
  SPOTKANIE_AUTOR_ZNACZNIK,
  "Notatka ze spotkania",
]);

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
  if (AUTORZY_SPOTKANIA.has(a)) return true;
  return czyZnacznikPoczatek(w) || czyZnacznikKoniec(w);
}

/** Etykieta w wątku — nigdy imię notującej osoby. */
export function etykietaAutoraWpisu(w) {
  if (czyZnacznikPoczatek(w) || czyZnacznikKoniec(w)) return SPOTKANIE_AUTOR_ZNACZNIK;
  if (czyWpisSpotkania(w)) return SPOTKANIE_AUTOR_NOTATKA;
  return String(w?.autor ?? "").trim() || String(w?.autor_email ?? "").trim() || "—";
}

export function datetimeLocalZIso(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return datetimeLocalZIso(new Date().toISOString());
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isoZDatetimeLocal(value) {
  const v = String(value ?? "").trim();
  if (!v) return new Date().toISOString();
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

export function polaDatyGodzinyZIso(iso) {
  const local = datetimeLocalZIso(iso);
  const [data, godzina] = String(local).split("T");
  return { data: data || "", godzina: String(godzina || "").slice(0, 5) };
}

export function isoZDatyIGodziny(data, godzina) {
  const d = String(data ?? "").trim();
  const g = String(godzina ?? "").trim() || "00:00";
  if (!d) return new Date().toISOString();
  return isoZDatetimeLocal(`${d}T${g}`);
}

/** Śmieciowe kody KR w stylu ??? — nie nadają się na wątek spotkania. */
export function czyKrPlaceholder(kr) {
  const k = String(kr ?? "").trim();
  if (!k) return true;
  return /^[?¿*._\-\s/]+$/.test(k);
}

/** Osobisty wpis zalogowanej osoby — nie znacznik i nie notatka ze spotkania. */
export function czyMojOsobistyWpis(w, { nazwa, email } = {}) {
  if (czyWpisSpotkania(w)) return false;
  const a = String(w?.autor ?? "").trim().toLowerCase();
  const e = String(w?.autor_email ?? "").trim().toLowerCase();
  const n = String(nazwa ?? "").trim().toLowerCase();
  const em = String(email ?? "").trim().toLowerCase();
  if (em && e && (e === em || a === em)) return true;
  if (n && a && (a === n || a.includes(n) || n.includes(a))) return true;
  const czesci = n.split(/\s+/).filter((p) => p.length > 2);
  if (czesci.length >= 2 && czesci.every((p) => a.includes(p))) return true;
  return false;
}

export function znajdzZnacznikPoczatek(wpisy = [], krPrefer) {
  const list = (wpisy ?? []).filter(czyZnacznikPoczatek);
  if (!list.length) return null;
  const kr = String(krPrefer ?? "").trim();
  const wKr = kr ? list.filter((w) => String(w.kr ?? "").trim() === kr) : [];
  const pool = wKr.length ? wKr : list;
  pool.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  return pool[0] ?? null;
}

const SELECT_WPIS = "id, kr, tresc, autor, autor_email, created_at";

export async function upsertZnacznikPoczatek(supabase, { kr, startIso, znacznikId }) {
  const payload = {
    tresc: trescPoczatekSpotkania(startIso),
    autor: SPOTKANIE_AUTOR_ZNACZNIK,
    autor_email: null,
    created_at: startIso,
  };
  if (znacznikId) {
    return supabase
      .from("kr_notatka")
      .update(payload)
      .eq("id", znacznikId)
      .select(SELECT_WPIS)
      .single();
  }
  return supabase
    .from("kr_notatka")
    .insert([{ ...payload, kr }])
    .select(SELECT_WPIS)
    .single();
}

export async function przepiszMojeWpisyNaNotatkiSpotkania(
  supabase,
  { odIso, doIso, nazwa, email },
) {
  const { data, error } = await supabase
    .from("kr_notatka")
    .select(SELECT_WPIS)
    .gte("created_at", odIso)
    .lte("created_at", doIso)
    .order("created_at", { ascending: true })
    .limit(2000);
  if (error) return { liczba: 0, ids: [], error };
  const moje = (data ?? []).filter((w) => czyMojOsobistyWpis(w, { nazwa, email }));
  const ids = moje.map((w) => w.id).filter((id) => id != null);
  for (let i = 0; i < ids.length; i += 80) {
    const chunk = ids.slice(i, i + 80);
    const { error: e2 } = await supabase
      .from("kr_notatka")
      .update({ autor: SPOTKANIE_AUTOR_NOTATKA, autor_email: null })
      .in("id", chunk);
    if (e2) return { liczba: 0, ids: [], error: e2 };
  }
  return { liczba: ids.length, ids, error: null };
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
