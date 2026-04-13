/**
 * `true` — tylko zalogowani widzą dane (ustaw w .env przy deployu: VITE_REQUIRE_AUTH=true).
 * Domyślnie / brak zmiennej — aplikacja publiczna (jak dotychczas, klucz anon w RLS).
 */
export const requireAuth =
  import.meta.env.VITE_REQUIRE_AUTH === "true" ||
  import.meta.env.VITE_REQUIRE_AUTH === "1";
