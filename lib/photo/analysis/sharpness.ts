/** Focus and noise estimation. */
import { type RgbaImage, lumaPlane, round } from "./image";

/**
 * Variance of the Laplacian — the standard focus measure. Higher means more
 * high-frequency detail, i.e. a sharper frame.
 *
 * Comparable only between images of the same proxy size, which is exactly how
 * we use it: within a duplicate group, all proxies are 512 px on the long edge.
 */
export function laplacianVariance(image: RgbaImage): number {
  const { width, height } = image;
  if (width < 3 || height < 3) return 0;
  const plane = lumaPlane(image);

  let sum = 0;
  let sumSquares = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const at = y * width + x;
      const value =
        4 * plane[at] -
        plane[at - 1] -
        plane[at + 1] -
        plane[at - width] -
        plane[at + width];
      sum += value;
      sumSquares += value * value;
      count += 1;
    }
  }
  if (count === 0) return 0;
  const mean = sum / count;
  return Math.max(0, sumSquares / count - mean * mean);
}

/** Laplacian variance restricted to a normalised sub-rectangle. */
export function regionLaplacianVariance(
  image: RgbaImage,
  x0: number,
  y0: number,
  w: number,
  h: number,
): number {
  const left = Math.max(1, Math.floor(x0 * image.width));
  const top = Math.max(1, Math.floor(y0 * image.height));
  const right = Math.min(image.width - 1, Math.ceil((x0 + w) * image.width));
  const bottom = Math.min(image.height - 1, Math.ceil((y0 + h) * image.height));
  if (right - left < 3 || bottom - top < 3) return 0;

  const plane = lumaPlane(image);
  let sum = 0;
  let sumSquares = 0;
  let count = 0;

  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const at = y * image.width + x;
      const value =
        4 * plane[at] -
        plane[at - 1] -
        plane[at + 1] -
        plane[at - image.width] -
        plane[at + image.width];
      sum += value;
      sumSquares += value * value;
      count += 1;
    }
  }
  if (count === 0) return 0;
  const mean = sum / count;
  return Math.max(0, sumSquares / count - mean * mean);
}

/** Maps an unbounded focus measure onto 0..1 while staying strictly monotonic. */
export function normalizeSharpness(variance: number): number {
  return round(variance / (variance + 220), 4);
}

/**
 * Immerkaer's fast noise estimator: convolve with a kernel that cancels
 * first- and second-order structure, leaving mostly noise.
 *
 * On an embedded preview the JPEG encoder and the downscale have already eaten
 * much of the grain, so the measured value under-reports. The analysis blends
 * it with the ISO reading, which is exact, and documents the mix.
 */
export function estimateNoiseSigma(image: RgbaImage): number {
  const { width, height } = image;
  if (width < 3 || height < 3) return 0;
  const plane = lumaPlane(image);
  let total = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const at = y * width + x;
      const value =
        plane[at - width - 1] -
        2 * plane[at - width] +
        plane[at - width + 1] -
        2 * plane[at - 1] +
        4 * plane[at] -
        2 * plane[at + 1] +
        plane[at + width - 1] -
        2 * plane[at + width] +
        plane[at + width + 1];
      total += Math.abs(value);
      count += 1;
    }
  }
  if (count === 0) return 0;
  return (Math.sqrt(Math.PI / 2) * total) / (6 * count);
}

/**
 * Combined noise score, 0..1.
 *
 * ISO is authoritative for how much noise the *RAW* holds; the measurement adds
 * the part that depends on exposure (a pushed shadow at ISO 800 is noisier than
 * a well-exposed ISO 800 frame).
 */
export function noiseScore(image: RgbaImage, iso: number | undefined): number {
  const measured = Math.min(1, estimateNoiseSigma(image) / 12);
  if (!iso || iso <= 0) return round(measured, 4);
  // ISO 100 -> 0, ISO 12800 -> 1, logarithmic in between.
  const fromIso = Math.min(1, Math.max(0, Math.log2(iso / 100) / 7));
  return round(0.65 * fromIso + 0.35 * measured, 4);
}
