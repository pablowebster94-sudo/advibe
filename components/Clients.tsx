"use client";

import { motion } from "framer-motion";
import { logos } from "@/lib/content";

export default function Clients() {
  return (
    <section id="marcas" className="relative overflow-hidden bg-[#f2f0e9] py-28 text-[#111312] sm:py-32 lg:py-40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(53,205,187,0.14),transparent_26%),radial-gradient(circle_at_90%_80%,rgba(59,130,246,0.08),transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#168e82]">Trabajo real</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Marcas que han confiado en nuestro trabajo.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#5e625f] sm:text-lg">Una selección de negocios y proyectos en los que hemos participado con contenido, campañas, identidad visual, publicidad o soluciones digitales.</p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {logos.map((logo, index) => (
            <motion.article key={logo.name} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.45, delay: index * 0.025 }} whileHover={{ y: -5 }} className="group relative flex min-h-36 flex-col justify-between overflow-hidden rounded-2xl border border-black/8 bg-white p-5 shadow-[0_12px_40px_-30px_rgba(0,0,0,0.5)] transition-shadow hover:shadow-[0_25px_55px_-35px_rgba(0,0,0,0.55)] sm:min-h-40 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#8a8f8b]">{logo.label}</span>
                <span className="h-2 w-2 rounded-full bg-[#35cdbb] opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div>
                <p className="text-xl font-semibold tracking-[-0.035em] text-[#202321] transition-transform duration-500 group-hover:translate-x-1 sm:text-2xl">{logo.name}</p>
                <div className="mt-3 h-px w-10 bg-[#35cdbb] transition-all duration-500 group-hover:w-20" />
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-8 flex flex-col justify-between gap-5 rounded-3xl bg-[#111312] px-7 py-7 text-white sm:flex-row sm:items-center sm:px-9">
          <div><p className="text-xs uppercase tracking-[0.28em] text-[#79ded2]">La confianza se construye con trabajo</p><p className="mt-2 text-xl font-medium tracking-tight">Contenido. Campañas. Oportunidades.</p></div>
          <a href="#diagnostico" className="inline-flex items-center justify-center rounded-full bg-[#f2f0e9] px-6 py-3 text-sm font-semibold text-[#111312] hover:-translate-y-0.5">Hablemos <span className="ml-2">→</span></a>
        </div>
      </div>
    </section>
  );
}
