/**
 * The unit of work: one file in, one analysed photo out.
 *
 * Shared verbatim between the Web Worker and the main-thread fallback, so a
 * browser without workers produces identical results, just more slowly.
 */
import type { ExifData, PhotoAnalysis, SourceFormat } from "../types";
import { runAnalysis } from "../analysis/provider";
import {
  canvasToJpeg,
  decodePreviewBitmap,
  readCanvasPixels,
  readSourceMeta,
  renderOriented,
} from "../raw/decode";

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

export interface AnalyzeSuccess {
  ok: true;
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

/**
 * The file was structurally readable — we have its metadata — but no image data
 * could be decoded. A RAW variant we cannot unpack still belongs in the
 * project with its EXIF visible and the reason stated, rather than vanishing
 * behind a generic failure.
 */
export interface AnalyzePartial {
  ok: false;
  format: SourceFormat;
  exif: ExifData;
  reason: string;
}

export type AnalyzeOutput = AnalyzeSuccess | AnalyzePartial;

export const DEFAULT_PROXY_EDGE = 1600;
export const DEFAULT_THUMBNAIL_EDGE = 320;
export const DEFAULT_ANALYSIS_EDGE = 512;

export async function analyzeFile(input: AnalyzeInput): Promise<AnalyzeOutput> {
  const meta = await readSourceMeta(input.blob, input.fileName);
  if (!meta.preview) {
    return {
      ok: false,
      format: meta.format,
      exif: meta.exif,
      reason:
        meta.warning ??
        "No se pudo decodificar ninguna imagen dentro del archivo. Los metadatos sí se leyeron " +
          "y el archivo original no se ha modificado.",
    };
  }

  const orientation = meta.exif.orientation ?? 1;
  const proxyEdge = input.proxyEdge ?? DEFAULT_PROXY_EDGE;
  const thumbnailEdge = input.thumbnailEdge ?? DEFAULT_THUMBNAIL_EDGE;
  const analysisEdge = input.analysisEdge ?? DEFAULT_ANALYSIS_EDGE;

  // One decode, three outputs, in that order.
  //
  // The previous version ran three decodes of the same preview in parallel.
  // With synthetic 1616x1080 fixtures that was invisible; with a real Sony ARW,
  // whose MakerNote carries a full 6000x4000 preview, it meant three ~96 MB
  // bitmaps at once per photo and four photos in flight — enough for Chrome to
  // kill the tab on a mid-range Android. Decoding once, downscaled by the
  // decoder itself, keeps the peak near 7 MB.
  const bitmap = await decodePreviewBitmap(meta.preview, proxyEdge, {
    width: meta.previewWidth,
    height: meta.previewHeight,
  });

  let analysisImage: ImageData;
  let thumbnail: Blob;
  let proxy: Blob;
  let proxyWidth: number;
  let proxyHeight: number;

  try {
    const proxyRender = renderOriented(bitmap, orientation, proxyEdge);
    proxy = await canvasToJpeg(proxyRender.canvas, 0.86);
    proxyWidth = proxyRender.width;
    proxyHeight = proxyRender.height;

    const thumbRender = renderOriented(bitmap, orientation, thumbnailEdge);
    thumbnail = await canvasToJpeg(thumbRender.canvas, 0.72);

    const analysisRender = renderOriented(bitmap, orientation, analysisEdge);
    analysisImage = readCanvasPixels(
      analysisRender.canvas,
      analysisRender.width,
      analysisRender.height,
    );
  } finally {
    // Released as soon as the pixels are out, so the next photo in the queue
    // does not have to wait for the garbage collector.
    bitmap.close();
  }

  // Goes through the provider registry rather than calling the local analyser
  // directly, so a hosted provider can be added later without touching this.
  const analysis = await runAnalysis({
    image: analysisImage,
    exif: meta.exif,
    format: meta.format,
    fileName: input.fileName,
  });

  return {
    ok: true,
    format: meta.format,
    exif: meta.exif,
    analysis,
    thumbnail,
    proxy,
    proxyWidth,
    proxyHeight,
    previewSource: meta.previewSource,
    warning: meta.warning,
  };
}
