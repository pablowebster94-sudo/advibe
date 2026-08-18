/**
 * The unit of work: one file in, one analysed photo out.
 *
 * Shared verbatim between the Web Worker and the main-thread fallback, so a
 * browser without workers produces identical results, just more slowly.
 */
import type { ExifData, PhotoAnalysis, SourceFormat } from "../types";
import { analyzeImage } from "../analysis/analyze";
import { decodeProxy, makeThumbnail, readSourceMeta } from "../raw/decode";

export interface AnalyzeInput {
  fileName: string;
  blob: Blob;
  /** Long edge of the stored edit proxy. */
  proxyEdge?: number;
  /** Long edge of the grid thumbnail. */
  thumbnailEdge?: number;
  /** Long edge of the buffer the statistics are computed on. */
  analysisEdge?: number;
}

export interface AnalyzeOutput {
  format: SourceFormat;
  exif: ExifData;
  analysis: PhotoAnalysis;
  thumbnail: Blob;
  /** Re-encoded preview kept for the develop view and the JPEG export. */
  proxy: Blob;
  proxyWidth: number;
  proxyHeight: number;
  previewSource?: string;
  warning?: string;
}

export const DEFAULT_PROXY_EDGE = 1600;
export const DEFAULT_THUMBNAIL_EDGE = 320;
export const DEFAULT_ANALYSIS_EDGE = 512;

/** Re-encodes the embedded preview at `edge` px so storage stays predictable. */
async function encodeProxy(
  preview: Blob,
  orientation: number,
  edge: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(preview);
  try {
    const { swap, matrix } = await import("../raw/decode").then((module) =>
      module.orientationTransform(orientation),
    );
    const orientedW = swap ? bitmap.height : bitmap.width;
    const orientedH = swap ? bitmap.width : bitmap.height;
    const scale = Math.min(1, edge / Math.max(orientedW, orientedH));
    const width = Math.max(1, Math.round(orientedW * scale));
    const height = Math.max(1, Math.round(orientedH * scale));

    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(width, height)
        : Object.assign(document.createElement("canvas"), { width, height });
    const context = canvas.getContext("2d") as
      | OffscreenCanvasRenderingContext2D
      | CanvasRenderingContext2D
      | null;
    if (!context) throw new Error("No se pudo crear el contexto 2D");

    const [a, b, c, d, e, f] = matrix;
    context.setTransform(a, b, c, d, e * width, f * height);
    context.drawImage(bitmap, 0, 0, swap ? height : width, swap ? width : height);
    context.setTransform(1, 0, 0, 1, 0, 0);

    const blob =
      canvas instanceof OffscreenCanvas
        ? await canvas.convertToBlob({ type: "image/jpeg", quality: 0.86 })
        : await new Promise<Blob>((resolve, reject) => {
            (canvas as HTMLCanvasElement).toBlob(
              (result) => (result ? resolve(result) : reject(new Error("toBlob devolvió null"))),
              "image/jpeg",
              0.86,
            );
          });
    return { blob, width, height };
  } finally {
    bitmap.close();
  }
}

export async function analyzeFile(input: AnalyzeInput): Promise<AnalyzeOutput> {
  const meta = await readSourceMeta(input.blob, input.fileName);
  if (!meta.preview) {
    throw new Error(
      meta.warning ??
        "No se encontró una imagen legible dentro del archivo. El RAW original no se ha modificado.",
    );
  }

  const orientation = meta.exif.orientation ?? 1;
  const proxyEdge = input.proxyEdge ?? DEFAULT_PROXY_EDGE;

  // The analysis buffer, the thumbnail and the stored proxy all come from the
  // same embedded preview; the original file is read once and then released.
  const [analysisProxy, thumbnail, proxy] = await Promise.all([
    decodeProxy(meta.preview, orientation, input.analysisEdge ?? DEFAULT_ANALYSIS_EDGE),
    makeThumbnail(meta.preview, orientation, input.thumbnailEdge ?? DEFAULT_THUMBNAIL_EDGE),
    encodeProxy(meta.preview, orientation, proxyEdge),
  ]);

  const analysis = await analyzeImage(analysisProxy.data, {
    exif: meta.exif,
    format: meta.format,
  });

  return {
    format: meta.format,
    exif: meta.exif,
    analysis,
    thumbnail,
    proxy: proxy.blob,
    proxyWidth: proxy.width,
    proxyHeight: proxy.height,
    previewSource: meta.previewSource,
    warning: meta.warning,
  };
}
