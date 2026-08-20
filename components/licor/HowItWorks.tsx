import { DELIVERY_PILLARS, HOW_IT_WORKS } from "@/lib/licor/config";
import { Section, SectionHeading } from "./ui";

export function DeliveryPillars() {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {DELIVERY_PILLARS.map((pillar) => (
        <li
          key={pillar}
          className="rounded-xl border border-[#D4AF37]/25 bg-gradient-to-b from-[#D4AF37]/[0.09] to-transparent px-3 py-4 text-center"
        >
          <span className="text-xs font-black uppercase leading-tight tracking-[0.14em] text-[#E7C766] sm:text-sm">
            {pillar}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function HowItWorks({ id = "how-it-works" }: { id?: string }) {
  return (
    <Section id={id} className="py-12 sm:py-16">
      <SectionHeading
        eyebrow="Simple as it gets"
        title="How it works"
        align="center"
      />

      <ol className="mt-9 grid gap-4 md:grid-cols-3">
        {HOW_IT_WORKS.map((step) => (
          <li
            key={step.step}
            className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
          >
            <span
              aria-hidden
              className="absolute -right-2 -top-4 text-[86px] font-black leading-none text-white/[0.04]"
            >
              {step.step}
            </span>
            <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#E01B22] text-sm font-black text-white">
              {step.step}
            </span>
            <h3 className="relative mt-4 text-base font-black uppercase tracking-[0.08em] text-white">
              {step.title}
            </h3>
            <p className="relative mt-2 text-sm leading-relaxed text-white/55">{step.copy}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
