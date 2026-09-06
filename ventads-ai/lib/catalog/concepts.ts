/**
 * Creative angles the analysis engine can produce. `type` on Concept is a
 * free-form string keyed into this catalog — adding a 6th angle later is
 * one entry here, no schema change (AGENTS.md #4).
 */
export const CONCEPT_TYPES = [
  {
    id: "VENTA_DIRECTA",
    label: "Venta directa",
    description: "Producto + precio + características principales + CTA.",
  },
  {
    id: "BENEFICIO",
    label: "Beneficio",
    description: "Enfatiza el principal beneficio del producto.",
  },
  {
    id: "ASPIRACIONAL",
    label: "Aspiracional",
    description: "Composición emocional / lifestyle.",
  },
  {
    id: "OFERTA",
    label: "Oferta",
    description: "Enfatiza precio, promoción o disponibilidad.",
  },
  {
    id: "CARACTERISTICA",
    label: "Característica",
    description: "Destaca una característica diferenciadora.",
  },
] as const;

export type ConceptTypeId = (typeof CONCEPT_TYPES)[number]["id"];

export function getConceptType(id: string) {
  return CONCEPT_TYPES.find((concept) => concept.id === id) ?? CONCEPT_TYPES[0];
}
