import type { Deal } from "./types";

/**
 * TODAY'S DEALS — editable promo cards.
 * `badge` is the discount label shown on the card. Set it to "" to hide the
 * badge until a real promotion is confirmed; the individual product discounts
 * come from `compareAtPrice` in lib/licor/catalog.ts.
 */
export const DEALS: Deal[] = [
  {
    id: "weekend-deals",
    title: "WEEKEND DEALS",
    subtitle: "Rotating markdowns across spirits and beer.",
    badge: "[DISCOUNT]",
    filter: { tag: "weekend" },
    accent: "red",
  },
  {
    id: "best-sellers",
    title: "BEST SELLERS",
    subtitle: "The bottles that move fastest, every single night.",
    badge: "",
    filter: { tag: "best-seller" },
    accent: "gold",
  },
  {
    id: "bundle-deals",
    title: "BUNDLE DEALS",
    subtitle: "Pair a bottle with mixers and save on the set.",
    badge: "[DISCOUNT]",
    filter: { category: "mixers" },
    accent: "red",
  },
  {
    id: "beer-cases",
    title: "BEER CASES",
    subtitle: "12 packs of Corona, Modelo and Heineken.",
    badge: "",
    filter: { tag: "case" },
    accent: "gold",
  },
  {
    id: "premium-spirits",
    title: "PREMIUM SPIRITS",
    subtitle: "Top-shelf tequila, cognac, whiskey and champagne.",
    badge: "",
    filter: { tag: "premium" },
    accent: "gold",
  },
  {
    id: "limited-offers",
    title: "LIMITED OFFERS",
    subtitle: "Everything currently marked down in the store.",
    badge: "[DISCOUNT]",
    filter: { onSale: true },
    accent: "red",
  },
];

export function getDeal(id: string): Deal | undefined {
  return DEALS.find((deal) => deal.id === id);
}

/** Turns a deal's filter into the shop query string it should open. */
export function dealQuery(deal: Deal): string {
  const params = new URLSearchParams();
  if (deal.filter.category) params.set("category", deal.filter.category);
  if (deal.filter.tag) params.set("tag", deal.filter.tag);
  if (deal.filter.onSale) params.set("sale", "1");
  const query = params.toString();
  return query ? `?${query}` : "";
}
