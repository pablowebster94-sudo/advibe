import { About } from "@/components/About";
import { Configurator } from "@/components/Configurator";
import { Contact } from "@/components/Contact";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Materials } from "@/components/Materials";
import { MotionProvider } from "@/components/Motion";
import { Process } from "@/components/Process";
import { Services } from "@/components/Services";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

export default function Home() {
  return (
    <MotionProvider>
      <a href="#servicios" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-navy">
        Saltar al contenido
      </a>
      <Header />
      <main>
        <Hero />
        <Services />
        <About />
        <Materials />
        <Configurator />
        <Gallery />
        <Process />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
      <JsonLd />
    </MotionProvider>
  );
}
