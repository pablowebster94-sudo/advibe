"use client";

const plans = [
  {
    name: "Básico",
    audience: "Para negocios que necesitan empezar a publicar con constancia",
    price: "$120",
    videos: "5 videos al mes",
    featured: false,
    details: ["Planificación de contenido", "Guion para cada video", "Grabación y edición profesional", "Adaptación a formato vertical", "Publicación en redes sociales"],
  },
  {
    name: "Estándar",
    audience: "Para marcas que buscan crecer y mantener presencia activa",
    price: "$150",
    videos: "6 videos al mes",
    featured: true,
    details: ["Todo lo incluido en Básico", "Mayor volumen de contenido mensual", "Edición optimizada para retención", "Planificación mensual de publicaciones", "Acompañamiento de contenido"],
  },
  {
    name: "Pro",
    audience: "Para negocios que necesitan una producción de contenido más constante",
    price: "$250",
    videos: "8 videos al mes",
    featured: false,
    details: ["Todo lo incluido en Estándar", "Producción ampliada de contenido", "Adaptaciones creativas para campañas", "Planificación estratégica mensual", "Seguimiento y coordinación de publicaciones"],
  },
];

export default function Pricing() {
  return (
    <section id="planes" className="relative overflow-hidden bg-[#05070a] py-24 text-white sm:py-28">
      <div className="pointer-events-none absolute -right-40 top-0 h-[34rem] w-[34rem] rounded-full border border-lime-300/[0.08]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">Planes mensuales</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Tu marca siempre presente. Tu contenido, en movimiento.</h2>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">Producción audiovisual para negocios que quieren comunicar mejor, conectar con su audiencia y crecer.</p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col rounded-[1.75rem] border p-8 transition duration-300 hover:-translate-y-1 sm:p-9 ${plan.featured ? "border-lime-300/50 bg-[#0b171e] shadow-[0_24px_80px_-40px_rgba(120,217,79,.28)]" : "border-white/10 bg-white/[0.03] hover:border-lime-300/30"}`}>
              {plan.featured && <span className="absolute right-6 top-6 rounded-full bg-lime-300 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#07101a]">Más elegido</span>}
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">{plan.name}</p>
              <p className="mt-3 min-h-12 max-w-xs text-sm leading-6 text-slate-400">{plan.audience}</p>
              <div className="mt-8 flex items-end gap-2">
                <span className="text-5xl font-bold tracking-[-0.07em] sm:text-6xl">{plan.price}</span>
                <span className="pb-2 text-sm text-slate-500">/ mes</span>
              </div>
              <div className="mt-8 border-y border-white/10 py-5">
                <p className="text-2xl font-semibold text-white">{plan.videos}</p>
                <p className="mt-1 text-xs text-slate-500">Guion · grabación · edición · publicación</p>
              </div>
              <ul className="mt-6 flex-1 space-y-4">
                {plan.details.map((detail) => (
                  <li key={detail} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="font-bold text-lime-300">✓</span><span>{detail}</span></li>
                ))}
              </ul>
              <a href={`https://wa.me/593984966335?text=${encodeURIComponent("Hola, quiero información del plan " + plan.name + " de AdVibe.")}`} target="_blank" rel="noreferrer" className={`mt-9 inline-flex items-center justify-center rounded-full px-5 py-4 text-sm font-semibold transition hover:-translate-y-0.5 ${plan.featured ? "bg-lime-400 text-[#07101a] hover:bg-lime-300" : "border border-white/15 bg-white/[0.04] text-white hover:border-lime-300/50 hover:text-lime-300"}`}>Me interesa <span className="ml-2">↗</span></a>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center text-xs leading-6 text-slate-500">La gestión de campañas Meta Ads y el presupuesto publicitario se cotizan por separado. El presupuesto de anuncios lo define y paga el cliente. Servicios adicionales disponibles bajo cotización.</p>
      </div>
    </section>
  );
}
