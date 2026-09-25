"use client";

import { trackEvent } from "@/lib/tracking";

export default function WhatsAppFloatingButton() {
  return (
    <a
      href="https://wa.me/593984966335?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20sus%20servicios."
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar a AdVibe por WhatsApp"
      onClick={() => trackEvent("floating_whatsapp_click", { source: "floating_button" })}
      className="fixed bottom-[82px] right-4 z-[60] flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/30 transition hover:scale-105 sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M17.6 6.3A8.7 8.7 0 0 0 12 3.2C7.1 3.2 3.1 7.1 3.1 12c0 1.6.4 3.1 1.2 4.4L3 21l4.7-1.2a8.8 8.8 0 0 0 4.3 1.1h.1c5 0 9-4 9-8.9a8.8 8.8 0 0 0-2.5-6.2Z" /></svg>
      <span>WhatsApp</span>
    </a>
  );
}
