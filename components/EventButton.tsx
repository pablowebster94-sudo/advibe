"use client";

import { MouseEvent, ReactNode } from "react";
import { trackEvent } from "@/lib/tracking";

type Props = {
  href: string;
  eventName: string;
  eventParams?: Record<string, string | number | boolean | undefined>;
  className?: string;
  children: ReactNode;
};

export default function EventButton({ href, eventName, eventParams, className, children }: Props) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    trackEvent(eventName, eventParams);
    if (href.startsWith("#")) {
      event.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
