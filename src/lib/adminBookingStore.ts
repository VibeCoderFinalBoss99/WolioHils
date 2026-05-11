const STORAGE_KEY = "wolio_completed_bookings";
const CHANNEL_NAME = "wolio-admin-bookings";

export type RecordedBooking = {
  order_id: string;
  transaction_id?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  gross_amount: number;
  checkIn: string;
  checkOut: string;
  propertyName: string;
  payment_type?: string;
  transaction_status?: string;
  recordedAt: string;
};

export type SuccessBookingPayload = {
  order_id: string;
  transaction_id?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  gross_amount: string;
  checkIn: string;
  checkOut: string;
  propertyName: string;
  payment_type?: string;
  transaction_status?: string;
};

function readRaw(): RecordedBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as RecordedBooking[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeRaw(list: RecordedBooking[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("wolio-bookings-updated"));
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.postMessage({ type: "updated" });
    ch.close();
  } catch {
    /* BroadcastChannel optional */
  }
}

export function getBookings(): RecordedBooking[] {
  return readRaw().sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

export function getBookingStats(): { count: number; revenue: number } {
  const list = readRaw();
  const revenue = list.reduce((sum, b) => {
    const n = Number(b.gross_amount);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
  return { count: list.length, revenue };
}

/** Menyimpan booking sukses sekali per `order_id`. */
export function recordSuccessfulBooking(payload: SuccessBookingPayload): boolean {
  const list = readRaw();
  if (list.some((b) => b.order_id === payload.order_id)) return false;

  const gross = Math.round(Number(payload.gross_amount));
  const rec: RecordedBooking = {
    order_id: payload.order_id,
    transaction_id: payload.transaction_id,
    guestName: payload.guestName,
    guestEmail: payload.guestEmail,
    guestPhone: payload.guestPhone,
    gross_amount: Number.isFinite(gross) ? gross : 0,
    checkIn: payload.checkIn,
    checkOut: payload.checkOut,
    propertyName: payload.propertyName,
    payment_type: payload.payment_type,
    transaction_status: payload.transaction_status || "settlement",
    recordedAt: new Date().toISOString(),
  };
  list.push(rec);
  writeRaw(list);
  return true;
}

/** Langganan pembaruan (tab lain, channel, interval cadangan). */
export function subscribeBookingUpdates(onUpdate: () => void): () => void {
  const handlerStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) onUpdate();
  };
  const handlerCustom = () => onUpdate();

  window.addEventListener("storage", handlerStorage);
  window.addEventListener("wolio-bookings-updated", handlerCustom);

  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = () => onUpdate();
  } catch {
    /* ignore */
  }

  const interval = window.setInterval(onUpdate, 5000);

  return () => {
    window.removeEventListener("storage", handlerStorage);
    window.removeEventListener("wolio-bookings-updated", handlerCustom);
    bc?.close();
    window.clearInterval(interval);
  };
}
