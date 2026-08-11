"use client";

import { motion } from "framer-motion";

export default function GoatReveal() {
  return (
    <section aria-label="Final AdVibe moment" className="relative overflow-hidden bg-[#05070b] py-24 sm:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(91,124,255,0.18),transparent_38%)]" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative min-h-[420px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0b1020] p-8 sm:p-12">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-blue-400/15" />
          <div className="absolute -right-8 top-10 h-52 w-52 rounded-full border border-violet-400/15 animate-pulse-ring" />
          <div className="relative z-10 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-blue-300">Y una última cosa</p>
            <h2 className="mt-5 text-5xl font-semibold leading-[0.9] tracking-[-0.055em] text-white sm:text-7xl">Porque una buena web también puede tener personalidad.</h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">Terminamos el recorrido con un pequeño detalle inesperado.</p>
          </div>

          <motion.div initial={{ opacity: 0, y: 90, scale: 0.72, rotate: -4 }} whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }} viewport={{ once: true, amount: 0.45 }} transition={{ duration: 1.05, delay: 0.12, ease: [0.22, 1, 0.36, 1] }} className="absolute bottom-[-1.5rem] right-[7%] z-10 w-56 sm:w-72">
            <motion.div animate={{ y: [0, -8, 0], rotate: [0, 1.5, 0, -1.5, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}>
              <svg viewBox="0 0 320 360" role="img" aria-label="Cabra ilustrada de AdVibe" className="h-auto w-full drop-shadow-[0_35px_45px_rgba(0,0,0,0.45)]">
                <defs>
                  <linearGradient id="goatBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f5f5f5"/><stop offset="1" stopColor="#b9c0ce"/></linearGradient>
                  <linearGradient id="goatHorn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d8b07a"/><stop offset="1" stopColor="#8f6338"/></linearGradient>
                </defs>
                <ellipse cx="164" cy="333" rx="94" ry="14" fill="rgba(0,0,0,.35)" />
                <path d="M105 238 C84 273 88 310 106 324 L131 324 L139 265 Z" fill="url(#goatBody)" stroke="#1d2636" strokeWidth="6" />
                <path d="M211 238 C236 270 236 309 215 324 L191 324 L181 265 Z" fill="url(#goatBody)" stroke="#1d2636" strokeWidth="6" />
                <path d="M116 146 C113 103 130 72 166 72 C204 72 221 104 215 146 L201 215 C195 246 179 264 164 264 C147 264 128 244 124 214 Z" fill="url(#goatBody)" stroke="#1d2636" strokeWidth="7" />
                <path d="M125 105 C91 93 79 70 88 55 C105 62 123 76 139 92 Z" fill="#d9dee7" stroke="#1d2636" strokeWidth="6" />
                <path d="M204 104 C238 92 251 69 242 54 C225 61 206 75 190 91 Z" fill="#d9dee7" stroke="#1d2636" strokeWidth="6" />
                <path d="M139 74 C124 44 126 21 145 12 C158 27 163 48 157 72 Z" fill="url(#goatHorn)" stroke="#1d2636" strokeWidth="6" />
                <path d="M190 74 C205 44 203 21 184 12 C171 27 166 48 172 72 Z" fill="url(#goatHorn)" stroke="#1d2636" strokeWidth="6" />
                <ellipse cx="147" cy="139" rx="9" ry="13" fill="#111827" /><ellipse cx="183" cy="139" rx="9" ry="13" fill="#111827" />
                <circle cx="149" cy="135" r="3" fill="white" /><circle cx="185" cy="135" r="3" fill="white" />
                <path d="M150 170 Q164 180 178 170" fill="none" stroke="#1d2636" strokeWidth="6" strokeLinecap="round" />
                <path d="M149 190 Q164 222 179 190 Q164 202 149 190Z" fill="#d9dee7" stroke="#1d2636" strokeWidth="5" />
                <path d="M133 211 L116 236 M195 211 L213 236" stroke="#1d2636" strokeWidth="7" strokeLinecap="round" />
                <circle cx="115" cy="238" r="5" fill="#075BFF" /><circle cx="213" cy="238" r="5" fill="#075BFF" />
              </svg>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.9, duration: 0.45 }} className="absolute bottom-10 right-[30%] z-20 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-2xl">Sí. Una cabra. 🐐</motion.div>
        </div>
      </div>
    </section>
  );
}
