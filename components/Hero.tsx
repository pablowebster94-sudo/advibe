"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import EventButton from "@/components/EventButton";

const rotatingWords = ["venden.", "atraen.", "convierten."];

export default function Hero() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % rotatingWords.length);
    }, 2400);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section id="home" className="relative isolate overflow-hidden bg-[#05070a] px-6 pb-24 pt-12 sm:pb-28 sm:pt-16 lg:px-10 lg:pb-32 lg:pt-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_35%,rgba(120,217,79,0.13),transparent_27%),radial-gradient(circle_at_15%_75%,rgba(36,86,145,0.12),transparent_30%),linear-gradient(135deg,#05070a_0%,#071018_58%,#07100b_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-lime-300/50 to-transparent" />
      <div className="pointer-events-none absolute -right-64 top-20 -z-10 h-[42rem] w-[42rem] rounded-full border border-white/[0.06]" />
      <div className="pointer-events-none absolute right-[-10rem] top-48 -z-10 h-[30rem] w-[30rem] rounded-full border border-lime-300/[0.08]" />

      <div className="mx-auto max-w-7xl">
        <div className="grid items-end gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-20">
          <div>
            <p className="mb-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">
              <span className="h-px w-8 bg-lime-300" /> Agencia de marketing · Gualaceo · Cuenca · Azuay
            </p>
            <p className="mb-5 text-lg font-medium text-slate-300 sm:text-xl">¿Tus anuncios gastan, pero no venden?</p>
            <h1 className="max-w-5xl text-[clamp(3.7rem,8.4vw,8.4rem)] font-semibold leading-[0.84] tracking-[-0.075em] text-white">
              <span className="block">Videos y anuncios</span>
              <span className="block">que <span className="inline-grid min-w-[6.1ch] align-baseline text-lime-300">
                <AnimatePresence initial={false}>
                  <motion.span key={rotatingWords[wordIndex]} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .35, ease: [0.22,1,0.36,1] }} className="[grid-area:1/1] inline-block whitespace-nowrap">
                    {rotatingWords[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span></span>
            </h1>
            <p className="mt-9 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Producimos el contenido y manejamos tus Meta Ads para que lleguen más clientes a tu WhatsApp. Para negocios de Gualaceo, Cuenca y todo el Azuay.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <EventButton href="#contacto" eventName="hero_diagnostic_cta" eventParams={{ source: "interactive_hero" }} leadOnClick className="inline-flex items-center justify-center rounded-full bg-lime-400 px-7 py-4 text-sm font-semibold text-[#07101a] shadow-[0_18px_60px_-25px_rgba(120,217,79,.7)] hover:-translate-y-1 hover:bg-lime-300">Analizar mi negocio <span className="ml-2">↗</span></EventButton>
              <Button href="#trabajo" variant="secondary" className="rounded-full border-white/10 bg-white/[0.03] px-7 py-4 text-white hover:border-white/20 hover:bg-white/[0.08]">Ver nuestro trabajo</Button>
            </div>
          </div>

          <div className="relative hidden w-full max-w-[300px] lg:block lg:justify-self-end">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_40px_120px_-50px_rgba(120,217,79,.45)]">
              <video src="/videos/am-mini-cooper.mp4" poster="/videos/am-mini-cooper.jpg" autoPlay muted loop playsInline preload="metadata" aria-label="Reel de vehículo producido por AdVibe para AM Motorsport" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-lime-300">Trabajo real</p>
                <p className="mt-1 text-sm font-semibold text-white">AM Motorsport · Reel de vehículo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
