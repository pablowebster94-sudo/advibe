"use client";

import { useEffect, useState } from "react";
import EventButton from "@/components/EventButton";
import { trackEvent, trackLead, trackWhatsAppOpen } from "@/lib/tracking";

function useMobile() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function useHeroVisible() {
  const [heroVisible, setHeroVisible] = useState(true);

  useEffect(() => {
    const hero = document.getElementById("home");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.01 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return heroVisible;
}

function useDiagnosticEligibility() {
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setEligible(true), 20_000);

    const checkScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      if (window.scrollY / maxScroll >= 0.4) setEligible(true);
    };

    checkScroll();
    window.addEventListener("scroll", checkScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", checkScroll);
    };
  }, []);

  return eligible;
}

function DiagnosticBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-t-3xl border border-white/10 border-b-0 bg-[#050505]/95 px-4 py-4 backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Diagnóstico gratuito</p>
          <p className="text-sm font-semibold text-white">Descubre oportunidades</p>
        </div>
        <EventButton
          href="#diagnostico"
          eventName="request_diagnostic"
          eventParams={{ source: "mobile_cta" }}
          leadOnClick
          className="inline-flex items-center justify-center rounded-full bg-lime-400 px-5 py-3 text-sm font-semibold text-[#07101a] hover:bg-lime-300"
        >
          Analizar mi marca
        </EventButton>
      </div>
    </div>
  );
}

function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/593984966335?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20sus%20servicios."
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar a AdVibe por WhatsApp"
      onClick={() => {
        trackWhatsAppOpen("floating_button");
        trackEvent("floating_whatsapp_click", { source: "floating_button" });
        trackLead({ source: "floating_button", cta: "floating_whatsapp_click" });
      }}
      className="fixed bottom-[82px] right-4 z-[60] flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/30 transition hover:scale-105 sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M17.6 6.3A8.7 8.7 0 0 0 12 3.2C7.1 3.2 3.1 7.1 3.1 12c0 1.6.4 3.1 1.2 4.4L3 21l4.7-1.2a8.8 8.8 0 0 0 4.3 1.1h.1c5 0 9-4 9-8.9a8.8 8.8 0 0 0-2.5-6.2Z" /></svg>
      <span>WhatsApp</span>
    </a>
  );
}

export default function MobileConversionOverlays() {
  const isMobile = useMobile();
  const heroVisible = useHeroVisible();
  const diagnosticEligible = useDiagnosticEligibility();

  const showDiagnostic = isMobile && diagnosticEligible && !heroVisible;
  const showWhatsApp = !isMobile || (!heroVisible && !showDiagnostic);

  return (
    <>
      {showDiagnostic ? <DiagnosticBar /> : null}
      {showWhatsApp ? <WhatsAppButton /> : null}
    </>
  );
}
