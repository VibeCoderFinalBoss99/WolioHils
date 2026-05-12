import { fetchPublicBookedDatesSet } from "./publicBookingApi";

/** Tanggal malam menginap yang terblokir (Supabase RPC `get_public_booked_dates`). */
export async function fetchMergedBookedDatesSet(): Promise<Set<string>> {
  return fetchPublicBookedDatesSet();
}
