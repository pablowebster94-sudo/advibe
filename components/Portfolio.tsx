"use client";

import { motion } from "framer-motion";
import { portfolio } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";

const visuals = [
  "from-cyan-500/20 via-slate-900 to-slate-950",
  "from-fuchsia-500/20 via-slate-900 to-slate-950",
  "from-violet-500/20 via-slate-900 to-slate-950",
];

export default function Portfolio() {
  return (
    <section id="portafolio" className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-400/10 to-transparent" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Portafolio"
          title="Trabajos diseñados para sorprender y convertir."
          description="Proyectos con dirección premium, experiencia de usuario impecable y resultados tangibles."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {portfolio.map((project, index) => (
            <motion.article
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.01 }}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_40px_80px_-70px_rgba(0,212,255,0.25)] backdrop-blur-xl"
            >
              <div className={`relative h-64 overflow-hidden bg-gradient-to-br ${visuals[index % visuals.length]}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,212,255,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.06),transparent_34%)]" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050505] to-transparent" />
                <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200 backdrop-blur">
                  {project.category}
                </div>
                <div className="absolute bottom-6 left-6 right-6 rounded-[1.25rem] border border-white/10 bg-slate-950/70 p-4 backdrop-blur">
                  <p className="text-sm font-medium text-slate-300">{project.highlight}</p>
                </div>
              </div>
              <div className="space-y-4 p-6">
                <h3 className="text-xl font-semibold text-white">{project.title}</h3>
                <p className="text-sm leading-7 text-slate-300">
                  Una ejecución estratégica que combina marca, experiencia y performance.
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
