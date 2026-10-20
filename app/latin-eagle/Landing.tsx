"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  BUSINESS, COMPRAS_ECUADOR, GIROS_COUNTRIES, HOURS, INSTAGRAM_URL, FACEBOOK_URL, MAPS_DIRECTIONS, MAPS_EMBED, T, WA_MESSAGES, waLink,
  type Copy, type Lang, type ServiceId,
} from "./content";

declare global { interface Window { fbq?: (...args: unknown[]) => void } }

// Si la página tiene Pixel, cada clic a WhatsApp cuenta como Contact con el servicio de origen.
function trackWhatsApp(service: ServiceId | "general" | "floating") {
  window.fbq?.("track", "Contact", { content_name: service });
}

function WaLink({ service, className, children, label }: { service: ServiceId | "general"; className: string; children: React.ReactNode; label?: string }) {
  return <a href={waLink(WA_MESSAGES[service])} target="_blank" rel="noopener noreferrer" className={className} aria-label={label} onClick={() => trackWhatsApp(service)}>{children}</a>;
}

export default function Landing({ promoActive }: { promoActive: boolean }) {
  const [lang, setLang] = useState<Lang>("es");
  const t = T[lang];

  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = lang;
    return () => { document.documentElement.lang = previous; };
  }, [lang]);

  return <>
    <a href="#contenido" className="le-skip">{t.skip}</a>
    <Header t={t} onToggle={() => setLang(lang === "es" ? "en" : "es")} />
    <main id="contenido">
      <Hero t={t} />
      {promoActive && <Promo t={t} />}
      <Services t={t} promoActive={promoActive} />
      <Products t={t} />
      <Location t={t} lang={lang} />
    </main>
    <Footer t={t} />
    <a href={waLink(WA_MESSAGES.general)} target="_blank" rel="noopener noreferrer" className="le-float" aria-label={t.floatingLabel} onClick={() => trackWhatsApp("floating")}>
      <WhatsAppIcon className="h-7 w-7" />
      <span className="le-float-text">{t.floating}</span>
    </a>
  </>;
}

function Header({ t, onToggle }: { t: Copy; onToggle: () => void }) {
  return <header className="le-header">
    <div className="le-wrap flex h-16 items-center justify-between gap-3">
      <a href="#contenido" className="flex min-w-0 items-center gap-2.5">
        <Image src="/latin-eagle/logo.webp" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full" />
        <span className="le-display truncate text-[15px] leading-tight">Latin Eagle<span className="block text-[10px] font-bold tracking-[0.28em] text-[var(--le-gold)]">MULTISERVICES</span></span>
      </a>
      <nav className="flex items-center gap-1 sm:gap-2" aria-label="Latin Eagle">
        <a href="#servicios" className="le-navlink hidden sm:inline-flex">{t.navServices}</a>
        <a href="#ubicacion" className="le-navlink hidden sm:inline-flex">{t.navLocation}</a>
        <button type="button" onClick={onToggle} className="le-lang" aria-label={t.langSwitchLabel}>{t.langSwitch}</button>
      </nav>
    </div>
  </header>;
}

function Hero({ t }: { t: Copy }) {
  return <section className="le-hero" aria-labelledby="le-hero-title">
    <div className="le-wrap grid items-center gap-6 py-10 md:grid-cols-[1.25fr_1fr] md:gap-8 md:py-20">
      <div className="flex justify-center md:order-last">
        <Image src="/latin-eagle/logo.webp" alt={t.logoAlt} width={512} height={506} preload sizes="(min-width: 768px) 380px, 132px" className="le-logo h-[132px] w-[132px] md:h-auto md:w-full md:max-w-[380px]" />
      </div>
      <div className="text-center md:text-left">
        <p className="le-eyebrow">{t.eyebrow}</p>
        <h1 id="le-hero-title" className="le-display mt-3 text-[2.15rem] leading-[1.05] sm:text-5xl md:text-6xl">{t.heroTitle}</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/80 md:mx-0 md:text-lg">{t.heroText}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
          <WaLink service="general" className="le-btn le-btn-gold"><WhatsAppIcon className="h-5 w-5" />{t.ctaWhatsapp}</WaLink>
          <a href={MAPS_DIRECTIONS} target="_blank" rel="noopener noreferrer" className="le-btn le-btn-ghost"><PinIcon className="h-5 w-5" />{t.ctaDirections}</a>
        </div>
        <ul className="mt-7 flex flex-wrap justify-center gap-2 md:justify-start">
          {t.trust.map(item => <li key={item} className="le-chip"><CheckIcon className="h-4 w-4 text-[var(--le-gold)]" />{item}</li>)}
        </ul>
      </div>
    </div>
  </section>;
}

function Promo({ t }: { t: Copy }) {
  return <section className="le-wrap pt-2 pb-4 md:pb-8" aria-labelledby="le-promo-title">
    <div className="le-promo grid items-center gap-5 md:grid-cols-[minmax(0,320px)_1fr] md:gap-10">
      <Image src="/latin-eagle/promo-colombia.webp" alt={t.promoAlt} width={800} height={960} sizes="(min-width: 768px) 320px, calc(100vw - 64px)" className="mx-auto w-full max-w-[320px] rounded-2xl" />
      <div className="text-center md:text-left">
        <span className="le-badge">{t.promoBadge}</span>
        <h2 id="le-promo-title" className="le-display mt-3 text-2xl leading-tight text-black md:text-4xl">{t.promoTitle}</h2>
        <p className="mt-2 font-semibold text-black/80">{t.promoUntil}</p>
        <WaLink service="colombia" className="le-btn le-btn-black mt-5"><WhatsAppIcon className="h-5 w-5" />{t.promoCta}</WaLink>
      </div>
    </div>
  </section>;
}

const SERVICE_ORDER: ServiceId[] = ["colombia", "ecuador", "compras", "giros", "productos", "farmacia"];
const SERVICE_ICONS: Record<ServiceId, (p: { className?: string }) => React.ReactElement> = {
  colombia: PlaneIcon, ecuador: BoxIcon, compras: BagIcon, giros: MoneyIcon, productos: BasketIcon, farmacia: CrossIcon,
};

function Services({ t, promoActive }: { t: Copy; promoActive: boolean }) {
  const s = t.services;
  const extra: Partial<Record<ServiceId, React.ReactNode>> = {
    colombia: promoActive ? <p className="le-highlight">{s.colombia.promo}</p> : <p className="le-quote">{t.quote}</p>,
    ecuador: <p className="le-quote">{t.quote}</p>,
    compras: <>
      <p className="mt-3 text-sm text-white/70">{s.compras.detail(COMPRAS_ECUADOR.businessDays)}{COMPRAS_ECUADOR.pickupCity ? " " + s.compras.pickup(COMPRAS_ECUADOR.pickupCity) : ""}</p>
      {COMPRAS_ECUADOR.price !== null
        ? <p className="le-highlight">{COMPRAS_ECUADOR.pounds} lb · ${COMPRAS_ECUADOR.price}</p>
        : <p className="le-quote">{t.quote}</p>}
    </>,
    giros: <div className="mt-3">
      <p className="text-sm font-bold text-white">{s.giros.countries}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5" lang="es">{GIROS_COUNTRIES.map(c => <li key={c} className="le-country">{c}</li>)}</ul>
    </div>,
  };

  return <section id="servicios" className="le-section" aria-labelledby="le-services-title">
    <div className="le-wrap">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="le-services-title" className="le-display text-3xl md:text-5xl">{t.servicesTitle}</h2>
        <p className="mt-3 text-white/75 md:text-lg">{t.servicesText}</p>
      </div>
      <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_ORDER.map(id => {
          const Icon = SERVICE_ICONS[id];
          return <li key={id} className="le-card">
            <span className="le-icon"><Icon className="h-6 w-6" /></span>
            <h3 className="le-display mt-4 text-xl leading-snug">{s[id].title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-white/75">{s[id].text}</p>
            {extra[id]}
            <div className="mt-auto pt-5">
              <WaLink service={id} className="le-btn le-btn-outline w-full" label={`${t.serviceCta}: ${s[id].title}`}><WhatsAppIcon className="h-5 w-5" />{t.serviceCta}</WaLink>
            </div>
          </li>;
        })}
      </ul>
    </div>
  </section>;
}

function Products({ t }: { t: Copy }) {
  return <section className="le-section le-section-alt" aria-labelledby="le-products-title">
    <div className="le-wrap grid items-center gap-8 md:grid-cols-2 md:gap-14">
      <div className="order-2 text-center md:order-1 md:text-left">
        <h2 id="le-products-title" className="le-display text-3xl leading-tight md:text-5xl">{t.productsTitle}</h2>
        <p className="mt-4 text-white/75 md:text-lg">{t.productsText}</p>
        <p className="mt-3 text-white/75">{t.services.productos.text}</p>
        <WaLink service="productos" className="le-btn le-btn-gold mt-6"><WhatsAppIcon className="h-5 w-5" />{t.productsCta}</WaLink>
      </div>
      <Image src="/latin-eagle/productos-ecuatorianos.webp" alt={t.productsAlt} width={800} height={1000} sizes="(min-width: 768px) 460px, calc(100vw - 32px)" className="order-1 mx-auto w-full max-w-[460px] rounded-3xl border border-[var(--le-gold)]/30 md:order-2" />
    </div>
  </section>;
}

function Location({ t, lang }: { t: Copy; lang: Lang }) {
  return <section id="ubicacion" className="le-section" aria-labelledby="le-location-title">
    <div className="le-wrap">
      <h2 id="le-location-title" className="le-display text-center text-3xl md:text-5xl">{t.locationTitle}</h2>
      <div className="mt-9 grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <div className="le-map">
          <iframe src={MAPS_EMBED} title={t.mapTitle} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen className="h-full w-full border-0" />
        </div>
        <div className="le-card gap-5">
          <InfoRow icon={<PinIcon className="h-5 w-5" />} label={t.addressLabel}>
            <address className="not-italic">{BUSINESS.street}<br />{BUSINESS.city}, {BUSINESS.region} {BUSINESS.postalCode}</address>
          </InfoRow>
          <InfoRow icon={<ClockIcon className="h-5 w-5" />} label={t.hoursLabel}>
            {HOURS ? HOURS[lang] : <WaLink service="general" className="underline decoration-[var(--le-gold)] underline-offset-4">{t.hoursPending}</WaLink>}
          </InfoRow>
          <InfoRow icon={<PhoneIcon className="h-5 w-5" />} label={t.phoneLabel}>
            <span className="block">{t.whatsappLabel}: <a href={`tel:${BUSINESS.phone}`} className="font-bold underline-offset-4 hover:underline">{BUSINESS.whatsappDisplay}</a></span>
            <span className="block text-white/70">{t.otherPhone}: <a href={`tel:${BUSINESS.secondaryPhone}`} className="underline-offset-4 hover:underline">{BUSINESS.secondaryPhoneDisplay}</a></span>
          </InfoRow>
          <div className="mt-1 grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            <a href={`tel:${BUSINESS.phone}`} className="le-btn le-btn-gold"><PhoneIcon className="h-5 w-5" />{t.call}</a>
            <a href={MAPS_DIRECTIONS} target="_blank" rel="noopener noreferrer" className="le-btn le-btn-ghost"><PinIcon className="h-5 w-5" />{t.openMaps}</a>
          </div>
        </div>
      </div>
    </div>
  </section>;
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return <div className="flex gap-3">
    <span className="le-icon le-icon-sm">{icon}</span>
    <div className="min-w-0 text-[15px] leading-relaxed">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--le-gold)]">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  </div>;
}

function Footer({ t }: { t: Copy }) {
  return <footer className="le-footer">
    <div className="le-wrap flex flex-col items-center gap-5 py-10 text-center md:flex-row md:justify-between md:text-left">
      <div className="flex items-center gap-3">
        <Image src="/latin-eagle/logo.webp" alt="" width={48} height={48} className="h-12 w-12 rounded-full" />
        <div>
          <p className="le-display">{BUSINESS.name}</p>
          <p className="text-sm text-white/65">{t.footerTagline}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-white/65">{t.followUs}</span>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="le-social" aria-label={`Instagram @${BUSINESS.instagram}`}><InstagramIcon className="h-5 w-5" /></a>
        <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="le-social" aria-label="Facebook"><FacebookIcon className="h-5 w-5" /></a>
      </div>
    </div>
    <p className="pb-24 text-center text-xs text-white/50 md:pb-8">
      © {new Date().getFullYear()} {BUSINESS.name} · <a href="https://www.advibeagencia.com" className="hover:text-white/80">{t.credit}</a>
    </p>
  </footer>;
}

/* Iconos (SVG inline, sin dependencias) */
type IconProps = { className?: string };
const svg = (className: string | undefined, children: React.ReactNode) =>
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;

function WhatsAppIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 9.88 9.89c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.94L.06 24l6.31-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41" /></svg>;
}
function PinIcon({ className }: IconProps) { return svg(className, <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>); }
function PhoneIcon({ className }: IconProps) { return svg(className, <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />); }
function ClockIcon({ className }: IconProps) { return svg(className, <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>); }
function CheckIcon({ className }: IconProps) { return svg(className, <path d="m5 12 5 5L20 7" />); }
function PlaneIcon({ className }: IconProps) { return svg(className, <path d="M10.5 13.5 3 11l1.5-1.5 8 .5 4-4.5a2 2 0 0 1 3 3L15 12.5l.5 8L14 22l-2.5-7.5L8 18v2.5L6.5 22 5 18l-4-1.5L2.5 15H5l3.5-3.5" />); }
function BoxIcon({ className }: IconProps) { return svg(className, <><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5M12 13v8" /></>); }
function BagIcon({ className }: IconProps) { return svg(className, <><path d="M6 7h12l1 14H5L6 7Z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" /></>); }
function MoneyIcon({ className }: IconProps) { return svg(className, <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9.5v5M18 9.5v5" /></>); }
function BasketIcon({ className }: IconProps) { return svg(className, <><path d="M3 10h18l-2 10H5L3 10Z" /><path d="m8 10 3-6M16 10l-3-6M9 14v3M15 14v3" /></>); }
function CrossIcon({ className }: IconProps) { return svg(className, <><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M12 8v8M8 12h8" /></>); }
function InstagramIcon({ className }: IconProps) { return svg(className, <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" /></>); }
function FacebookIcon({ className }: IconProps) { return svg(className, <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z" />); }
