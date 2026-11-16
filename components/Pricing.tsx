"use client";

const plans = [
  {
    name: "Básico",
    audience: "Para negocios que quieren constancia",
    price: "$120",
    videos: "5 videos al mes",
    details: ["Guion y planificación", "Grabación y edición", "Publicación de contenido", "Revisión mensual"],
    featured: false,
  },
  {
    name: "Estándar",
    audience: "Para marcas que buscan crecer",
    price: "$150",
    videos: "6 videos al mes",
    details: ["Todo lo del plan Básico", "Planificación estratégica", "Optimización del contenido", "Seguimiento mensual"],
    featured: true,
  },
  {
    name: "Pro",
    audience: "Para empresas que quieren acelerar",
    price: "$250",
    videos: "8 videos al mes",
    details: ["Todo lo del plan Estándar", "Mayor volumen de producción", "Planificación de campañas", "Acompañamiento prioritario"],
    featured: false,
  },
];

export default function Pricing() {
  return (
    <section id="planes" className="relative overflow-hidden bg-[#f3f5f2] py-24 text-[#101820] sm:py-32">
      <div className="pointer-events-none absolute -right-40 top-0 h-[34rem] w-[34rem] rounded-full border border-[#78d94f]/20" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-[#438d2a]">Planes de contenido</p>
          <h2 className="mt-5 text-4xl font-semibold leading-[0.94] tracking-[-0.065em] sm:text-6xl">
            El impulso creativo que tu marca necesita.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#59636a] sm:text-lg">
            Producción audiovisual y contenido estratégico para mantener tu negocio presente y convertir atención en oportunidades.
          </p>
        </div>

        <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col border p-7 sm:p-9 ${plan.featured ? "border-[#78d94f] bg-[#07101a] text-white shadow-[0_24px_70px_-35px_rgba(7,16,26,.55)] lg:-translate-y-3" : "border-black/10 bg-white text-[#101820]"}`}>
              {plan.featured && <span className="absolute right-6 top-6 bg-[#78d94f] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#07101a]">Más elegido</span>}
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${plan.featured ? "text-[#a4ef84]" : "text-[#438d2a]"}`}>{plan.name}</p>
              <p className={`mt-3 min-h-12 text-sm ${plan.featured ? "text-slate-400" : "text-slate-500"}`}>{plan.audience}</p>
              <div className="mt-8 flex items-end gap-2">
                <span className="text-5xl font-bold tracking-[-0.07em] sm:text-6xl">{plan.price}</span>
                <span className={`pb-2 text-sm ${plan.featured ? "text-slate-400" : "text-slate-500"}`}>/ mes</span>
              </div>
              <p className={`mt-8 border-y py-5 text-lg font-semibold ${plan.featured ? "border-white/10" : "border-black/10"}`}>{plan.videos}</p>
              <ul className="mt-6 flex-1 space-y-4">
                {plan.details.map((detail) => <li key={detail} className={`flex gap-3 text-sm leading-6 ${plan.featured ? "text-slate-300" : "text-slate-600"}`}><span className="font-bold text-[#58ad35]">✓</span>{detail}</li>)}
              </ul>
              <a href={`https://wa.me/593984966335?text=${encodeURIComponent("Hola, quiero información del plan " + plan.name + " de AdVibe.")}`} target="_blank" rel="noreferrer" className={`mt-9 inline-flex items-center justify-center px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] transition hover:-translate-y-0.5 ${plan.featured ? "bg-[#78d94f] text-[#07101a] hover:bg-[#a4ef84]" : "bg-[#07101a] text-white hover:bg-[#172b3b]"}`}>Me interesa <span className="ml-3">↗</span></a>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-xs leading-6 text-[#737d82]">Precios mensuales de referencia. Meta Ads se cotiza por separado y el presupuesto publicitario lo define el cliente. Valores sujetos al alcance y necesidades de cada proyecto.</p>
        <div className="mt-12 flex flex-col gap-3 border-t border-black/10 pt-7 text-sm text-[#59636a] sm:flex-row sm:items-center sm:justify-between">
          <span>¿Necesitas una web, campañas o automatizaciones?</span>
          <a href="https://wa.me/593984966335?text=Hola%2C%20quiero%20una%20propuesta%20personalizada%20de%20AdVibe." target="_blank" rel="noreferrer" className="font-bold text-[#438d2a] hover:text-[#245c19]">Solicita una propuesta personalizada ↗</a>
        </div>
      </div>
    </section>
  );
}
