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

function LogoPlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-20 min-w-[190px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 text-center text-sm font-semibold text-white/55 backdrop-blur-sm">
      {name}
    </div>
  );
}

export default function ClientsMarquee() {
  const row = [...clients, ...clients];
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-[#050505] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lime-300/80">Marcas que han confiado en nosotros</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">Experiencia real. Sectores distintos. Una misma exigencia.</h2>
        </div>
      </div>

      <div className="mt-12 overflow-hidden">
        <motion.div
          className="flex w-max gap-4 px-6"
          animate={{ x: [0, -50 * clients.length] }}
          transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
        >
          {row.map((client, index) => <LogoPlaceholder key={`${client}-${index}`} name={client} />)}
        </motion.div>
      </div>
    </section>
  );
}
