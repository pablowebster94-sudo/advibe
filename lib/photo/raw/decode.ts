/**
 * File ingestion: format detection, metadata + preview extraction, and proxy
 * generation. Browser-only (uses `createImageBitmap` / `OffscreenCanvas`), so
 * it runs in the analysis worker and in the develop view, never on the server.
 */
import type { ExifData, SourceFormat } from "../types";
import { blobSource } from "./bytes";
import { extractExif } from "./exif";
import { extractLargestPreview, readPngSize, scanForJpeg } from "./preview";
import { findJpegExifStart, parseTiff, type TiffFile } from "./tiff";
import { decodeTiffImage, findLargestDecodableIfd } from "./tiffImage";

export interface SourceMeta {
  format: SourceFormat;
  exif: ExifData;
  /** JPEG bytes we can hand to the decoder, or null when we could not find any. */
  preview: Blob | null;
  previewWidth?: number;
  previewHeight?: number;
  /** Where the preview came from, surfaced in the UI diagnostics panel. */
  previewSource?: string;
  /** Set when the file is readable but we could not produce a preview. */
  warning?: string;
}

const EXTENSION_FORMATS: Record<string, SourceFormat> = {
  arw: "arw",
  dng: "dng",
  tif: "tiff",
  tiff: "tiff",
  jpg: "jpeg",
  jpeg: "jpeg",
  png: "png",
};

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function baseNameOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot <= 0 ? fileName : fileName.slice(0, dot);
}

/** Detects the format from magic bytes, falling back to the extension. */
export async function detectFormat(file: Blob, fileName: string): Promise<SourceFormat> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const byExtension = EXTENSION_FORMATS[extensionOf(fileName)] ?? "unknown";

  if (head.length >= 4 && head[0] === 0xff && head[1] === 0xd8) return "jpeg";
  if (readPngSize(head.length >= 24 ? head : new Uint8Array(24))) return "png";
  if (head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e) return "png";

  const isTiff =
    head.length >= 4 &&
    ((head[0] === 0x49 && head[1] === 0x49 && head[2] === 0x2a && head[3] === 0x00) ||
      (head[0] === 0x4d && head[1] === 0x4d && head[2] === 0x00 && head[3] === 0x2a));
  if (isTiff) {
    // ARW and DNG are both TIFF containers; only the extension tells them apart
    // cheaply, and getting it wrong only changes the label, not the processing.
    if (byExtension === "arw" || byExtension === "dng" || byExtension === "tiff") {
      return byExtension;
    }
    return "tiff";
  }
  return byExtension;
}

/**
 * Reads metadata and the best embedded preview.
 *
 * The original blob is only ever read, never written; we slice at most a few
 * megabytes out of it regardless of how large the RAW is.
 */
export async function readSourceMeta(file: Blob, fileName: string): Promise<SourceMeta> {
  const format = await detectFormat(file, fileName);
  const source = blobSource(file);

  if (format === "jpeg") {
    let exif: ExifData = {};
    try {
      const exifStart = await findJpegExifStart(source);
      if (exifStart !== null) {
        exif = await extractExif(await parseTiff(source, exifStart));
      }
    } catch {
      // A JPEG without a readable EXIF block is still perfectly usable.
    }
    return { format, exif, preview: file, previewSource: "original" };
  }

  if (format === "png") {
    return { format, exif: {}, preview: file, previewSource: "original" };
  }

  if (format === "arw" || format === "dng" || format === "tiff") {
    let exif: ExifData = {};
    let previewInfo: Awaited<ReturnType<typeof extractLargestPreview>> = null;
    let tiffFile: TiffFile | null = null;
    let decodeWarning: string | undefined;
    try {
      tiffFile = await parseTiff(source, 0);
      exif = await extractExif(tiffFile);
      previewInfo = await extractLargestPreview(tiffFile);
    } catch (error) {
      throw new Error(
        `No se pudo leer la estructura del archivo: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    if (!previewInfo) {
      // Decode the image data itself before falling back to a byte scan. Order
      // matters: compressed pixel data contains FF D8 byte pairs by chance, so
      // scanning an LZW strip can "find" a JPEG that is not there. Structure
      // first, guessing only as a last resort.
      const decoded = await decodeTiffToBlob(tiffFile);
      if (decoded) {
        return {
          format,
          exif,
          preview: decoded.blob,
          previewWidth: decoded.width,
          previewHeight: decoded.height,
          previewSource: "tiff:decoded",
        };
      }
      previewInfo = await scanForJpeg(source);
    }
    if (!previewInfo) {
      return {
        format,
        exif,
        preview: null,
        warning:
          decodeWarning ??
          "El archivo no contiene una previsualización utilizable y su formato interno no se " +
            "puede decodificar en el navegador (ver docs/ARQUITECTURA.md).",
      };
    }
    // Re-slice from the file so we hand over a Blob backed by the original,
    // rather than keeping the bytes alive in memory.
    const preview = file.slice(previewInfo.offset, previewInfo.offset + previewInfo.length);
    return {
      format,
      exif,
      preview,
      previewWidth: previewInfo.width,
      previewHeight: previewInfo.height,
      previewSource: previewInfo.source,
    };
  }

  throw new Error(`Formato no soportado: ${fileName}`);
}

/** Largest pixel count we will decode in the browser without a backend. */
const MAX_DECODE_PIXELS = 40_000_000;

/**
 * Decodes a TIFF's own image data to a JPEG blob, so the rest of the pipeline
 * can treat it exactly like any other preview.
 */
async function decodeTiffToBlob(
  file: TiffFile | null,
): Promise<{ blob: Blob; width: number; height: number } | null> {
  if (!file) return null;
  try {
    const index = await findLargestDecodableIfd(file);
    if (index === -1) return null;

    const image = await decodeTiffImage(file, index);
    if (image.width * image.height > MAX_DECODE_PIXELS) {
      throw new Error(
        `Imagen de ${image.width}x${image.height}: demasiado grande para decodificar en el navegador`,
      );
    }

    const canvas = createCanvas(image.width, image.height);
    const context = canvas.getContext("2d") as
      | OffscreenCanvasRenderingContext2D
      | CanvasRenderingContext2D
      | null;
    if (!context) return null;
    context.putImageData(new ImageData(image.data, image.width, image.height), 0, 0);

    const blob =
      canvas instanceof OffscreenCanvas
        ? await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 })
        : await new Promise<Blob>((resolve, reject) => {
            (canvas as HTMLCanvasElement).toBlob(
              (result) => (result ? resolve(result) : reject(new Error("toBlob devolvió null"))),
              "image/jpeg",
              0.92,
            );
          });
    return { blob, width: image.width, height: image.height };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Proxy generation
// ---------------------------------------------------------------------------

/**
 * Canvas transform for an EXIF orientation value.
 * Returns the drawing transform plus whether width/height must be swapped.
 */
export function orientationTransform(orientation = 1): {
  swap: boolean;
  matrix: [number, number, number, number, number, number];
} {
  switch (orientation) {
    case 2:
      return { swap: false, matrix: [-1, 0, 0, 1, 1, 0] };
    case 3:
      return { swap: false, matrix: [-1, 0, 0, -1, 1, 1] };
    case 4:
      return { swap: false, matrix: [1, 0, 0, -1, 0, 1] };
    case 5:
      return { swap: true, matrix: [0, 1, 1, 0, 0, 0] };
    case 6:
      return { swap: true, matrix: [0, 1, -1, 0, 1, 0] };
    case 7:
      return { swap: true, matrix: [0, -1, -1, 0, 1, 1] };
    case 8:
      return { swap: true, matrix: [0, -1, 1, 0, 0, 1] };
    default:
      return { swap: false, matrix: [1, 0, 0, 1, 0, 0] };
  }
}

export interface Proxy {
  data: ImageData;
  width: number;
  height: number;
}

function createCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Decodes a preview into an orientation-corrected `ImageData` no larger than
 * `maxEdge` on its long side. 512 px is plenty for histograms, hashing and skin
 * detection while keeping a 500-photo batch inside a phone's memory budget.
 */
export async function decodeProxy(
  preview: Blob,
  orientation = 1,
  maxEdge = 512,
): Promise<Proxy> {
  const bitmap = await createImageBitmap(preview);
  try {
    const { swap, matrix } = orientationTransform(orientation);
    const sourceW = bitmap.width;
    const sourceH = bitmap.height;
    const orientedW = swap ? sourceH : sourceW;
    const orientedH = swap ? sourceW : sourceH;

    const scale = Math.min(1, maxEdge / Math.max(orientedW, orientedH));
    const width = Math.max(1, Math.round(orientedW * scale));
    const height = Math.max(1, Math.round(orientedH * scale));

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    }) as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
    if (!context) throw new Error("No se pudo crear el contexto 2D para la miniatura");

    // The matrix is expressed in the normalised unit square, so scale it by the
    // destination size before drawing.
    const [a, b, c, d, e, f] = matrix;
    context.setTransform(a, b, c, d, e * width, f * height);
    context.drawImage(bitmap, 0, 0, swap ? height : width, swap ? width : height);
    context.setTransform(1, 0, 0, 1, 0, 0);

    return { data: context.getImageData(0, 0, width, height), width, height };
  } finally {
    bitmap.close();
  }
}

/** Renders an orientation-corrected thumbnail blob for the grid. */
export async function makeThumbnail(
  preview: Blob,
  orientation = 1,
  maxEdge = 320,
  quality = 0.72,
): Promise<Blob> {
  const bitmap = await createImageBitmap(preview);
  try {
    const { swap, matrix } = orientationTransform(orientation);
    const orientedW = swap ? bitmap.height : bitmap.width;
    const orientedH = swap ? bitmap.width : bitmap.height;
    const scale = Math.min(1, maxEdge / Math.max(orientedW, orientedH));
    const width = Math.max(1, Math.round(orientedW * scale));
    const height = Math.max(1, Math.round(orientedH * scale));

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d") as
      | OffscreenCanvasRenderingContext2D
      | CanvasRenderingContext2D
      | null;
    if (!context) throw new Error("No se pudo crear el contexto 2D para la miniatura");
    const [a, b, c, d, e, f] = matrix;
    context.setTransform(a, b, c, d, e * width, f * height);
    context.drawImage(bitmap, 0, 0, swap ? height : width, swap ? width : height);
    context.setTransform(1, 0, 0, 1, 0, 0);

    if (canvas instanceof OffscreenCanvas) {
      return canvas.convertToBlob({ type: "image/jpeg", quality });
    }
    return new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob devolvió null"))),
        "image/jpeg",
        quality,
      );
    });
  } finally {
    bitmap.close();
  }
}
