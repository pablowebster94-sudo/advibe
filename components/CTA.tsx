"use client";

import Button from "@/components/ui/Button";

const contactItems = [
  {
    label: "WhatsApp",
    value: "+593 98 496 6335",
    href: "https://wa.me/593984966335",
  },
  {
    label: "Instagram",
    value: "@advibe.agencia",
    href: "https://instagram.com/advibe.agencia",
  },
  {
    label: "Facebook",
    value: "AdVibe Agencia",
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
    <section
      id="contacto"
      className="relative overflow-hidden py-24 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-6">

        <div className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(10,10,10,0.92))] p-10 backdrop-blur-xl">

          <div className="grid gap-10 lg:grid-cols-2">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.30em] text-cyan-300">
                Diagnóstico Estratégico
              </p>

              <h2 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">
                ¿Quieres hacer crecer tu empresa?
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-300">
                Agenda una conversación con nuestro equipo y descubre cómo una
                estrategia bien diseñada puede ayudarte a atraer más clientes,
                fortalecer tu marca y generar resultados sostenibles.
              </p>

              <Button
                href="https://wa.me/593984966335?text=Hola,%20quiero%20agendar%20un%20diagnóstico%20estratégico."
                variant="primary"
                className="mt-8"
              >
                Agendar diagnóstico
              </Button>

            </div>

            <div className="space-y-4">

              {contactItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/30 hover:bg-white/10"
                >
                  <p className="text-sm uppercase tracking-[0.20em] text-cyan-300">
                    {item.label}
                  </p>

                  <p className="mt-2 text-lg text-white">
                    {item.value}
                  </p>
                </a>
              ))}

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}