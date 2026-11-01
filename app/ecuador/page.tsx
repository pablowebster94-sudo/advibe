import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Desarrollo web y marketing digital en Ecuador | AdVibe",
  description: "Páginas web, landing pages, ecommerce y sistemas de captación para empresas ecuatorianas. Diseño, Meta Ads y automatización con AdVibe.",
  alternates: { canonical: "https://www.advibeagencia.com/ecuador" },
  openGraph: { title: "AdVibe Ecuador | Desarrollo web y captación", description: "Creamos páginas web y sistemas digitales para empresas en Ecuador.", url: "https://www.advibeagencia.com/ecuador", siteName: "AdVibe", locale: "es_EC", type: "website" },
};

const services = [
  ["Páginas web corporativas", "Presenta tu empresa, servicios, equipo y diferenciadores con una web profesional, rápida y preparada para buscadores."],
  ["Landing pages", "Páginas enfocadas en una oferta, campaña o servicio, con formularios y llamadas a la acción claras."],
  ["Tiendas online y catálogos", "Organiza tus productos, facilita consultas y habilita una experiencia de compra digital."],
  ["Captación y automatización", "Conecta formularios, WhatsApp, campañas y seguimiento para no perder oportunidades."],
];

export default function EcuadorPage() {
  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/" className="text-2xl font-black tracking-tight"><span className="text-lime-300">Ad</span>Vibe</Link><nav className="flex gap-5 text-sm text-slate-400"><Link href="/usa" className="hover:text-white">United States</Link><Link href="/diagnostico?market=ecuador" className="text-lime-300 hover:text-lime-200">Solicitar propuesta ↗</Link></nav></div></header>
      <section className="relative overflow-hidden px-6 py-24 sm:py-32"><div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(120,217,79,0.14),transparent_30%),linear-gradient(135deg,#05070a,#071018)]" /><div className="relative mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">AdVibe · Ecuador</p><h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-7xl">Tu empresa necesita una web que trabaje por ella.</h1><p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">Diseñamos páginas web, landing pages y tiendas online para empresas que quieren proyectar confianza, explicar mejor sus servicios y convertir visitas en consultas.</p><div className="mt-10 flex flex-wrap gap-3"><Link href="/diagnostico?market=ecuador" className="rounded-full bg-lime-300 px-7 py-4 text-sm font-semibold text-slate-950 hover:bg-lime-200">Solicitar diagnóstico gratuito ↗</Link><Link href="/#trabajo" className="rounded-full border border-white/15 px-7 py-4 text-sm font-semibold text-white hover:border-lime-300/50">Ver proyectos</Link></div><p className="mt-8 text-xs uppercase tracking-[0.2em] text-slate-500">Gualaceo · Cuenca · Azuay · Ecuador</p></div></section>
      <section className="border-y border-white/10 bg-[#080d13] px-6 py-20"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">Soluciones digitales</p><h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">La solución correcta depende de lo que tu negocio necesita conseguir.</h2><div className="mt-12 grid gap-4 md:grid-cols-2">{services.map(([title,description],i)=><article key={title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8"><span className="font-mono text-xs text-lime-300">0{i+1}</span><h3 className="mt-5 text-2xl font-semibold">{title}</h3><p className="mt-4 leading-7 text-slate-400">{description}</p></article>)}</div></div></section>
      <section className="px-6 py-20"><div className="mx-auto flex max-w-7xl flex-col gap-7 rounded-[2rem] border border-lime-300/20 bg-lime-300/[0.05] p-8 sm:p-12"><p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">Hablemos de tu proyecto</p><h2 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">Cuéntanos qué quieres construir. Te ayudamos a definir el siguiente paso.</h2><Link href="/diagnostico?market=ecuador" className="w-fit rounded-full bg-lime-300 px-7 py-4 text-sm font-semibold text-slate-950 hover:bg-lime-200">Solicitar propuesta web ↗</Link></div></section>
      <footer className="border-t border-white/10 px-6 py-8 text-sm text-slate-500"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4"><span>© {new Date().getFullYear()} AdVibe Agencia</span><Link href="/" className="hover:text-white">Volver a AdVibe</Link></div></footer>
    </main>
  );
}
