/**
 * Full-image analysis orchestrator.
 *
 * One pass over a 512 px proxy produces every number the editing engine, the
 * duplicate grouper and the best-shot ranker need. Nothing here calls a network
 * service: see docs/AI.md for the cost breakdown and for where an external
 * vision model would actually earn its keep.
 */
import { ANALYSIS_VERSION, type ExifData, type PhotoAnalysis, isRawFormat, type SourceFormat } from "../types";
import { type RgbaImage, clamp, round } from "./image";
import { buildHistogram, computeColorStats, computeToneStats } from "./stats";
import { laplacianVariance, noiseScore, normalizeSharpness } from "./sharpness";
import { analyzeSkin } from "./skin";
import { detectFaceCount } from "./faces";
import { classifyScene, estimateSkyFraction } from "./scene";
import { assessExposure } from "./exposure";
import { computeHashes } from "./phash";

export interface AnalyzeOptions {
  exif: ExifData;
  format: SourceFormat;
  /** Overrides the face detector, used by tests. */
  faceCount?: number | null;
}

export async function analyzeImage(
  image: RgbaImage,
  options: AnalyzeOptions,
): Promise<PhotoAnalysis> {
  const { exif, format } = options;
  const histogram = buildHistogram(image);
  const tone = computeToneStats(image, histogram);
  const color = computeColorStats(image);

  const rawSharpness = laplacianVariance(image);
  const sharpness = normalizeSharpness(rawSharpness);
  const noise = noiseScore(image, exif.iso);

  const faceCount =
    options.faceCount !== undefined ? options.faceCount : await detectFaceCount(image);
  const skin = analyzeSkin(image, faceCount);

  const scene = classifyScene({
    exif,
    tone,
    color,
    skin,
    skyFraction: estimateSkyFraction(image),
    sharpness,
  });

  const exposure = assessExposure(tone, exif, isRawFormat(format));
  const hashes = computeHashes(image);

  return {
    version: ANALYSIS_VERSION,
    analyzedAt: Date.now(),
    proxyWidth: image.width,
    proxyHeight: image.height,
    tone,
    color,
    skin,
    scene,
    exposure,
    hashes,
    sharpness,
    noise,
    quality: qualityScore({ tone, sharpness, noise, exposure, skin }),
  };
}

type QualityInput = Pick<PhotoAnalysis, "tone" | "sharpness" | "noise" | "exposure" | "skin">;

/**
 * Keeper score, 0..1. Used to rank frames inside a duplicate group and to sort
 * the "best of the session" view. It is a ranking signal, never a delete
 * trigger — the photographer always decides.
 */
export function qualityScore(input: QualityInput): number {
  const { tone, sharpness, noise, exposure, skin } = input;

  // Sharpness dominates: an out-of-focus frame is unusable no matter what else
  // is right about it.
  const focus = sharpness;
  // Faces should be the sharpest thing in the frame when there are faces.
  const faceFocus =
    skin.regions.length > 0
      ? clamp(skin.regions[0].sharpness / (skin.regions[0].sharpness + 220), 0, 1)
      : focus;

  const exposureQuality = exposure.verdicts.includes("correct")
    ? 1
    : clamp(1 - Math.abs(exposure.evOffset) / 2, 0, 1);
  const clippingPenalty = clamp(tone.unrecoverableHighlights * 8, 0, 0.5);
  const noisePenalty = noise * 0.25;
  const flatPenalty = tone.stdDev < 0.06 ? 0.15 : 0;

  const score =
    0.4 * focus +
    0.2 * faceFocus +
    0.3 * exposureQuality +
    0.1 * clamp(tone.stdDev / 0.22, 0, 1) -
    clippingPenalty -
    noisePenalty -
    flatPenalty;

  return round(clamp(score, 0, 1), 4);
}
