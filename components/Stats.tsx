"use client";

import { motion } from "framer-motion";
import { stats } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";

export default function Stats() {
  return (
    <section
      id="resultados"
      className="relative overflow-hidden py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Nuestra Experiencia"
          title="Resultados construidos junto a empresas de diferentes sectores."
          description="Cada proyecto representa una estrategia diseñada para atraer clientes, fortalecer marcas y generar crecimiento sostenible mediante creatividad, tecnología y datos."
        />

        <div className="mt-16 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(10,10,10,0.90))] p-10 backdrop-blur-xl">

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                }}
                whileHover={{
                  y: -6,
                }}
                className="rounded-[1.5rem] border border-white/10 bg-black/40 p-8 transition-all duration-500 hover:border-cyan-400/30 hover:shadow-[0_20px_60px_-25px_rgba(0,212,255,0.18)]"
              >
                <h3 className="text-4xl font-bold text-white">
                  {stat.value}
                </h3>

                <p className="mt-4 leading-7 text-slate-300">
                  {stat.label}
                </p>
              </motion.div>
            ))}

          </div>

          <div className="mt-10 rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/5 p-8">

            <h3 className="text-2xl font-semibold text-white">
              Más que marketing, construimos sistemas de crecimiento.
            </h3>

            <p className="mt-4 max-w-4xl leading-8 text-slate-300">
              Integramos estrategia, Meta Ads, producción audiovisual,
              desarrollo web, inteligencia artificial y automatización para
              ayudar a las empresas a vender más, optimizar procesos y
              fortalecer su presencia digital.
            </p>

          </div>

        </div>
      </div>
    </section>
  );
}