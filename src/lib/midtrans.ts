import type { BookingData } from "../App";

const SNAP_SANDBOX = "https://app.sandbox.midtrans.com/snap/snap.js";
const SNAP_PRODUCTION = "https://app.midtrans.com/snap/snap.js";

export function getSnapScriptUrl(isProduction: boolean): string {
  return isProduction ? SNAP_PRODUCTION : SNAP_SANDBOX;
}

export function loadMidtransSnap(clientKey: string, isProduction: boolean): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.snap) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-midtrans-snap="1"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Gagal memuat Midtrans Snap")), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = getSnapScriptUrl(isProduction);
    s.async = true;
    s.dataset.midtransSnap = "1";
    s.setAttribute("data-client-key", clientKey);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Gagal memuat Midtrans Snap"));
    document.body.appendChild(s);
  });
}

export async function createSnapToken(payload: {
  orderId: string;
  grossAmount: number;
  booking: BookingData;
  itemName: string;
}): Promise<string> {
  const res = await fetch("/api/midtrans/snap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { token?: string; error?: string };
  if (!res.ok || !data.token) {
    throw new Error(data.error || "Gagal membuat sesi pembayaran");
  }
  return data.token;
}
