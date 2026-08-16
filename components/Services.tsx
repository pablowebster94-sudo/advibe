"use client";

import { motion } from "framer-motion";
import { services } from "@/lib/content";

export default function Services() {
  return (
    <section id="servicios" className="relative overflow-hidden bg-[#f1f2ef] py-24 text-slate-950 sm:py-32 lg:py-40">
      <div className="pointer-events-none absolute right-[-14rem] top-[-12rem] h-[42rem] w-[42rem] rounded-full border border-slate-900/[0.06]" />
      <div className="pointer-events-none absolute right-[-7rem] top-[-5rem] h-[27rem] w-[27rem] rounded-full border border-lime-600/[0.12]" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.32em] text-slate-500">
              <span className="h-px w-8 bg-lime-600" /> 01 / Capacidades
            </p>
            <h2 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.9] tracking-[-0.065em] sm:text-6xl lg:text-8xl">
              Lo que tu marca necesita para avanzar.
            </h2>
          </div>
          <div className="lg:pb-2 lg:pl-10">
            <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              No vendemos una lista de servicios por separado. Combinamos creatividad, performance y tecnología según el problema que necesita resolver tu negocio.
            </p>
            <div className="mt-7 flex items-center gap-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              <span className="text-slate-950">13 capacidades</span>
              <span className="h-px w-10 bg-slate-300" />
              <span>Un solo equipo</span>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-slate-300">
          {services.map((service, index) => (
            <motion.article
              key={service.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, delay: index * 0.025, ease: [0.22, 1, 0.36, 1] }}
              className="group relative border-b border-slate-300"
            >
              <div className="relative grid gap-5 px-1 py-8 transition-all duration-500 sm:py-10 lg:grid-cols-[100px_1.05fr_0.9fr_48px] lg:items-center lg:gap-8 lg:px-5 lg:py-11">
                <div className="absolute inset-0 -z-0 origin-left scale-x-0 bg-[#07100b] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100" />
                <span className="relative z-10 font-mono text-xs font-medium text-slate-400 transition-colors duration-500 group-hover:text-lime-300">
                  {service.icon}
                </span>
                <h3 className="relative z-10 max-w-2xl text-2xl font-semibold tracking-[-0.045em] text-slate-950 transition-colors duration-500 sm:text-3xl lg:text-[2.15rem] lg:leading-none group-hover:text-white">
                  {service.title}
                </h3>
                <p className="relative z-10 max-w-xl text-sm leading-6 text-slate-500 transition-colors duration-500 sm:text-[15px] lg:justify-self-end group-hover:text-white/60">
                  {service.description}
                </p>
                <span className="relative z-10 hidden justify-self-end text-xl text-slate-300 transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-lime-300 sm:block">
                  ↗
                </span>
              </div>
              <div className="absolute bottom-0 left-0 h-px w-0 bg-lime-300 transition-all duration-500 group-hover:w-full" />
            </motion.article>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 pt-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>01—13 / Capacidades AdVibe</span>
          <span>Seleccionamos solo lo que aporta al objetivo.</span>
        </div>
      </div>
    </section>
  );
}
