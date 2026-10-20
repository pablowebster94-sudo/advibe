import Landing from "./Landing";
import { BUSINESS, FACEBOOK_URL, GEO, INSTAGRAM_URL, MAPS_DIRECTIONS, SITE_URL, isColombiaPromoActive } from "./content";

// La promo de Colombia se oculta sola al vencer: la página se regenera cada hora.
export const revalidate = 3600;

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${SITE_URL}#store`,
    name: BUSINESS.name,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image`,
    logo: new URL("/latin-eagle/logo.webp", SITE_URL).toString(),
    description: "Envíos de paquetes a Ecuador y Colombia, envíos de dinero, productos ecuatorianos y latinos y farmacia de venta libre en Patchogue, NY.",
    telephone: BUSINESS.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.street,
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.region,
      postalCode: BUSINESS.postalCode,
      addressCountry: BUSINESS.country,
    },
    ...(GEO ? { geo: { "@type": "GeoCoordinates", ...GEO } } : {}),
    hasMap: MAPS_DIRECTIONS,
    areaServed: ["Patchogue", "Long Island", "Suffolk County"],
    knowsLanguage: "es",
    paymentAccepted: "Cash",
    currenciesAccepted: "USD",
    sameAs: [INSTAGRAM_URL, FACEBOOK_URL],
    contactPoint: [{ "@type": "ContactPoint", telephone: BUSINESS.phone, contactType: "customer service", availableLanguage: "Spanish" }],
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <Landing promoActive={isColombiaPromoActive()} />
  </>;
}
