/**
 * Server-only Gemini (Nano Banana 2) image generation.
 *
 * Cost contract enforced here:
 *   1 user request  ->  1 `generateContent` call  ->  1 image.
 * There is no retry, no upscale pass, no prompt-rewriting model call and no
 * variant generation anywhere in this module.
 *
 * `GEMINI_API_KEY` is read from the process environment at request time and is
 * never returned to the client nor written to logs.
 */

import { GoogleGenAI } from "@google/genai";
import type { AspectRatio, GeneratedImage, ReferenceImage, Resolution } from "./image-studio";

/**
 * Nano Banana 2, generally available since 2026-05-28 and the id Google's
 * deprecation table names as the replacement for the retired
 * `gemini-3.1-flash-image-preview` (shut down 2026-06-25). Same id on the
 * Gemini Developer API and on Vertex AI. Override with GEMINI_IMAGE_MODEL if
 * Google renames it again.
 */
export const DEFAULT_IMAGE_MODEL = "gemini-3.1-flash-image";

/** A 4K generation can take a while; fail loudly instead of hanging forever. */
const REQUEST_TIMEOUT_MS = 180_000;

export class GeminiImageError extends Error {
  readonly status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "GeminiImageError";
    this.status = status;
  }
}

export function getImageModel() {
  return process.env.GEMINI_IMAGE_MODEL?.trim() || DEFAULT_IMAGE_MODEL;
}

/**
 * Removes the API key from any string before it reaches a log or an HTTP
 * response, in case an SDK error ever echoes the request configuration.
 */
export function redactSecrets(value: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey.length < 8) return value;
  return value.split(apiKey).join("[REDACTED]");
}

/**
 * Deterministic prompt structuring: plain user intent in, a well-formed
 * instruction out. No AI call is involved in building this string.
 */
export function buildPrompt(input: {
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  hasReference: boolean;
}) {
  const lines = [
    "Genera una única imagen final, lista para publicar, con calidad profesional.",
    "",
    `Descripción del usuario: ${input.prompt.trim()}`,
    "",
    `Relación de aspecto: ${input.aspectRatio} (encuadra la composición completa dentro de este formato, sin bordes ni márgenes añadidos).`,
    `Nivel de detalle: ${input.resolution}.`,
    "Cuida la iluminación, el enfoque, la coherencia de la escena y la nitidez de los detalles.",
    "No añadas marcas de agua, logotipos, marcos ni texto que el usuario no haya pedido.",
  ];

  if (input.hasReference) {
    lines.push(
      "Usa la imagen adjunta como referencia visual principal: respeta su sujeto, estilo y rasgos característicos mientras aplicas la descripción del usuario."
    );
  }

  return lines.join("\n");
}

export async function generateImage(input: {
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  reference?: ReferenceImage | null;
}): Promise<GeneratedImage> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiImageError(
      "Falta la configuración del servidor: define GEMINI_API_KEY en el archivo .env.local.",
      500
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = getImageModel();

  const parts: Array<Record<string, unknown>> = [];
  if (input.reference) {
    parts.push({
      inlineData: { mimeType: input.reference.mimeType, data: input.reference.data },
    });
  }
  parts.push({
    text: buildPrompt({
      prompt: input.prompt,
      aspectRatio: input.aspectRatio,
      resolution: input.resolution,
      hasReference: Boolean(input.reference),
    }),
  });

  let response;
  try {
    // The one and only generation call.
    response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts }],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
        candidateCount: 1,
        imageConfig: {
          aspectRatio: input.aspectRatio,
          imageSize: input.resolution,
        },
        // No automatic retries: a failed request must never become a second
        // billable generation.
        httpOptions: { timeout: REQUEST_TIMEOUT_MS, retryOptions: { attempts: 1 } },
      },
    });
  } catch (error) {
    const detail = redactSecrets(error instanceof Error ? error.message : String(error));
    console.error("Gemini image generation failed:", detail);
    throw new GeminiImageError(`No se pudo generar la imagen. ${detail}`);
  }

  const candidate = response.candidates?.[0];
  const image = candidate?.content?.parts?.find(
    (part) => part.inlineData?.data && part.inlineData.mimeType?.startsWith("image/")
  )?.inlineData;

  if (!image?.data) {
    const finishReason = candidate?.finishReason;
    const blockReason = response.promptFeedback?.blockReason;
    const note = blockReason
      ? `La solicitud fue bloqueada (${blockReason}).`
      : finishReason && finishReason !== "STOP"
        ? `La generación terminó con el estado ${finishReason}.`
        : "El modelo no devolvió ninguna imagen.";
    throw new GeminiImageError(`${note} Ajusta el prompt e inténtalo de nuevo.`);
  }

  return { mimeType: image.mimeType || "image/png", data: image.data };
}
