"use client";

import { motion } from "framer-motion";
import { stats } from "@/lib/content";

export default function Stats() {
  return (
    <section className="relative overflow-hidden py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-[2.2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-slate-950 p-8 shadow-[0_35px_90px_-70px_rgba(0,212,255,0.3)] sm:p-10">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6"
              >
                <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{stat.value}</p>
                <p className="mt-3 text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
