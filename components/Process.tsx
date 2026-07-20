"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";

const steps = [
  {
    title: "Diagnóstico Estratégico",
    description:
      "Analizamos tu empresa, tu mercado, tu competencia y detectamos las oportunidades con mayor potencial de crecimiento.",
  },
  {
    title: "Diseño del Sistema",
    description:
      "Creamos una estrategia donde contenido, Meta Ads, desarrollo web, automatización e inteligencia artificial trabajan de forma integrada.",
  },
  {
    title: "Implementación",
    description:
      "Ejecutamos cada acción con un enfoque en resultados, optimizando cada punto de contacto entre tu empresa y tus clientes.",
  },
  {
    title: "Optimización Continua",
    description:
      "Medimos el rendimiento, analizamos los datos y mejoramos continuamente para escalar el crecimiento de tu negocio.",
  },
];

export default function Process() {
  return (
    <section
      id="proceso"
      className="relative overflow-hidden py-24 sm:py-28 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/5 to-transparent" />

      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Nuestra Metodología"
          title="Un sistema diseñado para generar resultados sostenibles."
          description="Cada proyecto sigue un proceso claro que combina estrategia, creatividad y tecnología para convertir objetivos en resultados medibles."
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.08,
              }}
              whileHover={{
                y: -8,
              }}
              className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(10,10,10,0.92))] p-8 backdrop-blur-xl transition-all duration-500 hover:border-cyan-400/30 hover:shadow-[0_25px_80px_-35px_rgba(0,212,255,0.18)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-xl font-bold text-white">
                0{index + 1}
              </div>

              <h3 className="mt-6 text-2xl font-semibold text-white">
                {step.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-300">
                {step.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}