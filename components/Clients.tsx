"use client";

import { motion } from "framer-motion";
import { clientGroups } from "@/lib/content";

export default function Clients() {
  return (
    <section id="marcas" className="relative overflow-hidden py-28 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-300">Experiencia en negocios reales</p>
            <h2 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">Distintas industrias. El mismo objetivo: crecer.</h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-slate-400">AdVibe ha trabajado con empresas de educación, automotriz, construcción, deportes, salud y gastronomía. Cada sector exige una estrategia distinta; nuestra metodología se adapta al negocio, no al revés.</p>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientGroups.map((group, index) => (
            <motion.article
              key={group.sector}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: index * 0.06 }}
              whileHover={{ y: -5 }}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#080c14] p-7 sm:p-8"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent opacity-50 transition-opacity group-hover:opacity-100" />
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-semibold text-white">{group.sector}</h3>
                <span className="text-xs font-medium tracking-[0.18em] text-slate-600">0{index + 1}</span>
              </div>
              <div className="mt-7 space-y-2">
                {group.clients.map((client) => (
                  <div key={client} className="border-b border-white/6 py-3 text-sm text-slate-400 transition-colors group-hover:text-slate-200">{client}</div>
                ))}
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-8 grid gap-4 rounded-[2.3rem] border border-white/10 bg-gradient-to-r from-blue-500/10 via-violet-500/5 to-transparent p-7 sm:grid-cols-3 sm:p-9">
          <div><p className="text-3xl font-semibold text-white">+50</p><p className="mt-1 text-sm text-slate-500">empresas atendidas</p></div>
          <div><p className="text-3xl font-semibold text-white">Ecuador + EE. UU.</p><p className="mt-1 text-sm text-slate-500">mercados donde hemos trabajado</p></div>
          <div><p className="text-3xl font-semibold text-white">360°</p><p className="mt-1 text-sm text-slate-500">estrategia, creatividad y tecnología</p></div>
        </div>
      </div>
    </section>
  );
}
