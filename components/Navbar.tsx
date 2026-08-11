"use client";

import { motion } from "framer-motion";
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

function BrandLogo() {
  return (
    <span className="inline-flex flex-col items-center leading-none" aria-label="AdVibe Agencia">
      <span className="text-[2rem] font-black tracking-[-0.07em] text-white sm:text-[2.25rem]">
        <span className="text-lime-400">Ad</span>Vibe
      </span>
      <span className="mt-1 text-[0.55rem] font-medium tracking-[0.45em] text-slate-500">AGENCIA</span>
    </span>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className={`sticky top-0 z-50 border-b transition-all duration-500 ${scrolled ? "border-white/10 bg-[#07101a]/90 backdrop-blur-2xl" : "border-white/5 bg-[#07101a]/70 backdrop-blur-xl"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
        <a href="#home" className="group flex items-center" aria-label="AdVibe Agencia">
          <BrandLogo />
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="group relative text-sm font-medium text-slate-400 hover:text-white">
              {link.label}
              <span className="absolute -bottom-2 left-0 h-px w-0 bg-lime-400 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-2 sm:flex">
            {socials.map((item) => <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[10px] font-bold text-slate-400 hover:border-lime-300/30 hover:text-lime-300">{item.icon}</a>)}
          </div>
          <Button href="#contacto" variant="primary" className="bg-lime-400 text-[#07101a] hover:bg-lime-300">Agenda un diagnóstico</Button>
        </div>
      </div>
    </motion.header>
  );
}
