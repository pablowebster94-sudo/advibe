
import { z } from "zod";
import type { ProductBrief } from "@/lib/product-brief";
import type { AnalysisResult } from "@/lib/services/analysis-engine";
import { buildConcepts, type ConceptPlan } from "@/lib/services/concept-engine";
import { generateCopy } from "@/lib/services/copy-service";
import { getConceptType } from "@/lib/catalog/concepts";
import { OBJECTIVES, type ObjectiveId } from "@/lib/catalog/objectives";
import { productTitle } from "@/lib/product-brief";

const analysisSchema = z.object({
  category: z.string().default(""),
  target_audience: z.string().default(""),
  pain_points: z.array(z.string()).min(1).max(5).default([]),
  uvp: z.string().default(""),
  keywords: z.array(z.string()).max(8).default([]),
  recommended_objective: z.string().default(""),
  budget_recommendation: z.string().default(""),
  strategic_angles: z.array(z.string()).min(1).max(5).default([]),
});
const variantSchema = z.object({
  id: z.string().default("variant"),
  angle: z.string().default("Venta directa"),
  hook: z.string().default(""),
  primary_text: z.string().default(""),
  headline: z.string().default(""),
  description: z.string().default(""),
  cta: z.string().default(""),
  whatsapp_message: z.string().default(""),
  visual_prompt: z.string().default(""),
});
const copyResponseSchema = z.object({ variants: z.array(variantSchema).min(1).max(5) });
const visualResponseSchema = z.object({ prompts: z.array(z.string()).min(1).max(5) });

export type AIProviderStatus = "ai" | "fallback" | "not_configured";
export type AIAnalysis = z.infer<typeof analysisSchema>;
export type AIVariant = z.infer<typeof variantSchema>;
export type AICampaignResult = {
  analysis: AIAnalysis;
  variants: AIVariant[];
  providerStatus: { gemini: AIProviderStatus; claude: AIProviderStatus; openai: AIProviderStatus };
};

function cleanJson(raw: string) {
  const withoutFence = raw.replace(new RegExp("\\x60{3}(?:json)?", "gi"), "").trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("El proveedor no devolvió JSON válido.");
  return JSON.parse(withoutFence.slice(start, end + 1)) as unknown;
}

async function requestText(url: string, init: RequestInit, timeoutMs = 30000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    if (!response.ok) throw new Error("Proveedor HTTP " + response.status + ": " + text.slice(0, 500));
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function briefContext(brief: ProductBrief, extra: {
  objective: string; budget?: number; location?: string; clientDescription?: string; clientUrl?: string;
}) {
  return JSON.stringify({
    product: brief.productName, category: brief.category, manufacturer: brief.manufacturer,
    model: brief.model, price: brief.priceDisplay, description: brief.description,
    features: brief.features, benefits: brief.benefits, offer: brief.offer,
    cta: brief.cta || brief.brandCta, targetAudience: brief.targetAudience,
    brand: brief.brandName, contact: brief.brandContact, objective: extra.objective,
    budget: extra.budget, location: extra.location, clientDescription: extra.clientDescription,
    clientUrl: extra.clientUrl,
  }, null, 2);
}

async function geminiJson(prompt: string): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY no configurada.");
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const raw = await requestText(
    "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );
  const data = JSON.parse(raw) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  return cleanJson(text);
}

async function claudeJson(prompt: string): Promise<unknown> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY no configurada.");
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const raw = await requestText("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model, max_tokens: 3000,
      system: "Eres un copywriter senior de respuesta directa especializado en Meta Ads. Devuelve únicamente JSON válido.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = JSON.parse(raw) as { content?: Array<{ type?: string; text?: string }> };
  return cleanJson(data.content?.filter((x) => x.type === "text").map((x) => x.text || "").join("") || "");
}

async function openaiJson(prompt: string): Promise<unknown> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY no configurada.");
  const model = process.env.OPENAI_MODEL || "gpt-5.6";
  const raw = await requestText("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({ model, input: prompt, text: { format: { type: "json_object" } } }),
  });
  const data = JSON.parse(raw) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  const text = data.output_text || data.output?.flatMap((item) => item.content || []).map((part) => part.text || "").join("") || "";
  return cleanJson(text);
}

function toObjectiveId(objective: string): ObjectiveId {
  return OBJECTIVES.some((item) => item.id === objective) ? (objective as ObjectiveId) : "VENDER";
}

function fallbackVisualPrompt(type: ConceptPlan["type"], title: string, feature: string | null) {
  switch (type) {
    case "VENTA_DIRECTA":
      return "Professional advertising photography of the real " + title + ", clean premium composition, realistic lighting, 4:5 portrait format, no text in image.";
    case "CARACTERISTICA":
      return "Detail-focused advertising photography of the real " + title + (feature ? ", highlighting " + feature : "") + ", sharp close-up, realistic commercial lighting, 4:5 portrait, no text or invented product details.";
    case "BENEFICIO":
      return "Photorealistic advertising scene centered on the real " + title + ", visually communicating its main benefit without inventing attributes, premium commercial lighting, 4:5 portrait, no text.";
    default:
      return "Premium lifestyle advertising photography featuring the real " + title + ", aspirational but factual, cinematic depth, polished composition, 4:5 portrait, no text or invented product details.";
  }
}

/**
 * Deterministic variants built from the existing concept/copy engines, so
 * the fallback keeps their "never invent facts" templates and the
 * vehicle-specific angle mix (VENTA_DIRECTA / CARACTERISTICA / ASPIRACIONAL).
 */
function fallbackVariants(brief: ProductBrief, analysis: AnalysisResult, objective = "VENDER"): AIVariant[] {
  const title = productTitle(brief);
  const plans = buildConcepts(brief, analysis);
  return [0, 1, 2].map((index) => {
    const type = conceptTypeForVariant(index, brief);
    const plan: ConceptPlan = plans.find((item) => item.type === type) ?? {
      type,
      label: getConceptType(type).label,
      rationale: "",
      highlightedFeature: analysis.topFeatures[0] ?? null,
    };
    const copy = generateCopy(plan, brief, analysis, toObjectiveId(objective));
    return {
      id: "variant-" + (index + 1),
      angle: plan.label,
      hook: copy.shortCopy,
      primary_text: copy.primaryText,
      headline: copy.headline,
      description: copy.description,
      cta: copy.cta,
      whatsapp_message: "Hola, quiero información sobre " + title + ".",
      visual_prompt: fallbackVisualPrompt(type, title, plan.highlightedFeature),
    };
  });
}

function normalizeVariants(variants: AIVariant[], brief: ProductBrief, analysis: AnalysisResult, objective: string) {
  const fallback = fallbackVariants(brief, analysis, objective);
  return [...variants, ...fallback].slice(0, 3).map((variant, index) => ({
    ...fallback[index],
    ...variant,
    id: "variant-" + (index + 1),
    cta: variant.cta?.trim() || analysis.recommendedCta,
    whatsapp_message: variant.whatsapp_message?.trim() ||
      "Hola, quiero información sobre " + [brief.manufacturer, brief.productName, brief.model].filter(Boolean).join(" ") + ".",
  }));
}

export async function generateAICampaign(
  brief: ProductBrief,
  analysis: AnalysisResult,
  input: { objective: string; budget?: number; location?: string; clientDescription?: string; clientUrl?: string }
): Promise<AICampaignResult> {
  const context = briefContext(brief, input);
  let strategic: AIAnalysis;
  let geminiStatus: AIProviderStatus = "not_configured";

  try {
    strategic = analysisSchema.parse(await geminiJson(
      "Actúa como analista senior de mercado y estratega de performance para Meta Ads. Analiza únicamente los hechos entregados. No inventes precios, promociones, características, resultados ni garantías. Identifica categoría, público, 3 pain points, UVP, keywords, objetivo recomendado, orientación de presupuesto y 3 ángulos estratégicos. Devuelve JSON. Contexto:\n" + context
    ));
    geminiStatus = "ai";
  } catch {
    geminiStatus = process.env.GEMINI_API_KEY ? "fallback" : "not_configured";
    strategic = {
      category: brief.category,
      target_audience: brief.targetAudience || "No especificado",
      pain_points: ["Falta información suficiente para precisar el problema principal"],
      uvp: analysis.differentiatingFeature || brief.description || "",
      keywords: analysis.topFeatures,
      recommended_objective: input.objective,
      budget_recommendation: input.budget ? "Presupuesto indicado: $" + input.budget : "Definir según objetivo y mercado.",
      strategic_angles: ["Venta directa", "Beneficio", "Diferenciación"],
    };
  }

  let variants: AIVariant[];
  let claudeStatus: AIProviderStatus = "not_configured";
  try {
    const result = copyResponseSchema.parse(await claudeJson(
      "Crea exactamente 3 variantes de anuncio para Meta Ads en español de Ecuador. No inventes ningún dato. Usa estos ángulos: 1) problema/urgencia, 2) frustración/agitación, 3) alivio/UVP. Cada variante debe tener hook, primary_text, headline, description, CTA, mensaje de WhatsApp y angle. Evita clichés de IA, exceso de emojis, hashtags innecesarios, lenguaje corporativo y garantías no sustentadas. Devuelve JSON con la forma {variants:[...]}. Contexto:\n" + context + "\nEstrategia:\n" + JSON.stringify(strategic)
    ));
    variants = result.variants;
    claudeStatus = "ai";
  } catch {
    claudeStatus = process.env.ANTHROPIC_API_KEY ? "fallback" : "not_configured";
    variants = fallbackVariants(brief, analysis, input.objective);
  }

  let openaiStatus: AIProviderStatus = "not_configured";
  try {
    const result = visualResponseSchema.parse(await openaiJson(
      "Eres director de arte y prompt engineer para Meta Ads. Crea exactamente 3 prompts visuales en inglés, uno por variante. Especifica subject/action/environment/composition/perspective/lighting/style/palette/depth of field/lens y 4:5. Usa únicamente atributos reales del producto; no inventes. No pongas texto, precios, logos ni tipografías dentro de la imagen. Devuelve JSON con la forma {prompts:[...]}. Contexto:\n" + context + "\nVariantes:\n" + JSON.stringify(variants)
    ));
    variants = normalizeVariants(variants.map((v, i) => ({ ...v, visual_prompt: result.prompts[i] || v.visual_prompt })), brief, analysis, input.objective);
    openaiStatus = "ai";
  } catch {
    openaiStatus = process.env.OPENAI_API_KEY ? "fallback" : "not_configured";
    variants = normalizeVariants(variants, brief, analysis, input.objective);
  }

  return { analysis: strategic, variants: normalizeVariants(variants, brief, analysis, input.objective), providerStatus: { gemini: geminiStatus, claude: claudeStatus, openai: openaiStatus } };
}

export function conceptTypeForVariant(index: number, brief: ProductBrief): ConceptPlan["type"] {
  // The wizard stores the catalog id "vehiculos" (no accent), so match both.
  const isVehicle = brief.category === "vehiculos" || /auto|veh[ií]culo|camioneta|camión|moto|pickup|sedán|suv/i.test(
    brief.category + " " + brief.productName + " " + (brief.description || "")
  );
  if (isVehicle && index === 0) return "VENTA_DIRECTA";
  if (isVehicle && index === 1) return "CARACTERISTICA";
  if (isVehicle && index === 2) return "ASPIRACIONAL";
  return index === 0 ? "VENTA_DIRECTA" : index === 1 ? "BENEFICIO" : "ASPIRACIONAL";
}
