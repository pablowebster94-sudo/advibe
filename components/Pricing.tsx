"use client";

const plans = [
  { name: "Básico", audience: "Para marcas que están empezando", price: "$120", videos: "5 videos al mes", featured: false },
  { name: "Estándar", audience: "Para marcas que buscan crecer", price: "$150", videos: "6 videos al mes", featured: true },
  { name: "Pro", audience: "Para empresas que necesitan más contenido", price: "$250", videos: "8 videos al mes", featured: false },
];

export default function Pricing() {
  return (
    <section id="planes" className="relative overflow-hidden bg-[#05070a] py-24 text-white sm:py-28">
      <div className="pointer-events-none absolute -right-40 top-0 h-[34rem] w-[34rem] rounded-full border border-lime-300/[0.08]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">Planes de contenido</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Contenido que mantiene tu marca en movimiento.</h2>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">Paquetes mensuales de producción audiovisual para negocios que quieren comunicar mejor y crecer.</p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col rounded-[1.75rem] border p-8 transition duration-300 hover:-translate-y-1 sm:p-9 ${plan.featured ? "border-lime-300/50 bg-[#0b171e] shadow-[0_24px_80px_-40px_rgba(120,217,79,.28)]" : "border-white/10 bg-white/[0.03] hover:border-lime-300/30"}`}>
              {plan.featured && <span className="absolute right-6 top-6 rounded-full bg-lime-300 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#07101a]">Más elegido</span>}
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">{plan.name}</p>
              <p className="mt-3 min-h-10 text-sm text-slate-400">{plan.audience}</p>
              <div className="mt-8 flex items-end gap-2">
                <span className="text-5xl font-bold tracking-[-0.07em] sm:text-6xl">{plan.price}</span>
                <span className="pb-2 text-sm text-slate-500">/ mes</span>
              </div>
              <div className="mt-8 border-y border-white/10 py-5">
                <p className="text-xl font-semibold text-white">{plan.videos}</p>
              </div>
              <ul className="mt-6 flex-1 space-y-4">
                {["Guion y planificación", "Grabación y edición de video", "Publicación del contenido", "Acompañamiento mensual"].map((detail) => (
                  <li key={detail} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="font-bold text-lime-300">✓</span>{detail}</li>
                ))}
              </ul>
              <a href={`https://wa.me/593984966335?text=${encodeURIComponent("Hola, quiero información del paquete " + plan.name + " de AdVibe.")}`} target="_blank" rel="noreferrer" className={`mt-9 inline-flex items-center justify-center rounded-full px-5 py-4 text-sm font-semibold transition hover:-translate-y-0.5 ${plan.featured ? "bg-lime-400 text-[#07101a] hover:bg-lime-300" : "border border-white/15 bg-white/[0.04] text-white hover:border-lime-300/50 hover:text-lime-300"}`}>Cotizar por WhatsApp <span className="ml-2">↗</span></a>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-6 text-slate-500">Precios mensuales con IVA incluido. La inversión de Meta Ads no está incluida; el presupuesto publicitario lo define el cliente. Servicios adicionales se cotizan por separado.</p>
      </div>
    </section>
  );
}
