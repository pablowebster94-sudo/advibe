"use client";

import { useState } from "react";

const plans = [
  {
    name: "Inicial",
    audience: "Para marcas que están arrancando",
    monthly: 99,
    featured: false,
    channels: "Facebook, Instagram y TikTok",
    deliverables: ["8 diseños / imágenes al mes", "2 Reels al mes", "4 historias al mes", "Community management ligero (3 veces por semana)", "Estrategia base", "Reporte de métricas mensual"],
    website: "Landing page (sin dominio) desde el mes 3",
  },
  {
    name: "Emprendimientos",
    audience: "Para marcas en crecimiento",
    monthly: 180,
    featured: true,
    channels: "Facebook, Instagram y TikTok",
    deliverables: ["12 diseños / imágenes al mes", "6 Reels al mes", "8 historias al mes", "Community management diario: respuesta a comentarios y mensajes", "Estrategia mensual", "Reporte de métricas mensual"],
    website: "Landing page incluida (sin dominio): advibeagencia.com/tu-marca",
  },
  {
    name: "Estándar",
    audience: "Para marcas consolidadas",
    monthly: 280,
    featured: false,
    channels: "Facebook, Instagram, TikTok + 1 red adicional",
    deliverables: ["16 diseños / imágenes al mes", "8 Reels al mes", "12 historias al mes", "Community completo + engagement en cuentas afines", "Estrategia mensual + reunión", "Reporte de métricas quincenal"],
    website: "Sitio web en advibeagencia.com/tu-marca; desde el mes 3, dominio personalizado por 1 año",
  },
  {
    name: "Full",
    audience: "Para marcas que quieren liderar",
    monthly: 400,
    featured: false,
    channels: "Facebook, Instagram, TikTok, X y YouTube",
    deliverables: ["20 diseños / imágenes al mes", "16 Reels al mes", "16 historias al mes", "Community full + respuesta prioritaria", "1 jornada de producción audiovisual al mes", "Estrategia semanal", "Reporte de métricas semanal"],
    website: "Web personalizada + dominio propio por 1 año",
  },
];

const production = [
  {
    name: "Básico",
    subtitle: "Video ocasional o Reel promocional",
    price: "$70",
    details: ["1 locación", "Hasta aproximadamente 1 minuto", "Grabación en 4K", "Edición básica", "1 ronda de ajustes"],
  },
  {
    name: "Promocional",
    subtitle: "Video turístico o promocional",
    price: "$180",
    featured: true,
    details: ["Varias locaciones", "Guion simple", "Música con licencia", "Edición profesional + color", "2 rondas de ajustes"],
  },
  {
    name: "Producción",
    subtitle: "Videoclip o producción completa",
    price: "$350",
    details: ["Concepto y guion", "Equipo completo", "Edición avanzada + efectos", "Colorización profesional", "Grabación en 4K"],
  },
];

export default function Pricing() {
  const [quarterly, setQuarterly] = useState(false);

  return (
    <section id="planes" className="relative overflow-hidden bg-[#05070a] py-24 text-white sm:py-28">
      <div className="pointer-events-none absolute -right-40 top-0 h-[34rem] w-[34rem] rounded-full border border-lime-300/[0.08]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">Planes de gestión de redes</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Una presencia digital a la altura de tu marca.</h2>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">Producción con equipos profesionales de foto y video: priorizamos calidad e impacto sobre cantidad.</p>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
          <button type="button" onClick={() => setQuarterly(false)} aria-pressed={!quarterly} className={`text-sm font-medium transition ${!quarterly ? "text-white" : "text-slate-500 hover:text-white"}`}>Mensual</button>
          <button type="button" role="switch" aria-checked={quarterly} aria-label="Cambiar a pago trimestral" onClick={() => setQuarterly(!quarterly)} className={`relative h-12 w-24 rounded-sm border border-white/10 bg-slate-800 p-1 transition ${quarterly ? "bg-slate-800" : ""}`}>
            <span className={`block h-10 w-10 bg-lime-400 shadow-lg transition-transform ${quarterly ? "translate-x-12" : "translate-x-0"}`} />
          </button>
          <div className="text-center sm:text-left">
            <button type="button" onClick={() => setQuarterly(true)} aria-pressed={quarterly} className={`text-sm font-medium transition ${quarterly ? "text-white" : "text-slate-500 hover:text-white"}`}>Trimestral</button>
            <p className="mt-1 text-xs font-semibold text-lime-300">Ahorra 15% · permanencia 3 meses</p>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-500">Precios mensuales en USD. No incluyen IVA (15%).</p>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const amount = quarterly ? Math.round(plan.monthly * 0.85) : plan.monthly;
            return (
              <article key={plan.name} className={`relative flex flex-col rounded-[1.75rem] border p-7 transition duration-300 hover:-translate-y-1 sm:p-8 ${plan.featured ? "border-lime-300/50 bg-[#0b171e] shadow-[0_24px_80px_-40px_rgba(120,217,79,.28)]" : "border-white/10 bg-white/[0.03] hover:border-lime-300/30"}`}>
                {plan.featured && <span className="absolute right-5 top-5 rounded-full bg-lime-300 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#07101a]">Más elegido</span>}
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">{plan.name}</p>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{plan.audience}</p>
                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-bold tracking-[-0.07em]">${amount}</span>
                  <span className="pb-2 text-sm text-slate-500">/mes</span>
                </div>
                {quarterly && <p className="mt-2 text-xs text-lime-300">Precio mensual con 15% de descuento</p>}
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
                  <p className="text-xs font-semibold text-lime-300">Incluye sitio web</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{plan.website}</p>
                </div>
                <a href={`https://wa.me/593984966335?text=${encodeURIComponent("Hola, quiero información del plan " + plan.name + " de AdVibe. Modalidad: " + (quarterly ? "trimestral" : "mensual") + ". Precio mensual: $" + amount + " más IVA.")}`} target="_blank" rel="noreferrer" className={`mt-7 inline-flex items-center justify-center rounded-full px-5 py-4 text-sm font-semibold transition hover:-translate-y-0.5 ${plan.featured ? "bg-lime-400 text-[#07101a] hover:bg-lime-300" : "border border-white/15 bg-white/[0.04] text-white hover:border-lime-300/50 hover:text-lime-300"}`}>Me interesa <span className="ml-2">↗</span></a>
              </article>
            );
          })}
        </div>
        <p className="mt-8 text-center text-xs leading-6 text-slate-500">La inversión publicitaria de Meta Ads no está incluida y se paga directamente por el cliente. El descuento trimestral aplica con compromiso de permanencia de 3 meses. No ofrecemos garantías de alcance que dependan de factores externos.</p>

        <div id="produccion-audiovisual" className="mt-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">Producción por proyecto</p>
            <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Videos que dejan huella.</h3>
            <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">Videos turísticos, videoclips y piezas promocionales, grabados en 4K con edición profesional.</p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {production.map((item) => (
              <article key={item.name} className={`flex flex-col rounded-[1.5rem] border p-8 ${item.featured ? "border-lime-300/50 bg-white/[0.06]" : "border-white/10 bg-white/[0.025]"}`}>
                {item.featured && <span className="mb-5 w-fit rounded-sm bg-lime-300 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#07101a]">Popular</span>}
                <h4 className="text-2xl font-semibold text-white">{item.name}</h4>
                <p className="mt-2 text-sm text-slate-400">{item.subtitle}</p>
                <p className="mt-7 text-5xl font-bold tracking-[-0.06em] text-lime-300">{item.price}</p>
                <ul className="mt-7 flex-1 space-y-4">
                  {item.details.map((detail) => <li key={detail} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="font-bold text-lime-300">▪</span>{detail}</li>)}
                </ul>
                <a href={`https://wa.me/593984966335?text=${encodeURIComponent("Hola, quiero cotizar el servicio de video " + item.name + " de AdVibe.")}`} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center justify-center rounded-full bg-lime-400 px-5 py-4 text-sm font-semibold text-[#07101a] transition hover:bg-lime-300">Cotizar <span className="ml-2">↗</span></a>
              </article>
            ))}
          </div>
          <p className="mt-7 text-center text-xs leading-6 text-slate-500">Precios base referenciales. La cotización final depende de duración, locaciones y complejidad. IVA no incluido.</p>
        </div>
      </div>
    </section>
  );
}
