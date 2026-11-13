"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";
import { nav } from "@/lib/site";
import { WA_DEFAULT, waLink } from "@/lib/whatsapp";
import { CloseIcon, MenuIcon, WhatsAppIcon } from "./icons";

export function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filled = solid || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        filled ? "border-b border-navy/10 bg-white text-navy" : "on-dark border-b border-white/15 bg-transparent text-white"
      }`}
    >
      <div className="container-site flex h-[72px] items-center justify-between gap-6">
        <a href="#inicio" className="flex flex-col leading-none" aria-label="ALVITEC — inicio" onClick={() => setOpen(false)}>
          <span className="font-display text-[22px] font-bold tracking-[0.2em]">ALVITEC</span>
          <span className={`mt-1.5 hidden text-[9px] font-semibold uppercase tracking-[0.22em] sm:block ${filled ? "text-steel" : "text-white/75"}`}>
            Técnica en aluminio y vidrio
          </span>
        </a>

        <nav aria-label="Navegación principal" className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-[12px] font-semibold uppercase tracking-[0.14em] opacity-85 transition-opacity hover:opacity-100">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={waLink(WA_DEFAULT)}
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden min-h-[44px] items-center gap-2 px-5 text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors sm:inline-flex ${
              filled ? "bg-navy text-white hover:bg-steel" : "bg-white text-navy hover:bg-mist"
            }`}
          >
            <WhatsAppIcon width={16} height={16} />
            Solicitar cotización
          </a>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon width={24} height={24} /> : <MenuIcon width={24} height={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <m.div
            id="menu-movil"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-[72px] h-[calc(100dvh-72px)] overflow-y-auto border-t border-navy/10 bg-white lg:hidden"
          >
            <nav aria-label="Navegación móvil" className="container-site flex flex-col py-6">
              {nav.map((item, i) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-5 border-b border-navy/10 py-5 font-display text-2xl font-semibold tracking-tight text-navy"
                >
                  <span className="text-[11px] font-semibold tabular-nums tracking-[0.2em] text-steel">0{i + 1}</span>
                  {item.label}
                </a>
              ))}
              <a href={waLink(WA_DEFAULT)} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8" onClick={() => setOpen(false)}>
                <WhatsAppIcon width={18} height={18} />
                Solicitar cotización
              </a>
            </nav>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
