import { SITE_URL, WHATSAPP_NUMBER, serviceNames, site } from "@/lib/site";
import { images } from "@/lib/images";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#negocio`,
    name: site.legalName,
    alternateName: site.name,
    slogan: site.slogan,
    description: site.description,
    url: SITE_URL,
    image: `${SITE_URL}${images.hero.src}`,
    telephone: `+${WHATSAPP_NUMBER}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: site.address.countryCode,
    },
    areaServed: site.coverage.map((name) => ({ "@type": "City", name })),
    openingHoursSpecification: site.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days.map((d) => `https://schema.org/${d}`),
      opens: h.opens,
      closes: h.closes,
    })),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: `+${WHATSAPP_NUMBER}`,
      url: `https://wa.me/${WHATSAPP_NUMBER}`,
      availableLanguage: "es",
    },
    knowsAbout: [...serviceNames],
    sameAs: [site.instagram.url],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
