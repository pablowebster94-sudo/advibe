"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";

const stories = [
  {
    client: "Lumen Labs",
    industry: "Fintech",
    result: "Creación de funnel que triplicó leads cualificados.",
  },
  {
    client: "Pulse Studio",
    industry: "Agencia creativa",
    result: "Transformación digital con una identidad premium.",
  },
  {
    client: "Nebula Retail",
    industry: "Retail",
    result: "Estrategia de automatización que redujo costos operativos.",
  },
];

export default function Testimonials() {
  return (
    <section id="casos" className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/5 to-transparent" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Casos de éxito"
          title="Resultados reales para marcas ambiciosas."
          description="Cada proyecto combina estrategia, creatividad y tecnología para generar impacto claro."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {stories.map((story, index) => (
            <motion.article
              key={story.client}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: index * 0.1 }}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_-70px_rgba(0,212,255,0.2)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/20"
            >
              <div className="mb-6 h-44 rounded-[1.75rem] bg-slate-950/80 p-5 shadow-[inset_0_0_80px_rgba(0,212,255,0.08)]">
                <div className="flex h-full items-end justify-between">
                  <span className="rounded-3xl bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyan-200">{story.industry}</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white">{story.client}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">{story.result}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
