import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ConversionStrategy from "@/components/ConversionStrategy";
import Clients from "@/components/Clients";
import ClientsMarquee from "@/components/ClientsMarquee";
import Services from "@/components/Services";
import AIShowcase from "@/components/AIShowcase";
import Process from "@/components/Process";
import Portfolio from "@/components/Portfolio";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import DigitalAudit from "@/components/DigitalAudit";
import CTA from "@/components/CTA";
import GoatReveal from "@/components/GoatReveal";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";
import StickyDesktopCTA from "@/components/StickyDesktopCTA";
import MobileConversionOverlays from "@/components/MobileConversionOverlays";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ path: "/" });

const services = ["Marketing digital y Meta Ads","Producción audiovisual","Contenido para redes sociales","Desarrollo web","Inteligencia artificial y chatbots","Automatización y CRM","Branding e identidad visual"];

const businessSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  logo: absoluteUrl("/images/logo-advibe.png"),
  image: absoluteUrl("/opengraph-image"),
  telephone: "+593984966335",
  priceRange: "$$",
  address: { "@type": "PostalAddress", addressLocality: "Gualaceo", addressRegion: "Azuay", addressCountry: "EC" },
  areaServed: [{ "@type": "City", name: "Gualaceo" }, { "@type": "City", name: "Cuenca" }, { "@type": "Country", name: "Ecuador" }],
  knowsAbout: ["Marketing digital", "Producción audiovisual", "Meta Ads", "Desarrollo web", "Inteligencia artificial", "Automatización"],
  sameAs: ["https://instagram.com/advibe.agencia", "https://www.facebook.com/share/1DT1TqhpjU/"],
  contactPoint: { "@type": "ContactPoint", contactType: "sales", telephone: "+593984966335", availableLanguage: ["Spanish"] },
  hasOfferCatalog: { "@type": "OfferCatalog", name: "Servicios AdVibe", itemListElement: services.map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })) },
};

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white">
      <StickyDesktopCTA />
      <main className="relative overflow-hidden pb-24">
        <Navbar />
        <Hero />
        <ConversionStrategy />
        <ClientsMarquee />
        <Services />
        <Portfolio />
        <Process />
        <AIShowcase />
        <Stats />
        <Clients />
        <Testimonials />
        <DigitalAudit />
        <CTA />
        <GoatReveal />
        <Footer />
      </main>
      <MobileConversionOverlays />
      <AIChatbot />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema).replace(/</g, "\\u003c") }} />
    </div>
  );
}
