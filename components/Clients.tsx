"use client";

import { motion } from "framer-motion";
import { clientGroups } from "@/lib/content";

export default function Clients() {
  return (
    <section id="marcas" className="relative overflow-hidden py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 px-6 py-8 shadow-[0_35px_90px_-70px_rgba(0,212,255,0.25)] backdrop-blur-xl sm:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Marcas que confiaron en AdVibe</p>
              <p className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                Una red de negocios que eligieron una ejecución premium, estratégica y con resultados reales.
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-300">
                Hemos trabajado con negocios de educación, automotriz, construcción, gastronomía, salud, deportes, retail y marca personal en Ecuador y Estados Unidos.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="grid flex-1 gap-4 lg:grid-cols-2"
            >
              {clientGroups.map((group) => (
                <div key={group.sector} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">{group.sector}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {group.clients.map((client) => (
                      <li key={client} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                        <span>{client}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
