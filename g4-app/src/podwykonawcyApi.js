/** Decyzja zapisu zlecenia. Serwer (SQL) i ten moduł odrzucają anon oraz zwykłego pracownika. */

import { aneksCeny, payloadZapisu, walidujZapis } from "./podwykonawcyZlecenieModel.js";

const ROLE_ZAPISU = new Set(["admin", "kierownik"]);

export function decyzjaDostepu(sesja, pracownicy) {
  const uid = sesja?.user?.id;
  if (!uid) {
    return { zapis: false, odczytKwot: false, kod: "odmowa", rola: "anon", pracownik: null };
  }
  const pracownik = (pracownicy || []).find(
    (osoba) => String(osoba.auth_user_id || "") === String(uid) && osoba.is_active !== false,
  );
  const rola = String(pracownik?.app_role || "").trim();
  const dozwolony = ROLE_ZAPISU.has(rola);
  return {
    zapis: dozwolony,
    odczytKwot: dozwolony,
    kod: dozwolony ? "ok" : "odmowa",
    rola: rola || "brak",
    pracownik: pracownik || null,
  };
}

export function obsluzZapiszZlecenie(baza, zadanie) {
  const rola = String(zadanie?.rola || "");
  if (!zadanie?.authUserId || zadanie.aktywny === false || !ROLE_ZAPISU.has(rola)) {
    return { ok: false, kod: "odmowa" };
  }
  const formularz = zadanie.payload || {};
  const bledy = walidujZapis(formularz);
  if (bledy.length) {
    return { ok: false, kod: "walidacja", komunikat: bledy.join(" ") };
  }
  const payload = payloadZapisu(formularz);
  const teraz = zadanie.teraz || new Date().toISOString();
  const autor = zadanie.pracownikNr || "";
  if (payload.id != null && payload.id !== "") {
    const obecne = (baza.zlecenia || []).find((wiersz) => String(wiersz.id) === String(payload.id));
    if (!obecne) return { ok: false, kod: "brak" };
    if (Number(obecne.wersja) !== Number(payload.wersja)) {
      return { ok: false, kod: "konflikt", aktualny: { ...obecne }, przyslane: payload };
    }
    const historia = aneksCeny(obecne, payload, autor, teraz);
    if (historia) baza.historia.push({ ...historia, zlecenie_id: obecne.id });
    Object.assign(obecne, payload, {
      wersja: Number(obecne.wersja) + 1,
      updated_by: zadanie.authUserId,
      zmienil_pracownik_nr: autor,
      updated_at: teraz,
    });
    return { ok: true, kod: "zapisane", zlecenie: { ...obecne } };
  }
  const nowe = {
    ...payload,
    id: baza.nastepneId++,
    wersja: 1,
    created_by: zadanie.authUserId,
    autor_pracownik_nr: autor,
    created_at: teraz,
  };
  baza.zlecenia.push(nowe);
  return { ok: true, kod: "zapisane", zlecenie: { ...nowe } };
}

export async function wywolajZapisZlecenia(klient, sesja, pracownicy, formularz) {
  const dostep = decyzjaDostepu(sesja, pracownicy);
  if (!dostep.zapis) {
    return {
      ok: false,
      kod: "odmowa",
      komunikat: "Zapis zlecenia wymaga zalogowanego kierownika albo administratora.",
    };
  }
  const payload = payloadZapisu({
    ...formularz,
    autor_pracownik_nr: dostep.pracownik?.nr ? String(dostep.pracownik.nr) : "",
  });
  const { data, error } = await klient.rpc("g4_pw_zapisz_zlecenie", { p_payload: payload });
  if (error) {
    const tekst = String(error.message || "");
    const brakFunkcji = /g4_pw_zapisz_zlecenie|schema cache|could not find the function/i.test(tekst);
    return {
      ok: false,
      kod: "serwer",
      komunikat: brakFunkcji
        ? "Serwer jeszcze nie ma funkcji zapisu. Trzeba uruchomić migrację kr-zlecenie-podwykonawcy-mvp-20261031.sql."
        : tekst,
    };
  }
  return data || { ok: false, kod: "serwer", komunikat: "Pusta odpowiedź serwera." };
}
