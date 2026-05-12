import { getSupabase } from "./supabase";
import { fetchAllBookingsSorted, getSuccessfulBookingStayDatesFromList } from "./adminBookingStore";

/** Tanggal malam menginap yang terblokir (view Supabase + fallback dari daftar booking). */
export async function fetchMergedBookedDatesSet(): Promise<Set<string>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("booked_stay_dates").select("stay_date");
    if (!error && data !== null) {
      return new Set(data.map((r) => String((r as { stay_date: string }).stay_date)));
    }
  } catch {
    /* fall through */
  }
  try {
    const list = await fetchAllBookingsSorted();
    return new Set(getSuccessfulBookingStayDatesFromList(list));
  } catch {
    return new Set();
  }
}
