"use client";

import { COMMERCE } from "./config";
import type { CartTotals, Product } from "./types";

/**
 * Meta Pixel + GA4 event layer.
 *
 * No IDs are hardcoded. Configure them through environment variables:
 *   NEXT_PUBLIC_META_PIXEL_ID   — "META_PIXEL_ID" placeholder until set
 *   NEXT_PUBLIC_GA4_ID          — GA4 measurement id
 *   META_CAPI_ACCESS_TOKEN      — server only, used by the Conversions API route
 *
 * When an id is missing the tracker no-ops (and logs in development) so the
 * storefront keeps working without any analytics account attached.
 */

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? "";

export const hasMetaPixel = Boolean(META_PIXEL_ID);
export const hasGa4 = Boolean(GA4_ID);

/** Standard Meta events used by this funnel. */
export type MetaStandardEvent =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase"
  | "Contact"
  | "Lead";

type Primitive = string | number | boolean | undefined;
export type EventParams = Record<string, Primitive | Primitive[] | object>;

type Fbq = ((
  command: "track" | "trackCustom" | "init" | "consent",
  eventName: string,
  params?: EventParams,
  options?: { eventID?: string },
) => void) & { queue?: unknown[] };

type TrackingWindow = Window & {
  fbq?: Fbq;
  gtag?: (command: string, target: string, params?: EventParams) => void;
  dataLayer?: Array<Record<string, unknown>>;
};

function win(): TrackingWindow | null {
  return typeof window === "undefined" ? null : (window as TrackingWindow);
}

/** Unique id so the Pixel event and its Conversions API twin get deduplicated. */
export function newEventId(): string {
  const w = win();
  if (w?.crypto?.randomUUID) return w.crypto.randomUUID();
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Fires one funnel event to every configured destination:
 * Meta Pixel (browser), GA4/dataLayer, and the Meta Conversions API (server).
 */
export function track(
  event: MetaStandardEvent,
  params: EventParams = {},
  options: { sendToCapi?: boolean; eventId?: string } = {},
): void {
  const w = win();
  if (!w) return;

  const eventId = options.eventId ?? newEventId();

  if (hasMetaPixel && typeof w.fbq === "function") {
    w.fbq("track", event, params, { eventID: eventId });
  }

  // GA4 / GTM. Meta event names are mapped to their GA4 equivalents.
  const ga4Name = GA4_EVENT_MAP[event] ?? event;
  w.dataLayer?.push({ event: ga4Name, ...params });
  if (hasGa4 && typeof w.gtag === "function") {
    w.gtag("event", ga4Name, params);
  }

  if (options.sendToCapi !== false) {
    void sendToConversionsApi(event, params, eventId);
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[licor/analytics]", event, { eventId, ...params });
  }
}

const GA4_EVENT_MAP: Partial<Record<MetaStandardEvent, string>> = {
  PageView: "page_view",
  ViewContent: "view_item",
  Search: "search",
  AddToCart: "add_to_cart",
  InitiateCheckout: "begin_checkout",
  Purchase: "purchase",
};

/**
 * Server-side twin of the browser event. The route is a no-op unless
 * META_CAPI_ACCESS_TOKEN and NEXT_PUBLIC_META_PIXEL_ID are both configured,
 * so this is safe to call unconditionally.
 */
async function sendToConversionsApi(
  event: MetaStandardEvent,
  params: EventParams,
  eventId: string,
): Promise<void> {
  if (!hasMetaPixel) return;
  try {
    await fetch("/api/licor/meta-capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: event,
        eventId,
        eventSourceUrl: window.location.href,
        customData: params,
      }),
      keepalive: true,
    });
  } catch {
    // Analytics must never break the purchase flow.
  }
}

// ── Funnel helpers ──────────────────────────────────────────────────────────

export function toContent(product: Product, quantity = 1) {
  return {
    id: product.slug,
    quantity,
    item_price: product.price,
  };
}

export function trackViewContent(product: Product): void {
  track("ViewContent", {
    content_ids: [product.slug],
    content_name: product.name,
    content_type: "product",
    content_category: product.category,
    contents: [toContent(product)],
    value: product.price,
    currency: COMMERCE.currency,
  });
}

export function trackSearch(query: string, resultCount: number): void {
  if (!query.trim()) return;
  track("Search", {
    search_string: query,
    content_category: "catalog",
    results: resultCount,
  });
}

export function trackAddToCart(product: Product, quantity: number): void {
  track("AddToCart", {
    content_ids: [product.slug],
    content_name: product.name,
    content_type: "product",
    content_category: product.category,
    contents: [toContent(product, quantity)],
    value: Number((product.price * quantity).toFixed(2)),
    currency: COMMERCE.currency,
  });
}

export function trackInitiateCheckout(
  contents: Array<{ id: string; quantity: number; item_price: number }>,
  totals: CartTotals,
): void {
  track("InitiateCheckout", {
    content_ids: contents.map((c) => c.id),
    content_type: "product",
    contents,
    num_items: totals.itemCount,
    value: totals.total,
    currency: COMMERCE.currency,
  });
}

export function trackPurchase(
  orderId: string,
  contents: Array<{ id: string; quantity: number; item_price: number }>,
  totals: CartTotals,
): void {
  track("Purchase", {
    order_id: orderId,
    content_ids: contents.map((c) => c.id),
    content_type: "product",
    contents,
    num_items: totals.itemCount,
    value: totals.total,
    currency: COMMERCE.currency,
  });
}

export function trackPhoneCall(phone: string): void {
  track("Contact", { method: "phone", phone_number: phone });
}
