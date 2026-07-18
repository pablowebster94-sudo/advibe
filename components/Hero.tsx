"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

const highlights = ["Estrategia premium", "Desarrollo web rápido", "Automatización inteligente"];

export default function Hero() {
  return (
    <section id="home" className="relative isolate overflow-hidden px-6 py-24 sm:py-32 lg:px-8 lg:py-36">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.2),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.16),_transparent_42%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_55%,rgba(0,212,255,0.06))]" />

      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-3xl"
        >
          <p className="mb-6 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 shadow-[0_0_80px_rgba(0,212,255,0.12)]">
            Diseño, desarrollo y crecimiento digital premium
          </p>

          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            Creamos experiencias digitales que elevan marcas y convierten con claridad.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            Ayudamos a empresas ambiciosas a transformar ideas en productos, campañas y sistemas que generan resultados reales y una presencia de alto impacto.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-start">
            <Button href="#contacto" variant="primary">
              Agenda una reunión
            </Button>
            <Button href="#portafolio" variant="secondary">
              Ver proyectos
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-3">
            {highlights.map((item) => (
              <li key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 backdrop-blur">
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute inset-0 -z-10 rounded-[2.2rem] bg-[radial-gradient(circle_at_top_left,_rgba(0,212,255,0.25),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_32%)] blur-3xl" />
          <div className="rounded-[2.2rem] border border-white/10 bg-slate-900/70 p-6 shadow-[0_45px_140px_-70px_rgba(0,212,255,0.35)] backdrop-blur-2xl sm:p-8">
            <div className="rounded-[1.8rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-slate-950 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Growth Studio</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Sistemas que conectan marca, producto y ventas.</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-200">
                  +320%
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Estrategia</p>
                  <p className="mt-2 text-lg font-semibold text-white">Posicionamiento y mensajes claros</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Desarrollo</p>
                  <p className="mt-2 text-lg font-semibold text-white">Plataformas premium y escalables</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Automatización</p>
                  <p className="mt-2 text-lg font-semibold text-white">Flujos inteligentes para crecer</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Medición</p>
                  <p className="mt-2 text-lg font-semibold text-white">Métricas que impulsan decisiones</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
