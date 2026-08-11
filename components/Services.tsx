"use client";

import { motion } from "framer-motion";
import { services } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";

export default function Services() {
  return (
    <section id="servicios" className="relative overflow-hidden py-28 sm:py-32 lg:py-40">
      <div className="pointer-events-none absolute left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-full bg-[#20c9b7]/8 blur-[130px]" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Lo que hacemos" title="Todo lo que tu empresa necesita para crecer, sin adornos innecesarios." description="Contenido, publicidad, web y tecnología. Elegimos las herramientas según el problema real del negocio." />

        <div className="mt-16 grid gap-px overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service, index) => (
            <motion.article key={service.title} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.6, delay: index * 0.045, ease: [0.22, 1, 0.36, 1] }} whileHover={{ y: -6 }} className="group relative min-h-72 overflow-hidden bg-[#090b0b] p-7 transition-colors duration-500 hover:bg-[#101514] sm:p-8">
              <div className={`absolute inset-0 bg-gradient-to-br ${service.accent} opacity-20 transition-opacity duration-500 group-hover:opacity-55`} />
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#20c9b7]/8 blur-3xl transition-transform duration-700 group-hover:scale-150" />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#78dcd1]">{service.icon}</span>
                  <span className="h-2 w-2 rounded-full bg-[#35cdbb] opacity-50 transition duration-500 group-hover:scale-150 group-hover:opacity-100" />
                </div>
                <h3 className="mt-12 max-w-xs text-xl font-semibold tracking-tight text-white sm:text-2xl">{service.title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">{service.description}</p>
                <div className="mt-auto flex items-center gap-2 pt-8 text-xs font-medium uppercase tracking-[0.2em] text-slate-600 transition-colors group-hover:text-[#78dcd1]">Explorar <span>↗</span></div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
