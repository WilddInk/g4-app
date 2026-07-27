import { useCallback, useEffect, useMemo, useState } from "react";

function formatPln(n) {
  if (n == null || n === "") return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
}

function formatPct(n) {
  if (n == null || n === "") return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `${v.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} %`;
}

function parseKwota(raw) {
  const s = String(raw ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  if (!s) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

/** Jak w SQL kr_ter_norm_kr — „1070” ≡ „KR1070”. */
function normKr(raw) {
  const t = String(raw ?? "")
    .trim()
    .replace(/^kr\s*/i, "")
    .trim()
    .toLowerCase();
  return t || "";
}

/**
 * Mechanizm TER / protokoły + FS: suma kontraktu, postęp protokołami, zafakturowane FS.
 * Excel = szablon katalogu; protokoły wypełniane progresywnie.
 * Handlowo: pozostalo_kontrakt = suma_kontraktu − suma_faktur_fs.
 * Protokoły: pozostalo_po_protokolach = suma_kontraktu − suma_protokolow.
 */
export function ProtokolyTerPanel({ supabase, styles: s, op, czyMozeEdytowac, krList = [] }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wybraneId, setWybraneId] = useState(null);
  const [pozycje, setPozycje] = useState([]);
  const [protokoly, setProtokoly] = useState([]);
  const [linieByProt, setLinieByProt] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [naglowekDraft, setNaglowekDraft] = useState({ nazwa: "", firma: "", suma: "" });
  const [nowaPoz, setNowaPoz] = useState({ lp: "", opis: "", jm: "", ilosc: "", cena: "", wartosc: "" });
  const [nowyProt, setNowyProt] = useState({ nr_kolejny: "", data: "", okres_od: "", okres_do: "", uwagi: "" });
  const [liniaDraftByProt, setLiniaDraftByProt] = useState({});
  const [editPozById, setEditPozById] = useState({});
  const [editProtById, setEditProtById] = useState({});
  const [noweKr, setNoweKr] = useState({ kr: "", klient: "", nazwa: "", suma: "" });
  const [wyborKrSelect, setWyborKrSelect] = useState("");
  const [wyborBusy, setWyborBusy] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("v_kr_ter_podsumowanie")
      .select("*")
      .order("kr", { ascending: true });
    setLoading(false);
    if (error) {
      const m = String(error.message ?? "");
      setErr(
        /v_kr_ter_podsumowanie|kr_ter_rozliczenie|schema cache|PGRST205|does not exist/i.test(m)
          ? "Brak tabel TER/protokołów. Uruchom w Supabase SQL: g4-app/supabase/kr-ter-protokoly.sql, potem kr-ter-protokoly-faktury.sql (FS), opcjonalnie kr-ter-protokoly-seed.sql"
          : m,
      );
      setRows([]);
      return;
    }
    setRows(data ?? []);
  }, [supabase]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const wybrane = useMemo(
    () => (rows ?? []).find((r) => Number(r.rozliczenie_id) === Number(wybraneId)) ?? null,
    [rows, wybraneId],
  );

  const krOpcje = useMemo(() => {
    const map = new Map();
    for (const k of krList ?? []) {
      const kod = String(k?.kr ?? "").trim();
      if (!kod) continue;
      const n = normKr(kod);
      if (!n || map.has(n)) continue;
      map.set(n, {
        kr: kod,
        nazwa: String(k.nazwa_obiektu ?? "").trim(),
        klient: String(k.zleceniodawca ?? k.klient ?? "").trim(),
      });
    }
    for (const r of rows ?? []) {
      const kod = String(r?.kr ?? "").trim();
      if (!kod) continue;
      const n = normKr(kod);
      if (!n || map.has(n)) continue;
      map.set(n, {
        kr: kod,
        nazwa: String(r.nazwa_kontraktu ?? "").trim(),
        klient: String(r.klient ?? "").trim(),
      });
    }
    return [...map.values()].sort((a, b) =>
      a.kr.localeCompare(b.kr, "pl", { numeric: true, sensitivity: "base" }),
    );
  }, [krList, rows]);

  useEffect(() => {
    if (wybrane?.kr) setWyborKrSelect(String(wybrane.kr));
  }, [wybrane?.kr]);

  function znajdzRozliczenieDlaKr(kodKr) {
    const n = normKr(kodKr);
    if (!n) return null;
    return (rows ?? []).find((r) => normKr(r.kr) === n) ?? null;
  }

  async function wybierzKrZListy(kodKr) {
    const kod = String(kodKr ?? "").trim();
    setWyborKrSelect(kod);
    if (!kod) {
      setWybraneId(null);
      return;
    }
    const istniejace = znajdzRozliczenieDlaKr(kod);
    if (istniejace) {
      setWybraneId(istniejace.rozliczenie_id);
      setMsg(null);
      return;
    }
    if (!czyMozeEdytowac) {
      setWybraneId(null);
      setMsg(`Brak rozliczenia TER dla KR ${kod}. Poproś kierownika/admina o dodanie.`);
      return;
    }
    const meta = krOpcje.find((o) => normKr(o.kr) === normKr(kod)) ?? { kr: kod, nazwa: "", klient: "" };
    setWyborBusy(true);
    setMsg(null);
    const { data, error } = await supabase
      .from("kr_ter_rozliczenie")
      .insert({
        kr: meta.kr || kod,
        klient: meta.klient || null,
        nazwa_kontraktu: meta.nazwa || null,
        suma_kontraktu: 0,
        zrodlo: "z_listy_kr",
      })
      .select("id")
      .single();
    setWyborBusy(false);
    if (error) {
      setMsg(`Nie udało się otworzyć KR ${kod}: ${error.message}`);
      return;
    }
    setMsg(`Utworzono rozliczenie TER dla KR ${kod} (suma kontraktu = 0 — uzupełnij).`);
    await fetchRows();
    if (data?.id) setWybraneId(data.id);
  }

  const fetchDetail = useCallback(
    async (rozliczenieId) => {
      if (!rozliczenieId) {
        setPozycje([]);
        setProtokoly([]);
        setLinieByProt({});
        return;
      }
      setDetailLoading(true);
      setMsg(null);
      const rid = Number(rozliczenieId);
      const [{ data: poz, error: e1 }, { data: prot, error: e2 }] = await Promise.all([
        supabase
          .from("v_kr_ter_pozycja_pozostalo")
          .select("*")
          .eq("rozliczenie_id", rid)
          .order("kolejnosc", { ascending: true }),
        supabase
          .from("kr_ter_protokol")
          .select("*")
          .eq("rozliczenie_id", rid)
          .order("nr_kolejny", { ascending: true }),
      ]);
      if (e1 || e2) {
        setMsg(`Błąd szczegółów: ${(e1 || e2).message}`);
        setDetailLoading(false);
        return;
      }
      const protList = prot ?? [];
      setPozycje(poz ?? []);
      setProtokoly(protList);
      const ids = protList.map((p) => p.id).filter(Boolean);
      if (ids.length === 0) {
        setLinieByProt({});
        setDetailLoading(false);
        return;
      }
      const { data: linie, error: e3 } = await supabase
        .from("kr_ter_protokol_linia")
        .select("*")
        .in("protokol_id", ids)
        .order("id", { ascending: true });
      if (e3) {
        setMsg(`Błąd linii protokołów: ${e3.message}`);
        setLinieByProt({});
      } else {
        const map = {};
        for (const l of linie ?? []) {
          const pid = l.protokol_id;
          if (!map[pid]) map[pid] = [];
          map[pid].push(l);
        }
        setLinieByProt(map);
      }
      setDetailLoading(false);
    },
    [supabase],
  );

  useEffect(() => {
    if (wybrane) {
      setNaglowekDraft({
        nazwa: String(wybrane.nazwa_kontraktu ?? ""),
        firma: String(wybrane.klient ?? ""),
        suma: String(wybrane.suma_kontraktu ?? ""),
      });
      setEditPozById({});
      setEditProtById({});
      void fetchDetail(wybrane.rozliczenie_id);
    } else {
      setNaglowekDraft({ nazwa: "", firma: "", suma: "" });
      setPozycje([]);
      setProtokoly([]);
      setLinieByProt({});
      setEditPozById({});
      setEditProtById({});
    }
  }, [wybrane, fetchDetail]);

  async function zapiszNaglowek() {
    if (!czyMozeEdytowac || !wybrane) return;
    const v = parseKwota(naglowekDraft.suma);
    if (v == null || v < 0) {
      setMsg("Podaj poprawną sumę kontraktu (≥ 0).");
      return;
    }
    setMsg(null);
    const { error } = await supabase
      .from("kr_ter_rozliczenie")
      .update({
        nazwa_kontraktu: String(naglowekDraft.nazwa ?? "").trim() || null,
        klient: String(naglowekDraft.firma ?? "").trim() || null,
        suma_kontraktu: v,
      })
      .eq("id", wybrane.rozliczenie_id);
    if (error) {
      setMsg(`Nie udało się zapisać nagłówka: ${error.message}`);
      return;
    }
    setMsg("Zapisano nagłówek KR (nazwa obiektu, firma, suma).");
    await fetchRows();
  }

  function draftPoz(p) {
    const id = p.pozycja_id;
    return (
      editPozById[id] || {
        lp: String(p.lp ?? ""),
        opis: String(p.opis ?? ""),
        jm: String(p.jm ?? ""),
        ilosc: p.ilosc_umowna != null ? String(p.ilosc_umowna) : "",
        cena: p.cena != null ? String(p.cena) : "",
        wartosc: p.wartosc != null ? String(p.wartosc) : "",
      }
    );
  }

  function setDraftPoz(id, patch) {
    const p = pozycje.find((x) => Number(x.pozycja_id) === Number(id));
    const base =
      editPozById[id] ||
      (p
        ? {
            lp: String(p.lp ?? ""),
            opis: String(p.opis ?? ""),
            jm: String(p.jm ?? ""),
            ilosc: p.ilosc_umowna != null ? String(p.ilosc_umowna) : "",
            cena: p.cena != null ? String(p.cena) : "",
            wartosc: p.wartosc != null ? String(p.wartosc) : "",
          }
        : { lp: "", opis: "", jm: "", ilosc: "", cena: "", wartosc: "" });
    setEditPozById((prev) => ({ ...prev, [id]: { ...base, ...patch } }));
  }

  async function zapiszPozycje(p) {
    if (!czyMozeEdytowac || !wybrane) return;
    const d = draftPoz(p);
    const lp = String(d.lp ?? "").trim();
    const opis = String(d.opis ?? "").trim();
    if (!lp || !opis) {
      setMsg("Etap TER: wymagane lp i opis.");
      return;
    }
    const ilosc = parseKwota(d.ilosc);
    const cena = parseKwota(d.cena);
    let wartosc = parseKwota(d.wartosc);
    if (wartosc == null && ilosc != null && cena != null) wartosc = ilosc * cena;
    setMsg(null);
    const { error } = await supabase
      .from("kr_ter_pozycja")
      .update({
        lp,
        opis,
        jm: String(d.jm ?? "").trim() || null,
        ilosc_umowna: ilosc,
        cena,
        wartosc,
      })
      .eq("id", p.pozycja_id);
    if (error) {
      setMsg(`Nie udało się zapisać etapu: ${error.message}`);
      return;
    }
    setEditPozById((prev) => {
      const next = { ...prev };
      delete next[p.pozycja_id];
      return next;
    });
    setMsg("Zapisano etap TER.");
    await fetchDetail(wybrane.rozliczenie_id);
    await fetchRows();
  }

  function draftProt(pr) {
    const id = pr.id;
    return (
      editProtById[id] || {
        data: pr.data_protokolu ? String(pr.data_protokolu).slice(0, 10) : "",
        okres_od: pr.okres_od ? String(pr.okres_od).slice(0, 10) : "",
        okres_do: pr.okres_do ? String(pr.okres_do).slice(0, 10) : "",
        status: String(pr.status ?? "szkic"),
        uwagi: String(pr.uwagi ?? ""),
      }
    );
  }

  function setDraftProt(id, patch) {
    const pr = protokoly.find((x) => Number(x.id) === Number(id));
    const base =
      editProtById[id] ||
      (pr
        ? {
            data: pr.data_protokolu ? String(pr.data_protokolu).slice(0, 10) : "",
            okres_od: pr.okres_od ? String(pr.okres_od).slice(0, 10) : "",
            okres_do: pr.okres_do ? String(pr.okres_do).slice(0, 10) : "",
            status: String(pr.status ?? "szkic"),
            uwagi: String(pr.uwagi ?? ""),
          }
        : { data: "", okres_od: "", okres_do: "", status: "szkic", uwagi: "" });
    setEditProtById((prev) => ({ ...prev, [id]: { ...base, ...patch } }));
  }

  async function zapiszProtokol(pr) {
    if (!czyMozeEdytowac || !wybrane) return;
    const d = draftProt(pr);
    const status = String(d.status ?? "szkic").trim() || "szkic";
    if (status !== "szkic" && status !== "zatwierdzony") {
      setMsg("Status protokołu: szkic albo zatwierdzony.");
      return;
    }
    setMsg(null);
    const { error } = await supabase
      .from("kr_ter_protokol")
      .update({
        data_protokolu: d.data || null,
        okres_od: d.okres_od || null,
        okres_do: d.okres_do || null,
        status,
        uwagi: String(d.uwagi ?? "").trim() || null,
      })
      .eq("id", pr.id);
    if (error) {
      setMsg(`Nie udało się zapisać protokołu: ${error.message}`);
      return;
    }
    setEditProtById((prev) => {
      const next = { ...prev };
      delete next[pr.id];
      return next;
    });
    setMsg("Zapisano protokół.");
    await fetchDetail(wybrane.rozliczenie_id);
    await fetchRows();
  }

  async function dodajRozliczenie() {
    if (!czyMozeEdytowac) return;
    const kr = String(noweKr.kr ?? "").trim();
    if (!kr) {
      setMsg("Podaj kod KR.");
      return;
    }
    const suma = parseKwota(noweKr.suma) ?? 0;
    setMsg(null);
    const { data, error } = await supabase
      .from("kr_ter_rozliczenie")
      .insert({
        kr,
        klient: String(noweKr.klient ?? "").trim() || null,
        nazwa_kontraktu: String(noweKr.nazwa ?? "").trim() || null,
        suma_kontraktu: suma,
        zrodlo: "reczne",
      })
      .select("id")
      .single();
    if (error) {
      setMsg(`Nie udało się dodać KR: ${error.message}`);
      return;
    }
    setNoweKr({ kr: "", klient: "", nazwa: "", suma: "" });
    setMsg(`Dodano rozliczenie KR ${kr}.`);
    await fetchRows();
    if (data?.id) setWybraneId(data.id);
  }

  async function dodajPozycje() {
    if (!czyMozeEdytowac || !wybrane) return;
    const lp = String(nowaPoz.lp ?? "").trim();
    const opis = String(nowaPoz.opis ?? "").trim();
    if (!lp || !opis) {
      setMsg("Pozycja TER: wymagane lp i opis.");
      return;
    }
    const ilosc = parseKwota(nowaPoz.ilosc);
    const cena = parseKwota(nowaPoz.cena);
    let wartosc = parseKwota(nowaPoz.wartosc);
    if (wartosc == null && ilosc != null && cena != null) wartosc = ilosc * cena;
    setMsg(null);
    const { error } = await supabase.from("kr_ter_pozycja").insert({
      rozliczenie_id: wybrane.rozliczenie_id,
      kr: wybrane.kr,
      lp,
      opis,
      jm: String(nowaPoz.jm ?? "").trim() || null,
      ilosc_umowna: ilosc,
      cena,
      wartosc,
      kolejnosc: (pozycje?.length ?? 0) + 1,
    });
    if (error) {
      setMsg(`Nie udało się dodać pozycji: ${error.message}`);
      return;
    }
    setNowaPoz({ lp: "", opis: "", jm: "", ilosc: "", cena: "", wartosc: "" });
    setMsg("Dodano pozycję TER.");
    await fetchDetail(wybrane.rozliczenie_id);
    await fetchRows();
  }

  async function utworzProtokol() {
    if (!czyMozeEdytowac || !wybrane) return;
    let nr = parseInt(String(nowyProt.nr_kolejny ?? "").trim(), 10);
    if (!Number.isFinite(nr)) {
      const maxNr = protokoly.reduce((m, p) => Math.max(m, Number(p.nr_kolejny) || 0), 0);
      nr = maxNr + 1;
    }
    setMsg(null);
    const { error } = await supabase.from("kr_ter_protokol").insert({
      rozliczenie_id: wybrane.rozliczenie_id,
      kr: wybrane.kr,
      nr_kolejny: nr,
      numer: `${wybrane.kr}/${nr}`,
      data_protokolu: nowyProt.data || null,
      okres_od: nowyProt.okres_od || null,
      okres_do: nowyProt.okres_do || null,
      uwagi: String(nowyProt.uwagi ?? "").trim() || null,
      status: "szkic",
    });
    if (error) {
      setMsg(`Nie udało się utworzyć protokołu: ${error.message}`);
      return;
    }
    setNowyProt({ nr_kolejny: "", data: "", okres_od: "", okres_do: "", uwagi: "" });
    setMsg(`Utworzono protokół ${wybrane.kr}/${nr} (pusty — uzupełnij linie).`);
    await fetchDetail(wybrane.rozliczenie_id);
    await fetchRows();
  }

  async function dodajLinie(protokolId) {
    if (!czyMozeEdytowac || !wybrane) return;
    const draft = liniaDraftByProt[protokolId] || {};
    const wartosc = parseKwota(draft.wartosc);
    if (wartosc == null || wartosc < 0) {
      setMsg("Linia protokołu: podaj wartość okresu (≥ 0).");
      return;
    }
    const pozycjaId = draft.pozycja_id ? Number(draft.pozycja_id) : null;
    const poz = pozycje.find((p) => Number(p.pozycja_id) === pozycjaId);
    setMsg(null);
    const { error } = await supabase.from("kr_ter_protokol_linia").insert({
      protokol_id: protokolId,
      pozycja_id: pozycjaId || null,
      lp: poz?.lp || draft.lp || null,
      opis: poz?.opis || String(draft.opis ?? "").trim() || null,
      jm: poz?.jm || null,
      ilosc_okresu: parseKwota(draft.ilosc),
      wartosc_okresu: wartosc,
    });
    if (error) {
      setMsg(`Nie udało się dodać linii: ${error.message}`);
      return;
    }
    setLiniaDraftByProt((prev) => ({ ...prev, [protokolId]: { wartosc: "", ilosc: "", pozycja_id: "", opis: "" } }));
    setMsg("Dodano linię protokołu — pozostało zaktualizowane.");
    await fetchDetail(wybrane.rozliczenie_id);
    await fetchRows();
  }

  const sumy = useMemo(() => {
    let kontrakt = 0;
    let wyk = 0;
    let fs = 0;
    for (const r of rows ?? []) {
      kontrakt += Number(r.suma_kontraktu) || 0;
      wyk += Number(r.wykonano ?? r.suma_protokolow) || 0;
      fs += Number(r.suma_faktur_fs) || 0;
    }
    return {
      kontrakt,
      wyk,
      fs,
      pozostaloProtokoly: kontrakt - wyk,
      pozostaloKontrakt: kontrakt - fs,
    };
  }, [rows]);

  return (
    <div style={{ ...op.sectionCard, marginTop: "0.85rem" }}>
      <h3 style={{ ...op.sectionTitle, marginTop: 0, marginBottom: "0.35rem" }}>
        TER / protokoły — kontrakt, FS i pozostało
      </h3>
      <p style={{ ...op.muted, marginTop: 0, marginBottom: "0.75rem", fontSize: "0.84rem", maxWidth: "54rem" }}>
        Mechanizm rozliczeń: katalog TER + protokoły + faktury sprzedażowe (FS z tabeli{" "}
        <code style={{ fontSize: "0.8em" }}>faktury</code>).{" "}
        <strong>Pozostało handlowo = suma kontraktu − suma FS</strong> (na ile wystawiliśmy faktur). Osobno: postęp
        protokołami = suma kontraktu − suma linii protokołów (L). Excel był szablonem — bez importu historii protokołów.
        Koszty (<code style={{ fontSize: "0.8em" }}>faktury_kosztowe</code>) nie wchodzą do sumy.
      </p>

      {err ? (
        <div style={{ ...s.errBox, marginBottom: "0.85rem" }} role="alert">
          {err}
        </div>
      ) : null}
      {msg ? (
        <div style={{ ...s.hintBox, marginBottom: "0.85rem" }} role="status">
          {msg}
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
        <label style={{ fontSize: "0.84rem", display: "flex", flexDirection: "column", gap: 4, minWidth: "14rem" }}>
          Wybierz KR
          <select
            style={{ ...s.input, minWidth: "14rem" }}
            value={wyborKrSelect}
            disabled={loading || wyborBusy}
            onChange={(e) => void wybierzKrZListy(e.target.value)}
          >
            <option value="">— wybierz z listy —</option>
            {krOpcje.map((o) => {
              const maTer = Boolean(znajdzRozliczenieDlaKr(o.kr));
              const label = [o.kr, o.nazwa || o.klient || null, maTer ? null : "(brak TER)"]
                .filter(Boolean)
                .join(" · ");
              return (
                <option key={normKr(o.kr) || o.kr} value={o.kr}>
                  {label}
                </option>
              );
            })}
          </select>
        </label>
        <button type="button" style={s.btnGhost} onClick={() => void fetchRows()} disabled={loading || wyborBusy}>
          Odśwież
        </button>
        {wybrane ? (
          <button type="button" style={s.btnGhost} onClick={() => { setWybraneId(null); setWyborKrSelect(""); }}>
            Zamknij szczegóły
          </button>
        ) : null}
        <span style={{ ...op.muted, fontSize: "0.84rem" }}>
          KR: {rows.length} · kontrakty {formatPln(sumy.kontrakt)} · FS {formatPln(sumy.fs)} · pozostało handlowo{" "}
          {formatPln(sumy.pozostaloKontrakt)} · protokołami {formatPln(sumy.wyk)} / pozostało{" "}
          {formatPln(sumy.pozostaloProtokoly)}
        </span>
      </div>

      {czyMozeEdytowac ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))",
            gap: "0.5rem",
            marginBottom: "0.85rem",
            alignItems: "end",
          }}
        >
          <label style={{ fontSize: "0.8rem" }}>
            Nowy KR
            <input
              style={{ ...s.input, display: "block", width: "100%", marginTop: 4 }}
              value={noweKr.kr}
              onChange={(e) => setNoweKr((p) => ({ ...p, kr: e.target.value }))}
              placeholder="np. 1074"
            />
          </label>
          <label style={{ fontSize: "0.8rem" }}>
            Klient
            <input
              style={{ ...s.input, display: "block", width: "100%", marginTop: 4 }}
              value={noweKr.klient}
              onChange={(e) => setNoweKr((p) => ({ ...p, klient: e.target.value }))}
            />
          </label>
          <label style={{ fontSize: "0.8rem", gridColumn: "span 2" }}>
            Nazwa kontraktu
            <input
              style={{ ...s.input, display: "block", width: "100%", marginTop: 4 }}
              value={noweKr.nazwa}
              onChange={(e) => setNoweKr((p) => ({ ...p, nazwa: e.target.value }))}
            />
          </label>
          <label style={{ fontSize: "0.8rem" }}>
            Suma kontraktu
            <input
              style={{ ...s.input, display: "block", width: "100%", marginTop: 4 }}
              value={noweKr.suma}
              onChange={(e) => setNoweKr((p) => ({ ...p, suma: e.target.value }))}
              placeholder="0"
            />
          </label>
          <button type="button" style={s.btnGhost} onClick={() => void dodajRozliczenie()}>
            Dodaj KR
          </button>
        </div>
      ) : null}

      {loading ? (
        <p style={s.muted}>Ładowanie…</p>
      ) : rows.length === 0 ? (
        <p style={s.muted}>Brak rozliczeń TER — dodaj KR albo uruchom seed szablonu w Supabase.</p>
      ) : (
        <div style={{ ...s.tableWrap, borderRadius: "12px", overflow: "auto", marginBottom: "1rem" }}>
          <table style={{ ...s.table, fontSize: "0.84rem" }}>
            <thead>
              <tr>
                <th style={s.th}>KR</th>
                <th style={s.th}>Klient</th>
                <th style={s.th}>Suma kontraktu</th>
                <th style={s.th}>Suma FS</th>
                <th style={s.th}>Pozostało handlowo</th>
                <th style={s.th}>% FS</th>
                <th style={s.th}>Protokołami</th>
                <th style={s.th}>Pozostało prot.</th>
                <th style={s.th}>Prot.</th>
                <th style={s.th}>TER</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const active = Number(r.rozliczenie_id) === Number(wybraneId);
                const pozostaloKontrakt =
                  r.pozostalo_kontrakt != null
                    ? r.pozostalo_kontrakt
                    : (Number(r.suma_kontraktu) || 0) - (Number(r.suma_faktur_fs) || 0);
                const pozostaloProt =
                  r.pozostalo_po_protokolach != null ? r.pozostalo_po_protokolach : r.pozostalo;
                return (
                  <tr
                    key={r.rozliczenie_id}
                    style={active ? { background: "rgba(251, 146, 60, 0.12)" } : undefined}
                  >
                    <td style={s.td}>
                      <button
                        type="button"
                        style={{
                          ...s.btnGhost,
                          padding: "0.1rem 0.35rem",
                          fontWeight: 700,
                          color: "#fdba74",
                        }}
                        onClick={() => setWybraneId(r.rozliczenie_id)}
                      >
                        {r.kr}
                      </button>
                    </td>
                    <td style={s.td}>{r.klient || "—"}</td>
                    <td style={{ ...s.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {formatPln(r.suma_kontraktu)}
                    </td>
                    <td style={{ ...s.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {formatPln(r.suma_faktur_fs ?? 0)}
                    </td>
                    <td style={{ ...s.td, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                      {formatPln(pozostaloKontrakt)}
                    </td>
                    <td style={s.td}>{formatPct(r.procent_zafakturowania)}</td>
                    <td style={{ ...s.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {formatPln(r.wykonano ?? r.suma_protokolow)}
                    </td>
                    <td style={{ ...s.td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {formatPln(pozostaloProt)}
                    </td>
                    <td style={s.td}>{r.liczba_protokolow ?? 0}</td>
                    <td style={s.td}>{r.liczba_pozycji_ter ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {wybrane ? (
        <div style={{ borderTop: "1px solid rgba(148,163,184,0.25)", paddingTop: "0.85rem" }}>
          <h4 style={{ ...op.sectionTitle, marginTop: 0, fontSize: "1.05rem" }}>
            Szczegóły KR {wybrane.kr}
          </h4>
          <p style={{ ...op.muted, marginTop: 0, marginBottom: "0.55rem", fontSize: "0.82rem" }}>
            Edytowalna tabela szczegółów: nazwa obiektu, firma, suma — poniżej etapy TER i protokoły.
          </p>

          <div style={{ ...s.tableWrap, borderRadius: "10px", overflow: "auto", marginBottom: "0.65rem" }}>
            <table style={{ ...s.table, fontSize: "0.82rem", maxWidth: "42rem" }}>
              <thead>
                <tr>
                  <th style={{ ...s.th, width: "11rem" }}>Pole</th>
                  <th style={s.th}>Wartość</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={s.td}>Nazwa obiektu</td>
                  <td style={s.td}>
                    <input
                      style={{ ...s.input, width: "100%", boxSizing: "border-box" }}
                      value={naglowekDraft.nazwa}
                      onChange={(e) => setNaglowekDraft((p) => ({ ...p, nazwa: e.target.value }))}
                      disabled={!czyMozeEdytowac}
                      placeholder="np. nazwa inwestycji / obiektu"
                    />
                  </td>
                </tr>
                <tr>
                  <td style={s.td}>Firma</td>
                  <td style={s.td}>
                    <input
                      style={{ ...s.input, width: "100%", boxSizing: "border-box" }}
                      value={naglowekDraft.firma}
                      onChange={(e) => setNaglowekDraft((p) => ({ ...p, firma: e.target.value }))}
                      disabled={!czyMozeEdytowac}
                      placeholder="klient / zleceniodawca"
                    />
                  </td>
                </tr>
                <tr>
                  <td style={s.td}>Suma kontraktu (NETTO)</td>
                  <td style={s.td}>
                    <input
                      style={{ ...s.input, width: "12rem", boxSizing: "border-box" }}
                      value={naglowekDraft.suma}
                      onChange={(e) => setNaglowekDraft((p) => ({ ...p, suma: e.target.value }))}
                      disabled={!czyMozeEdytowac}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {czyMozeEdytowac ? (
            <div style={{ marginBottom: "0.85rem" }}>
              <button type="button" style={s.btnGhost} onClick={() => void zapiszNaglowek()}>
                Zapisz nagłówek
              </button>
            </div>
          ) : null}

          <div style={{ fontSize: "0.84rem", lineHeight: 1.45, marginBottom: "0.85rem" }}>
            <div>
              Suma FS (wystawione): <strong>{formatPln(wybrane.suma_faktur_fs ?? 0)}</strong>
              {wybrane.liczba_faktur_fs != null ? ` · ${wybrane.liczba_faktur_fs} dok.` : ""}
            </div>
            <div>
              Pozostało handlowo:{" "}
              <strong>
                {formatPln(
                  wybrane.pozostalo_kontrakt != null
                    ? wybrane.pozostalo_kontrakt
                    : (Number(wybrane.suma_kontraktu) || 0) - (Number(wybrane.suma_faktur_fs) || 0),
                )}
              </strong>{" "}
              ({formatPct(wybrane.procent_zafakturowania)})
            </div>
            <div>
              Wykonano protokołami: <strong>{formatPln(wybrane.wykonano ?? wybrane.suma_protokolow)}</strong>
            </div>
            <div>
              Pozostało po protokołach:{" "}
              <strong>
                {formatPln(
                  wybrane.pozostalo_po_protokolach != null
                    ? wybrane.pozostalo_po_protokolach
                    : wybrane.pozostalo,
                )}
              </strong>{" "}
              ({formatPct(wybrane.procent_wykonania)})
            </div>
          </div>

          {detailLoading ? <p style={s.muted}>Ładowanie szczegółów…</p> : null}

          <h4 style={{ margin: "0.5rem 0 0.35rem", fontSize: "0.95rem" }}>Etapy / pozycje TER</h4>
          <div style={{ ...s.tableWrap, borderRadius: "10px", overflow: "auto", marginBottom: "0.65rem" }}>
            <table style={{ ...s.table, fontSize: "0.8rem" }}>
              <thead>
                <tr>
                  <th style={s.th}>Lp</th>
                  <th style={s.th}>Opis etapu</th>
                  <th style={s.th}>Jm</th>
                  <th style={s.th}>Ilość</th>
                  <th style={s.th}>Cena</th>
                  <th style={s.th}>Wartość</th>
                  <th style={s.th}>Wykonano</th>
                  <th style={s.th}>Pozostało</th>
                  {czyMozeEdytowac ? <th style={s.th} /> : null}
                </tr>
              </thead>
              <tbody>
                {pozycje.length === 0 ? (
                  <tr>
                    <td style={s.td} colSpan={czyMozeEdytowac ? 9 : 8}>
                      Brak etapów TER — dodaj poniżej.
                    </td>
                  </tr>
                ) : (
                  pozycje.map((p) => {
                    const d = draftPoz(p);
                    if (!czyMozeEdytowac) {
                      return (
                        <tr key={p.pozycja_id}>
                          <td style={s.td}>{p.lp}</td>
                          <td style={s.td}>{p.opis}</td>
                          <td style={s.td}>{p.jm || "—"}</td>
                          <td style={{ ...s.td, textAlign: "right" }}>{p.ilosc_umowna ?? "—"}</td>
                          <td style={{ ...s.td, textAlign: "right" }}>{formatPln(p.cena)}</td>
                          <td style={{ ...s.td, textAlign: "right" }}>{formatPln(p.wartosc)}</td>
                          <td style={{ ...s.td, textAlign: "right" }}>{formatPln(p.wykonano_pozycji)}</td>
                          <td style={{ ...s.td, textAlign: "right" }}>{formatPln(p.pozostalo_pozycji)}</td>
                        </tr>
                      );
                    }
                    const cellIn = { ...s.input, width: "100%", minWidth: 0, padding: "0.2rem 0.35rem", fontSize: "0.78rem" };
                    return (
                      <tr key={p.pozycja_id}>
                        <td style={s.td}>
                          <input
                            style={{ ...cellIn, width: "3.2rem" }}
                            value={d.lp}
                            onChange={(e) => setDraftPoz(p.pozycja_id, { lp: e.target.value })}
                          />
                        </td>
                        <td style={s.td}>
                          <input
                            style={cellIn}
                            value={d.opis}
                            onChange={(e) => setDraftPoz(p.pozycja_id, { opis: e.target.value })}
                          />
                        </td>
                        <td style={s.td}>
                          <input
                            style={{ ...cellIn, width: "3rem" }}
                            value={d.jm}
                            onChange={(e) => setDraftPoz(p.pozycja_id, { jm: e.target.value })}
                          />
                        </td>
                        <td style={s.td}>
                          <input
                            style={{ ...cellIn, width: "4.5rem", textAlign: "right" }}
                            value={d.ilosc}
                            onChange={(e) => setDraftPoz(p.pozycja_id, { ilosc: e.target.value })}
                          />
                        </td>
                        <td style={s.td}>
                          <input
                            style={{ ...cellIn, width: "5rem", textAlign: "right" }}
                            value={d.cena}
                            onChange={(e) => setDraftPoz(p.pozycja_id, { cena: e.target.value })}
                          />
                        </td>
                        <td style={s.td}>
                          <input
                            style={{ ...cellIn, width: "5.5rem", textAlign: "right" }}
                            value={d.wartosc}
                            onChange={(e) => setDraftPoz(p.pozycja_id, { wartosc: e.target.value })}
                            placeholder="auto"
                          />
                        </td>
                        <td style={{ ...s.td, textAlign: "right" }}>{formatPln(p.wykonano_pozycji)}</td>
                        <td style={{ ...s.td, textAlign: "right" }}>{formatPln(p.pozostalo_pozycji)}</td>
                        <td style={s.td}>
                          <button type="button" style={{ ...s.btnGhost, padding: "0.15rem 0.4rem" }} onClick={() => void zapiszPozycje(p)}>
                            Zapisz
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {czyMozeEdytowac ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "5rem 1fr 6rem 6rem 6rem 7rem auto",
                gap: "0.4rem",
                marginBottom: "1rem",
                alignItems: "end",
              }}
            >
              <label style={{ fontSize: "0.75rem" }}>
                Lp
                <input
                  style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                  value={nowaPoz.lp}
                  onChange={(e) => setNowaPoz((p) => ({ ...p, lp: e.target.value }))}
                />
              </label>
              <label style={{ fontSize: "0.75rem" }}>
                Opis etapu
                <input
                  style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                  value={nowaPoz.opis}
                  onChange={(e) => setNowaPoz((p) => ({ ...p, opis: e.target.value }))}
                />
              </label>
              <label style={{ fontSize: "0.75rem" }}>
                Jm
                <input
                  style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                  value={nowaPoz.jm}
                  onChange={(e) => setNowaPoz((p) => ({ ...p, jm: e.target.value }))}
                />
              </label>
              <label style={{ fontSize: "0.75rem" }}>
                Ilość
                <input
                  style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                  value={nowaPoz.ilosc}
                  onChange={(e) => setNowaPoz((p) => ({ ...p, ilosc: e.target.value }))}
                />
              </label>
              <label style={{ fontSize: "0.75rem" }}>
                Cena
                <input
                  style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                  value={nowaPoz.cena}
                  onChange={(e) => setNowaPoz((p) => ({ ...p, cena: e.target.value }))}
                />
              </label>
              <label style={{ fontSize: "0.75rem" }}>
                Wartość
                <input
                  style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                  value={nowaPoz.wartosc}
                  onChange={(e) => setNowaPoz((p) => ({ ...p, wartosc: e.target.value }))}
                  placeholder="auto"
                />
              </label>
              <button type="button" style={s.btnGhost} onClick={() => void dodajPozycje()}>
                Dodaj etap
              </button>
            </div>
          ) : null}

          <h4 style={{ margin: "0.5rem 0 0.35rem", fontSize: "0.95rem" }}>Protokoły</h4>
          {czyMozeEdytowac ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(7.5rem, 1fr))",
                gap: "0.45rem",
                marginBottom: "0.75rem",
                alignItems: "end",
              }}
            >
              <label style={{ fontSize: "0.75rem" }}>
                Nr kolejny
                <input
                  style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                  value={nowyProt.nr_kolejny}
                  onChange={(e) => setNowyProt((p) => ({ ...p, nr_kolejny: e.target.value }))}
                  placeholder="auto"
                />
              </label>
              <label style={{ fontSize: "0.75rem" }}>
                Data protokołu
                <input
                  type="date"
                  style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                  value={nowyProt.data}
                  onChange={(e) => setNowyProt((p) => ({ ...p, data: e.target.value }))}
                />
              </label>
              <label style={{ fontSize: "0.75rem" }}>
                Okres od
                <input
                  type="date"
                  style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                  value={nowyProt.okres_od}
                  onChange={(e) => setNowyProt((p) => ({ ...p, okres_od: e.target.value }))}
                />
              </label>
              <label style={{ fontSize: "0.75rem" }}>
                Okres do
                <input
                  type="date"
                  style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                  value={nowyProt.okres_do}
                  onChange={(e) => setNowyProt((p) => ({ ...p, okres_do: e.target.value }))}
                />
              </label>
              <label style={{ fontSize: "0.75rem", gridColumn: "span 2" }}>
                Uwagi
                <input
                  style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                  value={nowyProt.uwagi}
                  onChange={(e) => setNowyProt((p) => ({ ...p, uwagi: e.target.value }))}
                />
              </label>
              <button type="button" style={s.btnGhost} onClick={() => void utworzProtokol()}>
                Utwórz pusty protokół
              </button>
            </div>
          ) : null}

          {protokoly.length === 0 ? (
            <p style={s.muted}>Brak protokołów — utwórz pusty nagłówek i dopisuj linie w miarę postępu.</p>
          ) : (
            <>
              <div style={{ ...s.tableWrap, borderRadius: "10px", overflow: "auto", marginBottom: "0.75rem" }}>
                <table style={{ ...s.table, fontSize: "0.8rem" }}>
                  <thead>
                    <tr>
                      <th style={s.th}>Numer</th>
                      <th style={s.th}>Data</th>
                      <th style={s.th}>Okres od</th>
                      <th style={s.th}>Okres do</th>
                      <th style={s.th}>Status</th>
                      <th style={s.th}>Uwagi</th>
                      <th style={s.th}>Wartość L</th>
                      {czyMozeEdytowac ? <th style={s.th} /> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {protokoly.map((pr) => {
                      const linie = linieByProt[pr.id] ?? [];
                      const sumaL = linie.reduce((a, l) => a + (Number(l.wartosc_okresu) || 0), 0);
                      const d = draftProt(pr);
                      const cellIn = {
                        ...s.input,
                        width: "100%",
                        minWidth: 0,
                        padding: "0.2rem 0.35rem",
                        fontSize: "0.78rem",
                      };
                      return (
                        <tr key={pr.id}>
                          <td style={s.td}>{pr.numer || `${pr.kr}/${pr.nr_kolejny}`}</td>
                          {czyMozeEdytowac ? (
                            <>
                              <td style={s.td}>
                                <input
                                  type="date"
                                  style={cellIn}
                                  value={d.data}
                                  onChange={(e) => setDraftProt(pr.id, { data: e.target.value })}
                                />
                              </td>
                              <td style={s.td}>
                                <input
                                  type="date"
                                  style={cellIn}
                                  value={d.okres_od}
                                  onChange={(e) => setDraftProt(pr.id, { okres_od: e.target.value })}
                                />
                              </td>
                              <td style={s.td}>
                                <input
                                  type="date"
                                  style={cellIn}
                                  value={d.okres_do}
                                  onChange={(e) => setDraftProt(pr.id, { okres_do: e.target.value })}
                                />
                              </td>
                              <td style={s.td}>
                                <select
                                  style={cellIn}
                                  value={d.status}
                                  onChange={(e) => setDraftProt(pr.id, { status: e.target.value })}
                                >
                                  <option value="szkic">szkic</option>
                                  <option value="zatwierdzony">zatwierdzony</option>
                                </select>
                              </td>
                              <td style={s.td}>
                                <input
                                  style={cellIn}
                                  value={d.uwagi}
                                  onChange={(e) => setDraftProt(pr.id, { uwagi: e.target.value })}
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={s.td}>{pr.data_protokolu || "—"}</td>
                              <td style={s.td}>{pr.okres_od || "—"}</td>
                              <td style={s.td}>{pr.okres_do || "—"}</td>
                              <td style={s.td}>{pr.status || "—"}</td>
                              <td style={s.td}>{pr.uwagi || "—"}</td>
                            </>
                          )}
                          <td style={{ ...s.td, textAlign: "right" }}>{formatPln(sumaL)}</td>
                          {czyMozeEdytowac ? (
                            <td style={s.td}>
                              <button
                                type="button"
                                style={{ ...s.btnGhost, padding: "0.15rem 0.4rem" }}
                                onClick={() => void zapiszProtokol(pr)}
                              >
                                Zapisz
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {protokoly.map((pr) => {
                const linie = linieByProt[pr.id] ?? [];
                const draft = liniaDraftByProt[pr.id] || {};
                return (
                  <div
                    key={`linie-${pr.id}`}
                    style={{
                      border: "1px solid rgba(148,163,184,0.22)",
                      borderRadius: 10,
                      padding: "0.65rem 0.75rem",
                      marginBottom: "0.65rem",
                    }}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "space-between" }}>
                      <strong>
                        Linie: {pr.numer || `${pr.kr}/${pr.nr_kolejny}`}{" "}
                        <span style={{ ...op.muted, fontWeight: 400 }}>({pr.status})</span>
                      </strong>
                    </div>
                    {linie.length > 0 ? (
                      <div style={{ ...s.tableWrap, borderRadius: "8px", overflow: "auto", marginTop: "0.4rem" }}>
                        <table style={{ ...s.table, fontSize: "0.78rem" }}>
                          <thead>
                            <tr>
                              <th style={s.th}>Lp</th>
                              <th style={s.th}>Opis</th>
                              <th style={s.th}>Ilość</th>
                              <th style={s.th}>Wartość okresu (L)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {linie.map((l) => (
                              <tr key={l.id}>
                                <td style={s.td}>{l.lp || "—"}</td>
                                <td style={s.td}>{l.opis || "—"}</td>
                                <td style={{ ...s.td, textAlign: "right" }}>{l.ilosc_okresu ?? "—"}</td>
                                <td style={{ ...s.td, textAlign: "right" }}>{formatPln(l.wartosc_okresu)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ ...op.muted, fontSize: "0.8rem", margin: "0.35rem 0" }}>
                        Brak linii (nie zmniejsza pozostało).
                      </p>
                    )}
                    {czyMozeEdytowac ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 6rem 7rem auto",
                          gap: "0.4rem",
                          alignItems: "end",
                          marginTop: "0.35rem",
                        }}
                      >
                        <label style={{ fontSize: "0.75rem" }}>
                          Pozycja TER (opcjonalnie)
                          <select
                            style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                            value={draft.pozycja_id || ""}
                            onChange={(e) =>
                              setLiniaDraftByProt((prev) => ({
                                ...prev,
                                [pr.id]: { ...draft, pozycja_id: e.target.value },
                              }))
                            }
                          >
                            <option value="">— bez powiązania / własny opis —</option>
                            {pozycje.map((p) => (
                              <option key={p.pozycja_id} value={p.pozycja_id}>
                                {p.lp}. {String(p.opis || "").slice(0, 60)}
                              </option>
                            ))}
                          </select>
                        </label>
                        {!draft.pozycja_id ? (
                          <label style={{ fontSize: "0.75rem", gridColumn: "1 / -1" }}>
                            Opis linii
                            <input
                              style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                              value={draft.opis || ""}
                              onChange={(e) =>
                                setLiniaDraftByProt((prev) => ({
                                  ...prev,
                                  [pr.id]: { ...draft, opis: e.target.value },
                                }))
                              }
                            />
                          </label>
                        ) : null}
                        <label style={{ fontSize: "0.75rem" }}>
                          Ilość okresu
                          <input
                            style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                            value={draft.ilosc || ""}
                            onChange={(e) =>
                              setLiniaDraftByProt((prev) => ({
                                ...prev,
                                [pr.id]: { ...draft, ilosc: e.target.value },
                              }))
                            }
                          />
                        </label>
                        <label style={{ fontSize: "0.75rem" }}>
                          Wartość okresu (L)
                          <input
                            style={{ ...s.input, display: "block", width: "100%", marginTop: 2 }}
                            value={draft.wartosc || ""}
                            onChange={(e) =>
                              setLiniaDraftByProt((prev) => ({
                                ...prev,
                                [pr.id]: { ...draft, wartosc: e.target.value },
                              }))
                            }
                          />
                        </label>
                        <button type="button" style={s.btnGhost} onClick={() => void dodajLinie(pr.id)}>
                          Dodaj linię
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
