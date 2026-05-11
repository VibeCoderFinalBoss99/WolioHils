import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Mail, Phone, Calendar, Users, ChevronRight, ChevronLeft, Check } from "lucide-react";
import type { PageName, BookingData } from "../App";
import AvailabilityCalendar from "../components/AvailabilityCalendar";
import bookedJson from "../data/booked-dates.json";
import { calculateStaySubtotal, STAY_RATES } from "../lib/pricing";

const BOOKED_SET = new Set<string>(bookedJson.bookedDates as string[]);

const DEFAULT_PROPERTY = {
  propertyId: 1,
  propertyName: "Wolio Hills Malino",
  propertyPrice: 2_000_000,
  propertyImage: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80",
};

interface Props {
  bookingData: BookingData;
  setBookingData: React.Dispatch<React.SetStateAction<BookingData>>;
  proceedToPayment: (data: BookingData) => void;
  navigate: (page: PageName) => void;
}

const MAX_GUESTS = 15;

export default function BookingFormPage({ bookingData, setBookingData, proceedToPayment, navigate }: Props) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [guestText, setGuestText] = useState(() => String(bookingData.guests));

  useEffect(() => {
    if (step === 2) {
      setGuestText(String(bookingData.guests));
    }
  }, [step]);

  useEffect(() => {
    if (!bookingData.propertyId) {
      setBookingData((prev) => ({
        ...prev,
        ...DEFAULT_PROPERTY,
        rooms: 1,
        specialRequests: "",
      }));
    }
  }, [bookingData.propertyId, setBookingData]);

  const update = (field: keyof BookingData, value: string | number) => {
    setBookingData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!bookingData.guestName.trim()) e.guestName = "Nama harus diisi ya";
    if (!bookingData.guestEmail.trim() || !/\S+@\S+\.\S+/.test(bookingData.guestEmail)) e.guestEmail = "Email valid harus diisi";
    if (!bookingData.guestPhone.trim()) e.guestPhone = "No. WA harus diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (guestCountRaw: number) => {
    const e: Record<string, string> = {};
    if (!guestCountRaw || guestCountRaw < 1) e.guests = "Isi jumlah tamu (minimal 1 orang)";
    else if (guestCountRaw > MAX_GUESTS) e.guests = `Maksimal ${MAX_GUESTS} orang`;

    if (!bookingData.checkIn) e.checkIn = "Tanggal check-in harus dipilih";
    if (!bookingData.checkOut) e.checkOut = "Tanggal check-out harus dipilih";
    if (bookingData.checkIn && bookingData.checkOut && bookingData.checkIn >= bookingData.checkOut) e.checkOut = "Check-out harus setelah check-in";

    if (bookingData.checkIn && BOOKED_SET.has(bookingData.checkIn)) {
      e.checkIn = "Tanggal check-in bertabrakan dengan booking lain";
    }
    if (bookingData.checkOut && BOOKED_SET.has(bookingData.checkOut)) {
      e.checkOut = "Tanggal check-out bertabrakan dengan booking lain";
    }

    if (bookingData.checkIn && bookingData.checkOut) {
      const checkIn = new Date(bookingData.checkIn + "T12:00:00");
      const checkOut = new Date(bookingData.checkOut + "T12:00:00");

      for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${da}`;
        if (BOOKED_SET.has(dateStr)) {
          e.checkIn = "Ada tanggal yang sudah dibooking di range ini";
          e.checkOut = "Ada tanggal yang sudah dibooking di range ini";
          break;
        }
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const normalizeGuestInput = () => {
    const digits = guestText.replace(/\D/g, "");
    if (digits === "") {
      setGuestText("1");
      update("guests", 1);
      return 1;
    }
    const n = Math.min(MAX_GUESTS, Math.max(1, parseInt(digits, 10)));
    setGuestText(String(n));
    update("guests", n);
    return n;
  };

  const handleGuestTextChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setGuestText(digits);
    if (digits !== "") {
      const n = Math.min(MAX_GUESTS, Math.max(1, parseInt(digits, 10)));
      update("guests", n);
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.guests;
      return next;
    });
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2) {
      const digits = guestText.replace(/\D/g, "");
      const parsed = digits === "" ? NaN : parseInt(digits, 10);
      const guestCountRaw = Number.isNaN(parsed) ? 0 : parsed;
      if (!validateStep2(guestCountRaw)) return;
      const gc = Math.min(MAX_GUESTS, Math.max(1, guestCountRaw));
      setGuestText(String(gc));
      update("guests", gc);
      setStep(3);
    }
  };

  const guestsForPricing = useMemo(() => {
    if (step !== 2) return bookingData.guests;
    const d = guestText.replace(/\D/g, "");
    if (d === "") return bookingData.guests;
    const p = parseInt(d, 10);
    if (Number.isNaN(p)) return bookingData.guests;
    return Math.min(MAX_GUESTS, Math.max(1, p));
  }, [step, guestText, bookingData.guests]);

  const totalPrice = calculateStaySubtotal({ ...bookingData, guests: guestsForPricing });
  const nights = bookingData.checkIn && bookingData.checkOut ? Math.max(1, Math.ceil((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / 86400000)) : 0;

  const inputClass = (field: string) =>
    `w-full bg-surface border ${errors[field] ? "border-error" : "border-surface-dark"} rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all`;

  const checkInBooked = bookingData.checkIn && BOOKED_SET.has(bookingData.checkIn);
  const checkOutBooked = bookingData.checkOut && BOOKED_SET.has(bookingData.checkOut);

  return (
    <>
      <section className="relative pt-40 pb-24 px-6 hero-gradient overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity }} className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">
            Booking Villa
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-display font-black text-white text-5xl md:text-7xl leading-[0.9] mt-3 mb-6">
            Reservasi <span className="text-gradient">Staycation</span>
          </motion.h1>
        </div>
        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full">
            <path d="M0,80 C360,120 1080,40 1440,80 L1440,120 L0,120 Z" fill="var(--color-surface)" />
          </svg>
        </div>
      </section>

      <section className="py-12 px-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step >= s ? "bg-accent text-primary shadow-lg" : "bg-surface-dark text-text-light"
                }`}
              >
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
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Nama Lengkap
                  </label>
                  <input type="text" value={bookingData.guestName} onChange={(e) => update("guestName", e.target.value)} placeholder="Nama lengkap kamu" className={inputClass("guestName")} />
                  {errors.guestName && <p className="text-error text-xs mt-1">{errors.guestName}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </label>
                  <input type="email" value={bookingData.guestEmail} onChange={(e) => update("guestEmail", e.target.value)} placeholder="email@kamu.com" className={inputClass("guestEmail")} />
                  {errors.guestEmail && <p className="text-error text-xs mt-1">{errors.guestEmail}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> No. WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={bookingData.guestPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9+]/g, "");
                      update("guestPhone", value);
                    }}
                    placeholder="+62 812-3456-7890"
                    className={inputClass("guestPhone")}
                    pattern="[0-9+ ]+"
                    inputMode="tel"
                  />
                  {errors.guestPhone && <p className="text-error text-xs mt-1">{errors.guestPhone}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="bg-white p-8 md:p-10 rounded-3xl shadow-deep gold-border">
              <h3 className="font-display font-bold text-primary text-2xl mb-6">Detail Booking</h3>
              <div className="space-y-5">
                <div className="flex items-center gap-4 bg-surface p-4 rounded-2xl">
                  <img src={bookingData.propertyImage || DEFAULT_PROPERTY.propertyImage} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-display font-bold text-primary">{bookingData.propertyName || DEFAULT_PROPERTY.propertyName}</h4>
                    <p className="text-text-light text-sm">Tarif flat per pemesanan (bukan per malam)</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-accent/25 bg-accent/5 px-4 py-3 text-xs text-primary leading-relaxed space-y-1.5">
                  <p className="font-bold text-sm text-primary">Ketentuan tarif</p>
                  <p>
                    <span className="font-semibold">Tarif menginap:</span> Rp {STAY_RATES.FLAT_BOOKING_UP_TO_10.toLocaleString("id-ID")} per pemesanan untuk
                    sampai {STAY_RATES.INCLUDED_GUESTS} orang — <span className="italic">tidak berubah</span> meski lama menginap berapa malam pun.
                  </p>
                  <p>
                    <span className="font-semibold">Lebih dari {STAY_RATES.INCLUDED_GUESTS} orang:</span> tambahan Rp{" "}
                    {STAY_RATES.EXTRA_PER_PERSON_OVER_10.toLocaleString("id-ID")} per orang (orang ke-11 dst.), sekali per booking.
                  </p>
                  <p>
                    <span className="font-semibold">Kapasitas maksimal:</span> {MAX_GUESTS} orang per pemesanan.
                  </p>
                </div>

                <AvailabilityCalendar
                  bookedSet={BOOKED_SET}
                  checkIn={bookingData.checkIn}
                  checkOut={bookingData.checkOut}
                  onChange={({ checkIn, checkOut }) => {
                    setBookingData((prev) => ({ ...prev, checkIn, checkOut }));
                    setErrors((prev) => {
                      const n = { ...prev };
                      delete n.checkIn;
                      delete n.checkOut;
                      return n;
                    });
                  }}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Tanggal Check-in
                    </label>
                    <input
                      type="date"
                      value={bookingData.checkIn}
                      onChange={(e) => update("checkIn", e.target.value)}
                      className={`${inputClass("checkIn")} ${checkInBooked ? "border-error text-error" : ""}`}
                    />
                    {errors.checkIn && <p className="text-error text-xs mt-1">{errors.checkIn}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Tanggal Check-out
                    </label>
                    <input
                      type="date"
                      value={bookingData.checkOut}
                      onChange={(e) => update("checkOut", e.target.value)}
                      className={`${inputClass("checkOut")} ${checkOutBooked ? "border-error text-error" : ""}`}
                    />
                    {errors.checkOut && <p className="text-error text-xs mt-1">{errors.checkOut}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Jumlah Tamu
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Contoh: 8"
                    value={guestText}
                    onChange={(e) => handleGuestTextChange(e.target.value)}
                    onBlur={normalizeGuestInput}
                    className={inputClass("guests")}
                  />
                  {errors.guests && <p className="text-error text-xs mt-1">{errors.guests}</p>}
                  <p className="text-text-light text-[11px] mt-1.5">Angka saja, maks. {MAX_GUESTS} orang.</p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="bg-white p-8 md:p-10 rounded-3xl shadow-deep gold-border">
              <h3 className="font-display font-bold text-primary text-2xl mb-6">Review Booking Kamu</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-surface p-4 rounded-2xl">
                  <img src={bookingData.propertyImage || DEFAULT_PROPERTY.propertyImage} alt="" className="w-20 h-20 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-display font-bold text-primary text-lg">{bookingData.propertyName || DEFAULT_PROPERTY.propertyName}</h4>
                    <p className="text-text-light text-sm">Pembayaran via Midtrans (Snap)</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-surface p-4 rounded-xl">
                    <span className="text-text-light text-xs uppercase tracking-widest block mb-1">Tamu</span>
                    <span className="font-semibold text-primary">{bookingData.guestName}</span>
                  </div>
                  <div className="bg-surface p-4 rounded-xl">
                    <span className="text-text-light text-xs uppercase tracking-widest block mb-1">Email</span>
                    <span className="font-semibold text-primary">{bookingData.guestEmail}</span>
                  </div>
                  <div className="bg-surface p-4 rounded-xl">
                    <span className="text-text-light text-xs uppercase tracking-widest block mb-1">Check-in</span>
                    <span className={`font-semibold ${bookingData.checkIn && BOOKED_SET.has(bookingData.checkIn) ? "text-error" : "text-primary"}`}>{bookingData.checkIn || "—"}</span>
                  </div>
                  <div className="bg-surface p-4 rounded-xl">
                    <span className="text-text-light text-xs uppercase tracking-widest block mb-1">Check-out</span>
                    <span className={`font-semibold ${bookingData.checkOut && BOOKED_SET.has(bookingData.checkOut) ? "text-error" : "text-primary"}`}>{bookingData.checkOut || "—"}</span>
                  </div>
                  <div className="bg-surface p-4 rounded-xl col-span-2">
                    <span className="text-text-light text-xs uppercase tracking-widest block mb-1">Jumlah Tamu</span>
                    <span className="font-semibold text-primary">{bookingData.guests} Orang</span>
                  </div>
                </div>
                <div className="border-t border-surface-dark pt-6">
                  <div className="flex justify-between text-sm text-text-light mb-2">
                    <span>
                      {nights > 0 ? `${nights} malam · ` : ""}tarif flat + tamu
                    </span>
                    <span className="font-semibold text-primary">Rp {totalPrice.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-sm text-text-light mb-2">
                    <span>Biaya layanan</span>
                    <span className="font-semibold text-primary">Rp {Math.round(totalPrice * 0.05).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between font-display font-bold text-xl text-primary pt-4 border-t border-surface-dark">
                    <span>Total</span>
                    <span className="text-gradient">Rp {(totalPrice + Math.round(totalPrice * 0.05)).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                proceedToPayment({
                  ...bookingData,
                  rooms: 1,
                  specialRequests: "",
                })
              }
              className="bg-accent hover:bg-accent-light text-primary font-bold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-[0_15px_40px_rgba(201,168,76,0.3)] flex items-center gap-2 cursor-pointer transition-colors"
            >
              Lanjut ke Pembayaran <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </section>
    </>
  );
}
