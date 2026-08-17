/** KR ogólnobiurowa (biuro); w arkuszach często jako 0 / „0”. */
export const KR_OGOLNOBIUROWY = "000";

/** Trzy same cyfry → jedno zero z przodu (779→0779); „000” bez zmian. */
function dopelnijKrTrzyCyfryLeadingZero(s) {
  if (!s || s === KR_OGOLNOBIUROWY) return s;
  return /^\d{3}$/.test(s) ? `0${s}` : s;
}

/**
 * @param {unknown} krVal
 * @returns {string}
 */
export function normalizujKrZArkusza(krVal) {
  if (krVal == null || krVal === "") return "";
  if (typeof krVal === "number" && Number.isFinite(krVal) && krVal === 0) return KR_OGOLNOBIUROWY;
  const s = String(krVal).trim();
  if (s === "0") return KR_OGOLNOBIUROWY;
  return dopelnijKrTrzyCyfryLeadingZero(s);
}
