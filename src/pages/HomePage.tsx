import React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Star, Shield, Clock, Headphones, Bed, Users, MapPin, ArrowRight, Quote } from "lucide-react";
import { TESTIMONIALS } from "../data/properties";
import { use3DTilt } from "../hooks/use3DTilt";
import type { PageName } from "../App";

interface HomePageProps {
  navigate: (page: PageName) => void;
  startBooking: (id?: number, name?: string, price?: number, image?: string) => void;
}



function FeatureCard({ icon: Icon, title, desc, delay }: { icon: React.ElementType; title: string; desc: string; delay: number }) {
  const { isHovering, rotateX, rotateY, glareBackground, handleMouseMove, handleMouseLeave, setIsHovering } = use3DTilt();
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.6 }} viewport={{ once: true }} style={{ perspective: 1000 }}>
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

interface VideoData {
  id: number;
  src: string;
  title: string;
  desc?: string;
}

export default function HomePage({ startBooking }: HomePageProps) {
  const { scrollY } = useScroll();
  
  // Video data from folder
  const videos: VideoData[] = [
    { id: 1, src: '/videos/Kamar 2.mp4', title: 'Ruangan Nyaman', desc: 'Kamar tidur elegan dengan desain modern dan fasilitas premium untuk kenyamanan maksimal selama menginap.' },
    { id: 2, src: '/videos/Kamar Utama WolioHills Malino.mp4', title: 'Master Suite', desc: 'Suite utama mewah dengan pemandangan pegunungan yang memukau dan interior yang sangat eksklusif.' },
    { id: 3, src: '/videos/AQPID_FrWBbQc42KzRwuMv5ZxOM8EPGcxl-gNfa6Haur_YLcSGyJNNmRBu986ErbgkDiwZ7Xm0lLoPAX6f1RPGbpuGNDIrLu.mp4', title: 'Mountain View', desc: 'Pemandangan pegunungan yang hijau dan memukau dari villa, suasana segar dan menenangkan.' },
    { id: 4, src: '/videos/AQPzTBWRPErBRSBgwgtoPXd4ao3HQIc8Pb4Oi3RFryqSJJ111hGC6shizQBaE83KiIG4Hjb72Kqyc078KH86BkVZHtz2oBxp.mp4', title: 'Tropical Garden', desc: 'Perkebunan tropis yang asri dan hijau, nuansa alami yang menyegarkan di tengah Malino.' },
    { id: 5, src: '/videos/overview.mp4', title: 'Villa Panorama', desc: 'Panorama lengkap villa dengan latar pegunungan dan perkebunan yang indah, pemandangan eksklusif Wolio Hills.' }
  ];

  // Debug: Check if videos are loaded
  React.useEffect(() => {
    console.log('Videos loaded:', videos);
    console.log('Videos folder path:', '/videos/');
  }, []);
  
  // Scroll animations
  const statsOpacity = useTransform(scrollY, [0, 300], [0, 1]);
  const featuresOpacity = useTransform(scrollY, [400, 700], [0, 1]);
  const videoOpacity = useTransform(scrollY, [800, 1100], [0, 1]);
  const villaOpacity = useTransform(scrollY, [1200, 1500], [0, 1]);
  const howItWorksOpacity = useTransform(scrollY, [1600, 1900], [0, 1]);
  
  const statsY = useTransform(scrollY, [300, 800], [50, 0]);
  const featuresY = useTransform(scrollY, [400, 900], [50, 0]);
  const videoY = useTransform(scrollY, [800, 1300], [50, 0]);
  const villaY = useTransform(scrollY, [1200, 1700], [50, 0]);
  const howItWorksY = useTransform(scrollY, [1600, 2100], [50, 0]);
  
  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Full-size background image */}
        <div className="absolute inset-0 w-full h-full">
          <img 
            src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1920&q=80" 
            alt="Luxury villa with pool" 
            className="w-full h-full object-cover object-center"
            style={{ 
              width: '100vw',
              height: '100vh',
              objectFit: 'cover'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>
        <motion.div animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], x: [0, -40, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-primary-light/30 rounded-full blur-[150px]" />

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-32 pb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4, duration: 0.8 }} 
            className="font-display font-black text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] mb-6 tracking-tight"
            style={{ textShadow: '0 10px 40px rgba(45,67,36,0.3)' }}
          >
            Wolio Hills<br /><span className="text-gradient">Malino</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.6 }} 
            className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ textShadow: '0 5px 20px rgba(0,0,0,0.2)' }}
          >
            Wolio Hills Malino - Pengalaman menginap premium di tengah keindahan alam Malino yang memukau. Tempat perfect buat staycation, healing, dan quality time bareng orang tersayang!
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.8 }} 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <motion.button 
              whileHover={{ scale: 1.05, y: -2, boxShadow: '0 25px 60px rgba(201,168,76,0.4)' }} 
              whileTap={{ scale: 0.95 }} 
              onClick={() => startBooking()} 
              className="bg-accent hover:bg-accent-light text-primary font-bold text-sm tracking-wider uppercase px-10 py-4 rounded-full shadow-lg flex items-center gap-3 transition-all duration-300 cursor-pointer"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              Booking Sekarang <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>

        <div className="absolute -bottom-10 left-0 w-full"><svg viewBox="0 0 1440 60" fill="none" className="w-full h-15"><path d="M0,40 C360,60 1080,20 1440,40 L1440,60 L0,60 Z" fill="var(--color-surface)" /></svg></div>
      </section>

      {/* STATS SECTION */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-primary/5 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }}
          className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-primary/5"
        />
        <motion.div 
          style={{ opacity: statsOpacity, transform: `translateY(${statsY}px)` }}
          className="max-w-6xl mx-auto relative z-10"
        >
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            className="text-center mb-16"
          >
            <span className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Kenapa Wolio Hills?</span>
            <h2 className="font-display font-black text-primary text-4xl md:text-5xl mt-3">Pengalaman <span className="text-gradient">Premium</span></h2>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: 0.2 }}
            className="bg-white/90 backdrop-blur-md rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl border border-white/30"
            style={{ backdropFilter: 'blur(20px)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <div className="text-4xl md:text-5xl font-black text-primary mb-2 group-hover:text-accent transition-colors duration-300">10+</div>
                <p className="text-primary/80 text-sm font-medium group-hover:text-primary transition-colors duration-300">Pengalaman Mewah</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <div className="text-4xl md:text-5xl font-black text-primary mb-2 group-hover:text-accent transition-colors duration-300">100%</div>
                <p className="text-primary/80 text-sm font-medium group-hover:text-primary transition-colors duration-300">Kepuasan Tamu</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <div className="text-4xl md:text-5xl font-black text-primary mb-2 group-hover:text-accent transition-colors duration-300">24/7</div>
                <p className="text-primary/80 text-sm font-medium group-hover:text-primary transition-colors duration-300">Support Tersedia</p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 max-w-7xl mx-auto relative">
        <motion.div 
          style={{ opacity: featuresOpacity, transform: `translateY(${featuresY}px)` }}
          className="max-w-7xl mx-auto relative z-10"
        >
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Mengapa Memilih Kami</span>
            <h2 className="font-display font-black text-primary text-4xl md:text-5xl mt-3">Pengalaman <span className="text-gradient">Wolio Hills</span></h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard icon={Shield} title="Properti Terverifikasi" desc="Setiap properti diperiksa dan diverifikasi secara personal oleh tim kualitas Wolio Hills." delay={0} />
            <FeatureCard icon={Clock} title="Pesan Instan" desc="Pesan menginap sempurna kamu dalam hitungan detik dengan sistem yang Wolio Hills rancang." delay={0.1} />
            <FeatureCard icon={Headphones} title="Support 24/7" desc="Kami siap membantu kapan saja kamu butuhkan." delay={0.2} />
            <FeatureCard icon={Star} title="Harga Terbaik" desc="Wolio Hills jamin harga terbaik. Dengan Kualitas dan Pengalaman yang tentunya sesuai." delay={0.3} />
          </div>
        </motion.div>
      </section>

      {/* VIDEO SHOWCASE */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary/5 to-accent/5 relative overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px]" 
        />
        <motion.div 
          animate={{ scale: [1.3, 1, 1.3] }} 
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" 
        />
        
        <motion.div 
          style={{ opacity: videoOpacity, transform: `translateY(${videoY}px)` }}
          className="max-w-7xl mx-auto relative z-10"
        >
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            className="text-center mb-16"
          >
            <span className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Video Experience</span>
            <h2 className="font-display font-black text-primary text-4xl md:text-5xl mt-3">Eksplorasi <span className="text-gradient">Wolio Hills</span></h2>
            <p className="text-text-light text-lg mt-4 max-w-2xl mx-auto">Lihat langsung keindahan dan fasilitas Wolio Hills Malino melalui video-video eksklusif kami.</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {videos.map((video, index) => {
              const isLastVideo = index === videos.length - 1;
              const isSecondRow = index === 2 || index === 3; // Videos 3 and 4 (second row)
              return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: index * 0.15, 
                  duration: 0.8,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
                }}
                className={`group cursor-pointer ${isLastVideo ? 'lg:col-span-1 xl:col-span-1 col-span-2 flex justify-center' : isSecondRow ? 'max-w-sm mx-auto lg:max-w-none xl:max-w-none' : ''}`}
              >
                <div className="relative overflow-hidden shadow-lg bg-white rounded-xl md:rounded-2xl hover:shadow-xl transition-all duration-300 h-full">
                  {/* Video Container */}
                  <div className="relative aspect-[9/16] w-full">
                    <video
                      className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105 group-hover:brightness-105"
                      autoPlay
                      muted
                      loop
                      playsInline
                    >
                      <source src={video.src} type="video/mp4" />
                      Your browser does not support video tag.
                    </video>
                    
                    {/* Gradient Overlay */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent opacity-0"
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    
                    {/* Shimmer Effect */}
                    <motion.div 
                      className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 -skew-x-12 ${isLastVideo ? 'left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 xl:left-auto xl:translate-x-0' : ''}`}
                      whileHover={{ 
                        opacity: [0, 0.8, 0],
                        x: ["-100%", "100%"]
                      }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    />
                    
                    {/* Pulse Ring Animation */}
                    <motion.div
                      className={`absolute inset-0 rounded-xl md:rounded-2xl border border-accent/20 ${isLastVideo ? 'left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 xl:left-auto xl:translate-x-0' : ''}`}
                      animate={{
                        scale: [1, 1.03, 1],
                        opacity: [0, 0.2, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: index * 0.4,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                  
                  {/* Content */}
                  <motion.div 
                    className="p-4 md:p-5"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 + 0.2 }}
                  >
                    <motion.h3 
                      className="font-display font-bold text-primary text-sm md:text-lg mb-2 group-hover:text-accent transition-all duration-300"
                      whileHover={{ x: 2 }}
                    >
                      {video.title}
                    </motion.h3>
                    <motion.p 
                      className="text-text-light text-xs md:text-sm leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 0.8 }}
                      whileHover={{ opacity: 1 }}
                    >
                      {video.desc}
                    </motion.p>
                  </motion.div>
                </div>
              </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* VILLA SHOWCASE */}
      <section className="py-20 px-6 bg-primary-dark relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        <motion.div 
          animate={{ scale: [1, 1.3, 1] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px]" 
        />
        <motion.div 
          style={{ opacity: villaOpacity, transform: `translateY(${villaY}px)` }}
          className="max-w-7xl mx-auto relative z-10"
        >
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Destinasi Eksklusif</span>
            <h2 className="font-display font-black text-white text-4xl md:text-5xl mt-3">Wolio Hills <span className="text-gradient">Malino</span></h2>
            <p className="text-white/60 text-lg mt-4 max-w-2xl mx-auto">Destinasi premium di Malino dengan pemandangan alam yang memukau, fasilitas lengkap, dan privasi maksimal. Sempurna untuk liburan keluarga, gathering bareng teman, atau staycation yang menyegarkan pikiran.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80" alt="Wolio Hills Malino" className="w-full h-[400px] object-cover" loading="lazy" />
              </div>
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
                className="absolute -bottom-6 -right-6 bg-accent text-primary p-4 rounded-2xl shadow-xl"
                style={{ boxShadow: '0 20px 40px rgba(201,168,76,0.3)' }}
              >
                <div className="text-2xl font-bold">⭐ 4.9</div>
                <p className="text-xs font-semibold">Perfect Rating</p>
              </motion.div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
              <div>
                <h3 className="font-display font-bold text-2xl text-white mb-3">Akomodasi Premium</h3>
                <p className="text-white/70 leading-relaxed">Akomodasi eksklusif dengan desain modern, fasilitas lengkap, dan pemandangan alam yang memukau. Perfect buat liburan keluarga, gathering bareng teman, atau staycation yang menyegarkan pikiran.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                >
                  <Bed className="w-5 h-5 text-accent mb-2" />
                  <h4 className="text-white font-semibold text-sm mb-1">Kamar Tidur</h4>
                  <p className="text-white/60 text-xs">Kapasitas hingga 15 orang</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                >
                  <Users className="w-5 h-5 text-accent mb-2" />
                  <h4 className="text-white font-semibold text-sm mb-1">View Eksklusif</h4>
                  <p className="text-white/60 text-xs">Pemandangan alam memukau</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                >
                  <MapPin className="w-5 h-5 text-accent mb-2" />
                  <h4 className="text-white font-semibold text-sm mb-1">Lokasi Strategis</h4>
                  <p className="text-white/60 text-xs">Malino, Sulawesi Selatan</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                >
                  <Shield className="w-5 h-5 text-accent mb-2" />
                  <h4 className="text-white font-semibold text-sm mb-1">Full Privacy</h4>
                  <p className="text-white/60 text-xs">Tidak ada gangguan</p>
                </motion.div>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                onClick={() => startBooking(1, "Wolio Hills Malino", 2000000, "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80")} 
                className="w-full bg-accent hover:bg-accent-light text-primary font-bold text-sm tracking-wider uppercase px-8 py-4 rounded-full shadow-lg cursor-pointer transition-colors"
                style={{ boxShadow: '0 20px 40px rgba(201,168,76,0.3)' }}
              >
                Booking Sekarang
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <motion.div 
          style={{ opacity: howItWorksOpacity, transform: `translateY(${howItWorksY}px)` }}
          className="relative z-10"
        >
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Proses Mudah</span>
            <h2 className="font-display font-black text-primary text-4xl md:text-5xl mt-3">Cara <span className="text-gradient">Pesan</span></h2>
            <p className="text-text-light text-lg mt-4 max-w-2xl mx-auto">Klik Booking Sekarang, Isi data diri dan nikmati.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{ step: "01", title: "Booking", desc: "Klik tombol booking sekarang untuk memulai." }, { step: "02", title: "Isi Data", desc: "Lengkapi data diri dengan benar." }, { step: "03", title: "Nikmati", desc: "Siap untuk menikmati pengalaman menginap." }].map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }} className="text-center relative">
                <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="w-20 h-20 rounded-2xl bg-primary mx-auto mb-6 flex items-center justify-center shadow-deep relative z-10">
                  <span className="font-display font-bold text-accent text-xl">{item.step}</span>
                </motion.div>
                <h4 className="font-display font-bold text-primary text-xl mb-2">{item.title}</h4>
                <p className="text-text-light text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6 bg-surface-dark">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Testimoni</span>
            <h2 className="font-display font-black text-primary text-4xl md:text-5xl mt-3">Apa Kata <span className="text-gradient">Tamu Kami</span></h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="bg-white p-8 rounded-3xl shadow-deep gold-border relative">
                <Quote className="w-8 h-8 text-accent/20 absolute top-6 right-6" />
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-accent font-bold text-sm">{t.avatar}</div>
                  <div><h5 className="font-display font-bold text-primary text-sm">{t.name}</h5><p className="text-text-light text-xs">{t.role}</p></div>
                  <div className="ml-auto flex gap-0.5">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-accent fill-accent" />)}</div>
                </div>
                <p className="text-text-light text-sm leading-relaxed italic">"{t.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 hero-gradient relative overflow-hidden">
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display font-black text-white text-4xl md:text-6xl mb-6">Siap Merasakan <span className="text-gradient">Kemewahan?</span></motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-white/50 text-lg mb-10 max-w-lg mx-auto">Mulai perjalanan Anda hari ini dan temukan mengapa ribuan orang memilih Wolio Hills.</motion.p>
          <motion.button initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.95 }} onClick={() => startBooking()} className="bg-accent hover:bg-accent-light text-primary font-bold text-sm tracking-wider uppercase px-12 py-5 rounded-full shadow-[0_20px_50px_rgba(201,168,76,0.35)] cursor-pointer transition-colors border-animation">Mulai Pesan Sekarang</motion.button>
        </div>
      </section>
    </>
  );
}
