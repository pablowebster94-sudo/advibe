"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";

const benefits = [
  {
    title: "Velocidad de ejecución",
    description: "Entregamos soluciones rápidas sin sacrificar calidad ni control.",
    icon: "⚡",
  },
  {
    title: "Estrategia basada en datos",
    description: "Decisiones inteligentes sustentadas en análisis y métricas reales.",
    icon: "📊",
  },
  {
    title: "Diseño premium",
    description: "Experiencias visuales modernas que construyen confianza de marca.",
    icon: "✨",
  },
  {
    title: "Automatización eficiente",
    description: "Reducimos fricción y sumamos productividad con flujos inteligentes.",
    icon: "🤖",
  },
];

export default function Benefits() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-400/10 to-transparent" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Beneficios"
          title="Un enfoque centrado en rendimiento, claridad y crecimiento." 
          description="Más que ideas, entregamos sistemas que convierten audiencias en clientes con precisión y estética." 
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <motion.article
              key={benefit.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: index * 0.1 }}
              className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-7 shadow-[0_25px_80px_-70px_rgba(0,212,255,0.22)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/20"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-400/10 text-2xl text-cyan-200 shadow-[0_0_30px_rgba(0,212,255,0.12)]">
                {benefit.icon}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">{benefit.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">{benefit.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
