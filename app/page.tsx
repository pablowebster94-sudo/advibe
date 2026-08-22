import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
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

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white">
      <StickyDesktopCTA />
      <main className="relative overflow-hidden pb-24">
        <Navbar />
        <Hero />
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
    </div>
  );
}
