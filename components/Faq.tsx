import { faq } from "@/lib/content";
import SectionHeading from "@/components/ui/SectionHeading";

// Las preguntas visibles deben coincidir con el FAQPage de lib/advibe-schema.ts:
// Google ignora (o penaliza) datos estructurados de FAQ que no aparecen en la página.
export default function Faq() {
  return (
    <section id="preguntas" className="relative border-t border-white/10 py-24 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeading eyebrow="Preguntas frecuentes" title="Lo que suelen preguntarnos antes de empezar." />
        <div className="mt-14 divide-y divide-white/10 border-y border-white/10">
          {faq.map((item) => (
            <details key={item.question} className="group py-6">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left text-lg font-medium text-white transition-colors hover:text-lime-300 [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <span aria-hidden="true" className="mt-1 text-lime-300 transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 max-w-3xl leading-7 text-slate-400">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
