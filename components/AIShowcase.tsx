"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import EventButton from "@/components/EventButton";

const demos = [
  { id: "ads", label: "Meta Ads + IA", index: "01", description: "Automatización de análisis, segmentación y optimización para campañas de adquisición.", before: "Datos dispersos · Optimización manual · Decisiones reactivas", after: "Señales centralizadas · Priorización automática · Optimización continua", insight: "La IA puede identificar patrones en rendimiento, audiencias y creativos para ayudar al equipo a reasignar atención y presupuesto con mayor velocidad.", metric: "IA", metricLabel: "para detectar oportunidades" },
  { id: "content", label: "Contenido Automático", index: "02", description: "Sistemas que ayudan a producir, adaptar y organizar contenido según objetivos y canales.", before: "Producción manual · Calendarios rígidos · Poco aprendizaje", after: "Flujos asistidos por IA · Variantes por canal · Iteración continua", insight: "El sistema puede analizar qué formatos funcionan mejor y convertir ese aprendizaje en nuevas variantes de contenido.", metric: "∞", metricLabel: "posibilidades de iteración" },
  { id: "crm", label: "CRM Inteligente", index: "03", description: "Calificación de leads y seguimiento automatizado con IA conversacional.", before: "Respuesta manual · Sin priorización · Seguimientos dispersos", after: "Respuesta asistida · Lead scoring · Seguimientos automatizados", insight: "Un asistente puede clasificar conversaciones, detectar intención y derivar oportunidades al equipo comercial cuando corresponde.", metric: "24/7", metricLabel: "asistencia comercial" },
  { id: "analytics", label: "Analytics Predictivo", index: "04", description: "Análisis de señales para encontrar patrones, anomalías y oportunidades antes de tomar decisiones.", before: "Reportes retrospectivos · Datos aislados · Decisiones lentas", after: "Alertas · Patrones detectados · Decisiones más rápidas", insight: "La automatización puede convertir datos de marketing y ventas en alertas accionables para que el equipo actúe antes.", metric: "Datos", metricLabel: "convertidos en decisiones" },
];

export default function AIShowcase() {
  const [active, setActive] = useState(0);
  const demo = demos[active];

  return (
    <section id="ia-showcase" className="relative overflow-hidden border-y border-white/6 py-28 sm:py-32 lg:py-40">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_35%,rgba(174,255,0,0.055),transparent_35%)]" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Tecnología aplicada" title="La inteligencia artificial debe resolver problemas reales de negocio." description="Diseñamos automatizaciones que conectan marketing, ventas y atención sin añadir tecnología innecesaria." />

        <div className="mt-20 border-y border-white/10">
          {demos.map((item, index) => (
            <button key={item.id} onClick={() => setActive(index)} aria-pressed={index === active} className={`group relative grid w-full gap-4 border-b border-white/10 py-7 text-left last:border-b-0 sm:grid-cols-[90px_1fr_auto] sm:items-center sm:py-8 ${index === active ? "bg-white/[0.025]" : "hover:bg-white/[0.015]"}`}>
              <span className={`font-mono text-xs tracking-[0.22em] ${index === active ? "text-lime-300" : "text-slate-600"}`}>{item.index}</span>
              <span className={`text-2xl font-semibold tracking-[-0.035em] transition-transform duration-300 group-hover:translate-x-1 sm:text-3xl ${index === active ? "text-white" : "text-slate-400"}`}>{item.label}</span>
              <span className={`text-lg transition-all duration-300 ${index === active ? "translate-x-1 text-lime-300" : "text-white/15 group-hover:translate-x-1 group-hover:text-white/50"}`} aria-hidden="true">↗</span>
              {index === active && <span className="absolute bottom-0 left-0 h-px w-full bg-lime-300" aria-hidden="true" />}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={demo.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="mt-10 grid overflow-hidden border border-white/10 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-lime-300">Caso de uso / {demo.index}</p>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">{demo.label}</h3>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">{demo.description}</p>

              <div className="mt-10 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-2">
                <div><p className="text-[10px] uppercase tracking-[0.28em] text-slate-600">Antes</p><p className="mt-3 text-sm leading-6 text-slate-500">{demo.before}</p></div>
                <div><p className="text-[10px] uppercase tracking-[0.28em] text-lime-300">Con AdVibe</p><p className="mt-3 text-sm font-semibold leading-6 text-white">{demo.after}</p></div>
              </div>

              <div className="mt-8 border-t border-white/10 pt-8"><p className="text-[10px] uppercase tracking-[0.28em] text-slate-600">Cómo funciona</p><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">{demo.insight}</p></div>
            </div>

            <div className="flex flex-col justify-between border-t border-white/10 bg-white/[0.02] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
              <div><p className="text-[10px] uppercase tracking-[0.3em] text-slate-600">Enfoque AdVibe</p><p className="mt-6 text-6xl font-semibold tracking-[-0.07em] text-lime-300 sm:text-7xl">{demo.metric}</p><p className="mt-2 text-sm text-slate-500">{demo.metricLabel}</p></div>
              <div className="mt-12 border-t border-white/10 pt-6"><p className="text-sm font-semibold text-white">Cada sistema se diseña a medida.</p><p className="mt-2 text-xs leading-5 text-slate-600">No añadimos tecnología por moda. La usamos cuando resuelve un problema real.</p></div>
              <EventButton href="#diagnostico" eventName="ai_showcase_cta" eventParams={{ source: "ai_showcase", demo: demo.id }} className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-lime-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-lime-200">Implementar en mi marca ↗</EventButton>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
