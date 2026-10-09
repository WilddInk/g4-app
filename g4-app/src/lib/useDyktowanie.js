import { useEffect, useRef, useState } from "react";

function ctorRozpoznawaniaMowy() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Mowa → tekst (pl-PL).
 * onTekst dostaje bieżący tekst (z niedokończonym fragmentem).
 * onGotowe(tekst) po pauzie albo Stop. Gdy zwróci true, bufor czyści się pod następną wypowiedź.
 */
export function useDyktowanie({ onTekst, onGotowe, pauzaMs = 2200 } = {}) {
  const [slucham, setSlucham] = useState(false);
  const [blad, setBlad] = useState("");
  const sluchamRef = useRef(false);
  const recRef = useRef(null);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const timerRef = useRef(null);
  const onTekstRef = useRef(onTekst);
  const onGotoweRef = useRef(onGotowe);
  const zatwierdzPoPauzieRef = useRef(false);

  onTekstRef.current = onTekst;
  onGotoweRef.current = onGotowe;

  function wyczyscTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function publikuj() {
    const tekst = [finalRef.current, interimRef.current].filter(Boolean).join(" ");
    onTekstRef.current?.(tekst);
  }

  function oddajGotowy() {
    const tekst = [finalRef.current, interimRef.current].filter(Boolean).join(" ").trim();
    interimRef.current = "";
    if (!tekst || !zatwierdzPoPauzieRef.current) return tekst;
    const reset = onGotoweRef.current?.(tekst) !== false;
    if (reset) {
      finalRef.current = "";
      onTekstRef.current?.("");
    }
    return tekst;
  }

  function zaplanujPauze() {
    if (!zatwierdzPoPauzieRef.current) return;
    wyczyscTimer();
    timerRef.current = setTimeout(() => {
      if (!sluchamRef.current) return;
      oddajGotowy();
    }, pauzaMs);
  }

  function zatrzymaj({ zapisz = true } = {}) {
    wyczyscTimer();
    sluchamRef.current = false;
    setSlucham(false);
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    if (zapisz) oddajGotowy();
    else {
      interimRef.current = "";
    }
  }

  function start({ tekstBazowy = "", zatwierdzPoPauzie = false } = {}) {
    const Ctor = ctorRozpoznawaniaMowy();
    if (!Ctor) {
      setBlad("Dyktowanie działa w Chrome lub Edge — zezwól na mikrofon.");
      return;
    }
    setBlad("");
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    wyczyscTimer();
    zatwierdzPoPauzieRef.current = Boolean(zatwierdzPoPauzie);
    finalRef.current = String(tekstBazowy ?? "").trim();
    interimRef.current = "";
    const rec = new Ctor();
    rec.lang = "pl-PL";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const t = String(event.results[i]?.[0]?.transcript ?? "").trim();
        if (!t) continue;
        if (event.results[i].isFinal) {
          finalRef.current = [finalRef.current, t].filter(Boolean).join(" ");
        } else {
          interim = t;
        }
      }
      interimRef.current = interim;
      publikuj();
      if (finalRef.current) zaplanujPauze();
    };
    rec.onerror = (event) => {
      const e = String(event?.error ?? "");
      if (e === "not-allowed" || e === "service-not-allowed") {
        zatrzymaj({ zapisz: false });
        setBlad("Brak zgody na mikrofon — kliknij kłódkę przy adresie i zezwól.");
        return;
      }
      if (e === "no-speech" || e === "aborted") return;
      setBlad(`Dyktowanie: ${e}`);
    };
    rec.onend = () => {
      if (!sluchamRef.current || recRef.current !== rec) return;
      try {
        rec.start();
      } catch {
        /* already started */
      }
    };
    recRef.current = rec;
    sluchamRef.current = true;
    setSlucham(true);
    try {
      rec.start();
    } catch (err) {
      sluchamRef.current = false;
      setSlucham(false);
      setBlad(`Nie udało się włączyć mikrofonu: ${err?.message || err}`);
    }
  }

  function ustawBaze(tekst) {
    finalRef.current = String(tekst ?? "");
    interimRef.current = "";
  }

  useEffect(
    () => () => {
      sluchamRef.current = false;
      wyczyscTimer();
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
    },
    [],
  );

  return { slucham, blad, start, zatrzymaj, ustawBaze };
}
