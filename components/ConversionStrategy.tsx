"use client";

import { motion } from "framer-motion";
import EventButton from "@/components/EventButton";

const pains = [
  "Tienes atención, pero no suficientes oportunidades.",
  "Publicas, pero no sabes qué está generando negocio.",
  "Recibes mensajes, pero el seguimiento se pierde.",
  "Tu marca no refleja el valor de lo que vendes.",
];

const pillars = [
  {
    title: "CREATIVIDAD",
    text: "Contenido, branding, fotografía y audiovisual para captar atención y construir percepción de valor.",
    items: ["Producción audiovisual", "Branding", "Contenido social"],
  },
  {
    title: "PERFORMANCE",
    text: "Adquisición, landing pages, Meta Ads y medición para convertir atención en oportunidades.",
    items: ["Meta Ads", "Landing pages", "Tracking y optimización"],
  },
  {
    title: "TECNOLOGÍA",
    text: "Web, IA, CRM y automatización para ordenar el seguimiento y hacer más eficiente el proceso comercial.",
    items: ["Web y CRM", "IA y chatbots", "Automatización"],
  },
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
        </div>
      </section>

      <section id="sistema" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">Sistema AdVibe</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-6xl">
                Tres capacidades. Un solo sistema de crecimiento.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-slate-500">
              No necesitas contratar piezas aisladas si el verdadero reto está en conectar adquisición, creatividad y operación comercial.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {pillars.map((pillar, index) => (
              <motion.article
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-8 hover:border-lime-300/30"
              >
                <span className="font-mono text-xs tracking-[0.25em] text-lime-300">0{index + 1}</span>
                <h3 className="mt-5 text-2xl font-bold tracking-tight text-white">{pillar.title}</h3>
                <p className="mt-4 leading-7 text-slate-400">{pillar.text}</p>
                <ul className="mt-7 space-y-3 border-t border-white/10 pt-6">
                  {pillar.items.map((item) => (
                    <li key={item} className="text-sm text-slate-200">→ {item}</li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-lime-300/20 bg-lime-300/[0.05] p-7 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-lime-300">El flujo</p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-white">
              {["Atención", "Interés", "Conversación", "Oportunidad", "Venta"].map((item, index) => (
                <span key={item} className="flex items-center gap-3">
                  <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2">{item}</span>
                  {index < 4 && <span className="text-lime-300">→</span>}
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

      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-8 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">Siguiente paso</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                Antes de ejecutar, descubre qué parte de tu sistema necesita atención.
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-500">
                Analizamos presencia digital, captación, conversión y seguimiento para identificar prioridades concretas.
              </p>
            </div>
            <EventButton
              href="#contacto"
              eventName="request_diagnostic"
              eventParams={{ source: "conversion_strategy", action: "analizar_negocio" }}
              leadOnClick
              className="mt-7 inline-flex shrink-0 items-center justify-center rounded-full bg-lime-300 px-7 py-3 text-sm font-semibold text-slate-950 hover:bg-lime-200 lg:mt-0"
            >
              Analizar mi negocio ↗
            </EventButton>
          </div>
        </div>
      </section>
    </>
  );
}
