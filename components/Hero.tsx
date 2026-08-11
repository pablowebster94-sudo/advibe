"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MouseEvent } from "react";
import Button from "@/components/ui/Button";
import EventButton from "@/components/EventButton";

const highlights = ["Meta Ads", "Audiovisual", "Web", "IA + Automatización"];
const disciplines = ["Contenido", "Publicidad", "Experiencia digital", "Tecnología"];

export default function Hero() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 55, damping: 18 });
  const springY = useSpring(y, { stiffness: 55, damping: 18 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - bounds.left) / bounds.width - 0.5);
    y.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const resetMotion = () => { x.set(0); y.set(0); };

  return (
    <section id="home" onMouseMove={handleMouseMove} onMouseLeave={resetMotion} className="relative isolate min-h-[calc(100svh-76px)] overflow-hidden bg-[#075BFF] px-6 py-16 text-white sm:py-20 lg:px-10 lg:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.16),transparent_28%),linear-gradient(135deg,#075BFF_0%,#0B4BEA_52%,#4F22D6_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
      <motion.div style={{ x: useTransform(springX, [-0.5, 0.5], [-18, 18]), y: useTransform(springY, [-0.5, 0.5], [-14, 14]) }} className="pointer-events-none absolute -right-52 top-1/2 -z-10 h-[46rem] w-[46rem] -translate-y-1/2 rounded-full border border-white/20" />
      <div className="pointer-events-none absolute -right-32 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full border border-white/20 animate-pulse-ring" />
      <div className="pointer-events-none absolute -right-12 top-1/2 -z-10 h-[22rem] w-[22rem] -translate-y-1/2 rounded-full border border-white/20" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="max-w-5xl">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="mb-8 text-xs font-semibold uppercase tracking-[0.34em] text-white/70">Agencia creativa + digital · Ecuador</motion.p>
          <h1 className="max-w-5xl text-[clamp(3.6rem,8vw,7.8rem)] font-semibold leading-[0.86] tracking-[-0.065em]">
            <motion.span initial={{ opacity: 0, y: 55 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="block">Contenido que</motion.span>
            <motion.span initial={{ opacity: 0, y: 55 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }} className="block text-white/55">llama la atención.</motion.span>
            <motion.span initial={{ opacity: 0, y: 55 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.16, ease: [0.22, 1, 0.36, 1] }} className="block">Publicidad que</motion.span>
            <motion.span initial={{ opacity: 0, y: 55 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.24, ease: [0.22, 1, 0.36, 1] }} className="block text-white/55">genera oportunidades.</motion.span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.42 }} className="mt-8 max-w-2xl text-lg leading-8 text-white/78 sm:text-xl">Creamos contenido audiovisual y campañas publicitarias para que tu negocio se vea mejor, llegue a más personas y genere conversaciones reales.</motion.p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <EventButton href="#diagnostico" eventName="hero_diagnostic_cta" eventParams={{ source: "editorial_hero" }} className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-sm font-semibold text-slate-950 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.45)] hover:-translate-y-1 hover:bg-slate-100">Solicitar diagnóstico gratuito <span className="ml-2">↗</span></EventButton>
            <Button href="#portafolio" variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/15">Ver trabajo real</Button>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-white/65">
            {highlights.map((item) => <span key={item} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white" />{item}</span>)}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.9, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.95, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} style={{ rotateX, rotateY, transformPerspective: 1200 }} className="relative mx-auto w-full max-w-lg">
          <div className="absolute inset-[-12%] rounded-[3rem] bg-white/15 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-[#071124]/95 p-3 shadow-[0_45px_100px_-35px_rgba(0,0,0,0.5)]">
            <div className="relative min-h-[460px] overflow-hidden rounded-[2rem] bg-[#0B1222] p-7 sm:p-9">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-blue-300/20" />
              <div className="absolute -right-8 top-8 h-44 w-44 rounded-full border border-violet-300/20 animate-pulse-ring" />
              <div className="relative flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/40">ADVIBE / WORKFLOW</span><span className="h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_24px_rgba(147,197,253,0.9)]" /></div>
              <p className="relative mt-20 max-w-xs text-sm uppercase tracking-[0.25em] text-blue-300">De la idea a la conversación</p>
              <h2 className="relative mt-4 max-w-md text-4xl font-semibold leading-[0.95] tracking-[-0.045em] text-white sm:text-5xl">Creamos. Publicamos. Medimos. Mejoramos.</h2>
              <div className="relative mt-12 grid grid-cols-2 gap-2">
                {disciplines.map((item, index) => <motion.div key={item} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + index * 0.08 }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-sm font-semibold text-white">{item}</p></motion.div>)}
              </div>
              <div className="relative mt-7 border-t border-white/10 pt-5"><p className="text-xs text-white/40">Contenido + publicidad + experiencia digital</p></div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mx-auto mt-16 flex max-w-7xl items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-white/45"><span className="h-px flex-1 bg-white/20" /><span>Desliza para ver el trabajo</span><span className="h-px flex-1 bg-white/20" /></motion.div>
    </section>
  );
}
