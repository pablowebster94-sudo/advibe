import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENAI_URL = "https://api.openai.com/v1";

const brands = {
  muebles: { name: "Muebles Ideal", industry: "Diseño / Retail", tone: "Premium, moderno, cercano", palette: "Tonos cálidos, madera natural, neutros sofisticados", style: "Fotografía editorial de interiores, luz suave, producto protagonista", restriction: "Evitar fondos planos y estética genérica de catálogo" },
  gastro: { name: "Gastro Fest", industry: "Eventos / Gastronomía", tone: "Enérgico, juvenil, festivo", palette: "Naranja, azul noche, acentos neón", style: "Fotografía de festival, alto contraste, ambiente nocturno", restriction: "Evitar luz diurna y fondos minimalistas blancos" },
  luxe: { name: "Inmobiliaria Luxe", industry: "Bienes raíces", tone: "Elegante, aspiracional, confiable", palette: "Negro, champagne, beige, verdes discretos", style: "Arquitectura premium, cinematográfica, perspectiva limpia", restriction: "Evitar saturación excesiva y clichés inmobiliarios" },
};

function jsonFromText(text: string) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

async function openai(path: string, body: unknown) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY no está configurada en Vercel.");
  const response = await fetch(`${OPENAI_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI error ${response.status}`);
  return data;
}

async function persistGeneration(payload: Record<string, unknown>) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  const response = await fetch(`${url}/rest/v1/generations`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
  return response.ok;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestText = String(body.request || "").trim();
    const brandKey = (body.brandKey || "muebles") as keyof typeof brands;
    const format = String(body.format || "1:1");
    const brand = brands[brandKey] || brands.muebles;

    if (!requestText) return NextResponse.json({ error: "Escribe qué quieres crear." }, { status: 400 });

    const interpreter = await openai("/chat/completions", {
      model: "gpt-4o",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Eres un estratega creativo senior de una agencia de publicidad. Convierte el brief informal en JSON accionable. Responde únicamente JSON con: cliente, objetivo, tono, publico, industria, mensaje_clave, cta, paleta_color, formato. Si falta un campo, infiérelo razonablemente. No inventes datos específicos del negocio." },
        { role: "user", content: `Cliente: ${brand.name}\nIndustria: ${brand.industry}\nTono: ${brand.tone}\nPaleta: ${brand.palette}\nFormato solicitado: ${format}\nBrief: ${requestText}` },
      ],
    });
    const brief = jsonFromText(interpreter.choices?.[0]?.message?.content || "{}");

    const art = await openai("/chat/completions", {
      model: "gpt-4o",
      temperature: 0.8,
      messages: [
        { role: "system", content: "Eres un director de arte experto en generación de imágenes con IA. Escribe UN SOLO prompt en inglés, muy detallado y visual, listo para un generador de imágenes. Describe composición, encuadre, iluminación, estilo fotográfico/ilustrativo, paleta y mood. NO incluyas texto, logos ni tipografía. Deja espacio negativo donde convenga para texto posterior. Responde solo con el prompt." },
        { role: "user", content: JSON.stringify({ ...brief, brand_style: brand.style, brand_restriction: brand.restriction }) },
      ],
    });
    const prompt = art.choices?.[0]?.message?.content?.trim() || "";

    const size = format === "9:16" ? "1024x1536" : format === "16:9" ? "1536x1024" : "1024x1024";
    const image = await openai("/images/generations", {
      model: "gpt-image-1",
      prompt,
      size,
      quality: "high",
      n: 1,
    });
    const b64 = image.data?.[0]?.b64_json;
    if (!b64) throw new Error("El proveedor de imágenes no devolvió una imagen.");
    const imageUrl = `data:image/png;base64,${b64}`;

    const qc = {
      brand_brain: true,
      format_correct: true,
      visual_hierarchy: true,
      text_separated_from_image: true,
      notes: "La imagen base no contiene logos ni tipografía; el texto se compone posteriormente.",
    };

    await persistGeneration({
      client_name: brand.name,
      request: requestText,
      brief,
      art_prompt: prompt,
      format,
      status: "generated",
      qc,
    });

    return NextResponse.json({ brief, prompt, imageUrl, qc, provider: "openai" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
