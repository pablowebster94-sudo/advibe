/**
 * Shared (client + server) contract for the image studio.
 * Contains no secrets: it is safe to import from client components.
 */

export const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1", hint: "Cuadrado" },
  { value: "4:5", label: "4:5", hint: "Feed vertical" },
  { value: "9:16", label: "9:16", hint: "Historias" },
  { value: "16:9", label: "16:9", hint: "Horizontal" },
  { value: "3:2", label: "3:2", hint: "Foto" },
] as const;

export const RESOLUTIONS = [
  { value: "1K", label: "1K", hint: "Rápido y económico" },
  { value: "2K", label: "2K", hint: "Alta calidad" },
  { value: "4K", label: "4K", hint: "Máximo detalle" },
] as const;

export type AspectRatio = (typeof ASPECT_RATIOS)[number]["value"];
export type Resolution = (typeof RESOLUTIONS)[number]["value"];

export const DEFAULT_ASPECT_RATIO: AspectRatio = "1:1";
export const DEFAULT_RESOLUTION: Resolution = "1K";

export const PROMPT_MAX_LENGTH = 2000;

/** Reference image limits (applied before and after base64 decoding). */
export const REFERENCE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const REFERENCE_MAX_BYTES = 6 * 1024 * 1024;
/** Longest edge the browser downscales a reference image to before uploading. */
export const REFERENCE_MAX_EDGE = 1536;

export type ReferenceImage = {
  mimeType: string;
  /** Raw base64 (no `data:` prefix). */
  data: string;
};

export type GenerateImageRequest = {
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  reference?: ReferenceImage | null;
};

export type GeneratedImage = {
  mimeType: string;
  /** Raw base64 (no `data:` prefix). */
  data: string;
};

export type GenerateImageResponse = {
  image: GeneratedImage;
  model: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  /** True when the response came from the local mock instead of Gemini. */
  mock: boolean;
};

export type GenerateImageErrorResponse = { error: string };

export function isAspectRatio(value: unknown): value is AspectRatio {
  return ASPECT_RATIOS.some((item) => item.value === value);
}

export function isResolution(value: unknown): value is Resolution {
  return RESOLUTIONS.some((item) => item.value === value);
}

export function isReferenceMimeType(value: unknown): value is string {
  return typeof value === "string" && (REFERENCE_MIME_TYPES as readonly string[]).includes(value);
}

export function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/svg+xml") return "svg";
  return "png";
}
