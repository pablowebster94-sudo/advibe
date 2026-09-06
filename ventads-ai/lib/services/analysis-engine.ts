import type { ObjectiveId } from "@/lib/catalog/objectives";
import type { ProductBrief } from "@/lib/product-brief";

export type AnalysisResult = {
  topFeatures: string[];
  primaryBenefit: string | null;
  differentiatingFeature: string | null;
  recommendedCta: string;
  hasOffer: boolean;
  hasPrice: boolean;
  missingFields: string[];
};

const DEFAULT_CTA_BY_OBJECTIVE: Record<ObjectiveId, string> = {
  VENDER: "Compra ahora",
  MENSAJES: "Escríbenos",
  LEADS: "Quiero más información",
  PROMOCIONAR: "Aprovecha la oferta",
  LANZAMIENTO: "Descúbrelo primero",
  RECONOCIMIENTO: "Conoce más",
};

/**
 * Reads a ProductBrief and decides what the concept/copy engines should
 * emphasize. Never invents facts — it only selects and prioritizes among
 * what the user actually provided, and reports what's missing so the UI or
 * copy can flag it instead of making something up (AGENTS.md #7/#9).
 */
export function analyzeProduct(
  brief: ProductBrief,
  objective: ObjectiveId
): AnalysisResult {
  const missingFields: string[] = [];

  if (!brief.priceDisplay) missingFields.push("precio");
  if (brief.features.length === 0) missingFields.push("características");
  if (brief.benefits.length === 0) missingFields.push("beneficios");
  if (!brief.targetAudience) missingFields.push("público objetivo");
  if (!brief.description) missingFields.push("descripción");

  const primaryBenefit = brief.benefits[0] ?? null;
  const differentiatingFeature =
    brief.features.find((feature) => /\d/.test(feature)) ??
    brief.features[0] ??
    null;

  const recommendedCta =
    brief.cta?.trim() ||
    brief.brandCta?.trim() ||
    DEFAULT_CTA_BY_OBJECTIVE[objective];

  return {
    topFeatures: brief.features.slice(0, 3),
    primaryBenefit,
    differentiatingFeature,
    recommendedCta,
    hasOffer: Boolean(brief.offer?.trim()),
    hasPrice: Boolean(brief.priceDisplay),
    missingFields,
  };
}
