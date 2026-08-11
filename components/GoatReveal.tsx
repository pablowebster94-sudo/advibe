"use client";

import { motion } from "framer-motion";

export default function GoatReveal() {
  return (
    <section aria-label="Cierre AdVibe" className="relative overflow-hidden bg-[#050505] py-24 sm:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(163,230,53,0.13),transparent_35%)]" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative min-h-[520px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#07100b] p-8 sm:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(163,230,53,0.035)_50%,transparent_80%)]" />
          <div className="absolute right-[-12rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full border border-lime-300/10" />
          <div className="absolute right-[-7rem] top-[-7rem] h-[24rem] w-[24rem] rounded-full border border-lime-300/10" />

          <div className="relative z-20 max-w-xl pt-4 sm:pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-lime-300">Creativos por naturaleza</p>
            <h2 className="mt-5 text-5xl font-semibold leading-[0.9] tracking-[-0.055em] text-white sm:text-7xl">
              Resultados.
            </h2>
            <div className="mt-8 h-px w-40 bg-lime-300" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.32em] text-white/45">ADVIBE · AGENCIA CREATIVA &amp; TECNOLÓGICA</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 120, scale: 0.82, rotate: 3 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 1.15, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-[-2rem] right-[2%] z-10 w-[250px] sm:right-[7%] sm:w-[360px] md:w-[430px]"
          >
            <motion.div
              animate={{ y: [0, -7, 0], rotate: [0, 0.45, 0, -0.45, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="absolute left-[17%] top-[17%] h-[65%] w-[65%] rounded-full bg-lime-300/10 blur-[70px]" />
              <svg viewBox="0 0 520 560" role="img" aria-label="Cabra creativa de AdVibe" className="relative h-auto w-full drop-shadow-[0_35px_60px_rgba(0,0,0,0.65)]">
                <defs>
                  <linearGradient id="goat-fur" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#f3f2eb" />
                    <stop offset="0.55" stopColor="#d4d3ca" />
                    <stop offset="1" stopColor="#9b9c98" />
                  </linearGradient>
                  <linearGradient id="goat-jacket" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#263029" />
                    <stop offset="1" stopColor="#0d120f" />
                  </linearGradient>
                  <linearGradient id="goat-horn" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#b99b67" />
                    <stop offset="1" stopColor="#51402b" />
                  </linearGradient>
                </defs>

                <ellipse cx="260" cy="535" rx="150" ry="20" fill="rgba(0,0,0,.45)" />

                <path d="M145 390 C92 416 70 480 95 535 L185 535 L215 404 Z" fill="url(#goat-jacket)" stroke="#050806" strokeWidth="8" />
                <path d="M375 390 C428 416 450 480 425 535 L335 535 L305 404 Z" fill="url(#goat-jacket)" stroke="#050806" strokeWidth="8" />
                <path d="M175 390 C160 445 145 500 155 540 L205 540 L230 430 Z" fill="#121914" stroke="#080b09" strokeWidth="7" />
                <path d="M345 390 C360 445 375 500 365 540 L315 540 L290 430 Z" fill="#121914" stroke="#080b09" strokeWidth="7" />

                <path d="M260 205 C184 205 151 265 168 360 C179 421 213 455 260 455 C307 455 341 421 352 360 C369 265 336 205 260 205 Z" fill="url(#goat-fur)" stroke="#20241f" strokeWidth="9" />

                <path d="M188 246 C130 228 102 190 116 157 C146 169 180 195 207 221 Z" fill="#dddcd4" stroke="#20241f" strokeWidth="8" />
                <path d="M332 246 C390 228 418 190 404 157 C374 169 340 195 313 221 Z" fill="#dddcd4" stroke="#20241f" strokeWidth="8" />

                <path d="M214 207 C185 151 189 93 226 62 C251 94 262 151 246 211 Z" fill="url(#goat-horn)" stroke="#20241f" strokeWidth="9" />
                <path d="M306 207 C335 151 331 93 294 62 C269 94 258 151 274 211 Z" fill="url(#goat-horn)" stroke="#20241f" strokeWidth="9" />

                <path d="M191 278 Q230 247 260 279 Q290 247 329 278 L318 332 Q260 350 202 332 Z" fill="#080b0b" stroke="#1d241f" strokeWidth="8" />
                <path d="M205 286 L244 279 L246 325 L208 321 Z" fill="#171b19" />
                <path d="M315 286 L276 279 L274 325 L312 321 Z" fill="#171b19" />
                <path d="M247 281 L273 281" stroke="#a3e635" strokeWidth="7" strokeLinecap="round" />

                <ellipse cx="229" cy="303" rx="7" ry="5" fill="#a3e635" />
                <ellipse cx="291" cy="303" rx="7" ry="5" fill="#a3e635" />

                <path d="M235 355 Q260 368 285 355" fill="none" stroke="#20241f" strokeWidth="8" strokeLinecap="round" />
                <path d="M225 382 Q260 430 295 382 Q260 402 225 382Z" fill="#d1d0c8" stroke="#20241f" strokeWidth="7" />

                <path d="M194 405 L157 445" stroke="#20241f" strokeWidth="9" strokeLinecap="round" />
                <path d="M326 405 L363 445" stroke="#20241f" strokeWidth="9" strokeLinecap="round" />
                <circle cx="156" cy="446" r="7" fill="#a3e635" />
                <circle cx="364" cy="446" r="7" fill="#a3e635" />

                <path d="M205 425 Q260 465 315 425 L332 500 Q260 525 188 500 Z" fill="url(#goat-jacket)" stroke="#050806" strokeWidth="8" />
                <path d="M218 429 L260 477 L302 429" fill="none" stroke="#3e4a40" strokeWidth="6" />
                <path d="M242 474 L278 474" stroke="#a3e635" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
