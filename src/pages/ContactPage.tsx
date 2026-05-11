import React, { useState } from "react";
import { motion } from "motion/react";
import { MapPin, Phone, Mail, Clock, Send, Check } from "lucide-react";
import { use3DTilt } from "../hooks/use3DTilt";
import type { PageName } from "../App";

interface Props { navigate: (page: PageName) => void; }

function ContactCard({ icon: Icon, title, value, delay }: { icon: React.ElementType; title: string; value: string; delay: number }) {
  const { isHovering, rotateX, rotateY, glareBackground, handleMouseMove, handleMouseLeave, setIsHovering } = use3DTilt();
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay }} viewport={{ once: true }} style={{ perspective: 1000 }}>
      <motion.div
        animate={!isHovering ? { rotateX: [0.5, -0.5, 0.5], rotateY: [1, -1, 1] } : {}}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ rotateX: isHovering ? rotateX : undefined, rotateY: isHovering ? rotateY : undefined, transformStyle: "preserve-3d" }}
        onMouseEnter={() => setIsHovering(true)} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
        className="bg-white p-6 rounded-2xl shadow-deep gold-border text-center group relative overflow-hidden h-full cursor-default"
      >
        <div style={{ transform: "translateZ(20px)" }} className="w-12 h-12 rounded-xl bg-primary mx-auto mb-4 flex items-center justify-center group-hover:bg-accent transition-colors duration-300">
          <Icon className="w-5 h-5 text-accent group-hover:text-white transition-colors duration-300" />
        </div>
        <h4 style={{ transform: "translateZ(15px)" }} className="font-display font-bold text-primary text-sm mb-1">{title}</h4>
        <p style={{ transform: "translateZ(10px)" }} className="text-text-light text-xs leading-relaxed">{value}</p>
        <motion.div style={{ background: glareBackground, zIndex: 0, pointerEvents: "none" }} className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      </motion.div>
    </motion.div>
  );
}

export default function ContactPage({}: Props) {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1500);
  };

  const inputClass = "w-full bg-surface border border-surface-dark rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all";

  return (
    <>
      <section className="relative pt-40 pb-24 px-6 hero-gradient overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity }} className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Hubungi Kami</motion.span>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-display font-black text-white text-5xl md:text-7xl leading-[0.9] mt-3 mb-6">Kontak <span className="text-gradient">Kami</span></motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-white/60 text-lg max-w-2xl mx-auto">Ada pertanyaan atau butuh bantuan? Tim kami siap membantu kamu 24/7.</motion.p>
        </div>
        <div className="absolute bottom-0 left-0 w-full"><svg viewBox="0 0 1440 120" fill="none" className="w-full"><path d="M0,80 C360,120 1080,40 1440,80 L1440,120 L0,120 Z" fill="var(--color-surface)" /></svg></div>
      </section>

      {/* Contact Cards */}
      <section className="py-12 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ContactCard icon={MapPin} title="Alamat" value="123 Luxury Avenue, Makassar, Indonesia" delay={0} />
          <ContactCard icon={Phone} title="Telepon" value="+62 812-3456-7890" delay={0.1} />
          <ContactCard icon={Mail} title="Email" value="hello@woliohills.com" delay={0.2} />
          <ContactCard icon={Clock} title="Jam Operasional" value="Support 24/7 Tersedia" delay={0.3} />
        </div>
      </section>

      {/* Form + Map */}
      <section className="py-12 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            {sent ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-3xl shadow-deep gold-border text-center h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-success mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-display font-bold text-primary text-2xl mb-3">Pesan Terkirim!</h3>
                <p className="text-text-light text-sm mb-6">Makasih udah hubungi kami. Kami akan balas dalam 24 jam.</p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setSent(false); setFormData({ name: "", email: "", subject: "", message: "" }); }} className="text-accent hover:text-accent-dark font-semibold text-sm cursor-pointer">
                  Kirim Pesan Lagi
                </motion.button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-deep gold-border">
                <h3 className="font-display font-bold text-primary text-2xl mb-6">Kirim Pesan</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 block">Nama Lengkap</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Nama kamu" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 block">Email</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="email@kamu.com" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 block">Subjek</label>
                    <input type="text" required value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} placeholder="Ada yang bisa kami bantu?" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-text-light mb-2 block">Pesan</label>
                    <textarea required value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} rows={5} placeholder="Ceritain lebih detail..." className={inputClass} />
                  </div>
                  <motion.button type="submit" whileHover={{ scale: sending ? 1 : 1.02 }} whileTap={{ scale: sending ? 1 : 0.98 }} disabled={sending} className={`w-full font-bold text-sm tracking-wider uppercase py-4 rounded-full shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all ${sending ? "bg-text-light text-white" : "bg-accent hover:bg-accent-light text-primary"}`}>
                    {sending ? (
                      <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> Mengirim...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Kirim Pesan</>
                    )}
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>

          {/* Map */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
            <div className="w-full h-full min-h-[400px] rounded-3xl overflow-hidden shadow-deep gold-border relative">
              <iframe
                title="Wolio Hills Location"
                src="https://maps.google.com/maps?q=Makassar+Indonesia&t=&z=13&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "400px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute bottom-6 left-6 z-10 hidden md:block">
                <div className="bg-white p-5 rounded-2xl shadow-xl gold-border max-w-[220px]">
                  <h4 className="font-display font-bold text-primary text-sm mb-1">Kantor Wolio Hills</h4>
                  <p className="text-text-light text-[10px] leading-relaxed">123 Luxury Avenue,<br />Makassar, Indonesia</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
