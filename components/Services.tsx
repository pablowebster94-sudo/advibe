"use client";

import { motion } from "framer-motion";
import { services } from "@/lib/content";

export default function Services() {
  return (
    <section id="servicios" className="relative overflow-hidden bg-[#f4f5f7] py-24 text-slate-950 sm:py-32 lg:py-40">
      <div className="absolute right-[-10rem] top-[-8rem] h-[32rem] w-[32rem] rounded-full border border-blue-600/10" />
      <div className="absolute right-[-5rem] top-[-3rem] h-[22rem] w-[22rem] rounded-full border border-blue-600/10 animate-pulse-ring" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-blue-600">Lo que hacemos</p>
            <h2 className="mt-5 max-w-xl text-5xl font-semibold leading-[0.92] tracking-[-0.055em] sm:text-6xl">Servicios que se sienten en el negocio.</h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">No necesitas contratar una lista interminable de servicios. Elegimos las herramientas que realmente necesita tu proyecto: contenido, publicidad, web y tecnología.</p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-[2rem] border border-slate-300 bg-slate-300 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <motion.article key={service.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.55, delay: index * 0.035, ease: [0.22, 1, 0.36, 1] }} whileHover={{ backgroundColor: "#075BFF", color: "#ffffff" }} className="group relative min-h-64 bg-white p-7 transition-colors duration-500 sm:p-8">
              <div className="flex items-start justify-between gap-6">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600 transition-colors group-hover:text-white/60">{service.title.split(" ")[0]}</span>
                <span className="text-xs font-semibold text-slate-300 transition-colors group-hover:text-white/35">↗</span>
              </div>
              <h3 className="mt-14 max-w-sm text-2xl font-semibold tracking-[-0.035em] text-slate-950 transition-colors group-hover:text-white">{service.title}</h3>
              <p className="mt-4 max-w-sm text-sm leading-7 text-slate-500 transition-colors group-hover:text-white/70">{service.description}</p>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-white transition-all duration-500 group-hover:w-full" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
