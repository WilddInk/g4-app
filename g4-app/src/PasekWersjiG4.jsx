import { BUDOWA_ISO, etykietaGitu, formatujBudowePl, WERSJA_SEMVER } from "./appWersja.js";

/** Jedna linia: semver · git · data/godzina budowy (wartości z Vite przy starcie dev / build). */
export function PasekWersjiG4({ style }) {
  const git = etykietaGitu();
  const bud = formatujBudowePl(BUDOWA_ISO);
  const title = [git ? `git: ${git}` : null, `budowa ISO: ${BUDOWA_ISO}`].filter(Boolean).join(" · ");
  return (
    <div style={style} title={title}>
      Wersja {WERSJA_SEMVER}
      {git ? ` · ${git}` : ""}
      {` · budowa ${bud}`}
    </div>
  );
}
