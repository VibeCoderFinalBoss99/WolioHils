import React from "react";
import { m } from "motion/react";
import { Sparkles, Shield, Eye, Gem } from "lucide-react";
import { use3DTilt } from "../hooks/use3DTilt";

function ValueCard({ icon: Icon, title, desc, delay }: { icon: React.ElementType; title: string; desc: string; delay: number }) {
  const { rotateX, rotateY, glareBackground, handleMouseMove, handleMouseLeave, setIsHovering } = use3DTilt();
  return (
    <m.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay }} viewport={{ once: true }} style={{ perspective: 1000 }}>
      <m.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseEnter={() => setIsHovering(true)} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
        className="bg-white p-8 rounded-3xl shadow-deep gold-border text-center group relative overflow-hidden h-full cursor-default"
      >
        <div style={{ transform: "translateZ(30px)" }} className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-5 flex items-center justify-center shadow-lg group-hover:bg-accent transition-colors duration-300">
          <Icon className="w-7 h-7 text-accent group-hover:text-white transition-colors duration-300" />
        </div>
        <h4 style={{ transform: "translateZ(20px)" }} className="font-display font-bold text-primary text-lg mb-3">{title}</h4>
        <p style={{ transform: "translateZ(10px)" }} className="text-text-light text-sm leading-relaxed">{desc}</p>
        <m.div style={{ background: glareBackground, zIndex: 0, pointerEvents: "none" }} className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
      </m.div>
    </m.div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-w-0 overflow-x-clip">
      {/* HERO */}
      <section className="relative pt-40 pb-24 px-6 hero-gradient overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute top-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <m.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">
            Cerita Kami
          </m.span>
          <m.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display font-black text-white text-3xl leading-[1.08] sm:text-4xl sm:leading-[1.02] md:text-5xl md:leading-[0.98] lg:text-6xl xl:text-7xl lg:leading-[0.92] mt-3 mb-6 text-balance"
          >
            Mendefinisikan Ulang <span className="text-gradient">Perjalanan</span> Mewah
          </m.h1>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed text-pretty"
          >
            Wolio Hills hadir untuk mereka yang percaya bahwa perjalanan bukan sekadar berpindah tempat
            melainkan sebuah pengalaman yang layak dikenang. Nyaman, berkesan, dan selalu terasa istimewa.
          </m.p>
        </div>
        <div className="absolute bottom-0 left-0 w-full"><svg viewBox="0 0 1440 120" fill="none" className="w-full"><path d="M0,80 C360,120 1080,40 1440,80 L1440,120 L0,120 Z" fill="var(--color-surface)" /></svg></div>
      </section>

      {/* STORY */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
          <m.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-deep">
                <img src="./images/picture-3.png" alt="Luxury hotel lobby" className="w-full h-[280px] sm:h-[400px] object-cover" loading="lazy" />
              </div>
              <div
                className="absolute z-10 -bottom-8 -right-8 bg-accent text-primary p-6 rounded-2xl shadow-xl"
              >
                <span className="font-display font-bold text-3xl block">100%</span>
                <span className="text-xs font-semibold uppercase tracking-widest">Self Healing</span>
              </div>
            </div>
          </m.div>
          <m.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Tentang Wolio Hills</span>
            <h2 className="font-display font-black text-primary text-4xl mt-3 mb-6">Di Mana Hasrat Bertemu <span className="text-gradient">Kesempurnaan</span></h2>
            <div className="space-y-4 text-text-light leading-relaxed">
              <p>Didirikan dengan satu tujuan sederhana yaitu menghadirkan tempat beristirahat yang tenang, nyaman,
                dan dekat dengan alam. Wolio Hills Malino lahir dari keinginan untuk memberi setiap tamu
                pengalaman menginap yang benar-benar berbeda dari biasanya.</p>
              <p>Setiap sudut properti kami dirancang dengan penuh perhatian dan bukan sekadar tempat tidur,
                tapi ruang untuk memperlambat langkah, menghirup udara segar pegunungan, dan menikmati
                pemandangan yang sulit ditemukan di tempat lain. Kami tidak hanya menyewakan rumah,
                kami menghadirkan ketenangan.</p>
              <p>Terletak di Malino dengan pesona alam yang khas, Wolio Hills menjadi pelarian sempurna
                dari kesibukan sehari-hari. Kami mengundang Anda untuk datang, beristirahat,
                dan membawa pulang kenangan yang tak terlupakan.</p>
            </div>
          </m.div>
        </div>
      </section>


      {/* VALUES */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <m.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Prinsip Kami</span>
          <h2 className="font-display font-black text-primary text-4xl md:text-5xl mt-3">Yang <span className="text-gradient">Kami Utamakan</span></h2>
        </m.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ValueCard icon={Sparkles} title="Kenyamanan Anda" desc="Kami menjaga privasi dan keamanan Anda sepenuh hati, karena kami percaya setiap tamu berhak dapat menikmati liburan tanpa khawatir." delay={0} />
          <ValueCard icon={Shield} title="Kenyamanan Bersama" desc="Setiap villa kami jaga kebersihannya dengan standar tinggi, karena kenyamanan bersama adalah fondasi dari pengalaman menginap yang menyenangkan." delay={0.1} />
          <ValueCard icon={Eye} title="Pelayanan Prima" desc="Tim kami selalu siap membantu kebutuhan Anda selama menginap, dari check-in hingga check-out, karena kebahagiaan Anda adalah prioritas kami." delay={0.2} />
          <ValueCard icon={Gem} title="Pengalaman Terbaik" desc="Kami berkomitmen memberikan lebih dari yang Anda harapkan, karena setiap momen liburan Anda adalah berharga dan harus istimewa." delay={0.3} />
        </div>
      </section>
    </div>
  );
}
