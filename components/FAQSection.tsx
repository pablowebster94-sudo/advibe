import { faq } from "@/lib/content";

export default function FAQSection() {
  return (
    <section id="preguntas" className="relative border-y border-white/10 bg-[#07101a] py-24 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">Preguntas frecuentes</p>
          <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.045em] text-white sm:text-5xl">Antes de empezar, resolvamos tus dudas.</h2>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-400">Conoce cómo trabajamos, qué podemos integrar y cuál puede ser el siguiente paso para tu negocio.</p>
          <a href="/diagnostico" className="mt-8 inline-flex items-center rounded-full border border-lime-300/40 px-5 py-3 text-sm font-semibold text-lime-300 transition hover:bg-lime-300/10">Solicitar diagnóstico <span className="ml-2">↗</span></a>
        </div>
        <div className="divide-y divide-white/10 border-y border-white/10">
          {faq.map((item, index) => (
            <details key={item.question} className="group py-5" open={index === 0}>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-base font-semibold text-white marker:hidden sm:text-lg">
                <span>{item.question}</span>
                <span aria-hidden="true" className="mt-0.5 text-xl font-normal text-lime-300 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-2xl pt-4 pr-8 text-sm leading-7 text-slate-400">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
