"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";

const steps = [
  { title: "Diagnóstico Estratégico", short: "Entender antes de ejecutar.", description: "Analizamos tu empresa, mercado, competencia y oportunidades con mayor potencial." },
  { title: "Diseño del Sistema", short: "Conectar lo que ya tienes.", description: "Integramos contenido, publicidad, web, automatización e IA alrededor de un mismo objetivo." },
  { title: "Implementación", short: "Convertir estrategia en acción.", description: "Ejecutamos cada punto de contacto con foco en experiencia, claridad y resultados." },
  { title: "Optimización Continua", short: "Medir. Aprender. Mejorar.", description: "Leemos los datos, corregimos lo que no funciona y escalamos lo que sí." },
];

export default function Process() {
  return (
    <section id="proceso" className="relative overflow-hidden border-y border-white/6 py-28 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Nuestra metodología"
          title="Un sistema diseñado para generar resultados sostenibles."
          description="Estrategia, creatividad y tecnología trabajando en el mismo sentido. Sin pasos innecesarios."
        />

        <div className="mt-20 divide-y divide-white/10 border-y border-white/10">
          {steps.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, delay: index * 0.06 }}
              className="group relative grid gap-6 py-9 sm:grid-cols-[110px_1fr_auto] sm:items-center sm:py-11 lg:grid-cols-[140px_1fr_1.1fr_auto]"
            >
              <span className="font-mono text-sm tracking-[0.2em] text-lime-300">0{index + 1}</span>
              <h3 className="text-3xl font-semibold tracking-[-0.045em] text-white transition-transform duration-500 group-hover:translate-x-2 sm:text-4xl lg:text-5xl">{step.title}</h3>
              <div className="max-w-xl">
                <p className="text-sm font-medium text-white">{step.short}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{step.description}</p>
              </div>
              <span className="text-xl text-white/20 transition-all duration-300 group-hover:translate-x-2 group-hover:text-lime-300" aria-hidden="true">↗</span>
              <div className="absolute bottom-0 left-0 h-px w-0 bg-lime-300 transition-all duration-700 group-hover:w-full" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
