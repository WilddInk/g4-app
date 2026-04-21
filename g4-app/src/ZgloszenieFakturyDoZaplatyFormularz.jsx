import { memo, useEffect, useState } from "react";
import { s } from "./styles/appDashboardStyles.js";
import { identyfikatorPodatkowyZnormalizowany, nipPolskiCyfry } from "./utils/vatId.js";

function fakturaDoZaplatyPustyForm() {
  return {
    sprzedawca_nip: "",
    sprzedawca_nazwa: "",
    komu: "",
    nr_konta: "",
    kwota_brutto: "",
    link_faktury: "",
    numer_faktury: "",
    zgloszil_pracownik_nr: "",
    notatki: "",
  };
}

/**
 * Zgłoszenie faktury do opłacenia przy otwartym KR — **lokalny stan**, żeby pisanie
 * nie powodowało przeładowania całego `App`.
 */
export const ZgloszenieFakturyDoZaplatyFormularz = memo(function ZgloszenieFakturyDoZaplatyFormularz({
  krKod,
  mapaSprzedawcaPoNip,
  pracownicyPosortowani,
  onWyslij,
}) {
  const [form, setForm] = useState(() => fakturaDoZaplatyPustyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const pol = nipPolskiCyfry(form.sprzedawca_nip);
    const idNorm = identyfikatorPodatkowyZnormalizowany(form.sprzedawca_nip);
    const nipDoLookup = pol.length === 10 ? pol : idNorm;
    if (!nipDoLookup) return;
    if (String(form.sprzedawca_nazwa ?? "").trim() !== "") return;
    const znanaNazwa = mapaSprzedawcaPoNip.get(nipDoLookup);
    if (!znanaNazwa) return;
    setForm((f) => {
      const polF = nipPolskiCyfry(f.sprzedawca_nip);
      const idF = identyfikatorPodatkowyZnormalizowany(f.sprzedawca_nip);
      const lookupF = polF.length === 10 ? polF : idF;
      if (lookupF !== nipDoLookup) return f;
      if (String(f.sprzedawca_nazwa ?? "").trim() !== "") return f;
      return { ...f, sprzedawca_nazwa: znanaNazwa };
    });
  }, [form.sprzedawca_nip, form.sprzedawca_nazwa, mapaSprzedawcaPoNip]);

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const ok = await onWyslij(form, krKod);
      if (ok) setForm(fakturaDoZaplatyPustyForm());
    } finally {
      setSaving(false);
    }
  }

  const krEtykieta = String(krKod ?? "").trim() || "—";

  return (
    <>
      <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e2e8f0", margin: "0 0 0.65rem" }}>
        Nowe zgłoszenie (projekt {krEtykieta})
      </h4>
      <form style={{ ...s.form, maxWidth: "min(40rem, 100%)" }} onSubmit={(e) => void handleSubmit(e)}>
        <label style={s.label}>
          NIP / VAT sprzedawcy
          <input
            style={s.input}
            type="text"
            value={form.sprzedawca_nip}
            onChange={(ev) =>
              setForm((f) => ({
                ...f,
                sprzedawca_nip: identyfikatorPodatkowyZnormalizowany(ev.target.value),
              }))
            }
            placeholder="np. 5250001009 lub DE123456789"
          />
        </label>
        <label style={s.label}>
          Sprzedawca
          <input
            style={s.input}
            type="text"
            value={form.sprzedawca_nazwa}
            onChange={(ev) => setForm((f) => ({ ...f, sprzedawca_nazwa: ev.target.value }))}
            placeholder="np. ABC Serwis Sp. z o.o."
          />
        </label>
        <label style={s.label}>
          Odbiorca <span style={{ color: "#fca5a5" }}>*</span>
          <input
            style={s.input}
            type="text"
            value={form.komu}
            onChange={(ev) => setForm((f) => ({ ...f, komu: ev.target.value }))}
            required
            placeholder="np. nazwa firmy z faktury"
          />
        </label>
        <label style={s.label}>
          Nr konta bankowego
          <input
            style={s.input}
            type="text"
            value={form.nr_konta}
            onChange={(ev) => setForm((f) => ({ ...f, nr_konta: ev.target.value }))}
            placeholder="np. 12 3456…"
          />
        </label>
        <label style={s.label}>
          Kwota brutto <span style={{ color: "#fca5a5" }}>*</span>
          <input
            style={s.input}
            type="text"
            inputMode="decimal"
            value={form.kwota_brutto}
            onChange={(ev) => setForm((f) => ({ ...f, kwota_brutto: ev.target.value }))}
            required
            placeholder="np. 1234,56"
          />
        </label>
        <label style={s.label}>
          Nr faktury (opcjonalnie)
          <input
            style={s.input}
            type="text"
            value={form.numer_faktury}
            onChange={(ev) => setForm((f) => ({ ...f, numer_faktury: ev.target.value }))}
          />
        </label>
        <label style={s.label}>
          Link do faktury / skanu (opcjonalnie)
          <input
            style={s.input}
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={form.link_faktury}
            onChange={(ev) => setForm((f) => ({ ...f, link_faktury: ev.target.value }))}
            placeholder="https://…"
          />
        </label>
        <label style={s.label}>
          Zgłasza — <code style={s.code}>pracownik.nr</code>
          <select
            style={s.input}
            value={String(form.zgloszil_pracownik_nr ?? "")}
            onChange={(ev) => setForm((f) => ({ ...f, zgloszil_pracownik_nr: ev.target.value }))}
          >
            <option value="">— bez wyboru —</option>
            {(() => {
              const cur = String(form.zgloszil_pracownik_nr ?? "").trim();
              const nrs = new Set(pracownicyPosortowani.map((p) => String(p.nr)));
              const orphan = cur !== "" && !nrs.has(cur);
              return (
                <>
                  {orphan ? <option value={cur}>{cur} (nie w liście)</option> : null}
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
          Notatki (opcjonalnie)
          <textarea
            style={{ ...s.input, minHeight: "2.8rem" }}
            value={form.notatki}
            onChange={(ev) => setForm((f) => ({ ...f, notatki: ev.target.value }))}
            rows={2}
          />
        </label>
        <div style={s.btnRow}>
          <button type="submit" style={s.btn} disabled={saving}>
            {saving ? "Wysyłanie…" : "Zgłoś do opłacenia"}
          </button>
        </div>
      </form>
    </>
  );
});
