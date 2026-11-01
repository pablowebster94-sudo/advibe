import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | AdVibe Agencia",
  description: "How AdVibe Agencia collects, uses and protects information submitted through its website.",
  alternates: { canonical: "https://www.advibeagencia.com/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#05080b] px-6 py-16 text-white">
      <article className="mx-auto max-w-3xl">
        <Link href="/roofing" className="text-sm text-lime-300 hover:text-lime-200">← Back to AdVibe</Link>
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.25em] text-lime-300">AdVibe Agencia</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-400">Last updated: October 31, 2026</p>
        <div className="mt-10 space-y-8 text-sm leading-7 text-slate-300">
          <section><h2 className="text-xl font-semibold text-white">1. Information we collect</h2><p className="mt-3">When you submit a business assessment or contact form, we may collect your name, company name, city and state, phone number, business email, role, roofing services, advertising status, goals, consent status and basic campaign attribution information such as UTM parameters.</p></section>
          <section><h2 className="text-xl font-semibold text-white">2. How we use information</h2><p className="mt-3">We use the information to respond to your request, assess whether our marketing services may fit your business, communicate with you, prepare proposals and improve our website and marketing.</p></section>
          <section><h2 className="text-xl font-semibold text-white">3. How information is submitted</h2><p className="mt-3">The roofing assessment form prepares a message and opens WhatsApp. You must press Send in WhatsApp to transmit the information to AdVibe. Do not submit sensitive personal information through this form.</p></section>
          <section><h2 className="text-xl font-semibold text-white">4. Analytics and advertising</h2><p className="mt-3">Our website may use analytics, cookies, URL campaign parameters and Meta advertising technologies, including the Meta Pixel, where configured. These technologies may help measure page visits and actions and improve advertising. You can manage cookies through your browser settings and applicable platform controls.</p></section>
          <section><h2 className="text-xl font-semibold text-white">5. Sharing and service providers</h2><p className="mt-3">We do not sell personal information. Information may be processed by service providers that help us operate communications, hosting, analytics or advertising services, subject to their applicable terms and privacy practices.</p></section>
          <section><h2 className="text-xl font-semibold text-white">6. Retention and security</h2><p className="mt-3">We retain information only as reasonably necessary to respond to requests, maintain business records, meet legal obligations and protect our services. We use reasonable safeguards, but no internet transmission or storage method can be guaranteed to be completely secure.</p></section>
          <section><h2 className="text-xl font-semibold text-white">7. Your choices and requests</h2><p className="mt-3">You may ask us to access, correct or delete information you have submitted, or to stop receiving marketing communications. Contact AdVibe through WhatsApp at +593 98 496 6335 and identify the request you made.</p></section>
          <section><h2 className="text-xl font-semibold text-white">8. Changes to this policy</h2><p className="mt-3">We may update this policy from time to time. The updated version will be published on this page with a revised date.</p></section>
        </div>
        <footer className="mt-14 border-t border-white/10 pt-6 text-xs text-slate-500">© {new Date().getFullYear()} AdVibe Agencia · <Link href="/roofing" className="hover:text-lime-300">Roofing services</Link></footer>
      </article>
    </main>
  );
}
