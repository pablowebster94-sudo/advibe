"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

const contactItems = [
  { label: "WhatsApp", value: "+593 98 496 6335", href: "https://wa.me/593984966335" },
  { label: "Instagram", value: "@advibe.agencia", href: "https://instagram.com/advibe.agencia" },
  { label: "Facebook", value: "AdVibe Agencia", href: "https://www.facebook.com/share/1DT1TqhpjU/" },
  { label: "Ubicación", value: "Gualaceo, Azuay, Ecuador", href: "https://maps.google.com/?q=Gualaceo+Azuay+Ecuador" },
];

export default function CTA() {
  return (
    <section id="contacto" className="relative overflow-hidden bg-[#075BFF] py-24 text-white sm:py-32 lg:py-40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_80%,rgba(255,255,255,0.12),transparent_30%),linear-gradient(135deg,#075BFF,#4320C8)]" />
      <div className="pointer-events-none absolute -right-44 top-1/2 h-[46rem] w-[46rem] -translate-y-1/2 rounded-full border border-white/15" />
      <div className="pointer-events-none absolute -right-12 top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full border border-white/15 animate-pulse-ring" />
      <div className="pointer-events-none absolute right-20 top-1/2 h-[15rem] w-[15rem] -translate-y-1/2 rounded-full border border-white/15" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.34em] text-white/60">Hablemos de tu proyecto</p>
            <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.88] tracking-[-0.06em] sm:text-7xl lg:text-[6rem]">¿Listo para hacer que tu marca se vea y venda mejor?</motion.h2>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72">Cuéntanos qué necesitas. Revisamos tu situación y te proponemos el siguiente paso con claridad.</p>
            <Button href="https://wa.me/593984966335?text=Hola,%20quiero%20agendar%20un%20diagnóstico%20estratégico." variant="primary" className="mt-9 bg-white text-slate-950 hover:bg-slate-100">Agendar diagnóstico ↗</Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {contactItems.map((item, index) => (
              <motion.a key={item.label} href={item.href} target="_blank" rel="noreferrer" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.07 }} className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/15">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">{item.label}</p>
                <p className="mt-3 text-base font-semibold text-white">{item.value}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
