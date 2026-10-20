import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Frame = { dataUrl: string; time: number };
type Clip = { index: number; name: string; duration: number; frames: Frame[] };

export async function POST(request: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Falta OPENAI_API_KEY en el entorno de Vercel." }, { status: 503 });
  }

  const body = await request.json() as { brief?: string; clips?: Clip[] };
  const clips = body.clips ?? [];
  if (!clips.length) return NextResponse.json({ error: "No se recibieron clips." }, { status: 400 });

  const content: Array<Record<string, unknown>> = [{
    type: "input_text",
    text: [
      "Eres el director de edición de AdVibe Agencia.",
      "Diseña un primer montaje de Reel vertical 1080x1920 para redes sociales.",
      "No inventes escenas que no aparecen en los fotogramas.",
      "Prioriza ritmo, variedad de planos, continuidad visual y un hook en los primeros 2-3 segundos.",
      "Usa los clips recibidos como fuentes. Puedes descartar clips.",
      "Devuelve SOLO JSON válido, sin markdown, con esta forma:",
      '{"title":"...","totalDuration":30,"scenes":[{"clip":0,"start":0,"end":4,"role":"hook","text":"...","reason":"..."}],"musicMood":"...","cta":"..."}',
      "Los tiempos start/end son segundos dentro del clip original.",
      "Mantén totalDuration entre 15 y 60 segundos.",
      body.brief ? "Brief del usuario: " + body.brief : "No hay brief adicional.",
      "Metadatos y fotogramas:"
    ].join("\n")
  }];

  for (const clip of clips.slice(0, 12)) {
    content.push({ type: "input_text", text: JSON.stringify({ index: clip.index, name: clip.name, duration: clip.duration }) });
    for (const frame of clip.frames.slice(0, 3)) {
      content.push({ type: "input_image", image_url: frame.dataUrl, detail: "low" });
      content.push({ type: "input_text", text: "Fotograma del clip " + clip.index + " en " + frame.time.toFixed(2) + "s." });
    }
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({ model: "gpt-5.6-luna", input: [{ role: "user", content }] })
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: "OpenAI rechazó el análisis.", detail }, { status: 502 });
  }

  const data = await response.json() as { output_text?: string };
  const raw = data.output_text ?? "";
  const cleaned = raw.replace(/^\s*\`\`\`json\s*/i, "").replace(/\s*\`\`\`\s*$/i, "").trim();

  try {
    return NextResponse.json({ plan: JSON.parse(cleaned) });
  } catch {
    return NextResponse.json({ error: "La IA no devolvió JSON válido.", raw }, { status: 502 });
  }
}
