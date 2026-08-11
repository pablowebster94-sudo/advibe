import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = { role: "assistant" | "user"; content: string };
type RateEntry = { count: number; resetAt: number };

const rateLimit = new Map<string, RateEntry>();
const RATE_LIMIT = 20;
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

function replyFor(messages: ChatMessage[]) {
  const latest = messages.filter((message) => message.role === "user").at(-1)?.content.toLowerCase() || "";
  const previousUserMessages = messages.filter((message) => message.role === "user").length;

  if (previousUserMessages <= 1) {
    return "Perfecto. ¿Cuál es hoy el principal reto de tu negocio: conseguir más clientes, convertir mejor los que ya llegan o automatizar procesos?";
  }

  if (/(cliente|clientes|ventas|venta|lead|prospect|captar|captación|marketing|publicidad|ads|anuncio)/i.test(latest)) {
    return "Ahí hay una oportunidad clara de trabajar adquisición y conversión. Podemos revisar tu presencia digital, tus campañas y el recorrido hasta WhatsApp para detectar dónde se están perdiendo oportunidades. ¿Actualmente estás invirtiendo en publicidad digital?";
  }

  if (/(automat|crm|whatsapp|respuesta|bot|chat|ia|inteligencia)/i.test(latest)) {
    return "La automatización puede ayudarte especialmente en seguimiento y velocidad de respuesta. AdVibe puede diseñar ese flujo sin quitarle el componente humano a la venta. ¿Qué proceso repites manualmente con más frecuencia?";
  }

  if (/(web|página|sitio|website|redes|instagram|facebook|contenido|video|marca|branding)/i.test(latest)) {
    return "Podemos convertir esos activos digitales en un sistema comercial más coherente: contenido para atraer, una web para convertir y automatización para dar seguimiento. ¿Qué canal te está generando hoy más consultas?";
  }

  if (previousUserMessages >= 3) {
    return "Con lo que me cuentas ya podemos hacer una primera lectura. El siguiente paso es un diagnóstico gratuito con el equipo de AdVibe para priorizar oportunidades y definir qué conviene implementar primero. Puedes solicitarlo aquí: https://www.advibeagencia.com/#diagnostico";
  }

  return "Entiendo. Para orientarte mejor, cuéntame un poco más sobre el objetivo que quieres conseguir y qué has probado hasta ahora.";
}

export async function POST(request: Request) {
  if (isRateLimited(getClientKey(request))) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Inténtalo nuevamente en un minuto." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const body = await request.json();
    const rawMessages: unknown = body?.messages;
    if (!Array.isArray(rawMessages) || rawMessages.length < 1 || rawMessages.length > 20 || !rawMessages.every(isValidMessage)) {
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    }

    const messages: ChatMessage[] = rawMessages;
    return NextResponse.json({ reply: replyFor(messages) });
  } catch (error) {
    console.error("Chat route error", error);
    return NextResponse.json({ error: "Error procesando la conversación." }, { status: 500 });
  }
}
