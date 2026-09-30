import { services } from "@/lib/content";
import type { ServiceGroup } from "@/types/content";

const groups: { name: ServiceGroup; text: string }[] = [
  { name: "Creatividad", text: "Contenido, marca y producción para captar atención y construir percepción de valor." },
  { name: "Performance", text: "Estrategia, anuncios y páginas de captación para convertir atención en oportunidades." },
  { name: "Tecnología", text: "Web, IA, CRM y automatización para que ningún prospecto se pierda en el seguimiento." },
];

// Numeración continua (01–13) respetando el orden de los grupos.
const numbered = groups.flatMap((group) => services.filter((service) => service.group === group.name))
  .map((service, index) => ({ ...service, number: String(index + 1).padStart(2, "0") }));

export default function Services() {
  return (
    <section id="servicios" className="relative overflow-hidden bg-[#f1f2ef] py-24 text-slate-950 sm:py-32 lg:py-40">
      <div className="pointer-events-none absolute right-[-14rem] top-[-12rem] h-[42rem] w-[42rem] rounded-full border border-slate-900/[0.06]" />
      <div className="pointer-events-none absolute right-[-7rem] top-[-5rem] h-[27rem] w-[27rem] rounded-full border border-lime-600/[0.12]" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.32em] text-slate-500">
              <span className="h-px w-8 bg-lime-600" /> Servicios
            </p>
            <h2 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.9] tracking-[-0.065em] sm:text-6xl lg:text-8xl">
              Tres frentes. Un solo equipo.
            </h2>
          </div>
          <div className="lg:pb-2 lg:pl-10">
            <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Creatividad, performance y tecnología trabajando hacia el mismo objetivo. Activamos solo lo que tu negocio necesita, no un paquete cerrado.
            </p>
          </div>
        </div>

        <div className="mt-16 space-y-16">
          {groups.map((group, groupIndex) => (
            <div key={group.name}>
              <div className="flex flex-col gap-3 border-b-2 border-slate-950 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <h3 className="flex items-baseline gap-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                  <span className="font-mono text-xs font-medium tracking-normal text-lime-700">0{groupIndex + 1}</span>
                  {group.name}
                </h3>
                <p className="max-w-md text-sm leading-6 text-slate-500">{group.text}</p>
              </div>
              {numbered.filter((service) => service.group === group.name).map((service) => (
                  <article key={service.title} className="group relative border-b border-slate-300">
                    <div className="relative grid gap-3 px-1 py-7 transition-all duration-500 sm:gap-5 lg:grid-cols-[100px_1.05fr_0.9fr_48px] lg:items-center lg:gap-8 lg:px-5 lg:py-9">
                      <div className="absolute inset-0 -z-0 origin-left scale-x-0 bg-[#07100b] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100" />
                      <span className="relative z-10 font-mono text-xs font-medium text-slate-400 transition-colors duration-500 group-hover:text-lime-300">{service.number}</span>
                      <h4 className="relative z-10 max-w-2xl text-2xl font-semibold tracking-[-0.045em] text-slate-950 transition-colors duration-500 sm:text-3xl lg:leading-none group-hover:text-white">{service.title}</h4>
                      <p className="relative z-10 max-w-xl text-sm leading-6 text-slate-500 transition-colors duration-500 sm:text-[15px] lg:justify-self-end group-hover:text-white/60">{service.description}</p>
                      <span aria-hidden="true" className="relative z-10 hidden justify-self-end text-xl text-slate-300 transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-lime-300 sm:block">↗</span>
                    </div>
                  </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
