import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Showreel from "@/components/Showreel";
import { homeReels } from "@/lib/reels";
import ConversionStrategy from "@/components/ConversionStrategy";
import ClientsMarquee from "@/components/ClientsMarquee";
import Services from "@/components/Services";
import AIShowcase from "@/components/AIShowcase";
import Process from "@/components/Process";
import Portfolio from "@/components/Portfolio";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import GoatReveal from "@/components/GoatReveal";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";
import StickyDesktopCTA from "@/components/StickyDesktopCTA";
import MobileConversionOverlays from "@/components/MobileConversionOverlays";
import { faqSchema, organizationSchema } from "@/lib/advibe-schema";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white">
      <StickyDesktopCTA />
      <main className="relative overflow-hidden pb-24">
        <Navbar />
        <Hero />
        <Showreel reels={homeReels} />
        <ClientsMarquee />
        <ConversionStrategy />
        <Services />
        <Portfolio />
        <Process />
        <AIShowcase />
        <Testimonials />
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
