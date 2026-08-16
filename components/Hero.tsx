"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import EventButton from "@/components/EventButton";

const highlights = ["Contenido", "Publicidad", "Web", "IA", "Eventos"];
const rotatingWords = ["destacan.", "venden.", "crecen."];
const system = [
  { number: "01", title: "Estrategia", text: "Definimos qué decir, a quién y por qué." },
  { number: "02", title: "Creación", text: "Convertimos ideas en contenido que se recuerda." },
  { number: "03", title: "Performance", text: "Medimos, optimizamos y hacemos que avance." },
];

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
              <span className="h-px w-8 bg-lime-300" /> Agencia creativa + tecnológica · Ecuador
            </p>
            <h1 className="max-w-5xl text-[clamp(3.7rem,8.4vw,8.4rem)] font-semibold leading-[0.84] tracking-[-0.075em] text-white">
              <span className="block">Creamos marcas</span>
              <span className="block">que <span className="inline-grid min-w-[6.1ch] align-baseline text-lime-300">
                <AnimatePresence initial={false}>
                  <motion.span key={rotatingWords[wordIndex]} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .35, ease: [0.22,1,0.36,1] }} className="[grid-area:1/1] inline-block whitespace-nowrap">
                    {rotatingWords[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span></span>
            </h1>
            <p className="mt-9 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Contenido, estrategia y tecnología para empresas que quieren verse mejor, llegar a más personas y convertir su presencia digital en oportunidades.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <EventButton href="#diagnostico" eventName="hero_diagnostic_cta" eventParams={{ source: "interactive_hero" }} className="inline-flex items-center justify-center rounded-full bg-lime-400 px-7 py-4 text-sm font-semibold text-[#07101a] shadow-[0_18px_60px_-25px_rgba(120,217,79,.7)] hover:-translate-y-1 hover:bg-lime-300">Analizar mi marca <span className="ml-2">↗</span></EventButton>
              <Button href="#portafolio" variant="secondary" className="rounded-full border-white/10 bg-white/[0.03] px-7 py-4 text-white hover:border-white/20 hover:bg-white/[0.08]">Ver proyectos</Button>
            </div>
          </div>

          <div className="relative lg:pb-1">
            <div className="border-l border-white/10 pl-6 sm:pl-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">Cómo hacemos que pase</p>
                <span className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-lime-300/70"><span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(120,217,79,.8)]" /> AdVibe system</span>
              </div>
              <p className="mt-5 max-w-md text-2xl font-medium leading-tight tracking-[-0.035em] text-white sm:text-3xl">Creatividad que comunica.<br />Tecnología que acelera.</p>

              <div className="mt-8">
                {system.map((item) => (
                  <div key={item.number} className="group relative border-t border-white/10 py-4 last:border-b">
                    <div className="flex items-start gap-4">
                      <span className="pt-0.5 font-mono text-[10px] text-lime-300/80">{item.number}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white transition-colors group-hover:text-lime-300">{item.title}</p>
                          <span className="text-slate-600 transition-transform group-hover:translate-x-1">↗</span>
                        </div>
                        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{item.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                {highlights.map((item, index) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-medium text-slate-400">0{index + 1} · {item}</span>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-3 text-xs text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_14px_rgba(120,217,79,.8)]" />
                Ecuador + Estados Unidos
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 border-t border-white/10 pt-5 sm:mt-24">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-600">AdVibe / Creative systems</p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Contenido</span><span className="text-lime-300">×</span><span>Performance</span><span className="text-lime-300">×</span><span>Technology</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
