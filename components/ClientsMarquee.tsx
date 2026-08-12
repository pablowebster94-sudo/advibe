"use client";

import { motion } from "framer-motion";

const clients = [
  "Paola Miguitama",
  "Ballerina Academia de Ballet",
  "CETAD San Lucas",
  "Bocabell",
  "AM Motorsport",
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

export default function ClientsMarquee() {
  const row = [...clients, ...clients];
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-[#050505] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lime-300/80">Marcas que han confiado en nosotros</p>
        <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">Experiencia real. Sectores distintos.</h2>
      </div>
      <div className="mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <motion.div className="flex w-max gap-4 px-6" animate={{ x: [0, -1980] }} transition={{ duration: 38, repeat: Infinity, ease: "linear" }}>
          {row.map((client, index) => (
            <div key={`${client}-${index}`} className="flex h-20 min-w-[210px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025] px-6 text-center text-sm font-semibold text-white/55 transition hover:border-lime-300/30 hover:text-white/90">
              {client}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
