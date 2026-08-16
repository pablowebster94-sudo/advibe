"use client";

import { motion } from "framer-motion";
import { stats } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";

export default function Stats() {
  return (
    <section id="resultados" className="relative overflow-hidden py-28 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Experiencia real"
          title="No hacemos marketing por hacer marketing."
          description="Construimos sistemas que ayudan a empresas reales a comunicar mejor, vender y crecer."
        />

        <div className="mt-20 grid border-y border-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="group relative border-b border-white/10 px-6 py-10 sm:border-r sm:px-8 lg:border-b-0 lg:last:border-r-0 lg:py-14"
            >
              <span className="font-mono text-[10px] tracking-[0.25em] text-slate-600">0{index + 1}</span>
              <p className="mt-8 text-5xl font-semibold tracking-[-0.06em] text-white transition-colors group-hover:text-lime-300 sm:text-6xl">{stat.value}</p>
              <p className="mt-3 max-w-[16rem] text-sm leading-6 text-slate-500">{stat.label}</p>
              <div className="absolute bottom-0 left-6 h-px w-0 bg-lime-300 transition-all duration-500 group-hover:w-[calc(100%-3rem)]" />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 border-b border-white/10 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
          <p className="max-w-3xl text-2xl font-medium leading-tight tracking-[-0.03em] text-white sm:text-3xl">
            Estrategia + creatividad + tecnología. <span className="text-slate-500">Un mismo sistema para hacer que el negocio avance.</span>
          </p>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-lime-300">AdVibe / Growth systems</span>
        </div>
      </div>
    </section>
  );
}
