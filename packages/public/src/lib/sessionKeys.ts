/** Kunci sessionStorage — dipakai App + halaman pembayaran agar konsisten */
export const BOOKING_DRAFT_KEY = "wolio_booking_draft";

/** Order Midtrans untuk sesi checkout saat ini — sama setelah refresh, tidak membuat transaksi baru */
export const PAY_ORDER_ID_KEY = "wolio_pay_order_id";

/** Sudah pernah memanggil recordPendingOrder untuk order ini di sesi ini */
export const PAY_PENDING_RECORDED_KEY = "wolio_pay_pending_recorded";

/** Hanya buka ulang Snap; jangan catat pending baru */
export const PAY_REOPEN_SNAP_KEY = "wolio_reopen_snap_only";

export function clearPaymentOrderState(): void {
  try {
    sessionStorage.removeItem(PAY_ORDER_ID_KEY);
    sessionStorage.removeItem(PAY_PENDING_RECORDED_KEY);
    sessionStorage.removeItem(PAY_REOPEN_SNAP_KEY);
  } catch {
    /* ignore */
  }
}

/** Reset checkout (booking baru dari beranda / form baru) */
export function clearFullPaymentSession(): void {
  clearPaymentOrderState();
  try {
    sessionStorage.removeItem("wolio_pay_session");
  } catch {
    /* ignore */
  }
}
