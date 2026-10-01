import type { ObjectiveId } from "@/lib/catalog/objectives";
import type { AnalysisResult } from "@/lib/services/analysis-engine";
import type { ConceptPlan } from "@/lib/services/concept-engine";
import { productTitle, type ProductBrief } from "@/lib/product-brief";

export type CopyResult = {
  headline: string;
  primaryText: string;
  description: string;
  cta: string;
  shortCopy: string;
  longCopy: string;
  missingInfo: string[];
};

const OBJECTIVE_CLOSING: Record<ObjectiveId, string> = {
  VENDER: "Compra hoy mismo.",
  MENSAJES: "Escríbenos y te ayudamos a elegir.",
  LEADS: "Déjanos tus datos y te contactamos.",
  PROMOCIONAR: "Aprovecha la oferta mientras esté vigente.",
  LANZAMIENTO: "Sé de los primeros en conocerlo.",
  RECONOCIMIENTO: "Conócelo hoy.",
};

function joinFeatures(features: string[]) {
  return features.join(" · ");
}

function withCta(text: string, cta: string) {
  return `${text} ${cta}.`;
}

function buildResult(
  parts: {
    headline: string;
    primaryText: string;
    description: string;
    shortCopy: string;
    longCopyExtra?: string;
  },
  brief: ProductBrief,
  analysis: AnalysisResult,
  missingInfo: string[]
): CopyResult {
  const closingLines = [
    brief.description?.trim(),
    parts.longCopyExtra,
    brief.brandContact ? `Contacto: ${brief.brandContact}` : null,
  ].filter(Boolean);

  return {
    headline: parts.headline,
    primaryText: parts.primaryText,
    description: parts.description,
    cta: analysis.recommendedCta,
    shortCopy: parts.shortCopy,
    longCopy: [parts.primaryText, ...closingLines].join("\n\n"),
    missingInfo,
  };
}

function ventaDirecta(brief: ProductBrief, analysis: AnalysisResult): CopyResult {
  const title = productTitle(brief);
  const missing: string[] = [];
  const priceLine = brief.priceDisplay;
  const offerLine = brief.offer?.trim();
  if (!priceLine && !offerLine) missing.push("precio u oferta");

  const features = analysis.topFeatures;
  if (features.length === 0) missing.push("características");

  const headline = offerLine
    ? `${offerLine} en ${title}`
    : priceLine
      ? `${title} desde ${priceLine.replace(/^desde\s*/i, "")}`
      : `${title}: disponible ahora`;

  const primaryText = withCta(
    offerLine
      ? `${title}. ${offerLine}${features.length ? `. ${joinFeatures(features)}` : ""}.`
      : features.length
        ? `${title}. ${joinFeatures(features)}.`
        : `${title}, disponible ahora.`,
    analysis.recommendedCta
  );

  return buildResult(
    {
      headline,
      primaryText,
      description: offerLine ?? priceLine ?? "Consulta disponibilidad",
      shortCopy: offerLine
        ? `${offerLine} · ${title}`
        : priceLine
          ? `${title} · ${priceLine}`
          : title,
      longCopyExtra: features.length ? joinFeatures(features) : undefined,
    },
    brief,
    analysis,
    missing
  );
}

function beneficio(brief: ProductBrief, analysis: AnalysisResult): CopyResult {
  const title = productTitle(brief);
  const missing: string[] = [];
  const benefit = analysis.primaryBenefit;
  const offerLine = brief.offer?.trim();

  if (!benefit && !offerLine) missing.push("beneficio");

  const headline = benefit
    ? benefit
    : offerLine
      ? `${offerLine} en ${title}`
      : `Descubre ${title}`;

  const primaryText = withCta(
    benefit
      ? `${title}. ${benefit}${offerLine ? `. ${offerLine}` : ""}.`
      : offerLine
        ? `${title}. ${offerLine}.`
        : `${title}. Conoce sus características y disponibilidad.`,
    analysis.recommendedCta
  );

  return buildResult(
    {
      headline,
      primaryText,
      description: offerLine ?? title,
      shortCopy: benefit ?? offerLine ?? title,
    },
    brief,
    analysis,
    missing
  );
}

function aspiracional(brief: ProductBrief, analysis: AnalysisResult): CopyResult {
  const title = productTitle(brief);
  const missing: string[] = [];
  const benefit = analysis.primaryBenefit;
  const offerLine = brief.offer?.trim();

  if (!brief.targetAudience && !benefit) missing.push("público objetivo o beneficio");

  const headline = benefit
    ? benefit
    : brief.targetAudience
      ? `Diseñado para ${brief.targetAudience}`
      : `Descubre ${title}`;

  const primaryText = withCta(
    benefit
      ? `${title}. ${benefit}${offerLine ? `. ${offerLine}` : ""}.`
      : brief.targetAudience
        ? `${title}, pensado para ${brief.targetAudience}.`
        : `${title}. Conoce más sobre el producto.`,
    analysis.recommendedCta
  );

  return buildResult(
    {
      headline,
      primaryText,
      description: offerLine ?? title,
      shortCopy: benefit ?? title,
    },
    brief,
    analysis,
    missing
  );
}

function oferta(brief: ProductBrief, analysis: AnalysisResult): CopyResult {
  const title = productTitle(brief);
  const missing: string[] = [];
  const offerLine = brief.offer?.trim();

  if (!offerLine && !brief.priceDisplay) missing.push("oferta o precio");

  const headline = offerLine
    ? `${offerLine} en ${title}`
    : brief.priceDisplay
      ? `${title} desde ${brief.priceDisplay.replace(/^desde\s*/i, "")}`
      : `Conoce ${title}`;

  const primaryText = withCta(
    offerLine
      ? `${title}. ${offerLine}.`
      : brief.priceDisplay
        ? `${title} a ${brief.priceDisplay}.`
        : `${title}, consulta disponibilidad.`,
    analysis.recommendedCta
  );

  return buildResult(
    {
      headline,
      primaryText,
      description: offerLine ?? brief.priceDisplay ?? title,
      shortCopy: offerLine ?? brief.priceDisplay ?? title,
    },
    brief,
    analysis,
    missing
  );
}

function caracteristica(
  brief: ProductBrief,
  analysis: AnalysisResult,
  concept: ConceptPlan
): CopyResult {
  const title = productTitle(brief);
  const missing: string[] = [];
  const feature = concept.highlightedFeature || analysis.differentiatingFeature;
  if (!feature) missing.push("características");

  const offerLine = brief.offer?.trim();
  // A one-word fact ("Nuevo", "4x4") is not a headline on its own: pair it
  // with the product ("Chevrolet nuevo").
  const headline = feature
    ? feature.trim().split(/\s+/).length < 2
      ? `${title} ${feature.trim().toLowerCase()}`
      : feature
    : offerLine
      ? `${offerLine} en ${title}`
      : `Conoce ${title}`;

  const primaryText = withCta(
    feature
      ? `${title}. ${feature}.${offerLine ? ` ${offerLine}.` : ""}`
      : `${title}.${offerLine ? ` ${offerLine}.` : ""}`,
    analysis.recommendedCta
  );

  return buildResult(
    {
      headline,
      primaryText,
      description: offerLine ?? title,
      shortCopy: feature ?? offerLine ?? title,
    },
    brief,
    analysis,
    missing
  );
}

/**
 * Deterministic copy engine. It only uses facts supplied in the brief.
 * The strategic angle changes by concept, while every exact commercial claim
 * remains grounded in the product data.
 */
export function generateCopy(
  concept: ConceptPlan,
  brief: ProductBrief,
  analysis: AnalysisResult,
  closing: ObjectiveId
): CopyResult {
  const base = (() => {
    switch (concept.type) {
      case "VENTA_DIRECTA":
        return ventaDirecta(brief, analysis);
      case "BENEFICIO":
        return beneficio(brief, analysis);
      case "ASPIRACIONAL":
        return aspiracional(brief, analysis);
      case "OFERTA":
        return oferta(brief, analysis);
      case "CARACTERISTICA":
        return caracteristica(brief, analysis, concept);
      default:
        return ventaDirecta(brief, analysis);
    }
  })();

  return {
    ...base,
    longCopy: `${base.longCopy}\n\n${OBJECTIVE_CLOSING[closing]}`,
  };
}
