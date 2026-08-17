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
import EventButton from "@/components/EventButton";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white">
      <StickyDesktopCTA />
      <main className="relative overflow-hidden pb-24">
        <Navbar />
        <Hero />
        <Services />
        <Portfolio />
        <Process />
        <AIShowcase />
        <Stats />
        <ClientsMarquee />
        <Clients />
        <Testimonials />
        <DigitalAudit />
        <CTA />
        <GoatReveal />
        <Footer />
      </main>
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-t-3xl border border-white/10 border-b-0 bg-[#050505]/95 px-4 py-4 backdrop-blur-xl">
          <div><p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Diagnóstico gratuito</p><p className="text-sm font-semibold text-white">Descubre oportunidades</p></div>
          <EventButton href="#diagnostico" eventName="request_diagnostic" eventParams={{ source: "mobile_cta" }} className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-[#f3f3f0]">Analizar mi marca</EventButton>
        </div>
      </div>
      <WhatsAppFloatingButton />
      <AIChatbot />
    </div>
  );
}
