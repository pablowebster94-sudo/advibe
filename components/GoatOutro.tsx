"use client";

import { motion } from "framer-motion";

export default function GoatOutro() {
  return (
    <section aria-label="Cierre de AdVibe" className="relative overflow-hidden bg-[#050606] px-6 py-32 sm:py-44">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(53,205,187,0.09),transparent_38%)]" />
      <div className="relative mx-auto max-w-6xl text-center">
        <motion.div initial={{ opacity: 0, scale: 0.82, y: 40 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="mx-auto w-48 sm:w-64">
          <motion.svg viewBox="0 0 300 330" role="img" aria-label="Cabra estilizada de AdVibe" className="h-auto w-full drop-shadow-[0_25px_60px_rgba(53,205,187,0.16)]" animate={{ y: [0, -5, 0], rotate: [0, 0.8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
            <defs><linearGradient id="goatGlow" x1="0" x2="1"><stop offset="0" stopColor="#35cdbb"/><stop offset="1" stopColor="#f5f2ea"/></linearGradient></defs>
            <path d="M75 100C42 55 54 18 82 12c8 31 25 49 48 59M225 100c33-45 21-82-7-88-8 31-25 49-48 59" fill="none" stroke="url(#goatGlow)" strokeWidth="12" strokeLinecap="round"/>
            <path d="M82 92c20-28 116-28 136 0 15 21 14 76-4 105-15 24-34 39-64 39s-49-15-64-39c-18-29-19-84-4-105Z" fill="#e8e5dc" stroke="#111312" strokeWidth="8"/>
            <path d="M108 174c12 9 23 14 42 14s30-5 42-14M118 143c7-6 17-6 24 0M158 143c7-6 17-6 24 0" fill="none" stroke="#111312" strokeWidth="7" strokeLinecap="round"/>
            <circle cx="130" cy="133" r="7" fill="#111312"/><circle cx="170" cy="133" r="7" fill="#111312"/>
            <path d="M123 205c11 18 43 18 54 0" fill="none" stroke="#111312" strokeWidth="7" strokeLinecap="round"/>
            <path d="M95 218c-8 35-5 69 14 94M205 218c8 35 5 69-14 94" fill="none" stroke="#e8e5dc" strokeWidth="28" strokeLinecap="round"/>
            <path d="M100 257h100" stroke="#35cdbb" strokeWidth="4" opacity=".65"/>
          </motion.svg>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.45, duration: 0.7 }} className="mt-10 text-[11px] font-semibold uppercase tracking-[0.38em] text-[#78dcd1]">Creativos por naturaleza</motion.p>
        <motion.h2 initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.55, duration: 0.75 }} className="mt-5 text-4xl font-semibold tracking-[-0.055em] text-[#f5f2ea] sm:text-6xl">Estrategia. Contenido. Resultados.</motion.h2>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-slate-500">AdVibe — Agencia Creativa & Tecnológica.</p>
      </div>
    </section>
  );
}
