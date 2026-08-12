import Navbar from "@/components/Navbar";
import AIChatbot from "@/components/AIChatbot";
import StickyDesktopCTA from "@/components/StickyDesktopCTA";
import Footer from "@/components/Footer";
import RedesignShowcase from "@/components/RedesignShowcase";
import EventButton from "@/components/EventButton";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white">
      <StickyDesktopCTA />
      <main className="relative overflow-hidden pb-24">
        <Navbar />
        <RedesignShowcase />
        <Footer />
      </main>
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-t-3xl border border-white/10 border-b-0 bg-[#050505]/95 px-4 py-4 backdrop-blur-xl">
          <div><p className="text-xs uppercase tracking-[0.28em] text-lime-300">Diagnóstico gratuito</p><p className="text-sm font-semibold text-white">Descubre oportunidades</p></div>
          <EventButton href="#diagnostico" eventName="request_diagnostic" eventParams={{ source: "interactive_redesign" }} className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-[#f3f3f0]">Analizar mi marca</EventButton>
        </div>
      </div>
      <a href="https://wa.me/593984966335?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20sus%20servicios." target="_blank" rel="noreferrer" aria-label="Contactar a AdVibe por WhatsApp" className="fixed bottom-[82px] right-4 z-[60] flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/30 transition hover:scale-105 sm:bottom-6 sm:right-6">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M17.6 6.3A8.7 8.7 0 0 0 12 3.2C7.1 3.2 3.1 7.1 3.1 12c0 1.6.4 3.1 1.2 4.4L3 21l4.7-1.2a8.8 8.8 0 0 0 4.3 1.1h.1c5 0 9-4 9-8.9a8.8 8.8 0 0 0-2.5-6.2Z" /></svg>
        <span>WhatsApp</span>
      </a>
      <AIChatbot />
    </div>
  );
}
