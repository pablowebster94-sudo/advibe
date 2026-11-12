import { z } from "zod";
import { STYLES } from "@/lib/catalog/styles";

const briefSchema = z.object({
  category: z.string().trim().min(1).max(60).default("Servicios"),
  name: z.string().trim().min(1).max(120),
  manufacturer: z.string().trim().max(80).nullable().optional(),
  model: z.string().trim().max(80).nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  priceLabel: z.string().trim().max(60).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  features: z.array(z.string().trim().min(1).max(160)).max(8).default([]),
  benefits: z.array(z.string().trim().min(1).max(160)).max(8).default([]),
  offer: z.string().trim().max(300).nullable().optional(),
  cta: z.string().trim().max(60).nullable().optional(),
  targetAudience: z.string().trim().max(300).nullable().optional(),
  adTitle: z.string().trim().max(120).nullable().optional(),
  includes: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
});

export type CreativeBrief = z.infer<typeof briefSchema>;

function jsonFromResponse(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("El director creativo no devolvió JSON válido.");
  return JSON.parse(raw.slice(start, end + 1)) as unknown;
}

async function askOpenAI(prompt: string): Promise<unknown> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY no configurada.");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL || process.env.OPENAI_MODEL || "gpt-6-luna",
      input: prompt,
      text: { format: { type: "json_object" } },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => ({})) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(payload.error?.message || `OpenAI texto respondió HTTP ${response.status}`);
  const text = payload.output_text || payload.output?.flatMap((item) => item.content || []).map((part) => part.text || "").join("") || "";
  return jsonFromResponse(text);
}

export function inferCreativeStyle(text: string): string {
  const value = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/minimalista|minimal/.test(value)) return "MINIMALISTA";
  if (/lujo|premium|exclusivo|sofisticado/.test(value)) return "PREMIUM";
  if (/elegante|sobrio|refinado/.test(value)) return "ELEGANTE";
  if (/lifestyle|aspiracional|hogar calido/.test(value)) return "LIFESTYLE";
  if (/urgencia|ultimos dias|descuento|promocion|oferta/.test(value)) return "URGENCIA";
  if (/deportivo|energia|dinamico/.test(value)) return "DEPORTIVO";
  if (/moderno|tecnologico|futurista/.test(value)) return "MODERNO";
  return "COMERCIAL";
}

export function fallbackCreativeBrief(prompt: string): CreativeBrief {
  const clean = prompt.trim().replace(/\s+/g, " ");
  const category = /veh[ií]culo|auto|carro|camioneta|moto|chevrolet|toyota|kia/i.test(clean)
    ? "Vehículos"
    : /mueble|sala|comedor|cama|colch[oó]n/i.test(clean)
      ? "Muebles"
      : /ropa|jean|camisa|vestido|moda/i.test(clean)
        ? "Moda"
        : /joya|anillo|collar|reloj/i.test(clean)
          ? "Joyería"
          : /cl[ií]nica|dental|odont|salud/i.test(clean)
            ? "Salud"
            : /casa|departamento|inmobiliaria|terreno/i.test(clean)
              ? "Inmobiliaria"
              : "Producto o servicio";
  const priceMatch = /(?:precio|valor|cuesta|por)\s*[:=]?\s*\$?\s*(\d[\d.,]*)/i.exec(clean);
  const price = priceMatch ? Number(priceMatch[1].replace(/\./g, "").replace(",", ".")) : undefined;
  const nameMatch = /(?:para|promocionar|vender|anunciar)\s+(?:el|la|los|las|un|una)?\s*([^,.!?]{3,100})/i.exec(clean);
  const name = (nameMatch?.[1] || clean).trim().slice(0, 120) || "Producto o servicio";
  return {
    category,
    name,
    price: Number.isFinite(price) && price! > 0 ? price : undefined,
    description: clean.slice(0, 2000),
    features: [],
    benefits: [],
    includes: [],
    cta: /whatsapp/i.test(clean) ? "Escríbenos por WhatsApp" : "Solicita información",
  };
}

export async function interpretCreativePrompt(prompt: string): Promise<CreativeBrief> {
  const instruction = [
    "Eres el director creativo y estratega publicitario de una agencia profesional en Ecuador.",
    "Convierte la instrucción del usuario en un brief estructurado para una pieza publicitaria.",
    "Devuelve exclusivamente un objeto JSON con category, name, manufacturer, model, price, priceLabel, description, features, benefits, offer, cta, targetAudience, adTitle e includes.",
    "Reglas: no inventes precios, descuentos, materiales, especificaciones, resultados, garantías, ubicaciones ni datos de contacto.",
    "Si un dato no aparece, usa null o un arreglo vacío. price solo puede ser número cuando el usuario haya indicado claramente un precio.",
    "Escribe en español natural de Ecuador. Mantén nombres de marca/modelo tal como los dio el usuario.",
    `Instrucción del usuario:\n${prompt}`,
  ].join("\n\n");

  try {
    return briefSchema.parse(await askOpenAI(instruction));
  } catch (error) {
    console.warn(`[creative-director] fallback: ${error instanceof Error ? error.message.slice(0, 180) : "error"}`);
    return fallbackCreativeBrief(prompt);
  }
}

const editSchema = z.object({
  styleId: z.string().refine((value) => STYLES.some((style) => style.id === value)).nullable().optional(),
  headline: z.string().trim().max(120).nullable().optional(),
  description: z.string().trim().max(300).nullable().optional(),
  cta: z.string().trim().max(60).nullable().optional(),
  visualPrompt: z.string().trim().max(1000).nullable().optional(),
  removePrice: z.boolean().default(false),
});

export type CreativeEdit = z.infer<typeof editSchema>;

export async function interpretCreativeEdit(input: {
  instruction: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  current: { headline: string; description: string; cta: string; visualPrompt: string | null; styleId: string; productName: string };
}): Promise<CreativeEdit> {
  const history = (input.history ?? []).slice(-8).map((item) => `${item.role}: ${item.content}`).join("\n");
  const prompt = [
    "Eres un director de arte publicitario. Interpreta una instrucción de edición sobre una creatividad existente.",
    "Devuelve JSON con styleId, headline, description, cta, visualPrompt y removePrice.",
    "Solo devuelve campos que deban cambiar; usa null cuando no haya cambio. styleId debe ser uno de: " + STYLES.map((style) => style.id).join(", ") + ".",
    "No inventes hechos, precios, descuentos, características ni promesas. Conserva los datos comerciales existentes salvo que el usuario pida quitarlos o cambiar su texto explícitamente.",
    "Si la instrucción cambia fondo, iluminación, ambiente o composición, describe esos cambios en visualPrompt y especifica que el producto original debe permanecer intacto.",
    "removePrice=true únicamente si el usuario pide eliminar u ocultar el precio.",
    `Producto: ${input.current.productName}`,
    `Estilo actual: ${input.current.styleId}`,
    `Titular actual: ${input.current.headline}`,
    `Texto actual: ${input.current.description}`,
    `CTA actual: ${input.current.cta}`,
    `Dirección visual actual: ${input.current.visualPrompt ?? "No especificada"}`,
    history ? `Conversación previa:\n${history}` : "",
    `Nueva instrucción:\n${input.instruction}`,
  ].filter(Boolean).join("\n\n");

  try {
    return editSchema.parse(await askOpenAI(prompt));
  } catch {
    const styleId = inferCreativeStyle(input.instruction);
    const normalized = input.instruction.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const removePrice = /quita|elimina|oculta|sin/.test(normalized) && /precio|valor/.test(normalized);
    return {
      styleId: /elegante|premium|minimalista|moderno|deportivo|lifestyle|urgencia|comercial/.test(normalized) ? styleId : null,
      visualPrompt: /fondo|ambiente|iluminacion|escenario|estilo|elegante|premium|minimalista/.test(normalized)
        ? input.instruction.slice(0, 1000)
        : null,
      removePrice,
    };
  }
}
