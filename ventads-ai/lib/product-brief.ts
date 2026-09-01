import type { Brand, Product } from "@/generated/prisma/client";
import { formatPrice, toList } from "@/lib/text";

/**
 * Normalized view of a Product (+ its optional Brand identity) that every
 * downstream engine (analysis, concepts, copy, rendering) reads from. Having
 * one shared shape means none of those engines need to know about Prisma.
 */
export type ProductBrief = {
  productName: string;
  category: string;
  manufacturer: string | null;
  model: string | null;
  priceDisplay: string | null;
  description: string | null;
  features: string[];
  benefits: string[];
  offer: string | null;
  cta: string | null;
  targetAudience: string | null;
  brandName: string | null;
  brandCta: string | null;
  brandContact: string | null;
  logoKey: string | null;
  brandColors: string[] | null;
};

export function buildProductBrief(
  product: Product,
  brand: Brand | null
): ProductBrief {
  const priceDisplay =
    product.priceLabel?.trim() ||
    formatPrice(product.price, product.currency);

  let brandColors: string[] | null = null;
  if (brand?.colors) {
    try {
      const parsed = JSON.parse(brand.colors);
      if (Array.isArray(parsed)) brandColors = parsed;
    } catch {
      brandColors = null;
    }
  }

  return {
    productName: product.name,
    category: product.category,
    manufacturer: product.manufacturer,
    model: product.model,
    priceDisplay,
    description: product.description,
    features: toList(product.features),
    benefits: toList(product.benefits),
    offer: product.offer,
    cta: product.cta,
    targetAudience: product.targetAudience,
    brandName: brand?.name ?? null,
    brandCta: brand?.defaultCta ?? null,
    brandContact: brand?.contactPhone || brand?.contactEmail || null,
    logoKey: brand?.logoKey ?? null,
    brandColors,
  };
}

export function productTitle(brief: ProductBrief) {
  return [brief.manufacturer, brief.productName, brief.model]
    .filter(Boolean)
    .join(" ");
}
