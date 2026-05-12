import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Client anon untuk bookings & kalender (RLS mengatur akses di Supabase). */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Konfigurasi Supabase belum lengkap: set VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env"
    );
  }
  client = createClient(url, key);
  return client;
}
