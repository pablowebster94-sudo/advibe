import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | AdVibe Agencia",
  description: "How AdVibe Agencia collects, uses and protects the information you share with us.",
  alternates: { canonical: "/privacy" },
};

const updated = "November 6, 2026";
const email = "hola@advibeagencia.com";

const sections = [
  {
    title: "Who we are",
    body: [
      "AdVibe Agencia (\"AdVibe\", \"we\", \"us\") is a digital marketing agency based in Cuenca, Ecuador. We build websites and manage Facebook, Instagram and Google advertising for businesses in Ecuador and the United States.",
    ],
  },
  {
    title: "Information we collect",
    body: [
      "When you fill out one of our forms (on our website or in a Facebook or Instagram lead form), we collect the information you choose to give us, such as your name, phone number, email address, business name and your answers to the form's questions.",
      "When you visit our website, we and our advertising partners (such as Meta) may use cookies and similar technologies to measure visits and the results of our ads.",
    ],
  },
  {
    title: "How we use it",
    body: [
      "We use your information only to contact you about the service you asked for (for example, your free review or website mock-up), to answer your questions, to send you a proposal if you request one, and to measure and improve our own advertising.",
    ],
  },
  {
    title: "Who we share it with",
    body: [
      "We do not sell or rent your personal information. We only share it with people who work on your request (our team and our local representative) and with service providers we use to run our business, such as Meta, Google and our email and storage providers, under their own privacy terms. We may also disclose it if the law requires us to.",
    ],
  },
  {
    title: "How long we keep it",
    body: [
      "We keep your information for as long as we need it to follow up on your request or provide our services, and for up to 24 months after our last contact, unless you ask us to delete it sooner.",
    ],
  },
  {
    title: "Your choices",
    body: [
      `You can ask us at any time to see, correct or delete your information, or to stop contacting you. Just email ${email} or reply to any message from us and we'll take care of it.`,
    ],
  },
  {
    title: "Changes",
    body: [
      "If we change this policy, we will post the new version on this page with a new date.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-lime-300 selection:text-black">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5 sm:px-8">
          <Link href="/" className="text-2xl font-black tracking-[-0.07em]"><span className="text-lime-400">Ad</span>Vibe</Link>
          <a href="#es" className="text-sm text-slate-400 transition hover:text-white">Español</a>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.35em] text-lime-300">Last updated: {updated}</p>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Privacy Policy</h1>

        {sections.map((section) => (
          <section key={section.title} className="mt-10">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            {section.body.map((text) => (
              <p key={text} className="mt-3 leading-7 text-slate-300">{text}</p>
            ))}
          </section>
        ))}

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-3 leading-7 text-slate-300">
            AdVibe Agencia · Cuenca, Ecuador · <a href={`mailto:${email}`} className="text-lime-300 underline">{email}</a>
          </p>
        </section>

        <section id="es" className="mt-16 border-t border-white/10 pt-10">
          <h2 className="text-2xl font-semibold">Resumen en español</h2>
          <p className="mt-3 leading-7 text-slate-300">
            AdVibe Agencia (Cuenca, Ecuador) solo usa los datos que nos das en nuestros formularios (nombre, teléfono, correo, empresa y tus respuestas) para contactarte sobre lo que pediste y medir nuestra publicidad. No vendemos ni alquilamos tus datos. Solo los compartimos con nuestro equipo y con los proveedores que usamos para trabajar (como Meta y Google). Los guardamos hasta 24 meses después del último contacto. Puedes pedirnos verlos, corregirlos o borrarlos en cualquier momento escribiendo a <a href={`mailto:${email}`} className="text-lime-300 underline">{email}</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
