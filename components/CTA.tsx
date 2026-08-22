"use client";

import { motion } from "framer-motion";
import EventButton from "@/components/EventButton";
import { trackEvent, trackLead, trackWhatsAppOpen } from "@/lib/tracking";

const contactItems = [
  { label: "WhatsApp", value: "+593 98 496 6335", href: "https://wa.me/593984966335" },
  { label: "Instagram", value: "@advibe.agencia", href: "https://instagram.com/advibe.agencia" },
  { label: "Facebook", value: "AdVibe Agencia", href: "https://www.facebook.com/share/1DT1TqhpjU/" },
  { label: "Ubicación", value: "Gualaceo, Azuay, Ecuador", href: "https://maps.google.com/?q=Gualaceo+Azuay+Ecuador" },
];

export default function CTA() {
  return (
    <section id="contacto" className="relative overflow-hidden border-t border-white/10 bg-[#050505] py-28 text-white sm:py-36 lg:py-44">
      <div className="pointer-events-none absolute -right-64 top-1/2 h-[52rem] w-[52rem] -translate-y-1/2 rounded-full border border-lime-300/[0.08]" />
      <div className="pointer-events-none absolute -right-16 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full border border-white/[0.06]" />
      <div className="pointer-events-none absolute right-24 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-lime-300/[0.035] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.34em] text-lime-300">Hablemos de tu proyecto</p>
            <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.88] tracking-[-0.065em] sm:text-7xl lg:text-[6.2rem]">
              ¿Listo para hacer que tu marca <span className="text-lime-300">se vea y venda mejor?</span>
            </motion.h2>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-500">Cuéntanos qué necesitas. Revisamos tu situación y te proponemos el siguiente paso con claridad.</p>
            <EventButton
              href="https://wa.me/593984966335?text=Hola,%20quiero%20agendar%20un%20diagnóstico%20estratégico."
              eventName="final_cta_whatsapp_click"
              eventParams={{ source: "final_cta" }}
              leadOnClick
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white px-7 py-3 text-sm font-semibold text-slate-950 transition duration-300 ease-out transform-gpu hover:-translate-y-0.5 hover:bg-[#f3f3f0] hover:shadow-[0_16px_60px_-30px_rgba(255,255,255,0.45)] mt-9 bg-lime-300 text-slate-950 hover:bg-lime-200"
            >
              Agendar diagnóstico ↗
            </EventButton>
          </div>

          <div className="border-t border-white/10 lg:border-t-0 lg:border-l lg:pl-10">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600">AdVibe / Contacto</p>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {contactItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={item.label === "WhatsApp" ? () => {
                    trackWhatsAppOpen("cta_contact_list");
                    trackEvent("contact_whatsapp_click", { source: "cta_contact_list" });
                    trackLead({ source: "cta_contact_list", cta: "contact_whatsapp_click" });
                  } : undefined}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="group flex items-center justify-between gap-5 py-5"
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-600">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-white transition-colors group-hover:text-lime-300">{item.value}</p>
                  </div>
                  <span className="text-white/20 transition-all group-hover:translate-x-1 group-hover:text-lime-300" aria-hidden="true">↗</span>
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
