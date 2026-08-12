"use client";

import { motion } from "framer-motion";

const pillars = [
  ["01", "Contenido audiovisual", "Ideas que se ven, se sienten y se recuerdan."],
  ["02", "Publicidad digital", "Campañas diseñadas para generar oportunidades."],
  ["03", "Desarrollo web", "Experiencias digitales que convierten visitas en acciones."],
  ["04", "Inteligencia artificial", "Tecnología para crear, automatizar y escalar."],
  ["05", "Cobertura de eventos", "Capturamos los momentos que merecen seguir creciendo."],
];

export default function InteractiveRedesign() {
  return (
    <section id="ecosistema" className="relative overflow-hidden bg-[#050505] py-28 text-white sm:py-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime-300/50 to-transparent" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-lime-300">Lo que hacemos</p>
          <h2 className="mt-5 text-5xl font-semibold leading-[0.92] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Una agencia. Cinco formas de hacer crecer tu marca.</h2>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">Contenido, publicidad, web, inteligencia artificial y cobertura de eventos conectados en una sola experiencia.</p>
        </div>

        <div className="mt-16 divide-y divide-white/10 border-y border-white/10">
          {pillars.map(([number, title, description], index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6, delay: index * 0.04 }}
              className="group grid gap-6 py-8 md:grid-cols-[88px_1fr_auto] md:items-center md:py-10"
            >
              <span className="text-sm font-semibold tracking-[0.25em] text-lime-300/80">{number}</span>
              <div>
                <h3 className="text-3xl font-semibold tracking-[-0.04em] transition-transform duration-300 group-hover:translate-x-2 sm:text-4xl">{title}</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 transition-colors duration-300 group-hover:text-slate-300">{description}</p>
              </div>
              <span className="text-lg text-white/30 transition-all duration-300 group-hover:translate-x-2 group-hover:text-lime-300">↗</span>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
