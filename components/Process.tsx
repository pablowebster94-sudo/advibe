"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";

const steps = [
  { title: "Descubrimiento", description: "Entendemos tu negocio, audiencia y objetivos." },
  { title: "Estrategia", description: "Definimos el plan creativo, técnico y de automatización." },
  { title: "Implementación", description: "Construimos campañas y experiencias digitales con precisión." },
  { title: "Optimización", description: "Medimos resultados y mejoramos cada interacción." },
];

const lineAnimation = {
  hidden: { scaleY: 0 },
  show: { scaleY: 1 },
};

export default function Process() {
  return (
    <section id="proceso" className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/5 to-transparent" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Nuestro proceso"
          title="Una ruta clara hasta resultados medibles."
          description="Cada paso conecta estrategia, tecnología y creatividad para impulsar crecimiento con seguridad."
        />

        <div className="relative mt-14 grid gap-8 lg:grid-cols-2">
          <div className="absolute left-12 top-20 hidden h-[calc(100%-4rem)] w-px bg-white/10 lg:block" />

          {steps.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              className="relative rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(10,10,10,0.82))] p-8 shadow-[0_30px_90px_-70px_rgba(255,255,255,0.16)] backdrop-blur-xl"
            >
              <div className="relative z-10 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-white/10 bg-white/8 text-xl font-semibold text-white/85 shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-white">{step.title}</h3>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-300">{step.description}</p>
              {index < steps.length - 1 ? (
                <motion.div
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.25 }}
                  variants={lineAnimation}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="absolute left-20 top-full mt-10 h-16 w-px origin-top bg-gradient-to-b from-white/35 to-transparent"
                />
              ) : null}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
