import type { BookingData } from "../App";

const SNAP_SANDBOX = "https://app.sandbox.midtrans.com/snap/snap.js";
const SNAP_PRODUCTION = "https://app.midtrans.com/snap/snap.js";

export function getSnapScriptUrl(isProduction: boolean): string {
  return isProduction ? SNAP_PRODUCTION : SNAP_SANDBOX;
}

export function loadMidtransSnap(clientKey: string, isProduction: boolean): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const wantedSrc = getSnapScriptUrl(isProduction);
  const wantedOrigin = new URL(wantedSrc).origin;

  const existing = document.querySelector('script[data-midtrans-snap="1"]') as HTMLScriptElement | null;
  const existingSrc = existing?.src || "";
  const existingOrigin = existingSrc ? new URL(existingSrc).origin : "";
  const existingKey = existing?.getAttribute("data-client-key") || "";
  const mismatch = !!existing && (existingOrigin !== wantedOrigin || existingKey !== clientKey);

  // Jika mode/key berubah (sandbox<->production atau key beda), paksa reload script snap
  if (mismatch) {
    existing?.remove();
    try {
      delete (window as Window & { snap?: unknown }).snap;
    } catch {
      (window as Window & { snap?: unknown }).snap = undefined;
    }
  }
  if ((window as Window & { snap?: unknown }).snap && !mismatch) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const current = document.querySelector('script[data-midtrans-snap="1"]') as HTMLScriptElement | null;
    if (current) {
      current.addEventListener("load", () => resolve(), { once: true });
      current.addEventListener("error", () => reject(new Error("Gagal memuat Midtrans Snap")), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = wantedSrc;
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
