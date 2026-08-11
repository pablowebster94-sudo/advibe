"use client";

import { MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Button from "@/components/ui/Button";
import EventButton from "@/components/EventButton";

const highlights = ["Meta Ads", "Contenido", "Desarrollo Web", "IA y Automatización"];
const disciplines = ["Contenido que comunica", "Campañas que convierten", "Web que presenta", "Tecnología que ayuda"];

export default function Hero() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 70, damping: 20 });
  const springY = useSpring(y, { stiffness: 70, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-5, 5]);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - bounds.left) / bounds.width - 0.5);
    y.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const resetMotion = () => { x.set(0); y.set(0); };

  return (
    <section id="home" className="relative isolate overflow-hidden px-6 pb-28 pt-24 sm:pb-36 sm:pt-32 lg:px-8 lg:pb-44 lg:pt-36">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_30%,rgba(37,211,194,0.10),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(59,130,246,0.12),transparent_30%),linear-gradient(135deg,#050505_0%,#090b0d_55%,#050505_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute left-[-10rem] top-1/3 -z-10 h-96 w-96 rounded-full bg-[#20c9b7]/10 blur-[140px]" />
      <div className="absolute right-[-8rem] top-20 -z-10 h-[32rem] w-[32rem] rounded-full border border-white/5" />

      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }} className="max-w-4xl">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mb-7 inline-flex rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9de9df]">
            Agencia creativa & tecnológica
          </motion.p>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[0.9] tracking-[-0.06em] text-[#f5f2ea] sm:text-7xl lg:text-[6.4rem]">
            Creamos marcas que <span className="text-[#35cdbb]">destacan, venden y crecen.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">Contenido audiovisual, Meta Ads, desarrollo web, inteligencia artificial y automatización para empresas que quieren convertir mejor su presencia digital en oportunidades.</p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <EventButton href="#diagnostico" eventName="hero_diagnostic_cta" eventParams={{ source: "visual_redesign" }} className="inline-flex items-center justify-center rounded-full bg-[#f5f2ea] px-7 py-3.5 text-sm font-semibold text-[#070808] shadow-[0_20px_60px_-30px_rgba(245,242,234,0.8)] hover:-translate-y-1">Analizar mi marca <span className="ml-2">→</span></EventButton>
            <Button href="#portafolio" variant="secondary">Ver trabajo real</Button>
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {highlights.map((item, index) => <motion.span key={item} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.07 }} className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-slate-300 hover:border-[#35cdbb]/30 hover:text-[#b7fff6]">{item}</motion.span>)}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.94, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }} onMouseMove={handleMouseMove} onMouseLeave={resetMotion} className="relative mx-auto w-full max-w-xl">
          <div className="absolute inset-[-12%] rounded-full bg-[#20c9b7]/10 blur-[100px]" />
          <motion.div style={{ rotateX, rotateY, transformPerspective: 1200 }} className="relative overflow-hidden rounded-[2.6rem] border border-white/10 bg-[#0b0d0e]/90 p-3 shadow-[0_50px_120px_-70px_rgba(32,201,183,0.5)] backdrop-blur-2xl">
            <div className="relative min-h-[470px] overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(145deg,#141716,#080909_62%,#0d1514)] p-7 sm:p-9">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-[#35cdbb]/15 animate-pulse-ring" />
              <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full border border-blue-400/10 animate-pulse-ring" />

              <div className="relative flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">ADVIBE / GROWTH SYSTEM</span>
                <span className="h-2 w-2 rounded-full bg-[#35cdbb] shadow-[0_0_24px_rgba(53,205,187,0.9)]" />
              </div>

              <div className="relative mt-16">
                <p className="text-xs uppercase tracking-[0.28em] text-[#7de1d5]">Una sola dirección</p>
                <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em] text-[#f5f2ea] sm:text-5xl">Estrategia, creatividad y tecnología para vender más.</h2>
              </div>

              <div className="relative mt-12 space-y-2">
                {disciplines.map((item) => <div key={item} className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition duration-500 hover:-translate-x-1 hover:border-[#35cdbb]/25 hover:bg-white/[0.06]"><p className="text-sm font-semibold text-white">{item}</p><span className="text-lg text-[#35cdbb] transition group-hover:translate-x-1">↗</span></div>)}
              </div>

              <div className="relative mt-7 flex items-center justify-between border-t border-white/10 pt-5">
                <p className="text-xs text-slate-500">Diseñado alrededor del negocio.</p>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10"><div className="h-full w-2/3 bg-[#35cdbb] animate-shimmer" /></div>
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
