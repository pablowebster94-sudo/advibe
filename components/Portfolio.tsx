import SectionHeading from "@/components/ui/SectionHeading";
import EventButton from "@/components/EventButton";

const projects = [
  { number: "01", title: "AM Motorsport", sector: "Automotriz", work: "Contenido + Publicidad", description: "Producción audiovisual y campañas enfocadas en mensajes, leads y oportunidades de venta.", mark: "AM" },
  { number: "02", title: "United Kingdom English Academy", sector: "Educación", work: "Contenido + Meta Ads", description: "Contenido y campañas para comunicar la oferta educativa y atraer potenciales estudiantes.", mark: "UK" },
  { number: "03", title: "CETAD San Lucas", sector: "Salud", work: "Branding + Contenido + Publicidad", description: "Identidad visual, contenido y campañas desarrolladas en distintas etapas de colaboración.", mark: "SL" },
  { number: "04", title: "Paola Migitama", sector: "Marca personal", work: "Contenido + Publicidad", description: "Contenido y apoyo publicitario para fortalecer la comunicación digital y generar oportunidades.", mark: "PM" },
];

export default function Portfolio() {
  return (
    <section id="portafolio" className="relative overflow-hidden bg-[#05070a] py-28 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="02 / Trabajo real" title="Ideas que salieron del estudio y llegaron al mercado." description="Proyectos reales de AdVibe. Mostramos qué hicimos, para quién y con qué objetivo, sin atribuirnos trabajos que no realizamos." />

        <div className="mt-16 overflow-hidden rounded-[2rem] border border-white/10">
          {projects.map((project) => (
            <article key={project.title} className="group relative border-b border-white/10 last:border-b-0">
              <div className="grid min-h-[300px] lg:grid-cols-[92px_1.15fr_0.85fr]">
                <div className="hidden border-r border-white/10 p-7 lg:block">
                  <span className="font-mono text-xs text-lime-300">{project.number}</span>
                </div>
                <div className="relative overflow-hidden p-7 sm:p-10 lg:p-12">
                  <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/[0.06] transition-transform duration-700 group-hover:scale-125" />
                  <div className="pointer-events-none absolute right-12 top-14 h-32 w-32 rounded-full bg-lime-300/[0.04] blur-3xl transition-all duration-700 group-hover:bg-lime-300/[0.1]" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">{project.sector}</span>
                      <span className="font-mono text-xs text-white/25 lg:hidden">{project.number}</span>
                    </div>
                    <h3 className="mt-16 max-w-2xl text-4xl font-semibold tracking-[-0.055em] text-white transition-transform duration-500 group-hover:translate-x-1 sm:text-6xl">{project.title}</h3>
                  </div>
                </div>
                <div className="flex flex-col justify-between border-t border-white/10 bg-white/[0.025] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-lime-300">Servicios realizados</span>
                    <p className="mt-5 text-xl font-medium leading-8 text-white sm:text-2xl">{project.work}</p>
                    <p className="mt-4 text-sm leading-7 text-slate-500">{project.description}</p>
                  </div>
                  <EventButton href="#diagnostico" eventName="portfolio_case_cta" eventParams={{ source: "portfolio", project: project.title }} className="mt-8 inline-flex w-fit items-center rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-lime-300">Quiero algo así <span className="ml-2">↗</span></EventButton>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-px w-0 bg-lime-300 transition-all duration-700 group-hover:w-full" />
            </article>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600">
          <span>AdVibe / Selected work</span>
          <span>04 proyectos</span>
        </div>
      </div>
    </section>
  );
}
