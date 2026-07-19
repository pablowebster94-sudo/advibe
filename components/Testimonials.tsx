"use client";

import { motion } from "framer-motion";
import { testimonials } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";

export default function Testimonials() {
  return (
    <section id="casos" className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/5 to-transparent" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Testimonios"
          title="Resultados reales para marcas ambiciosas."
          description="Cada proyecto combina estrategia, creatividad y tecnología para generar impacto claro."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: index * 0.1 }}
              whileHover={{ y: -6, scale: 1.01 }}
              className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(10,10,10,0.82))] p-8 shadow-[0_30px_90px_-70px_rgba(255,255,255,0.16)] backdrop-blur-xl"
            >
              <div className="mb-6 flex items-center gap-1 text-white/70">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <span key={starIndex}>★</span>
                ))}
              </div>
              <p className="text-lg leading-8 text-slate-200">“{testimonial.quote}”</p>
              <div className="mt-8">
                <p className="font-semibold text-white">{testimonial.name}</p>
                <p className="text-sm text-slate-400">
                  {testimonial.role} · {testimonial.company}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
