"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";

const projects = [
  {
    title: "Lanzamiento de ecommerce premium",
    category: "Retail tecnológico",
    result: "+40% conversión en 60 días",
  },
  {
    title: "Automatización de ventas B2B",
    category: "SaaS corporativo",
    result: "Reducción de tiempos en 70%",
  },
  {
    title: "Campaña de branding audiovisual",
    category: "Producto de consumo",
    result: "+25% engagement en redes",
  },
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
          {projects.map((project, index) => (
            <motion.article
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: index * 0.1 }}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_40px_80px_-70px_rgba(0,212,255,0.25)] backdrop-blur-xl"
            >
              <div className="relative h-56 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,212,255,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.06),transparent_34%)]" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#050505] to-transparent" />
              </div>
              <div className="space-y-4 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300/90">{project.category}</p>
                <h3 className="text-xl font-semibold text-white">{project.title}</h3>
                <p className="text-sm leading-7 text-slate-300">{project.result}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
