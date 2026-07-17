"use client";

import Button from "@/components/ui/Button";

const contactItems = [
  {
    label: "WhatsApp",
    value: "+593 98 496 6335",
    href: "https://wa.me/593984966335?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20sus%20servicios.",
  },
  {
    label: "Instagram",
    value: "@advibe.agencia",
    href: "https://instagram.com/advibe.agencia",
  },
  {
    label: "Facebook",
    value: "Advibe Agencia",
    href: "https://www.facebook.com/share/1DT1TqhpjU/",
  },
  {
    label: "Ubicación",
    value: "Gualaceo, Azuay, Ecuador",
    href: "https://maps.google.com/?q=Gualaceo+Azuay+Ecuador",
  },
];

export default function CTA() {
  return (
    <section id="contacto" className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-400/10 to-transparent" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_40px_120px_-90px_rgba(0,212,255,0.28)] backdrop-blur-xl sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300/90">
                Contacto
              </p>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                Hablemos de tu próximo proyecto y llevémoslo a otro nivel.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Estamos listos para acompañarte desde la estrategia hasta la ejecución. Escríbenos por WhatsApp, Instagram, Facebook o visítanos en Gualaceo.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {contactItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/40 hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold text-cyan-300">{item.label}</p>
                    <p className="mt-2 text-sm text-slate-300">{item.value}</p>
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300/90">
                Respuesta rápida
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-white">
                Tu idea merece una respuesta inmediata.
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Te ayudamos a definir el mejor camino para tu marca, negocio o producto digital.
              </p>

              <div className="mt-6 space-y-3">
                <a
                  href="https://wa.me/593984966335?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20sus%20servicios."
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-cyan-400/20"
                >
                  <span>Escribir por WhatsApp</span>
                  <span>→</span>
                </a>
                <a href="https://instagram.com/advibe.agencia" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10">
                  <span>Seguir en Instagram</span>
                  <span>↗</span>
                </a>
              </div>

              <Button href="https://wa.me/593984966335?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20sus%20servicios." variant="primary" className="mt-6 w-full justify-center text-base">
                Solicitar información
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
