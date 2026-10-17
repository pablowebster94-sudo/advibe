import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

// Herramienta interna: genera imágenes para usarlas a mano en anuncios de Meta.
// Claves solo en el servidor: OPENAI_API_KEY y/o GEMINI_API_KEY, más IMAGENES_CLAVE para entrar.

type Formato = "1:1" | "4:5" | "9:16";
type Motor = "openai" | "google";

const OPENAI_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const MAX_REF_BYTES = 8 * 1024 * 1024;

function claveValida(request: Request) {
  const clave = process.env.IMAGENES_CLAVE;
  return Boolean(clave) && request.headers.get("x-clave") === clave;
}

// OpenAI no tiene 4:5 ni 9:16: se genera vertical (2:3) y el navegador recorta al descargar.
function tamañoOpenAI(formato: Formato) {
  return formato === "1:1" ? "1024x1024" : "1024x1536";
}

async function generarOpenAI(prompt: string, formato: Formato, cantidad: number, calidad: string, referencia: File | null) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Falta OPENAI_API_KEY en el servidor.");
  const size = tamañoOpenAI(formato);
  let res: Response;
  if (referencia) {
    const form = new FormData();
    form.append("model", OPENAI_MODEL);
    form.append("prompt", prompt);
    form.append("n", String(cantidad));
    form.append("size", size);
    form.append("quality", calidad);
    form.append("image[]", referencia, referencia.name || "referencia.png");
    res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
  } else {
    res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: OPENAI_MODEL, prompt, n: cantidad, size, quality: calidad }),
    });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `OpenAI respondió ${res.status}`);
  return (data.data as Array<{ b64_json?: string }>).filter((d) => d.b64_json).map((d) => `data:image/png;base64,${d.b64_json}`);
}

async function generarGoogle(prompt: string, formato: Formato, cantidad: number, referencia: File | null) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Falta GEMINI_API_KEY en el servidor.");
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (referencia) {
    const b64 = Buffer.from(await referencia.arrayBuffer()).toString("base64");
    parts.push({ inline_data: { mime_type: referencia.type || "image/png", data: b64 } });
  }
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: formato } },
  });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  // Gemini devuelve una imagen por llamada: se piden en paralelo.
  const llamadas = Array.from({ length: cantidad }, async () => {
    const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `Google respondió ${res.status}`);
    const partes = data?.candidates?.[0]?.content?.parts ?? [];
    return partes
      .map((p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData)
      .filter(Boolean)
      .map((d: { mimeType: string; data: string }) => `data:${d.mimeType};base64,${d.data}`);
  });
  return (await Promise.all(llamadas)).flat();
}

export async function POST(request: Request) {
  if (!claveValida(request)) return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });

  const prompt = String(form.get("prompt") || "").trim().slice(0, 4000);
  const formato = String(form.get("formato")) as Formato;
  const motor = String(form.get("motor")) as Motor;
  const calidad = ["low", "medium", "high"].includes(String(form.get("calidad"))) ? String(form.get("calidad")) : "medium";
  const cantidad = Math.min(Math.max(Number(form.get("cantidad")) || 1, 1), 4);
  const ref = form.get("referencia");
  const referencia = ref instanceof File && ref.size > 0 ? ref : null;

  if (!prompt) return NextResponse.json({ error: "Escribe qué imagen quieres." }, { status: 400 });
  if (!["1:1", "4:5", "9:16"].includes(formato)) return NextResponse.json({ error: "Formato inválido." }, { status: 400 });
  if (!["openai", "google"].includes(motor)) return NextResponse.json({ error: "Motor inválido." }, { status: 400 });
  if (referencia && referencia.size > MAX_REF_BYTES) return NextResponse.json({ error: "La foto de referencia pesa más de 8 MB." }, { status: 400 });

  try {
    const imagenes = motor === "openai"
      ? await generarOpenAI(prompt, formato, cantidad, calidad, referencia)
      : await generarGoogle(prompt, formato, cantidad, referencia);
    if (!imagenes.length) return NextResponse.json({ error: "El motor no devolvió imágenes. Prueba con otra descripción." }, { status: 502 });
    return NextResponse.json({ imagenes });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error al generar." }, { status: 502 });
  }
}
