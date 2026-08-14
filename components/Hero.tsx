"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import EventButton from "@/components/EventButton";

const videoUrl = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260517_222138_3e3205be-3364-417b-a64a-bfe087acbec4.mp4";

const services = ["Contenido", "Meta Ads", "Web", "IA", "Eventos"];

const reveal = {
  hidden: { opacity: 0, y: "110%" },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.35 + i * 0.13, duration: 0.78, ease: [0.22, 1, 0.36, 1] } }),
};

export default function Hero() {
  return (
    <section id="home" className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-black text-white">
      <motion.video
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        autoPlay muted loop playsInline preload="metadata" aria-hidden="true"
      >
        <source src={videoUrl} type="video/mp4" />
      </motion.video>
      <div className="absolute inset-0 -z-10 bg-black/48" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,.25)_0%,rgba(0,0,0,.12)_38%,rgba(0,0,0,.82)_100%)]" />

      <div className="mx-auto flex min-h-[calc(100svh-72px)] max-w-[1600px] flex-col justify-between px-5 pb-7 pt-10 sm:px-8 sm:pb-9 lg:px-12 lg:pt-14">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease: [0.22,1,0.36,1] }} className="flex items-start justify-between gap-8">
          <p className="max-w-[230px] text-[10px] font-semibold uppercase tracking-[.28em] text-white/70 sm:text-xs">Creative technology studio · Ecuador</p>
          <div className="hidden items-center gap-5 md:flex">
            {services.map((item, i) => <span key={item} className="text-[10px] font-semibold uppercase tracking-[.24em] text-white/65">{item}{i < services.length - 1 ? " ·" : ""}</span>)}
          </div>
        </motion.div>

        <div className="relative mt-auto pt-20">
          <div className="mb-5 flex items-end justify-between gap-5 sm:mb-7">
            <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .45, duration: .65, ease: [0.22,1,0.36,1] }} className="max-w-[150px] text-[10px] font-semibold uppercase leading-[1.45] tracking-[.22em] text-white/65 sm:max-w-[210px] sm:text-xs">Shaping bold visions into power for your tribe.</motion.p>
            <EventButton href="#diagnostico" eventName="hero_diagnostic_cta" eventParams={{ source: "cinematic_hero" }} className="group hidden items-center gap-2 text-sm font-semibold uppercase tracking-[.2em] text-[#b7ff38] sm:flex">Work With Us <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" /></EventButton>
          </div>

          <h1 className="text-right font-semibold uppercase tracking-[-.065em] text-white" style={{ fontSize: "clamp(3.2rem, 10.4vw, 10.5rem)", lineHeight: .82 }}>
            {["Fearless", "Vision", "Delivered"].map((word, index) => (
              <span key={word} className="block overflow-hidden py-[.035em]">
                <motion.span custom={index} variants={reveal} initial="hidden" animate="show" className="block">{word}</motion.span>
              </span>
            ))}
          </h1>

          <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/20 pt-4 sm:mt-8 sm:pt-5">
            <p className="max-w-[220px] text-[9px] font-semibold uppercase leading-[1.55] tracking-[.2em] text-white/65 sm:max-w-sm sm:text-xs">Contenido audiovisual, Meta Ads, desarrollo web, inteligencia artificial y cobertura de eventos para marcas que quieren ir un paso adelante.</p>
            <a href="#servicios" className="group flex shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[.22em] text-white sm:text-xs">Explore <ArrowDownRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-1 group-hover:translate-x-1" /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
