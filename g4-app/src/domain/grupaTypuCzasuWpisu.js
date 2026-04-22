import { CZAS_TYP_WPISU } from "../CzasPracyPanel.jsx";

export function grupaTypuCzasuWpisu(typ) {
  if (String(typ ?? "").trim() === "delegacja") return "praca";
  const row = CZAS_TYP_WPISU.find((t) => t.value === typ);
  return row?.grupa ?? "inne";
}
