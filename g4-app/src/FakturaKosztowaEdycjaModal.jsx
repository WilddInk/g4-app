import { memo, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { op } from "./operationalShell.jsx";
import { s } from "./styles/appDashboardStyles.js";
import { tekstTrim } from "./utils/dateText.js";
import {
  identyfikatorPodatkowyZnormalizowany,
  nazwaSprzedawcyZMapy,
  nipPolskiCyfry,
} from "./utils/vatId.js";

function sciezkaWindows(raw) {
  return String(raw ?? "").trim().replace(/\//g, "\\");
}

function komendaExplorerSelect(rawPath) {
  const p = sciezkaWindows(rawPath);
  if (!p) return "";
  return `explorer /select,"${p}"`;
}

function hrefLinkuZewnetrznego(raw) {
  const s = raw != null ? String(raw).trim() : "";
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

function etykietaStatusuFaktury(st) {
  const x = String(st ?? "").trim();
  if (x === "do_zaplaty") return "Do opłacenia";
  if (x === "oplacone") return "Opłacone";
  if (x === "anulowane") return "Anulowane";
  return x || "—";
}

/** Obwódka „okna” pola (label + kontrolka), gdy brak wymaganych / oczekiwanych danych — wyraźnie czerwona. */
const FAKTURA_EDYCJA_BRAK_DANYCH_OKNO = {
  borderRadius: "12px",
  border: "2px solid #dc2626",
  boxShadow: "0 0 0 1px #7f1d1d, 0 0 16px rgba(220,38,38,0.5)",
  backgroundColor: "rgba(69,10,10,0.28)",
  padding: "0.5rem 0.55rem",
  boxSizing: "border-box",
};

function kwotaFormularzDoLiczby(raw) {
  const t = String(raw ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  if (t === "") return null;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

/** Porównanie „czy jest co zapisać” — kolejność kluczy nie ma znaczenia. */
function jsonFormularzFakturyStabilny(obj) {
  if (!obj || typeof obj !== "object") return "";
  const keys = Object.keys(obj).sort();
  const o = {};
  for (const k of keys) o[k] = obj[k];
  return JSON.stringify(o);
}

const FAKTURA_EDYCJA_AUTO_ZAPIS_MS = 1400;

export const FakturaKosztowaEdycjaModal = memo(function FakturaKosztowaEdycjaModal({
  rowId,
  initialForm,
  layout,
  odbiorcaOpcje,
  statusyWbazie,
  saving,
  mapaSprzedawcaPoNip,
  pracownicyPosortowani,
  opcjeRodzajuKosztu,
  opcjeTypu,
  onCancel,
  onSave,
}) {
  const [form, setForm] = useState(initialForm);
  const [platnikPodpowiedziAktywne, setPlatnikPodpowiedziAktywne] = useState(false);
  const [autoZapisStan, setAutoZapisStan] = useState("idle");
  const sciezkaLokalnaInputRef = useRef(null);
  const linkBoxInputRef = useRef(null);
  /** Zawsze aktualny stan formularza przy kliknięciu Zapisz (unika pustego link_faktury przy szybkim zapisie). */
  const formRef = useRef(initialForm);
  const onSaveRef = useRef(onSave);
  const savingRef = useRef(saving);
  const ostatniZapisanyJsonRef = useRef("");

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  /** Po otwarciu / odświeżeniu z serwera — punkt odniesienia dla auto-zapisu (bez natychmiastowego PATCH). */
  useLayoutEffect(() => {
    if (!initialForm) return;
    ostatniZapisanyJsonRef.current = jsonFormularzFakturyStabilny({
      ...initialForm,
      link_faktury: String(initialForm.link_faktury ?? "").trim(),
    });
  }, [initialForm, rowId]);

  /** Link Box: przy zapisie bierzemy tekst z inputu (zsynchronizowany z Reactem, ale bez opóźnienia ref). */
  function formularzDoZapisu() {
    const b = formRef.current;
    if (!b) return b;
    const link = linkBoxInputRef.current
      ? String(linkBoxInputRef.current.value ?? "").trim()
      : String(b.link_faktury ?? "").trim();
    return { ...b, link_faktury: link };
  }

  useEffect(() => {
    if (!form) return;
    const uchwyt = window.setTimeout(() => {
      const gotowe = formularzDoZapisu();
      if (!gotowe) return;
      const json = jsonFormularzFakturyStabilny(gotowe);
      if (json === ostatniZapisanyJsonRef.current) return;
      const kw = kwotaFormularzDoLiczby(gotowe.kwota_brutto);
      if (kw == null || kw < 0) return;
      if (savingRef.current) return;
      void (async () => {
        setAutoZapisStan("zapisuje");
        try {
          const wynik = await onSaveRef.current(gotowe, { zamknijPoZapisie: false, autoWBiegu: true });
          if (wynik?.ok) {
            ostatniZapisanyJsonRef.current = json;
            setAutoZapisStan("zapisano");
            window.setTimeout(() => {
              setAutoZapisStan((s) => (s === "zapisano" ? "idle" : s));
            }, 2200);
          } else if (wynik && wynik.silent === false) {
            setAutoZapisStan("blad");
          } else {
            setAutoZapisStan("idle");
          }
        } catch {
          setAutoZapisStan("blad");
        }
      })();
    }, FAKTURA_EDYCJA_AUTO_ZAPIS_MS);
    return () => window.clearTimeout(uchwyt);
  }, [form, rowId]);

  useLayoutEffect(() => {
    const el = sciezkaLokalnaInputRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [initialForm]);

  useEffect(() => {
    const pol = nipPolskiCyfry(form.sprzedawca_nip);
    const idNorm = identyfikatorPodatkowyZnormalizowany(form.sprzedawca_nip);
    const nipDoLookup = pol.length === 10 ? pol : idNorm;
    if (!nipDoLookup) return;
    if (String(form.sprzedawca_nazwa ?? "").trim() !== "") return;
    const nazwaZeSlownika = nazwaSprzedawcyZMapy(mapaSprzedawcaPoNip, form.sprzedawca_nip);
    if (!nazwaZeSlownika) return;
    setForm((f) => {
      if (!f) return f;
      const polF = nipPolskiCyfry(f.sprzedawca_nip);
      const idF = identyfikatorPodatkowyZnormalizowany(f.sprzedawca_nip);
      const lookupF = polF.length === 10 ? polF : idF;
      if (lookupF !== nipDoLookup) return f;
      if (String(f.sprzedawca_nazwa ?? "").trim() !== "") return f;
      return { ...f, sprzedawca_nazwa: nazwaZeSlownika };
    });
  }, [form.sprzedawca_nip, form.sprzedawca_nazwa, mapaSprzedawcaPoNip]);

  const platnikQueryOdroczony = useDeferredValue(tekstTrim(form.legacy_payer_name).toLowerCase());
  const platnikPodpowiedzi = useMemo(() => {
    const q = platnikQueryOdroczony;
    if (!q) return [];
    return pracownicyPosortowani
      .filter((p) => {
        const im = tekstTrim(p.imie_nazwisko).toLowerCase();
        const nr = String(p.nr ?? "").toLowerCase();
        return im.includes(q) || nr.includes(q);
      })
      .slice(0, 14);
  }, [platnikQueryOdroczony, pracownicyPosortowani]);

  const brak = useMemo(() => {
    const data = !tekstTrim(form?.data_faktury);
    const numer = !tekstTrim(form?.numer_faktury);
    const id = identyfikatorPodatkowyZnormalizowany(form?.sprzedawca_nip);
    const nipZnany = id.length >= 5 || nipPolskiCyfry(form?.sprzedawca_nip).length === 10;
    const sprzedawca = !!tekstTrim(form?.sprzedawca_nazwa);
    const maSprzedawce = sprzedawca || nipZnany;
    const sprzedawcaBlok = !maSprzedawce;
    const odbiorca = !tekstTrim(form?.komu);
    const platnik = !tekstTrim(form?.legacy_payer_name) && !tekstTrim(form?.platnik_id);
    const rodzaj = !tekstTrim(form?.rodzaj_kosztu);
    const typ = !tekstTrim(form?.typ_nazwy);
    const kwBr = kwotaFormularzDoLiczby(form?.kwota_brutto);
    const brutto = kwBr == null || kwBr < 0;
    const sciezka = !tekstTrim(form?.legacy_pdf_file);
    const link = !tekstTrim(form?.link_faktury);
    const kr = !tekstTrim(form?.kr);
    return {
      data,
      numer,
      sprzedawcaBlok,
      odbiorca,
      platnik,
      rodzaj,
      typ,
      brutto,
      sciezka,
      link,
      kr,
    };
  }, [form]);

  if (!form) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,23,0.72)",
        zIndex: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onCancel}
    >
      <div
        style={{ ...op.sectionCard, width: "min(900px, 96vw)", maxHeight: "88vh", overflowY: "auto" }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3 style={{ ...op.sectionTitle, marginTop: 0, marginBottom: "0.35rem" }}>Edycja faktury #{rowId}</h3>
        <p style={{ ...s.muted, margin: "0 0 0.5rem", fontSize: "0.78rem", lineHeight: 1.45 }}>
          Automatyczny zapis w tle ok. {FAKTURA_EDYCJA_AUTO_ZAPIS_MS / 1000} s po ostatniej zmianie (wymagana poprawna kwota
          brutto). Przyciski „Zapisz” nadal możesz użyć w dowolnym momencie.
          {autoZapisStan === "zapisuje" ? (
            <span style={{ color: "#fde68a", marginLeft: "0.35rem" }}>— Zapisuję w tle…</span>
          ) : null}
          {autoZapisStan === "zapisano" ? (
            <span style={{ color: "#86efac", marginLeft: "0.35rem" }}>— Zapisano w tle.</span>
          ) : null}
          {autoZapisStan === "blad" ? (
            <span style={{ color: "#fca5a5", marginLeft: "0.35rem" }}>
              — Auto-zapis nie powiódł się (sprawdź konsolę / sieć); użyj „Zapisz”.
            </span>
          ) : null}
        </p>
        <div style={layout.kolumna}>
          <div style={layout.wiersz}>
            <label style={{ ...s.label, ...layout.komorka2, ...(brak.kr ? FAKTURA_EDYCJA_BRAK_DANYCH_OKNO : {}) }}>
              Kod KR (projekt)
              <input
                style={s.input}
                type="text"
                value={form.kr ?? ""}
                onChange={(ev) => setForm((f) => ({ ...f, kr: ev.target.value }))}
                placeholder="np. 1070"
                autoComplete="off"
              />
            </label>
            <div style={{ ...layout.komorka2, alignSelf: "flex-end", paddingBottom: "0.35rem" }}>
              <p style={{ ...s.muted, margin: 0, fontSize: "0.78rem", lineHeight: 1.4 }}>
                Przypisanie do innego KR zapisuje się w bazie razem z pozostałymi polami (auto-zapis lub Zapisz).
              </p>
            </div>
          </div>
          <div style={layout.wiersz}>
            <label style={{ ...s.label, ...layout.komorka2, ...(brak.data ? FAKTURA_EDYCJA_BRAK_DANYCH_OKNO : {}) }}>
              Data faktury
              <input
                style={s.input}
                type="date"
                value={form.data_faktury}
                onChange={(ev) => setForm((f) => ({ ...f, data_faktury: ev.target.value }))}
              />
            </label>
            <label style={{ ...s.label, ...layout.komorka2, ...(brak.numer ? FAKTURA_EDYCJA_BRAK_DANYCH_OKNO : {}) }}>
              Nr faktury
              <input
                style={s.input}
                type="text"
                value={form.numer_faktury}
                onChange={(ev) => setForm((f) => ({ ...f, numer_faktury: ev.target.value }))}
              />
            </label>
          </div>
          <div style={layout.wiersz}>
            <label
              style={{ ...s.label, ...layout.komorka2, ...(brak.sprzedawcaBlok ? FAKTURA_EDYCJA_BRAK_DANYCH_OKNO : {}) }}
            >
              NIP / VAT sprzedawcy
              <input
                style={s.input}
                type="text"
                value={form.sprzedawca_nip}
                onChange={(ev) =>
                  setForm((f) => ({ ...f, sprzedawca_nip: identyfikatorPodatkowyZnormalizowany(ev.target.value) }))
                }
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") ev.preventDefault();
                }}
              />
            </label>
            <label
              style={{ ...s.label, ...layout.komorka2, ...(brak.sprzedawcaBlok ? FAKTURA_EDYCJA_BRAK_DANYCH_OKNO : {}) }}
            >
              Sprzedawca
              <input
                style={s.input}
                type="text"
                value={form.sprzedawca_nazwa}
                onChange={(ev) => setForm((f) => ({ ...f, sprzedawca_nazwa: ev.target.value }))}
              />
            </label>
          </div>
          <div style={layout.wiersz}>
            <label style={{ ...s.label, ...layout.komorka2, ...(brak.odbiorca ? FAKTURA_EDYCJA_BRAK_DANYCH_OKNO : {}) }}>
              Odbiorca (firma G4)
              <select
                style={s.input}
                value={String(form.komu ?? "")}
                onChange={(ev) => setForm((f) => ({ ...f, komu: ev.target.value }))}
              >
                <option value="">— wybierz —</option>
                {(() => {
                  const cur = String(form.komu ?? "").trim();
                  const known = new Set(odbiorcaOpcje);
                  const orphan = cur !== "" && !known.has(cur);
                  return (
                    <>
                      {orphan ? <option value={cur}>{cur} (z bazy)</option> : null}
                      {odbiorcaOpcje.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </label>
            <div
              style={{
                ...layout.komorka2,
                position: "relative",
                alignSelf: "stretch",
                ...(brak.platnik ? FAKTURA_EDYCJA_BRAK_DANYCH_OKNO : {}),
              }}
            >
              <label style={{ ...s.label, display: "block", width: "100%" }}>
                Płatnik (Zespół)
                <input
                  style={s.input}
                  type="text"
                  autoComplete="off"
                  value={form.legacy_payer_name}
                  onChange={(ev) =>
                    setForm((f) => ({
                      ...f,
                      legacy_payer_name: ev.target.value,
                      platnik_id: "",
                    }))
                  }
                  onFocus={() => setPlatnikPodpowiedziAktywne(true)}
                  onBlur={() => {
                    window.setTimeout(() => setPlatnikPodpowiedziAktywne(false), 180);
                  }}
                  placeholder="Zacznij pisać imię i nazwisko lub nr…"
                />
              </label>
              {platnikPodpowiedziAktywne && platnikPodpowiedzi.length > 0 ? (
                <ul
                  role="listbox"
                  aria-label="Podpowiedzi pracowników"
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "100%",
                    margin: "0.15rem 0 0",
                    padding: "0.2rem 0",
                    maxHeight: "11rem",
                    overflowY: "auto",
                    listStyle: "none",
                    background: "#0f172a",
                    border: "1px solid rgba(56,189,248,0.35)",
                    borderRadius: "6px",
                    zIndex: 90,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                  }}
                >
                  {platnikPodpowiedzi.map((p) => (
                    <li
                      key={`platnik-podpow-${p.nr}`}
                      role="option"
                      onMouseDown={(ev) => {
                        ev.preventDefault();
                        const naz = tekstTrim(p.imie_nazwisko);
                        setForm((f) => ({
                          ...f,
                          legacy_payer_name: naz,
                          platnik_id: String(p.nr ?? "").trim(),
                        }));
                        setPlatnikPodpowiedziAktywne(false);
                      }}
                      style={{
                        padding: "0.35rem 0.65rem",
                        cursor: "pointer",
                        fontSize: "0.84rem",
                        color: "#e2e8f0",
                      }}
                    >
                      {tekstTrim(p.imie_nazwisko) || "—"}{" "}
                      <span style={{ color: "#7dd3fc", fontSize: "0.78rem" }}>(nr {String(p.nr ?? "").trim()})</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          <div style={layout.wiersz}>
            <label style={{ ...s.label, ...layout.komorka2, ...(brak.rodzaj ? FAKTURA_EDYCJA_BRAK_DANYCH_OKNO : {}) }}>
              Rodzaj kosztu
              <select
                style={s.input}
                value={String(form.rodzaj_kosztu ?? "")}
                onChange={(ev) => setForm((f) => ({ ...f, rodzaj_kosztu: ev.target.value }))}
              >
                <option value="">— wybierz —</option>
                {opcjeRodzajuKosztu.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ ...s.label, ...layout.komorka2, ...(brak.typ ? FAKTURA_EDYCJA_BRAK_DANYCH_OKNO : {}) }}>
              Typ
              <select
                style={s.input}
                value={String(form.typ_nazwy ?? "")}
                onChange={(ev) => setForm((f) => ({ ...f, typ_nazwy: ev.target.value }))}
              >
                <option value="">— wybierz —</option>
                {opcjeTypu.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={layout.wiersz}>
            <label style={{ ...s.label, ...layout.komorka3, ...(brak.brutto ? FAKTURA_EDYCJA_BRAK_DANYCH_OKNO : {}) }}>
              Brutto
              <input
                style={s.input}
                type="text"
                inputMode="decimal"
                value={form.kwota_brutto}
                onChange={(ev) => setForm((f) => ({ ...f, kwota_brutto: ev.target.value }))}
              />
            </label>
            <label style={{ ...s.label, ...layout.komorka3 }}>
              Netto
              <input
                style={s.input}
                type="text"
                inputMode="decimal"
                value={form.kwota_netto}
                onChange={(ev) => setForm((f) => ({ ...f, kwota_netto: ev.target.value }))}
              />
            </label>
            <label style={{ ...s.label, ...layout.komorka3 }}>
              VAT
              <input
                style={s.input}
                type="text"
                inputMode="decimal"
                value={form.kwota_vat}
                onChange={(ev) => setForm((f) => ({ ...f, kwota_vat: ev.target.value }))}
              />
            </label>
          </div>
          <div style={layout.wiersz}>
            <label style={{ ...s.label, ...layout.komorka2, ...(brak.sciezka ? FAKTURA_EDYCJA_BRAK_DANYCH_OKNO : {}) }}>
              Ścieżka lokalna{" "}
              <span style={{ ...s.muted, fontWeight: 400 }}>
                (tylko odczyt — import z folderu; nie blokuje zapisu pozostałych pól)
              </span>
              <input
                ref={sciezkaLokalnaInputRef}
                readOnly
                style={{
                  ...s.input,
                  overflowX: "auto",
                  cursor: "default",
                  backgroundColor: "rgba(15,23,42,0.55)",
                  color: "#cbd5e1",
                }}
                type="text"
                value={form.legacy_pdf_file ?? ""}
                onFocus={(ev) => {
                  const el = ev.currentTarget;
                  requestAnimationFrame(() => {
                    el.scrollLeft = el.scrollWidth;
                  });
                }}
                title={tekstTrim(form.legacy_pdf_file) ? String(form.legacy_pdf_file) : undefined}
              />
              <div style={{ ...s.btnRow, marginTop: "0.2rem" }}>
                <button
                  type="button"
                  style={{ ...s.btnGhost, fontSize: "0.74rem", padding: "0.2rem 0.38rem" }}
                  disabled={!tekstTrim(form.legacy_pdf_file)}
                  onClick={() => navigator.clipboard?.writeText(komendaExplorerSelect(form.legacy_pdf_file))}
                  title='Kopiuje komendę: explorer /select,"...". Wklej w PowerShell.'
                >
                  Fold
                </button>
              </div>
            </label>
            <label style={{ ...s.label, ...layout.komorka2, ...(brak.link ? FAKTURA_EDYCJA_BRAK_DANYCH_OKNO : {}) }}>
              Link Box
              <input
                ref={linkBoxInputRef}
                style={s.input}
                type="text"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://…"
                value={form.link_faktury}
                onChange={(ev) => setForm((f) => ({ ...f, link_faktury: ev.target.value }))}
              />
              <div style={{ ...s.btnRow, marginTop: "0.2rem" }}>
                <button
                  type="button"
                  style={{ ...s.btnGhost, fontSize: "0.74rem", padding: "0.2rem 0.38rem" }}
                  disabled={!tekstTrim(form.link_faktury)}
                  onClick={() => window.open(hrefLinkuZewnetrznego(form.link_faktury), "_blank", "noopener,noreferrer")}
                >
                  Link Box
                </button>
              </div>
            </label>
          </div>
          <div style={layout.wiersz}>
            <label style={{ ...s.label, ...layout.komorka2 }}>
              Opłacone (status)
              <select
                style={s.input}
                value={form.status}
                onChange={(ev) => setForm((f) => ({ ...f, status: ev.target.value }))}
              >
                {statusyWbazie.map((v) => (
                  <option key={v} value={v}>
                    {etykietaStatusuFaktury(v)}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ ...s.label, ...layout.komorka2 }}>
              Nr konta
              <input
                style={s.input}
                type="text"
                value={form.nr_konta}
                onChange={(ev) => setForm((f) => ({ ...f, nr_konta: ev.target.value }))}
                placeholder="Opcjonalnie — np. przy odłożonej płatności"
              />
            </label>
          </div>
        </div>
        <div style={{ ...s.btnRow, marginTop: "0.7rem", flexWrap: "wrap", gap: "0.45rem" }}>
          <button
            type="button"
            style={s.btnGhost}
            disabled={saving}
            onClick={() => void onSave(formularzDoZapisu(), { zamknijPoZapisie: false, autoWBiegu: false })}
            title="Zapisuje zmiany w bazie i zostawia okno edycji otwarte"
          >
            {saving ? "Zapisywanie…" : "Zapisz (nie zamykaj)"}
          </button>
          <button
            type="button"
            style={s.btnGhost}
            disabled={saving}
            onClick={onCancel}
            title="Zamyka okno bez zapisu"
          >
            Anuluj (zamknij)
          </button>
          <button
            type="button"
            style={s.btn}
            disabled={saving}
            onClick={() => void onSave(formularzDoZapisu(), { zamknijPoZapisie: true, autoWBiegu: false })}
            title="Zapisuje i zamyka okno"
          >
            {saving ? "Zapisywanie…" : "Zapisz (zamknij)"}
          </button>
        </div>
      </div>
    </div>
  );
});
