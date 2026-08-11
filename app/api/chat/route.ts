import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Eres Vibe, el asistente digital de AdVibe Agencia, una agencia de marketing, IA y automatización con sede en Ecuador.

Objetivos:
1. Diagnosticar brevemente la situación digital del visitante.
2. Identificar 2-3 oportunidades de crecimiento concretas.
3. Recomendar un diagnóstico gratuito con el equipo de AdVibe.

Reglas:
- Español latinoamericano, profesional, cercano y directo.
- Haz UNA pregunta a la vez.
- Máximo 3 oraciones por respuesta, salvo una lista breve cuando sea útil.
- Prioriza leads, conversión, CAC, ROAS, velocidad de respuesta y automatización.
- No solicites teléfono, correo, dirección ni otros datos personales.
- Flujo ideal: industria -> principal reto -> diagnóstico -> invitación al diagnóstico gratuito.
- No inventes métricas ni prometas resultados garantizados. Si faltan datos, dilo claramente.
- No afirmes que AdVibe logró un resultado específico salvo que el usuario proporcione ese dato.`;

type ChatMessage = { role: "assistant" | "user"; content: string };

type RateEntry = { count: number; resetAt: number };
const rateLimit = new Map<string, RateEntry>();
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 60_000;

function isValidMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    (item.role === "user" || item.role === "assistant") &&
    typeof item.content === "string" &&
    item.content.trim().length > 0 &&
    item.content.length <= 2000
  );
}

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = rateLimit.get(key);
  if (!current || current.resetAt <= now) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (current.count >= RATE_LIMIT) return true;
  current.count += 1;
  return false;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "La IA no está configurada." }, { status: 503 });

  if (isRateLimited(getClientKey(request))) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Inténtalo nuevamente en un minuto." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const body = await request.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    if (messages.length < 1 || messages.length > 20 || !messages.every(isValidMessage)) {
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    }

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: messages.map((message) => ({ role: message.role, content: message.content.trim() })),
      }),
      cache: "no-store",
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      console.error("Anthropic API error", data);
      return NextResponse.json({ error: "No fue posible generar una respuesta." }, { status: 502 });
    }

    const reply = Array.isArray(data?.content)
      ? data.content
          .filter((block: { type?: string }) => block?.type === "text")
          .map((block: { text?: string }) => block.text || "")
          .join("\n")
          .trim()
      : "";

    if (!reply) return NextResponse.json({ error: "La IA no devolvió una respuesta válida." }, { status: 502 });
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat route error", error);
    return NextResponse.json({ error: "Error procesando la conversación." }, { status: 500 });
  }
}
