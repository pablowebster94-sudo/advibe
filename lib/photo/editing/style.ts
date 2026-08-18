/**
 * "Mi Estilo" — learnt photographer profiles.
 *
 * The profile does NOT store slider values. It stores *deviations*: for each
 * example the photographer gives us, we compute what a neutral corrective pass
 * would have produced for that exact photo, and record how far their own edit
 * sat from it.
 *
 * That is the difference between a style and a preset. A preset says
 * "exposure +0.30". A profile says "this photographer runs about a third of a
 * stop brighter than neutral, and warmer indoors" — which still produces a
 * different number for every photo, because the neutral baseline is different
 * for every photo.
 */
import type {
  AdjustmentRationale,
  Adjustments,
  SceneTag,
  StyleBias,
  StyleProfile,
} from "../types";
import { clamp, round } from "../analysis/image";
import { NUMERIC_KEYS, type NumericAdjustmentKey, RANGES } from "./adjustments";

/** Below this many samples a per-scene bias is not trusted over the global one. */
export const MIN_SCENE_SAMPLES = 3;
/** Below this many samples overall the profile is applied at reduced strength. */
export const MIN_PROFILE_SAMPLES = 5;

export interface StyleApplication {
  adjustments: Adjustments;
  rationale: AdjustmentRationale[];
}

/**
 * How much to trust a learnt bias, 0..1.
 *
 * A photographer who always warms by +8 gets that applied in full. One whose
 * examples scatter between -20 and +25 gets almost nothing, because the scatter
 * means the choice depends on something the profile cannot see.
 */
export function biasReliability(bias: StyleBias, key: NumericAdjustmentKey): number {
  if (bias.samples < 2) return bias.samples === 1 ? 0.4 : 0;
  const range = RANGES[key];
  const span = range.max - range.min;
  // Normalise the spread against the slider's own range so EV and 0-100 sliders
  // are judged on the same scale. At 6% of the range the trust is already
  // halved: a photographer whose "warm it up" varies by a quarter of the slider
  // is not expressing a style, they are reacting to something we cannot see.
  const spread = bias.stdDev / (span * 0.06);
  const fromSpread = 1 / (1 + spread * spread);
  const fromCount = clamp(bias.samples / MIN_PROFILE_SAMPLES, 0, 1);
  return round(fromSpread * (0.45 + 0.55 * fromCount), 3);
}

/** Aggregates a list of deltas into a bias. */
export function summarizeBias(values: number[]): StyleBias {
  if (values.length === 0) return { mean: 0, stdDev: 0, samples: 0 };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length - 1);
  return {
    mean: round(mean, 3),
    stdDev: round(Math.sqrt(variance), 3),
    samples: values.length,
  };
}

/** Builds a profile record from per-parameter deltas, globally and per scene. */
export function buildProfile(
  base: Pick<StyleProfile, "id" | "name" | "createdAt">,
  globalDeltas: Record<string, number[]>,
  sceneDeltas: Partial<Record<SceneTag, Record<string, number[]>>>,
  sampleCount: number,
): StyleProfile {
  const biases: Record<string, StyleBias> = {};
  let reliabilitySum = 0;
  let reliabilityCount = 0;

  for (const key of NUMERIC_KEYS) {
    const values = globalDeltas[key];
    if (!values || values.length === 0) continue;
    const bias = summarizeBias(values);
    biases[key] = bias;
    reliabilitySum += biasReliability(bias, key);
    reliabilityCount += 1;
  }

  const sceneBiases: StyleProfile["sceneBiases"] = {};
  for (const [scene, deltas] of Object.entries(sceneDeltas) as Array<
    [SceneTag, Record<string, number[]>]
  >) {
    const perScene: Record<string, StyleBias> = {};
    for (const key of NUMERIC_KEYS) {
      const values = deltas[key];
      if (!values || values.length < MIN_SCENE_SAMPLES) continue;
      perScene[key] = summarizeBias(values);
    }
    if (Object.keys(perScene).length > 0) sceneBiases[scene] = perScene;
  }

  return {
    ...base,
    updatedAt: Date.now(),
    sampleCount,
    biases,
    sceneBiases,
    confidence: round(
      reliabilityCount === 0
        ? 0
        : (reliabilitySum / reliabilityCount) * clamp(sampleCount / MIN_PROFILE_SAMPLES, 0, 1),
      3,
    ),
  };
}

/** Picks the most specific trustworthy bias for a parameter. */
export function biasFor(
  profile: StyleProfile,
  key: NumericAdjustmentKey,
  scene: SceneTag,
): StyleBias | undefined {
  const perScene = profile.sceneBiases[scene]?.[key];
  if (perScene && perScene.samples >= MIN_SCENE_SAMPLES) return perScene;
  return profile.biases[key];
}

/**
 * Applies a profile on top of the corrective pass.
 *
 * The profile is a *starting point*, exactly as specified: it shifts the result
 * but never replaces the per-photo decision, and low-confidence parameters
 * barely move at all.
 */
export function applyStyleProfile(
  input: Adjustments,
  profile: StyleProfile,
  scene: SceneTag,
  strength: number,
): StyleApplication {
  const adjustments = { ...input };
  const rationale: AdjustmentRationale[] = [];
  const globalStrength = clamp(strength, 0, 1);
  if (globalStrength === 0 || profile.sampleCount === 0) {
    return { adjustments, rationale };
  }

  const applied: string[] = [];
  for (const key of NUMERIC_KEYS) {
    const bias = biasFor(profile, key, scene);
    if (!bias || bias.samples === 0) continue;
    const reliability = biasReliability(bias, key);
    if (reliability < 0.15) continue;

    const range = RANGES[key];
    const delta = bias.mean * reliability * globalStrength;
    if (Math.abs(delta) < range.step / 2) continue;

    adjustments[key] = round(clamp(adjustments[key] + delta, range.min, range.max), range.decimals);
    applied.push(
      `${range.label} ${delta > 0 ? "+" : ""}${delta.toFixed(range.decimals)}`,
    );
  }

  if (applied.length > 0) {
    rationale.push({
      key: "style",
      value: globalStrength,
      reason:
        `Estilo "${profile.name}" (${profile.sampleCount} ejemplos, confianza ` +
        `${(profile.confidence * 100).toFixed(0)}%): ${applied.join(", ")}.`,
    });
  }
  return { adjustments, rationale };
}
