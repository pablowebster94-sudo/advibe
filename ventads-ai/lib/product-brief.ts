import type { Brand, Product } from "@/generated/prisma/client";
import { formatPrice, toList } from "@/lib/text";

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

function normalizeOffer(value: string | null | undefined): string | null {
  const offer = value?.trim();
  if (!offer) return null;
  // A bare "Descuento", "Oferta" or "Promoción" is not a usable commercial
  // claim. Do not let it become the main headline of a finished ad.
  if (/^(descuento|oferta|promocion|promoción|promo)$/i.test(offer)) return null;
  return offer;
}

export function buildProductBrief(product: Product, brand: Brand | null): ProductBrief {
  const priceDisplay = product.priceLabel?.trim() || formatPrice(product.price, product.currency);

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
    offer: normalizeOffer(product.offer),
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
  return [brief.manufacturer, brief.productName, brief.model].filter(Boolean).join(" ");
}

export function isVehicleBrief(
  brief: Pick<ProductBrief, "category" | "productName" | "description">
): boolean {
  const normalized = (brief.category + " " + brief.productName + " " + (brief.description || ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return (
    /\bvehiculos?\b/.test(normalized) ||
    /\bautos?\b/.test(normalized) ||
    /\bcamionetas?\b/.test(normalized) ||
    /\bcamiones?\b/.test(normalized) ||
    /\bmotos?\b/.test(normalized) ||
    /\bpickups?\b/.test(normalized) ||
    /\bsedans?\b/.test(normalized) ||
    /\bsuvs?\b/.test(normalized)
  );
}
