import Link from "next/link";
import { notFound } from "next/navigation";
import { caseStudies, getCaseStudy } from "@/lib/cases";

export function generateStaticParams() {
  return caseStudies.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getCaseStudy(slug);
  return { title: project ? `${project.client} | AdVibe Agencia` : "Caso | AdVibe Agencia", description: project?.summary };
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getCaseStudy(slug);
  if (!project) notFound();

  const currentIndex = caseStudies.findIndex((item) => item.slug === slug);
  const next = caseStudies[(currentIndex + 1) % caseStudies.length];

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-lime-300 selection:text-black">
      <header className="border-b border-white/10 bg-[#050505]/90 px-6 py-5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-[-0.07em]"><span className="text-lime-400">Ad</span>Vibe</Link>
          <Link href="/casos" className="text-sm text-slate-400 transition hover:text-white">← Todos los casos</Link>
        </div>
      </header>

      <section className="px-6 pb-24 pt-20 sm:px-8 sm:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-slate-500"><span className="text-lime-300">{project.number}</span><span>/</span><span>{project.sector}</span></div>
          <h1 className="mt-8 max-w-5xl text-6xl font-semibold leading-[0.92] tracking-[-0.07em] sm:text-8xl lg:text-[7.5rem]">{project.client}</h1>
          <p className="mt-8 max-w-3xl text-2xl leading-10 text-slate-400 sm:text-3xl">{project.title}</p>
          <div className={`relative mt-16 aspect-[16/8] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${project.accent}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,.1),transparent_28%),linear-gradient(120deg,transparent_30%,rgba(255,255,255,.03))]" />
            <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between"><span className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">AdVibe / {project.sector}</span><span className="text-5xl font-light tracking-[-0.06em] text-white/20 sm:text-8xl">{project.number}</span></div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 px-6 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_2fr]">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime-300">El desafío</p>
          <p className="text-2xl leading-10 text-slate-200 sm:text-3xl">{project.challenge}</p>
        </div>
      </section>

      <section className="px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2">
            <div><p className="font-mono text-xs uppercase tracking-[0.3em] text-lime-300">El sistema AdVibe</p><h2 className="mt-6 text-5xl font-semibold tracking-[-0.06em] sm:text-6xl">Estrategia que se convierte en ejecución.</h2></div>
            <div><p className="text-xl leading-9 text-slate-400">{project.solution}</p><div className="mt-8 flex flex-wrap gap-2">{project.services.map((service) => <span key={service} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-300">{service}</span>)}</div></div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-3">
            {["ESTRATEGIA", "CREATIVIDAD", "DISTRIBUCIÓN"].map((label, index) => <div key={label} className="aspect-square rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-7"><span className="font-mono text-xs text-lime-300">0{index + 1}</span><div className="flex h-full items-end"><h3 className="text-3xl font-semibold tracking-[-0.05em]">{label}</h3></div></div>)}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] px-6 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_2fr]"><p className="font-mono text-xs uppercase tracking-[0.3em] text-lime-300">Resultado / impacto</p><p className="text-2xl leading-10 text-slate-300 sm:text-3xl">{project.outcome}</p></div>
      </section>

      <section className="px-6 py-28 sm:px-8"><div className="mx-auto max-w-7xl"><p className="font-mono text-xs uppercase tracking-[0.3em] text-slate-600">Siguiente caso</p><Link href={`/casos/${next.slug}`} className="group mt-6 block border-b border-white/10 pb-8"><div className="flex items-end justify-between gap-5"><h2 className="text-5xl font-semibold tracking-[-0.06em] transition group-hover:text-lime-300 sm:text-7xl">{next.client}</h2><span className="text-3xl transition group-hover:-rotate-45">↗</span></div></Link><Link href="/#contacto" className="mt-12 inline-flex rounded-full bg-lime-300 px-7 py-4 text-sm font-bold text-slate-950 transition hover:bg-lime-200">Implementar algo similar <span className="ml-3">↗</span></Link></div></section>
    </main>
  );
}
