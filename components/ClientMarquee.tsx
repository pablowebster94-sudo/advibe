"use client";

import { motion } from "framer-motion";

const clients = [
  "Paola Miguitama",
  "Ballerina Academia de Ballet",
  "CETAD San Lucas",
  "BocaBell",
  "AM Motorsports",
  "GastroFest",
  "United Kingdom English Academy",
  "GBL Handyman Solutions",
  "Mediodent",
  "Chiquititos",
  "Celebraciones y Detalles",
  "Verónica López Arquitectura + Interiores",
  "Taquería El Sabor",
  "Borincuba",
  "Somos Liga Chorde",
  "Cardagal",
  "Nostrum",
];

export default function ClientMarquee() {
  const row = [...clients, ...clients];
  return (
    <section id="clientes" className="overflow-hidden border-y border-white/10 bg-[#080808] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-lime-300">Marcas que han confiado en AdVibe</p>
        <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">Experiencia real. Sectores distintos. Una misma exigencia.</h2>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#080808] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#080808] to-transparent" />
        <motion.div className="flex w-max gap-4" animate={{ x: [0, -2400] }} transition={{ duration: 42, ease: "linear", repeat: Infinity }}>
          {row.map((client, index) => (
            <div key={`${client}-${index}`} className="flex h-20 min-w-56 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 text-center text-sm font-semibold text-white/60 transition hover:border-lime-300/30 hover:bg-lime-300/[0.05] hover:text-white">
              {client}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
