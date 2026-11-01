import EventButton from "@/components/EventButton";

const links = [
  { label: "Soluciones", href: "/#servicios" },
  { label: "Proyectos", href: "/casos" },
  { label: "Ecuador", href: "/ecuador" },
  { label: "United States", href: "/usa" },
  { label: "Diagnóstico", href: "/diagnostico" },
];

const serviceLinks = [
  { label: "Desarrollo web y landing pages", href: "/diagnostico?service=web" },
  { label: "Sistemas de captación", href: "/diagnostico?service=ads" },
  { label: "Producción audiovisual", href: "/diagnostico?service=video" },
  { label: "Soluciones para contratistas", href: "/usa" },
];

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com/advibe.agencia", icon: <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5Zm5.25-2.75a1.25 1.25 0 1 1-1.25 1.25Z" /></svg> },
  { label: "Facebook", href: "https://www.facebook.com/share/1DT1TqhpjU/", icon: <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M13 22v-9h3l.5-4H13V4.5c0-1.1.3-1.9 1.9-1.9H17V.1c-.3-.1-1.4-.1-2.6-.1-2.7 0-4.6 1.6-4.6 4.8V9H6.5v4H9.8v9h3.2Z" /></svg> },
];

function FooterLogo() {
  return <div aria-label="AdVibe Agencia" className="inline-flex flex-col items-center leading-none"><span className="text-[2.35rem] font-black tracking-[-0.075em] text-white"><span className="text-lime-400">Ad</span>Vibe</span><span className="mt-1 text-[0.52rem] font-medium tracking-[0.48em] text-slate-500">AGENCIA</span></div>;
}

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black py-16">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-3">
        <div>
          <FooterLogo />
          <p className="mt-6 max-w-sm leading-8 text-slate-400">Diseño web, estrategia de captación y tecnología para empresas que quieren crecer.</p>
          <p className="mt-6 text-sm text-slate-500">Ecuador · United States · Remote projects</p>
        </div>
        <div>
          <h3 className="font-semibold text-white">Explora AdVibe</h3>
          <div className="mt-6 space-y-4">{links.map((link) => <a key={link.label} href={link.href} className="block text-slate-400 transition hover:text-lime-300">{link.label}</a>)}</div>
          <h3 className="mt-10 font-semibold text-white">Soluciones</h3>
          <div className="mt-6 space-y-4">{serviceLinks.map((link) => <a key={link.href} href={link.href} className="block text-slate-400 transition hover:text-lime-300">{link.label}</a>)}</div>
        </div>
        <div>
          <h3 className="font-semibold text-white">Hablemos</h3>
          <p className="mt-6 text-slate-400">+593 98 496 6335</p>
          <p className="mt-2 text-slate-400">hola@advibeagencia.com</p>
          <div className="mt-8 flex gap-3">{socialLinks.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-lime-300/40 hover:bg-lime-300/10 hover:text-lime-300">{link.icon}</a>)}</div>
          <EventButton href="/diagnostico" eventName="footer_diagnostic_click" eventParams={{ source: "footer" }} leadOnClick className="mt-8 inline-flex items-center justify-center rounded-full border border-white/10 bg-white px-7 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-lime-200">Solicitar diagnóstico</EventButton>
        </div>
      </div>
      <div className="mt-16 border-t border-white/10 pt-8 text-center text-sm text-slate-500">© {new Date().getFullYear()} AdVibe Agencia. Todos los derechos reservados.</div>
    </footer>
  );
}
