"use client";

import { MouseEvent, useMemo, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Button from "@/components/ui/Button";
import EventButton from "@/components/EventButton";

const highlights = ["Meta Ads", "Producción Audiovisual", "Desarrollo Web", "Inteligencia Artificial"];
const matrixCells = Array.from({ length: 16 });

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 80, damping: 22 });
  const springY = useSpring(y, { stiffness: 80, damping: 22 });
  const rotateX = useTransform(springY, [-1, 1], [4, -4]);
  const rotateY = useTransform(springX, [-1, 1], [-6, 6]);
  const glowStyle = useMemo(
    () => ({ background: `radial-gradient(circle at ${50 + mousePosition.x * 10}% ${50 + mousePosition.y * 10}%, rgba(0,212,255,0.20), transparent 30%)` }),
    [mousePosition]
  );

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
    <section id="home" className="relative isolate overflow-hidden px-6 py-24 sm:py-32 lg:px-8 lg:py-36">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.08),_transparent_42%)]" />
      <div className="absolute inset-0 -z-10 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="max-w-3xl">
          <p className="mb-6 inline-flex items-center rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-white/80">Agencia creativa y tecnológica</p>
          <h1 className="text-5xl font-semibold leading-[0.94] tracking-[-0.05em] text-white sm:text-7xl lg:text-[5.4rem]">
            Creamos marcas que destacan, venden y crecen.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            Estrategia, contenido audiovisual, Meta Ads, desarrollo web, inteligencia artificial y automatización para empresas que quieren ir un paso adelante.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <EventButton href="#diagnostico" eventName="hero_diagnostic_cta" eventParams={{ source: "hero" }} className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white px-7 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-[#f3f3f0]">
              Solicitar diagnóstico gratuito
            </EventButton>
            <Button href="#portafolio" variant="secondary">Ver casos</Button>
          </div>

          <p className="mt-4 text-sm text-slate-500">Sin compromiso · Revisamos oportunidades reales de crecimiento</p>

          <ul className="mt-8 flex flex-wrap gap-3">
            {highlights.map((item) => <li key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">{item}</li>)}
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} onMouseMove={handleMouseMove} onMouseLeave={resetMotion} className="relative">
          <motion.div style={{ ...glowStyle, rotateX, rotateY, transformPerspective: 1200 }} className="absolute inset-0 -z-10 rounded-[2.2rem] blur-3xl" />
          <motion.div style={{ rotateX, rotateY, transformPerspective: 1200 }} className="rounded-[2.2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(12,12,12,0.90))] p-6 backdrop-blur-2xl">
            <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(10,10,10,0.95))] p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">ADVIBE AGENCIA</p>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">Growth system</span>
              </div>
              <h2 className="mt-3 text-3xl font-semibold text-white">Estrategia, creatividad y tecnología para vender más.</h2>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[["Meta Ads", "Campañas enfocadas en resultados"], ["Producción", "Contenido audiovisual premium"], ["Desarrollo Web", "Sitios rápidos y modernos"], ["IA", "Automatización y chatbots"]].map(([title, value]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm text-slate-400">{title}</p><p className="mt-2 text-lg font-semibold text-white">{value}</p></div>
                ))}
              </div>
              <div className="mt-6 grid gap-2 sm:grid-cols-4">{matrixCells.map((_, index) => <div key={index} className="h-3 rounded-full border border-white/10 bg-white/8" />)}</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
