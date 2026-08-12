"use client";

import { motion } from "framer-motion";

const words = ["DESTACAN.", "CONECTAN.", "VENDEN.", "CRECEN."];
const services = [
  ["01", "Contenido audiovisual", "Producción, fotografía y piezas que hacen visible tu marca."],
  ["02", "Publicidad digital", "Meta Ads y campañas orientadas a mensajes, leads y oportunidades."],
  ["03", "Desarrollo web", "Sitios y landing pages pensados para presentar y convertir."],
  ["04", "Inteligencia artificial", "IA y automatización para crear y hacer más eficiente el negocio."],
  ["05", "Cobertura de eventos", "Foto y video profesional para capturar momentos que siguen trabajando por tu marca."],
];
const clients = [
  "Paola Miguitama", "Ballerina Academia de Ballet", "CETAD San Lucas", "BocaBell", "AM Motorsports", "GastroFest", "United Kingdom English Academy", "GBL Handyman Solutions", "Mediodent", "Chiquititos", "Celebraciones y Detalles", "Verónica López Arquitectura + Interiores", "Taquería El Sabor", "Borincuba", "Somos Liga Chorde", "Cardagal", "Nostrum",
];

export default function RedesignShowcase() {
  const loopClients = [...clients, ...clients];
  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#050505] px-6 pb-28 pt-10 text-white sm:pb-36 lg:px-10">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_22%,rgba(163,230,53,0.11),transparent_28%),radial-gradient(circle_at_82%_50%,rgba(163,230,53,0.08),transparent_30%)]" />
        <div className="mx-auto max-w-7xl">
          <div className="max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-lime-300">AdVibe · Agencia creativa y tecnológica</p>
            <h1 className="mt-6 text-[clamp(3.4rem,8vw,8rem)] font-semibold leading-[0.88] tracking-[-0.07em]">Creamos marcas que</h1>
            <div className="relative mt-4 h-[0.95em] overflow-hidden text-[clamp(3.4rem,8vw,8rem)] font-semibold leading-[0.88] tracking-[-0.07em] text-lime-300">
              <motion.div animate={{ y: [0, -1.0, -2.0, -3.0] .map((n) => `${n}em`) }} transition={{ duration: 0 }} />
              <motion.div animate={{ y: ["0em", "-1em", "-2em", "-3em", "-3em"] }} transition={{ duration: 8, times: [0, .22, .44, .66, 1], ease: "easeInOut", repeat: Infinity, repeatDelay: .4 }}>
                {words.map((word) => <div key={word} className="h-[0.95em]">{word}</div>)}
              </motion.div>
            </div>
            <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-400 sm:text-xl">Contenido audiovisual, publicidad digital, desarrollo web, inteligencia artificial y cobertura de eventos para empresas que quieren ir un paso adelante.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#diagnostico" className="rounded-full bg-lime-400 px-7 py-4 text-sm font-semibold text-[#07101a] transition hover:-translate-y-1 hover:bg-lime-300">Solicitar diagnóstico gratuito ↗</a>
              <a href="#trabajo" className="rounded-full border border-white/10 bg-white/[0.03] px-7 py-4 text-sm font-semibold text-white transition hover:-translate-y-1 hover:bg-white/[0.06]">Ver trabajo real</a>
            </div>
          </div>
        </div>
      </section>

      <section id="trabajo" className="bg-[#050505] px-6 py-24 text-white sm:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-lime-300">Lo que hacemos</p>
          <h2 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.9] tracking-[-0.055em] sm:text-6xl">Todo lo que necesita tu marca, conectado.</h2>
          <div className="mt-14 divide-y divide-white/10 border-y border-white/10">
            {services.map(([number, title, description], index) => (
              <motion.article key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .55, delay: index * .05 }} className="group grid gap-5 py-8 md:grid-cols-[80px_1fr_auto] md:items-center md:py-10">
                <span className="text-xs font-semibold tracking-[0.28em] text-lime-300/80">{number}</span>
                <div><h3 className="text-3xl font-semibold tracking-[-0.04em] transition-transform duration-300 group-hover:translate-x-2 sm:text-4xl">{title}</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 group-hover:text-slate-300">{description}</p></div>
                <span className="text-white/30 transition-all duration-300 group-hover:translate-x-2 group-hover:text-lime-300">↗</span>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="marcas" className="overflow-hidden border-y border-white/10 bg-[#090909] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-6 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-lime-300">Marcas que han confiado en AdVibe</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Experiencia real en distintas industrias.</h2>
        </div>
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#090909] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#090909] to-transparent" />
          <motion.div className="flex w-max gap-4" animate={{ x: [0, -2600] }} transition={{ duration: 46, ease: "linear", repeat: Infinity }}>
            {loopClients.map((client, index) => <div key={`${client}-${index}`} className="flex h-24 min-w-64 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 text-center text-sm font-semibold text-white/55 transition hover:border-lime-300/30 hover:bg-lime-300/[0.05] hover:text-white">{client}</div>)}
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#050505] px-6 pb-0 pt-28 text-white sm:pt-36 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-end gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="pb-10 lg:pb-24">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-lime-300">El siguiente paso</p>
            <h2 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.9] tracking-[-0.06em] sm:text-6xl lg:text-7xl">¿Hablamos de lo que podemos construir?</h2>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">Tu marca ya tiene algo que decir. Hagamos que se vea, se mueva y genere oportunidades.</p>
            <a href="#diagnostico" className="mt-9 inline-flex rounded-full bg-lime-400 px-7 py-4 text-sm font-semibold text-[#07101a] transition hover:-translate-y-1 hover:bg-lime-300">Hablemos ↗</a>
          </div>
          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="absolute bottom-12 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-lime-300/10 blur-3xl" />
            <motion.img initial={{ opacity: 0, y: 100, scale: .96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .9, ease: [0.22,1,0.36,1] }} src="/goat-advibe.png" alt="Mascota de AdVibe" className="relative z-10 mx-auto block w-full object-contain drop-shadow-[0_30px_80px_rgba(0,0,0,.6)]" />
          </div>
        </div>
      </section>
    </>
  );
}
