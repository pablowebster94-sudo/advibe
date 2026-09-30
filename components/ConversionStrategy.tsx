"use client";

import { motion } from "framer-motion";

const pains = [
  "Tienes atención, pero no suficientes oportunidades.",
  "Publicas, pero no sabes qué está generando negocio.",
  "Recibes mensajes, pero el seguimiento se pierde.",
  "Tu marca no refleja el valor de lo que vendes.",
];

const verticals = [
  ["Inmobiliarias", "Captación de compradores, proyectos, propiedades y seguimiento de leads desde anuncios hasta WhatsApp."],
  ["Automotriz", "Contenido de vehículos, campañas de adquisición y sistemas de contacto para oportunidades comerciales."],
  ["Salud", "Presencia digital profesional, captación de consultas y seguimiento de prospectos."],
  ["Educación", "Comunicación institucional, campañas de captación y experiencias digitales para familias y estudiantes."],
  ["Retail / Comercio", "Contenido de producto, campañas, catálogo digital y conversaciones orientadas a compra."],
  ["Servicios", "Propuesta de valor clara, generación de demanda y automatización del seguimiento comercial."],
] as const;

export default function ConversionStrategy() {
  return (
    <>
      <section className="border-y border-white/10 bg-[#07101a] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">El problema</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              El problema no siempre es conseguir atención. Es convertirla en negocio.
            </h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2">
            {pains.map((pain, index) => (
              <motion.div key={pain} whileHover={{ y: -2 }} className="bg-[#050a12] p-7 sm:p-9">
                <span className="font-mono text-xs tracking-[0.25em] text-lime-300">0{index + 1}</span>
                <p className="mt-5 max-w-lg text-xl font-medium leading-8 text-slate-200">{pain}</p>
              </motion.div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-400">
            AdVibe conecta contenido, adquisición, conversión y seguimiento para que cada parte de tu presencia digital trabaje hacia el mismo objetivo.
          </p>
          <div className="mt-10 overflow-hidden rounded-[2rem] border border-lime-300/20 bg-lime-300/[0.05] p-7 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-lime-300">El recorrido que ordenamos</p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-white">
              {["Atención", "Interés", "Conversación", "Oportunidad", "Venta"].map((item, index) => (
                <span key={item} className="flex items-center gap-3">
                  <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2">{item}</span>
                  {index < 4 && <span aria-hidden="true" className="text-lime-300">→</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="soluciones" className="border-y border-white/10 bg-[#050a12] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">Soluciones por negocio</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
            El sistema cambia según cómo vende cada negocio.
          </h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {verticals.map(([title, text]) => (
              <article key={title} className="bg-[#07101a] p-7 sm:p-8">
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
