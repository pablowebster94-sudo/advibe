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
import { type DevelopRendererLike, createDevelopRenderer, targetSizeFor } from "./render";
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
  /** Long edge in pixels; capped at the proxy's own size. */
  maxEdge: number;
}

export const JPEG_PRESETS: Record<string, JpegOptions & { label: string; note: string }> = {
  full: { label: "Máxima", quality: 0.94, maxEdge: 4096, note: "Limitado por el tamaño del proxy." },
  web: { label: "Web (2048 px)", quality: 0.88, maxEdge: 2048, note: "Ideal para entrega rápida." },
  social: { label: "Redes (1080 px)", quality: 0.85, maxEdge: 1080, note: "Instagram, WhatsApp." },
};

/** Renders one photo's current adjustments to a JPEG. */
export async function renderJpeg(
  photo: PhotoRecord,
  options: JpegOptions,
  renderer: DevelopRendererLike,
): Promise<Blob> {
  const proxy = await db.getProxy(photo.id);
  if (!proxy) {
    throw new Error(`No hay proxy almacenado para ${photo.fileName}; vuelve a importarla.`);
  }
  const adjustments = effectiveAdjustments(photo);
  if (!adjustments) {
    throw new Error(`${photo.fileName} todavía no tiene ajustes generados.`);
  }

  const bitmap = await createImageBitmap(proxy);
  try {
    // Two independent caps: what the photographer asked for, and what the
    // backend can develop. On the Canvas 2D path the second one is the binding
    // constraint, which the export UI states before the job starts.
    const requested = Math.min(1, options.maxEdge / Math.max(bitmap.width, bitmap.height));
    const budget = targetSizeFor(
      renderer.backend,
      Math.round(bitmap.width * requested),
      Math.round(bitmap.height * requested),
    );

    if (budget.width !== bitmap.width || budget.height !== bitmap.height) {
      const resized = await createImageBitmap(bitmap, {
        resizeWidth: budget.width,
        resizeHeight: budget.height,
        resizeQuality: "high",
      });
      try {
        renderer.setSource(resized);
        renderer.render(adjustments);
      } finally {
        resized.close();
      }
    } else {
      renderer.setSource(bitmap);
      renderer.render(adjustments);
    }
    return await renderer.toBlob("image/jpeg", options.quality);
  } finally {
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
  const renderer = selection.jpeg ? createDevelopRenderer() : null;

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
            jpeg,
            { modified: new Date(photo.exif.capturedAt ?? photo.lastModified), compress: false },
          );
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
    return { blob: writer.finish(), fileCount: writer.fileCount, failures };
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
