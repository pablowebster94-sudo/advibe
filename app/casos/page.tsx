import Link from "next/link";
import { caseStudies } from "@/lib/cases";

export const metadata = {
  title: "Casos | AdVibe Agencia",
  description: "Trabajo seleccionado de AdVibe: estrategia, creatividad, contenido, performance y tecnología.",
};

const filters = ["Todos", "Audiovisual", "Performance", "Digital", "Branding"];

export default function CasosPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-lime-300 selection:text-black">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-8">
          <Link href="/" className="text-2xl font-black tracking-[-0.07em]"><span className="text-lime-400">Ad</span>Vibe</Link>
          <nav className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/" className="transition hover:text-white">Inicio</Link>
            <a href="#trabajos" className="text-white">Casos</a>
            <Link href="/#contacto" className="rounded-full bg-lime-300 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-lime-200">Hablemos</Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 pb-24 pt-24 sm:px-8 sm:pt-32">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-lime-300/[0.06] blur-[140px]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.35em] text-lime-300">AdVibe / Selected work</p>
          <h1 className="max-w-5xl text-6xl font-semibold leading-[0.92] tracking-[-0.07em] sm:text-8xl lg:text-[9rem]">Trabajo que<br /><span className="text-slate-500">habla por nosotros.</span></h1>
          <div className="mt-10 flex max-w-3xl flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <p className="max-w-xl text-lg leading-8 text-slate-400">Estrategia, creatividad, contenido, performance y tecnología aplicados a marcas reales.</p>
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-slate-600">{caseStudies.length} proyectos seleccionados</span>
          </div>
        </div>
      </section>

      <section id="trabajos" className="mx-auto max-w-7xl px-6 pb-28 sm:px-8">
        <div className="mb-10 flex flex-wrap gap-2 border-b border-white/10 pb-6">
          {filters.map((filter, i) => <span key={filter} className={`rounded-full border px-4 py-2 text-xs font-semibold ${i === 0 ? "border-lime-300/40 bg-lime-300/10 text-lime-300" : "border-white/10 text-slate-500"}`}>{filter}</span>)}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {caseStudies.map((project, index) => (
            <Link key={project.slug} href={`/casos/${project.slug}`} className={`group block overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] ${index === 0 ? "md:col-span-2" : ""}`}>
              <div className={`relative overflow-hidden bg-gradient-to-br ${project.accent} ${index === 0 ? "aspect-[2/1]" : "aspect-[4/3]"}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(255,255,255,.08),transparent_30%)]" />
                <div className="absolute left-7 top-7 font-mono text-xs text-white/40">{project.number}</div>
                <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between gap-5">
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-lime-300">{project.sector}</p>
                    <h2 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{project.client}</h2>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/20 text-xl transition duration-500 group-hover:-rotate-45 group-hover:bg-lime-300 group-hover:text-black">↗</span>
                </div>
              </div>
              <div className="flex flex-col justify-between gap-5 p-7 sm:flex-row sm:items-end sm:p-9">
                <div><p className="max-w-2xl text-xl font-medium leading-8 text-white">{project.title}</p><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">{project.summary}</p></div>
                <div className="flex max-w-xs flex-wrap gap-2">{project.services.map((service) => <span key={service} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-slate-500">{service}</span>)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] px-6 py-28 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-lime-300">¿Tienes un proyecto?</p>
          <h2 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.06em] sm:text-7xl">No necesitas otra agencia.<br /><span className="text-slate-500">Necesitas una que entienda el negocio.</span></h2>
          <Link href="/#contacto" className="mt-10 inline-flex rounded-full bg-white px-7 py-4 text-sm font-bold text-slate-950 transition hover:bg-lime-300">Hablar con AdVibe <span className="ml-3">↗</span></Link>
        </div>
      </section>
    </main>
  );
}
