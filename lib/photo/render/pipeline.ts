/**
 * The develop pipeline as pure functions.
 *
 * This is the same maths the GLSL shader runs, written once in TypeScript so
 * that the Canvas 2D renderer produces the *same picture* as the WebGL2 one
 * rather than an approximation of it. `tests/render.test.ts` pins the two
 * backends against each other.
 *
 * Everything here is allocation-light and LUT-driven: the Canvas 2D path runs
 * this per pixel on the main thread of a mid-range phone.
 */
import type { DevelopUniforms } from "./uniforms";

export const LUMA_R = 0.2126;
export const LUMA_G = 0.7152;
export const LUMA_B = 0.0722;

export function luma(r: number, g: number, b: number): number {
  return LUMA_R * r + LUMA_G * g + LUMA_B * b;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Tone response applied to luminance only; RGB is then scaled by the ratio.
 * Mirrors `applyTone()` in `glsl.ts` exactly — if one changes, both change.
 */
export function applyTone(value: number, u: DevelopUniforms): number {
  let L = value;

  const highMask = smoothstep(0.35, 1, L);
  L += u.highlights * 0.45 * highMask * (u.highlights < 0 ? L : 1 - L);

  const lowMask = 1 - smoothstep(0, 0.65, L);
  L += u.shadows * 0.45 * lowMask * (u.shadows > 0 ? 1 - L : L);

  L += u.whites * 0.22 * smoothstep(0.45, 1, L);
  L += u.blacks * 0.22 * (1 - smoothstep(0, 0.55, L));

  L = Math.min(4, Math.max(0, L));
  if (u.contrast > 0) {
    const s = Math.min(1, Math.max(0, L));
    L = L + (s * s * (3 - 2 * s) - L) * (u.contrast * 0.85);
  } else if (u.contrast < 0) {
    L = 0.5 + (L - 0.5) * (1 + u.contrast * 0.55);
  }
  return L;
}

/** Number of LUT samples across the 0..4 luminance range. */
export const TONE_LUT_SIZE = 1024;
export const TONE_LUT_MAX = 4;

/**
 * Precomputes the tone response, including the optional point curve, so the
 * per-pixel loop is two multiplies and a lookup instead of a dozen branches.
 */
export function buildToneLut(u: DevelopUniforms): Float32Array {
  const lut = new Float32Array(TONE_LUT_SIZE + 1);
  for (let index = 0; index <= TONE_LUT_SIZE; index += 1) {
    const input = (index / TONE_LUT_SIZE) * TONE_LUT_MAX;
    let output = applyTone(input, u);
    if (u.curve) {
      // The curve is defined on 0..1; above that it passes through, matching
      // the shader, which samples the curve texture with a clamped coordinate.
      const clamped = Math.min(1, Math.max(0, output));
      const position = clamped * 255;
      const low = Math.floor(position);
      const high = Math.min(255, low + 1);
      const mix = position - low;
      const curved = (u.curve[low] * (1 - mix) + u.curve[high] * mix) / 255;
      output = output <= 1 ? curved : output;
    }
    lut[index] = output;
  }
  return lut;
}

export function sampleToneLut(lut: Float32Array, value: number): number {
  if (value <= 0) return lut[0];
  const position = (value / TONE_LUT_MAX) * TONE_LUT_SIZE;
  if (position >= TONE_LUT_SIZE) return lut[TONE_LUT_SIZE];
  const low = position | 0;
  const mix = position - low;
  return lut[low] * (1 - mix) + lut[low + 1] * mix;
}

/** White-balance channel gains, matching the shader's first block. */
export function whiteBalanceGains(u: DevelopUniforms): [number, number, number] {
  return [
    (1 + u.temperature * 0.22) * (1 + u.tint * 0.06),
    1 - u.tint * 0.16,
    (1 - u.temperature * 0.22) * (1 + u.tint * 0.06),
  ];
}

// ---------------------------------------------------------------------------
// HSV, used by vibrance, saturation and the HSL mixer
// ---------------------------------------------------------------------------

export interface Hsv {
  h: number; // 0..1
  s: number;
  v: number;
}

export function rgbToHsv(r: number, g: number, b: number, out: Hsv): Hsv {
  const max = r > g ? (r > b ? r : b) : g > b ? g : b;
  const min = r < g ? (r < b ? r : b) : g < b ? g : b;
  const delta = max - min;

  let h = 0;
  if (delta > 1e-9) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h /= 6;
    if (h < 0) h += 1;
  }
  out.h = h;
  out.s = max <= 1e-9 ? 0 : delta / max;
  out.v = max;
  return out;
}

export function hsvToRgb(hsv: Hsv, out: [number, number, number]): [number, number, number] {
  const h = hsv.h * 6;
  const sector = Math.floor(h);
  const f = h - sector;
  const p = hsv.v * (1 - hsv.s);
  const q = hsv.v * (1 - hsv.s * f);
  const t = hsv.v * (1 - hsv.s * (1 - f));

  switch (((sector % 6) + 6) % 6) {
    case 0: out[0] = hsv.v; out[1] = t; out[2] = p; break;
    case 1: out[0] = q; out[1] = hsv.v; out[2] = p; break;
    case 2: out[0] = p; out[1] = hsv.v; out[2] = t; break;
    case 3: out[0] = p; out[1] = q; out[2] = hsv.v; break;
    case 4: out[0] = t; out[1] = p; out[2] = hsv.v; break;
    default: out[0] = hsv.v; out[1] = p; out[2] = q; break;
  }
  return out;
}

/** Camera Raw's eight HSL band centres, in degrees. Order matches the shader. */
export const BAND_CENTERS = [0, 30, 60, 120, 180, 240, 280, 320];

export function bandWeight(hueDegrees: number, band: number): number {
  const center = BAND_CENTERS[band];
  const delta = Math.abs(((hueDegrees - center + 540) % 360) - 180);
  return 1 - smoothstep(0, 45, delta);
}

/** True when no colour-space work is needed, letting the loop skip HSV entirely. */
export function needsColorPass(u: DevelopUniforms): boolean {
  if (Math.abs(u.vibrance) > 0.001 || Math.abs(u.saturation) > 0.001) return true;
  for (let band = 0; band < 8; band += 1) {
    if (u.hslHue[band] !== 0 || u.hslSat[band] !== 0 || u.hslLum[band] !== 0) return true;
  }
  const wheels = [u.gradeShadow, u.gradeMidtone, u.gradeHighlight, u.gradeGlobal];
  return wheels.some((wheel) => wheel[1] > 0 || wheel[2] !== 0);
}

/** True when the blurred planes are needed (texture, clarity or dehaze). */
export function needsBlurPass(u: DevelopUniforms): boolean {
  return Math.abs(u.texture) > 0.001 || Math.abs(u.clarity) > 0.001 || Math.abs(u.dehaze) > 0.001;
}

export function applyHslAndGrade(
  rgb: [number, number, number],
  u: DevelopUniforms,
  hsv: Hsv,
): void {
  // --- vibrance / saturation ----------------------------------------------
  if (Math.abs(u.vibrance) > 0.001 || Math.abs(u.saturation) > 0.001) {
    rgbToHsv(rgb[0], rgb[1], rgb[2], hsv);
    if (Math.abs(u.vibrance) > 0.001) {
      const hueDegrees = hsv.h * 360;
      const skinDistance = Math.abs(((hueDegrees - 22 + 540) % 360) - 180);
      const skin = 1 - smoothstep(0, 40, skinDistance);
      const gain = u.vibrance * (1 - hsv.s) * (1 - skin * 0.55);
      hsv.s = Math.min(1, Math.max(0, hsv.s * (1 + gain * 1.4)));
    }
    if (Math.abs(u.saturation) > 0.001) {
      hsv.s = Math.min(1, Math.max(0, hsv.s * (1 + u.saturation)));
    }
    hsvToRgb(hsv, rgb);
  }

  // --- HSL mixer ------------------------------------------------------------
  let hueShift = 0;
  let satShift = 0;
  let lumShift = 0;
  let total = 0;
  rgbToHsv(rgb[0], rgb[1], rgb[2], hsv);
  const hueDegrees = hsv.h * 360;
  for (let band = 0; band < 8; band += 1) {
    if (u.hslHue[band] === 0 && u.hslSat[band] === 0 && u.hslLum[band] === 0) continue;
    const weight = bandWeight(hueDegrees, band);
    if (weight <= 0) continue;
    hueShift += u.hslHue[band] * weight;
    satShift += u.hslSat[band] * weight;
    lumShift += u.hslLum[band] * weight;
    total += weight;
  }
  if (total > 0) {
    hueShift /= total;
    satShift /= total;
    lumShift /= total;
    hsv.h = (hsv.h + hueShift * 0.08) % 1;
    if (hsv.h < 0) hsv.h += 1;
    hsv.s = Math.min(1, Math.max(0, hsv.s * (1 + satShift)));
    hsvToRgb(hsv, rgb);
    const scale = 1 + lumShift * 0.5;
    rgb[0] *= scale;
    rgb[1] *= scale;
    rgb[2] *= scale;
  }

  // --- colour grading -------------------------------------------------------
  const blend = Math.min(1, Math.max(0, u.gradeBlending));
  const L = Math.min(1, Math.max(0, luma(rgb[0], rgb[1], rgb[2])));
  const shadowWeight = (1 - smoothstep(0, 0.5, L)) * blend;
  const highlightWeight = smoothstep(0.5, 1, L) * blend;
  const midWeight = (1 - shadowWeight - highlightWeight) * blend;
  const wheels: Array<[[number, number, number], number]> = [
    [u.gradeShadow, shadowWeight],
    [u.gradeMidtone, midWeight],
    [u.gradeHighlight, highlightWeight],
    [u.gradeGlobal, 1],
  ];
  const tint: Hsv = { h: 0, s: 1, v: 1 };
  const tintRgb: [number, number, number] = [0, 0, 0];

  for (const [wheel, weight] of wheels) {
    if (wheel[1] <= 0 && wheel[2] === 0) continue;
    tint.h = wheel[0] / 360;
    hsvToRgb(tint, tintRgb);
    const amount = wheel[1] * weight * 0.6;
    for (let channel = 0; channel < 3; channel += 1) {
      const graded = rgb[channel] * (0.5 + tintRgb[channel]);
      rgb[channel] += (graded - rgb[channel]) * amount;
    }
    const lumScale = 1 + wheel[2] * weight * 0.5;
    rgb[0] *= lumScale;
    rgb[1] *= lumScale;
    rgb[2] *= lumScale;
  }
}

/** Radial vignette factor for a normalised position, matching the shader. */
export function vignetteFactor(
  u: DevelopUniforms,
  x: number,
  y: number,
  aspect: number,
): number {
  if (Math.abs(u.vignette) <= 0.001) return 1;
  const cx = (x - 0.5) * aspect * 2;
  const cy = (y - 0.5) * 2;
  const distance = Math.hypot(cx, cy) / Math.max(0.2, u.vignetteMidpoint * 2);
  const feather = 0.05 + (0.9 - 0.05) * u.vignetteFeather;
  const mask = smoothstep(1 - feather, 1 + feather * 0.4, distance);
  return 1 + u.vignette * mask;
}
