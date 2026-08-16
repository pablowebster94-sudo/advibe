"use client";

import { motion } from "framer-motion";
import { services } from "@/lib/content";

export default function Services() {
  return (
    <section id="servicios" className="relative overflow-hidden bg-[#f1f2ef] py-24 text-slate-950 sm:py-32 lg:py-40">
      <div className="absolute right-[-12rem] top-[-10rem] h-[38rem] w-[38rem] rounded-full border border-slate-900/[0.07]" />
      <div className="absolute right-[-6rem] top-[-4rem] h-[24rem] w-[24rem] rounded-full border border-lime-600/15" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.32em] text-slate-500"><span className="h-px w-8 bg-lime-600" /> 01 / Capacidades</p>
            <h2 className="mt-6 max-w-2xl text-5xl font-semibold leading-[0.9] tracking-[-0.065em] sm:text-6xl lg:text-7xl">Todo lo que tu marca necesita para moverse.</h2>
          </div>
          <p className="max-w-xl justify-self-end text-base leading-7 text-slate-600 sm:text-lg">No vendemos una lista de servicios por separado. Combinamos creatividad, performance y tecnología según el problema que necesita resolver tu negocio.</p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-[2rem] border border-slate-300/80 bg-slate-300/80 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <motion.article key={service.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: .5, delay: index * .025, ease: [0.22,1,0.36,1] }} whileHover={{ backgroundColor: "#0a0d0f", color: "#ffffff" }} className="group relative flex min-h-72 flex-col bg-[#f8f9f7] p-7 transition-colors duration-500 sm:p-8">
              <div className="flex items-start justify-between">
                <span className="font-mono text-[11px] font-medium text-slate-400 transition-colors group-hover:text-lime-300">{service.icon}</span>
                <span className="text-lg text-slate-300 transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-lime-300">↗</span>
              </div>
              <div className="mt-auto pt-16">
                <h3 className="max-w-sm text-2xl font-semibold tracking-[-0.04em] text-slate-950 transition-colors group-hover:text-white">{service.title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-7 text-slate-500 transition-colors group-hover:text-white/60">{service.description}</p>
              </div>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-lime-300 transition-all duration-500 group-hover:w-full" />
            </motion.article>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-300 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>01—13 / Capacidades AdVibe</span>
          <span>Seleccionamos solo lo que aporta al objetivo.</span>
        </div>
      </div>
    </section>
  );
}
