"use client";

import { motion } from "framer-motion";
import { services } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";

const cardAnimation = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function Services() {
  return (
    <section id="servicios" className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/5 to-transparent" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Servicios"
          title="Soluciones integrales para cada fase de crecimiento."
          description="Diseñamos estrategias, automatizamos procesos y construimos productos digitales con un estándar de primer nivel."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service, index) => (
            <motion.article
              key={service.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={cardAnimation}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              whileHover={{ y: -8, scale: 1.02, rotateX: 2, rotateY: -2 }}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(10,10,10,0.82))] p-8 shadow-[0_30px_90px_-70px_rgba(255,255,255,0.16)] backdrop-blur-xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${service.accent} opacity-70 transition duration-500 group-hover:scale-105`} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_38%)]" />
              <div className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_left,_rgba(0,212,255,0.16),_transparent_42%)]" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950/70 text-2xl shadow-[0_0_30px_rgba(0,212,255,0.12)] ring-1 ring-white/10 transition duration-300 group-hover:translate-y-[-2px] group-hover:shadow-[0_0_40px_rgba(0,212,255,0.18)]">
                  {service.icon}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{service.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-200">{service.description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
