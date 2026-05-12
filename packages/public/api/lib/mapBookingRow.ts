/** Payload dari klien (camelCase) → baris tabel `bookings`. */

export type ClientBookingRecord = {
  order_id: string;
  transaction_id?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  gross_amount: number;
  checkIn: string;
  checkOut: string;
  propertyName: string;
  property_id?: number | null;
  guests?: number;
  rooms?: number;
  special_requests?: string;
  payment_type?: string;
  transaction_status?: string;
  payment_status: string;
  recordedAt: string;
};

export type BookingDbRow = {
  order_id: string;
  transaction_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  gross_amount: number;
  check_in: string;
  check_out: string;
  property_name: string;
  property_id: number | null;
  guests: number;
  rooms: number;
  special_requests: string;
  payment_type: string | null;
  transaction_status: string | null;
  payment_status: string;
  recorded_at: string;
};

export function mergeExistingBooking(ex: BookingDbRow, inc: BookingDbRow): BookingDbRow {
  const pick = (a: string, b: string) => (b != null && String(b).trim() !== "" ? b : a);
  return {
    ...ex,
    ...inc,
    guest_name: pick(ex.guest_name, inc.guest_name),
    guest_email: pick(ex.guest_email, inc.guest_email),
    guest_phone: pick(ex.guest_phone, inc.guest_phone),
    check_in: pick(ex.check_in, inc.check_in),
    check_out: pick(ex.check_out, inc.check_out),
    property_name: pick(ex.property_name, inc.property_name),
    property_id: inc.property_id ?? ex.property_id,
    guests: inc.guests || ex.guests,
    rooms: inc.rooms || ex.rooms,
    special_requests: inc.special_requests != null && inc.special_requests !== "" ? inc.special_requests : ex.special_requests,
    recorded_at: ex.recorded_at,
  };
}

export function clientRecordToDbRow(rec: ClientBookingRecord): BookingDbRow {
  return {
    order_id: rec.order_id,
    transaction_id: rec.transaction_id ?? null,
    guest_name: rec.guestName,
    guest_email: rec.guestEmail,
    guest_phone: rec.guestPhone,
    gross_amount: Math.round(Number(rec.gross_amount)),
    check_in: rec.checkIn,
    check_out: rec.checkOut,
    property_name: rec.propertyName,
    property_id: rec.property_id ?? null,
    guests: rec.guests ?? 1,
    rooms: rec.rooms ?? 1,
    special_requests: rec.special_requests ?? "",
    payment_type: rec.payment_type ?? null,
    transaction_status: rec.transaction_status ?? null,
    payment_status: rec.payment_status,
    recorded_at: rec.recordedAt,
  };
}
