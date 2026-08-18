/**
 * Learning a style profile from the photographer's own work.
 *
 * Two ways to feed it, both real:
 *
 *  1. **RAW + `.xmp`** — the photographer exports metadata from Lightroom and
 *     drops the pairs in. We parse the sidecar into our adjustment model, so we
 *     know exactly what they did, to the slider.
 *  2. **Original + edited image** — we analyse both and *infer* the adjustments
 *     from the change in the measured statistics. Less precise than reading a
 *     sidecar (it cannot separate Highlights from Whites, for instance), and the
 *     UI says so, but it works for anyone who does not keep sidecars.
 *
 * Both paths end in the same place: a delta against what a neutral corrective
 * pass would have produced for that photo.
 */
import type {
  Adjustments,
  ExifData,
  PhotoAnalysis,
  ProjectSettings,
  SceneTag,
  SourceFormat,
  StyleProfile,
  StyleSample,
} from "../types";
import { clamp, round } from "../analysis/image";
import { NUMERIC_KEYS } from "./adjustments";
import { generateAdjustments } from "./engine";
import { buildProfile } from "./style";

/** Neutral settings used to compute the baseline every delta is measured from. */
const NEUTRAL_SETTINGS: ProjectSettings = {
  mode: "general",
  styleStrength: 0,
  intensity: 0.5,
  // Irrelevant here — the baseline never touches pixels — but the type demands it.
  proxyEdge: 1600,
};

export function baselineFor(
  analysis: PhotoAnalysis,
  exif: ExifData,
  format: SourceFormat,
): Adjustments {
  return generateAdjustments({
    analysis,
    exif,
    format,
    settings: NEUTRAL_SETTINGS,
  }).adjustments;
}

export interface LearnOptions {
  id: string;
  name: string;
  createdAt?: number;
  format?: SourceFormat;
  exif?: ExifData;
}

export function learnStyleProfile(
  samples: readonly StyleSample[],
  options: LearnOptions,
): StyleProfile {
  const globalDeltas: Record<string, number[]> = {};
  const sceneDeltas: Partial<Record<SceneTag, Record<string, number[]>>> = {};

  for (const sample of samples) {
    const baseline = baselineFor(sample.before, options.exif ?? {}, options.format ?? "arw");
    const bucket = (sceneDeltas[sample.scene] ??= {});

    for (const key of NUMERIC_KEYS) {
      const delta = round(sample.adjustments[key] - baseline[key], 3);
      (globalDeltas[key] ??= []).push(delta);
      (bucket[key] ??= []).push(delta);
    }
  }

  return buildProfile(
    { id: options.id, name: options.name, createdAt: options.createdAt ?? Date.now() },
    globalDeltas,
    sceneDeltas,
    samples.length,
  );
}

/**
 * Infers the adjustments that turn `before` into `after` from their measured
 * statistics.
 *
 * This is an approximation and is labelled as such wherever it is surfaced.
 * Several Lightroom sliders overlap in their effect on a histogram, so the
 * inverse problem has no unique answer; what we recover is the net tonal and
 * colour move, which is the part a style profile actually needs.
 */
export function inferAdjustments(
  before: PhotoAnalysis,
  after: PhotoAnalysis,
): Partial<Adjustments> {
  const evDelta = round(
    Math.log2(Math.max(0.01, after.tone.median) / Math.max(0.01, before.tone.median)),
    2,
  );

  // Contrast: the change in tonal spread, expressed on the -100..100 slider.
  const contrastDelta = round(
    clamp(((after.tone.stdDev - before.tone.stdDev) / Math.max(0.05, before.tone.stdDev)) * 55, -100, 100),
    0,
  );

  // Highlights and shadows: what happened at the ends beyond the global lift.
  const highlightDelta = round(
    clamp(((after.tone.p95 - before.tone.p95) - (after.tone.median - before.tone.median)) * 260, -100, 100),
    0,
  );
  const shadowDelta = round(
    clamp(((after.tone.p05 - before.tone.p05) - (after.tone.median - before.tone.median)) * 260, -100, 100),
    0,
  );
  const whitesDelta = round(clamp((after.tone.p99 - before.tone.p99) * 220, -100, 100), 0);
  const blacksDelta = round(clamp((after.tone.p01 - before.tone.p01) * 900, -100, 100), 0);

  // White balance: the change in the gray-world error, with the sign flipped —
  // a smaller measured bias means the photographer corrected in that direction.
  const temperatureDelta = round(
    clamp(before.color.temperatureBias - after.color.temperatureBias, -100, 100),
    0,
  );
  const tintDelta = round(clamp(before.color.tintBias - after.color.tintBias, -100, 100), 0);

  const saturationDelta = round(
    clamp(((after.color.saturation - before.color.saturation) / Math.max(0.05, before.color.saturation)) * 60, -100, 100),
    0,
  );

  return {
    exposure: clamp(evDelta, -5, 5),
    contrast: contrastDelta,
    highlights: highlightDelta,
    shadows: shadowDelta,
    whites: whitesDelta,
    blacks: blacksDelta,
    temperature: temperatureDelta,
    tint: tintDelta,
    vibrance: saturationDelta,
  };
}
