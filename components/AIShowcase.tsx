"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import EventButton from "@/components/EventButton";

const demos = [
  {
    id: "ads",
    label: "Meta Ads + IA",
    icon: "🎯",
    description: "Automatización de análisis, segmentación y optimización para campañas de adquisición.",
    before: "Datos dispersos · Optimización manual · Decisiones reactivas",
    after: "Señales centralizadas · Priorización automática · Optimización continua",
    insight: "La IA puede identificar patrones en rendimiento, audiencias y creativos para ayudar al equipo a reasignar atención y presupuesto con mayor velocidad.",
    metric: "IA",
    metricLabel: "para detectar oportunidades",
  },
  {
    id: "content",
    label: "Contenido Automático",
    icon: "✍️",
    description: "Sistemas que ayudan a producir, adaptar y organizar contenido según objetivos y canales.",
    before: "Producción manual · Calendarios rígidos · Poco aprendizaje",
    after: "Flujos asistidos por IA · Variantes por canal · Iteración continua",
    insight: "El sistema puede analizar qué formatos funcionan mejor y convertir ese aprendizaje en nuevas variantes de contenido.",
    metric: "∞",
    metricLabel: "posibilidades de iteración",
  },
  {
    id: "crm",
    label: "CRM Inteligente",
    icon: "🤖",
    description: "Calificación de leads y seguimiento automatizado con IA conversacional.",
    before: "Respuesta manual · Sin priorización · Seguimientos dispersos",
    after: "Respuesta asistida · Lead scoring · Seguimientos automatizados",
    insight: "Un asistente puede clasificar conversaciones, detectar intención y derivar oportunidades al equipo comercial cuando corresponde.",
    metric: "24/7",
    metricLabel: "asistencia comercial",
  },
  {
    id: "analytics",
    label: "Analytics Predictivo",
    icon: "📈",
    description: "Análisis de señales para encontrar patrones, anomalías y oportunidades antes de tomar decisiones.",
    before: "Reportes retrospectivos · Datos aislados · Decisiones lentas",
    after: "Alertas · Patrones detectados · Decisiones más rápidas",
    insight: "La automatización puede convertir datos de marketing y ventas en alertas accionables para que el equipo actúe antes.",
    metric: "Datos",
    metricLabel: "convertidos en decisiones",
  },
];

export default function AIShowcase() {
  const [active, setActive] = useState(0);
  const demo = demos[active];

  return (
    <section id="ia-showcase" className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.14),transparent_55%)]" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="IA en acción" title="La inteligencia artificial debe resolver problemas reales de negocio." description="Diseñamos automatizaciones que conectan marketing, ventas y atención sin añadir tecnología innecesaria." />

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {demos.map((item, index) => (
            <button key={item.id} onClick={() => setActive(index)} aria-pressed={index === active} className={`flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold transition-all ${index === active ? "border-cyan-300/40 bg-cyan-300/10 text-white" : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"}`}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={demo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="mt-10 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(7,9,12,0.97))]">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
              <div className="p-8 sm:p-10">
                <div className="flex items-center gap-3"><span className="text-3xl" aria-hidden="true">{demo.icon}</span><div><p className="text-xs uppercase tracking-[0.28em] text-violet-300">Caso de uso</p><h3 className="text-2xl font-semibold text-white">{demo.label}</h3></div></div>
                <p className="mt-5 leading-7 text-slate-300">{demo.description}</p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.75rem] border border-white/10 bg-black/40 p-5"><p className="text-xs uppercase tracking-[0.28em] text-slate-500">Antes</p><p className="mt-3 text-sm leading-6 text-slate-400">{demo.before}</p></div>
                  <div className="rounded-[1.75rem] border border-cyan-300/20 bg-cyan-300/5 p-5"><p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Con AdVibe IA</p><p className="mt-3 text-sm font-semibold leading-6 text-white">{demo.after}</p></div>
                </div>
                <div className="mt-6 rounded-[1.75rem] border border-violet-400/20 bg-violet-400/5 p-5"><p className="text-xs uppercase tracking-[0.26em] text-violet-300">Cómo funciona</p><p className="mt-3 text-sm leading-7 text-slate-300">{demo.insight}</p></div>
              </div>
              <div className="flex flex-col items-center justify-center gap-6 border-t border-white/10 bg-black/30 p-8 lg:border-l lg:border-t-0">
                <div className="text-center"><p className="text-xs uppercase tracking-[0.3em] text-slate-500">Enfoque AdVibe</p><p className="mt-4 bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 bg-clip-text text-6xl font-bold text-transparent sm:text-7xl">{demo.metric}</p><p className="mt-3 text-sm text-slate-400">{demo.metricLabel}</p></div>
                <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-5 text-center"><p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Importante</p><p className="mt-2 text-sm font-semibold text-white">Cada sistema se diseña a medida</p><p className="mt-1 text-xs text-slate-500">No prometemos resultados sin datos.</p></div>
                <EventButton href="#diagnostico" eventName="ai_showcase_cta" eventParams={{ source: "ai_showcase", demo: demo.id }} className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 hover:-translate-y-0.5 hover:bg-[#f3f3f0]">Implementar en mi marca</EventButton>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
