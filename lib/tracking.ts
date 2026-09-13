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
  };
}

export function trackEvent(name: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;

  const w = window as WindowWithTracking;
  w.dataLayer?.push({ event: name, ...params });
  w.gtag?.("event", name, params);
}

export function trackLead(params: EventParams = {}) {
  if (typeof window === "undefined") return;

  const w = window as WindowWithTracking;
  trackEvent("lead", params);
  w.fbq?.("track", "Lead", params);
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

const viewedOnce = new Set<string>();

/**
 * Dispara un evento de visualización como máximo una vez por carga de página,
 * para que volver a pasar por la sección no infle el conteo.
 * Devuelve `true` solo la primera vez.
 */
export function trackViewOnce(name: string, params: EventParams = {}) {
  if (typeof window === "undefined") return false;
  if (viewedOnce.has(name)) return false;

  viewedOnce.add(name);
  trackEvent(name, { ...params, ...getCtaUtmParams(params) });
  return true;
}

/**
 * Registra `name` cuando `element` entra en el viewport. Devuelve la función de
 * limpieza para el efecto que lo monta. Si el navegador no expone
 * `IntersectionObserver`, el evento se dispara de inmediato: preferimos un
 * conteo ligeramente optimista antes que perder el denominador del embudo.
 */
export function observeViewOnce(
  element: Element | null,
  name: string,
  params: EventParams = {},
  threshold = 0.25
) {
  if (typeof window === "undefined" || !element) return () => {};

  if (typeof IntersectionObserver === "undefined") {
    trackViewOnce(name, params);
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      trackViewOnce(name, params);
      observer.disconnect();
    },
    { threshold }
  );

  observer.observe(element);
  return () => observer.disconnect();
}
