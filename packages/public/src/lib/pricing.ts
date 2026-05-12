import type { BookingData } from "../App";

/**
 * Tarif per pemesanan (IDR), tidak tergantung lama menginap:
 * - Sampai 10 orang: Rp 2.000.000 (flat).
 * - Di atas 10 orang: +Rp 100.000 per orang tambahan (orang ke-11, 12, …), sekali per booking.
 */
export const STAY_RATES = {
  FLAT_BOOKING_UP_TO_10: 2_000_000,
  INCLUDED_GUESTS: 10,
  EXTRA_PER_PERSON_OVER_10: 100_000,
} as const;

export function calculateStaySubtotal(data: BookingData): number {
  if (!data.checkIn || !data.checkOut) return 0;

  const guests = data.guests;
  if (!guests || guests < 1) return 0;

  let total = STAY_RATES.FLAT_BOOKING_UP_TO_10;
  if (guests > STAY_RATES.INCLUDED_GUESTS) {
    total += (guests - STAY_RATES.INCLUDED_GUESTS) * STAY_RATES.EXTRA_PER_PERSON_OVER_10;
  }

  return total;
}

export function calculateFees(subtotal: number) {
  const fee = Math.round(subtotal * 0.05);
  const total = subtotal + fee;
  return { subtotal, fee, total };
}
