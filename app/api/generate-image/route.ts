import { NextResponse } from "next/server";

import { GeminiImageError, generateImage, getImageModel, redactSecrets } from "@/lib/gemini-image";
import {
  PROMPT_MAX_LENGTH,
  REFERENCE_MAX_BYTES,
  isAspectRatio,
  isReferenceMimeType,
  isResolution,
  type GenerateImageResponse,
  type ReferenceImage,
} from "@/lib/image-studio";
import { createMockImage, isMockMode } from "@/lib/mock-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** 4K generations are slow; give the platform room before it kills the request. */
export const maxDuration = 300;

type RateEntry = { count: number; resetAt: number };

const rateLimit = new Map<string, RateEntry>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

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

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

function parseReference(value: unknown): ReferenceImage | null | "invalid" {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object") return "invalid";

  const candidate = value as Record<string, unknown>;
  const { mimeType, data } = candidate;

  if (!isReferenceMimeType(mimeType)) return "invalid";
  if (typeof data !== "string" || data.length === 0) return "invalid";
  if (!BASE64_PATTERN.test(data)) return "invalid";
  if (Math.floor((data.length * 3) / 4) > REFERENCE_MAX_BYTES) return "invalid";

  return { mimeType, data };
}

export async function POST(request: Request) {
  if (isRateLimited(getClientKey(request))) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un minuto antes de generar otra imagen." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Solicitud inválida.");
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const prompt = typeof payload.prompt === "string" ? payload.prompt.trim() : "";
  const { aspectRatio, resolution } = payload;

  if (!prompt) return badRequest("Escribe qué quieres crear antes de generar la imagen.");
  if (prompt.length > PROMPT_MAX_LENGTH) {
    return badRequest(`El prompt no puede superar los ${PROMPT_MAX_LENGTH} caracteres.`);
  }
  if (!isAspectRatio(aspectRatio)) return badRequest("Formato no válido.");
  if (!isResolution(resolution)) return badRequest("Resolución no válida.");

  const reference = parseReference(payload.reference);
  if (reference === "invalid") {
    return badRequest("La imagen de referencia no es válida o supera el tamaño permitido.");
  }

  try {
    // Exactly one image per request — mock while developing, Gemini in production.
    const image = isMockMode()
      ? createMockImage({ prompt, aspectRatio, resolution, hasReference: Boolean(reference) })
      : await generateImage({ prompt, aspectRatio, resolution, reference });

    const result: GenerateImageResponse = {
      image,
      model: isMockMode() ? "mock" : getImageModel(),
      aspectRatio,
      resolution,
      mock: isMockMode(),
    };

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof GeminiImageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("generate-image route error:", redactSecrets(error instanceof Error ? error.message : String(error)));
    return NextResponse.json({ error: "Error inesperado al generar la imagen." }, { status: 500 });
  }
}
