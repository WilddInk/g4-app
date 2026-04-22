import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase.js";
import { op } from "./operationalShell.jsx";
import { s } from "./styles/appDashboardStyles.js";
import { dataDoInputa, dataPLZFormat } from "./utils/dateText.js";

function isoDate(v) {
  const t = String(v ?? "").trim();
  if (!t) return "";
  return t.slice(0, 10);
}

function dateDiffDays(a, b) {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function addDaysIso(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function TerenPlanningBoard({ krList, pracownicy, podwykonawcy, samochody, sprzet, trybHelp }) {
  const [krFilter, setKrFilter] = useState(() => String(krList?.[0]?.kr ?? ""));
  const [demands, setDemands] = useState([]);
  const [works, setWorks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignmentResources, setAssignmentResources] = useState([]);
  const [reports, setReports] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [err, setErr] = useState(null);
  const [zoom, setZoom] = useState("tydzien");
  const [layers, setLayers] = useState({ projekt: true, etapy: true, teren: true, zasoby: true });
  const [plannerStart, setPlannerStart] = useState(() => isoDate(new Date().toISOString()));
  const [dragPayload, setDragPayload] = useState(null);
  const [plannerLane, setPlannerLane] = useState("pracownicy");
  const [teams, setTeams] = useState([]);
  const [plannerDropDays, setPlannerDropDays] = useState("auto");

  /** Listy rozwijane i wiersze planera: tylko aktywni (`is_active !== false`), jak w Zespół. */
  const pracownicyOpcjeSelect = useMemo(
    () => pracownicy.filter((p) => p.is_active !== false),
    [pracownicy],
  );

  const [demandForm, setDemandForm] = useState({
    tytul: "",
    opis: "",
    priorytet: "normalny",
    data_oczekiwana_od: "",
    data_oczekiwana_do: "",
  });
  const [workForm, setWorkForm] = useState({
    demand_id: "",
    nazwa: "",
    opis: "",
    data_plan_od: "",
    data_plan_do: "",
    owner_pracownik_nr: "",
    priorytet: "normalny",
    deadline_nieprzekraczalny: "",
    estymata_dni: "",
  });
  const [assignmentForm, setAssignmentForm] = useState({
    praca_id: "",
    typ_wykonawcy: "pracownik",
    pracownik_nr: "",
    podwykonawca_id: "",
    data_od: "",
    data_do: "",
    samochod_id: "",
    sprzet_id: "",
  });
  const [reportForm, setReportForm] = useState({
    praca_id: "",
    procent_postepu: "0",
    ilosc_wykonana: "",
    jednostka: "",
    uwagi: "",
  });
  const [dailyForm, setDailyForm] = useState({
    praca_id: "",
    data_dnia: isoDate(new Date().toISOString()),
    pracownik_nr: "",
    opis: "",
    ilosc_plan: "1",
    ilosc_wykonano: "0",
  });

  const fetchAll = useCallback(async () => {
    if (!krFilter) {
      setDemands([]);
      setWorks([]);
      setAssignments([]);
      setAssignmentResources([]);
      setReports([]);
      setDailyTasks([]);
      return;
    }
    setErr(null);
    const [d, w, dt, t] = await Promise.all([
      supabase.from("kr_teren_zapotrzebowanie").select("*").eq("kr", krFilter).order("created_at", { ascending: false }),
      supabase.from("kr_teren_praca").select("*").eq("kr", krFilter).order("data_plan_od", { ascending: true }),
      supabase.from("kr_teren_zadanie").select("*").eq("kr", krFilter).order("data_dnia", { ascending: true }),
      supabase.from("kr_teren_zespol").select("*").order("nazwa", { ascending: true }),
    ]);
    if (d.error || w.error || dt.error || t.error) {
      setErr(d.error?.message || w.error?.message || dt.error?.message || t.error?.message || "Błąd pobierania danych");
      setDemands([]);
      setWorks([]);
      setDailyTasks([]);
      setTeams([]);
      return;
    }
    setDemands(d.data ?? []);
    const worksRows = w.data ?? [];
    setWorks(worksRows);
    setDailyTasks(dt.data ?? []);
    setTeams(t.data ?? []);

    const workIds = worksRows.map((x) => x.id);
    if (workIds.length === 0) {
      setAssignments([]);
      setAssignmentResources([]);
      setReports([]);
      return;
    }
    const [a, r] = await Promise.all([
      supabase.from("kr_teren_przydzial").select("*").in("praca_id", workIds).order("data_od", { ascending: true }),
      supabase.from("kr_teren_raport").select("*").in("praca_id", workIds).order("data_raportu", { ascending: false }),
    ]);
    if (a.error || r.error) {
      setErr(a.error?.message || r.error?.message || "Błąd pobierania przydziałów/raportów");
      setAssignments([]);
      setReports([]);
      return;
    }
    const assignmentRows = a.data ?? [];
    setAssignments(assignmentRows);
    setReports(r.data ?? []);
    const assignmentIds = assignmentRows.map((x) => x.id);
    if (assignmentIds.length === 0) {
      setAssignmentResources([]);
      return;
    }
    const ar = await supabase
      .from("kr_teren_przydzial_zasob")
      .select("*")
      .in("przydzial_id", assignmentIds)
      .order("data_od", { ascending: true });
    if (ar.error) {
      setErr(ar.error.message || "Błąd pobierania zasobów przydziału");
      setAssignmentResources([]);
      return;
    }
    setAssignmentResources(ar.data ?? []);
  }, [krFilter]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const etapyKr = useMemo(() => {
    const row = krList.find((x) => String(x.kr) === String(krFilter));
    return row?.etapy ?? [];
  }, [krList, krFilter]);

  const resourceConflicts = useMemo(() => {
    const out = [];
    const byRes = new Map();
    for (const r of assignmentResources) {
      const typ = String(r.typ_zasobu ?? "").trim();
      const keyRes = typ === "samochod" ? String(r.samochod_id ?? "") : String(r.sprzet_id ?? "");
      if (!typ || !keyRes) continue;
      const key = `${typ}|${keyRes}`;
      if (!byRes.has(key)) byRes.set(key, []);
      byRes.get(key).push(r);
    }
    for (const group of byRes.values()) {
      for (let i = 0; i < group.length; i += 1) {
        for (let j = i + 1; j < group.length; j += 1) {
          const ra = group[i];
          const rb = group[j];
          if (ra.data_od <= rb.data_do && rb.data_od <= ra.data_do) out.push([ra, rb]);
        }
      }
    }
    return out;
  }, [assignmentResources]);

  const riskByWorkId = useMemo(() => {
    const today = isoDate(new Date().toISOString());
    const byWorkAssignments = new Map();
    const byWorkReports = new Map();
    const byWorkDaily = new Map();
    const assignmentConflictIds = new Set();
    for (const [a, b] of resourceConflicts) {
      assignmentConflictIds.add(a.przydzial_id);
      assignmentConflictIds.add(b.przydzial_id);
    }
    for (const a of assignments) {
      if (!byWorkAssignments.has(a.praca_id)) byWorkAssignments.set(a.praca_id, []);
      byWorkAssignments.get(a.praca_id).push(a);
    }
    for (const r of reports) {
      if (!byWorkReports.has(r.praca_id)) byWorkReports.set(r.praca_id, []);
      byWorkReports.get(r.praca_id).push(r);
    }
    for (const d of dailyTasks) {
      if (d.praca_id == null) continue;
      if (!byWorkDaily.has(d.praca_id)) byWorkDaily.set(d.praca_id, []);
      byWorkDaily.get(d.praca_id).push(d);
    }

    const out = new Map();
    for (const w of works) {
      const reasons = [];
      const ass = byWorkAssignments.get(w.id) ?? [];
      const rep = byWorkReports.get(w.id) ?? [];
      const day = byWorkDaily.get(w.id) ?? [];
      const start = isoDate(w.data_plan_od);
      const end = isoDate(w.data_plan_do);
      const planDays = start && end ? Math.max(1, dateDiffDays(start, end) + 1) : null;
      const daysToDeadline = end ? dateDiffDays(today, end) : null;
      const progressRaw = Number(w.procent_postepu ?? rep[0]?.procent_postepu ?? 0);
      const progress = Number.isFinite(progressRaw) ? Math.max(0, Math.min(100, progressRaw)) : 0;
      const started = rep.length > 0 || day.length > 0 || ass.some((x) => isoDate(x.data_od) && isoDate(x.data_od) <= today);
      const assignmentExists = ass.length > 0;
      const conflictExists = ass.some((x) => assignmentConflictIds.has(x.id));
      const workedDays = new Set(day.map((x) => isoDate(x.data_dnia)).filter(Boolean)).size;
      const remainingDays = daysToDeadline != null ? Math.max(0, daysToDeadline + 1) : 0;

      if (!assignmentExists) reasons.push("brak przydziału");
      if (daysToDeadline != null && daysToDeadline <= 3 && progress === 0) reasons.push(`termin za ${Math.max(daysToDeadline, 0)} dni, brak postępu`);
      if (conflictExists) reasons.push("konflikt zasobów (auto/sprzęt)");
      if (planDays != null && workedDays + remainingDays < planDays && progress < 100) reasons.push("zbyt mało dni vs szacunek");
      if (!started && daysToDeadline != null && daysToDeadline < 0 && progress < 100) reasons.push("po terminie i brak zakończenia");

      let status = "bezpieczne";
      if (!start || !end) status = "brak danych";
      else if (!assignmentExists && rep.length === 0 && day.length === 0) status = "brak danych";
      else if (reasons.some((x) => x.includes("po terminie")) || reasons.some((x) => x.includes("konflikt")) || reasons.some((x) => x.includes("zbyt mało"))) status = "zagrożone";
      else if (reasons.length > 0 || (daysToDeadline != null && daysToDeadline <= 7 && progress < 60)) status = "do sprawdzenia";

      out.set(w.id, {
        status,
        reasons,
        progress,
      });
    }
    return out;
  }, [assignments, dailyTasks, reports, resourceConflicts, works]);

  const riskStyle = (status) => {
    if (status === "zagrożone") return { bg: "rgba(248,113,113,0.22)", fg: "#fecaca", bar: "#ef4444" };
    if (status === "do sprawdzenia") return { bg: "rgba(251,191,36,0.18)", fg: "#fde68a", bar: "#f59e0b" };
    if (status === "brak danych") return { bg: "rgba(148,163,184,0.2)", fg: "#cbd5e1", bar: "#94a3b8" };
    return { bg: "rgba(52,211,153,0.18)", fg: "#bbf7d0", bar: "#10b981" };
  };

  async function saveDemand(e) {
    e.preventDefault();
    if (!krFilter || !String(demandForm.tytul).trim()) return;
    const { error } = await supabase.from("kr_teren_zapotrzebowanie").insert({
      kr: krFilter,
      tytul: String(demandForm.tytul).trim(),
      opis: String(demandForm.opis).trim() || null,
      priorytet: demandForm.priorytet,
      data_oczekiwana_od: demandForm.data_oczekiwana_od || null,
      data_oczekiwana_do: demandForm.data_oczekiwana_do || null,
    });
    if (error) {
      alert(`Zapis zapotrzebowania: ${error.message}`);
      return;
    }
    setDemandForm({ tytul: "", opis: "", priorytet: "normalny", data_oczekiwana_od: "", data_oczekiwana_do: "" });
    await fetchAll();
  }

  async function saveWork(e) {
    e.preventDefault();
    if (!krFilter || !workForm.nazwa || !workForm.data_plan_od || !workForm.data_plan_do) return;
    const { error } = await supabase.from("kr_teren_praca").insert({
      kr: krFilter,
      zapotrzebowanie_id: workForm.demand_id ? Number(workForm.demand_id) : null,
      nazwa: String(workForm.nazwa).trim(),
      opis: String(workForm.opis).trim() || null,
      data_plan_od: workForm.data_plan_od,
      data_plan_do: workForm.data_plan_do,
      owner_pracownik_nr: workForm.owner_pracownik_nr || null,
      priorytet: workForm.priorytet,
      status: "gotowe_do_przydzialu",
      deadline_nieprzekraczalny: workForm.deadline_nieprzekraczalny || null,
      estymata_dni: workForm.estymata_dni ? Number(workForm.estymata_dni) : null,
    });
    if (error) {
      alert(`Zapis pracy terenowej: ${error.message}`);
      return;
    }
    setWorkForm({
      demand_id: "",
      nazwa: "",
      opis: "",
      data_plan_od: "",
      data_plan_do: "",
      owner_pracownik_nr: "",
      priorytet: "normalny",
      deadline_nieprzekraczalny: "",
      estymata_dni: "",
    });
    await fetchAll();
  }

  async function saveAssignment(e) {
    e.preventDefault();
    if (!assignmentForm.praca_id || !assignmentForm.data_od || !assignmentForm.data_do) return;
    const payload = {
      praca_id: Number(assignmentForm.praca_id),
      typ_wykonawcy: assignmentForm.typ_wykonawcy,
      pracownik_nr: assignmentForm.typ_wykonawcy === "pracownik" ? assignmentForm.pracownik_nr || null : null,
      podwykonawca_id: assignmentForm.typ_wykonawcy === "podwykonawca" ? Number(assignmentForm.podwykonawca_id) || null : null,
      data_od: assignmentForm.data_od,
      data_do: assignmentForm.data_do,
      status: "planowany",
    };
    const { data, error } = await supabase.from("kr_teren_przydzial").insert(payload).select("id").single();
    if (error) {
      alert(`Zapis przydziału: ${error.message}`);
      return;
    }
    const reserveRows = [];
    if (assignmentForm.samochod_id) {
      reserveRows.push({
        przydzial_id: data.id,
        typ_zasobu: "samochod",
        samochod_id: Number(assignmentForm.samochod_id),
        data_od: assignmentForm.data_od,
        data_do: assignmentForm.data_do,
      });
    }
    if (assignmentForm.sprzet_id) {
      reserveRows.push({
        przydzial_id: data.id,
        typ_zasobu: "sprzet",
        sprzet_id: Number(assignmentForm.sprzet_id),
        data_od: assignmentForm.data_od,
        data_do: assignmentForm.data_do,
      });
    }
    if (reserveRows.length > 0) {
      const r = await supabase.from("kr_teren_przydzial_zasob").insert(reserveRows);
      if (r.error) {
        alert(`Zapis rezerwacji zasobu: ${r.error.message}`);
      }
    }
    setAssignmentForm({
      praca_id: "",
      typ_wykonawcy: "pracownik",
      pracownik_nr: "",
      podwykonawca_id: "",
      data_od: "",
      data_do: "",
      samochod_id: "",
      sprzet_id: "",
    });
    await fetchAll();
  }

  async function saveReport(e) {
    e.preventDefault();
    if (!reportForm.praca_id) return;
    const progress = Number.parseInt(String(reportForm.procent_postepu), 10);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) return;
    const { error } = await supabase.from("kr_teren_raport").insert({
      praca_id: Number(reportForm.praca_id),
      procent_postepu: progress,
      ilosc_wykonana: reportForm.ilosc_wykonana ? Number(reportForm.ilosc_wykonana) : null,
      jednostka: String(reportForm.jednostka).trim() || null,
      uwagi: String(reportForm.uwagi).trim() || null,
      status_raportu: "roboczy",
    });
    if (error) {
      alert(`Zapis raportu: ${error.message}`);
      return;
    }
    const up = await supabase.from("kr_teren_praca").update({ procent_postepu: progress }).eq("id", Number(reportForm.praca_id));
    if (up.error) alert(`Aktualizacja postępu zadania: ${up.error.message}`);
    setReportForm({ praca_id: "", procent_postepu: "0", ilosc_wykonana: "", jednostka: "", uwagi: "" });
    await fetchAll();
  }

  async function saveDailyExecution(e) {
    e.preventDefault();
    if (!dailyForm.praca_id || !dailyForm.data_dnia || !dailyForm.pracownik_nr || !dailyForm.opis.trim()) return;
    const selectedWork = works.find((w) => Number(w.id) === Number(dailyForm.praca_id));
    if (!selectedWork) {
      alert("Nie znaleziono zadania planistycznego.");
      return;
    }
    const payload = {
      kr: selectedWork.kr,
      praca_id: Number(dailyForm.praca_id),
      data_dnia: dailyForm.data_dnia,
      pracownik_nr: String(dailyForm.pracownik_nr).trim(),
      opis: dailyForm.opis.trim(),
      ilosc_plan: Number(dailyForm.ilosc_plan || 0),
      ilosc_wykonano: Number(dailyForm.ilosc_wykonano || 0),
    };
    const { error } = await supabase.from("kr_teren_zadanie").insert(payload);
    if (error) {
      alert(`Zapis wykonania dziennego: ${error.message}`);
      return;
    }
    setDailyForm((f) => ({ ...f, praca_id: "", opis: "", ilosc_plan: "1", ilosc_wykonano: "0" }));
    await fetchAll();
  }

  async function assignWorkFromPlanner({ workId, rowKind, rowId, day }) {
    const selectedWork = works.find((w) => Number(w.id) === Number(workId));
    const estDaysAuto = Math.max(1, Number.parseInt(String(selectedWork?.estymata_dni ?? "1"), 10) || 1);
    const estDaysManual = Number.parseInt(String(plannerDropDays), 10);
    const estDays = plannerDropDays === "auto" ? estDaysAuto : Math.max(1, estDaysManual || 1);
    const dayTo = addDaysIso(day, estDays - 1);
    const payload = {
      praca_id: Number(workId),
      typ_wykonawcy: rowKind,
      pracownik_nr: rowKind === "pracownik" ? String(rowId) : null,
      zespol_id: rowKind === "zespol" ? Number(rowId) : null,
      podwykonawca_id: rowKind === "podwykonawca" ? Number(rowId) : null,
      data_od: day,
      data_do: dayTo,
      status: "planowany",
    };
    const { error } = await supabase.from("kr_teren_przydzial").insert(payload);
    if (error) {
      alert(`Przypisanie z kalendarza: ${error.message}`);
      return;
    }
    await fetchAll();
  }

  async function moveAssignmentFromPlanner({ assignmentId, rowKind, rowId, day }) {
    const source = assignments.find((a) => Number(a.id) === Number(assignmentId));
    if (!source) return;
    const len = Math.max(1, dateDiffDays(isoDate(source.data_od), isoDate(source.data_do)) + 1);
    const payload = {
      typ_wykonawcy: rowKind,
      pracownik_nr: rowKind === "pracownik" ? String(rowId) : null,
      zespol_id: rowKind === "zespol" ? Number(rowId) : null,
      podwykonawca_id: rowKind === "podwykonawca" ? Number(rowId) : null,
      data_od: day,
      data_do: addDaysIso(day, len - 1),
    };
    const { error } = await supabase.from("kr_teren_przydzial").update(payload).eq("id", Number(assignmentId));
    if (error) {
      alert(`Przesunięcie przydziału: ${error.message}`);
      return;
    }
    await fetchAll();
  }

  async function resizeAssignmentFromPlanner({ assignmentId, side, deltaDays }) {
    const source = assignments.find((a) => Number(a.id) === Number(assignmentId));
    if (!source) return;
    const start = isoDate(source.data_od);
    const end = isoDate(source.data_do);
    if (!start || !end) return;
    const nextStart = side === "start" ? addDaysIso(start, deltaDays) : start;
    const nextEnd = side === "end" ? addDaysIso(end, deltaDays) : end;
    if (nextStart > nextEnd) return;
    const { error } = await supabase
      .from("kr_teren_przydzial")
      .update({ data_od: nextStart, data_do: nextEnd })
      .eq("id", Number(assignmentId));
    if (error) {
      alert(`Zmiana zakresu przydziału: ${error.message}`);
      return;
    }
    await fetchAll();
  }

  const ganttRows = useMemo(() => {
    const rows = [];
    for (const w of works) {
      const rs = riskByWorkId.get(w.id);
      rows.push({
        layer: "teren",
        label: w.nazwa,
        start: isoDate(w.data_plan_od),
        end: isoDate(w.data_plan_do),
        status: w.status,
        risk: rs?.status ?? "brak danych",
        reasons: rs?.reasons ?? [],
      });
    }
    if (layers.etapy) {
      for (const e of etapyKr) {
        const d = isoDate(e.data_planowana);
        if (!d) continue;
        rows.push({ layer: "etapy", label: e.etap || "Etap", start: d, end: d, status: e.status });
      }
    }
    if (layers.zasoby) {
      for (const a of assignments) {
        rows.push({
          layer: "zasoby",
          label: `Przydział #${a.id}`,
          start: isoDate(a.data_od),
          end: isoDate(a.data_do),
          status: a.status,
        });
      }
    }
    return rows.filter((r) => r.start && r.end);
  }, [works, assignments, etapyKr, layers.etapy, layers.zasoby, riskByWorkId]);

  const [minDay, maxDay] = useMemo(() => {
    const all = ganttRows.flatMap((r) => [r.start, r.end]).filter(Boolean).sort();
    if (all.length === 0) return ["", ""];
    return [all[0], all[all.length - 1]];
  }, [ganttRows]);
  const totalDays = minDay && maxDay ? Math.max(1, dateDiffDays(minDay, maxDay) + 1) : 1;
  const pxPerDay = zoom === "dzien" ? 24 : zoom === "tydzien" ? 5 : zoom === "miesiac" ? 1.8 : 0.35;
  const chartWidth = Math.max(900, Math.round(totalDays * pxPerDay));
  const xPos = (d) => (minDay ? Math.max(0, dateDiffDays(minDay, d) * pxPerDay) : 0);
  const worksWithoutAssignment = useMemo(() => {
    const assignedIds = new Set(assignments.map((a) => Number(a.praca_id)));
    return works.filter((w) => !assignedIds.has(Number(w.id)) && String(w.status ?? "") !== "zakonczone");
  }, [assignments, works]);

  const plannerDays = useMemo(() => {
    const start = new Date(`${plannerStart}T00:00:00`);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [plannerStart]);

  const plannerAssignments = useMemo(() => {
    const map = new Map();
    for (const a of assignments) {
      const from = isoDate(a.data_od);
      const to = isoDate(a.data_do);
      if (!from || !to) continue;
      const rowKind = String(a.typ_wykonawcy ?? "");
      const rowId =
        rowKind === "pracownik"
          ? String(a.pracownik_nr ?? "")
          : rowKind === "zespol"
            ? String(a.zespol_id ?? "")
            : String(a.podwykonawca_id ?? "");
      if (!rowKind || !rowId) continue;
      for (const day of plannerDays) {
        if (day >= from && day <= to) {
          const key = `${rowKind}|${rowId}|${day}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key).push(a);
        }
      }
    }
    return map;
  }, [assignments, plannerDays]);

  const plannerRows = useMemo(() => {
    if (plannerLane === "zespoly") {
      return teams.map((t) => ({ kind: "zespol", id: String(t.id), label: t.nazwa || `Zespół ${t.id}` }));
    }
    if (plannerLane === "podwykonawcy") {
      return podwykonawcy.map((p) => ({ kind: "podwykonawca", id: String(p.id), label: p.nazwa_firmy || `PW ${p.id}` }));
    }
    return pracownicyOpcjeSelect.map((p) => ({
      kind: "pracownik",
      id: String(p.nr),
      label: p.imie_nazwisko || String(p.nr),
    }));
  }, [plannerLane, teams, podwykonawcy, pracownicyOpcjeSelect]);

  return (
    <>
      <div style={op.heroCard}>
        <h2 style={{ ...op.sectionTitle, marginTop: 0 }}>Teren - planowanie operacyjne</h2>
        {trybHelp ? (
          <p style={{ ...op.muted, marginBottom: 0 }}>
            MVP: zapotrzebowanie, praca terenowa, przydział wykonawcy, zasoby, raport postępu i czytelny Gantt KR.
          </p>
        ) : null}
      </div>
      {err ? <p style={{ ...s.muted, color: "#fca5a5" }}>{err}</p> : null}

      <div style={{ ...s.btnRow, marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <label style={{ ...s.label, minWidth: "15rem", marginBottom: 0 }}>
          KR
          <select style={s.input} value={krFilter} onChange={(e) => setKrFilter(e.target.value)}>
            {krList.map((k) => (
              <option key={k.kr} value={String(k.kr)}>
                {k.kr}
              </option>
            ))}
          </select>
        </label>
        <label style={{ ...s.label, minWidth: "14rem", marginBottom: 0 }}>
          Start kalendarza
          <input style={s.input} type="date" value={plannerStart} onChange={(e) => setPlannerStart(e.target.value)} />
        </label>
        <label style={{ ...s.label, minWidth: "12rem", marginBottom: 0 }}>
          Zakres przy dropie
          <select style={s.input} value={plannerDropDays} onChange={(e) => setPlannerDropDays(e.target.value)}>
            <option value="auto">auto (estymata zadania)</option>
            <option value="1">1 dzień</option>
            <option value="2">2 dni</option>
            <option value="3">3 dni</option>
            <option value="5">5 dni</option>
            <option value="7">7 dni</option>
          </select>
        </label>
        <div style={{ display: "flex", gap: "0.35rem", alignItems: "flex-end" }}>
          {[
            { id: "pracownicy", label: "Wiersze: pracownicy" },
            { id: "zespoly", label: "Zespoły" },
            { id: "podwykonawcy", label: "PW" },
          ].map((x) => (
            <button key={x.id} type="button" style={plannerLane === x.id ? s.btn : s.btnGhost} onClick={() => setPlannerLane(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...op.sectionCard, marginBottom: "0.8rem" }}>
        <h3 style={{ ...op.sectionTitle, margin: "0 0 0.5rem", fontSize: "0.92rem" }}>Planner DnD: backlog → kalendarz (14 dni)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "0.7rem" }}>
          <div style={{ border: "1px solid rgba(148,163,184,0.18)", borderRadius: "10px", padding: "0.5rem", minHeight: "16rem" }}>
            <div style={{ fontSize: "0.76rem", color: "#94a3b8", marginBottom: "0.45rem" }}>Nieprzydzielone ({worksWithoutAssignment.length})</div>
            <div style={{ display: "grid", gap: "0.35rem" }}>
              {worksWithoutAssignment.map((w) => {
                const risk = riskByWorkId.get(w.id) ?? { status: "brak danych", reasons: [] };
                const st = riskStyle(risk.status);
                return (
                  <div
                    key={w.id}
                    draggable
                    onDragStart={() => setDragPayload({ type: "work", workId: w.id })}
                    onDragEnd={() => setDragPayload(null)}
                    title={`Przeciągnij na dzień/wiersz pracownika.\nDlaczego: ${risk.reasons.join("; ") || "brak sygnałów ryzyka"}`}
                    style={{
                      padding: "0.4rem 0.45rem",
                      borderRadius: "8px",
                      border: `1px solid ${st.bar}`,
                      background: st.bg,
                      cursor: "grab",
                    }}
                  >
                    <div style={{ color: "#f8fafc", fontSize: "0.78rem", fontWeight: 700 }}>{w.nazwa}</div>
                    <div style={{ color: "#cbd5e1", fontSize: "0.68rem" }}>
                      {dataPLZFormat(isoDate(w.data_plan_od))} - {dataPLZFormat(isoDate(w.data_plan_do))}
                    </div>
                  </div>
                );
              })}
              {worksWithoutAssignment.length === 0 ? <div style={{ color: "#94a3b8", fontSize: "0.74rem" }}>Brak zadań bez przydziału.</div> : null}
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "separate", borderSpacing: "2px", minWidth: "980px" }}>
              <thead>
                <tr>
                  <th style={{ ...s.th, position: "sticky", left: 0, zIndex: 1 }}>Pracownik</th>
                  {plannerDays.map((day) => (
                    <th key={day} style={{ ...s.th, fontSize: "0.68rem", minWidth: "70px" }}>
                      {dataPLZFormat(day)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plannerRows.map((row) => (
                  <tr key={`${row.kind}-${row.id}`}>
                    <td style={{ ...s.td, position: "sticky", left: 0, zIndex: 1, background: "#0f172a", minWidth: "180px" }}>
                      {row.label}
                    </td>
                    {plannerDays.map((day) => {
                      const key = `${row.kind}|${row.id}|${day}`;
                      const items = plannerAssignments.get(key) ?? [];
                      return (
                        <td
                          key={key}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (!dragPayload) return;
                            if (dragPayload.type === "work") {
                              void assignWorkFromPlanner({ workId: dragPayload.workId, rowKind: row.kind, rowId: row.id, day });
                            } else if (dragPayload.type === "assignment") {
                              void moveAssignmentFromPlanner({ assignmentId: dragPayload.assignmentId, rowKind: row.kind, rowId: row.id, day });
                            }
                            setDragPayload(null);
                          }}
                          style={{
                            ...s.td,
                            minWidth: "70px",
                            minHeight: "2.2rem",
                            background: dragPayload ? "rgba(56,189,248,0.1)" : "rgba(30,41,59,0.25)",
                            verticalAlign: "top",
                            padding: "0.18rem",
                          }}
                        >
                          <div style={{ display: "grid", gap: "0.15rem" }}>
                            {items.map((a) => {
                              const w = works.find((x) => Number(x.id) === Number(a.praca_id));
                              const risk = w ? riskByWorkId.get(w.id) : null;
                              const rs = riskStyle(risk?.status ?? "brak danych");
                              return (
                                <div
                                  key={a.id}
                                  draggable
                                  onDragStart={() => setDragPayload({ type: "assignment", assignmentId: a.id })}
                                  onDragEnd={() => setDragPayload(null)}
                                  title={`${w?.nazwa ?? `Zadanie #${a.praca_id}`}\n${risk?.reasons?.join("; ") || "brak sygnałów ryzyka"}`}
                                  style={{
                                    fontSize: "0.62rem",
                                    lineHeight: 1.2,
                                    borderRadius: "5px",
                                    padding: "0.15rem 0.2rem",
                                    background: rs.bar,
                                    color: "#f8fafc",
                                    cursor: "grab",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {w?.nazwa ?? `#${a.praca_id}`}
                                    </span>
                                    <button
                                      type="button"
                                      title="Skróć o 1 dzień"
                                      onClick={(ev) => {
                                        ev.preventDefault();
                                        ev.stopPropagation();
                                        void resizeAssignmentFromPlanner({ assignmentId: a.id, side: "end", deltaDays: -1 });
                                      }}
                                      style={{
                                        border: "none",
                                        borderRadius: "3px",
                                        background: "rgba(15,23,42,0.35)",
                                        color: "#f8fafc",
                                        fontSize: "0.62rem",
                                        cursor: "pointer",
                                        padding: "0 0.15rem",
                                      }}
                                    >
                                      -
                                    </button>
                                    <button
                                      type="button"
                                      title="Wydłuż o 1 dzień"
                                      onClick={(ev) => {
                                        ev.preventDefault();
                                        ev.stopPropagation();
                                        void resizeAssignmentFromPlanner({ assignmentId: a.id, side: "end", deltaDays: 1 });
                                      }}
                                      style={{
                                        border: "none",
                                        borderRadius: "3px",
                                        background: "rgba(15,23,42,0.35)",
                                        color: "#f8fafc",
                                        fontSize: "0.62rem",
                                        cursor: "pointer",
                                        padding: "0 0.15rem",
                                      }}
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ ...op.sectionCard, marginBottom: "0.8rem" }}>
        <h3 style={{ ...op.sectionTitle, margin: "0 0 0.55rem", fontSize: "0.92rem" }}>Backlog i status terminu</h3>
        {works.length === 0 ? (
          <p style={{ ...op.muted, margin: 0 }}>Brak zadań planistycznych dla tego KR.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.4rem" }}>
            {works.map((w) => {
              const risk = riskByWorkId.get(w.id) ?? { status: "brak danych", reasons: [] };
              const st = riskStyle(risk.status);
              return (
                <div key={w.id} style={{ border: `1px solid ${st.bar}`, background: st.bg, borderRadius: "10px", padding: "0.45rem 0.6rem" }}>
                  <div style={{ display: "flex", gap: "0.55rem", alignItems: "center", justifyContent: "space-between" }}>
                    <strong style={{ color: "#f8fafc", fontSize: "0.82rem" }}>{w.nazwa || `Praca #${w.id}`}</strong>
                    <span style={{ fontSize: "0.72rem", color: st.fg, fontWeight: 700, textTransform: "uppercase" }}>{risk.status}</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#cbd5e1", marginTop: "0.2rem" }}>
                    {dataPLZFormat(isoDate(w.data_plan_od))} - {dataPLZFormat(isoDate(w.data_plan_do))} • postęp {risk.progress ?? 0}%
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#e2e8f0", marginTop: "0.2rem" }}>
                    {risk.reasons.length > 0 ? `Dlaczego: ${risk.reasons.join("; ")}` : "Dlaczego: brak sygnałów ryzyka"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem" }}>
        <form style={s.form} onSubmit={saveDemand}>
          <h3 style={{ ...op.sectionTitle, margin: 0, fontSize: "0.92rem" }}>1. Zapotrzebowanie</h3>
          <input style={s.input} placeholder="Tytuł" value={demandForm.tytul} onChange={(e) => setDemandForm((f) => ({ ...f, tytul: e.target.value }))} required />
          <textarea style={{ ...s.input, minHeight: "3rem" }} placeholder="Opis" value={demandForm.opis} onChange={(e) => setDemandForm((f) => ({ ...f, opis: e.target.value }))} />
          <button type="submit" style={s.btn}>Dodaj</button>
        </form>

        <form style={s.form} onSubmit={saveWork}>
          <h3 style={{ ...op.sectionTitle, margin: 0, fontSize: "0.92rem" }}>2. Praca terenowa</h3>
          <select style={s.input} value={workForm.demand_id} onChange={(e) => setWorkForm((f) => ({ ...f, demand_id: e.target.value }))}>
            <option value="">Bez linku do zapotrzebowania</option>
            {demands.map((d) => <option key={d.id} value={String(d.id)}>#{d.id} {d.tytul}</option>)}
          </select>
          <input style={s.input} placeholder="Nazwa pracy" value={workForm.nazwa} onChange={(e) => setWorkForm((f) => ({ ...f, nazwa: e.target.value }))} required />
          <div style={{ display: "grid", gap: "0.45rem", gridTemplateColumns: "1fr 1fr" }}>
            <input style={s.input} type="date" value={workForm.data_plan_od} onChange={(e) => setWorkForm((f) => ({ ...f, data_plan_od: e.target.value }))} required />
            <input style={s.input} type="date" value={workForm.data_plan_do} onChange={(e) => setWorkForm((f) => ({ ...f, data_plan_do: e.target.value }))} required />
          </div>
          <div style={{ display: "grid", gap: "0.45rem", gridTemplateColumns: "1fr 1fr" }}>
            <input
              style={s.input}
              type="date"
              value={workForm.deadline_nieprzekraczalny}
              onChange={(e) => setWorkForm((f) => ({ ...f, deadline_nieprzekraczalny: e.target.value }))}
              placeholder="Termin nieprzekraczalny"
            />
            <input
              style={s.input}
              type="number"
              min="0"
              step="0.5"
              value={workForm.estymata_dni}
              onChange={(e) => setWorkForm((f) => ({ ...f, estymata_dni: e.target.value }))}
              placeholder="Estymata dni"
            />
          </div>
          <button type="submit" style={s.btn}>Dodaj</button>
        </form>

        <form style={s.form} onSubmit={saveAssignment}>
          <h3 style={{ ...op.sectionTitle, margin: 0, fontSize: "0.92rem" }}>3. Przydział + zasoby</h3>
          <select style={s.input} value={assignmentForm.praca_id} onChange={(e) => setAssignmentForm((f) => ({ ...f, praca_id: e.target.value }))} required>
            <option value="">Wybierz pracę</option>
            {works.map((w) => <option key={w.id} value={String(w.id)}>{w.nazwa}</option>)}
          </select>
          <select style={s.input} value={assignmentForm.typ_wykonawcy} onChange={(e) => setAssignmentForm((f) => ({ ...f, typ_wykonawcy: e.target.value }))}>
            <option value="pracownik">Pracownik</option>
            <option value="podwykonawca">Podwykonawca</option>
          </select>
          {assignmentForm.typ_wykonawcy === "pracownik" ? (
            <select style={s.input} value={assignmentForm.pracownik_nr} onChange={(e) => setAssignmentForm((f) => ({ ...f, pracownik_nr: e.target.value }))} required>
              <option value="">Wybierz pracownika</option>
              {(() => {
                const cur = String(assignmentForm.pracownik_nr ?? "").trim();
                const nrs = new Set(pracownicyOpcjeSelect.map((p) => String(p.nr)));
                const orphan = cur !== "" && !nrs.has(cur);
                return (
                  <>
                    {orphan ? (
                      <option key={`orphan-asg-${cur}`} value={cur}>
                        {cur} (nie w liście)
                      </option>
                    ) : null}
                    {pracownicyOpcjeSelect.map((p) => (
                      <option key={p.nr} value={String(p.nr)}>
                        {p.imie_nazwisko || p.nr}
                      </option>
                    ))}
                  </>
                );
              })()}
            </select>
          ) : (
            <select style={s.input} value={assignmentForm.podwykonawca_id} onChange={(e) => setAssignmentForm((f) => ({ ...f, podwykonawca_id: e.target.value }))} required>
              <option value="">Wybierz podwykonawcę</option>
              {podwykonawcy.map((p) => <option key={p.id} value={String(p.id)}>{p.nazwa_firmy || `PW ${p.id}`}</option>)}
            </select>
          )}
          <div style={{ display: "grid", gap: "0.45rem", gridTemplateColumns: "1fr 1fr" }}>
            <input style={s.input} type="date" value={assignmentForm.data_od} onChange={(e) => setAssignmentForm((f) => ({ ...f, data_od: e.target.value }))} required />
            <input style={s.input} type="date" value={assignmentForm.data_do} onChange={(e) => setAssignmentForm((f) => ({ ...f, data_do: e.target.value }))} required />
          </div>
          <select style={s.input} value={assignmentForm.samochod_id} onChange={(e) => setAssignmentForm((f) => ({ ...f, samochod_id: e.target.value }))}>
            <option value="">Auto (opcjonalnie)</option>
            {samochody.map((c) => <option key={c.id} value={String(c.id)}>{c.nazwa || c.id}</option>)}
          </select>
          <select style={s.input} value={assignmentForm.sprzet_id} onChange={(e) => setAssignmentForm((f) => ({ ...f, sprzet_id: e.target.value }))}>
            <option value="">Sprzęt (opcjonalnie)</option>
            {sprzet.map((x) => <option key={x.id} value={String(x.id)}>{x.nazwa || x.numer_inwentarzowy || x.id}</option>)}
          </select>
          <button type="submit" style={s.btn}>Zapisz przydział</button>
        </form>

        <form style={s.form} onSubmit={saveReport}>
          <h3 style={{ ...op.sectionTitle, margin: 0, fontSize: "0.92rem" }}>4. Raport postępu</h3>
          <select style={s.input} value={reportForm.praca_id} onChange={(e) => setReportForm((f) => ({ ...f, praca_id: e.target.value }))} required>
            <option value="">Wybierz pracę</option>
            {works.map((w) => <option key={w.id} value={String(w.id)}>{w.nazwa}</option>)}
          </select>
          <input style={s.input} type="number" min="0" max="100" value={reportForm.procent_postepu} onChange={(e) => setReportForm((f) => ({ ...f, procent_postepu: e.target.value }))} />
          <textarea style={{ ...s.input, minHeight: "3rem" }} placeholder="Uwagi" value={reportForm.uwagi} onChange={(e) => setReportForm((f) => ({ ...f, uwagi: e.target.value }))} />
          <button type="submit" style={s.btn}>Dodaj raport</button>
        </form>
        <form style={s.form} onSubmit={saveDailyExecution}>
          <h3 style={{ ...op.sectionTitle, margin: 0, fontSize: "0.92rem" }}>5. Wykonanie dzienne (powiązane)</h3>
          <select style={s.input} value={dailyForm.praca_id} onChange={(e) => setDailyForm((f) => ({ ...f, praca_id: e.target.value }))} required>
            <option value="">Wybierz pracę planistyczną</option>
            {works.map((w) => <option key={w.id} value={String(w.id)}>{w.nazwa}</option>)}
          </select>
          <input style={s.input} type="date" value={dailyForm.data_dnia} onChange={(e) => setDailyForm((f) => ({ ...f, data_dnia: e.target.value }))} required />
          <select style={s.input} value={dailyForm.pracownik_nr} onChange={(e) => setDailyForm((f) => ({ ...f, pracownik_nr: e.target.value }))} required>
            <option value="">Pracownik</option>
            {(() => {
              const cur = String(dailyForm.pracownik_nr ?? "").trim();
              const nrs = new Set(pracownicyOpcjeSelect.map((p) => String(p.nr)));
              const orphan = cur !== "" && !nrs.has(cur);
              return (
                <>
                  {orphan ? (
                    <option key={`orphan-dly-${cur}`} value={cur}>
                      {cur} (nie w liście)
                    </option>
                  ) : null}
                  {pracownicyOpcjeSelect.map((p) => (
                    <option key={p.nr} value={String(p.nr)}>
                      {p.imie_nazwisko || p.nr}
                    </option>
                  ))}
                </>
              );
            })()}
          </select>
          <input style={s.input} value={dailyForm.opis} onChange={(e) => setDailyForm((f) => ({ ...f, opis: e.target.value }))} placeholder="Krótki opis wykonania" required />
          <div style={{ display: "grid", gap: "0.45rem", gridTemplateColumns: "1fr 1fr" }}>
            <input style={s.input} type="number" min="0" value={dailyForm.ilosc_plan} onChange={(e) => setDailyForm((f) => ({ ...f, ilosc_plan: e.target.value }))} />
            <input style={s.input} type="number" min="0" value={dailyForm.ilosc_wykonano} onChange={(e) => setDailyForm((f) => ({ ...f, ilosc_wykonano: e.target.value }))} />
          </div>
          <button type="submit" style={s.btn}>Dodaj wpis dzienny</button>
        </form>
      </div>

      <div style={{ ...op.sectionCard, marginTop: "0.9rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "0.5rem" }}>
          {["rok", "miesiac", "tydzien", "dzien"].map((z) => (
            <button key={z} type="button" style={zoom === z ? s.btn : s.btnGhost} onClick={() => setZoom(z)}>{z}</button>
          ))}
          <button type="button" style={layers.etapy ? s.btn : s.btnGhost} onClick={() => setLayers((v) => ({ ...v, etapy: !v.etapy }))}>Etapy</button>
          <button type="button" style={layers.zasoby ? s.btn : s.btnGhost} onClick={() => setLayers((v) => ({ ...v, zasoby: !v.zasoby }))}>Zasoby</button>
        </div>
        {!minDay ? (
          <p style={{ ...op.muted, margin: 0 }}>Brak danych do Gantta dla wybranego KR.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: `${chartWidth}px`, width: `${chartWidth}px`, display: "grid", gap: "0.35rem" }}>
              {ganttRows.map((r, i) => {
                const left = xPos(r.start);
                const right = xPos(r.end);
                const width = Math.max(6, right - left + 6);
                const riskColor = riskStyle(r.risk ?? "bezpieczne");
                const bg = r.layer === "etapy" ? "#fbbf24" : r.layer === "zasoby" ? "#a78bfa" : riskColor.bar;
                return (
                  <div key={`${r.layer}-${i}-${r.label}`} style={{ position: "relative", height: "24px", background: "rgba(148,163,184,0.06)", borderRadius: "8px" }}>
                    <div
                      title={`${r.label} (${dataPLZFormat(r.start)} - ${dataPLZFormat(r.end)})${r.risk ? ` | ${r.risk}` : ""}${r.reasons?.length ? ` | ${r.reasons.join("; ")}` : ""}`}
                      style={{ position: "absolute", left: `${left}px`, top: "4px", height: "16px", width: `${width}px`, borderRadius: "999px", background: bg, opacity: 0.9 }}
                    />
                    <span style={{ position: "absolute", left: "6px", top: "3px", fontSize: "0.68rem", color: "#e2e8f0", maxWidth: "38%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ fontSize: "0.74rem", color: "#94a3b8", marginTop: "0.5rem" }}>
          Legenda: <span style={{ color: "#10b981" }}>teren bezpieczne</span> • <span style={{ color: "#f59e0b" }}>do sprawdzenia</span> •{" "}
          <span style={{ color: "#ef4444" }}>zagrożone</span> • <span style={{ color: "#94a3b8" }}>brak danych</span> • <span style={{ color: "#fbbf24" }}>etapy</span> •{" "}
          <span style={{ color: "#a78bfa" }}>zasoby</span>
        </div>
      </div>

      <div style={{ ...op.sectionCard, marginTop: "0.9rem" }}>
        <h3 style={{ ...op.sectionTitle, margin: "0 0 0.45rem", fontSize: "0.9rem" }}>Szybka kontrola operacyjna</h3>
        <div style={{ fontSize: "0.8rem", color: "#e2e8f0", lineHeight: 1.45 }}>
          <div>Otwarte prace: {works.filter((w) => w.status !== "zakonczone" && w.status !== "anulowane").length}</div>
          <div>Raporty dzisiaj: {reports.filter((r) => isoDate(r.data_raportu) === isoDate(new Date().toISOString())).length}</div>
          <div>Dzienne wpisy pod zadaniami: {dailyTasks.filter((x) => x.praca_id != null).length} / {dailyTasks.length}</div>
          <div style={{ color: resourceConflicts.length > 0 ? "#fca5a5" : "#86efac" }}>
            Konflikty aut: {resourceConflicts.length}
          </div>
        </div>
      </div>
    </>
  );
}

