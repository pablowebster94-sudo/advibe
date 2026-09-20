"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
  }
}

export function track(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", name, params);
  window.gtag?.("event", name, params);
}

export function Tracking({
  id,
  type,
  value,
  name,
}: {
  id: string;
  type: string;
  value: number;
  name: string;
}) {
  useEffect(() => {
    track("ViewContent", {
      content_id: id,
      content_type: type,
      value,
      currency: "USD",
      content_name: name,
    });
  }, [id, type, value, name]);

  return null;
}
