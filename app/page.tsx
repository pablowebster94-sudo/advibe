import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Clients from "@/components/Clients";
import Services from "@/components/Services";
import Process from "@/components/Process";
import Portfolio from "@/components/Portfolio";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import Benefits from "@/components/Benefits";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white">
      <main className="relative overflow-hidden">
        <Navbar />
        <Hero />
        <Clients />
        <Services />
        <Process />
        <Portfolio />
        <Stats />
        <Testimonials />
        <Benefits />
        <CTA />
        <Footer />
      </main>

      <a
        href="https://wa.me/593984966335?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20sus%20servicios."
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/30 transition hover:scale-105 sm:bottom-6 sm:right-6"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M17.6 6.3A8.7 8.7 0 0 0 12 3.2C7.1 3.2 3.1 7.1 3.1 12c0 1.6.4 3.1 1.2 4.4L3 21l4.7-1.2a8.8 8.8 0 0 0 4.3 1.1h.1c5 0 9-4 9-8.9a8.8 8.8 0 0 0-2.5-6.2Zm-5.6 13.6h-.1a7.2 7.2 0 0 1-3.6-1l-.2-.1-2.8.7.7-2.7-.2-.3a7.2 7.2 0 1 1 5.9 3.4Zm3.9-5.4c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.4.1-.1.2-.5.7-.6.8-.1.1-.2.1-.4.1a5.7 5.7 0 0 1-2.9-2.5c-.2-.3 0-.5.1-.6l.3-.4c.1-.1.1-.2 0-.3l-.2-.4a.7.7 0 0 0-.2-.3c-.2-.1-.4-.1-.6 0l-.5.2c-.2.1-.4.3-.5.6-.1.2-.2.4-.1.7.1.4.4 1 .8 1.6.5.7 1.1 1.2 1.8 1.6.6.3 1 .4 1.3.3.3-.1.6-.3.8-.6.1-.2.1-.3 0-.4l-.3-.3c-.1-.1-.2-.1-.4-.1Z" />
        </svg>
        <span>WhatsApp</span>
      </a>
    </div>
  );
}