import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { obsluzZapiszZlecenie, wywolajZapisZlecenia } from "./podwykonawcyApi.js";
import { groszeZTekstu, pustyFormularzZlecenia, walidujZapis } from "./podwykonawcyZlecenieModel.js";

const sql = readFileSync(new URL("../supabase/kr-zlecenie-podwykonawcy-mvp-20261031.sql", import.meta.url), "utf8");

function baza() {
  return { zlecenia: [], historia: [], nastepneId: 1 };
}

function szkic() {
  return { ...pustyFormularzZlecenia("1052"), podwykonawca_id: "4", opis_zakresu: "pomiar" };
}

test("grosze nie gubią 0,10 + 0,20", () => {
  assert.equal(groszeZTekstu("0,10") + groszeZTekstu("0,20"), 30n);
  assert.equal(groszeZTekstu(""), null);
  assert.equal(groszeZTekstu("0"), 0n);
});

test("szkic nie wymaga ceny i nie wstawia 30 dni", () => {
  const form = szkic();
  assert.deepEqual(walidujZapis(form), []);
  assert.equal(form.termin_platnosci_dni, "");
  assert.equal(form.status_ceny, "do_ustalenia");
});

test("potwierdzenie wymaga firmy, zakresu i uzgodnionej kwoty", () => {
  const form = { ...szkic(), status: "potwierdzone", status_ceny: "uzgodniona" };
  const bledy = walidujZapis(form).join(" ");
  assert.match(bledy, /firmę/);
  assert.match(bledy, /kwoty/);
});

test("anon, pracownik i kierownik — serwer, nie tylko przycisk", async () => {
  const stan = baza();
  assert.equal(obsluzZapiszZlecenie(stan, { authUserId: null, rola: "anon", payload: szkic() }).kod, "odmowa");
  assert.equal(
    obsluzZapiszZlecenie(stan, { authUserId: "u1", rola: "uzytkownik", aktywny: true, payload: szkic() }).kod,
    "odmowa",
  );
  assert.equal(stan.zlecenia.length, 0);

  let rpc = 0;
  const klient = {
    async rpc(nazwa) {
      rpc += 1;
      assert.equal(nazwa, "g4_pw_zapisz_zlecenie");
      return { data: { ok: true }, error: null };
    },
  };
  const anon = await wywolajZapisZlecenia(klient, null, [], szkic());
  assert.equal(anon.kod, "odmowa");
  assert.equal(rpc, 0);
  const pracownik = await wywolajZapisZlecenia(
    klient,
    { user: { id: "u1" } },
    [{ auth_user_id: "u1", app_role: "uzytkownik", is_active: true, nr: "3" }],
    szkic(),
  );
  assert.equal(pracownik.kod, "odmowa");
  assert.equal(rpc, 0);
  const kierownik = await wywolajZapisZlecenia(
    klient,
    { user: { id: "d1" } },
    [{ auth_user_id: "d1", app_role: "kierownik", is_active: true, nr: "12" }],
    szkic(),
  );
  assert.equal(kierownik.ok, true);
  assert.equal(rpc, 1);

  const zapis = obsluzZapiszZlecenie(stan, {
    authUserId: "d1",
    rola: "kierownik",
    aktywny: true,
    pracownikNr: "12",
    teraz: "2026-10-31T18:00:00+01:00",
    payload: szkic(),
  });
  assert.equal(zapis.ok, true);
  assert.equal(zapis.zlecenie.autor_pracownik_nr, "12");
  assert.equal(zapis.zlecenie.created_by, "d1");

  const zmiana = {
    ...szkic(),
    id: zapis.zlecenie.id,
    wersja: 1,
    status_ceny: "uzgodniona",
    cena_netto: "12000.00",
  };
  stan.zlecenia[0].status_ceny = "uzgodniona";
  stan.zlecenia[0].cena_netto = "10000.00";
  const aneks = obsluzZapiszZlecenie(stan, {
    authUserId: "d1",
    rola: "kierownik",
    aktywny: true,
    pracownikNr: "12",
    teraz: "2026-10-31T19:00:00+01:00",
    payload: zmiana,
  });
  assert.equal(aneks.ok, true);
  assert.equal(stan.historia[0].cena_poprzednia, "10000.00");
  assert.equal(stan.historia[0].autor, "12");
  assert.equal(stan.zlecenia[0].cena_netto, "12000.00");

  const konflikt = obsluzZapiszZlecenie(stan, {
    authUserId: "m1",
    rola: "admin",
    aktywny: true,
    pracownikNr: "1",
    payload: { ...zmiana, wersja: 1, cena_netto: "13000.00", opis_zakresu: "inna wersja" },
  });
  assert.equal(konflikt.kod, "konflikt");
  assert.equal(stan.zlecenia[0].cena_netto, "12000.00");
  assert.equal(konflikt.przyslane.opis_zakresu, "inna wersja");
});

test("migracja zdejmuje anon i nie zostawia USING (true)", () => {
  assert.match(sql, /REVOKE ALL ON TABLE public\.kr_zlecenie_podwykonawcy FROM anon/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.g4_pw_zapisz_zlecenie\(jsonb\) FROM PUBLIC, anon/);
  assert.match(sql, /g4_pw_moze_zarzadzac_zleceniami/);
  assert.match(sql, /'admin', 'kierownik'/);
  assert.match(sql, /kod', 'konflikt'/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS nip/);
  assert.doesNotMatch(sql, /USING\s*\(\s*true\s*\)/i);
  assert.doesNotMatch(sql, /DEFAULT\s+30/);
});
