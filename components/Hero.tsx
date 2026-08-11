"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MouseEvent } from "react";
import Button from "@/components/ui/Button";
import EventButton from "@/components/EventButton";

const highlights = ["Contenido audiovisual", "Meta Ads", "Desarrollo Web", "IA + Automatización"];

export default function Hero() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 45, damping: 18 });
  const springY = useSpring(y, { stiffness: 45, damping: 18 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-4, 4]);

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - bounds.left) / bounds.width - 0.5);
    y.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const resetMotion = () => { x.set(0); y.set(0); };

  return (
    <section id="home" onMouseMove={handleMouseMove} onMouseLeave={resetMotion} className="relative isolate overflow-hidden bg-[#07101a] px-6 pb-24 pt-16 sm:pb-28 sm:pt-20 lg:px-10 lg:pb-36 lg:pt-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(120,217,79,0.12),transparent_26%),linear-gradient(135deg,#07101a_0%,#0a1723_62%,#0b1a16_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:80px_80px]" />
      <div className="pointer-events-none absolute -right-48 top-1/2 -z-10 h-[44rem] w-[44rem] -translate-y-1/2 rounded-full border border-lime-300/10 animate-ring-pulse" />
      <div className="pointer-events-none absolute -right-20 top-1/2 -z-10 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full border border-lime-300/10" />
      <div className="pointer-events-none absolute -right-2 top-1/2 -z-10 h-[18rem] w-[18rem] -translate-y-1/2 rounded-full border border-lime-300/10 animate-ring-pulse" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.18fr_0.82fr]">
        <div className="max-w-5xl">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }} className="mb-6 text-xs font-semibold uppercase tracking-[0.34em] text-lime-300/80">Agencia creativa y tecnológica · Ecuador</motion.p>
          <h1 className="max-w-4xl text-[clamp(3.7rem,8vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.06em] text-white">
            <motion.span initial={{ opacity: 0, y: 42 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .72, ease: [0.22,1,0.36,1] }} className="block">Creamos marcas que</motion.span>
            <motion.span initial={{ opacity: 0, y: 42 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .72, delay: .08, ease: [0.22,1,0.36,1] }} className="block text-white/52">destacan, venden</motion.span>
            <motion.span initial={{ opacity: 0, y: 42 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .72, delay: .16, ease: [0.22,1,0.36,1] }} className="block text-lime-300">y crecen.</motion.span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .3 }} className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">Contenido audiovisual, campañas publicitarias, desarrollo web y tecnología para empresas que quieren verse mejor, llegar a más personas y generar oportunidades.</motion.p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <EventButton href="#diagnostico" eventName="hero_diagnostic_cta" eventParams={{ source: "legacy_identity_redesign" }} className="inline-flex items-center justify-center rounded-full bg-lime-400 px-7 py-4 text-sm font-semibold text-[#07101a] shadow-[0_18px_50px_-24px_rgba(120,217,79,.75)] hover:-translate-y-1 hover:bg-lime-300">Solicitar diagnóstico gratuito <span className="ml-2">↗</span></EventButton>
            <Button href="#portafolio" variant="secondary" className="border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]">Ver trabajo real</Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-400">
            {highlights.map((item) => <span key={item} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" />{item}</span>)}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, scale: .94, x: 18 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: .9, delay: .12, ease: [0.22,1,0.36,1] }} style={{ rotateX, rotateY, transformPerspective: 1200 }} className="relative mx-auto w-full max-w-lg">
          <div className="absolute inset-[-12%] rounded-[3rem] bg-lime-300/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a1320]/95 p-3 shadow-[0_40px_100px_-35px_rgba(120,217,79,.22)] backdrop-blur-xl">
            <div className="relative min-h-[440px] overflow-hidden rounded-[2rem] bg-[#08111c] p-7 sm:p-9">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-lime-300/10 animate-ring-pulse" />
              <div className="absolute -right-3 top-14 h-40 w-40 rounded-full border border-white/10" />
              <div className="relative flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/35">ADVIBE / WORKFLOW</span><span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_20px_rgba(120,217,79,.8)]" /></div>
              <p className="relative mt-20 text-xs uppercase tracking-[0.28em] text-lime-300/80">Contenido que llama la atención</p>
              <h2 className="relative mt-4 max-w-md text-4xl font-semibold leading-[0.95] tracking-[-0.045em] text-white sm:text-5xl">Publicamos. Medimos. Mejoramos.</h2>
              <div className="relative mt-10 space-y-2">
                {["Contenido", "Publicidad", "Web", "Tecnología"].map((item, index) => (
                  <motion.div key={item} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .45 + index * .08 }} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.035] px-5 py-4">
                    <span className="text-sm font-semibold text-white">{item}</span>
                    <span className="text-xs text-lime-300/60">↗</span>
                  </motion.div>
                ))}
              </div>
              <div className="relative mt-7 flex items-center gap-3 border-t border-white/10 pt-5"><span className="h-px w-10 bg-lime-300/70" /><span className="text-xs text-white/35">Una idea. Una ejecución. Un siguiente paso.</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
