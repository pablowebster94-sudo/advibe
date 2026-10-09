/**
 * Ad templates (design layouts rendered by VentAds, see lib/templates).
 * A catalog, not an enum: adding a template is one entry here plus its
 * layout rules. Campaign.templateId null keeps the classic renderer.
 */
export const TEMPLATES = [
  { id: "poster-elegante", label: "Póster elegante", description: "Logo, título grande, qué incluye, beneficios, promociones y WhatsApp." },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id) as [TemplateId, ...TemplateId[]];

export function isTemplateId(value: string | null | undefined): value is TemplateId {
  return TEMPLATES.some((t) => t.id === value);
}
