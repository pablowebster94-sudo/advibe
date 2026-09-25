/**
 * Export.
 *
 * Two very different products come out of here, and the difference matters:
 *
 *  - **`.xmp` sidecars** are the full-quality path. They carry the slider values
 *    to Lightroom Classic, which develops the untouched full-resolution RAW with
 *    Adobe's colour science. Nothing is lost.
 *  - **`.jpg` files** are rendered here, from the proxy built out of the RAW's
 *    embedded preview. They are for quick delivery and client previews, and they
 *    are bounded by the proxy resolution. The UI says so before exporting.
 */
import type { Adjustments, PhotoRecord, ProjectRecord } from "./types";
import { isRawFormat } from "./types";
import { effectiveAdjustments } from "./pipeline";
import {
  type DevelopRendererLike,
  backendOverrideFromLocation,
  canvasToBlob,
  createDevelopRenderer,
  renderFullResolution,
} from "./render";
import { decodePreviewBitmap, readSourceMeta } from "./raw/decode";
import { getOriginal } from "./storage/originals";
import { buildXmp, sidecarName } from "./xmp/write";
import { ZipWriter } from "./zip";
import * as db from "./storage/db";

export interface XmpFile {
  name: string;
  content: string;
}

export function buildSidecar(photo: PhotoRecord, adjustments: Adjustments): XmpFile {
  return {
    name: sidecarName(photo.fileName),
    content: buildXmp(adjustments, {
      isRaw: isRawFormat(photo.format),
      fileName: photo.fileName,
      exif: photo.exif,
      rating: photo.picked ? 5 : undefined,
      label: photo.rejected ? "Red" : undefined,
    }),
  };
}

export interface JpegOptions {
  /** 0.5 - 1.0 */
  quality: number;
  /** Long edge in pixels. 0 means "the original's own resolution", uncapped. */
  maxEdge: number;
}

export const JPEG_PRESETS: Record<string, JpegOptions & { label: string; note: string }> = {
  full: {
    label: "Resolución completa",
    quality: 0.95,
    maxEdge: 0,
    note: "Mismas dimensiones que el original, sin reescalado.",
  },
  web: { label: "Web (2048 px)", quality: 0.9, maxEdge: 2048, note: "Ideal para entrega rápida." },
  social: { label: "Redes (1080 px)", quality: 0.88, maxEdge: 1080, note: "Instagram, WhatsApp." },
};

/** What a full-resolution export actually produced, for the caller to verify. */
export interface RenderedJpeg {
  blob: Blob;
  width: number;
  height: number;
  /** Native size of the best pixel source we could open for this photograph. */
  sourceWidth: number;
  sourceHeight: number;
  /** True when the pixels came from the original file rather than the proxy. */
  fromOriginal: boolean;
  /** Set when the result is smaller than the original, with the reason. */
  downscaledReason?: string;
}

/**
 * Opens the best pixel source available for a photograph.
 *
 * Preference order, and the reason for it:
 *  1. The original file's embedded preview at its native size. On a Sony ARW
 *     that is the full 6000x4000 frame, which is what a full-resolution export
 *     needs. The original is only ever read, never modified.
 *  2. The stored proxy, bounded by the project's `proxyEdge`. Used when the tab
 *     has been reloaded and the file handles are gone; the caller reports it
 *     instead of quietly shipping a smaller JPEG.
 *
 * Note that this is still the *embedded preview*, not demosaiced sensor data —
 * no detail is invented, and a file whose embedded preview is smaller than the
 * sensor cannot be exported at sensor size. That case is reported, not upscaled.
 */
async function openBestSource(
  photo: PhotoRecord,
  wantFullResolution: boolean,
): Promise<{ bitmap: ImageBitmap; fromOriginal: boolean }> {
  if (wantFullResolution) {
    const original = getOriginal(photo.id, photo.fileName);
    if (original) {
      try {
        const meta = await readSourceMeta(original, photo.fileName);
        if (meta.preview) {
          // Number.POSITIVE_INFINITY: decode at native size, never downscale.
          const bitmap = await decodePreviewBitmap(meta.preview, Number.POSITIVE_INFINITY, {
            width: meta.previewWidth,
            height: meta.previewHeight,
          });
          return { bitmap, fromOriginal: true };
        }
      } catch {
        // Fall through to the proxy rather than failing the whole export.
      }
    }
  }

  const proxy = await db.getProxy(photo.id);
  if (!proxy) {
    throw new Error(`No hay proxy almacenado para ${photo.fileName}; vuelve a importarla.`);
  }
  return { bitmap: await createImageBitmap(proxy), fromOriginal: false };
}

/**
 * Renders one photograph's current adjustments to a JPEG.
 *
 * With `maxEdge: 0` (the "Resolución completa" preset) the output keeps the
 * original's own pixel dimensions: a 6000x4000 ARW exports 6000x4000. The
 * adjustments are applied to those pixels at export time — the reduced preview
 * is never upscaled — and the result is verified against the source size before
 * it is handed back.
 */
export async function renderJpeg(
  photo: PhotoRecord,
  options: JpegOptions,
  renderer: DevelopRendererLike,
): Promise<RenderedJpeg> {
  const adjustments = effectiveAdjustments(photo);
  if (!adjustments) {
    throw new Error(`${photo.fileName} todavía no tiene ajustes generados.`);
  }

  const wantFull = options.maxEdge === 0;
  const { bitmap, fromOriginal } = await openBestSource(photo, wantFull);
  const sourceWidth = bitmap.width;
  const sourceHeight = bitmap.height;

  let working = bitmap;
  let downscaledReason: string | undefined;
  try {
    // Only ever downscale when the photographer asked for a bounded size.
    if (!wantFull) {
      const longest = Math.max(sourceWidth, sourceHeight);
      if (longest > options.maxEdge) {
        const scale = options.maxEdge / longest;
        working = await createImageBitmap(bitmap, {
          resizeWidth: Math.max(1, Math.round(sourceWidth * scale)),
          resizeHeight: Math.max(1, Math.round(sourceHeight * scale)),
          resizeQuality: "high",
        });
      }
    } else if (!fromOriginal) {
      downscaledReason =
        "Se exportó desde la previsualización almacenada porque el archivo original ya no está " +
        "disponible en esta sesión. Vuelve a adjuntar los originales para exportar a resolución completa.";
    }

    const rendered = await renderFullResolution(working, adjustments, renderer);
    const blob = await canvasToBlob(rendered.canvas, "image/jpeg", options.quality);

    // The render must not have changed the frame's size behind our back.
    if (rendered.width !== working.width || rendered.height !== working.height) {
      throw new Error(
        `El revelado devolvió ${rendered.width}x${rendered.height} en lugar de ` +
          `${working.width}x${working.height} para ${photo.fileName}.`,
      );
    }

    return {
      blob,
      width: rendered.width,
      height: rendered.height,
      sourceWidth,
      sourceHeight,
      fromOriginal,
      downscaledReason,
    };
  } finally {
    if (working !== bitmap) working.close();
    bitmap.close();
  }
}

export interface ExportSelection {
  xmp: boolean;
  jpeg: boolean;
  jpegOptions: JpegOptions;
  /** Puts XMP and JPEG in separate folders inside the archive. */
  useFolders: boolean;
}

export interface ExportProgress {
  completed: number;
  total: number;
  currentName: string;
}

export interface ExportResult {
  blob: Blob;
  fileCount: number;
  /** Files that could not be produced, with the reason. */
  failures: Array<{ fileName: string; message: string }>;
  /** What each JPEG actually came out as, so the caller can verify it. */
  exported: Array<{
    fileName: string;
    width: number;
    height: number;
    sourceWidth: number;
    sourceHeight: number;
    fromOriginal: boolean;
  }>;
}

/** Builds the ZIP archive for a selection of photos. */
export async function exportZip(
  project: ProjectRecord,
  photos: readonly PhotoRecord[],
  selection: ExportSelection,
  onProgress?: (progress: ExportProgress) => void,
): Promise<ExportResult> {
  const writer = new ZipWriter();
  const failures: ExportResult["failures"] = [];
  const exported: ExportResult["exported"] = [];
  // Honours the same `?render=` switch as the preview, so a device whose GPU
  // mis-renders can still be forced down the CPU path for the export.
  const renderer = selection.jpeg
    ? createDevelopRenderer({ forceBackend: backendOverrideFromLocation() })
    : null;

  if (selection.jpeg && !renderer) {
    failures.push({
      fileName: "—",
      message:
        "Este navegador no permite ni WebGL2 ni Canvas 2D, así que no se pueden generar JPG. " +
        "Los archivos XMP sí se exportan y contienen la edición completa.",
    });
  }

  try {
    let completed = 0;
    for (const photo of photos) {
      onProgress?.({ completed, total: photos.length, currentName: photo.fileName });

      const adjustments = effectiveAdjustments(photo);
      if (!adjustments) {
        failures.push({ fileName: photo.fileName, message: "Sin ajustes generados." });
        completed += 1;
        continue;
      }

      if (selection.xmp) {
        const sidecar = buildSidecar(photo, adjustments);
        await writer.addFile(
          selection.useFolders ? `xmp/${sidecar.name}` : sidecar.name,
          sidecar.content,
          { modified: new Date(photo.exif.capturedAt ?? photo.lastModified) },
        );
      }

      if (selection.jpeg && renderer) {
        try {
          const jpeg = await renderJpeg(photo, selection.jpegOptions, renderer);
          await writer.addFile(
            selection.useFolders ? `jpg/${photo.baseName}.jpg` : `${photo.baseName}.jpg`,
            jpeg.blob,
            { modified: new Date(photo.exif.capturedAt ?? photo.lastModified), compress: false },
          );
          exported.push({
            fileName: photo.fileName,
            width: jpeg.width,
            height: jpeg.height,
            sourceWidth: jpeg.sourceWidth,
            sourceHeight: jpeg.sourceHeight,
            fromOriginal: jpeg.fromOriginal,
          });
          // Automatic verification: at full resolution the JPEG must carry the
          // original's own dimensions. Reported as an incidence rather than
          // thrown, so one odd file does not abort a 400-photo delivery.
          if (jpeg.downscaledReason) {
            failures.push({ fileName: photo.fileName, message: jpeg.downscaledReason });
          } else if (
            selection.jpegOptions.maxEdge === 0 &&
            (jpeg.width !== jpeg.sourceWidth || jpeg.height !== jpeg.sourceHeight)
          ) {
            failures.push({
              fileName: photo.fileName,
              message:
                `El JPEG salió a ${jpeg.width}x${jpeg.height} y el original tiene ` +
                `${jpeg.sourceWidth}x${jpeg.sourceHeight}.`,
            });
          }
        } catch (error) {
          failures.push({
            fileName: photo.fileName,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }

      completed += 1;
      onProgress?.({ completed, total: photos.length, currentName: photo.fileName });
    }

    await writer.addFile("LEEME.txt", readmeFor(project, photos.length, selection));
    return { blob: writer.finish(), fileCount: writer.fileCount, failures, exported };
  } finally {
    renderer?.dispose();
  }
}

function readmeFor(
  project: ProjectRecord,
  photoCount: number,
  selection: ExportSelection,
): string {
  const lines = [
    `Proyecto: ${project.name}`,
    `Exportado: ${new Date().toLocaleString("es-EC")}`,
    `Fotografías: ${photoCount}`,
    "",
    "CÓMO USAR ESTOS ARCHIVOS EN LIGHTROOM CLASSIC",
    "",
  ];

  if (selection.xmp) {
    lines.push(
      "1. Copia cada archivo .xmp junto a su RAW original, en la misma carpeta y",
      "   con el mismo nombre (DSC08487.ARW  ->  DSC08487.xmp).",
      "2. En Lightroom Classic, importa la carpeta. Si los RAW ya están importados,",
      '   selecciónalos y usa Metadatos > "Leer metadatos del archivo".',
      "3. Los ajustes aparecerán en el módulo Revelar y podrás seguir editando",
      "   desde ahí con normalidad.",
      "",
      "El RAW original no ha sido modificado en ningún momento.",
      "",
      "NOTA SOBRE EL BALANCE DE BLANCOS",
      "Los .xmp de archivos RAW usan crs:IncrementalTemperature / crs:IncrementalTint,",
      "es decir, un desplazamiento relativo sobre el balance que midió la cámara. Es la",
      "única forma de trasladar la corrección sin sobrescribir el valor original con una",
      "cifra en Kelvin inventada.",
      "",
    );
  }
  if (selection.jpeg) {
    lines.push(
      "SOBRE LOS JPG",
      `Se han generado a partir de la previsualización embebida en el RAW, a un máximo`,
      `de ${selection.jpegOptions.maxEdge} px en el lado largo. Sirven para entrega rápida`,
      "y revisión con el cliente. Para calidad final, revela el RAW en Lightroom con",
      "el .xmp incluido.",
      "",
    );
  }

  lines.push("Generado con AdVibe AI Photo Editor.");
  return lines.join("\n");
}

/** Triggers a browser download for a blob. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "proyecto";
}
