import Image from "next/image";
import Button from "@/components/ui/Button";

const links = [
  { label: "Soluciones", href: "#servicios" },
  { label: "Casos de éxito", href: "#portafolio" },
  { label: "Nuestra metodología", href: "#proceso" },
  { label: "Diagnóstico", href: "#contacto" },
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
    <footer className="border-t border-white/10 bg-black py-16">

      <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-3">

        <div>

          <Image
            src="/images/logo-advibe.png"
            alt="AdVibe Agencia"
            width={180}
            height={55}
            className="object-contain"
          />

          <p className="mt-6 leading-8 text-slate-400">
            Ayudamos a empresas a crecer mediante estrategia,
            creatividad y tecnología.
          </p>

          <p className="mt-6 text-sm text-slate-500">
            Gualaceo · Azuay · Ecuador
          </p>

        </div>

        <div>

          <h3 className="text-white font-semibold">
            Navegación
          </h3>

          <div className="mt-6 space-y-4">

            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block text-slate-400 hover:text-white transition"
              >
                {link.label}
              </a>
            ))}

          </div>

        </div>

        <div>

          <h3 className="text-white font-semibold">
            Hablemos
          </h3>

          <p className="mt-6 text-slate-400">
            +593 98 496 6335
          </p>

          <p className="mt-2 text-slate-400">
            hola@advibeagencia.com
          </p>

          <div className="mt-8 flex gap-3">

            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:bg-white/10 transition"
              >
                {link.icon}
              </a>
            ))}

          </div>

          <Button
            href="https://wa.me/593984966335?text=Hola,%20quiero%20agendar%20un%20diagnóstico."
            variant="primary"
            className="mt-8"
          >
            Agendar diagnóstico
          </Button>

        </div>

      </div>

      <div className="mt-16 border-t border-white/10 pt-8 text-center text-sm text-slate-500">
        © 2026 AdVibe Agencia. Todos los derechos reservados.
      </div>

    </footer>
  );
}