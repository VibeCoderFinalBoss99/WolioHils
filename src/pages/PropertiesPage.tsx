import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Bed, Bath, Users, MapPin, X, SlidersHorizontal } from "lucide-react";
import { PROPERTIES } from "../data/properties";
import { use3DTilt } from "../hooks/use3DTilt";
import type { PageName } from "../App";

interface Props {
  navigate: (page: PageName) => void;
  startBooking: (id?: number, name?: string, price?: number, image?: string) => void;
}



function PropertyCard({ property, onClick }: { property: typeof PROPERTIES[0]; onClick: () => void }) {
  const { isHovering, rotateX, rotateY, glareBackground, handleMouseMove, handleMouseLeave, setIsHovering } = use3DTilt();
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} style={{ perspective: 1200 }} className="group">
      <motion.div
        animate={!isHovering ? { rotateX: [0.5, -0.5, 0.5], rotateY: [1, -1, 1] } : {}}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ rotateX: isHovering ? rotateX : undefined, rotateY: isHovering ? rotateY : undefined, transformStyle: "preserve-3d" }}
        onMouseEnter={() => setIsHovering(true)} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onClick={onClick}
        className="bg-white rounded-3xl overflow-hidden shadow-deep hover:shadow-[0_40px_100px_rgba(10,25,41,0.3)] transition-shadow duration-500 cursor-pointer relative"
      >
        <div className="relative h-56 overflow-hidden">
          <img src={property.image} alt={property.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {property.featured && <div className="absolute top-4 left-4 bg-accent text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">Unggulan</div>}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm text-primary px-4 py-2 rounded-xl shadow-lg">
            <span className="text-[10px] font-semibold text-text-light block leading-none">mulai dari</span>
            <span className="font-display font-bold text-lg leading-none">${property.price}</span><span className="text-[10px] text-text-light">/malam</span>
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg">
            <Star className="w-3.5 h-3.5 text-accent fill-accent" /><span className="font-bold text-xs text-primary">{property.rating}</span><span className="text-[10px] text-text-light">({property.reviews})</span>
          </div>
        </div>
        <div className="p-5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-2.5 py-1 rounded-full">{property.type}</span>
          <h3 className="font-display font-bold text-lg text-primary mb-1 mt-2 group-hover:text-accent transition-colors">{property.name}</h3>
          <div className="flex items-center gap-1 text-text-light mb-3"><MapPin className="w-3 h-3" /><span className="text-xs">{property.location}</span></div>
          <div className="flex items-center gap-4 text-text-light text-xs border-t border-surface-dark pt-3">
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {property.beds}</span>
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {property.baths}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {property.guests}</span>
          </div>
        </div>
        <motion.div style={{ background: glareBackground, zIndex: 10, pointerEvents: "none" }} className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
      </motion.div>
    </motion.div>
  );
}

function PropertyModal({ property, onClose, onBook }: { property: typeof PROPERTIES[0]; onClose: () => void; onBook: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = "unset"; };
  }, [onClose]);
  useEffect(() => { modalRef.current?.focus(); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] flex items-start md:items-center justify-center p-4 md:p-8 bg-black/70 backdrop-blur-lg overflow-y-auto" onClick={onClose}>
      <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={onClose} className="fixed top-4 right-4 md:top-10 md:right-10 z-[1001] bg-white text-primary p-3 rounded-full shadow-xl hover:scale-110 transition-transform cursor-pointer" aria-label="Close">
        <X className="w-6 h-6" />
      </motion.button>
      <motion.div ref={modalRef} tabIndex={-1} initial={{ scale: 0.9, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 50, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative focus:outline-none my-auto" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 relative overflow-hidden">
            <img src={property.image} alt={property.name} className="w-full h-full object-cover min-h-[300px] md:min-h-[500px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{property.type}</span>
              {property.featured && <span className="bg-accent text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Unggulan</span>}
            </div>
            <h2 className="font-display font-black text-3xl text-primary mb-2">{property.name}</h2>
            <div className="flex items-center gap-1 text-text-light mb-4"><MapPin className="w-3.5 h-3.5" /><span className="text-sm">{property.location}</span></div>
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-4 h-4 text-accent fill-accent" /><span className="font-bold text-primary">{property.rating}</span><span className="text-text-light text-sm">({property.reviews} ulasan)</span>
            </div>
            <p className="text-text-light text-sm leading-relaxed mb-6">{property.description}</p>
            <div className="grid grid-cols-4 gap-3 mb-6 py-4 border-y border-surface-dark">
              <div className="text-center"><Bed className="w-4 h-4 text-accent mx-auto mb-1" /><span className="text-xs text-text-light">{property.beds} Ranjang</span></div>
              <div className="text-center"><Bath className="w-4 h-4 text-accent mx-auto mb-1" /><span className="text-xs text-text-light">{property.baths} Kamar Mandi</span></div>
              <div className="text-center"><Users className="w-4 h-4 text-accent mx-auto mb-1" /><span className="text-xs text-text-light">{property.guests} Tamu</span></div>
              <div className="text-center"><SlidersHorizontal className="w-4 h-4 text-accent mx-auto mb-1" /><span className="text-xs text-text-light">{property.area}</span></div>
            </div>
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-light mb-3">Fasilitas</h4>
              <div className="flex flex-wrap gap-2">{property.amenities.map(a => <span key={a} className="text-[10px] font-semibold uppercase tracking-wider bg-surface px-3 py-1.5 rounded-full text-text-light">{a}</span>)}</div>
            </div>
            <div className="flex items-center justify-between mt-auto">
              <div><span className="text-text-light text-xs">mulai dari</span><div className="font-display font-bold text-2xl text-primary">${property.price}<span className="text-sm text-text-light font-normal">/malam</span></div></div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBook} className="bg-accent hover:bg-accent-light text-primary font-bold text-sm tracking-wider uppercase px-8 py-3.5 rounded-full shadow-lg cursor-pointer transition-colors">Pesan Sekarang</motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PropertiesPage({ startBooking }: Props) {
  const [filter, setFilter] = useState<string>("semua");
  const [selectedProperty, setSelectedProperty] = useState<typeof PROPERTIES[0] | null>(null);
          const types = ["semua", "villa", "hotel", "apartemen", "rumah"];
  const filtered = filter === "semua" ? PROPERTIES : PROPERTIES.filter(p => p.type === filter);

  return (
    <>
      <section className="relative pt-40 pb-24 px-6 hero-gradient overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity }} className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-accent font-semibold text-xs uppercase tracking-[0.3em]">Koleksi Kami</motion.span>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-display font-black text-white text-5xl md:text-7xl leading-[0.9] mt-3 mb-6">Properti <span className="text-gradient">Mewah</span></motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-white/60 text-lg max-w-2xl mx-auto">Jelajahi koleksi pilihan kami dari akomodasi terbaik di dunia.</motion.p>
        </div>
        <div className="absolute bottom-0 left-0 w-full"><svg viewBox="0 0 1440 120" fill="none" className="w-full"><path d="M0,80 C360,120 1080,40 1440,80 L1440,120 L0,120 Z" fill="var(--color-surface)" /></svg></div>
      </section>

      <section className="py-12 px-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-6 py-2.5 rounded-full font-semibold text-xs uppercase tracking-widest transition-all cursor-pointer ${filter === t ? "bg-primary text-accent shadow-lg" : "bg-white text-text-light hover:bg-surface-dark gold-border"}`}>{t}</button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={filter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(p => <PropertyCard key={p.id} property={p} onClick={() => setSelectedProperty(p)} />)}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20"><p className="text-text-light text-lg">Tidak ada properti yang ditemukan untuk filter ini.</p></div>
        )}
      </section>

      <AnimatePresence>
        {selectedProperty && (
          <PropertyModal property={selectedProperty} onClose={() => setSelectedProperty(null)} onBook={() => { startBooking(selectedProperty.id, selectedProperty.name, selectedProperty.price, selectedProperty.image); setSelectedProperty(null); }} />
        )}
      </AnimatePresence>
    </>
  );
}
