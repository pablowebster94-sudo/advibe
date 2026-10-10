import { faq } from "@/lib/content";

// Datos estructurados de AdVibe Agencia. Van solo en la home de advibeagencia.com:
// en el layout raíz se filtraban también a otros sitios servidos por esta app (p. ej. Enfoque Visual).
const siteUrl = "https://www.advibeagencia.com";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "AdVibe Agencia",
  url: siteUrl,
  description: "Agencia de marketing digital en Gualaceo, Azuay: contenido, video, anuncios en Facebook e Instagram y páginas web.",
  areaServed: { "@type": "Country", name: "Ecuador" },
  address: { "@type": "PostalAddress", addressLocality: "Gualaceo", addressRegion: "Azuay", addressCountry: "EC" },
  sameAs: ["https://instagram.com/advibe.agencia","https://www.facebook.com/share/1DT1TqhpjU/"],
  contactPoint: { "@type": "ContactPoint", contactType: "sales", telephone: "+593984966335", availableLanguage: ["Spanish"] },
  hasOfferCatalog: { "@type": "OfferCatalog", name: "Servicios AdVibe", itemListElement: ["Meta Ads y adquisición de clientes","Producción audiovisual","Desarrollo web","Inteligencia artificial","Automatización","CRM y chatbots","Branding e identidad visual"].map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })) },
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
};
