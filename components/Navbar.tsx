"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Story", href: "#home" },
  { label: "Expertise", href: "#servicios" },
  { label: "Studios", href: "#portafolio" },
  { label: "Feedback", href: "#testimonios" },
];

function Logo() {
  return <span className="flex items-center gap-2" aria-label="AdVibe Agencia"><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#b7ff38]"><span className="h-2.5 w-2.5 rounded-full bg-[#b7ff38]" /></span><span className="text-lg font-semibold tracking-[-.04em] text-white">AdVibe</span></span>;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll(); window.addEventListener("scroll", onScroll); return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  return (
    <>
      <motion.header initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease: [0.22,1,0.36,1] }} className={`sticky top-0 z-50 border-b border-white/10 transition-colors duration-500 ${scrolled ? "bg-[#070707]/90 backdrop-blur-xl" : "bg-[#070707]"}`}>
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#home" onClick={() => setOpen(false)}><Logo /></a>
          <nav className="hidden items-center gap-9 md:flex">
            {navLinks.map((link, i) => <motion.a key={link.label} custom={i} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .08, duration: .5 }} href={link.href} className="group text-[11px] font-semibold uppercase tracking-[.24em] text-white/65 hover:text-white">{link.label}<span className="mt-1 block h-px w-0 bg-[#b7ff38] transition-all duration-300 group-hover:w-full" /></motion.a>)}
          </nav>
          <div className="flex items-center gap-3">
            <a href="#diagnostico" className="hidden text-[11px] font-semibold uppercase tracking-[.2em] text-[#b7ff38] sm:inline">Work With Us ↗</a>
            <button type="button" aria-label="Abrir menú" onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-full bg-white text-black hover:scale-105 md:hidden"><span className="flex flex-col gap-1"><span className="h-0.5 w-4 bg-black"/><span className="h-0.5 w-4 bg-black"/><span className="h-0.5 w-4 bg-black"/></span></button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex flex-col bg-[#f4f3ee] px-5 py-5 text-black sm:px-8">
          <div className="flex items-center justify-between"><a href="#home" onClick={() => setOpen(false)}><span className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#b7ff38]"><span className="h-2.5 w-2.5 rounded-full bg-[#b7ff38]" /></span><span className="text-lg font-semibold">AdVibe</span></span></a><button type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-black text-white"><X className="h-4 w-4"/></button></div>
          <nav className="mt-16 flex flex-col gap-8">{navLinks.map((link, i) => <motion.a key={link.label} href={link.href} onClick={() => setOpen(false)} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 + i * .08, duration: .55, ease: [0.22,1,0.36,1] }} className="text-3xl font-semibold uppercase tracking-[.08em]">{link.label}</motion.a>)}</nav>
          <a href="#diagnostico" onClick={() => setOpen(false)} className="mt-auto flex items-center gap-2 pb-5 text-xl font-semibold text-[#5e0ed7]">Work With Us <ArrowUpRight className="h-5 w-5"/></a>
        </motion.div>}
      </AnimatePresence>
    </>
  );
}
