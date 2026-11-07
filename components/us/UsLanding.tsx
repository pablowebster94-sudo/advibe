"use client";

import Link from "next/link";
import { useState } from "react";
import { usCopy as c, usWhatsAppLink } from "@/lib/us-content";
import { LangToggle, useLang } from "@/components/us/useLang";

export default function UsLanding() {
  const [lang, setLang] = useLang();
  const t = (x: { en: string; es: string }) => x[lang];
  const [form, setForm] = useState({ name: "", business: "", website: "", type: 0 });

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      `${t(c.contact.name)}: ${form.name}`,
      `${t(c.contact.business)}: ${form.business}`,
      form.website ? `Web: ${form.website}` : "",
      `${t(c.contact.type)}: ${t(c.contact.types[form.type])}`,
    ].filter(Boolean).join("\n");
    window.open(usWhatsAppLink(lang, lines), "_blank", "noopener");
  };

  return (
    <main lang={lang} className="min-h-screen overflow-x-hidden bg-[#06080b] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06080b]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/us" className="text-sm font-bold tracking-[0.18em]">ADVIBE <span className="text-lime-300">USA</span></Link>
          <nav className="hidden gap-6 text-sm text-white/70 md:flex">
            <a href="#services" className="hover:text-white">{t(c.nav.services)}</a>
            <a href="#packages" className="hover:text-white">{t(c.nav.packages)}</a>
            <a href="#demos" className="hover:text-white">{t(c.nav.demos)}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LangToggle lang={lang} onChange={setLang} />
            <a href="#contact" className="hidden rounded-full bg-lime-400 px-4 py-2 text-xs font-semibold text-black sm:inline-block">{t(c.nav.contact)}</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(circle_at_75%_20%,rgba(120,217,79,0.14),transparent_40%),radial-gradient(circle_at_10%_90%,rgba(36,86,145,0.2),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-lime-300/90">{t(c.hero.kicker)}</p>
          <h1 className="max-w-4xl text-[clamp(2.4rem,6vw,5.2rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
            {t(c.hero.title)} <span className="text-lime-300">{t(c.hero.titleAccent)}</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">{t(c.hero.lead)}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#contact" className="rounded-full bg-lime-400 px-7 py-4 text-center text-sm font-semibold text-black hover:bg-lime-300">{t(c.hero.cta)} ↗</a>
            <a href="#demos" className="rounded-full border border-white/20 px-7 py-4 text-center text-sm font-semibold hover:bg-white/10">{t(c.hero.cta2)}</a>
          </div>
          <p className="mt-6 text-xs text-white/50">{t(c.hero.note)}</p>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-white/10 bg-white/[0.02] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-lime-300/90">{t(c.problem.kicker)}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{t(c.problem.title)}</h2>
          </div>
          <ul className="grid gap-4">
            {c.problem.items.map((it, i) => (
              <li key={i} className="flex gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-300">
                <span className="font-mono text-lime-300">0{i + 1}</span>{t(it)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-lime-300/90">{t(c.services.kicker)}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">{t(c.services.title)}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {c.services.items.map((s, i) => (
              <article key={i} className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6">
                <p className="font-mono text-xs text-lime-300">0{i + 1}</p>
                <h3 className="mt-3 text-xl font-semibold">{t(s.title)}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{t(s.text)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="scroll-mt-20 bg-white px-4 py-16 text-[#0b0f14] sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-lime-700">{t(c.packages.kicker)}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">{t(c.packages.title)}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {c.packages.items.map((p) => {
              const featured = !!p.tag;
              return (
                <article key={p.price} className={`relative flex flex-col rounded-3xl border p-6 ${featured ? "border-[#0b0f14] bg-[#0b0f14] text-white" : "border-black/10"}`}>
                  {p.tag && <span className="absolute right-5 top-5 rounded-full bg-lime-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">{t(p.tag)}</span>}
                  <h3 className="text-xl font-semibold">{t(p.name)}</h3>
                  <p className={`mt-1 text-sm ${featured ? "text-white/60" : "text-black/50"}`}>{t(p.sub)}</p>
                  <p className="mt-6 text-5xl font-semibold tracking-[-0.04em]">{p.price}</p>
                  <ul className="mt-6 grid gap-2.5 text-sm">
                    {p.features.map((f, i) => <li key={i} className="flex gap-2"><span className={featured ? "text-lime-300" : "text-lime-700"}>✓</span>{t(f)}</li>)}
                  </ul>
                  <a href="#contact" className={`mt-8 rounded-full px-5 py-3 text-center text-sm font-semibold ${featured ? "bg-lime-400 text-black" : "border border-black/15 hover:bg-black/5"}`}>{t(c.hero.cta)}</a>
                </article>
              );
            })}
          </div>
          <p className="mt-6 max-w-3xl text-xs leading-5 text-black/55">{t(c.packages.note)}</p>
        </div>
      </section>

      {/* How */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-lime-300/90">{t(c.how.kicker)}</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">{t(c.how.title)}</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.how.steps.map((s, i) => (
              <li key={i} className="rounded-2xl border border-white/10 p-5">
                <p className="font-mono text-xs text-lime-300">STEP {i + 1}</p>
                <h3 className="mt-2 font-semibold">{t(s.title)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{t(s.text)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-3xl rounded-2xl border-l-4 border-lime-400 bg-white/[0.04] p-5 text-sm leading-6 text-slate-200">{t(c.how.rep)}</p>
        </div>
      </section>

      {/* Demos */}
      <section id="demos" className="scroll-mt-20 border-t border-white/10 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-lime-300/90">{t(c.demos.kicker)}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">{t(c.demos.title)}</h2>
          <p className="mt-3 text-sm text-white/50">{t(c.demos.disclaimer)}</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {c.demos.items.map((d) => (
              <Link key={d.href} href={`${d.href}?lang=${lang}`} className="group rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-6 transition hover:border-lime-300/60">
                <h3 className="text-2xl font-semibold">{t(d.title)}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{t(d.text)}</p>
                <span className="mt-6 inline-block text-sm font-semibold text-lime-300 group-hover:underline">{t(c.demos.open)} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white/[0.02] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-lime-300/90">{t(c.faq.kicker)}</p>
          <div className="mt-6 divide-y divide-white/10">
            {c.faq.items.map((f, i) => (
              <details key={i} className="group py-4">
                <summary className="cursor-pointer list-none font-semibold">{t(f.q)}</summary>
                <p className="mt-2 text-sm leading-6 text-slate-300">{t(f.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-lime-300/90">{t(c.contact.kicker)}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">{t(c.contact.title)}</h2>
            <p className="mt-4 text-slate-300">{t(c.contact.text)}</p>
          </div>
          <form onSubmit={send} className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            {(["name", "business", "website"] as const).map((k) => (
              <label key={k} className="grid gap-1.5 text-sm">
                <span className="text-white/70">{t(c.contact[k])}</span>
                <input
                  required={k !== "website"}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 outline-none focus:border-lime-300"
                />
              </label>
            ))}
            <label className="grid gap-1.5 text-sm">
              <span className="text-white/70">{t(c.contact.type)}</span>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: Number(e.target.value) })} className="rounded-xl border border-white/15 bg-black/40 px-4 py-3 outline-none focus:border-lime-300">
                {c.contact.types.map((ty, i) => <option key={i} value={i}>{t(ty)}</option>)}
              </select>
            </label>
            <button type="submit" className="mt-2 rounded-full bg-lime-400 px-6 py-4 text-sm font-semibold text-black hover:bg-lime-300">{t(c.contact.send)}</button>
          </form>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 text-xs text-white/50 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 sm:flex-row">
          <span>{t(c.footer.line)}</span>
          <Link href="/" className="hover:text-white">{t(c.footer.back)} →</Link>
        </div>
      </footer>
    </main>
  );
}
