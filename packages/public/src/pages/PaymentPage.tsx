import { useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import { Lock, ChevronLeft, Loader2 } from "lucide-react";
import type { PageName, BookingData } from "../App";
import { calculateFees, calculateStaySubtotal } from "../lib/pricing";
import { mergeBookingDataFromDraft } from "../lib/bookingDraft";
import { createSnapToken, loadMidtransSnap } from "../lib/midtrans";
import {
  markOrderCancelledByUser,
  recordFailedOrCancelledOrder,
  recordPendingOrder,
} from "../lib/publicBookingApi";
import {
  PAY_ORDER_ID_KEY,
  PAY_PENDING_RECORDED_KEY,
  PAY_REOPEN_SNAP_KEY,
} from "../lib/sessionKeys";
import type { PaymentSuccessPayload } from "./PaymentSuccessPage";
import type { PaymentFailurePayload } from "./PaymentFailurePage";

interface Props {
  bookingData: BookingData;
  navigate: (page: PageName) => void;
}

const SUCCESS_KEY = "wolio_payment_success";
const FAIL_KEY = "wolio_payment_failed";

function snapLockKey(orderId: string): string {
  return `wolio_snap_opened_${orderId}`;
}

function clearSnapLock(orderId: string) {
  try {
    sessionStorage.removeItem(snapLockKey(orderId));
  } catch {
    /* ignore */
  }
}

export default function PaymentPage({ bookingData, navigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapAttempt, setSnapAttempt] = useState(0);
  const orderIdRef = useRef<string | null>(null);
  const payStarted = useRef(false);
  const payFinished = useRef(false);
  /** Gabungkan props + sessionStorage draft (Vercel / refresh / #payment tidak kehilangan data). */
  const effectiveBooking = mergeBookingDataFromDraft(bookingData);
  const bookingRef = useRef(effectiveBooking);
  const navigateRef = useRef(navigate);
  bookingRef.current = effectiveBooking;
  navigateRef.current = navigate;

  const subtotal = calculateStaySubtotal({ ...effectiveBooking, rooms: 1 });
  const { fee, total } = calculateFees(subtotal);
  const grossAmount = Math.round(total);

  const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "";
  const isProduction = import.meta.env.VITE_MIDTRANS_PRODUCTION === "true";

  useEffect(() => {
    const session = sessionStorage.getItem("wolio_pay_session");

    const fail = async (msg: string, orderId?: string) => {
      if (payFinished.current) return;
      payFinished.current = true;
      const oid = orderId || orderIdRef.current || "";
      if (oid) clearSnapLock(oid);
      const bd = bookingRef.current;
      try {
        await recordFailedOrCancelledOrder({
          order_id: oid,
          guestName: bd.guestName,
          guestEmail: bd.guestEmail,
          guestPhone: bd.guestPhone,
          gross_amount: String(grossAmount),
          checkIn: bd.checkIn,
          checkOut: bd.checkOut,
          propertyName: bd.propertyName || "Wolio Hills Malino",
          property_id: bd.propertyId,
          guests: bd.guests,
          rooms: bd.rooms,
          special_requests: bd.specialRequests,
          transaction_status: "deny",
          reason: msg,
        });
      } catch (e) {
        console.error(e);
      }
      const pl: PaymentFailurePayload = { message: msg, order_id: oid };
      sessionStorage.setItem(FAIL_KEY, JSON.stringify(pl));
      navigateRef.current("payment-failed");
    };

    const pushSuccessPayload = (
      result: Record<string, string>,
      bd: BookingData,
      gross: number,
      transaction_status: string,
      oid: string
    ) => {
      const pl: PaymentSuccessPayload = {
        order_id: result.order_id || oid,
        transaction_id: result.transaction_id,
        payment_type: result.payment_type,
        transaction_status,
        gross_amount: String(gross),
        guestName: bd.guestName,
        guestEmail: bd.guestEmail,
        guestPhone: bd.guestPhone,
        checkIn: bd.checkIn,
        checkOut: bd.checkOut,
        propertyName: bd.propertyName || "Wolio Hills Malino",
        property_id: bd.propertyId,
        guests: bd.guests,
        rooms: bd.rooms,
        special_requests: bd.specialRequests,
      };
      sessionStorage.setItem(SUCCESS_KEY, JSON.stringify(pl));
      navigateRef.current("payment-success");
    };

    const handleSnapResult = (result: Record<string, string>, bd: BookingData, gross: number, oid: string) => {
      if (payFinished.current) return;
      const ts = (result.transaction_status || "").toLowerCase();
      payFinished.current = true;
      clearSnapLock(oid);

      if (ts === "settlement" || ts === "capture") {
        pushSuccessPayload(result, bd, gross, result.transaction_status || "settlement", oid);
        return;
      }
      if (ts === "pending") {
        pushSuccessPayload(result, bd, gross, "pending", oid);
        return;
      }
      void fail(result.status_message || "Pembayaran tidak berhasil", result.order_id || oid);
    };

    const run = async () => {
      const bd = bookingRef.current;
      const gross = Math.round(calculateFees(calculateStaySubtotal({ ...bd, rooms: 1 })).total);

      if (!bd.checkIn || !bd.checkOut) {
        setLoading(false);
        setError("Data booking belum lengkap. Kembali ke halaman booking.");
        return;
      }
      if (!clientKey) {
        setLoading(false);
        setError("VITE_MIDTRANS_CLIENT_KEY belum diatur di .env");
        return;
      }
      if (!session) {
        setLoading(false);
        setError("Sesi pembayaran tidak valid. Gunakan tombol “Lanjut ke Pembayaran” dari halaman booking.");
        return;
      }

      let orderId = sessionStorage.getItem(PAY_ORDER_ID_KEY);
      if (!orderId) {
        orderId = `WOLIO-${Date.now()}`;
        sessionStorage.setItem(PAY_ORDER_ID_KEY, orderId);
      }
      orderIdRef.current = orderId;

      const lockKey = snapLockKey(orderId);
      payFinished.current = false;
      payStarted.current = false;

      const reopenOnly = sessionStorage.getItem(PAY_REOPEN_SNAP_KEY) === "1";
      if (reopenOnly) {
        sessionStorage.removeItem(PAY_REOPEN_SNAP_KEY);
      }

      // Kunci anti-double Snap; buka ulang dari pending boleh lepas kunci
      if (sessionStorage.getItem(lockKey)) {
        if (reopenOnly) {
          sessionStorage.removeItem(lockKey);
        } else {
          setLoading(false);
          setError("Popup pembayaran tidak bisa dibuka otomatis. Tekan “Coba lagi”.");
          return;
        }
      }

      const alreadyRecorded = sessionStorage.getItem(PAY_PENDING_RECORDED_KEY) === orderId;
      const skipRecordPending = reopenOnly || alreadyRecorded;

      sessionStorage.setItem(lockKey, "1");
      payStarted.current = true;
      setLoading(true);
      setError(null);

      if (!skipRecordPending) {
        try {
          await recordPendingOrder({
            order_id: orderId,
            gross_amount: String(gross),
            guestName: bd.guestName,
            guestEmail: bd.guestEmail,
            guestPhone: bd.guestPhone,
            checkIn: bd.checkIn,
            checkOut: bd.checkOut,
            propertyName: bd.propertyName || "Wolio Hills Malino",
            property_id: bd.propertyId,
            guests: bd.guests,
            rooms: bd.rooms,
            special_requests: bd.specialRequests,
            transaction_status: "pending",
          });
          sessionStorage.setItem(PAY_PENDING_RECORDED_KEY, orderId);
        } catch (e) {
          payStarted.current = false;
          sessionStorage.removeItem(lockKey);
          setLoading(false);
          setError(e instanceof Error ? e.message : "Gagal menyimpan booking (periksa .env Supabase / koneksi).");
          return;
        }
      }

      try {
        await loadMidtransSnap(clientKey, isProduction);
        const token = await createSnapToken({
          orderId,
          grossAmount: gross,
          booking: bd,
          itemName: `${bd.propertyName || "Wolio Hills Malino"} — ${bd.checkIn} s/d ${bd.checkOut}`,
          midtransProduction: isProduction,
        });

        if (!window.snap?.pay) {
          throw new Error("Midtrans Snap tidak tersedia");
        }

        setLoading(false);

        window.snap.pay(token, {
          onSuccess: (result) => {
            handleSnapResult(result, bd, gross, orderId);
          },
          onPending: (result) => {
            handleSnapResult(result, bd, gross, orderId);
          },
          onError: (result) => {
            const msg = result.status_message || "Pembayaran gagal";
            void fail(msg, result.order_id || orderId);
          },
          onClose: () => {
            if (payFinished.current) return;
            payFinished.current = true;
            sessionStorage.removeItem(lockKey);
            payStarted.current = false;
            void (async () => {
              try {
                await markOrderCancelledByUser(orderId, {
                  guestName: bd.guestName,
                  guestEmail: bd.guestEmail,
                  guestPhone: bd.guestPhone,
                  checkIn: bd.checkIn,
                  checkOut: bd.checkOut,
                  propertyName: bd.propertyName || "Wolio Hills Malino",
                  property_id: bd.propertyId,
                  guests: bd.guests,
                  rooms: bd.rooms,
                  special_requests: bd.specialRequests,
                });
              } catch (e) {
                console.error(e);
              }
              const pl: PaymentFailurePayload = {
                message: "Pembayaran dibatalkan atau popup ditutup sebelum selesai.",
                order_id: orderId,
              };
              sessionStorage.setItem(FAIL_KEY, JSON.stringify(pl));
              navigateRef.current("payment-failed");
            })();
          },
        });
      } catch (e) {
        payStarted.current = false;
        sessionStorage.removeItem(lockKey);
        setLoading(false);
        setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      }
    };

    void run();

    return () => {
      const oid = orderIdRef.current;
      if (!payFinished.current && oid) {
        sessionStorage.removeItem(snapLockKey(oid));
      }
      payStarted.current = false;
    };
  }, [
    snapAttempt,
    clientKey,
    isProduction,
    effectiveBooking.checkIn,
    effectiveBooking.checkOut,
    effectiveBooking.guestEmail,
    effectiveBooking.guestName,
    effectiveBooking.guestPhone,
    effectiveBooking.guests,
    effectiveBooking.propertyPrice,
  ]);

  const nights =
    effectiveBooking.checkIn && effectiveBooking.checkOut
      ? Math.max(
          1,
          Math.ceil(
            (new Date(effectiveBooking.checkOut).getTime() - new Date(effectiveBooking.checkIn).getTime()) / 86400000
          )
        )
      : 0;

  const retry = () => {
    const oid = orderIdRef.current || sessionStorage.getItem(PAY_ORDER_ID_KEY);
    if (oid) clearSnapLock(oid);
    try {
      sessionStorage.removeItem(PAY_ORDER_ID_KEY);
      sessionStorage.removeItem(PAY_PENDING_RECORDED_KEY);
      sessionStorage.removeItem(PAY_REOPEN_SNAP_KEY);
    } catch {
      /* ignore */
    }
    orderIdRef.current = null;
    payStarted.current = false;
    payFinished.current = false;
    setError(null);
    setLoading(true);
    setSnapAttempt((a) => a + 1);
  };

  return (
    <>
      <section className="relative pt-40 pb-24 px-6 hero-gradient overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <m.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">
            Pembayaran Midtrans
          </m.span>
          <m.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-display font-black text-white text-5xl md:text-7xl leading-[0.9] mt-3 mb-6">
            Selesaikan <span className="text-gradient">Pembayaran</span>
          </m.h1>
          <p className="text-white/55 text-sm max-w-xl mx-auto">Popup Midtrans akan terbuka otomatis. Jika tidak muncul, periksa popup blocker atau tekan coba lagi.</p>
        </div>
        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full">
            <path d="M0,80 C360,120 1080,40 1440,80 L1440,120 L0,120 Z" fill="var(--color-surface)" />
          </svg>
        </div>
      </section>

      <section className="py-12 px-6 max-w-3xl mx-auto">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-deep gold-border">
          <h3 className="font-display font-bold text-primary text-lg mb-5">Detail Booking</h3>
          <div className="space-y-3 text-sm border-b border-surface-dark pb-6 mb-6">
            <div className="flex justify-between gap-4">
              <span className="text-text-light">Nama tamu</span>
              <span className="font-semibold text-primary text-right">{effectiveBooking.guestName || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-text-light">Email</span>
              <span className="font-semibold text-primary text-right break-all">{effectiveBooking.guestEmail || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-text-light">WhatsApp</span>
              <span className="font-semibold text-primary text-right">{effectiveBooking.guestPhone || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-text-light">Check-in</span>
              <span className="font-semibold text-primary">{effectiveBooking.checkIn || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-text-light">Check-out</span>
              <span className="font-semibold text-primary">{effectiveBooking.checkOut || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-text-light">Jumlah tamu</span>
              <span className="font-semibold text-primary">{effectiveBooking.guests} orang</span>
            </div>
          </div>

          <h3 className="font-display font-bold text-primary text-lg mb-4">Ringkasan</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-text-light">
                Tarif flat (tamu)
                {nights > 0 ? (
                  <span className="block text-[11px] text-text-light/80 mt-0.5">{nights} malam — tidak mempengaruhi total</span>
                ) : null}
              </span>
              <span className="font-semibold text-primary shrink-0">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-light">Biaya layanan</span>
              <span className="font-semibold text-primary">Rp {fee.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between font-display font-bold text-xl text-primary pt-3 border-t border-surface-dark">
              <span>Total</span>
              <span className="text-gradient">Rp {grossAmount.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            {loading && (
              <div className="flex items-center gap-2 text-text-light text-sm">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
                Menyiapkan Midtrans…
              </div>
            )}
            {error && (
              <div className="w-full rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 text-center">
                {error}
              </div>
            )}
            {error && (
              <m.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={retry} className="bg-accent hover:bg-accent-light text-primary font-bold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-lg cursor-pointer transition-colors">
                Coba lagi
              </m.button>
            )}
            <div className="flex items-center gap-2 text-text-light text-xs">
              <Lock className="w-3.5 h-3.5" /> Pembayaran diproses oleh Midtrans (Snap)
            </div>
          </div>
        </div>

        <div className="mt-6">
          <m.button whileHover={{ scale: 1.05 }} onClick={() => navigate("book")} className="flex items-center gap-2 text-text-light hover:text-primary font-semibold text-sm cursor-pointer transition-colors">
            <ChevronLeft className="w-4 h-4" /> Kembali ke Booking
          </m.button>
        </div>
      </section>
    </>
  );
}
