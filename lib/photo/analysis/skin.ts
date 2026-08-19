/**
 * Skin detection and skin-tone analysis.
 *
 * This is classical computer vision, not a neural network: a chrominance-based
 * classifier followed by connected-component labelling. That choice is
 * deliberate — it runs in a worker on a mid-range Android phone in a few
 * milliseconds per frame, needs no model download, and works offline. What it
 * gives us is exactly what the editing engine needs (where the skin is, how
 * bright it is, and which way its hue is drifting).
 *
 * It is NOT identity-grade face detection. `analysis/faces.ts` documents the
 * upgrade path and wires in the browser's native detector where it exists.
 */
import type { SkinAnalysis, SkinCast, SkinRegion } from "../types";
import { type RgbaImage, clamp, luma, meanHue, rgbToHsv, round } from "./image";
import { regionLaplacianVariance } from "./sharpness";

export interface SkinMask {
  mask: Uint8Array;
  width: number;
  height: number;
  coverage: number;
}

/**
 * Per-pixel skin classification in YCbCr, with an RGB sanity check.
 *
 * Chrominance bounds follow Chai & Ngan (1999); the RGB guard follows Kovac et
 * al. (2003). Pixels are white-balance normalised first, because both rule sets
 * were derived under roughly neutral light and a heavy tungsten cast would
 * otherwise throw them off — which is precisely the situation inside a church.
 */
export function buildSkinMask(image: RgbaImage, whiteBalanceGain: [number, number, number]): SkinMask {
  const { data, width, height } = image;
  const mask = new Uint8Array(width * height);
  const [gainR, gainG, gainB] = whiteBalanceGain;
  let count = 0;

  for (let pixel = 0, at = 0; pixel < mask.length; pixel += 1, at += 4) {
    const r = clamp(data[at] * gainR, 0, 255);
    const g = clamp(data[at + 1] * gainG, 0, 255);
    const b = clamp(data[at + 2] * gainB, 0, 255);

    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    const chromaOk = cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const rgbOk = r > 60 && g > 30 && b > 15 && max - min > 10 && r > g && r >= b;
    const toneOk = y > 28 && y < 250;

    if (chromaOk && rgbOk && toneOk) {
      mask[pixel] = 1;
      count += 1;
    }
  }

  return { mask, width, height, coverage: mask.length === 0 ? 0 : count / mask.length };
}

/**
 * Gray-world gains that would neutralise the image, used to normalise the input
 * of the skin classifier. Clamped so a legitimately warm sunset does not get
 * bleached into a false negative.
 */
export function grayWorldGain(image: RgbaImage): [number, number, number] {
  const { data } = image;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let counted = 0;

  for (let at = 0; at < data.length; at += 4) {
    const r = data[at];
    const g = data[at + 1];
    const b = data[at + 2];
    if (Math.max(r, g, b) >= 250 || Math.min(r, g, b) <= 5) continue;
    sumR += r;
    sumG += g;
    sumB += b;
    counted += 1;
  }
  if (counted === 0) return [1, 1, 1];

  const meanR = sumR / counted;
  const meanG = sumG / counted;
  const meanB = sumB / counted;
  const gray = (meanR + meanG + meanB) / 3;

  return [
    clamp(gray / Math.max(1, meanR), 0.7, 1.45),
    clamp(gray / Math.max(1, meanG), 0.7, 1.45),
    clamp(gray / Math.max(1, meanB), 0.7, 1.45),
  ];
}

interface Blob {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  pixels: number;
}

/** 4-connected component labelling with an explicit stack (no recursion). */
export function labelBlobs(mask: SkinMask, minPixels: number): Blob[] {
  const { mask: bits, width, height } = mask;
  const seen = new Uint8Array(bits.length);
  const blobs: Blob[] = [];
  const stack: number[] = [];

  for (let start = 0; start < bits.length; start += 1) {
    if (bits[start] !== 1 || seen[start] === 1) continue;
    seen[start] = 1;
    stack.length = 0;
    stack.push(start);

    const blob: Blob = {
      minX: width,
      maxX: -1,
      minY: height,
      maxY: -1,
      pixels: 0,
    };

    while (stack.length > 0) {
      const index = stack.pop()!;
      const x = index % width;
      const y = (index - x) / width;
      blob.pixels += 1;
      if (x < blob.minX) blob.minX = x;
      if (x > blob.maxX) blob.maxX = x;
      if (y < blob.minY) blob.minY = y;
      if (y > blob.maxY) blob.maxY = y;

      if (x > 0 && bits[index - 1] === 1 && seen[index - 1] === 0) {
        seen[index - 1] = 1;
        stack.push(index - 1);
      }
      if (x + 1 < width && bits[index + 1] === 1 && seen[index + 1] === 0) {
        seen[index + 1] = 1;
        stack.push(index + 1);
      }
      if (y > 0 && bits[index - width] === 1 && seen[index - width] === 0) {
        seen[index - width] = 1;
        stack.push(index - width);
      }
      if (y + 1 < height && bits[index + width] === 1 && seen[index + width] === 0) {
        seen[index + width] = 1;
        stack.push(index + width);
      }
    }

    if (blob.pixels >= minPixels) blobs.push(blob);
  }

  blobs.sort((a, b) => b.pixels - a.pixels);
  return blobs;
}

/** Face-plausibility test on a blob's geometry. */
export function isFaceLike(blob: Blob, mask: SkinMask): boolean {
  const w = blob.maxX - blob.minX + 1;
  const h = blob.maxY - blob.minY + 1;
  if (w < 8 || h < 8) return false;
  const aspect = w / h;
  // Faces and head-and-shoulders crops fall comfortably inside this range;
  // an arm or a wooden pew usually does not.
  if (aspect < 0.45 || aspect > 2.1) return false;
  // A face fills most of its bounding box; a scattered false positive does not.
  const fill = blob.pixels / (w * h);
  if (fill < 0.42) return false;
  const relativeArea = blob.pixels / (mask.width * mask.height);
  // The upper bound has to accommodate a genuinely tight head-and-shoulders
  // crop, where skin legitimately fills most of the frame.
  return relativeArea >= 0.0015 && relativeArea <= 0.6;
}

function classifyCast(hue: number | null, saturation: number | null): SkinCast {
  if (hue === null || saturation === null) return "neutral";
  if (saturation < 0.09) return "gray";
  if (saturation > 0.56) return "orange";
  if (hue >= 330 || hue < 10) return "magenta";
  if (hue >= 48 && hue < 70) return "yellow";
  if (hue >= 70 && hue < 170) return "green";
  return "neutral";
}

export function analyzeSkin(image: RgbaImage, nativeFaceCount: number | null): SkinAnalysis {
  const gain = grayWorldGain(image);
  const mask = buildSkinMask(image, gain);
  const minPixels = Math.max(24, Math.round(mask.width * mask.height * 0.0012));
  const blobs = labelBlobs(mask, minPixels);

  const regions: SkinRegion[] = [];
  const allHues: number[] = [];
  let lumaSum = 0;
  let saturationSum = 0;
  let samples = 0;

  for (const blob of blobs.slice(0, 12)) {
    const w = blob.maxX - blob.minX + 1;
    const h = blob.maxY - blob.minY + 1;
    const hues: number[] = [];
    let regionLuma = 0;
    let regionSaturation = 0;
    let regionCount = 0;

    for (let y = blob.minY; y <= blob.maxY; y += 1) {
      for (let x = blob.minX; x <= blob.maxX; x += 1) {
        const pixel = y * mask.width + x;
        if (mask.mask[pixel] !== 1) continue;
        const at = pixel * 4;
        const r = image.data[at];
        const g = image.data[at + 1];
        const b = image.data[at + 2];
        const hsv = rgbToHsv(r, g, b);
        hues.push(hsv.h);
        regionSaturation += hsv.s;
        regionLuma += luma(r, g, b);
        regionCount += 1;
      }
    }
    if (regionCount === 0) continue;

    const normX = blob.minX / mask.width;
    const normY = blob.minY / mask.height;
    const normW = w / mask.width;
    const normH = h / mask.height;

    regions.push({
      x: round(normX, 4),
      y: round(normY, 4),
      w: round(normW, 4),
      h: round(normH, 4),
      area: round(blob.pixels / (mask.width * mask.height), 5),
      luma: round(regionLuma / regionCount / 255, 4),
      hue: round(meanHue(hues), 2),
      saturation: round(regionSaturation / regionCount, 4),
      sharpness: round(regionLaplacianVariance(image, normX, normY, normW, normH), 2),
      faceLike: isFaceLike(blob, mask),
    });

    allHues.push(...hues);
    lumaSum += regionLuma;
    saturationSum += regionSaturation;
    samples += regionCount;
  }

  const heuristicFaces = regions.filter((region) => region.faceLike).length;
  const hasSkin = samples > 0;
  const overallHue = hasSkin ? round(meanHue(allHues), 2) : null;
  const overallSaturation = hasSkin ? round(saturationSum / samples, 4) : null;

  return {
    coverage: round(mask.coverage, 5),
    regions,
    faceCount: nativeFaceCount !== null ? nativeFaceCount : heuristicFaces,
    meanLuma: hasSkin ? round(lumaSum / samples / 255, 4) : null,
    meanHue: overallHue,
    meanSaturation: overallSaturation,
    cast: classifyCast(overallHue, overallSaturation),
    detector:
      nativeFaceCount !== null
        ? "native-shape-detection"
        : hasSkin
          ? "skin-region-heuristic"
          : "none",
  };
}
