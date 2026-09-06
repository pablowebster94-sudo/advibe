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
  PROMOCIONAR: "Oferta por tiempo limitado.",
  LANZAMIENTO: "Sé de los primeros en tenerlo.",
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

function ventaDirecta(
  brief: ProductBrief,
  analysis: AnalysisResult
): CopyResult {
  const title = productTitle(brief);
  const missing: string[] = [];
  const priceLine = brief.priceDisplay;
  if (!priceLine) missing.push("precio");
  const features = analysis.topFeatures;
  if (features.length === 0) missing.push("características");

  // Price is shown separately as a badge on the rendered creative, so the
  // headline stays focused on the product name instead of repeating it.
  const headline = title;
  const primaryText = withCta(
    features.length
      ? `${title}. ${joinFeatures(features)}.`
      : `${title}, disponible ahora.`,
    analysis.recommendedCta
  );

  return buildResult(
    {
      headline,
      primaryText,
      description: priceLine ?? "Consulta disponibilidad",
      shortCopy: priceLine ? `${title} · ${priceLine}` : title,
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
  if (!benefit) missing.push("beneficios");

  const headline = benefit ? benefit : `${title}, pensado para ti`;
  const primaryText = withCta(
    benefit
      ? `Con ${title} obtienes ${benefit.toLowerCase()}.`
      : `${title} está diseñado para hacer tu día más fácil.`,
    analysis.recommendedCta
  );

  return buildResult(
    {
      headline,
      primaryText,
      description: title,
      shortCopy: benefit ?? title,
    },
    brief,
    analysis,
    missing
  );
}

function aspiracional(
  brief: ProductBrief,
  analysis: AnalysisResult
): CopyResult {
  const title = productTitle(brief);
  const missing: string[] = [];
  if (!brief.targetAudience) missing.push("público objetivo");

  const headline = `Vive la experiencia ${title}`;
  const primaryText = withCta(
    brief.targetAudience
      ? `Diseñado para ${brief.targetAudience.toLowerCase()}.`
      : `${title} te acompaña en cada paso.`,
    analysis.recommendedCta
  );

  return buildResult(
    {
      headline,
      primaryText,
      description: title,
      shortCopy: title,
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

  const headline = offerLine ?? (brief.priceDisplay ? `${title} — ${brief.priceDisplay}` : title);
  const primaryText = withCta(
    offerLine
      ? `${offerLine} en ${title}.`
      : brief.priceDisplay
        ? `${title} a ${brief.priceDisplay}.`
        : `${title}, disponibilidad limitada.`,
    analysis.recommendedCta
  );

  return buildResult(
    {
      headline,
      primaryText,
      description: brief.priceDisplay ?? "Oferta por tiempo limitado",
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
  const feature = concept.highlightedFeature;
  if (!feature) missing.push("características");

  const headline = feature ? feature : title;
  const primaryText = withCta(
    feature
      ? `${title} incorpora ${feature.toLowerCase()}.`
      : `Descubre todo lo que ofrece ${title}.`,
    analysis.recommendedCta
  );

  return buildResult(
    {
      headline,
      primaryText,
      description: title,
      shortCopy: feature ?? title,
    },
    brief,
    analysis,
    missing
  );
}

/**
 * Deterministic, template-based copywriter — no external API key needed, so
 * the MVP works out of the box (see AGENTS.md #7: never invent facts). Every
 * template only reads fields that exist on the brief; anything it can't
 * fill in is reported in `missingInfo` instead of being fabricated. Swap in
 * an LLM-backed provider later behind the same signature.
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
