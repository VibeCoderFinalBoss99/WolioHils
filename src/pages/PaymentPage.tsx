import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Lock, ChevronLeft, Loader2 } from "lucide-react";
import type { PageName, BookingData } from "../App";
import { calculateFees, calculateStaySubtotal } from "../lib/pricing";
import { createSnapToken, loadMidtransSnap } from "../lib/midtrans";
import type { PaymentSuccessPayload } from "./PaymentSuccessPage";
import type { PaymentFailurePayload } from "./PaymentFailurePage";

interface Props {
  bookingData: BookingData;
  navigate: (page: PageName) => void;
}

const SUCCESS_KEY = "wolio_payment_success";
const FAIL_KEY = "wolio_payment_failed";

function clearSnapSessionLock() {
  const session = sessionStorage.getItem("wolio_pay_session");
  if (session) sessionStorage.removeItem(`wolio_snap_opened_${session}`);
}

export default function PaymentPage({ bookingData, navigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const orderIdRef = useRef(`WOLIO-${Date.now()}`);
  const payStarted = useRef(false);
  const payFinished = useRef(false);
  const bookingRef = useRef(bookingData);
  const navigateRef = useRef(navigate);
  bookingRef.current = bookingData;
  navigateRef.current = navigate;

  const subtotal = calculateStaySubtotal({ ...bookingData, rooms: 1 });
  const { fee, total } = calculateFees(subtotal);
  const grossAmount = Math.round(total);

  const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "";
  const isProduction = import.meta.env.VITE_MIDTRANS_PRODUCTION === "true";

  useEffect(() => {
    const session = sessionStorage.getItem("wolio_pay_session");
    const lockKey = session ? `wolio_snap_opened_${session}` : "";

    const fail = (msg: string, orderId?: string) => {
      if (payFinished.current) return;
      payFinished.current = true;
      clearSnapSessionLock();
      const pl: PaymentFailurePayload = { message: msg, order_id: orderId };
      sessionStorage.setItem(FAIL_KEY, JSON.stringify(pl));
      navigateRef.current("payment-failed");
    };

    const success = (result: Record<string, string>, bd: BookingData, gross: number) => {
      if (payFinished.current) return;
      payFinished.current = true;
      clearSnapSessionLock();
      const pl: PaymentSuccessPayload = {
        order_id: result.order_id || orderIdRef.current,
        transaction_id: result.transaction_id,
        payment_type: result.payment_type,
        transaction_status: result.transaction_status,
        gross_amount: String(gross),
        guestName: bd.guestName,
        guestEmail: bd.guestEmail,
        guestPhone: bd.guestPhone,
        checkIn: bd.checkIn,
        checkOut: bd.checkOut,
        propertyName: bd.propertyName || "Wolio Hills Malino",
      };
      sessionStorage.setItem(SUCCESS_KEY, JSON.stringify(pl));
      navigateRef.current("payment-success");
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
      if (!session || !lockKey) {
        setLoading(false);
        setError("Sesi pembayaran tidak valid. Gunakan tombol “Lanjut ke Pembayaran” dari halaman booking.");
        return;
      }

      if (payStarted.current) return;
      if (sessionStorage.getItem(lockKey)) return;

      sessionStorage.setItem(lockKey, "1");
      payStarted.current = true;
      setLoading(true);
      setError(null);

      try {
        await loadMidtransSnap(clientKey, isProduction);
        const token = await createSnapToken({
          orderId: orderIdRef.current,
          grossAmount: gross,
          booking: bd,
          itemName: `${bd.propertyName || "Wolio Hills Malino"} — ${bd.checkIn} s/d ${bd.checkOut}`,
        });

        if (!window.snap?.pay) {
          throw new Error("Midtrans Snap tidak tersedia");
        }

        setLoading(false);

        window.snap.pay(token, {
          onSuccess: (result) => {
            success(result, bd, gross);
          },
          onPending: (result) => {
            success(result, bd, gross);
          },
          onError: (result) => {
            const msg = result.status_message || "Pembayaran gagal";
            fail(msg, result.order_id || orderIdRef.current);
          },
          onClose: () => {
            if (payFinished.current) return;
            setError("Popup Midtrans ditutup sebelum pembayaran selesai. Tekan tombol di bawah untuk coba lagi.");
            sessionStorage.removeItem(lockKey);
            payStarted.current = false;
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
      if (!payFinished.current && lockKey) {
        sessionStorage.removeItem(lockKey);
      }
      payStarted.current = false;
    };
  }, []);

  const nights =
    bookingData.checkIn && bookingData.checkOut
      ? Math.max(1, Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / 86400000))
      : 0;

  const retry = () => {
    clearSnapSessionLock();
    payStarted.current = false;
    sessionStorage.setItem("wolio_pay_session", String(Date.now()));
    orderIdRef.current = `WOLIO-${Date.now()}`;
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  return (
    <>
      <section className="relative pt-40 pb-24 px-6 hero-gradient overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity }} className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">
            Pembayaran Midtrans
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-display font-black text-white text-5xl md:text-7xl leading-[0.9] mt-3 mb-6">
            Selesaikan <span className="text-gradient">Pembayaran</span>
          </motion.h1>
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
              <span className="font-semibold text-primary text-right">{bookingData.guestName || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-text-light">Email</span>
              <span className="font-semibold text-primary text-right break-all">{bookingData.guestEmail || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-text-light">WhatsApp</span>
              <span className="font-semibold text-primary text-right">{bookingData.guestPhone || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-text-light">Check-in</span>
              <span className="font-semibold text-primary">{bookingData.checkIn || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-text-light">Check-out</span>
              <span className="font-semibold text-primary">{bookingData.checkOut || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-text-light">Jumlah tamu</span>
              <span className="font-semibold text-primary">{bookingData.guests} orang</span>
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
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={retry} className="bg-accent hover:bg-accent-light text-primary font-bold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-lg cursor-pointer transition-colors">
                Coba lagi
              </motion.button>
            )}
            <div className="flex items-center gap-2 text-text-light text-xs">
              <Lock className="w-3.5 h-3.5" /> Pembayaran diproses oleh Midtrans (Snap)
            </div>
          </div>
        </div>

        <div className="mt-6">
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate("book")} className="flex items-center gap-2 text-text-light hover:text-primary font-semibold text-sm cursor-pointer transition-colors">
            <ChevronLeft className="w-4 h-4" /> Kembali ke Booking
          </motion.button>
        </div>
      </section>
    </>
  );
}
