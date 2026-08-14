"use client";

import { motion } from "framer-motion";
import EventButton from "@/components/EventButton";
import Button from "@/components/ui/Button";

const workflowItems = ["Contenido", "Publicidad", "Web", "Tecnología", "Eventos"];
const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay, ease } }),
};

export default function Hero() {
  return (
    <section id="home" className="relative isolate min-h-[calc(100svh-73px)] overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 -z-20 bg-[#050505]" />
      <video className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" autoPlay loop muted playsInline preload="metadata" aria-hidden="true">
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260517_222138_3e3205be-3364-417b-a64a-bfe087acbec4.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,5,5,.94)_0%,rgba(5,5,5,.76)_43%,rgba(5,5,5,.45)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(5,5,5,.92)_0%,transparent_42%,rgba(5,5,5,.35)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:96px_96px]" />

      <div className="mx-auto flex min-h-[calc(100svh-73px)] max-w-[1500px] flex-col justify-between px-5 pb-7 pt-10 sm:px-8 sm:pb-9 sm:pt-14 lg:px-12 lg:pb-12 lg:pt-16">
        <div className="flex items-start justify-between gap-8">
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0} className="max-w-[250px] text-[10px] font-semibold uppercase tracking-[0.32em] text-white/65 sm:text-xs">Agencia creativa y tecnológica · Ecuador</motion.p>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={0.12} className="hidden text-right text-[10px] font-semibold uppercase tracking-[0.32em] text-white/45 sm:block">Estrategia / Contenido / Tecnología</motion.p>
        </div>

        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div className="max-w-[1100px]">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.18} className="mb-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.34em] text-lime-300 sm:mb-7 sm:text-xs">
              <span className="h-px w-8 bg-lime-300 sm:w-12" />
              Creamos marcas que
            </motion.div>

            <h1 className="text-[clamp(3.7rem,9.2vw,9.2rem)] font-semibold uppercase leading-[0.79] tracking-[-0.075em] text-white">
              {[
                { text: "Destacan.", color: "text-white", delay: 0.32 },
                { text: "Venden.", color: "text-white/90", delay: 0.46 },
                { text: "Crecen.", color: "text-lime-300", delay: 0.60 },
              ].map((word) => (
                <span key={word.text} className={`block overflow-hidden pb-2 ${word.color}`}>
                  <motion.span initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.78, delay: word.delay, ease }} className="block">{word.text}</motion.span>
                </span>
              ))}
            </h1>

            <motion.p initial="hidden" animate="visible" custom={0.78} variants={fadeUp} className="mt-7 max-w-2xl text-sm font-medium leading-6 text-white/70 sm:mt-9 sm:text-base sm:leading-7 lg:text-lg">Contenido audiovisual, Meta Ads, desarrollo web, inteligencia artificial y cobertura de eventos para empresas que quieren ir un paso adelante.</motion.p>

            <motion.div initial="hidden" animate="visible" custom={0.9} variants={fadeUp} className="mt-7 flex flex-col gap-3 sm:flex-row">
              <EventButton href="#diagnostico" eventName="hero_diagnostic_cta" eventParams={{ source: "premium_hero" }} className="group inline-flex items-center justify-center rounded-full bg-lime-400 px-7 py-4 text-sm font-semibold text-[#07101a] shadow-[0_18px_70px_-28px_rgba(120,217,79,.9)] hover:-translate-y-1 hover:bg-lime-300">Solicitar diagnóstico gratuito <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">↗</span></EventButton>
              <Button href="#portafolio" variant="secondary" className="rounded-full border-white/15 bg-white/[0.05] px-7 py-4 text-white hover:border-white/25 hover:bg-white/10">Ver trabajo real</Button>
            </motion.div>
          </div>

          <motion.aside initial={{ opacity: 0, y: 30, x: 20 }} animate={{ opacity: 1, y: 0, x: 0 }} transition={{ duration: 0.9, delay: 0.72, ease }} className="hidden w-[290px] lg:block xl:w-[320px]">
            <div className="border-t border-white/20 pt-5">
              <div className="mb-7 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45">AdVibe / Workflow</span>
                <span className="text-[10px] font-semibold tracking-widest text-lime-300">01—05</span>
              </div>
              <div className="space-y-1">
                {workflowItems.map((item, index) => (
                  <motion.a key={item} href={index === 0 ? "#servicios" : "#portafolio"} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.95 + index * 0.07, ease }} className="group flex items-center justify-between border-b border-white/10 py-3.5 text-sm font-semibold text-white/65 hover:text-white">
                    <span className="flex items-center gap-3"><span className="text-[9px] font-medium text-white/30">0{index + 1}</span>{item}</span>
                    <span className="text-lime-300 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100">↗</span>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.aside>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.15 }} className="mt-8 flex items-end justify-between border-t border-white/10 pt-4 text-[9px] font-semibold uppercase tracking-[0.28em] text-white/40 sm:text-[10px]">
          <span>Contenido / Publicidad / Web / IA / Eventos</span>
          <span className="hidden sm:block">Scroll para descubrir</span>
        </motion.div>
      </div>
    </section>
  );
}
