"use client";

import { motion } from "framer-motion";
import { clientGroups } from "@/lib/content";

export default function Clients() {
  return (
    <section id="marcas" className="relative overflow-hidden border-t border-white/6 py-28 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lime-300">Experiencia en negocios reales</p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[0.95] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">Distintas industrias. El mismo objetivo: crecer.</h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">AdVibe ha trabajado con empresas de educación, automotriz, construcción, deportes, salud y gastronomía. La estrategia cambia con el negocio; el objetivo permanece.</p>
        </div>

        <div className="mt-20 border-y border-white/10">
          {clientGroups.map((group, index) => (
            <motion.article
              key={group.sector}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group relative grid gap-5 border-b border-white/10 py-8 last:border-b-0 sm:grid-cols-[150px_1fr_auto] sm:items-center sm:py-10"
            >
              <span className="font-mono text-xs tracking-[0.22em] text-slate-600">0{index + 1}</span>
              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.035em] text-white transition-transform duration-500 group-hover:translate-x-2 sm:text-3xl">{group.sector}</h3>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
                  {group.clients.map((client) => <span key={client}>{client}</span>)}
                </div>
              </div>
              <span className="text-lg text-white/20 transition-all duration-300 group-hover:translate-x-2 group-hover:text-lime-300" aria-hidden="true">↗</span>
              <div className="absolute bottom-0 left-0 h-px w-0 bg-lime-300 transition-all duration-700 group-hover:w-full" />
            </motion.article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4 text-xs uppercase tracking-[0.2em] text-slate-600">
          <span><strong className="mr-2 text-white">+50</strong> empresas atendidas</span>
          <span><strong className="mr-2 text-white">Ecuador + EE. UU.</strong> mercados</span>
          <span><strong className="mr-2 text-white">360°</strong> estrategia + creatividad + tecnología</span>
        </div>
      </div>
    </section>
  );
}
