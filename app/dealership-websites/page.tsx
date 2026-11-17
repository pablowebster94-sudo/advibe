import type { Metadata } from "next";
import Link from "next/link";

const whatsapp = "https://wa.me/593984966335?text=Hi%20AdVibe%2C%20I%27m%20interested%20in%20the%20%24399%20dealership%20website%20launch%20offer.%20I%27d%20like%20to%20see%20a%20demo.";

export const metadata: Metadata = {
  title: "Dealership Website Launch Offer | AdVibe",
  description:
    "A professional, mobile-ready website for independent used car dealerships. Showcase your inventory and make it easy for buyers to call or message. Launch offer $399.",
  alternates: { canonical: "https://www.advibeagencia.com/dealership-websites" },
  openGraph: {
    title: "Your dealership deserves more than a social media page | AdVibe",
    description:
      "A professional website with vehicle inventory, photos and direct contact. Launch offer $399.",
    url: "https://www.advibeagencia.com/dealership-websites",
    siteName: "AdVibe",
    type: "website",
  },
};

const benefits = [
  ["01", "Your inventory, organized", "Show vehicles in a clean inventory grid with photos and individual detail pages."],
  ["02", "Built for every screen", "A responsive experience designed for shoppers browsing on phones, tablets and desktops."],
  ["03", "Make the next step obvious", "Click-to-call and messaging links help interested buyers contact your dealership."],
];

const included = [
  "Professional dealership website design",
  "Vehicle inventory grid with photos",
  "Individual vehicle detail pages",
  "Click-to-call and messaging buttons",
  "Mobile-responsive layout",
  "Basic on-page SEO setup",
  "Launch assistance",
];

const faqs = [
  ["How long does it take?", "The delivery schedule is confirmed after we review your dealership, inventory and the materials you provide. We start the build once the scope and content are approved."],
  ["Do I need to know how to code?", "No. AdVibe handles the website setup. We guide you through the information and photos needed to launch."],
  ["Can I update vehicle listings later?", "Yes. We will agree on the inventory update workflow before the project starts. Automated feeds or complex dealer-management integrations are quoted separately."],
  ["What is included in the $399 offer?", "The launch package includes the website design, inventory presentation, vehicle detail pages, contact actions, responsive layout and initial launch assistance listed on this page."],
  ["Are domain, hosting and ongoing updates included?", "Domain registration, hosting renewals, paid third-party services, ongoing maintenance and advanced integrations are not included unless they are specifically listed in your written proposal."],
  ["How do I pay?", "We confirm the payment method, schedule and project scope in writing before work begins. No payment is collected through this page."],
];

function Check() {
  return <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-300/60 text-amber-300" aria-hidden="true">✓</span>;
}

function InventoryPreview() {
  const cars = [
    { name: "2021 Luxury SUV", price: "$28,900", tag: "LOW MILES", tone: "from-slate-500/40 to-slate-950" },
    { name: "2020 Sport Sedan", price: "$22,500", tag: "CLEAN TITLE", tone: "from-red-500/40 to-slate-950" },
    { name: "2022 Family SUV", price: "$31,900", tag: "JUST ARRIVED", tone: "from-zinc-400/40 to-slate-950" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[610px]">
      <div className="absolute -inset-8 rounded-[3rem] bg-amber-400/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.6rem] border border-white/15 bg-[#101113] shadow-2xl shadow-black/60">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-[10px] tracking-wide text-white/35">YOURDEALERSHIP.COM</span>
        </div>
        <div className="relative min-h-[190px] overflow-hidden bg-[radial-gradient(ellipse_at_70%_45%,rgba(212,166,74,.22),transparent_38%),linear-gradient(120deg,#17191d,#08090b)] px-6 py-7 sm:px-8">
          <div className="absolute -right-5 bottom-0 h-28 w-64 rounded-t-[55%] border border-white/10 bg-gradient-to-b from-zinc-500/20 to-black/70 sm:h-36 sm:w-80" />
          <div className="relative z-10 max-w-[260px]">
            <p className="text-[9px] font-semibold uppercase tracking-[.28em] text-amber-300">Find your next ride</p>
            <p className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">The right car.<br/>The right deal.</p>
            <div className="mt-4 inline-flex rounded-md bg-amber-300 px-4 py-2 text-[10px] font-bold text-black">BROWSE INVENTORY</div>
          </div>
          <div className="absolute bottom-5 right-7 h-12 w-36 rounded-[50%] border-t-4 border-zinc-300/70 bg-gradient-to-b from-zinc-500 to-zinc-950 shadow-xl sm:right-12 sm:h-16 sm:w-48">
            <div className="absolute left-8 top-1 h-5 w-16 rounded-t-full border border-white/20 bg-slate-900 sm:left-11 sm:h-7 sm:w-24" />
            <div className="absolute -bottom-2 left-5 h-5 w-5 rounded-full border-4 border-zinc-700 bg-black sm:left-7 sm:h-6 sm:w-6" />
            <div className="absolute -bottom-2 right-5 h-5 w-5 rounded-full border-4 border-zinc-700 bg-black sm:right-7 sm:h-6 sm:w-6" />
          </div>
        </div>
        <div className="bg-[#f4f3ef] px-4 py-5 text-slate-950 sm:px-6">
          <div className="flex items-end justify-between gap-3">
            <div><p className="text-[9px] font-bold uppercase tracking-[.22em] text-amber-700">Explore the lot</p><h3 className="mt-1 text-lg font-bold tracking-tight sm:text-xl">Available inventory</h3></div>
            <span className="rounded-full border border-slate-300 px-3 py-1 text-[9px] font-semibold text-slate-600">VIEW ALL →</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {cars.map((car) => (
              <div key={car.name} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className={`relative h-16 bg-gradient-to-br ${car.tone} sm:h-24`}>
                  <div className="absolute bottom-3 left-2 right-2 h-5 rounded-[50%] border-t-2 border-white/60 bg-slate-950/80 sm:bottom-4 sm:h-7" />
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[6px] font-bold tracking-wide text-white sm:text-[7px]">{car.tag}</span>
                </div>
                <div className="p-2 sm:p-3"><p className="truncate text-[8px] font-semibold sm:text-[10px]">{car.name}</p><p className="mt-1 text-[9px] font-bold text-amber-700 sm:text-xs">{car.price}</p><div className="mt-2 h-1 w-4/5 rounded bg-slate-200" /></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[8px] text-slate-400">Illustrative demo layout. Vehicle listings and prices are placeholders.</p>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-3 rounded-xl border border-white/15 bg-[#171819] px-4 py-3 shadow-xl sm:-left-8">
        <p className="text-[8px] uppercase tracking-[.2em] text-slate-400">Launch offer</p>
        <p className="mt-0.5 text-xl font-bold text-amber-300">$399 <span className="text-xs font-normal text-white/40">one-time</span></p>
      </div>
    </div>
  );
}

export default function DealershipWebsitesPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070809] text-white selection:bg-amber-300 selection:text-black">
      <header className="border-b border-white/10 bg-black/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="text-2xl font-black tracking-[-0.08em]"><span className="text-amber-300">Ad</span>Vibe</Link>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[.24em] text-white/45 sm:block">Websites for independent dealerships</span>
          <a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-full border border-amber-300/50 px-4 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-300 hover:text-black">Request a demo ↗</a>
        </div>
      </header>

      <section className="relative px-5 pb-24 pt-16 sm:px-8 sm:pb-32 sm:pt-24">
        <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-amber-300/[.07] blur-[100px]" />
        <div className="pointer-events-none absolute right-0 top-40 h-96 w-96 rounded-full bg-amber-100/[.04] blur-[110px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.02fr_.98fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/[.07] px-4 py-2 text-[10px] font-bold uppercase tracking-[.22em] text-amber-200"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Limited launch offer</div>
            <h1 className="mt-7 max-w-3xl text-[clamp(2.8rem,7vw,5.8rem)] font-semibold leading-[.94] tracking-[-.065em]">Your inventory online.<br/><span className="text-amber-300">Your dealership, elevated.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">A professional website built to showcase your vehicles, build buyer confidence and turn online interest into calls and messages.</p>
            <div className="mt-8 flex flex-wrap items-end gap-x-5 gap-y-2">
              <div><p className="text-[9px] font-bold uppercase tracking-[.24em] text-amber-200/70">Launch package</p><p className="mt-1 text-6xl font-bold tracking-[-.07em] text-amber-300 sm:text-7xl">$399</p></div>
              <p className="pb-2 text-xs text-slate-400">One-time project price<br/>Scope confirmed before work begins</p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full bg-amber-300 px-7 py-4 text-sm font-bold text-black shadow-lg shadow-amber-300/15 transition hover:-translate-y-0.5 hover:bg-amber-200">Get a free demo <span className="ml-3">↗</span></a>
              <a href="#included" className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-4 text-sm font-semibold text-white transition hover:border-amber-300/60 hover:text-amber-200">See what’s included</a>
            </div>
            <p className="mt-5 text-[10px] leading-5 text-slate-500">No payment is collected on this page. We confirm your project scope and payment terms before starting.</p>
          </div>
          <InventoryPreview />
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[.025] px-5 py-6 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 text-center sm:grid-cols-3 sm:text-left">
          {["Independent used car dealers", "Built mobile-first", "Direct buyer contact"].map((item) => <p key={item} className="text-xs font-semibold tracking-wide text-slate-300"><span className="mr-2 text-amber-300">✦</span>{item}</p>)}
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-bold uppercase tracking-[.28em] text-amber-300">Why your own website</p>
          <div className="mt-5 grid gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <h2 className="max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-6xl">Give every vehicle a better place to be discovered.</h2>
            <div className="grid gap-7 sm:grid-cols-3">
              {benefits.map(([number, title, body]) => <div key={number} className="border-t border-white/15 pt-5"><p className="font-mono text-xs text-amber-300">{number}</p><h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{body}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="included" className="border-y border-white/10 bg-[#101112] px-5 py-24 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.9fr_1.1fr]">
          <div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-amber-300">The $399 launch package</p><h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-.06em] sm:text-6xl">Everything needed to get your dealership online.</h2><p className="mt-6 max-w-md text-sm leading-7 text-slate-400">A focused website package for independent dealerships that need a professional online showroom—not a complicated custom platform.</p><a href={whatsapp} target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-full bg-amber-300 px-6 py-3.5 text-sm font-bold text-black transition hover:bg-amber-200">Request your demo ↗</a></div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 sm:p-9">
            <div className="flex items-center justify-between border-b border-white/10 pb-5"><p className="text-sm font-semibold">Included in your project</p><span className="text-xs font-bold text-amber-300">$399</span></div>
            <ul className="mt-2 divide-y divide-white/10">{included.map((item) => <li key={item} className="flex gap-3 py-4 text-sm text-slate-200"><Check/>{item}</li>)}</ul>
            <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-4"><p className="text-xs font-semibold text-amber-200">Clear scope. No surprises.</p><p className="mt-2 text-xs leading-6 text-slate-400">Domain registration, hosting renewals, paid third-party services, ongoing maintenance, automated inventory feeds and advanced integrations are quoted separately when needed.</p></div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-amber-300">Automotive experience</p><h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-.06em] sm:text-5xl">We understand how to present vehicles online.</h2><p className="mt-5 text-sm leading-7 text-slate-400">AdVibe has worked on automotive content and campaigns, including AM Motorsport. Explore that project to see our automotive creative work.</p><Link href="/casos/am-motorsport" className="mt-6 inline-flex text-sm font-semibold text-amber-200 hover:text-amber-100">View AM Motorsport project ↗</Link><p className="mt-5 text-[10px] leading-5 text-slate-600">AM Motorsport is shown as automotive creative experience, not as a claim that this exact $399 website package was delivered for that client.</p></div>
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.06] to-transparent p-7 sm:p-10">
              <p className="text-[10px] font-bold uppercase tracking-[.25em] text-slate-500">A simple process</p>
              <div className="mt-7 grid gap-7 sm:grid-cols-3">
                {[["01","Tell us about your lot","Share your dealership name, location and current inventory."],["02","Review your demo","We align the design and project scope before production."],["03","Launch your website","We build, review and publish once the agreed content is ready."]].map(([n,t,d]) => <div key={n}><p className="font-mono text-sm text-amber-300">{n}</p><h3 className="mt-4 text-lg font-semibold">{t}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{d}</p></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[.025] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-[10px] font-bold uppercase tracking-[.28em] text-amber-300">Frequently asked questions</p>
          <h2 className="mt-5 text-center text-4xl font-semibold tracking-[-.06em] sm:text-5xl">Before you get started.</h2>
          <div className="mt-12 divide-y divide-white/10 border-y border-white/10">{faqs.map(([q,a]) => <details key={q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left text-sm font-semibold text-white">{q}<span className="text-xl font-light text-amber-300 transition group-open:rotate-45">+</span></summary><p className="max-w-3xl pt-4 text-sm leading-7 text-slate-400">{a}</p></details>)}</div>
        </div>
      </section>

      <section className="relative overflow-hidden px-5 py-24 text-center sm:px-8 sm:py-32">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/[.08] blur-[100px]" />
        <div className="relative mx-auto max-w-4xl"><p className="text-[10px] font-bold uppercase tracking-[.28em] text-amber-300">Your next customer is already online</p><h2 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-7xl">Give them a website worth stopping for.</h2><p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-slate-400">Tell us about your dealership and request a free concept demo. No obligation to buy.</p><a href={whatsapp} target="_blank" rel="noreferrer" className="mt-9 inline-flex rounded-full bg-amber-300 px-8 py-4 text-sm font-bold text-black shadow-lg shadow-amber-300/20 transition hover:-translate-y-0.5 hover:bg-amber-200">Get a free demo ↗</a><p className="mt-6 text-[10px] text-slate-600">AdVibe Agency · Website development for independent dealerships</p></div>
      </section>

      <footer className="border-t border-white/10 px-5 py-7 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row"><Link href="/" className="text-lg font-black tracking-[-.08em] text-white"><span className="text-amber-300">Ad</span>Vibe</Link><p>© {new Date().getFullYear()} AdVibe Agency. All rights reserved.</p><Link href="/casos/am-motorsport" className="hover:text-amber-200">Automotive project ↗</Link></div></footer>
    </main>
  );
}
