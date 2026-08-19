/**
 * Renderer selection.
 *
 * WebGL2 when the device gives us a context, Canvas 2D otherwise. Both apply
 * the same adjustments through the same maths (`pipeline.ts`), so the fallback
 * is a genuine preview, not a placeholder — the photographer sees their edit
 * either way.
 */
import type { Adjustments } from "../types";
import { Canvas2DRenderer } from "./canvas2d";
import { DevelopRenderer } from "./renderer";

export type RenderBackend = "webgl2" | "canvas2d";

export interface DevelopRendererLike {
  readonly backend: RenderBackend;
  readonly width: number;
  readonly height: number;
  setSource(source: ImageBitmap | ImageData): void;
  render(adjustments: Adjustments): void;
  readPixels(): ImageData;
  toBlob(type?: string, quality?: number): Promise<Blob>;
  getCanvas(): OffscreenCanvas | HTMLCanvasElement;
  dispose(): void;
}

/**
 * How many pixels each backend is asked to develop.
 *
 * WebGL2 shades a full proxy without noticing. Canvas 2D runs the loop on the
 * main thread, so it is given roughly what a phone screen can actually show at
 * device pixel ratio — past that the extra pixels cost frames and buy nothing.
 */
export const MAX_PIXELS: Record<RenderBackend, number> = {
  webgl2: 12_000_000,
  canvas2d: 700_000,
};

export interface CreateRendererOptions {
  /** Forces a backend instead of preferring WebGL2. */
  forceBackend?: RenderBackend;
}

/**
 * Reads `?render=canvas2d` (or `webgl2`) from the URL.
 *
 * Exposed as a real switch, not a test hook: it is the only way to check the
 * Canvas 2D path on a device that *does* have WebGL2, which is exactly what you
 * need when a phone in the field reports a broken preview.
 */
export function backendOverrideFromLocation(): RenderBackend | undefined {
  if (typeof location === "undefined") return undefined;
  try {
    const value = new URLSearchParams(location.search).get("render");
    return value === "canvas2d" || value === "webgl2" ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Returns a renderer, or null only when neither backend is available at all
 * (a non-browser context). Callers treat null as "show the untouched preview".
 */
export function createDevelopRenderer(
  options: CreateRendererOptions = {},
): DevelopRendererLike | null {
  if (options.forceBackend !== "canvas2d") {
    const webgl = DevelopRenderer.create();
    if (webgl) return webgl;
  }
  if (options.forceBackend === "webgl2") return null;
  return Canvas2DRenderer.create();
}

/** Fits `source` inside the backend's pixel budget, preserving aspect ratio. */
export function targetSizeFor(
  backend: RenderBackend,
  width: number,
  height: number,
  displayWidth = 0,
  displayHeight = 0,
): { width: number; height: number } {
  let maxPixels = MAX_PIXELS[backend];
  if (displayWidth > 0 && displayHeight > 0) {
    // Never develop meaningfully more than what will be shown.
    maxPixels = Math.min(maxPixels, Math.ceil(displayWidth * displayHeight * 1.4));
  }
  const pixels = width * height;
  if (pixels <= maxPixels) return { width, height };
  const scale = Math.sqrt(maxPixels / pixels);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export { Canvas2DRenderer } from "./canvas2d";
export { DevelopRenderer } from "./renderer";
