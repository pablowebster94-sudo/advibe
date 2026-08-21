import { CONCEPT_TYPES, type ConceptTypeId } from "@/lib/catalog/concepts";
import type { AnalysisResult } from "@/lib/services/analysis-engine";
import type { ProductBrief } from "@/lib/product-brief";

export type ConceptPlan = {
  type: ConceptTypeId;
  label: string;
  rationale: string;
  highlightedFeature: string | null;
};

type Builder = {
  type: ConceptTypeId;
  canBuild: (brief: ProductBrief, analysis: AnalysisResult) => boolean;
  build: (brief: ProductBrief, analysis: AnalysisResult) => ConceptPlan;
};

const BUILDERS: Builder[] = [
  {
    type: "VENTA_DIRECTA",
    canBuild: () => true,
    build: (brief, analysis) => ({
      type: "VENTA_DIRECTA",
      label: CONCEPT_TYPES[0].label,
      rationale: analysis.hasPrice
        ? "Combina precio y características principales para impulsar la decisión de compra."
        : "Presenta el producto y sus características principales para impulsar la decisión de compra.",
      highlightedFeature: analysis.topFeatures[0] ?? null,
    }),
  },
  {
    type: "BENEFICIO",
    canBuild: (brief, analysis) =>
      Boolean(analysis.primaryBenefit) || brief.features.length > 0,
    build: (brief, analysis) => ({
      type: "BENEFICIO",
      label: CONCEPT_TYPES[1].label,
      rationale: "Enfatiza el principal beneficio para el público objetivo.",
      highlightedFeature: analysis.primaryBenefit ?? analysis.topFeatures[0] ?? null,
    }),
  },
  {
    type: "ASPIRACIONAL",
    canBuild: () => true,
    build: (brief) => ({
      type: "ASPIRACIONAL",
      label: CONCEPT_TYPES[2].label,
      rationale: brief.targetAudience
        ? `Composición emocional pensada para conectar con: ${brief.targetAudience}.`
        : "Composición emocional / lifestyle para generar deseo por el producto.",
      highlightedFeature: null,
    }),
  },
  {
    type: "OFERTA",
    canBuild: (brief, analysis) => analysis.hasOffer || analysis.hasPrice,
    build: (brief, analysis) => ({
      type: "OFERTA",
      label: CONCEPT_TYPES[3].label,
      rationale: analysis.hasOffer
        ? "Enfatiza la oferta o promoción vigente para generar urgencia."
        : "Enfatiza el precio y la disponibilidad para generar urgencia.",
      highlightedFeature: brief.offer ?? brief.priceDisplay,
    }),
  },
  {
    type: "CARACTERISTICA",
    canBuild: (brief) => brief.features.length > 0,
    build: (brief, analysis) => {
      const feature =
        analysis.differentiatingFeature ??
        brief.features.find((item) => item !== analysis.topFeatures[0]) ??
        brief.features[0];
      return {
        type: "CARACTERISTICA",
        label: CONCEPT_TYPES[4].label,
        rationale: `Destaca una característica diferenciadora: "${feature}".`,
        highlightedFeature: feature,
      };
    },
  },
];

/**
 * Produces the set of creative angles for a product. The number and mix of
 * concepts is data-driven — a product with no offer and no price simply
 * won't get an OFERTA concept — and adding a new angle later is one entry
 * in BUILDERS (AGENTS.md #4).
 */
export function buildConcepts(
  brief: ProductBrief,
  analysis: AnalysisResult
): ConceptPlan[] {
  return BUILDERS.filter((builder) => builder.canBuild(brief, analysis)).map(
    (builder) => builder.build(brief, analysis)
  );
}
