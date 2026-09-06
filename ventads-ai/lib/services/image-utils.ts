import sharp from "sharp";

/** Self-describing mime type for a raw image buffer (avoids trusting a stale extension). */
export async function detectMimeType(buffer: Buffer): Promise<string> {
  const { format } = await sharp(buffer).metadata();
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "image/png";
  }
}

const SUPPORTED_GEMINI_ASPECT_RATIOS = [
  { ratio: "1:1", value: 1 },
  { ratio: "2:3", value: 2 / 3 },
  { ratio: "3:2", value: 3 / 2 },
  { ratio: "3:4", value: 3 / 4 },
  { ratio: "4:3", value: 4 / 3 },
  { ratio: "9:16", value: 9 / 16 },
  { ratio: "16:9", value: 16 / 9 },
  { ratio: "21:9", value: 21 / 9 },
] as const;

/**
 * Gemini's imageConfig.aspectRatio only accepts a fixed set of ratios (no
 * 4:5). Picks the closest one — the renderer still forces the exact target
 * pixel size afterwards (`applyScrimAndCopy`'s `fit: "cover"`), so this only
 * minimizes how much cropping that final step has to do.
 */
export function nearestSupportedAspectRatio(width: number, height: number): string {
  const target = width / height;
  let best: (typeof SUPPORTED_GEMINI_ASPECT_RATIOS)[number] = SUPPORTED_GEMINI_ASPECT_RATIOS[0];
  let bestDiff = Infinity;
  for (const candidate of SUPPORTED_GEMINI_ASPECT_RATIOS) {
    const diff = Math.abs(candidate.value - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = candidate;
    }
  }
  return best.ratio;
}
