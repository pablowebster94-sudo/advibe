"use client";

import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";

export default function CTA() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-400/10 to-transparent" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/80 p-10 shadow-[0_40px_120px_-90px_rgba(0,212,255,0.28)] backdrop-blur-xl">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300/90">¿Listo para comenzar?</p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Convierte tu próximo proyecto en una ventaja competitiva.
              </h2>
            </div>
            <div className="flex items-center justify-start lg:justify-end">
              <Button href="#agenda" variant="primary" className="text-base">
                Agenda una reunión
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
