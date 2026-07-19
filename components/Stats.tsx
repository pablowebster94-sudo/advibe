"use client";

import { motion } from "framer-motion";
import { stats } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";

export default function Stats() {
  return (
    <section id="resultados" className="relative overflow-hidden py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Resultados"
          title="Estrategia, ejecución y crecimiento en una sola agencia."
          description="Cada proyecto combina visión, tecnología y performance para generar resultados medibles y una presencia de alto impacto."
        />

        <div className="mt-12 rounded-[2.2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-[0_35px_90px_-70px_rgba(255,255,255,0.16)] sm:p-10">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6"
              >
                <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{stat.value}</p>
                <p className="mt-3 text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-300 sm:flex sm:items-center sm:justify-between">
            <p>Meta Ads + Desarrollo Web + Automatización IA</p>
            <p className="mt-2 text-cyan-300 sm:mt-0">Estrategia, ejecución y crecimiento en una sola agencia</p>
          </div>
        </div>
      </div>
    </section>
  );
}
