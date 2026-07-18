import Button from "@/components/ui/Button";

const links = [
  { label: "Servicios", href: "#servicios" },
  { label: "Proyectos", href: "#portafolio" },
  { label: "Proceso", href: "#proceso" },
  { label: "Contacto", href: "#contacto" },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/advibe.agencia",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5Zm5.25-2.75a1.25 1.25 0 1 1-1.25 1.25 1.25 1.25 0 0 1 1.25-1.25Z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1DT1TqhpjU/",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
        <path d="M13 22v-9h3l.5-4H13V4.5c0-1.1.3-1.9 1.9-1.9H17V.1c-.3-.1-1.4-.1-2.6-.1-2.7 0-4.6 1.6-4.6 4.8V9H6.5v4H9.8v9h3.2Z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-slate-950/80 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-400/10 to-transparent" />
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 lg:flex-row lg:justify-between">
        <div className="max-w-md space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-400/10 text-2xl text-cyan-300 shadow-[0_0_30px_rgba(0,212,255,0.15)]">A</span>
            <div>
              <p className="text-lg font-semibold text-white">Advibe Agencia</p>
              <p className="text-sm text-slate-400">Marketing, IA y automatización</p>
            </div>
          </div>
          <p className="text-sm leading-7 text-slate-400">
            Creamos campañas, productos y experiencias digitales premium para marcas que quieren crecer con claridad y resultados.
          </p>
          <a href="https://advibe.agency" className="inline-flex text-sm font-medium text-cyan-300 transition hover:text-cyan-200">
            advibe.agency ↗
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="text-sm text-slate-300 transition hover:text-white">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex flex-col items-start gap-4 sm:items-end">
          <p className="text-sm text-slate-400">+593 98 496 6335</p>
          <p className="text-sm text-slate-400">Gualaceo, Azuay, Ecuador</p>
          <div className="flex flex-wrap gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-400/50 hover:bg-white/10 hover:text-white"
              >
                {link.icon}
              </a>
            ))}
            <Button href="https://wa.me/593984966335?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20sus%20servicios." variant="ghost" className="text-sm">
              WhatsApp
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-slate-500">
        © 2026 Advibe Agencia. Todos los derechos reservados.
      </div>
    </footer>
  );
}
