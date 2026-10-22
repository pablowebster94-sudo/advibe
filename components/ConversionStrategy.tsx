"use client";

import { motion } from "framer-motion";

const pains = [
  "Publicas en redes, pero casi nadie escribe para comprar.",
  "Pagas anuncios y no sabes si de verdad te traen clientes.",
  "Recibes mensajes, pero el seguimiento se pierde.",
  "Tus fotos y videos no muestran lo bueno que es tu producto.",
];

export default function ConversionStrategy() {
  return (
    <section className="border-y border-white/10 bg-[#07101a] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">¿Te pasa esto?</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Conseguir atención no basta. Hay que convertirla en clientes.
          </h2>
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
