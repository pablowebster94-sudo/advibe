import { faq } from "@/lib/content";

const siteUrl = "https://www.advibeagencia.com";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "AdVibe Agencia",
  url: siteUrl,
  description: "Agencia digital especializada en desarrollo web, landing pages, sistemas de captación, marketing de resultados y automatización.",
  areaServed: [
    { "@type": "Country", name: "Ecuador" },
    { "@type": "Country", name: "United States" },
  ],
  address: { "@type": "PostalAddress", addressLocality: "Gualaceo", addressRegion: "Azuay", addressCountry: "EC" },
  sameAs: ["https://instagram.com/advibe.agencia", "https://www.facebook.com/share/1DT1TqhpjU/"],
  contactPoint: { "@type": "ContactPoint", contactType: "sales", telephone: "+593984966335", availableLanguage: ["Spanish", "English"] },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "AdVibe Digital Solutions",
    itemListElement: [
      "Desarrollo web y sitios corporativos",
      "Landing pages y sistemas de captación",
      "Ecommerce y catálogos digitales",
      "Meta Ads y generación de prospectos",
      "Producción audiovisual",
      "SEO local",
      "CRM y automatización comercial",
    ].map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })),
  },
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
};
