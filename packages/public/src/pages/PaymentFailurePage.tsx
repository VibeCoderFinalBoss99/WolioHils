import { useMemo } from "react";
import { m } from "motion/react";
import { XCircle, ChevronLeft } from "lucide-react";
import type { PageName } from "../App";
import { clearPaymentOrderState } from "../lib/sessionKeys";

const STORAGE_KEY = "wolio_payment_failed";

export interface PaymentFailurePayload {
  message?: string;
  order_id?: string;
}

interface Props {
  navigate: (page: PageName) => void;
}

function readPayload(): PaymentFailurePayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PaymentFailurePayload;
  } catch {
    return null;
  }
}

export default function PaymentFailurePage({ navigate }: Props) {
  const payload = useMemo(() => readPayload(), []);
  const detail = payload?.message || "Silakan coba lagi atau hubungi kami jika masalah berlanjut.";

  return (
    <section className="relative pt-40 pb-24 px-6 hero-gradient overflow-hidden min-h-screen flex items-center">
      <div aria-hidden className="pointer-events-none absolute top-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-red-500/10 blur-[120px]" />
      <div className="max-w-lg mx-auto text-center relative z-10">
        <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 14 }} className="w-24 h-24 rounded-full bg-red-600/90 mx-auto mb-8 flex items-center justify-center shadow-[0_20px_60px_rgba(220,38,38,0.35)]">
          <XCircle className="w-12 h-12 text-white" />
        </m.div>
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h1 className="font-display font-black text-white text-4xl md:text-5xl mb-4">
            Pembayaran <span className="text-red-400">Gagal</span>
          </h1>
          <p className="text-white/60 text-lg mb-4">Transaksi tidak selesai atau ditolak. Kamu bisa coba lagi kapan saja.</p>
          {payload?.order_id && (
            <p className="text-white/40 text-sm mb-2">
              Order ID: <span className="text-white/70 font-mono">{payload.order_id}</span>
            </p>
          )}
          <p className="text-red-300/90 text-sm mb-8">{detail}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <m.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                clearPaymentOrderState();
                sessionStorage.setItem("wolio_pay_session", String(Date.now()));
                navigate("payment");
              }}
              className="bg-accent hover:bg-accent-light text-primary font-bold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-lg cursor-pointer transition-colors"
            >
              Coba Lagi
            </m.button>
            <m.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("book")} className="flex items-center justify-center gap-2 text-white/80 hover:text-white font-semibold text-sm px-8 py-3.5 rounded-full border border-white/25 hover:border-white/50 cursor-pointer transition-all">
              <ChevronLeft className="w-4 h-4" /> Ubah Booking
            </m.button>
          </div>
        </m.div>
      </div>
    </section>
  );
}
