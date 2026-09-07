/**
 * The corrective layer — the middle one, and the one that makes a LUT belong to
 * a specific clip rather than to a preset shelf.
 *
 * Three layers, and the distinction is not academic:
 *
 *   1. **Technical transform.** The camera's published curve and gamut to
 *      Rec.709. One right answer, identical for every clip shot on that
 *      profile, and nothing about the footage changes it.
 *   2. **Correction.** What *this* material needs after that conversion:
 *      exposure the operator did not nail, a white balance that drifted, a
 *      scene that came out flatter or more saturated than it should. Derived
 *      from measurements of the frames, so two clips on the same camera get
 *      two different corrections.
 *   3. **Creative look.** Taste. The same for every clip that wants that look.
 *
 * A "cinematic LUT pack" collapses all three, which is why one file flatters
 * one shot and ruins the next: the correction baked into it belongs to somebody
 * else's footage.
 *
 * Everything here is expressed as offsets on knobs the pipeline already has, so
 * the correction is a set of numbers a colourist can read, argue with and
 * override — not a hidden pass.
 */
import { clamp, round } from "../photo/analysis/image";
import { SKIN_SATURATION_CEILING } from "../photo/editing/skinGuard";
import type { ClipAnalysis } from "./analyze";

export interface CorrectionOptions {
  /** Exposure, in stops, applied in linear light. */
  exposureEv: number;
  /** White balance correction, -100..100. Positive warms. */
  warmth: number;
  /** Green/magenta correction, -100..100. Positive adds magenta. */
  tint: number;
  /** Percentage offset on the tone curve's slope. */
  contrastTrim: number;
  /** Offset on the shadow lift, -100..100. Negative closes milky blacks. */
  blackTrim: number;
  /** Offset on global saturation, -100..100. */
  saturationTrim: number;
  /** Offset on the shoulder power. Negative rolls highlights off earlier. */
  shoulderTrim: number;
}

/** One decision, with the measurement that produced it. */
export interface CorrectionNote {
  field: keyof CorrectionOptions;
  value: number;
  reason: string;
}

export const NEUTRAL_CORRECTION: CorrectionOptions = {
  exposureEv: 0,
  warmth: 0,
  tint: 0,
  contrastTrim: 0,
  blackTrim: 0,
  saturationTrim: 0,
  shoulderTrim: 0,
};

export function isNeutralCorrection(correction: CorrectionOptions): boolean {
  return (
    Math.abs(correction.exposureEv) < 1e-6 &&
    Math.abs(correction.warmth) < 1e-6 &&
    Math.abs(correction.tint) < 1e-6 &&
    Math.abs(correction.contrastTrim) < 1e-6 &&
    Math.abs(correction.blackTrim) < 1e-6 &&
    Math.abs(correction.saturationTrim) < 1e-6 &&
    Math.abs(correction.shoulderTrim) < 1e-6
  );
}

/**
 * Contrast a correctly converted scene lands in, as the standard deviation of
 * luma. Below it the material reads as flat and un-transformed; above it, as
 * already graded. The band is wide because a foggy exterior and a hard-lit
 * interior are both legitimately outside a narrow one.
 */
const CONTRAST_FLOOR = 0.16;
const CONTRAST_CEILING = 0.27;

/** Black level above which the shadows read as milky rather than as deep. */
const BLACK_CEILING = 0.035;

export interface DerivedCorrection {
  options: CorrectionOptions;
  /** Why each non-zero value is what it is, in the order decided. */
  notes: CorrectionNote[];
}

/**
 * Reads the clip and decides what it needs.
 *
 * Every branch is gated on a measurement crossing a stated threshold, and every
 * one of them carries the number that triggered it. Material that measures fine
 * gets a correction of all zeros, which is the correct answer and not a failure
 * to find something to do.
 */
export function deriveCorrection(clip: ClipAnalysis): DerivedCorrection {
  const correction: CorrectionOptions = { ...NEUTRAL_CORRECTION };
  const notes: CorrectionNote[] = [];

  // --- Exposure ------------------------------------------------------------
  // Already decided by the analysis, which weights skin over the frame average
  // when there is a face: the viewer judges exposure on the face.
  if (Math.abs(clip.exposureEv) > 0.05) {
    correction.exposureEv = round(clamp(clip.exposureEv, -2, 2), 2);
    notes.push({
      field: "exposureEv",
      value: correction.exposureEv,
      reason: clip.skinCoverage >= 0.02
        ? `La piel mide ${((clip.skinLuma ?? 0) * 100).toFixed(0)}% de luminancia tras la conversión; ` +
          `${correction.exposureEv > 0 ? "+" : ""}${correction.exposureEv} EV la lleva a su sitio y el resto del cuadro va con ella.`
        : `Sin piel medible; por distribución de tonos el material pide ` +
          `${correction.exposureEv > 0 ? "+" : ""}${correction.exposureEv} EV.`,
    });
  }

  // --- White balance -------------------------------------------------------
  //
  // Only when the frame actually contains something that ought to be neutral.
  // The grey-world trap is real: a shot filled by a red dress reads as a colour
  // cast and "correcting" it turns the dress grey. `neutralConfidence` is how
  // much neutral surface the estimate had, and the correction is scaled by it
  // rather than gated on it, so a weak reference produces a weak move.
  if (clip.neutralConfidence > 0.15) {
    const trust = Math.min(clip.neutralConfidence / 0.5, 1);
    const warmth = round(clamp(clip.temperatureBias * 0.55 * trust, -35, 35), 0);
    const tint = round(clamp(clip.tintBias * 0.5 * trust, -25, 25), 0);
    if (Math.abs(warmth) >= 2) {
      correction.warmth = warmth;
      notes.push({
        field: "warmth",
        value: warmth,
        reason:
          `Las superficies neutras del plano salen ${clip.temperatureBias > 0 ? "frías" : "cálidas"} ` +
          `(desviación ${Math.abs(clip.temperatureBias).toFixed(0)}, fiabilidad ${(clip.neutralConfidence * 100).toFixed(0)}%). ` +
          `Corrección ${warmth > 0 ? "+" : ""}${warmth} hacia ${warmth > 0 ? "cálido" : "frío"}.`,
      });
    }
    if (Math.abs(tint) >= 2) {
      correction.tint = tint;
      notes.push({
        field: "tint",
        value: tint,
        reason:
          `Dominante ${clip.tintBias > 0 ? "verde" : "magenta"} en los neutros ` +
          `(${Math.abs(clip.tintBias).toFixed(0)}). Corrección ${tint > 0 ? "+" : ""}${tint}.`,
      });
    }
  } else {
    notes.push({
      field: "warmth",
      value: 0,
      reason:
        `No hay superficie neutra fiable en cuadro (${(clip.neutralConfidence * 100).toFixed(0)}% de confianza): ` +
        "el balance queda como decisión creativa, no como corrección. Ajústalo a ojo si hace falta.",
    });
  }

  // --- Contrast ------------------------------------------------------------
  if (clip.contrast < CONTRAST_FLOOR) {
    const trim = round(clamp(((CONTRAST_FLOOR - clip.contrast) / CONTRAST_FLOOR) * 70, 0, 20), 0);
    if (trim >= 2) {
      correction.contrastTrim = trim;
      notes.push({
        field: "contrastTrim",
        value: trim,
        reason:
          `El material convertido queda plano (contraste ${(clip.contrast * 100).toFixed(0)}, ` +
          `por debajo de ${(CONTRAST_FLOOR * 100).toFixed(0)}): +${trim}% de pendiente en la curva.`,
      });
    }
  } else if (clip.contrast > CONTRAST_CEILING) {
    const trim = round(clamp(((CONTRAST_CEILING - clip.contrast) / CONTRAST_CEILING) * 70, -18, 0), 0);
    if (trim <= -2) {
      correction.contrastTrim = trim;
      notes.push({
        field: "contrastTrim",
        value: trim,
        reason:
          `El plano ya viene contrastado (${(clip.contrast * 100).toFixed(0)}): ${trim}% de pendiente ` +
          "para no cerrar más las sombras.",
      });
    }
  }

  // --- Black level ---------------------------------------------------------
  if (clip.shadowClipping > 0.02) {
    const trim = round(clamp(clip.shadowClipping * 400, 0, 22), 0);
    correction.blackTrim = trim;
    notes.push({
      field: "blackTrim",
      value: trim,
      reason:
        `${(clip.shadowClipping * 100).toFixed(1)}% del cuadro está pegado al negro. ` +
        `+${trim} de elevación abre lo que queda; lo que se recortó en cámara no vuelve.`,
    });
  } else if (clip.blackLevel > BLACK_CEILING) {
    const trim = round(clamp(((clip.blackLevel - BLACK_CEILING) / 0.05) * -25, -18, 0), 0);
    if (trim <= -2) {
      correction.blackTrim = trim;
      notes.push({
        field: "blackTrim",
        value: trim,
        reason:
          `Los negros se quedan en ${(clip.blackLevel * 100).toFixed(1)}% (lechosos, típico de ` +
          `neblina o luz parásita en el objetivo): ${trim} de elevación para asentarlos.`,
      });
    }
  }

  // --- Highlights ----------------------------------------------------------
  //
  // Detail already lost in camera does not come back, and pretending otherwise
  // with a steeper shoulder just moves the flat area around. What the shoulder
  // *can* do is stop the LUT from adding to the damage.
  if (clip.unrecoverableHighlights > 0.005) {
    const trim = round(clamp(clip.unrecoverableHighlights * -60, -1.2, 0), 2);
    if (trim <= -0.1) {
      correction.shoulderTrim = trim;
      notes.push({
        field: "shoulderTrim",
        value: trim,
        reason:
          `${(clip.unrecoverableHighlights * 100).toFixed(1)}% de altas luces sin detalle recuperable ` +
          "en el original: el hombro rueda antes para que el LUT no ensanche la zona plana.",
      });
    }
  }

  // --- Skin saturation -----------------------------------------------------
  //
  // The single most common way a converted clip looks wrong: skin that has
  // crossed into orange. A warm practical, a white balance left on daylight
  // indoors, or a camera profile with the saturation pushed all do it, and none
  // of them show up in the frame-wide saturation figure because skin is a small
  // part of the frame. The threshold is the photo studio's own — the same
  // number that decides a face has gone orange there decides it here.
  let skinTrim = 0;
  if (
    clip.skinCoverage >= 0.02 &&
    clip.skinSaturation !== null &&
    clip.skinSaturation > SKIN_SATURATION_CEILING
  ) {
    const excess = clamp((clip.skinSaturation - SKIN_SATURATION_CEILING) / 0.25, 0, 1);
    skinTrim = round(clamp(excess * -16, -16, 0), 0);
    if (skinTrim <= -2) {
      correction.saturationTrim = skinTrim;
      notes.push({
        field: "saturationTrim",
        value: skinTrim,
        reason:
          `La piel sale a ${((clip.skinSaturation ?? 0) * 100).toFixed(0)}% de saturación tras la ` +
          `conversión, por encima del ${(SKIN_SATURATION_CEILING * 100).toFixed(0)}% donde empieza a ` +
          `leerse anaranjada: ${skinTrim} de saturación global. Si además hay dominante de color, ` +
          "corrígela con el balance antes de tocar más la saturación.",
      });
    }
  }

  // --- Saturation ----------------------------------------------------------
  if (clip.oversaturated > 0.015) {
    const trim = round(clamp(clip.oversaturated * -350, -18, 0), 0);
    if (trim <= -2 && trim < skinTrim) {
      correction.saturationTrim = trim;
      notes.push({
        field: "saturationTrim",
        value: trim,
        reason:
          `${(clip.oversaturated * 100).toFixed(1)}% del cuadro pasa de 0.85 de saturación tras la ` +
          `conversión: ${trim} de saturación global antes de aplicar cualquier look.`,
      });
    }
  } else if (clip.saturation < 0.1 && skinTrim === 0) {
    // Only lift a washed-out frame when skin is not already asking for the
    // opposite: a face going orange outranks a dull background.
    const trim = round(clamp(((0.1 - clip.saturation) / 0.1) * 25, 0, 12), 0);
    if (trim >= 2) {
      correction.saturationTrim = trim;
      notes.push({
        field: "saturationTrim",
        value: trim,
        reason:
          `Color muy apagado tras la conversión (saturación media ${(clip.saturation * 100).toFixed(0)}%): ` +
          `+${trim} para recuperarlo sin tocar todavía el look.`,
      });
    }
  }

  return { options: correction, notes };
}

export const CORRECTION_LABELS: Record<keyof CorrectionOptions, string> = {
  exposureEv: "Exposición",
  warmth: "Balance de blancos",
  tint: "Matiz verde/magenta",
  contrastTrim: "Contraste",
  blackTrim: "Nivel de negro",
  saturationTrim: "Saturación",
  shoulderTrim: "Altas luces",
};

/** `+0.35 EV`, `-12`, — the form the value takes in the report. */
export function formatCorrection(field: keyof CorrectionOptions, value: number): string {
  if (field === "exposureEv") return `${value > 0 ? "+" : ""}${value.toFixed(2)} EV`;
  if (field === "shoulderTrim") return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
  return `${value > 0 ? "+" : ""}${value.toFixed(0)}`;
}
