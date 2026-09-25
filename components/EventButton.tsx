"use client";

import { MouseEvent, ReactNode } from "react";
import { buildTrackedHref, getCtaUtmParams, trackEvent, trackLead, trackWhatsAppOpen } from "@/lib/tracking";

type Props = {
  href: string;
  eventName: string;
  eventParams?: Record<string, string | number | boolean | undefined>;
  leadOnClick?: boolean;
  className?: string;
  children: ReactNode;
};

export default function EventButton({ href, eventName, eventParams, leadOnClick = false, className, children }: Props) {
  const trackedHref = buildTrackedHref(href, eventParams);

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
