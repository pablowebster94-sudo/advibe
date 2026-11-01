import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Web Design & Lead Generation for Contractors | AdVibe",
  description: "Conversion-focused websites and lead generation systems for roofing, remodeling, painting and home service businesses across the United States.",
  alternates: { canonical: "https://www.advibeagencia.com/usa", languages: { "en-US": "https://www.advibeagencia.com/usa", "es-EC": "https://www.advibeagencia.com/ecuador" } },
  openGraph: { title: "AdVibe | Websites & Lead Generation for Contractors", description: "Websites and lead generation systems for contractors and home service businesses.", url: "https://www.advibeagencia.com/usa", siteName: "AdVibe", locale: "en_US", type: "website" },
};

const services = [
  ["Contractor websites", "A professional website that explains your services, builds trust and makes it easy for customers to request an estimate."],
  ["Landing pages", "Focused pages for roofing, remodeling, painting and other services, built around one clear conversion action."],
  ["Lead generation", "Connect paid traffic, landing pages and lead capture so potential customers have a clear next step."],
  ["Follow-up automation", "Organize incoming inquiries and support faster, more consistent follow-up with CRM and automation."],
];

export default function UnitedStatesPage() {
  return (
    <main lang="en" className="min-h-screen bg-[#05070a] text-white">
      <header className="border-b border-white/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><Link href="/" className="text-2xl font-black tracking-tight"><span className="text-lime-300">Ad</span>Vibe</Link><nav className="flex gap-5 text-sm text-slate-400"><Link href="/ecuador" className="hover:text-white">Ecuador</Link><Link href="/diagnostico?market=usa" className="text-lime-300 hover:text-lime-200">Get a project review ↗</Link></nav></div></header>
      <section className="relative overflow-hidden px-6 py-24 sm:py-32"><div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(120,217,79,0.14),transparent_30%),linear-gradient(135deg,#05070a,#071018)]" /><div className="relative mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">AdVibe · United States</p><h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-7xl">A better website should make it easier to win the next job.</h1><p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">We build professional websites, service landing pages and lead generation systems for contractors and home service businesses. Clear messaging, strong calls to action and a smoother path from visitor to estimate request.</p><div className="mt-10 flex flex-wrap gap-3"><Link href="/diagnostico?market=usa" className="rounded-full bg-lime-300 px-7 py-4 text-sm font-semibold text-slate-950 hover:bg-lime-200">Request a free project review ↗</Link><Link href="/#trabajo" className="rounded-full border border-white/15 px-7 py-4 text-sm font-semibold text-white hover:border-lime-300/50">View selected work</Link></div><p className="mt-8 text-xs uppercase tracking-[0.2em] text-slate-500">Roofing · Remodeling · Painting · HVAC · Home Services</p></div></section>
      <section className="border-y border-white/10 bg-[#080d13] px-6 py-20"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">What we build</p><h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">A practical digital system for your service business.</h2><div className="mt-12 grid gap-4 md:grid-cols-2">{services.map(([title,description],i)=><article key={title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8"><span className="font-mono text-xs text-lime-300">0{i+1}</span><h3 className="mt-5 text-2xl font-semibold">{title}</h3><p className="mt-4 leading-7 text-slate-400">{description}</p></article>)}</div></div></section>
      <section className="px-6 py-20"><div className="mx-auto flex max-w-7xl flex-col gap-7 rounded-[2rem] border border-lime-300/20 bg-lime-300/[0.05] p-8 sm:p-12"><p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">Let’s talk about your business</p><h2 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">Tell us what you do. We’ll help map the right website and lead flow.</h2><Link href="/diagnostico?market=usa" className="w-fit rounded-full bg-lime-300 px-7 py-4 text-sm font-semibold text-slate-950 hover:bg-lime-200">Request a project review ↗</Link></div></section>
      <footer className="border-t border-white/10 px-6 py-8 text-sm text-slate-500"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4"><span>© {new Date().getFullYear()} AdVibe Agency</span><Link href="/" className="hover:text-white">Back to AdVibe</Link></div></footer>
    </main>
  );
}
