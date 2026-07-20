"use client";

import { motion } from "framer-motion";
import { portfolio } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";

const visuals = [
  "from-cyan-500/20 via-slate-900 to-slate-950",
  "from-blue-500/20 via-slate-900 to-slate-950",
  "from-slate-700/20 via-slate-900 to-slate-950",
];

export default function Portfolio() {
  return (
    <section
      id="portafolio"
      className="relative overflow-hidden py-24 sm:py-28 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/5 to-transparent" />

      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Casos de Éxito"
          title="Empresas que confiaron en una estrategia para crecer."
          description="Cada proyecto representa una oportunidad para generar resultados reales. Nuestro trabajo combina estrategia, creatividad y tecnología para ayudar a empresas de diferentes sectores a fortalecer su marca y atraer más clientes."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {portfolio.map((project, index) => (
            <motion.article
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.55,
                delay: index * 0.1,
              }}
              whileHover={{
                y: -8,
                scale: 1.01,
              }}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(10,10,10,0.92))] backdrop-blur-xl transition-all duration-500 hover:border-cyan-400/30 hover:shadow-[0_25px_80px_-35px_rgba(0,212,255,0.18)]"
            >
              <div
                className={`relative h-72 overflow-hidden bg-gradient-to-br ${
                  visuals[index % visuals.length]
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),transparent_35%)]" />

                <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white backdrop-blur">
                  {project.category}
                </div>

                <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/10 bg-black/50 p-5 backdrop-blur">
                  <p className="text-sm text-slate-300">
                    {project.highlight}
                  </p>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-semibold text-white">
                  {project.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-300">
                  Diseñamos una estrategia personalizada para mejorar la presencia
                  digital, fortalecer la marca y generar oportunidades reales de
                  crecimiento.
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}