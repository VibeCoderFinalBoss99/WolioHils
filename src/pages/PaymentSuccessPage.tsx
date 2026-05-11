import { useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { Check, ArrowRight, MessageCircle } from "lucide-react";
import type { PageName } from "../App";
import { recordSuccessfulBooking } from "../lib/adminBookingStore";

const STORAGE_KEY = "wolio_payment_success";

export interface PaymentSuccessPayload {
  order_id: string;
  transaction_id?: string;
  payment_type?: string;
  transaction_status?: string;
  gross_amount: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  propertyName: string;
}

interface Props {
  navigate: (page: PageName) => void;
}

function readPayload(): PaymentSuccessPayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PaymentSuccessPayload;
  } catch {
    return null;
  }
}

const defaultAdminWa = "6281234567890";

export default function PaymentSuccessPage({ navigate }: Props) {
  const payload = useMemo(() => readPayload(), []);
  const recordedRef = useRef(false);
  const adminWa = import.meta.env.VITE_ADMIN_WHATSAPP_E164 || defaultAdminWa;

  useEffect(() => {
    if (!payload || recordedRef.current) return;
    recordedRef.current = true;
    recordSuccessfulBooking({
      order_id: payload.order_id,
      transaction_id: payload.transaction_id,
      guestName: payload.guestName,
      guestEmail: payload.guestEmail,
      guestPhone: payload.guestPhone,
      gross_amount: payload.gross_amount,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      propertyName: payload.propertyName,
      payment_type: payload.payment_type,
      transaction_status: payload.transaction_status,
    });
  }, [payload]);

  const waMessage = useMemo(() => {
    if (!payload) return "";
    const lines = [
      "Halo Admin Wolio Hills,",
      "Saya ingin mengonfirmasi pembayaran booking:",
      "",
      `Order ID: ${payload.order_id}`,
      payload.transaction_id ? `Transaction ID: ${payload.transaction_id}` : "",
      `Status: ${payload.transaction_status || "settlement"}`,
      `Total: Rp ${payload.gross_amount}`,
      `Tamu: ${payload.guestName}`,
      `Email: ${payload.guestEmail}`,
      `WA: ${payload.guestPhone}`,
      `Check-in: ${payload.checkIn}`,
      `Check-out: ${payload.checkOut}`,
      `Properti: ${payload.propertyName}`,
      "",
      "Terima kasih.",
    ].filter(Boolean);
    return lines.join("\n");
  }, [payload]);

  const waHref =
    payload != null
      ? `https://wa.me/${adminWa.replace(/^\+/, "")}?text=${encodeURIComponent(waMessage)}`
      : "#";

  if (!payload) {
    return (
      <section className="relative pt-40 pb-24 px-6 min-h-[70vh] flex items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-text-light mb-6">Belum ada data pembayaran. Silakan mulai dari halaman booking.</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("home")} className="bg-accent text-primary font-bold px-8 py-3 rounded-full cursor-pointer">
            Ke Beranda
          </motion.button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative pt-40 pb-24 px-6 hero-gradient overflow-hidden min-h-screen flex items-center">
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px]" />
      <div className="max-w-lg mx-auto text-center relative z-10">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="w-24 h-24 rounded-full bg-success mx-auto mb-8 flex items-center justify-center shadow-[0_20px_60px_rgba(56,161,105,0.4)]">
          <Check className="w-12 h-12 text-white" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="font-display font-black text-white text-4xl md:text-5xl mb-4">
            Pembayaran <span className="text-gradient">Berhasil</span>
          </h1>
          <p className="text-white/60 text-lg mb-6">Terima kasih! Booking kamu sudah kami terima.</p>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl mb-8 text-left space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-white/50">Order ID</span>
              <span className="text-white font-semibold text-right break-all">{payload.order_id}</span>
            </div>
            {payload.transaction_id && (
              <div className="flex justify-between gap-4">
                <span className="text-white/50">Transaction ID</span>
                <span className="text-white font-semibold text-right break-all">{payload.transaction_id}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/50">Tamu</span>
              <span className="text-white font-semibold">{payload.guestName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Check-in</span>
              <span className="text-white font-semibold">{payload.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Check-out</span>
              <span className="text-white font-semibold">{payload.checkOut}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
              <span className="text-white/50">Total</span>
              <span className="text-accent font-bold text-lg">Rp {Number(payload.gross_amount).toLocaleString("id-ID")}</span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <motion.a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-lg cursor-pointer transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Kirim ke Admin (WhatsApp)
            </motion.a>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("home")} className="bg-accent hover:bg-accent-light text-primary font-bold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-lg cursor-pointer transition-colors flex items-center gap-2 justify-center mx-auto">
              Kembali ke Beranda <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
