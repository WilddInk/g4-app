/**
 * Wersja z package.json (semver — podbijasz przy wydaniu: npm version patch / ręcznie),
 * skrót commita i znacznik czasu budowy — wstrzykiwane w compile time przez Vite (vite.config.js).
 */

export const WERSJA_SEMVER = __G4_APP_VERSION__;
export const BUDOWA_ISO = __G4_BUILD_TIME__;
export const GIT_SHORT = __G4_GIT_SHORT__;
export const GIT_DIRTY = __G4_GIT_DIRTY__ === "1";

/** Etykieta do paska, np. "a1b2c3d" lub "a1b2c3d*" przy lokalnych zmianach. */
export function etykietaGitu() {
  const s = String(GIT_SHORT ?? "").trim();
  if (!s) return "";
  return GIT_DIRTY ? `${s}*` : s;
}

/** Data i godzina budowy do wyświetlenia (strefa przeglądarki). */
export function formatujBudowePl(iso) {
  const t = String(iso ?? "").trim();
  if (!t) return "—";
  try {
    return new Date(t).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "medium" });
  } catch {
    return t;
  }
}
