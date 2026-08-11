"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import EventButton from "@/components/EventButton";

const highlights = ["Contenido audiovisual", "Meta Ads", "Desarrollo Web", "IA + Automatización"];

const GOAT_IMAGE = "https://raw.githubusercontent.com/pablowebster94-sudo/advibe/main/public/goat-advibe.png";

export default function Hero() {
  return (
    <section id="home" className="relative isolate overflow-hidden bg-[#07101a] px-6 pb-20 pt-14 sm:pb-24 sm:pt-16 lg:px-10 lg:pb-24 lg:pt-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(120,217,79,0.12),transparent_26%),radial-gradient(circle_at_75%_55%,rgba(120,217,79,0.14),transparent_28%),linear-gradient(135deg,#07101a_0%,#0a1723_62%,#0b1a16_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:80px_80px]" />
      <div className="pointer-events-none absolute -right-48 top-1/2 -z-10 h-[44rem] w-[44rem] -translate-y-1/2 rounded-full border border-lime-300/10 animate-ring-pulse" />
      <div className="pointer-events-none absolute -right-20 top-1/2 -z-10 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full border border-lime-300/10" />

      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-4">
        <div className="max-w-4xl">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }} className="mb-5 text-xs font-semibold uppercase tracking-[0.34em] text-lime-300/85">Agencia creativa y tecnológica · Ecuador</motion.p>
          <h1 className="text-[clamp(3.35rem,7.2vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.06em] text-white">
            <motion.span initial={{ opacity: 0, y: 42 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .72, ease: [0.22,1,0.36,1] }} className="block">Creamos marcas que</motion.span>
            <motion.span initial={{ opacity: 0, y: 42 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .72, delay: .08, ease: [0.22,1,0.36,1] }} className="block text-white/55">destacan, venden</motion.span>
            <motion.span initial={{ opacity: 0, y: 42 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .72, delay: .16, ease: [0.22,1,0.36,1] }} className="block text-lime-300">y crecen.</motion.span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .3 }} className="mt-7 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Contenido audiovisual, campañas publicitarias, desarrollo web y tecnología para empresas que quieren verse mejor, llegar a más personas y generar oportunidades.</motion.p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <EventButton href="#diagnostico" eventName="hero_diagnostic_cta" eventParams={{ source: "final_identity_hero" }} className="inline-flex items-center justify-center rounded-full bg-lime-400 px-7 py-4 text-sm font-semibold text-[#07101a] shadow-[0_18px_50px_-24px_rgba(120,217,79,.75)] hover:-translate-y-1 hover:bg-lime-300">Solicitar diagnóstico gratuito <span className="ml-2">↗</span></EventButton>
            <Button href="#portafolio" variant="secondary" className="border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]">Ver trabajo real</Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-400">
            {highlights.map((item) => <span key={item} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" />{item}</span>)}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, scale: .96, x: 24 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: .9, delay: .12, ease: [0.22,1,0.36,1] }} className="relative mx-auto w-full max-w-2xl">
          <div className="absolute inset-[5%] rounded-[3rem] bg-lime-300/12 blur-3xl" />
          <div className="relative flex min-h-[500px] items-end justify-center overflow-hidden rounded-[2.5rem] border border-white/10 bg-transparent">
            <img src={GOAT_IMAGE} alt="Cabra AdVibe" className="relative z-10 h-auto max-h-[680px] w-full object-contain object-bottom drop-shadow-[0_35px_80px_rgba(0,0,0,0.35)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_52%_44%,rgba(163,230,53,0.18),transparent_34%)]" />
            <div className="pointer-events-none absolute right-4 top-10 h-44 w-44 rounded-full border border-lime-300/10 animate-ring-pulse" />
            <div className="pointer-events-none absolute bottom-8 left-10 h-px w-24 bg-lime-300/70" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
