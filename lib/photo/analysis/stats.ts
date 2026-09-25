/**
 * Tone and colour statistics.
 *
 * Everything here is measured, never assumed: the editing engine only ever acts
 * on numbers produced in this file, which is what keeps "AI edit" from
 * degenerating into a fixed preset.
 */
import type { ColorStats, Histogram, ToneStats } from "../types";
import { type RgbaImage, clamp, luma, rgbToHsv, round } from "./image";

/** A channel value at or above this counts as clipped in the preview. */
const CLIP_HIGH = 250;
/** All three channels at or above this means the detail is simply gone. */
const CLIP_HARD = 253;
const CLIP_LOW = 5;

export function buildHistogram(image: RgbaImage): Histogram {
  const red = new Uint32Array(256);
  const green = new Uint32Array(256);
  const blue = new Uint32Array(256);
  const lumaBins = new Uint32Array(256);
  const { data } = image;
  const samples = image.width * image.height;

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    red[r] += 1;
    green[g] += 1;
    blue[b] += 1;
    lumaBins[Math.round(luma(r, g, b))] += 1;
  }
  return { luma: lumaBins, red, green, blue, samples };
}

/** Value at `fraction` of the cumulative distribution, normalised to 0..1. */
export function percentile(bins: Uint32Array, samples: number, fraction: number): number {
  if (samples === 0) return 0;
  const target = fraction * samples;
  let cumulative = 0;
  for (let bin = 0; bin < bins.length; bin += 1) {
    cumulative += bins[bin];
    if (cumulative >= target) return bin / 255;
  }
  return 1;
}

export function computeToneStats(image: RgbaImage, histogram: Histogram): ToneStats {
  const { data, width, height } = image;
  const samples = histogram.samples || 1;

  let sum = 0;
  let sumSquares = 0;
  let highClipped = 0;
  let lowClipped = 0;
  let unrecoverable = 0;
  let centerSum = 0;
  let centerCount = 0;
  let edgeSum = 0;
  let edgeCount = 0;
  // Luma histogram restricted to pixels that are not clipped in any channel:
  // it tells us how bright the tones we can still protect actually are.
  const unclipped = new Uint32Array(256);
  let unclippedCount = 0;

  // Centre box covering the middle 40% of each axis.
  const cx0 = width * 0.3;
  const cx1 = width * 0.7;
  const cy0 = height * 0.3;
  const cy1 = height * 0.7;
  // Outer band: the first/last 15% of each axis.
  const ex = width * 0.15;
  const ey = height * 0.15;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4;
      const r = data[at];
      const g = data[at + 1];
      const b = data[at + 2];
      const value = luma(r, g, b);
      sum += value;
      sumSquares += value * value;

      const max = r > g ? (r > b ? r : b) : g > b ? g : b;
      const min = r < g ? (r < b ? r : b) : g < b ? g : b;
      if (max >= CLIP_HIGH) highClipped += 1;
      else {
        unclipped[Math.round(value)] += 1;
        unclippedCount += 1;
      }
      if (max <= CLIP_LOW) lowClipped += 1;
      if (min >= CLIP_HARD) unrecoverable += 1;

      if (x >= cx0 && x < cx1 && y >= cy0 && y < cy1) {
        centerSum += value;
        centerCount += 1;
      } else if (x < ex || x >= width - ex || y < ey || y >= height - ey) {
        edgeSum += value;
        edgeCount += 1;
      }
    }
  }

  const mean = sum / samples / 255;
  const variance = Math.max(0, sumSquares / samples - (sum / samples) ** 2);

  return {
    mean: round(mean, 4),
    median: round(percentile(histogram.luma, samples, 0.5), 4),
    p01: round(percentile(histogram.luma, samples, 0.01), 4),
    p05: round(percentile(histogram.luma, samples, 0.05), 4),
    p25: round(percentile(histogram.luma, samples, 0.25), 4),
    p75: round(percentile(histogram.luma, samples, 0.75), 4),
    p95: round(percentile(histogram.luma, samples, 0.95), 4),
    p99: round(percentile(histogram.luma, samples, 0.99), 4),
    stdDev: round(Math.sqrt(variance) / 255, 4),
    highlightReference: round(
      unclippedCount > 0 ? percentile(unclipped, unclippedCount, 0.98) : 1,
      4,
    ),
    highlightClipping: round(highClipped / samples, 5),
    shadowClipping: round(lowClipped / samples, 5),
    unrecoverableHighlights: round(unrecoverable / samples, 5),
    centerMean: round(centerCount > 0 ? centerSum / centerCount / 255 : mean, 4),
    edgeMean: round(edgeCount > 0 ? edgeSum / edgeCount / 255 : mean, 4),
  };
}

/**
 * Dark-channel prior: for haze-free outdoor images the minimum channel in a
 * local patch is close to zero, while haze lifts it. He, Sun & Tang (2009).
 */
export function darkChannel(image: RgbaImage, patch = 15): number {
  const { data, width, height } = image;
  let total = 0;
  let patches = 0;

  for (let y = 0; y < height; y += patch) {
    for (let x = 0; x < width; x += patch) {
      let min = 255;
      for (let py = y; py < Math.min(y + patch, height); py += 1) {
        for (let px = x; px < Math.min(x + patch, width); px += 1) {
          const at = (py * width + px) * 4;
          const local = Math.min(data[at], data[at + 1], data[at + 2]);
          if (local < min) min = local;
        }
      }
      total += min;
      patches += 1;
    }
  }
  return patches === 0 ? 0 : total / patches / 255;
}

/**
 * Colour statistics and a gray-world white-balance error estimate.
 *
 * Clipped and near-black pixels are excluded: a blown window or a black suit
 * carries no colour information and would otherwise drag the estimate around.
 */
export function computeColorStats(image: RgbaImage): ColorStats {
  const { data } = image;
  // Global means (all usable pixels) — kept for the returned meanR/G/B, which
  // other code uses for exposure/scene reasoning.
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let counted = 0;
  // Weighted (near-neutral) means: every usable pixel contributes to the white
  // balance in inverse proportion to its saturation. A saturated car body or a
  // blue tarp barely counts; concrete, chrome, gray panels and white walls carry
  // the estimate. This is what keeps a frame full of one colour from reading as
  // a cast and getting "corrected" the wrong way — the classic gray-world trap.
  const SAT_LIMIT = 0.55;
  let wR = 0;
  let wG = 0;
  let wB = 0;
  let wSum = 0;
  let saturationSum = 0;
  let oversaturated = 0;
  const total = image.width * image.height;

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const { s } = rgbToHsv(r, g, b);
    saturationSum += s;
    if (s > 0.85) oversaturated += 1;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max >= CLIP_HIGH || min <= CLIP_LOW) continue;
    sumR += r;
    sumG += g;
    sumB += b;
    counted += 1;

    // Weight ~1 for a near-gray pixel, fading to 0 by SAT_LIMIT. Squared so the
    // most neutral surfaces dominate.
    const nearness = 1 - Math.min(1, s / SAT_LIMIT);
    const weight = nearness * nearness;
    wR += r * weight;
    wG += g * weight;
    wB += b * weight;
    wSum += weight;
  }

  const globalMeanR = counted > 0 ? sumR / counted : 128;
  const globalMeanG = counted > 0 ? sumG / counted : 128;
  const globalMeanB = counted > 0 ? sumB / counted : 128;

  // How much near-neutral surface the frame carried, 0..1. A gray-heavy scene
  // sits near 1; a saturated, colourful frame near 0, which the engine uses to
  // hold the correction back rather than guess.
  const neutralConfidence = round(clamp(counted > 0 ? wSum / counted : 0, 0, 1), 4);

  let temperatureBias = 0;
  let tintBias = 0;
  if (wSum > 1e-3) {
    const mR = wR / wSum;
    const mG = wG / wSum;
    const mB = wB / wSum;
    const reference = Math.max(1, mG);
    // Blue-heavy neutrals => light was cool => warm the image (positive).
    const blueExcess = (mB - mR) / reference;
    // Green-heavy neutrals => need magenta => positive tint in Camera Raw terms.
    const greenExcess = (mG - (mR + mB) / 2) / reference;
    temperatureBias = round(clamp(blueExcess * 150, -100, 100), 2);
    tintBias = round(clamp(greenExcess * 170, -100, 100), 2);
  }

  return {
    meanR: round(globalMeanR / 255, 4),
    meanG: round(globalMeanG / 255, 4),
    meanB: round(globalMeanB / 255, 4),
    temperatureBias,
    tintBias,
    neutralConfidence,
    saturation: round(saturationSum / total, 4),
    oversaturated: round(oversaturated / total, 5),
    haze: round(darkChannel(image), 4),
  };
}
