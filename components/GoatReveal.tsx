"use client";

import Image from "next/image";
import { motion } from "framer-motion";


export default function GoatReveal() {
  return (
    <section aria-label="Cierre AdVibe" className="relative overflow-hidden bg-[#050505] py-20 sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_55%,rgba(163,230,53,0.10),transparent_34%)]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="relative min-h-[500px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#07100b] sm:min-h-[560px]">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_15%,rgba(163,230,53,0.035)_55%,transparent_85%)]" />
          <div className="absolute right-[-9rem] top-[-9rem] h-[30rem] w-[30rem] rounded-full border border-lime-300/10" />
          <div className="absolute right-[-4rem] top-[-4rem] h-[21rem] w-[21rem] rounded-full border border-lime-300/10" />
          <div className="relative z-20 max-w-xl px-7 pt-10 sm:px-12 sm:pt-14">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-lime-300">Creativos por naturaleza</p>
            <h2 className="mt-5 text-5xl font-semibold leading-[0.9] tracking-[-0.055em] text-white sm:text-7xl">Resultados.</h2>
            <div className="mt-8 h-px w-40 bg-lime-300" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.32em] text-white/45">ADVIBE · AGENCIA CREATIVA &amp; TECNOLÓGICA</p>
          </div>
          <motion.div initial={{ opacity: 0, y: 120, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} className="absolute bottom-0 right-[-2%] z-10 w-[58%] max-w-[600px] sm:right-[1%] sm:w-[52%]">
            <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
              <Image src="/images/goat-advibe.webp" width={500} height={405} alt="Cabra AdVibe — Creativos por naturaleza" className="block w-full drop-shadow-[0_35px_65px_rgba(0,0,0,0.75)]" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
