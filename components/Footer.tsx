import Button from "@/components/ui/Button";

const links = [
  { label: "Servicios", href: "#servicios" },
  { label: "Proyectos", href: "#portafolio" },
  { label: "Proceso", href: "#proceso" },
  { label: "Contacto", href: "#agenda" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-slate-950/80 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-400/10 to-transparent" />
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-400/10 text-2xl text-cyan-300 shadow-[0_0_30px_rgba(0,212,255,0.15)]">A</span>
            <div>
              <p className="text-lg font-semibold text-white">AdVibe</p>
              <p className="text-sm text-slate-400">Agencia de marketing e IA</p>
            </div>
          </div>
          <p className="max-w-md text-sm leading-7 text-slate-400">
            Transformamos negocios con campañas inteligentes, automatización y diseño premium para audiencias exigentes.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="text-sm text-slate-300 transition hover:text-white">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex flex-col items-start gap-4 sm:items-end">
          <p className="text-sm text-slate-400">contacto@advibe.agency</p>
          <div className="flex gap-3">
            <Button href="https://wa.me/" variant="ghost" className="text-sm">
              WhatsApp
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} AdVibe. Todos los derechos reservados.
      </div>
    </footer>
  );
}
