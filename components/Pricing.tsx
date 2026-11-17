"use client";

const plans = [
  {
    name: "Emprende",
    audience: "Para marcas que están arrancando",
    price: "$99",
    featured: false,
    channels: "Facebook, Instagram y TikTok",
    deliverables: ["8 diseños / imágenes al mes", "2 Reels al mes", "4 historias al mes", "Community management ligero (3 veces por semana)", "Estrategia base", "Reporte mensual de métricas"],
    website: "Landing page sin dominio desde el tercer mes",
  },
  {
    name: "Crecimiento",
    audience: "Para emprendimientos en crecimiento",
    price: "$180",
    featured: true,
    channels: "Facebook, Instagram y TikTok",
    deliverables: ["12 diseños / imágenes al mes", "6 Reels al mes", "8 historias al mes", "Community management diario: respuestas a comentarios y mensajes", "Estrategia mensual", "Reporte mensual de métricas"],
    website: "Landing page incluida, sin dominio",
  },
  {
    name: "Estándar",
    audience: "Para marcas consolidadas",
    price: "$280",
    featured: false,
    channels: "Facebook, Instagram, TikTok + 1 red adicional",
    deliverables: ["16 diseños / imágenes al mes", "8 Reels al mes", "12 historias al mes", "Community management completo + engagement en cuentas afines", "Estrategia mensual + reunión", "Reporte quincenal de métricas"],
    website: "Solución web a definir según el proyecto",
  },
  {
    name: "Liderazgo",
    audience: "Para marcas que quieren liderar",
    price: "$400",
    featured: false,
    channels: "Facebook, Instagram, TikTok, X y YouTube",
    deliverables: ["20 diseños / imágenes al mes", "16 Reels al mes", "16 historias al mes", "Community management full + respuesta prioritaria", "1 jornada de producción audiovisual al mes", "Estrategia semanal", "Reporte semanal de métricas"],
    website: "Web personalizada + dominio propio",
  },
];

export default function Pricing() {
  return (
    <section id="planes" className="relative overflow-hidden bg-[#05070a] py-24 text-white sm:py-28">
      <div className="pointer-events-none absolute -right-40 top-0 h-[34rem] w-[34rem] rounded-full border border-lime-300/[0.08]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">Planes de gestión de redes</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Una presencia digital a la altura de tu marca.</h2>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">Contenido, gestión y estrategia en un solo plan. Escoge el nivel de acompañamiento que necesita tu negocio.</p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col rounded-[1.75rem] border p-7 transition duration-300 hover:-translate-y-1 sm:p-8 ${plan.featured ? "border-lime-300/50 bg-[#0b171e] shadow-[0_24px_80px_-40px_rgba(120,217,79,.28)]" : "border-white/10 bg-white/[0.03] hover:border-lime-300/30"}`}>
              {plan.featured && <span className="absolute right-5 top-5 rounded-full bg-lime-300 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#07101a]">Más elegido</span>}
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">{plan.name}</p>
              <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{plan.audience}</p>
              <div className="mt-7 flex items-end gap-2">
                <span className="text-5xl font-bold tracking-[-0.07em]">{plan.price}</span>
                <span className="pb-2 text-sm text-slate-500">/ mes</span>
              </div>
              <div className="mt-7 border-y border-white/10 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Redes incluidas</p>
                <p className="mt-2 text-sm leading-6 text-white">{plan.channels}</p>
              </div>
              <ul className="mt-6 flex-1 space-y-4">
                {plan.deliverables.map((detail) => (
                  <li key={detail} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="font-bold text-lime-300">✓</span><span>{detail}</span></li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl border border-lime-300/15 bg-lime-300/[0.04] p-4">
                <p className="text-xs font-semibold text-lime-300">Presencia web</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">{plan.website}</p>
              </div>
              <a href={`https://wa.me/593984966335?text=${encodeURIComponent("Hola, quiero información del plan " + plan.name + " de AdVibe por " + plan.price + " al mes.")}`} target="_blank" rel="noreferrer" className={`mt-7 inline-flex items-center justify-center rounded-full px-5 py-4 text-sm font-semibold transition hover:-translate-y-0.5 ${plan.featured ? "bg-lime-400 text-[#07101a] hover:bg-lime-300" : "border border-white/15 bg-white/[0.04] text-white hover:border-lime-300/50 hover:text-lime-300"}`}>Me interesa <span className="ml-2">↗</span></a>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center text-xs leading-6 text-slate-500">La inversión publicitaria de Meta Ads no está incluida en estos planes y se paga directamente por el cliente. Los detalles de dominio, alojamiento y alcance del sitio web se confirman en la cotización.</p>
      </div>
    </section>
  );
}
