"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section id="home" className="relative isolate overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_55%)]" />

      <div className="mx-auto flex max-w-7xl flex-col items-center text-center lg:items-start lg:text-left">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <p className="mb-6 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300">
            Diseño, desarrollo y crecimiento digital
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Creamos experiencias digitales que impulsan resultados reales.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300 sm:text-xl">
            Ayudamos a marcas y negocios a convertir ideas en productos claros,
            rápidos y memorables.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-start">
            <Button href="#agenda" variant="primary">
              Agenda una reunión
            </Button>
            <Button href="#projects" variant="secondary">
              Ver proyectos
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
