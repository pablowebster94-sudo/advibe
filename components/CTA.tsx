"use client";

import Button from "@/components/ui/Button";

const contactItems = [
  { label: "WhatsApp", value: "+593 98 496 6335", href: "https://wa.me/593984966335" },
  { label: "Instagram", value: "@advibe.agencia", href: "https://instagram.com/advibe.agencia" },
  { label: "Facebook", value: "AdVibe Agencia", href: "https://www.facebook.com/share/1DT1TqhpjU/" },
  { label: "Ubicación", value: "Gualaceo, Azuay, Ecuador", href: "https://maps.google.com/?q=Gualaceo+Azuay+Ecuador" },
];

export default function CTA() {
  return (
    <section id="contacto" className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.10),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.08),transparent_35%)]" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="overflow-hidden rounded-[2.5rem] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(10,10,10,0.94))] p-8 backdrop-blur-xl sm:p-10 lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.30em] text-cyan-300">Siguiente paso</p>
              <h2 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">Tu próxima etapa de crecimiento empieza con un diagnóstico.</h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Cuéntanos qué quieres conseguir. Revisaremos dónde tiene más sentido intervenir antes de proponerte una solución.</p>
              <Button href="#diagnostico" variant="primary" className="mt-8">Solicitar diagnóstico gratuito</Button>
              <p className="mt-4 text-sm text-slate-500">Sin compromiso · Estrategia antes que presupuesto</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {contactItems.map((item) => (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/10">
                  <p className="text-xs uppercase tracking-[0.20em] text-cyan-300">{item.label}</p>
                  <p className="mt-2 text-lg text-white">{item.value}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
