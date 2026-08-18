/** Browser-side image helpers for the studio (no network, no secrets). */

import {
  REFERENCE_MAX_BYTES,
  REFERENCE_MAX_EDGE,
  REFERENCE_MIME_TYPES,
  type ReferenceImage,
} from "./image-studio";

export function base64ToBlob(data: string, mimeType: string) {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    image.src = url;
  });
}

/**
 * Validates and downscales the single reference image before upload, so the
 * request body stays small on a mobile connection.
 */
export async function prepareReference(file: File): Promise<ReferenceImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo seleccionado no es una imagen.");
  }

  const image = await loadImage(file);
  const longEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const keepsOriginal =
    (REFERENCE_MIME_TYPES as readonly string[]).includes(file.type) &&
    longEdge <= REFERENCE_MAX_EDGE &&
    file.size <= REFERENCE_MAX_BYTES;

  if (keepsOriginal) {
    return { mimeType: file.type, data: await blobToBase64(file) };
  }

  const scale = Math.min(1, REFERENCE_MAX_EDGE / longEdge);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tu navegador no permite procesar la imagen de referencia.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outputType, 0.92)
  );
  if (!blob) throw new Error("No se pudo procesar la imagen de referencia.");
  if (blob.size > REFERENCE_MAX_BYTES) {
    throw new Error("La imagen de referencia es demasiado pesada. Usa una más ligera.");
  }

  return { mimeType: outputType, data: await blobToBase64(blob) };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildFilename(prompt: string, extension: string) {
  const slug =
    prompt
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "imagen";
  const stamp = new Date().toISOString().slice(0, 10);
  return `advibe-${slug}-${stamp}.${extension}`;
}
