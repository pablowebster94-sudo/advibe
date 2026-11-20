"use client";

import { MouseEvent, ReactNode, useSyncExternalStore } from "react";
import { buildTrackedHref, getCtaUtmParams, trackEvent, trackLead, trackWhatsAppOpen } from "@/lib/tracking";

// El href solo cambia con la navegación, que ya remonta el componente: no hay
// nada a lo que suscribirse.
const subscribeToNothing = () => () => {};

type Props = {
  href: string;
  eventName: string;
  eventParams?: Record<string, string | number | boolean | undefined>;
  leadOnClick?: boolean;
  className?: string;
  children: ReactNode;
};

export default function EventButton({ href, eventName, eventParams, leadOnClick = false, className, children }: Props) {
  // El href con UTM depende de la URL del navegador (los UTM entrantes), así que
  // no puede calcularse en el servidor. Pintarlo directamente rompía la
  // hidratación en todos los CTA: el servidor mandaba "#contacto" y el cliente
  // "?utm_source=...". useSyncExternalStore entrega el href limpio durante la
  // hidratación y el enriquecido en cuanto React pasa al cliente.
  const trackedHref = useSyncExternalStore(
    subscribeToNothing,
    () => buildTrackedHref(href, eventParams),
    () => href,
  );

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const utm = getCtaUtmParams(eventParams);
    trackEvent(eventName, { ...eventParams, ...utm });
    if (href.startsWith("https://wa.me/")) trackWhatsAppOpen(eventName, { ...eventParams, ...utm });
    if (leadOnClick) trackLead({ ...eventParams, ...utm, cta: eventName });

    if (href.startsWith("#")) {
      event.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const url = new URL(window.location.href);
        Object.entries(utm).forEach(([key, value]) => url.searchParams.set(key, value));
        window.history.replaceState({}, "", `${url.pathname}${url.search}${href}`);
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  return (
    <a href={trackedHref} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
