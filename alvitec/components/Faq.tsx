"use client";

import { AnimatePresence, m } from "framer-motion";
import { useState } from "react";
import { faqs } from "@/lib/site";
import { WA_DEFAULT, waLink } from "@/lib/whatsapp";
import { Eyebrow } from "./SectionHeading";
import { ArrowUpRight, PlusIcon } from "./icons";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-mist py-20 sm:py-28 lg:py-36">
      <div className="container-site grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Eyebrow index="07">Preguntas frecuentes</Eyebrow>
          <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-5xl">Antes de cotizar.</h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-ink/80">¿No encuentras tu duda? Escríbenos y la resolvemos por WhatsApp.</p>
          <a href={waLink(WA_DEFAULT)} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-8">
            Preguntar por WhatsApp
            <ArrowUpRight width={17} height={17} />
          </a>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border-t border-navy/20 last:border-b">
                <h3 className="font-sans">
                  <button
                    type="button"
                    id={`faq-b-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-p-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left font-display text-lg font-semibold tracking-[-0.01em] text-navy sm:text-xl"
                  >
                    {f.q}
                    <PlusIcon width={22} height={22} className={`shrink-0 text-steel transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <m.div
                      id={`faq-p-${i}`}
                      role="region"
                      aria-labelledby={`faq-b-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-7 pr-10 text-[15px] leading-relaxed text-ink/85">{f.a}</p>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
