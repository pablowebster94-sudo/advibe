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
    <section
      id="servicios"
      className="relative overflow-hidden py-24 sm:py-28 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/5 to-transparent" />

      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Sistema de Crecimiento"
          title="Todo lo que tu empresa necesita para crecer, en un solo lugar."
          description="No ofrecemos servicios aislados. Integramos estrategia, creatividad y tecnología para construir un sistema que atraiga clientes, fortalezca tu marca y genere resultados sostenibles."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service, index) => (
            <motion.article
              key={service.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={cardAnimation}
              transition={{
                duration: 0.55,
                delay: index * 0.08,
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
              }}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(10,10,10,0.90))] p-8 backdrop-blur-xl transition-all duration-500 hover:border-cyan-400/30 hover:shadow-[0_25px_80px_-35px_rgba(0,212,255,0.18)]"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${service.accent} opacity-60 transition duration-500 group-hover:opacity-80`}
              />

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.08),_transparent_40%)]" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-white/10 bg-black/40 text-2xl">
                  {service.icon}
                </div>

                <h3 className="mt-6 text-xl font-semibold text-white">
                  {service.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-300">
                  {service.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}