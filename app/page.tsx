import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ConversionStrategy from "@/components/ConversionStrategy";
import ClientsMarquee from "@/components/ClientsMarquee";
import Services from "@/components/Services";
import AIShowcase from "@/components/AIShowcase";
import Process from "@/components/Process";
import Portfolio from "@/components/Portfolio";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import Faq from "@/components/Faq";
import CTA from "@/components/CTA";
import GoatReveal from "@/components/GoatReveal";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";
import StickyDesktopCTA from "@/components/StickyDesktopCTA";
import MobileConversionOverlays from "@/components/MobileConversionOverlays";
import { faqSchema, organizationSchema } from "@/lib/advibe-schema";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "AdVibe Agencia | Marketing digital, Meta Ads y web en Azuay, Ecuador",
  description: "Agencia de marketing en Gualaceo, Azuay: Meta Ads, contenido audiovisual, páginas web, chatbots de WhatsApp y automatización para conseguir más clientes en Ecuador y EE. UU.",
  path: "/",
});

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
        <Testimonials />
        <Faq />
        <CTA />
        <GoatReveal />
        <Footer />
      </main>
      <MobileConversionOverlays />
      <AIChatbot />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </div>
  );
}
