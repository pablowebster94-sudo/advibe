"use client";

import { motion } from "framer-motion";
import { logos } from "@/lib/content";

export default function Clients() {
  return (
    <section className="relative overflow-hidden py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 px-6 py-8 shadow-[0_35px_90px_-70px_rgba(0,212,255,0.25)] backdrop-blur-xl sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Clientes y marcas</p>
              <p className="mt-3 text-lg text-slate-300">
                Trabajamos con equipos que buscan una presencia más fuerte, más clara y más rentable.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="grid flex-1 gap-3 sm:grid-cols-3"
            >
              {logos.map((logo) => (
                <div
                  key={logo.name}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white">{logo.name}</p>
                  <p className="mt-2 text-xs text-slate-400">{logo.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
