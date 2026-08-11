"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function GoatReveal() {
  return (
    <section
      aria-label="Cierre de AdVibe"
      className="relative min-h-[760px] overflow-hidden bg-[#05070b] text-white sm:min-h-[860px]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_58%,rgba(122,255,45,0.10),transparent_28%),radial-gradient(circle_at_20%_75%,rgba(20,54,62,0.34),transparent_34%),linear-gradient(180deg,#05070b_0%,#07100f_48%,#030505_100%)]" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-[-18rem] top-[8%] h-[42rem] w-[42rem] rounded-full border border-lime-300/10"
      />
      <div className="absolute right-[-9rem] top-[20%] h-[30rem] w-[30rem] rounded-full border border-white/[0.06]" />

      <div className="relative mx-auto flex min-h-[760px] max-w-7xl items-end px-6 pb-20 pt-28 sm:min-h-[860px] sm:px-10 sm:pb-24">
        <div className="relative z-20 max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-xs font-semibold uppercase tracking-[0.42em] text-lime-300/80"
          >
            Creativos por naturaleza
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-xl text-5xl font-semibold leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-8xl"
          >
            Estrategia.
            <br />
            Contenido.
            <br />
            <span className="text-lime-300">Resultados.</span>
          </motion.h2>

          <motion.div
            initial={{ width: 0, opacity: 0 }}
            whileInView={{ width: 170, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.35 }}
            className="mt-8 h-px bg-lime-300"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.42 }}
            className="mt-6 text-sm uppercase tracking-[0.3em] text-white/45"
          >
            AdVibe · Agencia creativa & tecnológica
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 90, scale: 0.92 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.28 }}
          transition={{ duration: 1.35, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-0 right-[-5%] z-10 w-[72%] max-w-[760px] sm:right-[2%] sm:w-[58%] lg:right-[4%] lg:w-[52%]"
        >
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, 0.35, 0, -0.35, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div className="absolute inset-[12%] rounded-full bg-lime-300/10 blur-[90px]" />
            <Image
              src="/images/goat-advibe.webp"
              alt="Cabra AdVibe — Creativos por naturaleza"
              width={1200}
              height={1200}
              priority={false}
              className="relative h-auto w-full object-contain drop-shadow-[0_35px_80px_rgba(0,0,0,0.7)]"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
