"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

const navLinks = [
  { label: "Servicios", href: "#servicios" },
  { label: "Trabajo real", href: "#portafolio" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Diagnóstico", href: "#contacto" },
];

const socials = [
  { label: "Instagram", href: "https://instagram.com/advibe.agencia", icon: "IG" },
  { label: "Facebook", href: "https://www.facebook.com/share/1DT1TqhpjU/", icon: "FB" },
];

const ease = [0.22, 1, 0.36, 1] as const;

function BrandLogo() {
  return (
    <span className="inline-flex flex-col items-start leading-none" aria-label="AdVibe Agencia">
      <span className="text-[2rem] font-black tracking-[-0.07em] text-white sm:text-[2.2rem]">
        <span className="text-lime-400">Ad</span>Vibe
      </span>
      <span className="mt-1 pl-0.5 text-[0.5rem] font-semibold tracking-[0.5em] text-white/35">AGENCIA</span>
    </span>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <motion.header initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease }} className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? "border-b border-white/10 bg-[#050505]/85 shadow-[0_12px_50px_-35px_rgba(0,0,0,.9)] backdrop-blur-2xl" : "bg-transparent"}`}>
        <div className="mx-auto flex h-[73px] max-w-[1500px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#home" className="group shrink-0" aria-label="AdVibe Agencia" onClick={() => setMenuOpen(false)}>
            <BrandLogo />
          </a>

          <nav className="hidden items-center gap-7 md:flex lg:gap-9" aria-label="Navegación principal">
            {navLinks.map((link, index) => (
              <motion.a key={link.label} href={link.href} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 + index * 0.06, ease }} className="group relative py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55 transition-colors hover:text-white">
                {link.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-lime-300 transition-all duration-300 group-hover:w-full" />
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 sm:flex">
              {socials.map((item) => <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[9px] font-bold text-white/45 transition-all hover:-translate-y-0.5 hover:border-lime-300/40 hover:text-lime-300">{item.icon}</a>)}
            </div>
            <Button href="#contacto" variant="primary" className="hidden rounded-full bg-lime-400 px-5 py-2.5 text-xs font-semibold text-[#07101a] hover:-translate-y-0.5 hover:bg-lime-300 sm:inline-flex">Agenda un diagnóstico</Button>
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Abrir menú" aria-expanded={menuOpen} className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] md:hidden">
              <span className="h-px w-4 bg-white" />
              <span className="h-px w-4 bg-white" />
              <span className="h-px w-4 bg-white" />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-[100] flex min-h-svh flex-col bg-[#050505] px-6 py-5 sm:px-8">
            <div className="flex items-center justify-between">
              <a href="#home" onClick={() => setMenuOpen(false)}><BrandLogo /></a>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#050505] text-2xl leading-none">×</button>
            </div>
            <nav className="mt-20 flex flex-col gap-7" aria-label="Menú móvil">
              {navLinks.map((link, index) => (
                <motion.a key={link.label} href={link.href} onClick={() => setMenuOpen(false)} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 + index * 0.07, ease }} className="text-4xl font-semibold uppercase tracking-[-0.04em] text-white sm:text-5xl">
                  <span className="mr-3 text-sm font-medium tracking-[0.2em] text-lime-300">0{index + 1}</span>{link.label}
                </motion.a>
              ))}
            </nav>
            <div className="mt-auto border-t border-white/10 pt-6 pb-3">
              <a href="#contacto" onClick={() => setMenuOpen(false)} className="group flex items-center justify-between text-lg font-semibold text-lime-300">
                Trabajemos juntos <span className="text-2xl transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">↗</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
