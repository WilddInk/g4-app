import { createClient } from "@supabase/supabase-js";

/**
 * Domyślny URL dopasowany do projektu z Table Editor (ref w adresie panelu).
 * Możesz nadpisać w `g4-app/.env`: VITE_SUPABASE_URL=...
 *
 * Klucz anon z tego samego projektu: Settings → API → anon (public).
 * W `.env`: VITE_SUPABASE_ANON_KEY=...
 *
 * Reset hasła: opcjonalnie `VITE_AUTH_REDIRECT_URL` (pełny URL strony logowania), musi być dopisany w Supabase
 * → Authentication → URL Configuration → Redirect URLs.
 *
 * Jeśli w panelu widać dane, a w aplikacji nie — zwykle przyczyna to:
 * (1) inny ref w URL niż w panelu, (2) klucz anon z innego projektu,
 * (3) RLS na tabeli `kr` bez polityki SELECT dla `anon`.
 */
export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://xtkzubyrxcngzwlykzup.supabase.co";

/** Host z konfiguracji (np. diagnostyka: czy zapis trafia do właściwego projektu). */
export function supabaseApiHostname() {
  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return "";
  }
}

const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "sb_publishable_egj88SMg2r8pgEhdZl94_g_hWAIBlt0";

export const supabase = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
