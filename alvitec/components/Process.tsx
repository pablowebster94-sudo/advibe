import { processSteps } from "@/lib/site";
import { Reveal } from "./Motion";
import { Eyebrow } from "./SectionHeading";

export function Process() {
  return (
    <section id="proceso" className="bg-white py-20 sm:py-28 lg:py-36">
      <div className="container-site">
        <Reveal>
          <Eyebrow index="06">Proceso</Eyebrow>
          <h2 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-5xl lg:text-6xl">Del primer mensaje a la instalación.</h2>
        </Reveal>
        <ol className="mt-14 grid gap-x-6 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {processSteps.map((s, i) => (
            <li key={s.title} className={i % 2 === 1 ? "lg:mt-16" : ""}>
              <Reveal delay={i * 0.08}>
                <div className="border-t border-navy pb-10 pt-6">
                  <span className="font-display text-6xl font-medium tracking-[-0.04em] text-steel sm:text-7xl">0{i + 1}</span>
                  <h3 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-navy">{s.title}</h3>
                  <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-ink/80">{s.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
