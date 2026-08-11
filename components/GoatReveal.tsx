"use client";

import { motion } from "framer-motion";

export default function GoatReveal() {
  return (
    <section aria-label="Cierre AdVibe" className="relative overflow-hidden bg-[#050505] py-24 sm:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_70%,rgba(163,230,53,0.12),transparent_32%)]" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative min-h-[520px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#07100b] p-8 sm:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_18%,rgba(163,230,53,0.035)_52%,transparent_82%)]" />
          <div className="absolute right-[-12rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full border border-lime-300/10" />
          <div className="absolute right-[-7rem] top-[-7rem] h-[24rem] w-[24rem] rounded-full border border-lime-300/10" />

          <div className="relative z-20 max-w-xl pt-4 sm:pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-lime-300">Creativos por naturaleza</p>
            <h2 className="mt-5 text-5xl font-semibold leading-[0.9] tracking-[-0.055em] text-white sm:text-7xl">Resultados.</h2>
            <div className="mt-8 h-px w-40 bg-lime-300" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.32em] text-white/45">ADVIBE · AGENCIA CREATIVA &amp; TECNOLÓGICA</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 140, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.25, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-[-3.5rem] right-[0%] z-10 w-[280px] sm:right-[5%] sm:w-[410px] md:w-[500px]"
          >
            <motion.div animate={{ y: [0, -6, 0], rotate: [0, 0.25, 0, -0.25, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="relative">
              <div className="absolute left-[15%] top-[18%] h-[62%] w-[68%] rounded-full bg-lime-300/10 blur-[90px]" />
              <svg viewBox="0 0 620 620" role="img" aria-label="Cabra AdVibe — Creativos por naturaleza" className="relative h-auto w-full drop-shadow-[0_40px_70px_rgba(0,0,0,0.75)]">
                <defs>
                  <radialGradient id="fur" cx="35%" cy="25%" r="80%">
                    <stop offset="0" stopColor="#f7f5ed" />
                    <stop offset="0.52" stopColor="#ddd9ce" />
                    <stop offset="1" stopColor="#a29d91" />
                  </radialGradient>
                  <linearGradient id="coat" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#303a31" />
                    <stop offset="0.5" stopColor="#151b17" />
                    <stop offset="1" stopColor="#080b09" />
                  </linearGradient>
                  <linearGradient id="horn" x1="0" y1="0" x2="0.9" y2="1">
                    <stop offset="0" stopColor="#d1b47c" />
                    <stop offset="0.45" stopColor="#8e7044" />
                    <stop offset="1" stopColor="#3f3020" />
                  </linearGradient>
                  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#26312b" />
                    <stop offset="0.45" stopColor="#080b0a" />
                    <stop offset="1" stopColor="#111713" />
                  </linearGradient>
                  <filter id="softShadow" x="-30%" y="-30%" width="160%" height="170%">
                    <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#000" floodOpacity="0.5" />
                  </filter>
                </defs>

                <ellipse cx="330" cy="585" rx="185" ry="20" fill="#000" opacity="0.42" />

                {/* jacket */}
                <path d="M177 404 C110 430 78 505 93 575 L257 575 L269 451 L226 410Z" fill="url(#coat)" stroke="#080b09" strokeWidth="10" filter="url(#softShadow)" />
                <path d="M443 404 C510 430 542 505 527 575 L363 575 L351 451 L394 410Z" fill="url(#coat)" stroke="#080b09" strokeWidth="10" filter="url(#softShadow)" />
                <path d="M238 430 L330 535 L382 430 L406 575 L254 575Z" fill="#101612" stroke="#080b09" strokeWidth="8" />
                <path d="M247 430 L330 520 L373 430" fill="none" stroke="#4b574d" strokeWidth="7" />
                <path d="M304 510 L356 510" stroke="#a3e635" strokeWidth="6" strokeLinecap="round" />

                {/* neck and head */}
                <path d="M260 404 C235 447 247 490 330 510 C413 490 425 447 400 404Z" fill="url(#fur)" stroke="#252923" strokeWidth="10" />
                <path d="M330 128 C241 128 196 207 208 327 C216 414 265 465 330 465 C395 465 444 414 452 327 C464 207 419 128 330 128Z" fill="url(#fur)" stroke="#252923" strokeWidth="10" />

                {/* ears */}
                <path d="M228 220 C155 208 105 159 119 116 C164 128 211 162 250 204Z" fill="#d9d5ca" stroke="#252923" strokeWidth="9" />
                <path d="M432 220 C505 208 555 159 541 116 C496 128 449 162 410 204Z" fill="#d9d5ca" stroke="#252923" strokeWidth="9" />
                <path d="M217 196 C171 182 146 160 139 140 C170 151 198 169 224 195Z" fill="#a99f91" opacity="0.65" />
                <path d="M443 196 C489 182 514 160 521 140 C490 151 462 169 436 195Z" fill="#a99f91" opacity="0.65" />

                {/* horns */}
                <path d="M272 143 C232 89 236 35 274 14 C311 49 318 101 302 157Z" fill="url(#horn)" stroke="#252923" strokeWidth="10" />
                <path d="M388 143 C428 89 424 35 386 14 C349 49 342 101 358 157Z" fill="url(#horn)" stroke="#252923" strokeWidth="10" />
                <path d="M263 94 Q278 75 281 44 M357 94 Q342 75 339 44" fill="none" stroke="#e0c792" strokeWidth="5" opacity="0.35" />

                {/* beard */}
                <path d="M281 376 Q330 420 379 376 L367 458 Q330 505 293 458Z" fill="#c7c2b7" stroke="#252923" strokeWidth="8" />
                <path d="M304 419 Q330 454 356 419" fill="none" stroke="#8f897e" strokeWidth="5" opacity="0.8" />

                {/* sunglasses */}
                <g>
                  <path d="M229 253 Q279 226 325 254 L318 325 Q274 345 237 325Z" fill="url(#glass)" stroke="#171c19" strokeWidth="10" />
                  <path d="M335 254 Q381 226 431 253 L423 325 Q386 345 342 325Z" fill="url(#glass)" stroke="#171c19" strokeWidth="10" />
                  <path d="M319 267 Q330 260 341 267" fill="none" stroke="#141a16" strokeWidth="11" strokeLinecap="round" />
                  <path d="M248 267 L292 249 M354 267 L398 249" stroke="#d8e5da" strokeWidth="7" opacity="0.22" strokeLinecap="round" />
                  <path d="M276 332 Q330 352 384 332" fill="none" stroke="#252923" strokeWidth="8" strokeLinecap="round" />
                </g>

                {/* muzzle */}
                <path d="M270 349 Q330 325 390 349 Q385 398 330 410 Q275 398 270 349Z" fill="#d4cec2" stroke="#252923" strokeWidth="8" />
                <ellipse cx="303" cy="370" rx="10" ry="7" fill="#4c463d" />
                <ellipse cx="357" cy="370" rx="10" ry="7" fill="#4c463d" />
                <path d="M302 393 Q330 409 358 393" fill="none" stroke="#252923" strokeWidth="7" strokeLinecap="round" />

                {/* subtle AdVibe accents */}
                <circle cx="224" cy="435" r="7" fill="#a3e635" />
                <circle cx="436" cy="435" r="7" fill="#a3e635" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
