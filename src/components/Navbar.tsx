import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, Info, Phone, Menu, X } from "lucide-react";
import type { PageName } from "../App";

interface NavbarProps {
  currentPage: PageName;
  navigate: (page: PageName) => void;
}

const navLinks: { name: string; page: PageName; icon: React.ElementType }[] = [
  { name: "BERANDA", page: "home", icon: Home },
  { name: "TENTANG", page: "about", icon: Info },
  { name: "KONTAK", page: "contact", icon: Phone },
];

export default function Navbar({ currentPage, navigate }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isMobileOpen]);

  return (
    <>
      <nav
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[120] transition-all duration-500 w-[94%] max-w-5xl ${
          isScrolled
            ? "py-3 px-6 bg-primary-dark/90 backdrop-blur-2xl border border-accent/15 shadow-[0_20px_50px_rgba(10,25,41,0.5)] rounded-full"
            : "py-4 px-8 bg-transparent rounded-none"
        }`}
      >
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { navigate("home"); setIsMobileOpen(false); }}
          >
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <span className="font-display font-black text-white text-sm">W</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-display font-bold text-white text-lg leading-none tracking-wide">Wolio Hills</span>
              <span className="text-[9px] font-bold text-white tracking-[0.3em] uppercase">Malino</span>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <motion.button
                key={link.name}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(link.page)}
                className={`relative px-5 py-2 rounded-full font-semibold text-[11px] tracking-[0.2em] transition-all duration-300 cursor-pointer ${
                  currentPage === link.page
                    ? "text-primary bg-accent shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.name}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("book")}
              className="hidden md:flex items-center gap-2 bg-accent hover:bg-accent-light text-primary font-bold text-xs tracking-wider uppercase px-6 py-2.5 rounded-full shadow-lg shadow-accent/25 transition-colors duration-300 cursor-pointer border-animation"
            >
              Booking Sekarang
            </motion.button>

            <button
              type="button"
              className="md:hidden text-white p-2 cursor-pointer z-[200]"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-[110] hero-gradient flex flex-col items-center justify-center"
          >
            <div className="flex flex-col gap-8 items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center shadow-2xl mb-6"
              >
                <span className="font-display font-black text-white text-3xl">L</span>
              </motion.div>

              {navLinks.map((link, i) => (
                <motion.button
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  onClick={() => { navigate(link.page); setIsMobileOpen(false); }}
                  className={`font-display font-bold text-3xl tracking-widest flex items-center gap-4 transition-colors cursor-pointer ${
                    currentPage === link.page ? "text-accent" : "text-white/80 hover:text-white"
                  }`}
                >
                  <link.icon className="w-7 h-7 opacity-50" />
                  {link.name}
                </motion.button>
              ))}

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { navigate("book"); setIsMobileOpen(false); }}
                className="mt-6 bg-accent text-primary font-bold text-sm tracking-wider uppercase px-10 py-4 rounded-full shadow-xl shadow-accent/30 cursor-pointer"
              >
                Booking Sekarang
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
