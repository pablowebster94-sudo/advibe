"use client";

import { motion } from "framer-motion";
import { portfolio } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";
import EventButton from "@/components/EventButton";

const visuals = [
  { label: "AUTOMOTRIZ", mark: "AM", detail: "Campañas + contenido" },
  { label: "MODA", mark: "NJ", detail: "Web + adquisición" },
  { label: "EDUCACIÓN", mark: "SD", detail: "Marca + comunidad" },
];

export default function Portfolio() {
  return (
    <section id="portafolio" className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/5 to-transparent" />

      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Casos de éxito"
          title="Trabajo real. Estrategias que conectan marca y negocio."
          description="Mostramos el enfoque detrás de cada proyecto. Sin métricas inventadas: cada caso parte de un objetivo comercial y de una combinación concreta de estrategia, creatividad y tecnología."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {portfolio.map((project, index) => {
            const visual = visuals[index % visuals.length];
            return (
              <motion.article
                key={project.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(10,10,10,0.92))] backdrop-blur-xl transition-all duration-500 hover:border-cyan-400/30 hover:shadow-[0_25px_80px_-35px_rgba(0,212,255,0.18)]"
              >
                <div className="relative h-72 overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.18),transparent_30%),linear-gradient(135deg,#101719,#050505)] p-6">
                  <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px]" />
                  <div className="relative flex items-start justify-between">
                    <span className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-200 backdrop-blur">{visual.label}</span>
                    <span className="text-xs font-medium text-white/40">0{index + 1}</span>
                  </div>
                  <div className="relative flex h-full items-center justify-center">
                    <span className="text-8xl font-semibold tracking-[-0.08em] text-white/90 transition duration-500 group-hover:scale-110 group-hover:text-cyan-200">{visual.mark}</span>
                  </div>
                  <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Objetivo</p>
                    <p className="mt-1 text-sm font-medium text-white">{visual.detail}</p>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{project.category}</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{project.title}</h3>
                  <p className="mt-4 leading-7 text-slate-300">{project.highlight}</p>
                  <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                    <span className="text-xs text-slate-500">Estrategia + ejecución</span>
                    <a href="#diagnostico" className="text-sm font-semibold text-white transition hover:text-cyan-300">Quiero algo así →</a>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:flex-row">
          <div>
            <p className="font-semibold text-white">¿Tu empresa necesita un sistema distinto?</p>
            <p className="mt-1 text-sm text-slate-400">Empecemos por identificar la oportunidad antes de hablar de presupuesto.</p>
          </div>
          <EventButton href="#diagnostico" eventName="portfolio_diagnostic_cta" eventParams={{ source: "portfolio" }} className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">Solicitar diagnóstico</EventButton>
        </div>
      </div>
    </section>
  );
}
