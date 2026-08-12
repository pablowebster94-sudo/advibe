"use client";

import { motion } from "framer-motion";

export default function ClosingGoat() {
  return (
    <section className="relative overflow-hidden bg-[#050505] px-6 pb-0 pt-28 text-white sm:pt-36">
      <div className="mx-auto grid max-w-7xl items-end gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="pb-12 lg:pb-24">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-lime-300">El siguiente paso empieza aquí</p>
          <h2 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.9] tracking-[-0.06em] sm:text-6xl lg:text-7xl">Tu marca no necesita más ruido. Necesita una mejor dirección.</h2>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">Hablemos de lo que quieres construir y encontremos la combinación correcta de creatividad, publicidad y tecnología.</p>
          <a href="#diagnostico" className="mt-9 inline-flex rounded-full bg-lime-400 px-7 py-4 text-sm font-semibold text-[#07101a] transition hover:-translate-y-1 hover:bg-lime-300">Hablemos ↗</a>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 90, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[620px]"
        >
          <div className="absolute bottom-10 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-lime-300/10 blur-3xl" />
          <img src="/goat-advibe.png" alt="Mascota de AdVibe" className="relative z-10 mx-auto block w-full object-contain drop-shadow-[0_30px_80px_rgba(0,0,0,0.6)]" />
        </motion.div>
      </div>
    </section>
  );
}
