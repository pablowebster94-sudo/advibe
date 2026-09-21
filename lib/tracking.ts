type EventParams = Record<string, string | number | boolean | undefined>;

type WindowWithTracking = typeof window & {
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (command: string, eventName: string, eventParams?: EventParams) => void;
  fbq?: (...args: unknown[]) => void;
};

function currentUtmParams() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
    utm_content: params.get("utm_content") || undefined,
    utm_term: params.get("utm_term") || undefined,
  };
}

export function trackEvent(name: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;
  const w = window as WindowWithTracking;
  w.dataLayer?.push({ event: name, ...params });
  w.gtag?.("event", name, params);
}

export function trackMetaEvent(
  eventName: string,
  params: Record<string, unknown> = {},
  eventId?: string
) {
  if (typeof window === "undefined") return;
  const w = window as WindowWithTracking;
  const id = eventId || crypto.randomUUID();
  w.fbq?.("track", eventName, params, { eventID: id });
  return id;
}

export async function sendCapiEvent(input: {
  eventName: string;
  eventId: string;
  email?: string;
  phone?: string;
}) {
  if (typeof window === "undefined") return;
  const cookies = document.cookie.split(";").reduce<Record<string, string>>((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (key) acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});

  try {
    await fetch("/api/meta/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event_name: input.eventName,
        event_id: input.eventId,
        email: input.email,
        phone: input.phone,
        fbp: cookies._fbp,
        fbc: cookies._fbc,
        event_source_url: window.location.href,
      }),
    });
  } catch {
    // Browser Pixel remains the fallback if the server event cannot be sent.
  }
}

export function trackLead(params: EventParams = {}) {
  const eventId = typeof crypto !== "undefined" ? crypto.randomUUID() : undefined;
  if (typeof window !== "undefined") {
    trackEvent("lead", params);
    if (eventId) {
      trackMetaEvent("Lead", params, eventId);
      void sendCapiEvent({ eventName: "Lead", eventId });
    }
  }
  return eventId;
}

export function trackWhatsAppOpen(source: string, params: EventParams = {}) {
  trackEvent("whatsapp_open", { source, ...params });
}

export function getCtaUtmParams(params: EventParams = {}) {
  const incoming = currentUtmParams();
  return {
    utm_source: incoming.utm_source || String(params.utm_source || "website"),
    utm_medium: incoming.utm_medium || String(params.utm_medium || "owned"),
    utm_campaign: incoming.utm_campaign || String(params.utm_campaign || "diagnostic_cta"),
    utm_content: incoming.utm_content || String(params.utm_content || ""),
    utm_term: incoming.utm_term || String(params.utm_term || ""),
  };
}

export function buildTrackedHref(href: string, params: EventParams = {}) {
  if (typeof window === "undefined") return href;
  if (href.startsWith("https://wa.me/") || href.startsWith("mailto:") || href.startsWith("tel:")) return href;

  const utm = getCtaUtmParams(params);
  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;

  if (withoutHash === "") {
    const query = new URLSearchParams(utm).toString();
    return `?${query}${hash}`;
  }

  try {
    const url = new URL(withoutHash, window.location.origin);
    if (url.origin !== window.location.origin) return href;
    Object.entries(utm).forEach(([key, value]) => url.searchParams.set(key, value));
    return `${url.pathname}${url.search}${hash}`;
  } catch {
    return href;
  }
}
