/** Polski NIP: tylko cyfry, maks. 10 (zgodnie z dotychczasową logiką w aplikacji). */
export function nipPolskiCyfry(raw) {
  return String(raw ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

/**
 * NIP / VAT / inny identyfikator podatkowy (także zagraniczny, literowo-cyfrowy).
 * Usuwa separatory, wielkie litery, odrzuca znaki spoza A–Z / 0–9. Prefiks `NIP_` ze starych importów jest obcinany.
 */
export function identyfikatorPodatkowyZnormalizowany(raw) {
  let s = String(raw ?? "").trim();
  if (s.toUpperCase().startsWith("NIP_")) s = s.slice(4).trim();
  s = s.toUpperCase().replace(/[\s.\-_/]/g, "");
  s = s.replace(/[^A-Z0-9]/g, "");
  return s.slice(0, 28);
}

/** Klucz do mapy sprzedawca → nazwa: przy dokładnie 10 cyfrach — klucz polski; w przeciwnym razie pełny znormalizowany VAT. */
export function kluczSprzedawcaDoMapy(nipRaw) {
  const pol = nipPolskiCyfry(nipRaw);
  if (pol.length === 10) return pol;
  const full = identyfikatorPodatkowyZnormalizowany(nipRaw);
  return full || pol;
}

/** Nazwa ze słownika lub z wcześniejszych faktur po identyfikatorze sprzedawcy. */
export function nazwaSprzedawcyZMapy(mapa, sprzedawcaNipRaw) {
  if (!mapa) return undefined;
  const pol = nipPolskiCyfry(sprzedawcaNipRaw);
  if (pol.length === 10) {
    const n = mapa.get(pol);
    if (n) return n;
  }
  const full = identyfikatorPodatkowyZnormalizowany(sprzedawcaNipRaw);
  return full ? mapa.get(full) : undefined;
}
