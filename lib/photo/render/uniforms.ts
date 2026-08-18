/**
 * Converts the Lightroom-scaled adjustment values into the normalised uniforms
 * the shader expects. Kept separate from the WebGL plumbing so the mapping is
 * unit-testable without a GPU.
 */
import type { Adjustments, HslChannel } from "../types";
import { clamp } from "../analysis/image";

export interface DevelopUniforms {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  temperature: number;
  tint: number;
  vibrance: number;
  saturation: number;
  texture: number;
  clarity: number;
  dehaze: number;
  sharpen: number;
  vignette: number;
  vignetteMidpoint: number;
  vignetteFeather: number;
  hslHue: Float32Array;
  hslSat: Float32Array;
  hslLum: Float32Array;
  gradeShadow: [number, number, number];
  gradeMidtone: [number, number, number];
  gradeHighlight: [number, number, number];
  gradeGlobal: [number, number, number];
  gradeBlending: number;
  /** 256-entry tone-curve LUT, or null when the curve is linear. */
  curve: Uint8Array | null;
}

/** Shader band order must match `bandWeight` in the fragment shader. */
const BAND_ORDER: readonly HslChannel[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "aqua",
  "blue",
  "purple",
  "magenta",
];

function band(values: Record<HslChannel, number>): Float32Array {
  const out = new Float32Array(8);
  BAND_ORDER.forEach((channel, index) => {
    out[index] = clamp(values[channel], -100, 100) / 100;
  });
  return out;
}

/**
 * Builds the LUT for a point curve using monotone cubic interpolation, so the
 * curve never overshoots between the photographer's control points.
 */
export function buildCurveLut(points: readonly { x: number; y: number }[]): Uint8Array | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const isLinear =
    sorted.length === 2 &&
    sorted[0].x === 0 &&
    sorted[0].y === 0 &&
    sorted[1].x === 255 &&
    sorted[1].y === 255;
  if (isLinear) return null;

  const xs = sorted.map((point) => point.x);
  const ys = sorted.map((point) => point.y);
  const count = xs.length;

  // Fritsch-Carlson tangents.
  const slopes: number[] = [];
  for (let index = 0; index < count - 1; index += 1) {
    const dx = xs[index + 1] - xs[index];
    slopes.push(dx === 0 ? 0 : (ys[index + 1] - ys[index]) / dx);
  }
  const tangents: number[] = new Array(count).fill(0);
  tangents[0] = slopes[0];
  tangents[count - 1] = slopes[count - 2];
  for (let index = 1; index < count - 1; index += 1) {
    if (slopes[index - 1] * slopes[index] <= 0) tangents[index] = 0;
    else tangents[index] = (slopes[index - 1] + slopes[index]) / 2;
  }
  for (let index = 0; index < count - 1; index += 1) {
    if (slopes[index] === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      continue;
    }
    const a = tangents[index] / slopes[index];
    const b = tangents[index + 1] / slopes[index];
    const magnitude = Math.hypot(a, b);
    if (magnitude > 3) {
      tangents[index] = ((3 / magnitude) * a) * slopes[index];
      tangents[index + 1] = ((3 / magnitude) * b) * slopes[index];
    }
  }

  const lut = new Uint8Array(256);
  let segment = 0;
  for (let x = 0; x < 256; x += 1) {
    if (x <= xs[0]) {
      lut[x] = clamp(ys[0], 0, 255);
      continue;
    }
    if (x >= xs[count - 1]) {
      lut[x] = clamp(ys[count - 1], 0, 255);
      continue;
    }
    while (segment < count - 2 && x > xs[segment + 1]) segment += 1;
    const h = xs[segment + 1] - xs[segment];
    const t = h === 0 ? 0 : (x - xs[segment]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    const value =
      (2 * t3 - 3 * t2 + 1) * ys[segment] +
      (t3 - 2 * t2 + t) * h * tangents[segment] +
      (-2 * t3 + 3 * t2) * ys[segment + 1] +
      (t3 - t2) * h * tangents[segment + 1];
    lut[x] = clamp(Math.round(value), 0, 255);
  }
  return lut;
}

export function toUniforms(adjustments: Adjustments): DevelopUniforms {
  const grade = adjustments.colorGrade;
  const wheel = (hue: number, sat: number, lum: number): [number, number, number] => [
    clamp(hue, 0, 360),
    clamp(sat, 0, 100) / 100,
    clamp(lum, -100, 100) / 100,
  ];

  return {
    exposure: clamp(adjustments.exposure, -5, 5),
    contrast: clamp(adjustments.contrast, -100, 100) / 100,
    highlights: clamp(adjustments.highlights, -100, 100) / 100,
    shadows: clamp(adjustments.shadows, -100, 100) / 100,
    whites: clamp(adjustments.whites, -100, 100) / 100,
    blacks: clamp(adjustments.blacks, -100, 100) / 100,
    temperature: clamp(adjustments.temperature, -100, 100) / 100,
    tint: clamp(adjustments.tint, -100, 100) / 100,
    vibrance: clamp(adjustments.vibrance, -100, 100) / 100,
    saturation: clamp(adjustments.saturation, -100, 100) / 100,
    texture: clamp(adjustments.texture, -100, 100) / 100,
    clarity: clamp(adjustments.clarity, -100, 100) / 100,
    dehaze: clamp(adjustments.dehaze, -100, 100) / 100,
    // Camera Raw's sharpening amount runs 0..150; the preview shows a
    // deliberately restrained share of it, since the real sharpening happens on
    // RAW data with a radius we cannot reproduce on a downscaled preview.
    sharpen: clamp(adjustments.sharpenAmount, 0, 150) / 300,
    vignette: clamp(adjustments.vignetteAmount, -100, 100) / 100,
    vignetteMidpoint: clamp(adjustments.vignetteMidpoint, 0, 100) / 100,
    vignetteFeather: clamp(adjustments.vignetteFeather, 0, 100) / 100,
    hslHue: band(adjustments.hsl.hue),
    hslSat: band(adjustments.hsl.saturation),
    hslLum: band(adjustments.hsl.luminance),
    gradeShadow: wheel(grade.shadowHue, grade.shadowSat, grade.shadowLum),
    gradeMidtone: wheel(grade.midtoneHue, grade.midtoneSat, grade.midtoneLum),
    gradeHighlight: wheel(grade.highlightHue, grade.highlightSat, grade.highlightLum),
    gradeGlobal: wheel(grade.globalHue, grade.globalSat, grade.globalLum),
    gradeBlending: clamp(grade.blending, 0, 100) / 100,
    curve: buildCurveLut(adjustments.toneCurve),
  };
}
