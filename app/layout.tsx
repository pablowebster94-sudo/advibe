import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { faq } from "@/lib/content";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://www.advibeagencia.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "AdVibe Agencia | Marketing, IA y Automatización",
  description:
    "AdVibe integra marketing, contenido audiovisual, desarrollo web, inteligencia artificial y automatización para ayudar a empresas a atraer clientes y crecer.",
  keywords: [
    "AdVibe Agencia",
    "agencia de marketing Ecuador",
    "Meta Ads Ecuador",
    "inteligencia artificial para empresas",
    "automatización comercial",
    "desarrollo web Ecuador",
    "producción audiovisual Ecuador",
  ],
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true },
  openGraph: {
    title: "AdVibe Agencia | Marketing, IA y Automatización",
    description:
      "Estrategia, creatividad y tecnología para construir sistemas de crecimiento.",
    url: siteUrl,
    siteName: "AdVibe Agencia",
    locale: "es_EC",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AdVibe Agencia | Marketing, IA y Automatización",
    description:
      "Estrategia, creatividad y tecnología para construir sistemas de crecimiento.",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "AdVibe Agencia",
  url: siteUrl,
  description:
    "Agencia creativa y tecnológica especializada en marketing, producción audiovisual, desarrollo web, inteligencia artificial y automatización.",
  areaServed: { "@type": "Country", name: "Ecuador" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Gualaceo",
    addressRegion: "Azuay",
    addressCountry: "EC",
  },
  sameAs: [
    "https://instagram.com/advibe.agencia",
    "https://www.facebook.com/share/1DT1TqhpjU/",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    telephone: "+593984966335",
    availableLanguage: ["Spanish"],
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Servicios AdVibe",
    itemListElement: [
      "Meta Ads y adquisición de clientes",
      "Producción audiovisual",
      "Desarrollo web",
      "Inteligencia artificial",
      "Automatización",
      "CRM y chatbots",
      "Branding e identidad visual",
    ].map((name) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name },
    })),
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased text-white`}>
      <body className="min-h-full bg-[#050505] text-white">
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </body>
    </html>
  );
}
