"use client";

import { motion } from "framer-motion";
import { services } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";

export default function Services() {
  return (
    <section id="servicios" className="relative overflow-hidden py-28 sm:py-32 lg:py-40">
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Sistema de crecimiento"
          title="Una arquitectura de crecimiento, no una lista de servicios."
          description="Conectamos marca, adquisición, contenido, tecnología y automatización para construir una operación digital que tenga sentido para tu negocio."
        />

        <div className="mt-16 grid gap-px overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service, index) => (
            <motion.article
              key={service.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.6, delay: index * 0.045, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="group relative min-h-72 overflow-hidden bg-[#080c14] p-7 transition-colors duration-500 hover:bg-[#0c1220] sm:p-8"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${service.accent} opacity-30 transition-opacity duration-500 group-hover:opacity-70`} />
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />

              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-[0.24em] text-blue-300">{service.icon}</span>
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-400 to-violet-400 opacity-60 transition duration-500 group-hover:scale-150 group-hover:opacity-100" />
                </div>
                <h3 className="mt-12 max-w-xs text-xl font-semibold tracking-tight text-white sm:text-2xl">{service.title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">{service.description}</p>
                <div className="mt-auto pt-8 text-xs font-medium uppercase tracking-[0.2em] text-slate-600 transition-colors group-hover:text-blue-300/80">AdVibe / {String(index + 1).padStart(2, "0")}</div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
