/**
 * The adjustment engine.
 *
 * Every number it emits is derived from a measurement taken from that specific
 * photo. There is no fixed preset anywhere in this file: the strategies supply
 * *targets and gains*, the analysis supplies the *state*, and the difference
 * between them is the adjustment. A frame that is already right therefore gets
 * zeros, which is the behaviour that matters most.
 *
 * Order of operations mirrors how a photographer works:
 *   1. exposure (whole frame, then the subject)
 *   2. highlight and shadow recovery, then the tonal endpoints
 *   3. contrast
 *   4. white balance
 *   5. colour presence
 *   6. detail (sharpening, noise)
 *   7. optics and effects
 *   8. skin guard  (can only tighten, never loosen)
 *   9. photographer's style profile
 *  10. global intensity
 */
import type {
  AdjustmentRationale,
  Adjustments,
  EditResult,
  ExifData,
  PhotoAnalysis,
  ProjectSettings,
  SourceFormat,
  StyleProfile,
} from "../types";
import { isRawFormat } from "../types";
import { clamp, round } from "../analysis/image";
import { clampAdjustments, defaultAdjustments } from "./adjustments";
import { type Strategy, STRATEGIES, refineForWedding, strategyForScene } from "./strategies";
import { applySkinGuard, subjectExposureOffset } from "./skinGuard";
import { applyStyleProfile } from "./style";

export interface EngineContext {
  analysis: PhotoAnalysis;
  exif: ExifData;
  format: SourceFormat;
  settings: ProjectSettings;
  style?: StyleProfile;
  /** Forces a strategy id, set when the photographer overrides the classifier. */
  strategyOverride?: string;
}

/**
 * Acceptance band for the white point (the top of the unclipped population) and
 * for the black point (the 1st percentile), both in 0..1 display space.
 *
 * A frame whose endpoints already fall inside these ranges is using the tonal
 * range properly and is left alone.
 */
export const WHITE_POINT_BAND: [number, number] = [0.88, 0.99];
export const BLACK_POINT_BAND: [number, number] = [0.004, 0.1];

/**
 * Signed distance from `value` to the nearest edge of `[min, max]`, or exactly
 * 0 when it already sits inside.
 *
 * This is the shape every corrective decision in the engine takes: measure,
 * compare against a range the scene is allowed to occupy, and move only as far
 * as the nearest edge. It is what keeps a correct photo untouched.
 */
export function bandCorrection(value: number, [min, max]: [number, number]): number {
  if (value < min) return min - value;
  if (value > max) return max - value;
  return 0;
}

/** Creative parameters scaled by the project's intensity control. */
const CREATIVE_KEYS = [
  "contrast",
  "vibrance",
  "saturation",
  "texture",
  "clarity",
  "vignetteAmount",
] as const;

export function pickStrategy(context: EngineContext): Strategy {
  if (context.strategyOverride && STRATEGIES[context.strategyOverride]) {
    return STRATEGIES[context.strategyOverride];
  }
  const { scene } = context.analysis;
  const base = strategyForScene(scene.primary, scene.tags);
  return context.settings.mode === "wedding"
    ? refineForWedding(base, scene.weddingCategory)
    : base;
}

export function generateAdjustments(context: EngineContext): EditResult {
  const { analysis, exif, format, settings, style } = context;
  const { tone, color, skin, exposure } = analysis;
  const strategy = pickStrategy(context);
  const raw = isRawFormat(format);

  const adjustments = defaultAdjustments();
  const rationale: AdjustmentRationale[] = [];
  const say = (key: string, value: number | boolean, reason: string) => {
    rationale.push({ key, value, reason });
  };

  // -- 1. Exposure ----------------------------------------------------------
  let ev = exposure.evOffset;
  if (ev === 0) {
    say("exposure", 0, "Exposición ya dentro de la banda correcta: no se toca.");
  } else {
    say(
      "exposure",
      ev,
      `Tono de referencia fuera de la banda: ${ev > 0 ? "+" : ""}${ev} EV para llevarlo al borde más cercano.`,
    );
  }

  const subjectEv = subjectExposureOffset(skin, tone.mean);
  if (subjectEv !== 0 && strategy.subjectWeight > 0) {
    const contribution = round(subjectEv * strategy.subjectWeight, 2);
    ev = round(ev + contribution, 2);
    say(
      "exposure",
      ev,
      `Piel a ${((skin.meanLuma ?? 0) * 100).toFixed(0)}% de luminosidad: ` +
        `${contribution > 0 ? "+" : ""}${contribution} EV extra por prioridad de sujeto (${strategy.label}).`,
    );
  }

  if (ev > 0 && strategy.midtoneBias !== 0) {
    const biased = round(Math.max(0, ev + strategy.midtoneBias), 2);
    if (biased !== ev) {
      say(
        "exposure",
        biased,
        `${strategy.label}: se recorta el levantamiento a ${biased} EV para conservar el ambiente.`,
      );
      ev = biased;
    }
  } else if (ev < 0 && strategy.midtoneBias !== 0) {
    ev = round(ev + strategy.midtoneBias, 2);
  }

  // Re-check the highlight budget now that the subject may have raised the lift.
  if (ev > 0) {
    const budget =
      Math.log2(1.06 / Math.max(0.01, tone.highlightReference)) +
      0.4 +
      (strategy.highlightGain - 1) * 0.5;
    if (ev > budget) {
      say(
        "exposure",
        round(Math.max(0, budget), 2),
        `Levantamiento limitado a ${Math.max(0, budget).toFixed(2)} EV: por encima se pierden altas luces todavía intactas.`,
      );
      ev = round(Math.max(0, budget), 2);
    }
  }
  adjustments.exposure = round(clamp(ev, -5, 5), 2);

  // -- 2. Highlights --------------------------------------------------------
  // Measured on `highlightReference` (the top of the *unclipped* population)
  // rather than on p99. Using p99 would be self-defeating: it is high precisely
  // because pixels are already dead, so a fully blown frame would get the
  // hardest recovery pull — which only turns white into grey.
  const highlightOvershoot = clamp((tone.highlightReference - 0.93) / 0.07, 0, 1);
  const clipPressure = clamp(tone.highlightClipping / 0.06, 0, 1);
  const liftPressure = Math.max(0, adjustments.exposure) * 18;

  if (highlightOvershoot > 0 || clipPressure > 0 || liftPressure > 0) {
    // Pulling highlights only helps where data survives. Where all three
    // channels are pinned, the slider just turns white into grey, so most of
    // the recovery effort is withheld.
    const recoveryValue = 0.35 + 0.65 * exposure.recoverableHighlightRatio;
    const amount =
      (highlightOvershoot * 45 + clipPressure * 35 + liftPressure) *
      strategy.highlightGain *
      recoveryValue;
    adjustments.highlights = round(-clamp(amount, 0, 100), 0);
    if (adjustments.highlights !== 0) {
      say(
        "highlights",
        adjustments.highlights,
        exposure.recoverableHighlightRatio < 0.4
          ? `Altas luces a ${adjustments.highlights}: recuperación parcial, ` +
            `${((1 - exposure.recoverableHighlightRatio) * 100).toFixed(0)}% del recorte no tiene información.`
          : `Altas luces a ${adjustments.highlights} (${strategy.label}: ganancia ${strategy.highlightGain}).`,
      );
    }
  } else {
    say("highlights", 0, "No hay altas luces en riesgo: no se recuperan.");
  }

  // -- 3. Shadows -----------------------------------------------------------
  const crushed = clamp((0.05 - tone.p05) / 0.05, 0, 1);
  const shadowDeficit = clamp((0.18 - tone.p25) / 0.18, 0, 1);
  let shadowAmount = (crushed * 30 + shadowDeficit * 35) * strategy.shadowGain;
  if (adjustments.exposure < 0) shadowAmount *= 1 + Math.min(0.5, -adjustments.exposure * 0.3);

  // Opening shadows is the fastest way to expose sensor noise.
  const noiseBrake = analysis.noise > 0.45 ? clamp(1 - (analysis.noise - 0.45) * 1.1, 0.3, 1) : 1;
  shadowAmount *= noiseBrake;
  adjustments.shadows = round(clamp(shadowAmount, 0, 100), 0);
  if (adjustments.shadows > 0) {
    say(
      "shadows",
      adjustments.shadows,
      noiseBrake < 1
        ? `Sombras +${adjustments.shadows} (limitado por ruido: ISO ${exif.iso ?? "?"}).`
        : `Sombras +${adjustments.shadows} (${strategy.label}: ganancia ${strategy.shadowGain}).`,
    );
  } else {
    say("shadows", 0, "Las sombras conservan detalle: no se abren.");
  }

  // -- 4. Endpoints ---------------------------------------------------------
  //
  // Both endpoints use acceptance bands, for the same reason exposure does. A
  // single target value would drag the white and black points of every frame to
  // the same place and clamp out at the slider limits — which is a preset with
  // extra steps, not a per-photo decision.
  const whitesTarget = bandCorrection(tone.highlightReference, WHITE_POINT_BAND);
  adjustments.whites = round(
    tone.highlightClipping >= 0.03
      ? clamp(whitesTarget * 130, -25, 0) // Already clipping: only ever pull back.
      : clamp(whitesTarget * 130, -25, 25),
    0,
  );
  if (adjustments.whites !== 0) {
    say(
      "whites",
      adjustments.whites,
      `Blancos al ${(tone.highlightReference * 100).toFixed(0)}%, fuera de la banda ` +
        `${WHITE_POINT_BAND[0] * 100}-${WHITE_POINT_BAND[1] * 100}%.`,
    );
  }

  const blacksTarget = bandCorrection(tone.p01, BLACK_POINT_BAND);
  const blacksRaw = blacksTarget * 200 * strategy.blackPointGain;
  adjustments.blacks = round(
    tone.shadowClipping > 0.08 ? clamp(blacksRaw, 0, 22) : clamp(blacksRaw, -22, 22),
    0,
  );
  if (adjustments.blacks !== 0) {
    say(
      "blacks",
      adjustments.blacks,
      tone.shadowClipping > 0.08
        ? "Negros no se cierran más: ya hay zonas sin información."
        : `Negros al ${(tone.p01 * 100).toFixed(0)}%, fuera de la banda ` +
          `${BLACK_POINT_BAND[0] * 100}-${BLACK_POINT_BAND[1] * 100}%.`,
    );
  }

  // -- 5. Contrast ----------------------------------------------------------
  //
  // Two corrections that a naive "measured minus target" formula gets wrong:
  //
  //  * The highlight and shadow moves above already flatten the image, so the
  //    contrast slider has to judge the result, not the input, or it
  //    double-counts and slams into the slider limit on every contrasty frame.
  //  * A backlit frame or a stage shot is *supposed* to have a wide tonal
  //    spread. The target is therefore a band with generous tolerance, and the
  //    correction only reaches the nearest edge.
  const recoveryFlattening =
    (Math.abs(adjustments.highlights) + adjustments.shadows) / 100 * 0.055;
  const effectiveStdDev = Math.max(0.02, tone.stdDev - recoveryFlattening);
  const contrastBand: [number, number] = [
    strategy.contrastTarget * 0.75,
    strategy.contrastTarget * 1.55,
  ];
  const contrastGap = bandCorrection(effectiveStdDev, contrastBand);
  adjustments.contrast = round(clamp((contrastGap / strategy.contrastTarget) * 45, -28, 28), 0);
  if (adjustments.contrast !== 0) {
    say(
      "contrast",
      adjustments.contrast,
      `Contraste efectivo ${(effectiveStdDev * 100).toFixed(0)}% tras la recuperación; banda ` +
        `${(contrastBand[0] * 100).toFixed(0)}-${(contrastBand[1] * 100).toFixed(0)}% para ${strategy.label}.`,
    );
  } else {
    say("contrast", 0, "El contraste ya está dentro de la banda de la escena: no se toca.");
  }

  // -- 6. White balance -----------------------------------------------------
  //
  // The bias already comes from near-neutral surfaces only (see
  // computeColorStats), so it no longer swings wild on a coloured subject. It is
  // still damped and capped conservatively, and a small deadzone means a photo
  // that is already close to neutral is left completely alone rather than nudged
  // into a faint cast. When there was no reliable neutral reference in the frame
  // (low neutralConfidence) the bias is already near zero, so this stays put.
  const WB_DEADZONE = 4;
  const wbDamping = 0.5 * strategy.whiteBalanceGain * color.neutralConfidence;
  const tempRaw = color.temperatureBias * wbDamping;
  const tintRaw = color.tintBias * wbDamping;
  adjustments.temperature =
    Math.abs(tempRaw) < WB_DEADZONE ? 0 : round(clamp(tempRaw, -45, 45), 0);
  adjustments.tint = Math.abs(tintRaw) < WB_DEADZONE ? 0 : round(clamp(tintRaw, -28, 28), 0);
  if (adjustments.temperature !== 0 || adjustments.tint !== 0) {
    say(
      "temperature",
      adjustments.temperature,
      `Dominante medida en superficies neutras ${color.temperatureBias > 0 ? "fría" : "cálida"} ` +
        `(confianza ${(color.neutralConfidence * 100).toFixed(0)}%): corrección amortiguada al ` +
        `${(wbDamping * 100).toFixed(0)}% (${strategy.label}).`,
    );
  } else if (color.neutralConfidence < 0.15) {
    say(
      "temperature",
      0,
      "Sin suficiente superficie neutra para medir el balance de blancos con fiabilidad: " +
        "se conserva el de la cámara.",
    );
  }

  // -- 7. Colour presence ---------------------------------------------------
  // A near-monochrome scene (fog, night, a white-on-white detail shot) is not a
  // saturation fault to be corrected, so the deficit term is deliberately weak
  // and the whole slider is capped well below where it starts looking artificial.
  const satDeficit = clamp((0.22 - color.saturation) / 0.22, 0, 1);
  const satExcess = clamp((color.saturation - 0.42) / 0.25, 0, 1);

  // An essentially monochrome frame has no chroma to lift, so Vibrance cannot
  // help it — all it can do is amplify the chroma noise that is there.
  const monochrome = color.saturation < 0.03;
  adjustments.vibrance = monochrome
    ? 0
    : round(clamp(strategy.baseVibrance + satDeficit * 8 - satExcess * 30, -40, 25), 0);

  if (monochrome) {
    say(
      "vibrance",
      0,
      `Escena prácticamente monocroma (saturación ${(color.saturation * 100).toFixed(1)}%): ` +
        "subir intensidad solo amplificaría el ruido de color.",
    );
  } else if (adjustments.vibrance !== 0) {
    say(
      "vibrance",
      adjustments.vibrance,
      `Saturación medida ${(color.saturation * 100).toFixed(0)}%: intensidad ${adjustments.vibrance > 0 ? "+" : ""}${adjustments.vibrance}.`,
    );
  }
  adjustments.saturation = round(clamp(strategy.baseSaturation - color.oversaturated * 60, -30, 15), 0);

  // -- 8. Presence ----------------------------------------------------------
  const flat = tone.stdDev < 0.12;
  adjustments.clarity = round(
    clamp(strategy.baseClarity + (flat ? 8 : 0) - analysis.noise * 10, -30, 40),
    0,
  );
  adjustments.texture = round(clamp(strategy.baseTexture - analysis.noise * 12, -30, 40), 0);
  // Dehaze is the most conservative decision in this file, and on purpose.
  //
  // Atmospheric haze shows up as a high dark channel plus collapsed contrast —
  // but so does a legitimately high-key scene: a white studio backdrop, a bride
  // against a bright wall, a foggy-looking-but-intentional flat grade. From
  // global statistics alone those are **not reliably separable**, and Dehaze is
  // a strong, opinionated slider that ruins a photo when applied wrongly.
  //
  // So three conditions must hold together, and even then the amount is capped
  // far below what the measurement would justify:
  //   1. high dark channel        (the veil itself)
  //   2. collapsed contrast       (what the veil does)
  //   3. the scene is outdoors    (haze is atmospheric; it does not occur in a
  //                                reception hall, so indoors it is always a
  //                                high-key scene, never fog)
  const outdoors = analysis.scene.tags.includes("outdoor");
  const veilSignals = color.haze > 0.55 && tone.stdDev < 0.17;
  if (veilSignals && outdoors) {
    adjustments.dehaze = round(clamp((color.haze - 0.55) * 110 * strategy.dehazeGain, 0, 12), 0);
    if (adjustments.dehaze > 0) {
      say(
        "dehaze",
        adjustments.dehaze,
        `Canal oscuro ${(color.haze * 100).toFixed(0)}% y contraste ${(tone.stdDev * 100).toFixed(0)}% en escena ` +
          "de exterior: coinciden las señales de velo atmosférico. Se aplica una cantidad " +
          "conservadora porque la neblina real y una escena de tono alto se miden parecido.",
      );
    }
  } else if (veilSignals) {
    say(
      "dehaze",
      0,
      `Canal oscuro alto (${(color.haze * 100).toFixed(0)}%) y contraste bajo, pero la escena es de ` +
        "interior: es tono alto, no neblina. No se aplica.",
    );
  }

  // -- 9. Detail ------------------------------------------------------------
  adjustments.sharpenAmount = round(clamp(40 + (1 - analysis.sharpness) * -10, 20, 90), 0);
  adjustments.sharpenRadius = round(clamp(analysis.noise > 0.5 ? 1.2 : 1.0, 0.5, 3), 1);
  adjustments.sharpenDetail = round(clamp(25 - analysis.noise * 15, 5, 60), 0);
  adjustments.sharpenMasking = round(clamp(20 + analysis.noise * 45 + skin.coverage * 60, 0, 85), 0);
  adjustments.luminanceNR = round(clamp((analysis.noise - 0.25) * 110, 0, 70), 0);
  adjustments.luminanceNRDetail = 50;
  adjustments.colorNR = round(clamp(25 + analysis.noise * 35, 0, 80), 0);
  adjustments.colorNRDetail = 50;
  if (adjustments.luminanceNR > 0) {
    say(
      "luminanceNR",
      adjustments.luminanceNR,
      `Ruido estimado ${(analysis.noise * 100).toFixed(0)}% (ISO ${exif.iso ?? "?"}): reducción de luminancia ${adjustments.luminanceNR}.`,
    );
  }

  // -- 10. Optics -----------------------------------------------------------
  adjustments.lensProfile = Boolean(exif.lensModel) && raw;
  adjustments.autoLateralCA = raw;
  if (adjustments.lensProfile) {
    say("lensProfile", true, `Perfil de lente activado (${exif.lensModel}); Lightroom elige el perfil.`);
  }
  const highContrastEdges = analysis.scene.tags.includes("backlit") || tone.stdDev > 0.26;
  adjustments.defringePurple = highContrastEdges ? 6 : 0;
  adjustments.defringeGreen = highContrastEdges ? 4 : 0;

  // -- 11. Vignette ---------------------------------------------------------
  adjustments.vignetteAmount = round(clamp(strategy.baseVignette, -40, 20), 0);
  adjustments.vignetteMidpoint = 50;
  adjustments.vignetteFeather = 55;

  // -- 12. Intensity --------------------------------------------------------
  //
  // Applied *before* the skin guard, never after: scaling creative parameters
  // up once the guard has capped them would silently undo the cap.
  const scaled = applyIntensity(adjustments, settings.intensity);

  // -- 13. Skin guard -------------------------------------------------------
  const guarded = applySkinGuard(scaled, skin, strategy.protectSkin);
  const withSkin = guarded.adjustments;
  rationale.push(...guarded.rationale);

  // -- 14. Style profile ----------------------------------------------------
  let final = withSkin;
  if (style && settings.styleStrength > 0) {
    const styled = applyStyleProfile(withSkin, style, analysis.scene.primary, settings.styleStrength);
    final = styled.adjustments;
    rationale.push(...styled.rationale);
    // The style may have pushed skin parameters back out of bounds; the guard
    // always gets the last word.
    const reguarded = applySkinGuard(final, skin, strategy.protectSkin);
    final = reguarded.adjustments;
    rationale.push(...reguarded.rationale);
  }

  return {
    adjustments: clampAdjustments(final),
    rationale,
    strategy: strategy.id,
    styleProfileId: style?.id,
    generatedAt: Date.now(),
  };
}

/**
 * Scales the *creative* half of the edit. Corrective parameters (exposure,
 * highlight/shadow recovery, white balance, noise reduction) are never scaled:
 * turning the look down should not reintroduce a technical fault.
 */
export function applyIntensity(input: Adjustments, intensity: number): Adjustments {
  const factor = clamp(intensity, 0, 1) * 2; // 0.5 -> 1.0 (unchanged)
  if (Math.abs(factor - 1) < 1e-6) return input;
  const out = { ...input };
  for (const key of CREATIVE_KEYS) {
    out[key] = round(out[key] * factor, 0);
  }
  return out;
}

/** Human-readable summary line for the grid, e.g. `Retrato · +0.35 EV · -31 luces`. */
export function summarizeAdjustments(result: EditResult, strategyLabel: string): string {
  const { adjustments } = result;
  const parts: string[] = [strategyLabel];
  if (adjustments.exposure !== 0) {
    parts.push(`${adjustments.exposure > 0 ? "+" : ""}${adjustments.exposure.toFixed(2)} EV`);
  }
  if (adjustments.highlights !== 0) parts.push(`${adjustments.highlights} luces`);
  if (adjustments.shadows !== 0) parts.push(`+${adjustments.shadows} sombras`);
  if (adjustments.temperature !== 0) {
    parts.push(`${adjustments.temperature > 0 ? "+" : ""}${adjustments.temperature} temp`);
  }
  return parts.join(" · ");
}
