import type { Metadata } from "next";
import RoofingLeadForm from "./RoofingLeadForm";

export const metadata: Metadata = {
  title: "Roofing Lead Generation Systems | AdVibe",
  description:
    "A practical lead generation system for roofing contractors: Meta Ads, focused landing pages, lead qualification and follow-up.",
  alternates: { canonical: "https://www.advibeagencia.com/roofing-us" },
  openGraph: {
    title: "More Roofing Opportunities. A Clearer Follow-Up Process. | AdVibe",
    description:
      "See how AdVibe can structure a lead generation system for your roofing company.",
    url: "https://www.advibeagencia.com/roofing-us",
    siteName: "AdVibe",
    locale: "en_US",
    type: "website",
  },
};

const steps = [
  {
    number: "01",
    title: "Attract",
    description:
      "Campaigns on Facebook and Instagram built around your roofing services and service area.",
  },
  {
    number: "02",
    title: "Qualify",
    description:
      "A focused landing page and a short form collect the details your team needs to review each inquiry.",
  },
  {
    number: "03",
    title: "Follow up",
    description:
      "Organize incoming inquiries and give your team a clear next step to contact and evaluate each prospect.",
  },
];

const services = [
  "Roof replacement",
  "Roof repair",
  "Commercial roofing",
  "Storm damage inspection",
];

export default function RoofingUSPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#05080b] text-white">
      <header className="relative z-10 border-b border-white/10 bg-[#05080b]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" aria-label="AdVibe home" className="text-2xl font-black tracking-[-0.07em]">
            <span className="text-lime-300">Ad</span>Vibe
            <span className="ml-2 text-[9px] font-semibold tracking-[0.35em] text-slate-500">AGENCIA</span>
          </a>

        </div>
      </header>

      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_76%_18%,rgba(132,204,22,0.15),transparent_34%),radial-gradient(ellipse_at_8%_75%,rgba(14,116,144,0.12),transparent_30%)]" />
        <div className="mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-20 sm:pb-28 sm:pt-28 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/[0.06] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-lime-200 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
              Lead generation for roofing contractors
            </p>
            <h1 className="mt-7 max-w-4xl text-[3.25rem] font-semibold leading-[0.94] tracking-[-0.065em] sm:text-7xl lg:text-[5.3rem]">
              More roofing opportunities.
              <span className="block text-lime-300">A clearer path from click to conversation.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              AdVibe helps roofing companies structure their customer acquisition with Facebook and Instagram Ads, focused landing pages, lead qualification and organized follow-up.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#assessment" className="rounded-full bg-lime-300 px-7 py-4 text-sm font-bold text-slate-950 shadow-[0_12px_50px_rgba(163,230,53,0.14)] transition hover:-translate-y-0.5 hover:bg-lime-200">
                Request a free business assessment ↗
              </a>

            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
              <span>Meta Ads</span><span>Landing pages</span><span>Lead qualification</span><span>Follow-up systems</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-lime-300/[0.06] blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-[#0b1117]/95 p-5 shadow-2xl sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">The lead journey</p>
                  <p className="mt-1 text-lg font-semibold">A simple system. Built around your business.</p>
                </div>
                <span className="rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1.5 text-[10px] font-semibold text-lime-200">Process overview</span>
              </div>
              <div className="space-y-3 py-5">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-sm font-black text-blue-300">01</span>
                    <div><p className="font-semibold">Facebook & Instagram Ads</p><p className="mt-1 text-xs text-slate-500">Reach homeowners in your service area</p></div>
                  </div>
                </div>
                <div className="flex justify-center text-lime-300/70">↓</div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10 text-sm font-black text-lime-200">02</span>
                    <div><p className="font-semibold">Focused landing page</p><p className="mt-1 text-xs text-slate-500">Explain your service and capture inquiries</p></div>
                  </div>
                </div>
                <div className="flex justify-center text-lime-300/70">↓</div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-sm font-black text-violet-300">03</span>
                    <div><p className="font-semibold">Qualification & follow-up</p><p className="mt-1 text-xs text-slate-500">Review details and contact each prospect</p></div>
                  </div>
                </div>
              </div>
              <p className="border-t border-white/10 pt-4 text-xs leading-5 text-slate-500">
                Example workflow for illustration. The exact tools and integrations are defined for each business before launch.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-white/10 bg-[#090e13] px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">How the system works</p>
          <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">From the first ad to a follow-up your team can act on.</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="rounded-3xl border border-white/10 bg-white/[0.025] p-7 sm:p-8">
                <span className="font-mono text-sm text-lime-300">{step.number}</span>
                <h3 className="mt-8 text-2xl font-semibold">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-400">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">Built for roofing businesses</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">A practical digital system, not just more posts.</h2>
            <p className="mt-6 text-base leading-8 text-slate-400">
              We start by understanding your services, coverage area, current marketing and sales process. Then we map the right combination of creative, paid traffic and conversion tools.
            </p>
            <p className="mt-5 text-sm leading-7 text-slate-500">
              No guaranteed lead counts or invented case studies. We’ll show you the proposed process, explain what needs to be implemented and agree on the scope before work begins.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <div key={service} className="flex min-h-28 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-lime-300/30 text-lime-300">✓</span>
                <span className="font-medium text-slate-200">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="assessment" className="border-t border-white/10 bg-[#090e13] px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-10">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">Free business assessment</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl">Let’s map a better lead process for your roofing company.</h2>
            <p className="mt-6 text-base leading-8 text-slate-400">
              Tell us a little about your company. We’ll review the information and contact you to discuss whether the system is a fit.
            </p>
            <div className="mt-8 space-y-3 text-sm text-slate-400">
              <p><span className="mr-2 text-lime-300">✓</span> No-obligation first conversation</p>
              <p><span className="mr-2 text-lime-300">✓</span> A process tailored to your service area</p>
              <p><span className="mr-2 text-lime-300">✓</span> Clear scope before any commitment</p>
            </div>
          </div>
          <RoofingLeadForm />
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} AdVibe Agencia</span>
          <span>Creative · Performance · Technology</span>
          <a href="/privacy" className="hover:text-lime-300">Privacy Policy</a>
          <a href="/" className="hover:text-lime-300">advibeagencia.com</a>
        </div>
      </footer>
    </main>
  );
}
