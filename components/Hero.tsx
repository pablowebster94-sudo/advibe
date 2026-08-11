"use client";

import { MouseEvent, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Button from "@/components/ui/Button";
import EventButton from "@/components/EventButton";

const highlights = ["Meta Ads", "Audiovisual", "Web", "IA + Automatización"];
const disciplines = ["Marca", "Contenido", "Adquisición", "Tecnología"];

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 70, damping: 20 });
  const springY = useSpring(y, { stiffness: 70, damping: 20 });
  const rotateX = useTransform(springY, [-1, 1], [5, -5]);
  const rotateY = useTransform(springX, [-1, 1], [-7, 7]);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - bounds.left) / bounds.width - 0.5;
    const py = (event.clientY - bounds.top) / bounds.height - 0.5;
    setMousePosition({ x: px, y: py });
    x.set(px);
    y.set(py);
  };

  const resetMotion = () => {
    setMousePosition({ x: 0, y: 0 });
    x.set(0);
    y.set(0);
  };

  return (
    <section id="home" className="relative isolate overflow-hidden px-6 pb-24 pt-24 sm:pb-32 sm:pt-32 lg:px-8 lg:pb-40 lg:pt-36">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(91,124,255,0.12),transparent_35%,rgba(139,92,246,0.10)_75%,transparent)]" />
      <div className="absolute left-[8%] top-24 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-[120px] animate-pulse-ring" />
      <div className="absolute bottom-0 right-[8%] -z-10 h-80 w-80 rounded-full bg-violet-500/10 blur-[130px] animate-pulse-ring" />
      <div className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.09)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="max-w-4xl">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-7 inline-flex items-center gap-3 rounded-full border border-blue-300/20 bg-blue-300/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
            AdVibe Agencia · Ecuador
          </motion.p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.055em] text-white sm:text-7xl lg:text-[6.2rem]">
            Creamos marcas que <span className="bg-gradient-to-r from-blue-300 via-white to-violet-300 bg-clip-text text-transparent">destacan, venden y crecen.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">Estrategia, contenido audiovisual, Meta Ads, desarrollo web, inteligencia artificial y automatización para empresas que quieren ir un paso adelante.</p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <EventButton href="#diagnostico" eventName="hero_diagnostic_cta" eventParams={{ source: "hero_redesign" }} className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_15px_50px_-25px_rgba(255,255,255,0.8)] hover:-translate-y-1 hover:bg-slate-100">Solicitar diagnóstico gratuito <span className="ml-2">→</span></EventButton>
            <Button href="#portafolio" variant="secondary">Ver trabajo real</Button>
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {highlights.map((item, index) => <motion.span key={item} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + index * 0.07 }} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-400">{item}</motion.span>)}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.94, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }} onMouseMove={handleMouseMove} onMouseLeave={resetMotion} className="relative mx-auto w-full max-w-xl">
          <div className="absolute inset-[-10%] rounded-[3rem] bg-[radial-gradient(circle_at_50%_40%,rgba(91,124,255,0.22),transparent_55%)] blur-3xl" />
          <motion.div style={{ rotateX, rotateY, transformPerspective: 1200 }} className="relative overflow-hidden rounded-[2.7rem] border border-white/10 bg-[#080c14]/90 p-3 shadow-[0_40px_120px_-50px_rgba(91,124,255,0.55)] backdrop-blur-2xl">
            <div className="relative min-h-[470px] overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(145deg,#10172a,#070a11_55%,#151027)] p-7 sm:p-9">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-blue-300/10 animate-pulse-ring" />
              <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full border border-violet-300/10 animate-pulse-ring" />

              <div className="relative flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">ADVIBE / GROWTH SYSTEM</span>
                <span className="h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_20px_rgba(147,197,253,0.8)]" />
              </div>

              <div className="relative mt-16">
                <p className="text-xs uppercase tracking-[0.28em] text-blue-300">Una sola dirección</p>
                <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">Marca, adquisición y tecnología trabajando juntas.</h2>
              </div>

              <div className="relative mt-12 grid grid-cols-2 gap-2">
                {disciplines.map((item, index) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><span className="text-[10px] tracking-[0.2em] text-slate-600">0{index + 1}</span><p className="mt-5 text-sm font-semibold text-white">{item}</p></div>)}
              </div>

              <div className="relative mt-7 flex items-center justify-between border-t border-white/10 pt-5">
                <p className="text-xs text-slate-500">Diseñado a medida para cada negocio.</p>
                <div className="h-8 w-24 overflow-hidden rounded-full border border-white/10 bg-white/[0.03]"><div className="h-full w-2/3 bg-gradient-to-r from-blue-400 to-violet-400 animate-shimmer" /></div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div aria-hidden="true" className="mx-auto mt-20 flex max-w-7xl items-center gap-4 px-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-600 sm:mt-24">
        <span className="h-px flex-1 bg-white/10" /><span>Scroll para explorar</span><span className="h-px flex-1 bg-white/10" />
      </div>
    </section>
  );
}
