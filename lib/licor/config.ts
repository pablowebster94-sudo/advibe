/**
 * Licor Store 24 — single source of truth for business data.
 *
 * IMPORTANT: every value marked `[BRACKETED]` is an editable placeholder.
 * Nothing in this file may be invented: if the real business data is unknown,
 * keep the placeholder so it is obvious that it still needs to be filled in.
 */

export type Phone = {
  /** Human readable label shown in the UI. */
  label: string;
  /** E.164 value used by `tel:` links. */
  tel: string;
};

/**
 * The storefront is mounted under this path segment so it can live next to the
 * agency site. To move it to its own domain, point the domain at this path
 * (rewrite `/:path*` -> `/licor-store-24/:path*`) or change this constant.
 */
export const BASE_PATH = "/licor-store-24";

/** Build an internal href for the storefront. `route("/shop")` -> `/licor-store-24/shop`. */
export function route(path = "/"): string {
  if (path === "/") return BASE_PATH;
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

export const BUSINESS = {
  name: "Licor Store 24",
  legalName: "Licor Store 24",
  concept: "24/7 FREE DELIVERY",
  headline: "YOUR LIQUOR. DELIVERED 24/7.",
  subheadline: "Premium spirits, beer & more — delivered to your door.",
  serviceArea: "New York",
  /** Not published by the business yet — keep the placeholder. */
  address: "[BUSINESS ADDRESS]",
  email: "[BUSINESS EMAIL]",
  phones: [
    { label: "631-882-2462", tel: "+16318822462" },
    { label: "631-708-1009", tel: "+16317081009" },
  ] as Phone[],
  /** The only operating claim the business makes: open around the clock. */
  hours: "24/7",
  minimumAge: 21,
  social: {
    instagram: "[INSTAGRAM URL]",
    facebook: "[FACEBOOK URL]",
  },
} as const;

export const SITE = {
  /** Public origin used for canonical URLs, OG tags and structured data. */
  url: process.env.NEXT_PUBLIC_LICOR_SITE_URL || "https://www.advibeagencia.com",
  title: "Licor Store 24 | 24/7 Liquor Delivery in New York",
  description:
    "Shop premium liquor, beer and spirits with 24/7 delivery from Licor Store 24. Order online or call now.",
  locale: "en_US",
  themeColor: "#0A0A0B",
} as const;

/** Absolute URL for the storefront (or one of its routes). */
export function absoluteUrl(path = "/"): string {
  return `${SITE.url}${route(path)}`;
}

/**
 * Commercial policy. Free delivery is the brand's own stated concept.
 * Anything the business has not published stays a placeholder and is not
 * rendered as a fact anywhere in the UI.
 */
export const COMMERCE = {
  currency: "USD",
  /** The advertised offer: delivery is free. */
  deliveryFee: 0,
  deliveryLabel: "FREE",
  /** Unknown — never render a made-up ETA. */
  deliveryEta: "[DELIVERY TIME]",
  /** Unknown — the checkout shows the placeholder, not an invented zone list. */
  deliveryZones: "[DELIVERY ZONES]",
  /** Unknown — no minimum is advertised until the business confirms one. */
  minimumOrder: null as number | null,
  /**
   * Taxes and fees are not configured. While `enabled` is false the cart shows
   * a "to be confirmed" line instead of an invented amount.
   */
  taxes: { enabled: false, rate: 0, label: "[TAXES & FEES]" },
  /**
   * No payment gateway is connected. `provider: null` keeps the checkout in
   * "order request" mode. See lib/licor/payments.ts for the integration point.
   */
  payment: {
    provider: null as "stripe" | null,
    /** Shown at checkout while no gateway is live. */
    note: "[PAYMENT METHOD TO BE CONFIRMED WITH THE STORE]",
  },
  /** Demo pricing flag — surfaces the disclosure banner while true. */
  demoPricing: true,
} as const;

export const DESKTOP_NAV = [
  { label: "Home", href: route("/") },
  { label: "Shop", href: route("/shop") },
  { label: "Categories", href: route("/shop#categories") },
  { label: "Deals", href: route("/deals") },
  { label: "Delivery", href: route("/delivery") },
  { label: "Contact", href: route("/contact") },
] as const;

export const MOBILE_NAV = [
  { label: "Home", href: route("/"), icon: "home" },
  { label: "Shop", href: route("/shop"), icon: "shop" },
  { label: "Deals", href: route("/deals"), icon: "deals" },
  { label: "Cart", href: route("/cart"), icon: "cart" },
  { label: "Account", href: route("/account"), icon: "account" },
] as const;

export const FOOTER_LINKS = [
  { label: "Shop", href: route("/shop") },
  { label: "Deals", href: route("/deals") },
  { label: "Delivery", href: route("/delivery") },
  { label: "Contact", href: route("/contact") },
  { label: "Privacy Policy", href: route("/privacy") },
  { label: "Terms", href: route("/terms") },
  { label: "Age Verification", href: route("/age-verification") },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "1",
    title: "CHOOSE YOUR DRINK",
    copy: "Browse whiskey, tequila, vodka, cognac, beer and more from the full catalog.",
  },
  {
    step: "2",
    title: "PLACE YOUR ORDER",
    copy: "Order online in a few taps, or call the store directly — whatever is faster for you.",
  },
  {
    step: "3",
    title: "WE DELIVER",
    copy: "We bring it to your door. Free delivery, around the clock.",
  },
] as const;

export const DELIVERY_PILLARS = ["FAST", "RELIABLE", "24/7", "FREE DELIVERY"] as const;
