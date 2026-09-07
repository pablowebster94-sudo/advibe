/**
 * The creative pass: everything that happens after the footage is already
 * display-referred Rec.709.
 *
 * Kept strictly separate from `tonemap.ts` because the two answer different
 * questions. The tone map is a *technical* transform — given this camera curve,
 * what does Rec.709 say this pixel should be. Everything in this file is taste.
 * That separation is what lets `pipeline.ts` emit a purely technical LUT, a
 * purely creative one, or the two baked together, and label which is which.
 *
 * Skin has veto power over all of it, through the same hue window the photo
 * studio's skin guard uses, so a face graded here and a face edited there agree
 * on where "natural" starts and stops.
 */
import { rgbToHsv } from "../photo/analysis/image";
import { SKIN_HUE_MAX, SKIN_HUE_MIN } from "../photo/editing/skinGuard";

export interface ToningWheel {
  /** Hue in degrees, 0..360. */
  hue: number;
  /** Strength, 0..100. */
  strength: number;
}

export interface LookOptions {
  /** -100..100. Pulls the toe up (positive) for a matte, filmic black. */
  shadowLift: number;
  /** -100..100. Global saturation. */
  saturation: number;
  /** -100..100. Saturation weighted towards colours that are still muted. */
  vibrance: number;
  /** 0..1. How much of every saturation move is withheld from skin hues. */
  skinProtection: number;
  shadowToning: ToningWheel;
  midtoneToning: ToningWheel;
  highlightToning: ToningWheel;
  /** 0..1 ceiling on HSV saturation, applied last. 1 disables the clamp. */
  saturationCeiling: number;
}

export const NEUTRAL_LOOK: LookOptions = {
  shadowLift: 0,
  saturation: 0,
  vibrance: 0,
  skinProtection: 0.7,
  shadowToning: { hue: 0, strength: 0 },
  midtoneToning: { hue: 0, strength: 0 },
  highlightToning: { hue: 0, strength: 0 },
  saturationCeiling: 0.92,
};

/** Rec.709 luma on display-referred values, 0..1. */
export function displayLuma(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * How much of a saturation move a pixel is allowed to receive, 0..1.
 *
 * Skin is not a hue with a hard edge, so the mask ramps over 6 degrees on each
 * side of the window rather than switching: a hard edge would put a visible
 * seam down the side of a face where the shading crosses the boundary.
 */
export function skinWeight(hue: number): number {
  const feather = 6;
  if (hue >= SKIN_HUE_MIN && hue <= SKIN_HUE_MAX) return 1;
  const distance =
    hue < SKIN_HUE_MIN
      ? Math.min(SKIN_HUE_MIN - hue, hue + 360 - SKIN_HUE_MAX)
      : Math.min(hue - SKIN_HUE_MAX, SKIN_HUE_MIN + 360 - hue);
  if (distance >= feather) return 0;
  const t = 1 - distance / feather;
  // Smoothstep, so the mask has no corner where it meets zero.
  return t * t * (3 - 2 * t);
}

/** Hue in degrees to a unit-length direction in the (R-Y, B-Y) chroma plane. */
function toningOffset(wheel: ToningWheel, weight: number): [number, number, number] {
  if (wheel.strength <= 0 || weight <= 0) return [0, 0, 0];
  const radians = (wheel.hue * Math.PI) / 180;
  // A colour of the requested hue at full saturation, expressed as an offset
  // that leaves luma unchanged.
  const r = 0.5 + 0.5 * Math.cos(radians);
  const g = 0.5 + 0.5 * Math.cos(radians - (2 * Math.PI) / 3);
  const b = 0.5 + 0.5 * Math.cos(radians - (4 * Math.PI) / 3);
  const mean = displayLuma(r, g, b);
  const amount = (wheel.strength / 100) * 0.22 * weight;
  return [(r - mean) * amount, (g - mean) * amount, (b - mean) * amount];
}

/**
 * Weights for the three toning wheels at a given luma.
 *
 * Overlapping raised-cosine bands rather than hard tonal ranges: the sum is
 * close to 1 everywhere, so tinting shadows and highlights in opposite
 * directions produces the expected split tone instead of a banded mess.
 */
export function tonalWeights(luma: number): {
  shadows: number;
  midtones: number;
  highlights: number;
} {
  const clamped = Math.min(Math.max(luma, 0), 1);
  const shadows = (1 - Math.min(clamped / 0.5, 1)) ** 2;
  const highlights = Math.max((clamped - 0.5) / 0.5, 0) ** 2;
  const midtones = Math.max(0, 1 - shadows - highlights);
  return { shadows, midtones, highlights };
}

/**
 * Applies the creative look to one display-referred Rec.709 pixel.
 *
 * Order matters and is fixed: lift, then toning, then saturation, then the
 * ceiling. Saturation runs after toning so that a strong tint cannot smuggle
 * saturation past the ceiling, and the ceiling runs last so nothing downstream
 * can undo it.
 */
export function applyLook(
  input: [number, number, number],
  options: LookOptions,
): [number, number, number] {
  let [r, g, b] = input;

  // --- Shadow lift ---------------------------------------------------------
  // Applied as a floor that fades out by the midtones, so a matte black does
  // not wash out the whole frame the way a straight offset would.
  if (Math.abs(options.shadowLift) > 1e-6) {
    const lift = (options.shadowLift / 100) * 0.06;
    const falloff = (value: number) => {
      const shade = Math.max(0, 1 - value / 0.35);
      return value + lift * shade * shade;
    };
    r = falloff(r);
    g = falloff(g);
    b = falloff(b);
  }

  // --- Split toning --------------------------------------------------------
  const luma = displayLuma(r, g, b);
  const weights = tonalWeights(luma);
  // A pixel at 100 IRE has no room left to carry a hue, and a tint added there
  // is a tint that clips. The offsets fade out over the last 8% of the range,
  // which is what keeps the creative pass from clipping highlights that the
  // technical transform deliberately rolled off.
  const room = whiteRoom(Math.max(r, g, b));
  // Toning is held off skin as hard as saturation is, and for a sharper reason:
  // deep skin tones live in the shadows, so a cool shadow wash lands squarely
  // on a dark face and drags its hue out of the healthy window while leaving a
  // pale face in the midtones untouched. Protecting only saturation would make
  // the look quietly worse the darker the subject's skin is.
  //
  // The guard is gated on the pixel actually being skin-coloured, not merely on
  // its hue: a neutral shadow has an arbitrary hue and must still take the tint,
  // which is the whole point of toning shadows.
  const toned = rgbToHsv(r * 255, g * 255, b * 255);
  const skinness = skinWeight(toned.h) * Math.min(toned.s / 0.15, 1);
  const toningRoom = room * (1 - options.skinProtection * skinness);
  const wheels: Array<[ToningWheel, number]> = [
    [options.shadowToning, weights.shadows],
    [options.midtoneToning, weights.midtones],
    [options.highlightToning, weights.highlights],
  ];
  for (const [wheel, weight] of wheels) {
    const [dr, dg, db] = toningOffset(wheel, weight * toningRoom);
    r += dr;
    g += dg;
    b += db;
  }

  // --- Saturation, with skin holding the veto ------------------------------
  if (Math.abs(options.saturation) > 1e-6 || Math.abs(options.vibrance) > 1e-6) {
    const grey = displayLuma(r, g, b);
    const hsv = rgbToHsv(r * 255, g * 255, b * 255);
    const protection = 1 - options.skinProtection * skinWeight(hsv.h);
    // Same reasoning as the toning fade: adding saturation to a pixel already
    // at display white can only push a channel past 1, and the only thing on
    // the other side of 1 is a clip. Negative saturation is left alone — pulling
    // a highlight back towards neutral is always safe.
    const headroom = options.saturation < 0 ? 1 : whiteRoom(Math.max(r, g, b));

    // Vibrance leans on colours that are still muted, so a saturated red does
    // not get pushed further while a pale wall finally gets some colour.
    const vibranceGain = (options.vibrance / 100) * (1 - Math.min(hsv.s, 1)) ** 2;
    const gain = 1 + (options.saturation / 100 + vibranceGain) * protection * headroom;

    r = grey + (r - grey) * gain;
    g = grey + (g - grey) * gain;
    b = grey + (b - grey) * gain;
  }

  // --- The oversaturation ceiling ------------------------------------------
  // Reds, greens and skin are where a look goes wrong first: reds bloom into a
  // single flat patch with no detail, greens go electric, skin turns orange.
  if (options.saturationCeiling < 1) {
    const hsv = rgbToHsv(r * 255, g * 255, b * 255);
    const limited = compressSaturation(hsv.s, hueSaturationCeiling(hsv.h, options.saturationCeiling));
    if (limited < hsv.s && hsv.s > 1e-6) {
      // Desaturate towards white at constant peak channel rather than towards
      // grey. HSV saturation is (max-min)/max, so shrinking every channel's
      // distance *below the brightest one* by the same factor lands the pixel
      // exactly on the target while leaving both the hue and the brightness
      // alone — pulling towards luma instead would darken a saturated blue by
      // a stop.
      const peak = Math.max(r, g, b);
      const scale = limited / hsv.s;
      r = peak - (peak - r) * scale;
      g = peak - (peak - g) * scale;
      b = peak - (peak - b) * scale;
    }
  }

  // --- Soft clip -----------------------------------------------------------
  // Saturation and vibrance can still push a bright colour past 1. Clamping
  // each channel on its own would shift its hue on the way — the classic
  // magenta sunset — so anything over the top is desaturated towards white
  // instead, which is what an overexposed highlight does anyway.
  const peak = Math.max(r, g, b);
  if (peak > 1) {
    const toWhite = 1 - 1 / peak;
    r = (r / peak) * (1 - toWhite) + toWhite;
    g = (g / peak) * (1 - toWhite) + toWhite;
    b = (b / peak) * (1 - toWhite) + toWhite;
  }

  return [r, g, b];
}

/** How much of the display range is left above a value, 1 down to 0 over the top 8%. */
export function whiteRoom(peak: number): number {
  const t = Math.min(Math.max((1 - peak) / 0.08, 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * A raised-cosine band around a hue range, with a wide feather.
 *
 * Every hue-dependent limit in this file goes through one of these rather than
 * through an `if (hue > x && hue < y)`. A hard band is invisible on a test
 * patch and obvious on real footage: a sunset, a brick wall or a wooden floor
 * runs a smooth gradient of hues straight across the boundary, and a limit that
 * switches on partway along paints a hard edge through the middle of it.
 */
function bandWeight(hue: number, from: number, to: number, feather: number): number {
  const distance =
    hue >= from && hue <= to
      ? 0
      : Math.min(
          Math.abs(((hue - from + 540) % 360) - 180),
          Math.abs(((hue - to + 540) % 360) - 180),
        );
  if (distance >= feather) return 0;
  const t = 1 - distance / feather;
  return t * t * (3 - 2 * t);
}

/**
 * Per-hue saturation limit.
 *
 * The tightening is deliberately small. Holding skin back from a strong look is
 * the job of `skinProtection`, which withholds saturation the look is *adding*;
 * this ceiling is the last-resort cap on what comes out, and if it moves far
 * between neighbouring hues it becomes its own artefact.
 */
export function hueSaturationCeiling(hue: number, base: number): number {
  const skin = skinWeight(hue);
  const red = bandWeight(hue, 345, 371, 14);
  const green = bandWeight(hue, 75, 160, 18);
  const tighten = 0.08 * skin + 0.05 * Math.max(red, green) * (1 - skin);
  return Math.max(0.2, base - tighten);
}

/**
 * Soft-knee saturation limiter: identity below the knee, asymptotic to the
 * ceiling above it, and C1 where the two meet.
 *
 * The clamp this replaces snapped anything over the limit straight down onto
 * it, which flattens every saturated colour in the frame to the same value and
 * loses the difference between a bright red and a brighter one.
 */
export function compressSaturation(saturation: number, ceiling: number): number {
  const knee = ceiling * 0.8;
  if (saturation <= knee) return saturation;
  const span = ceiling - knee;
  const u = (saturation - knee) / span;
  const power = 1.5;
  return knee + (span * u) / (1 + u ** power) ** (1 / power);
}

/** Final safety clamp. Values outside 0..1 are not representable in a .cube. */
export function clampDisplay(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}
