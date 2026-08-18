/**
 * Scene classification.
 *
 * A weighted-evidence classifier over EXIF plus the measured tone/colour/skin
 * statistics. Every tag carries a confidence so the UI can show *why* a photo
 * was routed to a given editing strategy, and so the photographer can override
 * it when the classifier is wrong.
 */
import type {
  ColorStats,
  ExifData,
  SceneClassification,
  SceneTag,
  SkinAnalysis,
  ToneStats,
  WeddingCategory,
} from "../types";
import { flashFired } from "../types";
import { type RgbaImage, clamp, round } from "./image";

/**
 * Fraction of the top third of the frame that looks like open sky: bright,
 * blue-dominant and low in texture. A strong outdoor cue that survives heavy
 * white-balance drift better than absolute colour does.
 */
export function estimateSkyFraction(image: RgbaImage): number {
  const { data, width, height } = image;
  const rows = Math.max(1, Math.floor(height / 3));
  let sky = 0;
  let total = 0;

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4;
      const r = data[at];
      const g = data[at + 1];
      const b = data[at + 2];
      total += 1;
      const bright = (r + g + b) / 3 > 120;
      const blueDominant = b > r + 8 && b >= g;
      // Overcast sky is near-white rather than blue, so accept that too.
      const overcast = r > 205 && g > 205 && b > 205;
      if (bright && (blueDominant || overcast)) sky += 1;
    }
  }
  return total === 0 ? 0 : sky / total;
}

export interface SceneInputs {
  exif: ExifData;
  tone: ToneStats;
  color: ColorStats;
  skin: SkinAnalysis;
  skyFraction: number;
  sharpness: number;
}

/** Hour of day from EXIF, or null when the camera did not record a timestamp. */
function captureHour(exif: ExifData): number | null {
  if (!exif.capturedAt) return null;
  return new Date(exif.capturedAt).getHours();
}

export function classifyScene(input: SceneInputs): SceneClassification {
  const { exif, tone, color, skin, skyFraction } = input;
  const confidence: Record<string, number> = {};
  const iso = exif.iso ?? 0;
  const hour = captureHour(exif);
  const hasFlash = flashFired(exif);

  // --- Light level -------------------------------------------------------
  const isoScore = iso >= 6400 ? 1 : iso >= 3200 ? 0.75 : iso >= 1600 ? 0.45 : iso >= 800 ? 0.2 : 0;
  const darkScore = clamp((0.42 - tone.mean) / 0.32, 0, 1);
  const lateHour = hour !== null && (hour >= 20 || hour < 6) ? 0.35 : 0;
  const night = clamp(0.45 * isoScore + 0.4 * darkScore + lateHour, 0, 1);
  confidence.night = round(night, 3);

  // --- Indoor / outdoor --------------------------------------------------
  const outdoorEvidence =
    1.1 * clamp(skyFraction / 0.25, 0, 1) +
    0.5 * clamp((tone.mean - 0.35) / 0.3, 0, 1) +
    0.4 * (iso > 0 && iso <= 400 ? 1 : 0) +
    0.3 * clamp((0.25 - color.haze) / 0.25, 0, 1);
  const indoorEvidence =
    0.9 * isoScore +
    0.5 * (hasFlash ? 1 : 0) +
    0.4 * clamp(-color.temperatureBias / 40, 0, 1) + // warm cast = artificial light
    0.4 * clamp((0.2 - skyFraction) / 0.2, 0, 1);

  const outdoor = clamp(outdoorEvidence / (outdoorEvidence + indoorEvidence + 0.001), 0, 1);
  confidence.outdoor = round(outdoor, 3);
  confidence.indoor = round(1 - outdoor, 3);

  // --- Backlight ---------------------------------------------------------
  //
  // The geometric cue (bright border, darker centre) is weak on its own: a
  // subject off-centre, or a dark floor across the bottom, washes it out.
  //
  // The decisive cue, when there are people, is the *lighting ratio*: skin that
  // is markedly darker than the frame average means the light is behind the
  // subject. That is measured directly and carries most of the weight.
  const rim = tone.edgeMean - tone.centerMean;
  const geometric = clamp((rim - 0.05) / 0.2, 0, 1);
  const subjectDeficit =
    skin.meanLuma !== null && skin.coverage > 0.02
      ? clamp((tone.mean - skin.meanLuma - 0.08) / 0.2, 0, 1)
      : 0;
  const blownBackground = clamp((tone.highlightClipping - 0.01) / 0.08, 0, 1);

  const backlit =
    subjectDeficit > 0
      ? clamp(0.65 * subjectDeficit + 0.2 * geometric + 0.15 * blownBackground, 0, 1)
      : clamp(0.7 * geometric + 0.3 * blownBackground, 0, 1);
  confidence.backlit = round(backlit, 3);
  confidence.flash = hasFlash ? 1 : 0;

  // --- People ------------------------------------------------------------
  const faces = skin.faceCount;
  const largestFace = skin.regions.length > 0 ? skin.regions[0].area : 0;
  const peopleScore = clamp(skin.coverage / 0.06, 0, 1);
  confidence.portrait = round(faces === 1 || (faces === 0 && largestFace > 0.05) ? peopleScore : 0, 3);
  confidence.couple = round(faces === 2 ? Math.max(0.5, peopleScore) : 0, 3);
  confidence.group = round(faces >= 3 ? Math.max(0.6, peopleScore) : 0, 3);
  confidence.detail = round(
    skin.coverage < 0.015 && faces === 0
      ? clamp(0.4 + (exif.fNumber && exif.fNumber <= 2.8 ? 0.3 : 0) + (exif.focalLength && exif.focalLength >= 50 ? 0.2 : 0), 0, 1)
      : 0,
    3,
  );

  // --- Wedding moments ---------------------------------------------------
  const ceremony = clamp(
    (1 - outdoor) * 0.5 +
      (faces >= 2 ? 0.3 : 0) +
      (!hasFlash ? 0.2 : 0) +
      clamp(tone.stdDev / 0.3, 0, 1) * 0.2 -
      night * 0.35,
    0,
    1,
  );
  confidence.ceremony = round(ceremony, 3);

  const party = clamp(0.55 * night + 0.35 * (hasFlash ? 1 : 0) + 0.25 * clamp(color.saturation / 0.4, 0, 1), 0, 1);
  confidence.party = round(party, 3);
  confidence.reception = round(clamp((1 - outdoor) * 0.5 + night * 0.4 + (faces > 0 ? 0.2 : 0), 0, 1), 3);

  // --- Assemble ----------------------------------------------------------
  const tags: SceneTag[] = [];
  const push = (tag: SceneTag, threshold: number) => {
    if ((confidence[tag] ?? 0) >= threshold) tags.push(tag);
  };

  push("flash", 0.5);
  push("night", 0.55);
  push("backlit", 0.5);
  tags.push(outdoor >= 0.5 ? "outdoor" : "indoor");
  push("group", 0.5);
  push("couple", 0.5);
  push("portrait", 0.45);
  push("detail", 0.5);
  push("ceremony", 0.6);
  push("party", 0.6);
  push("reception", 0.6);

  // The primary tag drives the editing strategy, so it is chosen by priority,
  // not by raw confidence: subject beats context, and light beats both.
  const primary: SceneTag = (() => {
    if (confidence.group >= 0.5) return "group";
    if (confidence.couple >= 0.5) return "couple";
    if (confidence.portrait >= 0.45) return "portrait";
    if (confidence.detail >= 0.5) return "detail";
    if (confidence.night >= 0.55) return "night";
    if (confidence.backlit >= 0.5) return "backlit";
    return outdoor >= 0.5 ? "outdoor" : "indoor";
  })();

  return {
    tags: [...new Set(tags)],
    primary,
    weddingCategory: assignWeddingCategory({ confidence, exif, faces, outdoor, hasFlash, input }),
    confidence,
  };
}

function assignWeddingCategory(args: {
  confidence: Record<string, number>;
  exif: ExifData;
  faces: number;
  outdoor: number;
  hasFlash: boolean;
  input: SceneInputs;
}): WeddingCategory {
  const { confidence, exif, faces, outdoor, hasFlash, input } = args;
  const hour = captureHour(exif);
  const morning = hour !== null && hour < 13;
  const evening = hour !== null && hour >= 19;
  const slowShutter = (exif.exposureTime ?? 0) > 1 / 60 && (exif.exposureTime ?? 0) > 0;

  if (confidence.detail >= 0.5) return "details";
  if (confidence.night >= 0.55 && hasFlash && faces > 0) {
    // Motion blur plus flash plus night is the dance floor, not a portrait.
    return slowShutter || input.sharpness < 0.35 ? "dance" : "party";
  }
  if (confidence.ceremony >= 0.6 && outdoor < 0.5) return "ceremony";
  if (outdoor >= 0.5 && faces >= 4 && confidence.backlit >= 0.4) return "church-exit";
  if (faces >= 4) return "family";
  if (faces === 2) return "couple";
  if (faces === 1) return morning ? "preparations" : "portraits";
  if (evening) return "reception";
  if (morning && outdoor < 0.5) return "preparations";
  return "unassigned";
}
