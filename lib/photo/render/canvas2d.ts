/**
 * Canvas 2D develop renderer.
 *
 * The fallback for anything without WebGL2 — and on a phone that is not an edge
 * case: a low-end device can refuse a GL context simply because it is short of
 * memory, and the whole point of this app is that it runs on the phone the
 * photographer already has.
 *
 * It applies the *complete* adjustment set, not a subset: white balance,
 * exposure, the full 2012 tone controls, the point curve, dehaze, texture,
 * clarity, sharpening, vibrance, saturation, the HSL mixer, colour grading and
 * the vignette. The maths comes from `pipeline.ts`, shared with the shader, so
 * the two backends agree.
 *
 * Speed comes from three decisions:
 *   - render at the size actually displayed, not at proxy resolution
 *   - drive tone through a precomputed LUT
 *   - skip the HSV round-trip entirely when no colour control is engaged
 */
import type { Adjustments } from "../types";
import {
  type Hsv,
  buildToneLut,
  luma,
  needsBlurPass,
  needsColorPass,
  applyHslAndGrade,
  sampleToneLut,
  vignetteFactor,
  whiteBalanceGains,
} from "./pipeline";
import { type DevelopUniforms, toUniforms } from "./uniforms";

type Canvas = OffscreenCanvas | HTMLCanvasElement;
type Context2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function createCanvas(width: number, height: number): Canvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context2d(canvas: Canvas, willReadFrequently = false): Context2D | null {
  return canvas.getContext("2d", { willReadFrequently }) as Context2D | null;
}

/** `ctx.filter` gives us a real Gaussian blur on the GPU; not every engine has it. */
function supportsFilter(context: Context2D): boolean {
  try {
    context.filter = "blur(1px)";
    const ok = context.filter !== "none" && context.filter !== "";
    context.filter = "none";
    return ok;
  } catch {
    return false;
  }
}

/** Where a band sits inside the whole frame it belongs to. */
export interface TileContext {
  fullWidth: number;
  fullHeight: number;
  offsetX: number;
  offsetY: number;
}

export class Canvas2DRenderer {
  readonly backend = "canvas2d" as const;

  private readonly canvas: Canvas;
  private readonly context: Context2D;
  private readonly scratch: Canvas;
  private readonly scratchContext: Context2D;
  private source: ImageBitmap | ImageData | null = null;
  private sourceWidth = 0;
  private sourceHeight = 0;
  private hasFilter = false;
  /** Cached because reading it back per render would stall the pipeline. */
  private baseData: ImageData | null = null;
  private fineData: ImageData | null = null;
  private coarseData: ImageData | null = null;
  private blurRadiiFor = "";
  /**
   * Set when this renderer is developing one band of a larger frame. Blur radii
   * and the vignette are functions of the WHOLE image, so a band has to be told
   * where it sits; without this each band would blur at its own scale and carry
   * its own vignette, and the seams would show.
   */
  private tile: TileContext | null = null;

  private constructor(canvas: Canvas, context: Context2D, scratch: Canvas, scratchContext: Context2D) {
    this.canvas = canvas;
    this.context = context;
    this.scratch = scratch;
    this.scratchContext = scratchContext;
    this.hasFilter = supportsFilter(scratchContext);
  }

  static create(): Canvas2DRenderer | null {
    try {
      const canvas = createCanvas(1, 1);
      const context = context2d(canvas, true);
      const scratch = createCanvas(1, 1);
      const scratchContext = context2d(scratch, true);
      if (!context || !scratchContext) return null;
      return new Canvas2DRenderer(canvas, context, scratch, scratchContext);
    } catch {
      return null;
    }
  }

  get width(): number {
    return this.sourceWidth;
  }

  get height(): number {
    return this.sourceHeight;
  }

  /** True when texture/clarity/dehaze can be shown; false means they are skipped. */
  get supportsLocalContrast(): boolean {
    return this.hasFilter;
  }

  /**
   * Declares that the next `setSource` holds a band of a bigger image. Pass
   * null to go back to developing a whole frame.
   */
  setTile(tile: TileContext | null): void {
    this.tile = tile;
    // The blur planes are keyed on the radius basis, which the tile changes.
    this.blurRadiiFor = "";
  }

  setSource(source: ImageBitmap | ImageData): void {
    this.source = source;
    this.sourceWidth = source.width;
    this.sourceHeight = source.height;
    this.canvas.width = source.width;
    this.canvas.height = source.height;
    this.scratch.width = source.width;
    this.scratch.height = source.height;
    this.baseData = null;
    this.fineData = null;
    this.coarseData = null;
    this.blurRadiiFor = "";
  }

  private drawSource(context: Context2D, filter: string): void {
    if (!this.source) return;
    context.save();
    context.filter = filter;
    context.clearRect(0, 0, this.sourceWidth, this.sourceHeight);
    if (typeof ImageData !== "undefined" && this.source instanceof ImageData) {
      // putImageData ignores filters, so the unfiltered path is the only one
      // available for raw ImageData sources.
      context.putImageData(this.source, 0, 0);
    } else {
      context.drawImage(this.source as ImageBitmap, 0, 0);
    }
    context.restore();
  }

  private ensurePlanes(uniforms: DevelopUniforms): void {
    if (!this.baseData) {
      this.drawSource(this.scratchContext, "none");
      this.baseData = this.scratchContext.getImageData(0, 0, this.sourceWidth, this.sourceHeight);
    }
    if (!needsBlurPass(uniforms) || !this.hasFilter) return;

    // Radii scale with the image so the effect looks the same at any preview
    // size, matching how the shader blurs at a fixed fraction of the frame.
    const basis = this.tile
      ? Math.max(this.tile.fullWidth, this.tile.fullHeight)
      : Math.max(this.sourceWidth, this.sourceHeight);
    const fineRadius = Math.max(1, Math.round(basis / 400));
    const coarseRadius = Math.max(3, fineRadius * 6);
    const key = `${fineRadius}:${coarseRadius}:${this.sourceWidth}x${this.sourceHeight}:${this.tile?.offsetY ?? -1}`;
    if (this.blurRadiiFor === key && this.fineData && this.coarseData) return;

    this.drawSource(this.scratchContext, `blur(${fineRadius}px)`);
    this.fineData = this.scratchContext.getImageData(0, 0, this.sourceWidth, this.sourceHeight);
    this.drawSource(this.scratchContext, `blur(${coarseRadius}px)`);
    this.coarseData = this.scratchContext.getImageData(0, 0, this.sourceWidth, this.sourceHeight);
    this.blurRadiiFor = key;
  }

  render(adjustments: Adjustments): void {
    if (!this.source) throw new Error("No hay imagen cargada en el renderizador");
    const u = toUniforms(adjustments);
    this.ensurePlanes(u);
    const base = this.baseData;
    if (!base) throw new Error("No se pudo leer la imagen base");

    const width = this.sourceWidth;
    const height = this.sourceHeight;
    const output = new ImageData(new Uint8ClampedArray(base.data), width, height);
    const src = base.data;
    const dst = output.data;
    const fine = this.fineData?.data;
    const coarse = this.coarseData?.data;

    const lut = buildToneLut(u);
    const [gainR, gainG, gainB] = whiteBalanceGains(u);
    const exposure = 2 ** u.exposure;
    const doColor = needsColorPass(u);
    const doTexture = Math.abs(u.texture) > 0.001 && fine;
    const doClarity = Math.abs(u.clarity) > 0.001 && coarse;
    const doDehaze = Math.abs(u.dehaze) > 0.001 && coarse;
    const doSharpen = u.sharpen > 0.001;
    const doVignette = Math.abs(u.vignette) > 0.001;
    // Vignette is positioned against the whole frame, so a band uses the full
    // image's geometry plus its own offset rather than its local coordinates.
    const frameWidth = this.tile?.fullWidth ?? width;
    const frameHeight = this.tile?.fullHeight ?? height;
    const offsetX = this.tile?.offsetX ?? 0;
    const offsetY = this.tile?.offsetY ?? 0;
    const aspect = frameWidth / Math.max(1, frameHeight);
    const dehazeDivisor = Math.max(0.15, 1 - u.dehaze * 0.35);

    const rgb: [number, number, number] = [0, 0, 0];
    const hsv: Hsv = { h: 0, s: 0, v: 0 };

    for (let y = 0; y < height; y += 1) {
      const rowOffset = y * width * 4;
      for (let x = 0; x < width; x += 1) {
        const at = rowOffset + x * 4;

        let r = (src[at] / 255) * gainR;
        let g = (src[at + 1] / 255) * gainG;
        let b = (src[at + 2] / 255) * gainB;

        r *= exposure;
        g *= exposure;
        b *= exposure;

        if (doDehaze && coarse) {
          const veil = Math.min(1, Math.max(0, luma(coarse[at] / 255, coarse[at + 1] / 255, coarse[at + 2] / 255)));
          const subtract = u.dehaze * 0.35 * veil;
          r = (r - subtract) / dehazeDivisor;
          g = (g - subtract) / dehazeDivisor;
          b = (b - subtract) / dehazeDivisor;
        }

        const L = Math.max(1e-4, luma(r, g, b));
        const scale = sampleToneLut(lut, L) / L;
        r *= scale;
        g *= scale;
        b *= scale;

        if (doTexture && fine) {
          const amount = u.texture * 1.6;
          r += (r - (fine[at] / 255) * gainR * exposure) * amount;
          g += (g - (fine[at + 1] / 255) * gainG * exposure) * amount;
          b += (b - (fine[at + 2] / 255) * gainB * exposure) * amount;
        }
        if (doClarity && coarse) {
          const mid = 1 - Math.abs(Math.min(1, Math.max(0, luma(r, g, b))) - 0.5) * 2;
          const amount = u.clarity * 1.1 * mid;
          r += (r - (coarse[at] / 255) * gainR * exposure) * amount;
          g += (g - (coarse[at + 1] / 255) * gainG * exposure) * amount;
          b += (b - (coarse[at + 2] / 255) * gainB * exposure) * amount;
        }
        if (doSharpen && x > 0 && x < width - 1 && y > 0 && y < height - 1) {
          const left = at - 4;
          const right = at + 4;
          const up = at - width * 4;
          const down = at + width * 4;
          const avgR = (src[left] + src[right] + src[up] + src[down]) / 4 / 255;
          const avgG = (src[left + 1] + src[right + 1] + src[up + 1] + src[down + 1]) / 4 / 255;
          const avgB = (src[left + 2] + src[right + 2] + src[up + 2] + src[down + 2]) / 4 / 255;
          r += (src[at] / 255 - avgR) * u.sharpen;
          g += (src[at + 1] / 255 - avgG) * u.sharpen;
          b += (src[at + 2] / 255 - avgB) * u.sharpen;
        }

        r = Math.max(0, r);
        g = Math.max(0, g);
        b = Math.max(0, b);

        if (doColor) {
          rgb[0] = r;
          rgb[1] = g;
          rgb[2] = b;
          applyHslAndGrade(rgb, u, hsv);
          r = rgb[0];
          g = rgb[1];
          b = rgb[2];
        }

        if (doVignette) {
          const factor = vignetteFactor(
            u,
            (x + offsetX + 0.5) / frameWidth,
            (y + offsetY + 0.5) / frameHeight,
            aspect,
          );
          r *= factor;
          g *= factor;
          b *= factor;
        }

        dst[at] = r * 255;
        dst[at + 1] = g * 255;
        dst[at + 2] = b * 255;
        dst[at + 3] = 255;
      }
    }

    this.context.putImageData(output, 0, 0);
  }

  readPixels(): ImageData {
    return this.context.getImageData(0, 0, this.sourceWidth, this.sourceHeight);
  }

  async toBlob(type = "image/jpeg", quality = 0.9): Promise<Blob> {
    if (typeof OffscreenCanvas !== "undefined" && this.canvas instanceof OffscreenCanvas) {
      return this.canvas.convertToBlob({ type, quality });
    }
    const canvas = this.canvas as HTMLCanvasElement;
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob devolvió null"))),
        type,
        quality,
      );
    });
  }

  getCanvas(): Canvas {
    return this.canvas;
  }

  dispose(): void {
    this.tile = null;
    this.source = null;
    this.baseData = null;
    this.fineData = null;
    this.coarseData = null;
  }
}
