"use client";

import { track } from "./Tracking";

function getAttribution() {
  const params = new URLSearchParams(window.location.search);
  const keys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "fbclid",
    "gclid",
    "wbraid",
    "gbraid",
  ];

  const attribution: Record<string, string> = {};
  for (const key of keys) {
    const value = params.get(key);
    if (value) attribution[key] = value;
  }

  return attribution;
}

export function WhatsApp({
  message,
  id,
  type = "property",
  value,
}: {
  message: string;
  id?: string;
  type?: string;
  value?: number;
}) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  const onClick = () => {
    const attribution = getAttribution();

    track("Contact", {
      content_id: id,
      content_type: type,
      value,
      currency: "USD",
      channel: "whatsapp",
    });

    try {
      navigator.sendBeacon?.(
        "/api/enfoque/events",
        new Blob(
          [
            JSON.stringify({
              event_name: "Contact",
              content_id: id,
              content_type: type,
              value,
              channel: "whatsapp",
              ...attribution,
            }),
          ],
          { type: "application/json" }
        )
      );
    } catch {
      // Tracking failure must never block the WhatsApp action.
    }
  };

  if (!number) {
    return (
      <span className="inline-flex rounded-full bg-white/10 px-6 py-3 text-sm font-black text-white/60">
        WhatsApp no configurado
      </span>
    );
  }

  return (
    <a
      href={"https://wa.me/" + number + "?text=" + encodeURIComponent(message)}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      className="inline-flex rounded-full bg-[#d9ff3f] px-6 py-3 text-sm font-black text-black transition hover:scale-[1.02]"
    >
      WhatsApp ↗
    </a>
  );
}
