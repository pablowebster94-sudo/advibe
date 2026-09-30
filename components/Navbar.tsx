"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import EventButton from "@/components/EventButton";

const navLinks = [
  { label: "Servicios", href: "#servicios" },
  { label: "Soluciones", href: "#soluciones" },
  { label: "Casos", href: "/casos" },
  { label: "Proceso", href: "#proceso" },
  { label: "Preguntas", href: "#preguntas" },
];

const socials = [
  {
    label: "Instagram",
    href: "https://instagram.com/advibe.agencia",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5Zm5.25-2.75a1.25 1.25 0 1 1-1.25 1.25Z" /></svg>,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1DT1TqhpjU/",
    icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M13 22v-9h3l.5-4H13V4.5c0-1.1.3-1.9 1.9-1.9H17V.1c-.3-.1-1.4-.1-2.6-.1-2.7 0-4.6 1.6-4.6 4.8V9H6.5v4H9.8v9h3.2Z" /></svg>,
  },
];

function BrandLogo() {
  return (
    <span className="inline-flex flex-col items-center leading-none" aria-label="AdVibe Agencia">
      <span className="text-[2rem] font-black tracking-[-0.07em] text-white sm:text-[2.25rem]"><span className="text-lime-400">Ad</span>Vibe</span>
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
        <a href="#home" className="group flex items-center" aria-label="AdVibe Agencia"><BrandLogo /></a>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => <a key={link.label} href={link.href} className="group relative text-sm font-medium text-slate-400 hover:text-white">{link.label}<span className="absolute -bottom-2 left-0 h-px w-0 bg-lime-400 transition-all duration-300 group-hover:w-full" /></a>)}
        </nav>
        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-2 sm:flex">{socials.map((item) => <a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-400 hover:border-lime-300/30 hover:text-lime-300">{item.icon}</a>)}</div>
          <EventButton href="/diagnostico" eventName="navbar_diagnostic_cta" eventParams={{ source: "navbar" }} leadOnClick className="inline-flex items-center justify-center rounded-full border border-lime-300/60 bg-transparent px-7 py-3 text-sm font-semibold text-lime-300 transition duration-300 ease-out transform-gpu hover:-translate-y-0.5 hover:border-lime-300 hover:bg-lime-300/10 hover:text-lime-200">Diagnóstico gratis</EventButton>
        </div>
      </div>
    </motion.header>
  );
}
