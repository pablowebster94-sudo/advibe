import { z } from "zod";
import type { ProductBrief } from "@/lib/product-brief";
import type { AnalysisResult } from "@/lib/services/analysis-engine";
import { buildConcepts, type ConceptPlan } from "@/lib/services/concept-engine";
import { generateCopy } from "@/lib/services/copy-service";
import { getConceptType } from "@/lib/catalog/concepts";
import { OBJECTIVES, type ObjectiveId } from "@/lib/catalog/objectives";
import { isVehicleBrief, productTitle } from "@/lib/product-brief";

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
  const withoutFence = raw.replace(new RegExp("\x60{3}(?:json)?", "gi"), "").trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("El proveedor no devolvió JSON válido.");
  return JSON.parse(withoutFence.slice(start, end + 1)) as unknown;
}

const PER_CALL_TIMEOUT_MS = 20_000;
const TOTAL_AI_BUDGET_MS = Number(process.env.AI_TOTAL_TIMEOUT_MS) || 40_000;
const MIN_USEFUL_CALL_MS = 3_000;

type Deadline = { at: number };

async function requestText(url: string, init: RequestInit, deadline: Deadline): Promise<string> {
  const remaining = deadline.at - Date.now();
  if (remaining < MIN_USEFUL_CALL_MS) throw new Error("Sin tiempo para llamar al proveedor de IA.");
  const timeoutMs = Math.min(PER_CALL_TIMEOUT_MS, remaining);
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
    product: brief.productName,
    category: brief.category,
    manufacturer: brief.manufacturer,
    model: brief.model,
    price: brief.priceDisplay,
    description: brief.description,
    features: brief.features,
    benefits: brief.benefits,
    offer: brief.offer,
    cta: brief.cta || brief.brandCta,
    targetAudience: brief.targetAudience,
    brand: brief.brandName,
    contact: brief.brandContact,
    objective: extra.objective,
    budget: extra.budget,
    location: extra.location,
    clientDescription: extra.clientDescription,
    clientUrl: extra.clientUrl,
  }, null, 2);
}

async function geminiJson(prompt: string, deadline: Deadline): Promise<unknown> {
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
    },
    deadline
  );
  const data = JSON.parse(raw) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  return cleanJson(text);
}

async function claudeJson(prompt: string, deadline: Deadline): Promise<unknown> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY no configurada.");
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const raw = await requestText(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model,
        max_tokens: 3000,
        system: "Eres un estratega de performance. Devuelve únicamente JSON válido y no inventes hechos.",
        messages: [{ role: "user", content: prompt }],
      }),
    },
    deadline
  );
  const data = JSON.parse(raw) as { content?: Array<{ type?: string; text?: string }> };
  return cleanJson(data.content?.filter((x) => x.type === "text").map((x) => x.text || "").join("") || "");
}

async function openaiJson(prompt: string, deadline: Deadline): Promise<unknown> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY no configurada.");
  const model = process.env.OPENAI_MODEL || "gpt-5.6";
  const raw = await requestText(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({ model, input: prompt, text: { format: { type: "json_object" } } }),
    },
    deadline
  );
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
      return "Professional direct-response advertising photography of the real " + title + ", product hero, bright commercial lighting, clean composition, realistic materials, no text in image.";
    case "CARACTERISTICA":
      return "Detail-focused advertising photography of the real " + title + (feature ? ", highlighting only this real detail: " + feature : "") + ", sharp commercial lighting, no text or invented product details.";
    case "BENEFICIO":
      return "Photorealistic lifestyle advertising scene centered on the real " + title + ", communicating only its supplied benefit, natural light, premium commercial composition, no text.";
    case "OFERTA":
      return "High-impact promotional advertising photography of the real " + title + ", bright inviting scene, clear product focus, clean background, no text or graphic overlays.";
    default:
      return "Premium lifestyle advertising photography featuring the real " + title + ", aspirational but factual, cinematic depth, no text or invented product details.";
  }
}

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

/**
 * The deterministic copy engine is the source of truth for all commercial
 * claims. External text models may suggest strategy, but they cannot replace
 * the final headline/offer/CTA because generic model copy was the cause of
 * weak creatives in the previous MVP.
 */
function normalizeVariants(
  variants: AIVariant[],
  brief: ProductBrief,
  analysis: AnalysisResult,
  objective: string
) {
  const fallback = fallbackVariants(brief, analysis, objective);

  return fallback.map((base, index) => {
    const ai = variants[index];
    return {
      ...base,
      visual_prompt: ai?.visual_prompt?.trim() || base.visual_prompt,
      // Preserve exact deterministic copy and CTA.
      id: "variant-" + (index + 1),
    };
  });
}

export async function generateAICampaign(
  brief: ProductBrief,
  analysis: AnalysisResult,
  input: { objective: string; budget?: number; location?: string; clientDescription?: string; clientUrl?: string }
): Promise<AICampaignResult> {
  const context = briefContext(brief, input);
  const deadline: Deadline = { at: Date.now() + TOTAL_AI_BUDGET_MS };

  let strategic: AIAnalysis;
  let geminiStatus: AIProviderStatus = "not_configured";

  try {
    strategic = analysisSchema.parse(await geminiJson(
      "Actúa como estratega senior de performance para Meta Ads. Analiza únicamente los hechos entregados. No inventes precios, promociones, características, resultados ni garantías. Devuelve 3 ángulos comerciales concretos que puedan convertirse en anuncios. Si existe una oferta, úsala explícitamente. Devuelve JSON. Contexto:\n" + context,
      deadline
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
      strategic_angles: brief.offer
        ? ["Oferta", "Beneficio", "Producto"]
        : ["Venta directa", "Beneficio", "Producto"],
    };
  }

  // Claude is retained as an optional strategy layer, but its generic copy
  // cannot override the deterministic commercial copy.
  let claudeStatus: AIProviderStatus = "not_configured";
  let variants: AIVariant[] = fallbackVariants(brief, analysis, input.objective);

  try {
    const result = copyResponseSchema.parse(await claudeJson(
      "Genera exactamente 3 ángulos para Meta Ads en español. No inventes datos. La primera variante debe corresponder a venta directa; la segunda a oferta si existe una oferta real, o beneficio si no existe; la tercera a beneficio o aspiracional. No generes claims nuevos. Devuelve JSON {variants:[...]} y usa los datos entregados como contexto.\n" + context + "\nEstrategia:\n" + JSON.stringify(strategic),
      deadline
    ));
    variants = normalizeVariants(result.variants, brief, analysis, input.objective);
    claudeStatus = "ai";
  } catch {
    claudeStatus = process.env.ANTHROPIC_API_KEY ? "fallback" : "not_configured";
  }

  let openaiStatus: AIProviderStatus = "not_configured";
  try {
    const result = visualResponseSchema.parse(await openaiJson(
      "Eres director de arte para Meta Ads. Crea exactamente 3 prompts visuales en inglés, uno por variante. La imagen debe mostrar únicamente una fotografía publicitaria limpia del producto real, sin texto, precios, logos, botones ni overlays. Mantén identidad, materiales, color y proporciones del producto. Haz que cada variante tenga una dirección visual distinta. Devuelve JSON {prompts:[...]}. Contexto:\n" + context + "\nVariantes:\n" + JSON.stringify(variants),
      deadline
    ));
    variants = normalizeVariants(
      variants.map((variant, index) => ({ ...variant, visual_prompt: result.prompts[index] || variant.visual_prompt })),
      brief,
      analysis,
      input.objective
    );
    openaiStatus = "ai";
  } catch {
    openaiStatus = process.env.OPENAI_API_KEY ? "fallback" : "not_configured";
    variants = normalizeVariants(variants, brief, analysis, input.objective);
  }

  return {
    analysis: strategic,
    variants: normalizeVariants(variants, brief, analysis, input.objective),
    providerStatus: {
      gemini: geminiStatus,
      claude: claudeStatus,
      openai: openaiStatus,
    },
  };
}

export function conceptTypeForVariant(index: number, brief: ProductBrief): ConceptPlan["type"] {
  const isVehicle = isVehicleBrief(brief);
  if (isVehicle && index === 0) return "VENTA_DIRECTA";
  if (isVehicle && index === 1) return "CARACTERISTICA";
  if (isVehicle && index === 2) return "ASPIRACIONAL";

  if (brief.offer?.trim()) {
    return index === 0 ? "VENTA_DIRECTA" : index === 1 ? "OFERTA" : "BENEFICIO";
  }

  return index === 0 ? "VENTA_DIRECTA" : index === 1 ? "BENEFICIO" : "ASPIRACIONAL";
}
