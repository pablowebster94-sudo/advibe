import { waLink } from "@/lib/whatsapp";
import { Reveal } from "./Motion";
import { Eyebrow } from "./SectionHeading";
import { ArrowUpRight } from "./icons";

const materials = [
  {
    name: "Aluminio",
    text: "Perfilería para puertas, ventanas, divisiones y fachadas. Indícanos la línea que necesitas o la definimos contigo.",
    options: ["Línea 20", "Línea 25", "Línea 4000"],
  },
  {
    name: "Vidrio",
    text: "Para fachadas, cerramientos, divisiones y vitrinas. El tipo de vidrio se elige según la aplicación.",
    options: ["Templado", "Laminado"],
  },
  {
    name: "Policarbonato",
    text: "Para cubiertas y espacios que aprovechan la luz natural.",
    options: [],
  },
  {
    name: "Alucobond",
    text: "Revestimiento arquitectónico para fachadas y proyectos comerciales.",
    options: [],
  },
];

export function Materials() {
  return (
    <section id="materiales" className="on-dark bg-navy py-20 text-white sm:py-28 lg:py-36">
      <div className="container-site grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <Reveal>
              <Eyebrow index="03" dark>Materiales</Eyebrow>
              <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">Con qué trabajamos.</h2>
              <p className="mt-6 max-w-sm text-base leading-relaxed text-white/75">
                Cuatro materiales, combinados según lo que pide cada espacio. Las especificaciones finales se definen al cotizar.
              </p>
            </Reveal>
          </div>
        </div>

        <ol className="lg:col-span-7 lg:col-start-6">
          {materials.map((m, i) => (
            <li key={m.name} className="border-t border-white/20 last:border-b">
              <Reveal delay={i * 0.05}>
                <div className="grid gap-5 py-9 sm:grid-cols-[4rem_1fr] sm:py-11">
                  <span className="text-[11px] font-semibold tabular-nums tracking-[0.24em] text-white/60 sm:pt-3">0{i + 1}</span>
                  <div>
                    <h3 className="text-3xl font-semibold tracking-[-0.025em] sm:text-[40px]">{m.name}</h3>
                    <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/80">{m.text}</p>
                    {m.options.length > 0 && (
                      <ul className="mt-6 flex flex-wrap gap-2" aria-label={`Opciones de ${m.name.toLowerCase()}`}>
                        {m.options.map((o) => (
                          <li key={o} className="border border-white/35 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.12em]">{o}</li>
                        ))}
                      </ul>
                    )}
                    <a
                      href={waLink(`Hola ALVITEC, quiero consultar por trabajos en ${m.name.toLowerCase()}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-7 inline-flex min-h-[44px] items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 hover:text-white"
                    >
                      <span className="border-b border-white/50 pb-1">Consultar por {m.name.toLowerCase()}</span>
                      <ArrowUpRight width={15} height={15} />
                    </a>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
