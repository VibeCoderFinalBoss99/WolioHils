import type { BookingData } from "../App";
import { BOOKING_DRAFT_KEY } from "./sessionKeys";

/** Baca draft booking dari sessionStorage (sumber kebenaran saat refresh / deep link #payment). */
export function loadBookingDraftFromSession(): Partial<BookingData> | null {
  try {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BookingData>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** Gabungkan state App + draft: field penting diisi dari draft jika props masih kosong. */
export function mergeBookingDataFromDraft(props: BookingData): BookingData {
  const d = loadBookingDraftFromSession();
  if (!d) return props;

  const s = (a: string | undefined, b: string | undefined) => (a && a.trim() ? a : b && b.trim() ? b : a || b || "");

  return {
    propertyId: props.propertyId ?? d.propertyId ?? null,
    propertyName: s(props.propertyName, d.propertyName),
    propertyPrice: props.propertyPrice || d.propertyPrice || 0,
    propertyImage: s(props.propertyImage, d.propertyImage),
    guestName: s(props.guestName, d.guestName),
    guestEmail: s(props.guestEmail, d.guestEmail),
    guestPhone: s(props.guestPhone, d.guestPhone),
    checkIn: s(props.checkIn, d.checkIn),
    checkOut: s(props.checkOut, d.checkOut),
    guests: Math.max(props.guests || 1, d.guests || 1),
    rooms: Math.max(props.rooms || 1, d.rooms || 1),
    specialRequests: props.specialRequests?.trim() ? props.specialRequests : d.specialRequests || "",
  };
}

export function hasCompleteStayAndGuest(b: BookingData): boolean {
  return Boolean(
    b.checkIn &&
      b.checkOut &&
      b.guestName?.trim() &&
      b.guestEmail?.trim() &&
      b.guestPhone?.trim()
  );
}
