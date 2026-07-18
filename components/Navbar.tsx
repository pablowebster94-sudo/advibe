"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

const navLinks = [
  { label: "Servicios", href: "#servicios" },
  { label: "Proyectos", href: "#portafolio" },
  { label: "Contacto", href: "#contacto" },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/advibe.agencia",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5Zm5.25-2.75a1.25 1.25 0 1 1-1.25 1.25 1.25 1.25 0 0 1 1.25-1.25Z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1DT1TqhpjU/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M13 22v-9h3l.5-4H13V4.5c0-1.1.3-1.9 1.9-1.9H17V.1c-.3-.1-1.4-.1-2.6-.1-2.7 0-4.6 1.6-4.6 4.8V9H6.5v4H9.8v9h3.2Z" />
      </svg>
    ),
  },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-white/15 bg-slate-950/80 shadow-[0_20px_80px_-50px_rgba(0,212,255,0.55)] backdrop-blur-3xl"
          : "border-white/10 bg-slate-950/60 backdrop-blur-2xl"
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a href="#home" className="flex items-center gap-3 transition hover:opacity-90">
          <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-400/10 text-2xl shadow-[0_24px_80px_-50px_rgba(0,212,255,0.8)]">
            A
          </span>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">AdVibe</p>
            <p className="text-xs text-slate-400">Agencia premium</p>
          </div>
        </a>

        <nav className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium text-slate-300 transition hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-400/50 hover:bg-white/10 hover:text-white"
            >
              {link.icon}
            </a>
          ))}
          <Button href="https://wa.me/593984966335?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20sus%20servicios." variant="ghost" className="hidden sm:inline-flex">
            WhatsApp
          </Button>
          <Button href="#contacto" variant="primary" className="text-sm">
            Contáctanos
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
