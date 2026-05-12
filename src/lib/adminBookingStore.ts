import { getSupabase } from "./supabase";

const CHANNEL_NAME = "wolio-admin-bookings";

/**
 * Jika diatur, GET/POST transaksi tetap ke URL ini (legacy). Default: Supabase.
 * Contoh: `https://domain.com/api/wolio/transactions`
 */
function legacyTransactionsApiUrl(): string | null {
  const v = import.meta.env.VITE_WOLIO_STORE_API;
  if (v && String(v).trim()) return String(v).trim();
  return null;
}

function notifyClients() {
  window.dispatchEvent(new CustomEvent("wolio-bookings-updated"));
  try {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    ch.postMessage({ type: "updated" });
    ch.close();
  } catch {
    /* optional */
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (init?.body) headers["Content-Type"] = "application/json";
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Status tampilan admin & laporan */
export type PaymentUiStatus = "berhasil" | "pending" | "gagal" | "dibatalkan";

export type StoredBooking = {
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
  payment_status: PaymentUiStatus;
  recordedAt: string;
};

/** Alias untuk kompatibilitas dashboard */
export type RecordedBooking = StoredBooking;

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
  property_id?: number | null;
  guests?: number;
  rooms?: number;
  special_requests?: string;
  payment_type?: string;
  transaction_status?: string;
};

type BookingDbRow = {
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
  payment_status: PaymentUiStatus;
  recorded_at: string;
};

function rowToStored(r: BookingDbRow): StoredBooking {
  return {
    order_id: r.order_id,
    transaction_id: r.transaction_id ?? undefined,
    guestName: r.guest_name,
    guestEmail: r.guest_email,
    guestPhone: r.guest_phone,
    gross_amount: r.gross_amount,
    checkIn: r.check_in,
    checkOut: r.check_out,
    propertyName: r.property_name,
    property_id: r.property_id,
    guests: r.guests,
    rooms: r.rooms,
    special_requests: r.special_requests,
    payment_type: r.payment_type ?? undefined,
    transaction_status: r.transaction_status ?? undefined,
    payment_status: r.payment_status,
    recordedAt: r.recorded_at,
  };
}

function storedToRow(rec: StoredBooking): BookingDbRow {
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

function parseYmdLocal(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Malam menginap: dari check-in sampai sebelum check-out */
export function expandStayNightDates(checkIn: string, checkOut: string): string[] {
  if (!checkIn || !checkOut || checkIn >= checkOut) return [];
  const out: string[] = [];
  const cur = parseYmdLocal(checkIn);
  const end = parseYmdLocal(checkOut);
  while (cur < end) {
    out.push(toLocalYmd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function mapMidtransToUi(transactionStatus?: string): PaymentUiStatus {
  const s = (transactionStatus || "").toLowerCase();
  if (s === "settlement" || s === "capture") return "berhasil";
  if (s === "pending") return "pending";
  if (s === "cancel") return "dibatalkan";
  if (s === "deny" || s === "expire" || s === "failure") return "gagal";
  if (s === "refund" || s === "partial_refund") return "dibatalkan";
  return "gagal";
}

async function readAllLegacy(): Promise<StoredBooking[]> {
  const base = legacyTransactionsApiUrl();
  if (!base) throw new Error("Legacy API URL tidak diatur");
  const data = await fetchJson<StoredBooking[]>(base, { method: "GET", cache: "no-store" });
  return Array.isArray(data) ? data : [];
}

async function readAllSupabase(): Promise<StoredBooking[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("bookings").select("*").order("recorded_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as BookingDbRow[]).map(rowToStored);
}

async function readAll(): Promise<StoredBooking[]> {
  if (legacyTransactionsApiUrl()) {
    return readAllLegacy();
  }
  return readAllSupabase();
}

async function upsertLegacy(rec: StoredBooking): Promise<void> {
  const url = legacyTransactionsApiUrl();
  if (!url) throw new Error("Legacy API URL tidak diatur");
  await fetchJson(url, { method: "POST", body: JSON.stringify({ record: rec }) });
}

async function upsertSupabase(rec: StoredBooking): Promise<void> {
  const supabase = getSupabase();
  const row = storedToRow(rec);
  const { error } = await supabase.from("bookings").upsert(row, { onConflict: "order_id" });
  if (error) throw new Error(error.message);
}

async function upsertRemote(rec: StoredBooking): Promise<void> {
  if (legacyTransactionsApiUrl()) {
    await upsertLegacy(rec);
  } else {
    await upsertSupabase(rec);
  }
  notifyClients();
}

export async function fetchAllBookingsSorted(): Promise<StoredBooking[]> {
  const list = await readAll();
  return list.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

export function getSuccessfulBookingsFromList(list: StoredBooking[]): StoredBooking[] {
  return list.filter((b) => b.payment_status === "berhasil");
}

/** Tanggal malam yang sudah dibayar (untuk kalender reservasi) */
export function getSuccessfulBookingStayDatesFromList(list: StoredBooking[]): string[] {
  const set = new Set<string>();
  for (const b of getSuccessfulBookingsFromList(list)) {
    for (const d of expandStayNightDates(b.checkIn, b.checkOut)) {
      set.add(d);
    }
  }
  return [...set];
}

export function deriveBookingStats(list: StoredBooking[]): { count: number; revenue: number } {
  const ok = getSuccessfulBookingsFromList(list);
  const revenue = ok.reduce((sum, b) => {
    const n = Number(b.gross_amount);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
  return { count: ok.length, revenue };
}

/** Saat user membuka Snap — order masuk sebagai pending */
export async function recordPendingOrder(payload: SuccessBookingPayload): Promise<void> {
  const rec: StoredBooking = {
    order_id: payload.order_id,
    transaction_id: payload.transaction_id,
    guestName: payload.guestName,
    guestEmail: payload.guestEmail,
    guestPhone: payload.guestPhone,
    gross_amount: 0,
    checkIn: payload.checkIn,
    checkOut: payload.checkOut,
    propertyName: payload.propertyName,
    property_id: payload.property_id ?? null,
    guests: payload.guests ?? 1,
    rooms: payload.rooms ?? 1,
    special_requests: payload.special_requests ?? "",
    payment_type: payload.payment_type,
    transaction_status: payload.transaction_status || "pending",
    payment_status: "pending",
    recordedAt: new Date().toISOString(),
  };
  await upsertRemote(rec);
}

/**
 * Hasil Snap / halaman sukses — mengisi ulang status.
 */
export async function recordPaymentOutcome(payload: SuccessBookingPayload): Promise<void> {
  const list = await readAll();
  const ui = mapMidtransToUi(payload.transaction_status);
  const grossFull = Math.round(Number(payload.gross_amount));
  const grossForStats = ui === "berhasil" && Number.isFinite(grossFull) ? grossFull : 0;

  const existing = list.find((x) => x.order_id === payload.order_id);
  const rec: StoredBooking = {
    order_id: payload.order_id,
    transaction_id: payload.transaction_id,
    guestName: payload.guestName,
    guestEmail: payload.guestEmail,
    guestPhone: payload.guestPhone,
    gross_amount: grossForStats,
    checkIn: payload.checkIn,
    checkOut: payload.checkOut,
    propertyName: payload.propertyName,
    property_id: payload.property_id ?? existing?.property_id ?? null,
    guests: payload.guests ?? existing?.guests ?? 1,
    rooms: payload.rooms ?? existing?.rooms ?? 1,
    special_requests: payload.special_requests ?? existing?.special_requests ?? "",
    payment_type: payload.payment_type,
    transaction_status: payload.transaction_status,
    payment_status: ui,
    recordedAt: existing?.recordedAt ?? new Date().toISOString(),
  };
  await upsertRemote(rec);
}

/** Kompatibilitas */
export async function recordSuccessfulBooking(payload: SuccessBookingPayload): Promise<boolean> {
  await recordPaymentOutcome({
    ...payload,
    transaction_status: payload.transaction_status || "settlement",
  });
  return true;
}

export async function recordFailedOrCancelledOrder(payload: {
  order_id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  gross_amount: string;
  checkIn: string;
  checkOut: string;
  propertyName: string;
  property_id?: number | null;
  guests?: number;
  rooms?: number;
  special_requests?: string;
  transaction_status?: string;
  reason?: string;
}): Promise<void> {
  const ui: PaymentUiStatus =
    (payload.transaction_status || "").toLowerCase() === "cancel" ? "dibatalkan" : "gagal";
  let prev: StoredBooking | undefined;
  try {
    const list = await readAll();
    prev = list.find((x) => x.order_id === payload.order_id);
  } catch {
    /* ignore */
  }
  const rec: StoredBooking = {
    order_id: payload.order_id,
    guestName: payload.guestName,
    guestEmail: payload.guestEmail,
    guestPhone: payload.guestPhone,
    gross_amount: 0,
    checkIn: payload.checkIn,
    checkOut: payload.checkOut,
    propertyName: payload.propertyName,
    property_id: payload.property_id ?? prev?.property_id ?? null,
    guests: payload.guests ?? prev?.guests ?? 1,
    rooms: payload.rooms ?? prev?.rooms ?? 1,
    special_requests: payload.special_requests ?? prev?.special_requests ?? "",
    transaction_status: payload.transaction_status || payload.reason,
    payment_status: ui,
    recordedAt: prev?.recordedAt ?? new Date().toISOString(),
  };
  await upsertRemote(rec);
}

export async function markOrderCancelledByUser(order_id: string): Promise<void> {
  const list = await readAll();
  const prev = list.find((x) => x.order_id === order_id);
  if (!prev) return;
  const next: StoredBooking = {
    ...prev,
    payment_status: "dibatalkan",
    transaction_status: prev.transaction_status || "cancel",
    gross_amount: 0,
  };
  await upsertRemote(next);
}

export function subscribeBookingUpdates(onUpdate: () => void): () => void {
  const handlerCustom = () => onUpdate();

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
    window.removeEventListener("wolio-bookings-updated", handlerCustom);
    bc?.close();
    window.clearInterval(interval);
  };
}
