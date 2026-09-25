/**
 * Skin protection.
 *
 * Runs after the corrective pass and has the final word on anything that can
 * make skin look wrong. The priority is fixed and non-negotiable:
 *
 *     natural skin  >  a striking look
 *
 * One thing this file deliberately does NOT do: force every face to the same
 * brightness. Skin tone depth is a property of the person, not an exposure
 * error. Only genuinely unusable extremes — skin buried in shadow or skin about
 * to clip — are treated as problems; everything in between is left exactly as
 * the photographer and the subject presented it.
 */
import type { AdjustmentRationale, Adjustments, SkinAnalysis } from "../types";
import { clamp, round } from "../analysis/image";

/** Hue window, in HSV degrees, where skin of any depth reads as healthy. */
export const SKIN_HUE_MIN = 11;
export const SKIN_HUE_MAX = 38;

/** Below this the face is in unusable shadow; above it, it is about to clip. */
export const SKIN_LUMA_FLOOR = 0.28;
export const SKIN_LUMA_CEILING = 0.9;

/**
 * How much darker than the frame average the skin has to be before we treat it
 * as a lighting fault rather than as the subject's own tone. Roughly half a
 * stop: below that, the difference is ordinary modelling, not backlight.
 */
export const SUBJECT_LIGHTING_DEFICIT = 0.13;

/** Above this HSV saturation the skin has crossed into orange. */
export const SKIN_SATURATION_CEILING = 0.5;
/** Below this it has gone grey/lifeless. */
export const SKIN_SATURATION_FLOOR = 0.12;

/** Skin coverage above which the strict limits apply. */
const SIGNIFICANT_COVERAGE = 0.05;

export interface SkinGuardResult {
  adjustments: Adjustments;
  rationale: AdjustmentRationale[];
}

/**
 * Exposure correction the *subject* needs, in EV, independent of the frame.
 *
 * Two separate rules, and the distinction between them is the whole reason this
 * function exists:
 *
 *  1. **Absolute** — skin below the floor or above the ceiling is unusable no
 *     matter whose skin it is, so it gets moved back into range.
 *  2. **Relative** — skin that is markedly darker than the frame average means
 *     the *lighting* put the subject in the shade, which is a fault worth
 *     fixing. This is the backlit case, and it is judged on the lighting ratio
 *     rather than on absolute brightness precisely so that deep skin tones are
 *     not mistaken for underexposure. A dark-skinned subject lit evenly with
 *     the scene gets nothing; the same subject shot against a window gets the
 *     lift, and so does a pale one.
 *
 * `frameMean` is optional so callers without it fall back to rule 1 alone.
 */
export function subjectExposureOffset(skin: SkinAnalysis, frameMean?: number): number {
  if (skin.meanLuma === null || skin.coverage < 0.01) return 0;
  const luma = skin.meanLuma;

  if (luma < SKIN_LUMA_FLOOR) {
    // Bring it to the bottom of the usable band, not to some "correct" tone.
    return round(Math.log2(0.4 / Math.max(0.02, luma)), 2);
  }
  if (luma > SKIN_LUMA_CEILING) {
    return round(Math.log2(0.82 / luma), 2);
  }

  if (frameMean !== undefined) {
    const deficit = frameMean - luma;
    if (deficit > SUBJECT_LIGHTING_DEFICIT) {
      // Close only part of the gap: fully matching the subject to the scene
      // average would blow the background that made it backlit to begin with.
      const target = luma + (deficit - SUBJECT_LIGHTING_DEFICIT) * 0.6;
      return round(clamp(Math.log2(target / luma), 0, 1.5), 2);
    }
  }
  return 0;
}

export function applySkinGuard(
  input: Adjustments,
  skin: SkinAnalysis,
  strict: boolean,
): SkinGuardResult {
  const adjustments = { ...input, hsl: { ...input.hsl, saturation: { ...input.hsl.saturation }, luminance: { ...input.hsl.luminance }, hue: { ...input.hsl.hue } } };
  const rationale: AdjustmentRationale[] = [];
  const coverage = skin.coverage;

  if (coverage < 0.01 || skin.meanHue === null || skin.meanSaturation === null) {
    return { adjustments, rationale };
  }

  const significant = coverage >= SIGNIFICANT_COVERAGE;

  // Below the significant threshold the "skin" is a scatter of warm pixels the
  // classifier is not sure about — engine-bay metal, wood, beige upholstery all
  // land in the skin gamut. Moving the whole frame's tint or saturation on that
  // evidence is exactly how a non-portrait picks up a colour cast, so nothing
  // global happens until skin occupies a real part of the frame.
  if (!significant) return { adjustments, rationale };

  const hue = skin.meanHue;
  const saturation = skin.meanSaturation;

  // --- Hue: nudge the cast back into the healthy window ---------------------
  //
  // Kept small on purpose. White balance is global, so a large move to fix one
  // face wrecks the rest of the frame; anything beyond this belongs in a local
  // adjustment, which we do not generate automatically.
  if (hue < SKIN_HUE_MIN || hue > 360 - 20) {
    const distance = hue > 180 ? 360 - hue + SKIN_HUE_MIN : SKIN_HUE_MIN - hue;
    const shift = clamp(distance * 0.8, 0, 12);
    adjustments.tint = round(adjustments.tint - shift, 0);
    rationale.push({
      key: "tint",
      value: adjustments.tint,
      reason: `Piel con tono ${hue.toFixed(0)}° (magenta): matiz -${shift.toFixed(0)} para devolverla al rango natural.`,
    });
  } else if (hue > SKIN_HUE_MAX) {
    const shift = clamp((hue - SKIN_HUE_MAX) * 0.7, 0, 12);
    adjustments.tint = round(adjustments.tint + shift, 0);
    rationale.push({
      key: "tint",
      value: adjustments.tint,
      reason: `Piel con tono ${hue.toFixed(0)}° (amarillo/verde): matiz +${shift.toFixed(0)} para devolverla al rango natural.`,
    });
  }

  // --- Saturation: the orange-skin guard ------------------------------------
  if (saturation > SKIN_SATURATION_CEILING) {
    const excess = clamp((saturation - SKIN_SATURATION_CEILING) / 0.25, 0, 1);
    const cut = Math.round(excess * 22);
    adjustments.hsl.saturation.orange = round(adjustments.hsl.saturation.orange - cut, 0);
    adjustments.hsl.saturation.red = round(adjustments.hsl.saturation.red - Math.round(cut * 0.6), 0);
    adjustments.saturation = Math.min(adjustments.saturation, 0);
    adjustments.vibrance = Math.min(adjustments.vibrance, 6);
    rationale.push({
      key: "hsl.saturation.orange",
      value: adjustments.hsl.saturation.orange,
      reason: `Piel sobresaturada (${(saturation * 100).toFixed(0)}%): naranja -${cut} para evitar el tono naranja.`,
    });
  } else if (saturation < SKIN_SATURATION_FLOOR) {
    const boost = Math.round(clamp((SKIN_SATURATION_FLOOR - saturation) / 0.1, 0, 1) * 14);
    adjustments.hsl.saturation.orange = round(adjustments.hsl.saturation.orange + boost, 0);
    rationale.push({
      key: "hsl.saturation.orange",
      value: adjustments.hsl.saturation.orange,
      reason: `Piel apagada (${(saturation * 100).toFixed(0)}%): naranja +${boost} para recuperar color sin subir la saturación global.`,
    });
  }

  // --- Global caps once skin occupies a meaningful part of the frame --------
  // A close subject is defined by how much of the frame is skin, not by whether
  // one blob happened to pass the face-geometry test: a tight portrait can be
  // cropped so hard that no single region looks face-shaped any more.
  const closeUp =
    coverage > 0.12 || skin.regions.some((region) => region.faceLike && region.area > 0.12);

  const vibranceCap = closeUp ? 12 : 18;
  if (adjustments.vibrance > vibranceCap) {
    adjustments.vibrance = vibranceCap;
    rationale.push({
      key: "vibrance",
      value: vibranceCap,
      reason: `Intensidad limitada a +${vibranceCap}: hay ${(coverage * 100).toFixed(0)}% de piel en cuadro.`,
    });
  }
  const saturationCap = closeUp ? 0 : 5;
  if (adjustments.saturation > saturationCap) {
    adjustments.saturation = saturationCap;
    rationale.push({
      key: "saturation",
      value: saturationCap,
      reason: "Saturación global limitada para no desplazar el tono de piel.",
    });
  }

  // Clarity is the classic way to give skin that harsh, over-processed look.
  const clarityCap = strict ? (closeUp ? 0 : 6) : 10;
  if (adjustments.clarity > clarityCap) {
    adjustments.clarity = clarityCap;
    rationale.push({
      key: "clarity",
      value: clarityCap,
      reason: `Claridad limitada a ${clarityCap} para no endurecer la piel.`,
    });
  }
  const textureCap = strict ? (closeUp ? 4 : 8) : 12;
  if (adjustments.texture > textureCap) {
    adjustments.texture = textureCap;
    rationale.push({
      key: "texture",
      value: textureCap,
      reason: `Textura limitada a ${textureCap} para no marcar el poro.`,
    });
  }

  // Sharpening masking keeps the sharpener on edges (eyes, lashes) and off the
  // flat areas of the face.
  const maskingFloor = closeUp ? 55 : 35;
  if (adjustments.sharpenMasking < maskingFloor) {
    adjustments.sharpenMasking = maskingFloor;
    rationale.push({
      key: "sharpenMasking",
      value: maskingFloor,
      reason: "Máscara de enfoque elevada: se enfocan bordes y ojos, no la piel.",
    });
  }

  return { adjustments, rationale };
}
