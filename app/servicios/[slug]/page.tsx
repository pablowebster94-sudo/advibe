import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Showreel from "@/components/Showreel";
import { getLanding, landings } from "@/lib/landings";
import { reelsById } from "@/lib/reels";

const siteUrl = "https://www.advibeagencia.com";
const whatsapp = "593984966335";

export function generateStaticParams() {
  return landings.map((landing) => ({ slug: landing.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const landing = getLanding(slug);
  if (!landing) return {};
  const url = `${siteUrl}/servicios/${landing.slug}`;
  return {
    title: landing.metaTitle,
    description: landing.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: landing.metaTitle, description: landing.metaDescription, url, siteName: "AdVibe Agencia", locale: "es_EC", type: "website" },
  };
}

export default async function ServicioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const landing = getLanding(slug);
  if (!landing) notFound();

  const whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(landing.whatsappText)}`;
  const others = landings.filter((item) => item.slug !== landing.slug);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: landing.keyword,
      serviceType: landing.keyword,
      url: `${siteUrl}/servicios/${landing.slug}`,
      description: landing.metaDescription,
      provider: {
        "@type": "ProfessionalService",
        name: "AdVibe Agencia",
        url: siteUrl,
        telephone: "+593984966335",
        address: { "@type": "PostalAddress", addressLocality: "Gualaceo", addressRegion: "Azuay", addressCountry: "EC" },
      },
      areaServed: ["Gualaceo", "Cuenca", "Paute", "Chordeleg", "Sígsig", "Azuay"].map((name) => ({ "@type": "Place", name })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: landing.faq.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: siteUrl },
        { "@type": "ListItem", position: 2, name: landing.keyword, item: `${siteUrl}/servicios/${landing.slug}` },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#05070a] text-white selection:bg-lime-300 selection:text-black">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05070a]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-black tracking-[-0.07em]"><span className="text-lime-400">Ad</span>Vibe</Link>
          <nav className="flex items-center gap-5 text-sm text-slate-400">
            <Link href="/casos" className="hidden transition hover:text-white sm:inline">Casos</Link>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded-full bg-lime-300 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-lime-200">Escríbenos</a>
          </nav>
        </div>
      </header>

      <section className="px-6 pb-16 pt-16 sm:pt-24">
        <div className="mx-auto max-w-5xl">
          <nav aria-label="Ruta" className="mb-8 text-xs text-slate-500"><Link href="/" className="hover:text-white">Inicio</Link> / <span>{landing.keyword}</span></nav>
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">{landing.eyebrow}</p>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-6xl">{landing.h1}</h1>
          <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300">{landing.intro}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full bg-lime-400 px-7 py-4 text-sm font-semibold text-[#07101a] hover:bg-lime-300">Escríbenos por WhatsApp ↗</a>
            <Link href="/diagnostico" className="inline-flex items-center justify-center rounded-full border border-white/10 px-7 py-4 text-sm font-semibold text-white hover:bg-white/[0.06]">Pedir diagnóstico gratuito</Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/[0.025] p-8 sm:p-12">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{landing.problemTitle}</h2>
          <ul className="mt-8 space-y-4">
            {landing.problems.map((problem) => (
              <li key={problem} className="flex gap-3 text-slate-300"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-300" />{problem}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{landing.offerTitle}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {landing.offer.map((item) => (
              <div key={item.title} className="rounded-[1.6rem] border border-white/10 p-7">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Showreel reels={reelsById(landing.reelIds)} eyebrow="Trabajo real" title="Videos que hemos producido para negocios del Azuay." id="videos" />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Preguntas frecuentes</h2>
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {landing.faq.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="cursor-pointer list-none text-base font-semibold text-white">{item.question}</summary>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-lime-300 p-10 text-slate-950 sm:p-14">
          <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">¿Hablamos de tu negocio?</h2>
          <p className="mt-4 max-w-2xl text-base leading-7">Escríbenos por WhatsApp y te respondemos con ideas concretas para tu caso. Estamos en Gualaceo y atendemos todo el Azuay.</p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-full bg-slate-950 px-7 py-4 text-sm font-semibold text-white hover:bg-slate-800">Escribir por WhatsApp ↗</a>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">También te puede interesar</p>
          <ul className="mt-5 flex flex-wrap gap-3">
            {others.map((item) => (
              <li key={item.slug}><Link href={`/servicios/${item.slug}`} className="inline-block rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-lime-300/40 hover:text-lime-300">{item.keyword.charAt(0).toUpperCase() + item.keyword.slice(1)}</Link></li>
            ))}
          </ul>
          <p className="mt-10 text-xs text-slate-600">AdVibe Agencia · Gualaceo, Azuay, Ecuador · +593 98 496 6335</p>
        </div>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </main>
  );
}
