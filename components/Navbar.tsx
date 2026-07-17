import Button from "@/components/ui/Button";

const navLinks = [
  { label: "Servicios", href: "#servicios" },
  { label: "Por qué AdVibe", href: "#porque" },
  { label: "Contacto", href: "#contacto" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-3xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <a href="#hero" className="flex items-center gap-3 transition hover:opacity-90">
          <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-400/10 text-2xl shadow-[0_24px_80px_-50px_rgba(0,212,255,0.8)]">
            A
          </span>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
              AdVibe
            </p>
            <p className="text-xs text-slate-400">Agencia premium</p>
          </div>
        </a>

        <nav className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button href="https://wa.me/" variant="ghost" className="hidden md:inline-flex">
            WhatsApp
          </Button>
          <Button href="#agenda" variant="primary">
            Agenda una reunión
          </Button>
        </div>
      </div>
    </header>
  );
}
