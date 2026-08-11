"use client";

import { motion } from "framer-motion";
import { portfolio } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";
import EventButton from "@/components/EventButton";

const accents = ["from-[#35cdbb]/18 via-transparent to-blue-500/10", "from-blue-500/16 via-transparent to-violet-500/10", "from-violet-500/16 via-transparent to-[#35cdbb]/10"];

export default function Portfolio() {
  return (
    <section id="portafolio" className="relative overflow-hidden bg-[#070808] py-28 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Casos y proyectos" title="Trabajo real, explicado con precisión." description="No atribuimos a AdVibe trabajos que no realizamos. Aquí dejamos claro qué hicimos en cada proyecto y dónde estuvo nuestro aporte." />
        <div className="mt-16 space-y-5">
          {portfolio.map((project, index) => (
            <motion.article key={project.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.65, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }} className="group relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#0b0d0d]">
              <div className={`absolute inset-0 bg-gradient-to-br ${accents[index % accents.length]} opacity-80`} />
              <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_65%_40%,rgba(53,205,187,0.10),transparent_58%)]" />
              <div className="relative grid min-h-[340px] lg:grid-cols-[0.72fr_1.28fr]">
                <div className="flex flex-col justify-between border-b border-white/10 p-7 sm:p-10 lg:border-b-0 lg:border-r">
                  <div><span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#78dcd1]">{project.category.split("·")[0]}</span><h3 className="mt-8 text-4xl font-semibold tracking-[-0.055em] text-[#f5f2ea] sm:text-5xl">{project.title}</h3></div>
                  <p className="mt-10 max-w-md text-sm leading-7 text-slate-400">{project.highlight}</p>
                </div>
                <div className="relative flex flex-col justify-between p-7 sm:p-10">
                  <div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[0.28em] text-slate-600">Qué hicimos</span><span className="text-sm text-[#35cdbb]">↗</span></div>
                  <div className="relative max-w-xl py-10">
                    <p className="text-2xl font-medium leading-9 text-white sm:text-3xl">{project.category.split("·")[1]?.trim() ?? "Contenido y publicidad"}</p>
                    <p className="mt-5 max-w-lg text-sm leading-7 text-slate-400">Nuestro aporte estuvo en la ejecución y los activos descritos aquí; no presentamos como propio el trabajo de marca que no realizamos.</p>
                    <EventButton href="#diagnostico" eventName="portfolio_case_cta" eventParams={{ source: "portfolio", project: project.title }} className="mt-8 inline-flex items-center rounded-full bg-[#f5f2ea] px-6 py-3 text-sm font-semibold text-[#080909] hover:-translate-y-0.5">Quiero algo así <span className="ml-2">→</span></EventButton>
                  </div>
                  <div className="flex gap-2"><span className="h-1 w-12 rounded-full bg-[#35cdbb]/80" /><span className="h-1 w-12 rounded-full bg-white/10" /><span className="h-1 w-12 rounded-full bg-white/10" /></div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
