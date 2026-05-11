import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Globe, Users, Award, Sparkles, Shield, Eye, Gem } from "lucide-react";
import { use3DTilt } from "../hooks/use3DTilt";
import type { PageName } from "../App";

interface AboutPageProps { navigate: (page: PageName) => void; }

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let s = 0; const step = Math.ceil(target / 50);
        const t = setInterval(() => { s += step; if (s >= target) { setCount(target); clearInterval(t); } else setCount(s); }, 30);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function ValueCard({ icon: Icon, title, desc, delay }: { icon: React.ElementType; title: string; desc: string; delay: number }) {
  const { isHovering, rotateX, rotateY, glareBackground, handleMouseMove, handleMouseLeave, setIsHovering } = use3DTilt();
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay }} viewport={{ once: true }} style={{ perspective: 1000 }}>
      <motion.div
        animate={!isHovering ? { rotateX: [0.5, -0.5, 0.5], rotateY: [1, -1, 1] } : {}}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ rotateX: isHovering ? rotateX : undefined, rotateY: isHovering ? rotateY : undefined, transformStyle: "preserve-3d" }}
        onMouseEnter={() => setIsHovering(true)} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
        className="bg-white p-8 rounded-3xl shadow-deep gold-border text-center group relative overflow-hidden h-full cursor-default"
      >
        <div style={{ transform: "translateZ(30px)" }} className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-5 flex items-center justify-center shadow-lg group-hover:bg-accent transition-colors duration-300">
          <Icon className="w-7 h-7 text-accent group-hover:text-white transition-colors duration-300" />
        </div>
        <h4 style={{ transform: "translateZ(20px)" }} className="font-display font-bold text-primary text-lg mb-3">{title}</h4>
        <p style={{ transform: "translateZ(10px)" }} className="text-text-light text-sm leading-relaxed">{desc}</p>
        <motion.div style={{ background: glareBackground, zIndex: 0, pointerEvents: "none" }} className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
      </motion.div>
    </motion.div>
  );
}

export default function AboutPage({ navigate }: AboutPageProps) {
  return (
    <>
      {/* HERO */}
      <section className="relative pt-40 pb-24 px-6 hero-gradient overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity }} className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-block text-accent font-semibold text-xs uppercase tracking-[0.3em] mb-4">Cerita Kami</motion.span>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-display font-black text-white text-5xl md:text-7xl leading-[0.9] mb-6">
            Mendefinisikan Ulang <span className="text-gradient">Perjalanan</span> Mewah
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
            Lahir dari hasrat untuk pengalaman luar biasa, Wolio Hills menghubungkan wisatawan pilih dengan properti paling luar biasa di dunia. Kami percaya setiap perjalanan layak dimulai dengan luar biasa.
          </motion.p>
        </div>
        <div className="absolute bottom-0 left-0 w-full"><svg viewBox="0 0 1440 120" fill="none" className="w-full"><path d="M0,80 C360,120 1080,40 1440,80 L1440,120 L0,120 Z" fill="var(--color-surface)" /></svg></div>
      </section>

      {/* STORY */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-deep">
                <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80" alt="Luxury hotel lobby" className="w-full h-[400px] object-cover" loading="lazy" />
              </div>
              <motion.div animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -bottom-8 -right-8 bg-accent text-primary p-6 rounded-2xl shadow-xl">
                <span className="font-display font-bold text-3xl block">10+</span>
                <span className="text-xs font-semibold uppercase tracking-widest">Tahun Keunggulan</span>
              </motion.div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Tentang Wolio Hills</span>
            <h2 className="font-display font-black text-primary text-4xl mt-3 mb-6">Di Mana Hasrat Bertemu <span className="text-gradient">Kesempurnaan</span></h2>
            <div className="space-y-4 text-text-light leading-relaxed">
              <p>Didirikan pada tahun 2015, Wolio Hills dimulai dengan visi sederhana: membuat akomodasi mewah dapat diakses dan mudah. Yang dimulai sebagai portofolio kecil villa pilihan telah berkembang menjadi platform global yang menampilkan lebih dari 500 properti luar biasa.</p>
              <p>Tim ahli perjalanan kami secara personal mengunjungi dan memverifikasi setiap properti, memastikan memenuhi standar ketat kami untuk kenyamanan, desain, dan layanan. Kami tidak hanya mencantumkan properti — kami mengkurasi pengalaman.</p>
              <p>Dari Pegunungan Alpen yang bersalju hingga surga pulau tropis, setiap properti Wolio Hills menceritakan kisah unik. Kami mengundang Anda untuk menjadi bagian dari kisah kami.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 px-6 bg-primary-dark relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 500, suffix: "+", label: "Properti Unggulan", icon: Globe },
            { value: 10000, suffix: "+", label: "Tamu Puas", icon: Users },
            { value: 50, suffix: "+", label: "Destinasi", icon: Globe },
            { value: 15, suffix: "", label: "Penghargaan", icon: Award },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 mx-auto mb-4 flex items-center justify-center">
                <s.icon className="w-6 h-6 text-accent" />
              </div>
              <div className="font-display font-bold text-white text-3xl mb-1"><Counter target={s.value} suffix={s.suffix} /></div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* VALUES */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Prinsip Kami</span>
          <h2 className="font-display font-black text-primary text-4xl md:text-5xl mt-3">Nilai-nilai <span className="text-gradient">Inti</span></h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ValueCard icon={Sparkles} title="Keunggulan" desc="Kami mengejar kesempurnaan dalam setiap detail, dari pemilihan properti hingga pengalaman tamu." delay={0} />
          <ValueCard icon={Shield} title="Kepercayaan" desc="Transparansi dan integritas adalah fondasi dari setiap interaksi." delay={0.1} />
          <ValueCard icon={Eye} title="Perhatian" desc="Setiap tamu menerima perhatian personal yang disesuaikan dengan preferensi unik mereka." delay={0.2} />
          <ValueCard icon={Gem} title="Kualitas" desc="Hanya properti yang memenuhi standar ketat kami yang masuk ke platform." delay={0.3} />
        </div>
      </section>

      {/* TEAM */}
      <section className="py-20 px-6 bg-surface-dark">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Tim Kami</span>
            <h2 className="font-display font-black text-primary text-4xl md:text-5xl mt-3">Orang-orang <span className="text-gradient">Di Balik</span></h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Alexander Reed", role: "Founder & CEO", initials: "AR" },
              { name: "Sofia Martinez", role: "Head of Curation", initials: "SM" },
              { name: "James Chen", role: "CTO", initials: "JC" },
            ].map((member, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="bg-white p-8 rounded-3xl shadow-deep gold-border text-center group">
                <div className="w-20 h-20 rounded-full bg-primary mx-auto mb-5 flex items-center justify-center group-hover:bg-accent transition-colors duration-300">
                  <span className="font-display font-bold text-accent group-hover:text-white text-xl transition-colors duration-300">{member.initials}</span>
                </div>
                <h4 className="font-display font-bold text-primary text-lg">{member.name}</h4>
                <p className="text-text-light text-sm mt-1">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
