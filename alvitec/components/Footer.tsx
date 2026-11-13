import { nav, site } from "@/lib/site";
import { WA_DEFAULT, waLink } from "@/lib/whatsapp";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "./icons";

export function Footer() {
  return (
    <footer className="on-dark border-t border-white/15 bg-navy pb-28 pt-16 text-white sm:pb-16">
      <div className="container-site">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-display text-3xl font-bold tracking-[0.2em]">ALVITEC</p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">{site.tagline}</p>
            <p className="mt-6 max-w-sm font-display text-lg leading-snug text-white/90">“{site.slogan}”</p>
          </div>
          <nav aria-label="Secciones" className="lg:col-span-3">
            <h2 className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">Secciones</h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 lg:grid-cols-1">
              {[...nav, { href: "#configurador", label: "Configurador" }, { href: "#faq", label: "Preguntas frecuentes" }].map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="inline-flex min-h-[40px] items-center text-sm text-white/85 hover:text-white hover:underline">{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="lg:col-span-4">
            <h2 className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">Visítanos</h2>
            <address className="mt-4 text-sm not-italic leading-relaxed text-white/85">
              {site.address.street}
              <br />
              {site.address.city}, {site.address.country}
              {site.hours.map((h) => (
                <span key={h.label} className="mt-1 block first-of-type:mt-3">
                  {h.label}: {h.value}
                </span>
              ))}
            </address>
            <div className="mt-6 flex gap-2">
              <a href={waLink(WA_DEFAULT)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp de ALVITEC" className="flex h-11 w-11 items-center justify-center border border-white/30 hover:bg-white hover:text-navy">
                <WhatsAppIcon />
              </a>
              <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${site.instagram.handle}`} className="flex h-11 w-11 items-center justify-center border border-white/30 hover:bg-white hover:text-navy">
                <InstagramIcon />
              </a>
              <a href={site.facebook.url} target="_blank" rel="noopener noreferrer" aria-label={`Facebook: ${site.facebook.name}`} className="flex h-11 w-11 items-center justify-center border border-white/30 hover:bg-white hover:text-navy">
                <FacebookIcon />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-white/15 pt-6 text-[12px] text-white/70 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} ALVITEC · {site.address.city}, {site.address.country}</p>
          <p>Las fotografías del sitio son referenciales.</p>
        </div>
      </div>
    </footer>
  );
}
