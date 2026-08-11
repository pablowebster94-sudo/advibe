"use client";

import { motion } from "framer-motion";
import { portfolio } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";
import EventButton from "@/components/EventButton";

const accents = [
  "from-blue-500/30 via-indigo-500/5 to-transparent",
  "from-violet-500/30 via-fuchsia-500/5 to-transparent",
  "from-cyan-400/25 via-blue-500/5 to-transparent",
];

export default function Portfolio() {
  return (
    <section id="portafolio" className="relative overflow-hidden py-28 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Trabajo real"
          title="Estrategias que conectan marca y negocio."
          description="No mostramos piezas aisladas. Mostramos cómo usamos creatividad, medios y tecnología para resolver problemas concretos de empresas reales."
        />

        <div className="mt-16 space-y-5">
          {portfolio.map((project, index) => (
            <motion.article
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#080c14]"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${accents[index % accents.length]} opacity-70`} />
              <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(91,124,255,0.18),transparent_55%)] lg:block" />

              <div className="relative grid min-h-[330px] lg:grid-cols-[0.85fr_1.15fr]">
                <div className="flex flex-col justify-between border-b border-white/10 p-7 sm:p-10 lg:border-b-0 lg:border-r">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-300">0{index + 1} / {project.category.split("·")[0]}</span>
                    <h3 className="mt-8 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">{project.title}</h3>
                  </div>
                  <p className="mt-10 max-w-md text-sm leading-7 text-slate-400">{project.highlight}</p>
                </div>

                <div className="relative flex flex-col justify-end p-7 sm:p-10">
                  <div className="absolute right-8 top-8 h-32 w-32 rounded-full border border-white/10 opacity-60 transition duration-700 group-hover:scale-125 group-hover:border-blue-300/30" />
                  <div className="absolute right-16 top-16 h-16 w-16 rounded-full bg-blue-400/10 blur-2xl transition duration-700 group-hover:bg-violet-400/20" />
                  <div className="relative max-w-xl">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Enfoque</p>
                    <p className="mt-3 text-2xl font-medium leading-9 text-white sm:text-3xl">Marca + adquisición + experiencia digital.</p>
                    <EventButton href="#diagnostico" eventName="portfolio_case_cta" eventParams={{ source: "portfolio", project: project.title }} className="mt-8 inline-flex items-center rounded-full border border-white/15 bg-white px-6 py-3 text-sm font-semibold text-slate-950 hover:-translate-y-0.5 hover:bg-slate-100">Quiero algo así <span className="ml-2">→</span></EventButton>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
