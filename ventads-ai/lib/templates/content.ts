import { z } from "zod";
import type { Brand, Product } from "@/generated/prisma/client";
import { displayCase, type ProductBrief } from "@/lib/product-brief";
import { toList } from "@/lib/text";
import { promotionSchema } from "@/lib/validation";
import type { AdContent, Promotion, TemplateBrand } from "@/lib/templates/types";

/**
 * Builds the exact ad content for the template renderer from what the user
 * entered (Product + Brand) and the concept's copy. Never invents a fact:
 * every line comes from a field; anything missing simply isn't shown.
 */

const DEFAULT_PRIMARY = "#1f3a5f";
const DEFAULT_ACCENT = "#d4a72c";

export function templateBrandFrom(brand: Brand | null, logo: Buffer | null): TemplateBrand {
  let colors: string[] = [];
  try {
    const parsed = brand?.colors ? JSON.parse(brand.colors) : [];
    if (Array.isArray(parsed)) colors = parsed.filter((c) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c));
  } catch {
    colors = [];
  }
  return {
    name: brand?.name ?? null,
    logo,
    primary: colors[0] ?? DEFAULT_PRIMARY,
    accent: colors[1] ?? DEFAULT_ACCENT,
  };
}

/** Promotions stored as JSON; anything malformed is dropped, never guessed. */
export function parsePromotions(value: unknown): Promotion[] {
  const parsed = z.array(promotionSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

/** A free-text offer like "15% de descuento" becomes a promotion when it starts with a figure. */
function offerAsPromotion(offer: string | null): Promotion[] {
  const match = offer ? /^\s*([0-9]+(?:[.,][0-9]+)?\s*%?|\d+x\d+)\s+(.+)$/i.exec(offer) : null;
  return match ? [{ value: match[1].replace(/\s+/g, ""), label: match[2].trim() }] : [];
}

function titleParts(product: Pick<Product, "adTitle" | "name">): { kicker: string | null; title: string } {
  const raw = product.adTitle?.trim();
  if (raw) {
    const [first, ...rest] = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (rest.length > 0) return { kicker: displayCase(first), title: displayCase(rest.join(" ")) };
    return { kicker: null, title: displayCase(first) };
  }
  return { kicker: null, title: displayCase(product.name.trim()) };
}

export function buildAdContent(input: {
  product: Pick<Product, "adTitle" | "name" | "description" | "includes" | "promotions">;
  brand: Brand | null;
  brief: ProductBrief;
  conceptType: string;
  copy: { headline: string; cta: string };
}): AdContent {
  const { product, brand, brief } = input;
  const { kicker, title } = titleParts(product);
  const price = brief.priceDisplay;
  const lower = (s: string) => s.toLowerCase();
  const fullTitle = lower([kicker, title].filter(Boolean).join(" "));

  // A subtitle must add information: never the title again, never the price.
  const distinct = (text: string | null | undefined) => {
    const t = text?.trim();
    if (!t) return null;
    if (lower(t).includes(lower(title)) || fullTitle.includes(lower(t))) return null;
    if (price && t.includes(price)) return null;
    return t;
  };
  const description = brief.description?.split(/(?<=[.!?])\s+/)[0] ?? null;
  const subtitle =
    input.conceptType === "CARACTERISTICA"
      ? distinct(input.copy.headline) ?? distinct(description)
      : distinct(description) ?? distinct(brief.offer) ?? distinct(input.copy.headline);

  const promotions = parsePromotions(product.promotions);

  return {
    kicker,
    title,
    subtitle,
    price,
    includes: toList(product.includes).map((item) => displayCase(item)),
    benefits: brief.benefits.length > 0 ? brief.benefits : brief.features,
    promotions: promotions.length > 0 ? promotions : offerAsPromotion(brief.offer),
    cta: input.copy.cta || brand?.defaultCta || "Escríbenos",
    whatsapp: brand?.contactPhone?.trim() || null,
    footerNote: brand?.footerNote?.trim() || null,
  };
}
