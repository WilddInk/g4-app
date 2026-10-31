import { useEffect, useMemo, useState } from "react";
import { decyzjaDostepu, wywolajZapisZlecenia } from "./podwykonawcyApi.js";
import {
  brakiDoUstalenia,
  formularzZWiersza,
  pustyFormularzZlecenia,
} from "./podwykonawcyZlecenieModel.js";

const FIRMY = [
  ["", "— wybierz —"],
  ["A", "A — Michał Jakubowski"],
  ["B", "B — Monika Jakubowska"],
  ["C", "C — spółka"],
];

function Pole({ styles, etykieta, children }) {
  return (
    <label style={styles.label}>
      {etykieta}
      {children}
    </label>
  );
}

export function PodwykonawcyZlecenieForm({
  styles,
  supabase,
  session,
  pracownicy,
  podwykonawcy,
  krList,
  krDomyslne,
  zlecenie,
  onZapisano,
  onAnuluj,
}) {
  const s = styles;
  const dostep = decyzjaDostepu(session, pracownicy);
  const [form, setForm] = useState(() =>
    zlecenie ? formularzZWiersza(zlecenie) : pustyFormularzZlecenia(krDomyslne || ""),
  );
  const [historia, setHistoria] = useState([]);
  const [konflikt, setKonflikt] = useState(null);
  const [komunikat, setKomunikat] = useState("");
  const [zapisuje, setZapisuje] = useState(false);
  const braki = useMemo(() => brakiDoUstalenia(form), [form]);

  useEffect(() => {
    setForm(zlecenie ? formularzZWiersza({ ...zlecenie, kr: zlecenie.kr || krDomyslne || "" }) : pustyFormularzZlecenia(krDomyslne || ""));
    setKonflikt(null);
  }, [zlecenie, krDomyslne]);

  useEffect(() => {
    if (!zlecenie?.id) {
      setHistoria([]);
      return;
    }
    let aktywne = true;
    supabase
      .from("kr_zlecenie_pw_cena_historia")
      .select("cena_netto_poprzednia,cena_netto_nowa,autor_pracownik_nr,created_at,powod")
      .eq("zlecenie_id", zlecenie.id)
      .order("id", { ascending: false })
      .then(({ data, error }) => {
        if (!aktywne || error) return;
        setHistoria(data || []);
      });
    return () => {
      aktywne = false;
    };
  }, [supabase, zlecenie?.id]);

  function ustaw(pole, wartosc) {
    setForm((poprzedni) => ({ ...poprzedni, [pole]: wartosc }));
  }

  async function zapisz(event) {
    event.preventDefault();
    setKomunikat("");
    setZapisuje(true);
    const wynik = await wywolajZapisZlecenia(supabase, session, pracownicy, {
      ...form,
      kr: form.kr || krDomyslne || "",
    });
    setZapisuje(false);
    if (wynik?.kod === "konflikt") {
      setKonflikt(wynik);
      setKomunikat("Ktoś zmienił to zlecenie. Zostawiam obie wersje — nic nie nadpisałem.");
      return;
    }
    if (!wynik?.ok) {
      setKomunikat(wynik?.komunikat || "Serwer odmówił zapisu.");
      return;
    }
    onZapisano?.(wynik);
  }

  return (
    <form style={{ ...s.form, maxWidth: "46rem", marginBottom: "1.25rem" }} onSubmit={zapisz}>
      <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.4rem" }}>
        {form.id ? `Zlecenie ${form.id}` : "Nowe zlecenie"}
      </h3>
      {!dostep.zapis ? (
        <p style={s.errBox}>Zapis jest dla zalogowanego kierownika albo administratora. Przycisk sam nie nadaje uprawnień.</p>
      ) : null}
      {komunikat ? <p style={s.errBox}>{komunikat}</p> : null}
      {konflikt ? (
        <p style={s.muted}>
          W bazie: {String(konflikt.aktualny?.cena_netto ?? "do ustalenia")} / {konflikt.aktualny?.opis_zakresu || "brak zakresu"}.
          U Ciebie: {form.cena_netto || "do ustalenia"} / {form.opis_zakresu || "brak zakresu"}.
        </p>
      ) : null}
      <p style={s.muted}>Do ustalenia: {braki.length ? braki.join(", ") : "nic istotnego"}.</p>
      <Pole styles={s} etykieta="Podwykonawca">
        <select style={s.input} value={form.podwykonawca_id} onChange={(e) => ustaw("podwykonawca_id", e.target.value)}>
          <option value="">— katalog —</option>
          {(podwykonawcy || []).map((firma) => (
            <option key={firma.id} value={String(firma.id)}>
              {firma.nazwa_firmy}
              {firma.nip ? ` · NIP ${firma.nip}` : ""}
            </option>
          ))}
        </select>
      </Pole>
      <Pole styles={s} etykieta="Firma zamawiająca">
        <select style={s.input} value={form.firma_kod} onChange={(e) => ustaw("firma_kod", e.target.value)}>
          {FIRMY.map(([kod, nazwa]) => (
            <option key={kod || "brak"} value={kod}>{nazwa}</option>
          ))}
        </select>
      </Pole>
      <Pole styles={s} etykieta="KR">
        <input style={s.input} list="pw-kr-lista" value={form.kr} onChange={(e) => ustaw("kr", e.target.value)} />
        <datalist id="pw-kr-lista">
          {(krList || []).map((row) => (
            <option key={row.kr} value={row.kr}>{row.nazwa_obiektu || row.kr}</option>
          ))}
        </datalist>
      </Pole>
      <Pole styles={s} etykieta="Nazwa roboty">
        <input style={s.input} value={form.nazwa_roboty} onChange={(e) => ustaw("nazwa_roboty", e.target.value)} />
      </Pole>
      <Pole styles={s} etykieta="Potwierdzony zamawiający">
        <input style={s.input} value={form.zamawiajacy} onChange={(e) => ustaw("zamawiajacy", e.target.value)} />
      </Pole>
      <Pole styles={s} etykieta="Co dokładnie zamawiamy">
        <textarea style={{ ...s.input, minHeight: "4rem" }} value={form.opis_zakresu} onChange={(e) => ustaw("opis_zakresu", e.target.value)} />
      </Pole>
      <Pole styles={s} etykieta="Status zlecenia">
        <select style={s.input} value={form.status} onChange={(e) => ustaw("status", e.target.value)}>
          <option value="szkic">szkic</option>
          <option value="potwierdzone">potwierdzone</option>
          <option value="anulowane">anulowane</option>
        </select>
      </Pole>
      <Pole styles={s} etykieta="Cena">
        <select style={s.input} value={form.status_ceny} onChange={(e) => ustaw("status_ceny", e.target.value)}>
          <option value="do_ustalenia">do ustalenia</option>
          <option value="proponowana">proponowana</option>
          <option value="uzgodniona">uzgodniona</option>
        </select>
      </Pole>
      <Pole styles={s} etykieta="Kwota netto — puste nie znaczy zero">
        <input style={s.input} value={form.cena_netto} onChange={(e) => ustaw("cena_netto", e.target.value)} placeholder="np. 10000,00" />
      </Pole>
      <Pole styles={s} etykieta="Waluta">
        <input style={s.input} value={form.waluta} onChange={(e) => ustaw("waluta", e.target.value.toUpperCase())} />
      </Pole>
      <Pole styles={s} etykieta="Ilość, stawka, jednostka — opcjonalnie">
        <input
          style={s.input}
          value={`${form.ilosc}|${form.stawka_netto}|${form.jednostka}`}
          onChange={(e) => {
            const [ilosc = "", stawka = "", jednostka = ""] = e.target.value.split("|");
            setForm((poprzedni) => ({ ...poprzedni, ilosc, stawka_netto: stawka, jednostka }));
          }}
          placeholder="ilość|stawka|jednostka"
        />
      </Pole>
      <Pole styles={s} etykieta="Data zlecenia">
        <input style={s.input} type="date" value={String(form.data_zlecenia || "").slice(0, 10)} onChange={(e) => ustaw("data_zlecenia", e.target.value)} />
      </Pole>
      <Pole styles={s} etykieta="Termin wykonania robót">
        <input style={s.input} type="date" value={String(form.termin_zlecenia || "").slice(0, 10)} onChange={(e) => ustaw("termin_zlecenia", e.target.value)} />
      </Pole>
      <Pole styles={s} etykieta="Data faktury">
        <input style={s.input} type="date" value={String(form.plan_data_faktury || "").slice(0, 10)} onChange={(e) => ustaw("plan_data_faktury", e.target.value)} />
      </Pole>
      <Pole styles={s} etykieta="Planowana kwota faktury netto">
        <input style={s.input} value={form.plan_kwota_faktury_netto} onChange={(e) => ustaw("plan_kwota_faktury_netto", e.target.value)} />
      </Pole>
      <Pole styles={s} etykieta="Warunek fakturowania">
        <input style={s.input} value={form.warunek_fakturowania} onChange={(e) => ustaw("warunek_fakturowania", e.target.value)} placeholder="np. po odbiorze etapu" />
      </Pole>
      <Pole styles={s} etykieta="Termin płatności — liczba dni, bez domyślnych 30">
        <input style={s.input} value={form.termin_platnosci_dni} onChange={(e) => ustaw("termin_platnosci_dni", e.target.value)} />
      </Pole>
      <Pole styles={s} etykieta="Od jakiego zdarzenia liczyć dni">
        <select style={s.input} value={form.termin_platnosci_od} onChange={(e) => ustaw("termin_platnosci_od", e.target.value)}>
          <option value="">— nieustalone —</option>
          <option value="data_odbioru">od odbioru</option>
          <option value="data_faktury">od daty faktury</option>
          <option value="data_zlecenia">od daty zlecenia</option>
        </select>
      </Pole>
      <Pole styles={s} etykieta="Osoba sprawdzenia i odbioru">
        <select style={s.input} value={form.pracownik_weryfikacja} onChange={(e) => ustaw("pracownik_weryfikacja", e.target.value)}>
          <option value="">— wybierz —</option>
          {(pracownicy || []).map((osoba) => (
            <option key={osoba.nr} value={String(osoba.nr)}>
              {osoba.nr} — {osoba.imie_nazwisko || ""}
            </option>
          ))}
        </select>
      </Pole>
      <Pole styles={s} etykieta="Link do zlecenia albo umowy">
        <input style={s.input} value={form.link_dokumentu} onChange={(e) => ustaw("link_dokumentu", e.target.value)} />
      </Pole>
      <Pole styles={s} etykieta="Uwaga">
        <textarea style={s.input} value={form.uwagi} onChange={(e) => ustaw("uwagi", e.target.value)} />
      </Pole>
      <h4 style={{ margin: "0.8rem 0 0.3rem" }}>Etapy — osobna faktura, bez kopiowania zlecenia</h4>
      {(form.etapy || []).map((etap, indeks) => (
        <div key={etap.id || `nowy-${indeks}`} style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.4rem" }}>
          <Pole styles={s} etykieta={`Etap ${indeks + 1}`}>
            <input
              style={s.input}
              value={etap.nazwa || ""}
              onChange={(e) => {
                const etapy = form.etapy.slice();
                etapy[indeks] = { ...etap, nazwa: e.target.value };
                ustaw("etapy", etapy);
              }}
            />
          </Pole>
          <Pole styles={s} etykieta="Plan netto etapu">
            <input
              style={s.input}
              value={etap.plan_kwota_netto || ""}
              onChange={(e) => {
                const etapy = form.etapy.slice();
                etapy[indeks] = { ...etap, plan_kwota_netto: e.target.value };
                ustaw("etapy", etapy);
              }}
            />
          </Pole>
          <Pole styles={s} etykieta="Data faktury etapu">
            <input
              style={s.input}
              type="date"
              value={String(etap.plan_data_faktury || "").slice(0, 10)}
              onChange={(e) => {
                const etapy = form.etapy.slice();
                etapy[indeks] = { ...etap, plan_data_faktury: e.target.value };
                ustaw("etapy", etapy);
              }}
            />
          </Pole>
          <label style={s.label}>
            <input
              type="checkbox"
              checked={etap.status === "anulowany"}
              onChange={(e) => {
                const etapy = form.etapy.slice();
                etapy[indeks] = { ...etap, status: e.target.checked ? "anulowany" : "aktywny" };
                ustaw("etapy", etapy);
              }}
            />{" "}
            etap anulowany
          </label>
        </div>
      ))}
      <button
        type="button"
        style={s.btnGhost}
        onClick={() => ustaw("etapy", [...(form.etapy || []), { nazwa: "", status: "aktywny", status_ceny: "do_ustalenia", plan_kwota_netto: "" }])}
      >
        Dodaj etap
      </button>
      <h4 style={{ margin: "0.8rem 0 0.3rem" }}>Po wykonaniu — oddanie, sprawdzenie i odbiór to osobne stany</h4>
      <Pole styles={s} etykieta="Data oddania">
        <input style={s.input} type="date" value={String(form.data_oddania || "").slice(0, 10)} onChange={(e) => ustaw("data_oddania", e.target.value)} />
      </Pole>
      <Pole styles={s} etykieta="Wynik sprawdzenia">
        <input style={s.input} value={form.wynik_sprawdzenia} onChange={(e) => ustaw("wynik_sprawdzenia", e.target.value)} />
      </Pole>
      <label style={s.label}>
        <input type="checkbox" checked={!!form.czy_sprawdzone} onChange={(e) => ustaw("czy_sprawdzone", e.target.checked)} /> sprawdzone
      </label>
      <label style={s.label}>
        <input type="checkbox" checked={!!form.czy_odebrane} onChange={(e) => ustaw("czy_odebrane", e.target.checked)} /> odebrane
      </label>
      <Pole styles={s} etykieta="Data odbioru">
        <input style={s.input} type="date" value={String(form.data_odbioru || "").slice(0, 10)} onChange={(e) => ustaw("data_odbioru", e.target.value)} />
      </Pole>
      <Pole styles={s} etykieta="Źródło potwierdzenia odbioru">
        <input style={s.input} value={form.zrodlo_odbioru} onChange={(e) => ustaw("zrodlo_odbioru", e.target.value)} />
      </Pole>
      {zlecenie?.zakres_zmieniono ? (
        <p style={s.muted}>Zakres zmienił {zlecenie.zakres_zmienil || "—"} {zlecenie.zakres_zmieniono}.</p>
      ) : null}
      {zlecenie?.termin_zmieniono ? (
        <p style={s.muted}>Termin zmienił {zlecenie.termin_zmienil || "—"} {zlecenie.termin_zmieniono}.</p>
      ) : null}
      {historia.length ? (
        <ul style={s.muted}>
          {historia.map((wpis, indeks) => (
            <li key={`${wpis.created_at}-${indeks}`}>
              Aneks ceny: {wpis.cena_netto_poprzednia} → {wpis.cena_netto_nowa}, {wpis.autor_pracownik_nr || "autor"}, {wpis.created_at}
            </li>
          ))}
        </ul>
      ) : null}
      <div style={s.btnRow}>
        <button type="submit" style={s.btn} disabled={zapisuje || !dostep.zapis}>
          {form.status === "potwierdzone" ? "Potwierdź zlecenie" : "Zapisz szkic"}
        </button>
        <button type="button" style={s.btnGhost} onClick={onAnuluj}>Anuluj</button>
      </div>
    </form>
  );
}
