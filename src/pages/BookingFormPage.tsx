import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Mail, Phone, Calendar, Users, Bed, MessageSquare, ChevronRight, ChevronLeft, Check, Building2 } from "lucide-react";
import { PROPERTIES } from "../data/properties";
import type { PageName, BookingData } from "../App";

// Mock booked dates storage (in real app, this would be in a database)
const BOOKED_DATES: Set<string> = new Set([
  '2024-12-25', // Christmas
  '2024-12-26',
  '2025-01-01', // New Year
  '2025-01-02',
]);

interface Props {
  bookingData: BookingData;
  setBookingData: React.Dispatch<React.SetStateAction<BookingData>>;
  proceedToPayment: (data: BookingData) => void;
  navigate: (page: PageName) => void;
}

export default function BookingFormPage({ bookingData, setBookingData, proceedToPayment, navigate }: Props) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: keyof BookingData, value: string | number) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!bookingData.guestName.trim()) e.guestName = "Nama harus diisi ya";
    if (!bookingData.guestEmail.trim() || !/\S+@\S+\.\S+/.test(bookingData.guestEmail)) e.guestEmail = "Email valid harus diisi";
    if (!bookingData.guestPhone.trim()) e.guestPhone = "No. WA harus diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!bookingData.checkIn) e.checkIn = "Tanggal check-in harus dipilih";
    if (!bookingData.checkOut) e.checkOut = "Tanggal check-out harus dipilih";
    if (bookingData.checkIn && bookingData.checkOut && bookingData.checkIn >= bookingData.checkOut) e.checkOut = "Check-out harus setelah check-in";
    if (!bookingData.propertyId) e.propertyId = "Pilih villa dulu";
    
    // Check if dates are already booked
    if (bookingData.checkIn && bookingData.checkOut) {
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      
      for (let date = new Date(checkIn); date < checkOut; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        if (BOOKED_DATES.has(dateStr)) {
          e.checkIn = "Tanggal ini udah dibooking, coba tanggal lain ya";
          e.checkOut = "Tanggal ini udah dibooking, coba tanggal lain ya";
          break;
        }
      }
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  // Pricing calculation
  const calculatePrice = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;
    
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000));
    
    let totalPrice = 0;
    
    for (let date = new Date(checkIn); date < checkOut; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      const basePrice = isWeekend ? 2500000 : 2000000; // Weekend: 2.5M, Weekday: 2M
      
      if (bookingData.guests <= 10) {
        totalPrice += basePrice;
      } else {
        totalPrice += basePrice + ((bookingData.guests - 10) * 100000); // Extra 100K per person over 10
      }
    }
    
    return totalPrice;
  };
  
  const totalPrice = calculatePrice();
  const nights = bookingData.checkIn && bookingData.checkOut ? Math.max(1, Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / 86400000)) : 0;

  const isDateBooked = (date: string) => BOOKED_DATES.has(date);
  
  const inputClass = (field: string) => `w-full bg-surface border ${errors[field] ? "border-error" : "border-surface-dark"} rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all`;

  return (
    <>
      <section className="relative pt-40 pb-24 px-6 hero-gradient overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity }} className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Booking Villa</motion.span>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-display font-black text-white text-5xl md:text-7xl leading-[0.9] mt-3 mb-6">Reservasi <span className="text-gradient">Staycation</span></motion.h1>
        </div>
        <div className="absolute bottom-0 left-0 w-full"><svg viewBox="0 0 1440 120" fill="none" className="w-full"><path d="M0,80 C360,120 1080,40 1440,80 L1440,120 L0,120 Z" fill="var(--color-surface)" /></svg></div>
      </section>

      <section className="py-12 px-6 max-w-3xl mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? "bg-accent text-primary shadow-lg" : "bg-surface-dark text-text-light"}`}>
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-12 rounded-full transition-all ${step > s ? "bg-accent" : "bg-surface-dark"}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-center gap-16 mb-8 text-xs font-semibold uppercase tracking-widest text-text-light">
          <span className={step >= 1 ? "text-accent" : ""}>Data Diri</span>
          <span className={step >= 2 ? "text-accent" : ""}>Detail Booking</span>
          <span className={step >= 3 ? "text-accent" : ""}>Review</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="bg-white p-8 md:p-10 rounded-3xl shadow-deep gold-border">
              <h3 className="font-display font-bold text-primary text-2xl mb-6">Data Pribadi</h3>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Nama Lengkap</label>
                  <input type="text" value={bookingData.guestName} onChange={e => update("guestName", e.target.value)} placeholder="Nama lengkap kamu" className={inputClass("guestName")} />
                  {errors.guestName && <p className="text-error text-xs mt-1">{errors.guestName}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</label>
                  <input type="email" value={bookingData.guestEmail} onChange={e => update("guestEmail", e.target.value)} placeholder="email@kamu.com" className={inputClass("guestEmail")} />
                  {errors.guestEmail && <p className="text-error text-xs mt-1">{errors.guestEmail}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> No. WhatsApp</label>
                  <input type="tel" value={bookingData.guestPhone} onChange={e => update("guestPhone", e.target.value)} placeholder="+62 812-3456-7890" className={inputClass("guestPhone")} />
                  {errors.guestPhone && <p className="text-error text-xs mt-1">{errors.guestPhone}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="bg-white p-8 md:p-10 rounded-3xl shadow-deep gold-border">
              <h3 className="font-display font-bold text-primary text-2xl mb-6">Detail Booking</h3>
              <div className="space-y-5">
                {!bookingData.propertyId && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> Pilih Properti</label>
                    <select value={bookingData.propertyId || ""} onChange={e => { const p = PROPERTIES.find(pr => pr.id === Number(e.target.value)); if (p) { update("propertyId", p.id); update("propertyName", p.name as any); update("propertyPrice", p.price as any); update("propertyImage", p.image as any); } }} className={inputClass("propertyId")}>
                      <option value="">Pilih properti...</option>
                      {PROPERTIES.map(p => <option key={p.id} value={p.id}>{p.name} — Rp {p.price}/malam</option>)}
                    </select>
                    {errors.propertyId && <p className="text-error text-xs mt-1">{errors.propertyId}</p>}
                  </div>
                )}
                {bookingData.propertyId && (
                  <div className="flex items-center gap-4 bg-surface p-4 rounded-2xl">
                    <img src={bookingData.propertyImage || "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80"} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    <div><h4 className="font-display font-bold text-primary">{bookingData.propertyName || "Wolio Hills Malino"}</h4><p className="text-text-light text-sm">Rp {bookingData.propertyPrice || 2000000}/malam</p></div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Tanggal Check-in</label>
                    <input type="date" value={bookingData.checkIn} onChange={e => update("checkIn", e.target.value)} className={inputClass("checkIn")} />
                    {errors.checkIn && <p className="text-error text-xs mt-1">{errors.checkIn}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Tanggal Check-out</label>
                    <input type="date" value={bookingData.checkOut} onChange={e => update("checkOut", e.target.value)} className={inputClass("checkOut")} />
                    {errors.checkOut && <p className="text-error text-xs mt-1">{errors.checkOut}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Jumlah Tamu</label>
                    <select value={bookingData.guests} onChange={e => update("guests", Number(e.target.value))} className={inputClass("guests")}>
                      {[1,2,3,4,5,6,7,8,10,12,16].map(n => <option key={n} value={n}>{n} {n === 1 ? "Orang" : "Orang"}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2"><Bed className="w-3.5 h-3.5" /> Jumlah Kamar</label>
                    <select value={bookingData.rooms} onChange={e => update("rooms", Number(e.target.value))} className={inputClass("rooms")}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n === 1 ? "Kamar" : "Kamar"}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Permintaan Khusus</label>
                  <textarea value={bookingData.specialRequests} onChange={e => update("specialRequests", e.target.value)} rows={3} placeholder="Ada permintaan khusus? Tulis di sini..." className={inputClass("specialRequests")} />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="bg-white p-8 md:p-10 rounded-3xl shadow-deep gold-border">
              <h3 className="font-display font-bold text-primary text-2xl mb-6">Review Booking Kamu</h3>
              <div className="space-y-6">
                {(bookingData.propertyImage || "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80") && (
                  <div className="flex items-center gap-4 bg-surface p-4 rounded-2xl">
                    <img src={bookingData.propertyImage || "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80"} alt="" className="w-20 h-20 rounded-xl object-cover" />
                    <div><h4 className="font-display font-bold text-primary text-lg">{bookingData.propertyName || "Wolio Hills Malino"}</h4><p className="text-text-light text-sm">Rp {bookingData.propertyPrice || 2000000}/malam</p></div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-surface p-4 rounded-xl"><span className="text-text-light text-xs uppercase tracking-widest block mb-1">Tamu</span><span className="font-semibold text-primary">{bookingData.guestName}</span></div>
                  <div className="bg-surface p-4 rounded-xl"><span className="text-text-light text-xs uppercase tracking-widest block mb-1">Email</span><span className="font-semibold text-primary">{bookingData.guestEmail}</span></div>
                  <div className="bg-surface p-4 rounded-xl"><span className="text-text-light text-xs uppercase tracking-widest block mb-1">Check-in</span><span className="font-semibold text-primary">{bookingData.checkIn || "—"}</span></div>
                  <div className="bg-surface p-4 rounded-xl"><span className="text-text-light text-xs uppercase tracking-widest block mb-1">Check-out</span><span className="font-semibold text-primary">{bookingData.checkOut || "—"}</span></div>
                  <div className="bg-surface p-4 rounded-xl"><span className="text-text-light text-xs uppercase tracking-widest block mb-1">Jumlah Tamu</span><span className="font-semibold text-primary">{bookingData.guests} Orang</span></div>
                  <div className="bg-surface p-4 rounded-xl"><span className="text-text-light text-xs uppercase tracking-widest block mb-1">Kamar</span><span className="font-semibold text-primary">{bookingData.rooms} Kamar</span></div>
                </div>
                {bookingData.specialRequests && (
                  <div className="bg-surface p-4 rounded-xl"><span className="text-text-light text-xs uppercase tracking-widest block mb-1">Permintaan Khusus</span><p className="text-sm text-primary">{bookingData.specialRequests}</p></div>
                )}
                <div className="border-t border-surface-dark pt-6">
                  <div className="flex justify-between text-sm text-text-light mb-2"><span>Rp {bookingData.propertyPrice || 2000000}/malam × {nights} malam × {bookingData.rooms} kamar</span><span className="font-semibold text-primary">Rp {totalPrice.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm text-text-light mb-2"><span>Biaya layanan</span><span className="font-semibold text-primary">Rp {Math.round(totalPrice * 0.05).toLocaleString()}</span></div>
                  <div className="flex justify-between font-display font-bold text-xl text-primary pt-4 border-t border-surface-dark"><span>Total</span><span className="text-gradient">Rp {(totalPrice + Math.round(totalPrice * 0.05)).toLocaleString()}</span></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-text-light hover:text-primary font-semibold text-sm cursor-pointer transition-colors">
              <ChevronLeft className="w-4 h-4" /> Kembali
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("home")} className="flex items-center gap-2 text-text-light hover:text-primary font-semibold text-sm cursor-pointer transition-colors">
              <ChevronLeft className="w-4 h-4" /> Beranda
            </motion.button>
          )}
          {step < 3 ? (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={nextStep} className="bg-primary hover:bg-primary-light text-white font-bold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-lg flex items-center gap-2 cursor-pointer transition-colors">
              Lanjut <ChevronRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => proceedToPayment(bookingData)} className="bg-accent hover:bg-accent-light text-primary font-bold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-[0_15px_40px_rgba(201,168,76,0.3)] flex items-center gap-2 cursor-pointer transition-colors">
              Lanjut ke Pembayaran <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </section>
    </>
  );
}
