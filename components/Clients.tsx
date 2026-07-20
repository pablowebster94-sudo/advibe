"use client";

import { motion } from "framer-motion";
import { clientGroups } from "@/lib/content";

export default function Clients() {
  return (
    <section
      id="marcas"
      className="relative overflow-hidden py-24 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center max-w-4xl mx-auto">

          <p className="text-sm font-semibold uppercase tracking-[0.30em] text-cyan-300">
            Empresas que han confiado en AdVibe
          </p>

          <h2 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">
            La confianza se construye con resultados.
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Hemos trabajado con empresas de diferentes sectores en Ecuador y
            Estados Unidos, ayudándolas a fortalecer su marca, atraer clientes y
            construir una presencia digital más sólida mediante estrategia,
            creatividad y tecnología.
          </p>

        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">

          {clientGroups.map((group, index) => (

            <motion.article
              key={group.sector}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.05,
              }}
              whileHover={{
                y: -8,
              }}
              className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(10,10,10,0.92))] p-8 backdrop-blur-xl transition-all duration-500 hover:border-cyan-400/30 hover:shadow-[0_25px_80px_-35px_rgba(0,212,255,0.18)]"
            >

              <p className="text-lg font-semibold text-cyan-300">
                {group.sector}
              </p>

              <div className="mt-6 space-y-3">

                {group.clients.map((client) => (

                  <div
                    key={client}
                    className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-slate-300 transition hover:border-white/20 hover:bg-white/10"
                  >
                    {client}
                  </div>

                ))}

              </div>

            </motion.article>

          ))}

        </div>

      </div>
    </section>
  );
}