type EventParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;

  const w = window as typeof window & {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (command: string, eventName: string, eventParams?: EventParams) => void;
  };

  w.dataLayer?.push({ event: name, ...params });
  w.gtag?.("event", name, params);
}
