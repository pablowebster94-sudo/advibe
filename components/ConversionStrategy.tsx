"use client";

import { motion } from "framer-motion";

const pains = [
  "Tu negocio depende de redes sociales y no tienes un sitio propio que explique bien lo que ofreces.",
  "Inviertes en publicidad, pero envías a las personas a una página lenta o a un chat sin contexto.",
  "Recibes consultas, pero no tienes un proceso claro para responder, dar seguimiento y cerrar.",
  "No sabes qué campaña, página o canal está generando las oportunidades más valiosas.",
];

export default function ConversionStrategy() {
  return (
    <section className="border-y border-white/10 bg-[#07101a] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">El problema no es solo conseguir visitas</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Cada oportunidad necesita un camino para convertirse en cliente.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">Una web aislada no resuelve todo. La estrategia conecta tu propuesta, el tráfico, la conversión y el seguimiento comercial.</p>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2">
          {pains.map((pain, index) => (
            <motion.div key={pain} whileHover={{ y: -2 }} className="bg-[#050a12] p-7 sm:p-9">
              <span className="font-mono text-xs tracking-[0.25em] text-lime-300">0{index + 1}</span>
              <p className="mt-5 max-w-lg text-lg font-medium leading-8 text-slate-200 sm:text-xl">{pain}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
