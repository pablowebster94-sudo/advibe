import Link from "next/link";
import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import EventButton from "@/components/EventButton";

const projects = [
  { number: "01", title: "AM Motorsport", sector: "Automotriz", work: "Contenido + Publicidad", description: "Dirección audiovisual y contenido comercial para el lanzamiento del Polaris Slingshot Roush Edition.", image: "/videos/am-mini-cooper.jpg", slug: "am-motorsport" },
  { number: "02", title: "United Kingdom English Academy", sector: "Educación", work: "Contenido + Meta Ads", description: "Creatividad y campañas para comunicar una oferta y llevar potenciales estudiantes a conversación.", image: "/videos/aa-school.jpg", slug: "uk-english-academy" },
  { number: "03", title: "Kamauto", sector: "Automotriz", work: "Fotografía + Video", description: "Contenido visual comercial para comunicar vehículos y productos con una estética consistente.", image: "/videos/kamauto.jpg", slug: "kamauto" },
  { number: "04", title: "Muebles Ideal", sector: "Retail", work: "Foto + Video + Contenido", description: "Contenido comercial para presentar producto y fortalecer la comunicación digital.", image: "/videos/muebles.jpg", slug: "muebles-ideal" },
];

export default function Portfolio() {
  return (
    <section id="portafolio" className="relative overflow-hidden bg-[#05070a] py-28 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Casos" title="Proyectos completos, de la idea al resultado." description="Una selección de proyectos reales de AdVibe. Estrategia, creatividad, contenido y performance aplicados a objetivos concretos." />

        <div className="mt-16 overflow-hidden rounded-[2rem] border border-white/10">
          {projects.map((project) => (
            <article key={project.title} className="group relative border-b border-white/10 last:border-b-0">
              <div className="grid min-h-[300px] lg:grid-cols-[92px_1.15fr_0.85fr]">
                <div className="hidden border-r border-white/10 p-7 lg:block"><span className="font-mono text-xs text-lime-300">{project.number}</span></div>
                <div className="relative overflow-hidden p-7 sm:p-10 lg:p-12">
                  <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/[0.06] transition-transform duration-700 group-hover:scale-125" />
                  <div className="pointer-events-none absolute right-12 top-14 h-32 w-32 rounded-full bg-lime-300/[0.04] blur-3xl transition-all duration-700 group-hover:bg-lime-300/[0.1]" />
                  <div className="relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden">
                    <Image src={project.image} alt={`Producción audiovisual de AdVibe para ${project.title}`} fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover opacity-35 transition duration-700 group-hover:scale-105 group-hover:opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#05070a]/95 via-[#05070a]/65 to-[#05070a]/20" />
                    <div className="relative z-10 flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-300">{project.sector}</span><span className="font-mono text-xs text-white/50 lg:hidden">{project.number}</span></div>
                    <h3 className="relative z-10 mt-16 max-w-2xl text-4xl font-semibold tracking-[-0.055em] text-white transition-transform duration-500 group-hover:translate-x-1 sm:text-6xl">{project.title}</h3>
                  </div>
                </div>
                <div className="flex flex-col justify-between border-t border-white/10 bg-white/[0.025] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
                  <div><span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-lime-300">Servicios realizados</span><p className="mt-5 text-xl font-medium leading-8 text-white sm:text-2xl">{project.work}</p><p className="mt-4 text-sm leading-7 text-slate-500">{project.description}</p></div>
                  <Link href={`/casos/${project.slug}`} className="mt-8 inline-flex w-fit items-center rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-lime-300">Ver proyecto <span className="ml-2">↗</span></Link>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-px w-0 bg-lime-300 transition-all duration-700 group-hover:w-full" />
            </article>
          ))}
        </div>


        <div className="mt-24">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">Diseño y desarrollo web</p>
            <h3 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Experiencias digitales que también hablan por tu marca.</h3>
            <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">Sitios web y plataformas desarrollados por AdVibe para negocios de distintos sectores.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {[
              { name: "Paola Miguitama", type: "Marca personal · Sitio web", url: "https://paolamiguitama.com", initials: "PM", style: "from-rose-950 via-stone-900 to-black" },
              { name: "Étika", type: "Sitio web · Marca", url: "https://etika-rho.vercel.app", initials: "É", style: "from-emerald-950 via-slate-900 to-black" },
              { name: "AM Motorsport", type: "Automotriz · Sitio web", url: "https://am-motorsport.advibeagencia.com", initials: "AM", style: "from-red-950 via-zinc-900 to-black" },
              { name: "Melany González Joyería", type: "Joyería · Tienda digital", url: "https://melany-gonzalez-joyeria.vercel.app", initials: "MG", style: "from-amber-950 via-stone-900 to-black" },
            ].map((site) => (
              <a key={site.name} href={site.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025] transition duration-300 hover:-translate-y-1 hover:border-lime-300/40">
                <div className={`relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br ${site.style}`}>
                  <div className="absolute inset-5 rounded-xl border border-white/15 bg-black/20 shadow-2xl backdrop-blur-sm transition duration-500 group-hover:scale-[1.03]">
                    <div className="flex h-7 items-center gap-1.5 border-b border-white/10 px-3"><i className="h-1.5 w-1.5 rounded-full bg-white/30" /><i className="h-1.5 w-1.5 rounded-full bg-white/20" /><i className="h-1.5 w-1.5 rounded-full bg-white/20" /><span className="ml-2 h-1.5 w-1/3 rounded-full bg-white/10" /></div>
                    <div className="flex h-[calc(100%-1.75rem)] flex-col items-center justify-center">
                      <span className="text-5xl font-semibold tracking-[-0.06em] text-white/90 sm:text-6xl">{site.initials}</span>
                      <span className="mt-3 h-1 w-12 rounded-full bg-lime-300/80" />
                    </div>
                  </div>
                  <span className="absolute bottom-5 right-6 text-[9px] font-semibold uppercase tracking-[0.3em] text-white/45">AdVibe · Web project</span>
                </div>
                <div className="flex items-center justify-between gap-4 p-6">
                  <div><h4 className="text-lg font-semibold text-white">{site.name}</h4><p className="mt-1 text-sm text-slate-500">{site.type}</p></div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-lime-300 transition group-hover:border-lime-300 group-hover:bg-lime-300 group-hover:text-slate-950">↗</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-8 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600"><span>AdVibe / Selected work</span><span>{projects.length} destacados</span></div>
          <EventButton href="/casos" eventName="portfolio_view_all" eventParams={{ source: "home_portfolio" }} className="inline-flex w-fit items-center rounded-full border border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-300 transition hover:border-lime-300/40 hover:text-lime-300">Ver todos los casos <span className="ml-3">→</span></EventButton>
        </div>
      </div>
    </section>
  );
}
