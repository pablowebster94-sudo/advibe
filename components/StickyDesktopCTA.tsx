"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import EventButton from "@/components/EventButton";

export default function StickyDesktopCTA() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 480);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }} className="fixed inset-x-0 top-0 z-[48] hidden md:block">
          <div className="border-b border-white/10 bg-[#050505]/92 shadow-[0_4px_32px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300" />
                <p className="text-sm font-semibold text-white">Diseño web · Captación · Automatización</p>
                <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 lg:block">Ecuador y Estados Unidos</span>
              </div>
              <EventButton href="/diagnostico" eventName="sticky_cta_click" eventParams={{ source: "sticky_desktop" }} leadOnClick className="rounded-full bg-lime-300 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-lime-200">Solicitar diagnóstico ↗</EventButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
