import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CreditCard, Building2, Smartphone, Check, Lock, ChevronLeft, PartyPopper, ArrowRight, ShieldCheck } from "lucide-react";
import { PROPERTIES } from "../data/properties";
import type { PageName, BookingData } from "../App";

interface Props {
  bookingData: BookingData;
  navigate: (page: PageName) => void;
}

type PaymentMethod = "card" | "bank" | "ewallet";

export default function PaymentPage({ bookingData, navigate }: Props) {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const selectedProp = PROPERTIES.find(p => p.id === bookingData.propertyId);
  const nights = bookingData.checkIn && bookingData.checkOut ? Math.max(1, Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / 86400000)) : 1;
  const subtotal = (selectedProp?.price || bookingData.propertyPrice || 200) * nights * bookingData.rooms;
  const fee = Math.round(subtotal * 0.05);
  const total = subtotal + fee;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setSuccess(true); }, 2500);
  };

  const inputClass = "w-full bg-surface border border-surface-dark rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all";

  const methods: { id: PaymentMethod; icon: React.ElementType; name: string; desc: string }[] = [
    { id: "card", icon: CreditCard, name: "Kartu Kredit/Debit", desc: "Visa, Mastercard, AMEX" },
    { id: "bank", icon: Building2, name: "Transfer Bank", desc: "BCA, Mandiri, BNI, BRI" },
    { id: "ewallet", icon: Smartphone, name: "E-Wallet", desc: "GoPay, OVO, DANA, ShopeePay" },
  ];

  if (success) {
    return (
      <>
        <section className="relative pt-40 pb-24 px-6 hero-gradient overflow-hidden min-h-screen flex items-center">
          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px]" />
          <div className="max-w-lg mx-auto text-center relative z-10">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="w-24 h-24 rounded-full bg-success mx-auto mb-8 flex items-center justify-center shadow-[0_20px_60px_rgba(56,161,105,0.4)]">
              <Check className="w-12 h-12 text-white" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <PartyPopper className="w-8 h-8 text-accent mx-auto mb-4" />
              <h1 className="font-display font-black text-white text-4xl md:text-5xl mb-4">Pembayaran <span className="text-gradient">Berhasil!</span></h1>
              <p className="text-white/60 text-lg mb-3">Booking kamu udah dikonfirmasi.</p>
              <p className="text-white/40 text-sm mb-8">Kode booking: <span className="text-accent font-bold">LXS-{Date.now().toString().slice(-8)}</span></p>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl mb-8 text-left space-y-2">
                <div className="flex justify-between text-sm"><span className="text-white/50">Properti</span><span className="text-white font-semibold">{bookingData.propertyName || selectedProp?.name || "Wolio Hills Malino"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-white/50">Tamu</span><span className="text-white font-semibold">{bookingData.guestName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-white/50">Tanggal</span><span className="text-white font-semibold">{bookingData.checkIn} → {bookingData.checkOut}</span></div>
                <div className="flex justify-between text-sm border-t border-white/10 pt-2 mt-2"><span className="text-white/50">Total Dibayar</span><span className="text-accent font-bold text-lg">Rp {total.toLocaleString()}</span></div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("home")} className="bg-accent hover:bg-accent-light text-primary font-bold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-lg cursor-pointer transition-colors flex items-center gap-2 justify-center">
                  Kembali ke Beranda <ArrowRight className="w-4 h-4" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("about")} className="text-white/70 hover:text-white font-semibold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full border border-white/20 hover:border-white/40 cursor-pointer transition-all">
                  Lihat Tentang Kami
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="relative pt-40 pb-24 px-6 hero-gradient overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity }} className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Pembayaran Aman</motion.span>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-display font-black text-white text-5xl md:text-7xl leading-[0.9] mt-3 mb-6">Lanjutin <span className="text-gradient">Pembayaran</span></motion.h1>
        </div>
        <div className="absolute bottom-0 left-0 w-full"><svg viewBox="0 0 1440 120" fill="none" className="w-full"><path d="M0,80 C360,120 1080,40 1440,80 L1440,120 L0,120 Z" fill="var(--color-surface)" /></svg></div>
      </section>

      <section className="py-12 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Methods + Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Method Selection */}
            <div className="bg-white p-6 rounded-3xl shadow-deep gold-border">
              <h3 className="font-display font-bold text-primary text-lg mb-5">Metode Pembayaran</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {methods.map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)} className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${method === m.id ? "border-accent bg-accent/5 shadow-lg" : "border-surface-dark hover:border-accent/30"}`}>
                    <m.icon className={`w-6 h-6 mb-2 ${method === m.id ? "text-accent" : "text-text-light"}`} />
                    <h4 className="font-semibold text-sm text-primary">{m.name}</h4>
                    <p className="text-[10px] text-text-light mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Area */}
            <AnimatePresence mode="wait">
              {method === "card" && (
                <motion.div key="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white p-6 rounded-3xl shadow-deep gold-border">
                  <h3 className="font-display font-bold text-primary text-lg mb-5">Detail Kartu</h3>
                  <div className="space-y-4">
                    <div><label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 block">Nama Pemegang Kartu</label><input type="text" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Nama kamu" className={inputClass} /></div>
                    <div><label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 block">Nomor Kartu</label><input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19))} placeholder="4242 4242 4242 4242" maxLength={19} className={inputClass} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 block">Kadaluarsa</label><input type="text" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY" maxLength={5} className={inputClass} /></div>
                      <div><label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 block">CVV</label><input type="password" value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="•••" maxLength={4} className={inputClass} /></div>
                    </div>
                  </div>
                </motion.div>
              )}
              {method === "bank" && (
                <motion.div key="bank" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white p-6 rounded-3xl shadow-deep gold-border">
                  <h3 className="font-display font-bold text-primary text-lg mb-5">Transfer Bank</h3>
                  <p className="text-text-light text-sm mb-4">Pilih bank kamu dan selesaikan transfer dalam 24 jam.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {["BCA", "Mandiri", "BNI", "BRI"].map(bank => (
                      <div key={bank} className="p-4 rounded-xl border border-surface-dark hover:border-accent/30 text-center cursor-pointer transition-all hover:bg-accent/5">
                        <span className="font-bold text-primary text-lg">{bank}</span>
                        <p className="text-[10px] text-text-light mt-1">Virtual Account</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              {method === "ewallet" && (
                <motion.div key="ewallet" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white p-6 rounded-3xl shadow-deep gold-border">
                  <h3 className="font-display font-bold text-primary text-lg mb-5">E-Wallet</h3>
                  <p className="text-text-light text-sm mb-4">Choose your preferred e-wallet to complete payment.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {["GoPay", "OVO", "DANA", "ShopeePay"].map(wallet => (
                      <div key={wallet} className="p-4 rounded-xl border border-surface-dark hover:border-accent/30 text-center cursor-pointer transition-all hover:bg-accent/5">
                        <span className="font-bold text-primary">{wallet}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 text-text-light text-xs"><Lock className="w-3.5 h-3.5" /> Pembayaran kamu aman dan terenkripsi</div>
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div className="bg-white p-6 rounded-3xl shadow-deep gold-border sticky top-28">
              <h3 className="font-display font-bold text-primary text-lg mb-5">Ringkasan Pesanan</h3>
              {(bookingData.propertyImage || selectedProp?.image) && (
                <div className="rounded-2xl overflow-hidden mb-4">
                  <img src={bookingData.propertyImage || selectedProp?.image} alt="" className="w-full h-36 object-cover" />
                </div>
              )}
              <h4 className="font-display font-bold text-primary text-lg">{bookingData.propertyName || "Wolio Hills Malino"}</h4>
              <p className="text-text-light text-sm">Rp {bookingData.propertyPrice || 2000000}/malam</p>
              <p className="text-text-light text-xs mb-4">{bookingData.checkIn} → {bookingData.checkOut}</p>
              <div className="space-y-2 text-sm border-t border-surface-dark pt-4">
                <div className="flex justify-between"><span className="text-text-light">{nights} malam × {bookingData.rooms} kamar</span><span className="font-semibold text-primary">Rp {subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-text-light">Biaya layanan</span><span className="font-semibold text-primary">Rp {fee.toLocaleString()}</span></div>
                <div className="flex justify-between font-display font-bold text-xl text-primary pt-3 border-t border-surface-dark"><span>Total</span><span className="text-gradient">Rp {total.toLocaleString()}</span></div>
              </div>
              <motion.button
                whileHover={{ scale: processing ? 1 : 1.02 }}
                whileTap={{ scale: processing ? 1 : 0.98 }}
                onClick={handlePay}
                disabled={processing}
                className={`w-full mt-6 font-bold text-sm tracking-wider uppercase py-4 rounded-full shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all ${processing ? "bg-text-light text-white" : "bg-accent hover:bg-accent-light text-primary shadow-[0_15px_40px_rgba(201,168,76,0.3)]"}`}
              >
                {processing ? (
                  <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> Memproses...</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Bayar Sekarang Rp {total.toLocaleString()}</>
                )}
              </motion.button>
              <div className="flex items-center justify-center gap-2 mt-4 text-text-light text-[10px]">
                <Lock className="w-3 h-3" /> Pembayaran Aman & Terenkripsi
              </div>
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
