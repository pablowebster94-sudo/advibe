/**
 * Full-resolution develop, for export.
 *
 * The preview deliberately develops a reduced frame — that is what keeps the
 * editor responsive on a phone. The export must not: a 6000x4000 photograph has
 * to come out 6000x4000, with every adjustment applied to those pixels.
 *
 * Two obstacles make that more than "render at a bigger size":
 *
 *  - **GPU texture limits.** WebGL2 refuses a texture larger than
 *    `MAX_TEXTURE_SIZE` (usually 8192, sometimes 4096 on older mobile parts).
 *  - **CPU memory.** The Canvas 2D path holds six full-frame buffers (source,
 *    scratch, base, fine blur, coarse blur, output). At 24 MP that is ~576 MB,
 *    which kills the tab on a mid-range Android.
 *
 * So when the whole frame does not fit the backend, it is developed in
 * horizontal bands and composited into a full-size output canvas. Each band is
 * cut with an overlap margin and told where it sits in the frame, so the blur
 * radii and the vignette stay functions of the whole image and the seams do not
 * show. Memory stays bounded by the band, whatever the photograph's size.
 */
import type { Adjustments } from "../types";
import type { DevelopRendererLike } from "./index";
import { MAX_PIXELS } from "./index";

/** Pixels developed at once when banding. Bounded so a band stays cheap. */
const BAND_PIXELS = 4_000_000;

/**
 * Blur radius the Canvas 2D path uses at the coarse scale, as a fraction of the
 * long edge. Bands overlap by a comfortable multiple of it so the blurred
 * planes are correct right up to the seam.
 */
const COARSE_RADIUS_RATIO = 6 / 400;
const MARGIN_MULTIPLIER = 3;

export interface FullResRender {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  width: number;
  height: number;
  /** True when the frame had to be developed in bands. */
  banded: boolean;
  bands: number;
}

function createCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** Whether `renderer` can take the whole frame in one pass. */
function fitsWhole(renderer: DevelopRendererLike, width: number, height: number): boolean {
  if (renderer.backend === "webgl2") {
    const limit = renderer.maxSourceSize?.() ?? 4096;
    return width <= limit && height <= limit;
  }
  // The Canvas 2D path is bounded by memory, not by a device limit.
  return width * height <= MAX_PIXELS.canvas2d * 8;
}

/**
 * Develops `source` at its native size and returns the canvas holding it.
 *
 * The output is always exactly `source.width` x `source.height`: nothing is
 * scaled up (which would invent detail) or down (which is what the caller is
 * trying to avoid).
 */
export async function renderFullResolution(
  source: ImageBitmap,
  adjustments: Adjustments,
  renderer: DevelopRendererLike,
): Promise<FullResRender> {
  const width = source.width;
  const height = source.height;

  if (fitsWhole(renderer, width, height)) {
    renderer.setTile?.(null);
    renderer.setSource(source);
    renderer.render(adjustments);
    return { canvas: renderer.getCanvas(), width, height, banded: false, bands: 1 };
  }

  const output = createCanvas(width, height);
  const context = output.getContext("2d") as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;
  if (!context) throw new Error("No se pudo crear el lienzo de exportación");

  // A band must also respect the GPU's texture limit on its width.
  const widthLimit =
    renderer.backend === "webgl2" ? (renderer.maxSourceSize?.() ?? 4096) : Number.POSITIVE_INFINITY;
  if (width > widthLimit) {
    throw new Error(
      `La imagen mide ${width} px de ancho y esta GPU no admite texturas de más de ${widthLimit} px. ` +
        "Prueba a exportar con el motor de CPU (?render=canvas2d).",
    );
  }

  const margin = Math.ceil(
    Math.max(width, height) * COARSE_RADIUS_RATIO * MARGIN_MULTIPLIER,
  );
  const bandHeight = Math.max(64, Math.min(height, Math.floor(BAND_PIXELS / Math.max(1, width))));

  let bands = 0;
  for (let top = 0; top < height; top += bandHeight) {
    const rows = Math.min(bandHeight, height - top);
    // Cut with overlap so the blur planes have real neighbours at the seam.
    const cutTop = Math.max(0, top - margin);
    const cutBottom = Math.min(height, top + rows + margin);
    const cutHeight = cutBottom - cutTop;

    const band = await createImageBitmap(source, 0, cutTop, width, cutHeight);
    try {
      renderer.setTile?.({ fullWidth: width, fullHeight: height, offsetX: 0, offsetY: cutTop });
      renderer.setSource(band);
      renderer.render(adjustments);
      // Copy back only the band itself, discarding the overlap.
      context.drawImage(
        renderer.getCanvas() as CanvasImageSource,
        0,
        top - cutTop,
        width,
        rows,
        0,
        top,
        width,
        rows,
      );
    } finally {
      band.close();
    }
    bands += 1;
  }

  renderer.setTile?.(null);
  return { canvas: output, width, height, banded: true, bands };
}

export async function canvasToBlob(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob devolvió null"))),
      type,
      quality,
    );
  });
}
