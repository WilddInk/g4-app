/** Kwoty zlecenia w groszach (BigInt), bez binarnego float. */

export function groszeZTekstu(raw) {
  if (raw == null) return null;
  let tekst = String(raw).trim().replace(/\s/g, "").replace(",", ".");
  if (tekst === "" || tekst.toLowerCase() === "do ustalenia") return null;
  if (!/^-?\d+(\.\d+)?$/.test(tekst)) return null;
  const ujemna = tekst.startsWith("-");
  if (ujemna) tekst = tekst.slice(1);
  const [zlote, ulamek = ""] = tekst.split(".");
  const grosze = (ulamek + "00").slice(0, 2);
  const wartosc = BigInt(zlote || "0") * 100n + BigInt(grosze);
  return ujemna ? -wartosc : wartosc;
}

export function numericZGroszy(grosze) {
  if (grosze == null) return null;
  const ujemna = grosze < 0n;
  const modul = ujemna ? -grosze : grosze;
  const zlote = modul / 100n;
  const reszta = (modul % 100n).toString().padStart(2, "0");
  return `${ujemna ? "-" : ""}${zlote}.${reszta}`;
}

export function pustyFormularzZlecenia(kr = "") {
  return {
    id: null,
    wersja: null,
    podwykonawca_id: "",
    kr,
    firma_kod: "",
    nazwa_roboty: "",
    zamawiajacy: "",
    numer_zlecenia: "",
    opis_zakresu: "",
    status: "szkic",
    status_ceny: "do_ustalenia",
    cena_netto: "",
    waluta: "PLN",
    ilosc: "",
    stawka_netto: "",
    jednostka: "",
    data_zlecenia: "",
    termin_zlecenia: "",
    plan_data_faktury: "",
    plan_kwota_faktury_netto: "",
    warunek_fakturowania: "",
    termin_platnosci_dni: "",
    termin_platnosci_od: "",
    pracownik_weryfikacja: "",
    link_dokumentu: "",
    uwagi: "",
    data_oddania: "",
    data_odbioru: "",
    wynik_sprawdzenia: "",
    czy_sprawdzone: false,
    czy_odebrane: false,
    zrodlo_odbioru: "",
    uwagi_odbioru: "",
    osoba_faktury_nazwa: "",
    osoba_faktury_email: "",
    osoba_faktury_telefon: "",
    etapy: [],
  };
}

export function formularzZWiersza(row) {
  const formularz = pustyFormularzZlecenia(row?.kr ?? "");
  if (!row) return formularz;
  for (const pole of Object.keys(formularz)) {
    if (pole === "etapy") continue;
    if (row[pole] != null && pole !== "cena_netto" && pole !== "plan_kwota_faktury_netto" && pole !== "stawka_netto" && pole !== "ilosc") {
      formularz[pole] = typeof row[pole] === "boolean" ? row[pole] : String(row[pole]);
    }
  }
  formularz.id = row.id ?? null;
  formularz.wersja = row.wersja ?? 1;
  formularz.cena_netto = numericZGroszy(groszeZTekstu(row.cena_netto)) ?? "";
  formularz.plan_kwota_faktury_netto = numericZGroszy(groszeZTekstu(row.plan_kwota_faktury_netto)) ?? "";
  formularz.stawka_netto = numericZGroszy(groszeZTekstu(row.stawka_netto)) ?? "";
  formularz.status = row.status || "szkic";
  formularz.status_ceny = row.status_ceny || (row.cena_netto == null || row.cena_netto === "" ? "do_ustalenia" : "uzgodniona");
  formularz.waluta = row.waluta || "PLN";
  formularz.etapy = Array.isArray(row.etapy) ? row.etapy.map((etap) => ({ ...etap })) : [];
  return formularz;
}

export function brakiDoUstalenia(form) {
  const braki = [];
  if (!form.firma_kod) braki.push("firma zamawiająca");
  if (!String(form.opis_zakresu || "").trim()) braki.push("zakres");
  if (!form.data_zlecenia) braki.push("data zlecenia");
  if (!form.termin_zlecenia) braki.push("termin wykonania");
  if (!form.plan_data_faktury) braki.push("plan faktury");
  if (form.status_ceny !== "uzgodniona" || groszeZTekstu(form.cena_netto) == null) braki.push("cena");
  if (!form.warunek_fakturowania) braki.push("warunek fakturowania");
  if (form.termin_platnosci_dni === "" || !form.termin_platnosci_od) braki.push("termin płatności");
  if (!form.pracownik_weryfikacja) braki.push("osoba odbioru");
  return braki;
}

export function walidujZapis(form) {
  const bledy = [];
  if (!String(form.podwykonawca_id || "").trim()) bledy.push("Wybierz podwykonawcę z katalogu.");
  if (!String(form.kr || "").trim()) bledy.push("Podaj KR.");
  if (form.status !== "potwierdzone") return bledy;
  if (!["A", "B", "C"].includes(form.firma_kod)) bledy.push("Wybierz firmę A, B albo C.");
  if (!String(form.opis_zakresu || "").trim()) bledy.push("Napisz, co dokładnie zamawiamy.");
  if (!["proponowana", "uzgodniona", "do_ustalenia"].includes(form.status_ceny)) {
    bledy.push("Określ status ceny.");
  }
  if (form.status_ceny === "uzgodniona" && groszeZTekstu(form.cena_netto) == null) {
    bledy.push("Uzgodniona cena wymaga kwoty. Puste pole nie jest zerem.");
  }
  if (!form.data_zlecenia) bledy.push("Podaj datę zlecenia.");
  if (!form.termin_zlecenia) bledy.push("Podaj termin wykonania.");
  if (form.termin_platnosci_dni !== "" && !form.termin_platnosci_od) {
    bledy.push("Przy liczbie dni wskaż zdarzenie, od którego liczymy termin.");
  }
  return bledy;
}

export function payloadZapisu(form) {
  const cena = numericZGroszy(groszeZTekstu(form.cena_netto));
  const plan = numericZGroszy(groszeZTekstu(form.plan_kwota_faktury_netto));
  const stawka = numericZGroszy(groszeZTekstu(form.stawka_netto));
  return {
    id: form.id ?? null,
    wersja: form.wersja ?? null,
    podwykonawca_id: String(form.podwykonawca_id),
    kr: String(form.kr || "").trim(),
    firma_kod: form.firma_kod || null,
    nazwa_roboty: String(form.nazwa_roboty || "").trim(),
    zamawiajacy: String(form.zamawiajacy || "").trim(),
    numer_zlecenia: String(form.numer_zlecenia || "").trim(),
    opis_zakresu: String(form.opis_zakresu || "").trim(),
    status: form.status || "szkic",
    status_ceny: form.status_ceny || "do_ustalenia",
    cena_netto: cena,
    waluta: form.waluta || "PLN",
    ilosc: String(form.ilosc || "").trim(),
    stawka_netto: stawka,
    jednostka: String(form.jednostka || "").trim(),
    data_zlecenia: form.data_zlecenia || null,
    termin_zlecenia: form.termin_zlecenia || null,
    plan_data_faktury: form.plan_data_faktury || null,
    plan_kwota_faktury_netto: plan,
    warunek_fakturowania: String(form.warunek_fakturowania || "").trim(),
    termin_platnosci_dni: form.termin_platnosci_dni === "" ? null : String(form.termin_platnosci_dni),
    termin_platnosci_od: form.termin_platnosci_od || null,
    pracownik_weryfikacja: form.pracownik_weryfikacja || null,
    link_dokumentu: String(form.link_dokumentu || "").trim(),
    uwagi: String(form.uwagi || "").trim(),
    data_oddania: form.data_oddania || null,
    data_odbioru: form.data_odbioru || null,
    wynik_sprawdzenia: String(form.wynik_sprawdzenia || "").trim(),
    czy_sprawdzone: !!form.czy_sprawdzone,
    czy_odebrane: !!form.czy_odebrane,
    zrodlo_odbioru: String(form.zrodlo_odbioru || "").trim(),
    uwagi_odbioru: String(form.uwagi_odbioru || "").trim(),
    osoba_faktury_nazwa: String(form.osoba_faktury_nazwa || "").trim(),
    osoba_faktury_email: String(form.osoba_faktury_email || "").trim(),
    osoba_faktury_telefon: String(form.osoba_faktury_telefon || "").trim(),
    etapy: (form.etapy || []).map((etap, indeks) => ({
      id: etap.id ?? null,
      kolejnosc: indeks + 1,
      nazwa: String(etap.nazwa || "").trim(),
      opis: String(etap.opis || "").trim(),
      cena_netto: numericZGroszy(groszeZTekstu(etap.cena_netto)),
      status_ceny: etap.status_ceny || "do_ustalenia",
      waluta: etap.waluta || form.waluta || "PLN",
      plan_data_faktury: etap.plan_data_faktury || null,
      plan_kwota_netto: numericZGroszy(groszeZTekstu(etap.plan_kwota_netto)),
      status: etap.status || "aktywny",
      czy_sprawdzone: !!etap.czy_sprawdzone,
      czy_odebrane: !!etap.czy_odebrane,
    })),
  };
}

export function aneksCeny(poprzedni, nowy, autor, kiedy) {
  const stara = groszeZTekstu(poprzedni?.cena_netto);
  const swieza = groszeZTekstu(nowy?.cena_netto);
  if (poprzedni?.status_ceny !== "uzgodniona" || stara == null || stara === swieza) return null;
  return {
    cena_poprzednia: numericZGroszy(stara),
    cena_nowa: numericZGroszy(swieza),
    autor,
    kiedy,
  };
}
