"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";

const services = [
  {
    title: "Meta Ads",
    description:
      "Campañas de alto impacto, segmentación inteligente y optimización continua para escalar ventas.",
    icon: "🧠",
  },
  {
    title: "Automatización con IA",
    description:
      "Flujos inteligentes que ahorran tiempo, aumentan precisión y amplifican conversiones.",
    icon: "🤖",
  },
  {
    title: "Desarrollo Web",
    description:
      "Experiencias web ultrarrápidas, adaptadas a la marca y enfocadas en conversión.",
    icon: "🌐",
  },
  {
    title: "Producción Audiovisual",
    description:
      "Narrativas visuales premium para elevar la percepción de marca y generar confianza.",
    icon: "🎥",
  },
];

const cardAnimation = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function Services() {
  return (
    <section id="servicios" className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-400/10 to-transparent" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Servicios"
          title="Soluciones integrales para cada fase de crecimiento."
          description="Diseñamos estrategias, automatizamos procesos y construimos productos digitales con un estándar SaaS de primer nivel."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service, index) => (
            <motion.article
              key={service.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              variants={cardAnimation}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              className="group rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_-70px_rgba(0,212,255,0.25)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:bg-white/10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-400/10 text-2xl shadow-[0_0_30px_rgba(0,212,255,0.12)] transition duration-300 group-hover:bg-cyan-400/15">
                {service.icon}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">{service.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">{service.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
