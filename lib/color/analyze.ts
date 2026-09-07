/**
 * Reading a frame of the actual footage before deciding anything.
 *
 * The order here is the point. A frame of S-Log3 fed straight to the photo
 * studio's analyser would be read as a flat, grey, desaturated, badly exposed
 * picture, because that is exactly what log looks like — and the skin classifier
 * would find no skin at all, since skin in log sits outside every chrominance
 * bound the literature defines. So the technical transform runs *first*, on a
 * proxy, and the analysis runs on the Rec.709 result. Everything the analyser
 * then reports — skin coverage, skin hue, clipping, white balance drift — means
 * what it normally means.
 *
 * The log code values are measured separately and directly, because two things
 * are only visible before the transform: whether the material is really on the
 * curve the user selected, and how far off the exposure was.
 */
import type { PhotoAnalysis } from "../photo/types";
import { analyzeImage } from "../photo/analysis/analyze";
import { type RgbaImage, clamp, round } from "../photo/analysis/image";
import { subjectExposureOffset } from "../photo/editing/skinGuard";
import { TRANSFERS, midGreyCode } from "./transfer";
import type { CameraProfile } from "./presets";
import { transformPixel, resolveTechnical } from "./pipeline";

export interface LogStats {
  /** Code value at the 1st and 99th percentile of the frame. */
  floor: number;
  ceiling: number;
  median: number;
  /** Where the selected curve puts 18% grey. */
  expectedMidGrey: number;
  /** Fraction of pixels pinned at the very top or bottom of the range. */
  clippedHigh: number;
  clippedLow: number;
}

export interface FootageAnalysis {
  log: LogStats;
  /** The photo studio's full analysis, run on the transformed frame. */
  rendered: PhotoAnalysis;
  /** Exposure correction the material appears to want, in stops. */
  suggestedExposureEv: number;
  /** How hard to hold skin, 0..1, from how much skin is actually in frame. */
  suggestedSkinProtection: number;
  /** Plain-language observations. Every one of them is backed by a measurement. */
  notes: string[];
  /** Things that suggest the declared profile does not match the material. */
  warnings: string[];
}

/** Downscales an RGBA frame so the analysis runs on a fixed budget of pixels. */
export function proxyFrame(image: RgbaImage, longEdge = 512): RgbaImage {
  const scale = Math.min(1, longEdge / Math.max(image.width, image.height));
  if (scale >= 1) return image;

  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const data = new Uint8ClampedArray(width * height * 4);
  // Box filter over the source rectangle each destination pixel covers. Point
  // sampling would alias fine detail into false "clipping" and false noise.
  const stepX = image.width / width;
  const stepY = image.height / height;
  for (let y = 0; y < height; y += 1) {
    const y0 = Math.floor(y * stepY);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * stepY));
    for (let x = 0; x < width; x += 1) {
      const x0 = Math.floor(x * stepX);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * stepX));
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let sy = y0; sy < y1 && sy < image.height; sy += 1) {
        for (let sx = x0; sx < x1 && sx < image.width; sx += 1) {
          const at = (sy * image.width + sx) * 4;
          r += image.data[at];
          g += image.data[at + 1];
          b += image.data[at + 2];
          count += 1;
        }
      }
      const at = (y * width + x) * 4;
      data[at] = r / count;
      data[at + 1] = g / count;
      data[at + 2] = b / count;
      data[at + 3] = 255;
    }
  }
  return { data, width, height };
}

function measureLog(image: RgbaImage, profile: CameraProfile): LogStats {
  const histogram = new Uint32Array(256);
  const { data } = image;
  let clippedHigh = 0;
  let clippedLow = 0;
  const pixels = image.width * image.height;

  for (let at = 0; at < data.length; at += 4) {
    // Luma on the code values themselves, not on anything linearised: this is a
    // measurement of the recording, not of the scene.
    const value = Math.round(0.2126 * data[at] + 0.7152 * data[at + 1] + 0.0722 * data[at + 2]);
    histogram[clamp(value, 0, 255)] += 1;
    if (data[at] >= 253 && data[at + 1] >= 253 && data[at + 2] >= 253) clippedHigh += 1;
    if (data[at] <= 2 && data[at + 1] <= 2 && data[at + 2] <= 2) clippedLow += 1;
  }

  const percentile = (fraction: number) => {
    const target = pixels * fraction;
    let seen = 0;
    for (let value = 0; value < 256; value += 1) {
      seen += histogram[value];
      if (seen >= target) return value / 255;
    }
    return 1;
  };

  return {
    floor: round(percentile(0.01), 4),
    ceiling: round(percentile(0.99), 4),
    median: round(percentile(0.5), 4),
    expectedMidGrey: round(midGreyCode(profile.transfer), 4),
    clippedHigh: round(clippedHigh / pixels, 4),
    clippedLow: round(clippedLow / pixels, 4),
  };
}

/** Applies the profile's technical transform to a whole frame, in place. */
export function renderFrame(image: RgbaImage, profile: CameraProfile): RgbaImage {
  const resolved = resolveTechnical(profile);
  const out = new Uint8ClampedArray(image.data.length);
  // A small memo: a 512 px proxy has ~260 000 pixels but far fewer distinct
  // 8-bit triples once the frame is graded footage rather than noise.
  const cache = new Map<number, number>();

  for (let at = 0; at < image.data.length; at += 4) {
    const key = (image.data[at] << 16) | (image.data[at + 1] << 8) | image.data[at + 2];
    let packed = cache.get(key);
    if (packed === undefined) {
      const [r, g, b] = transformPixel(
        [image.data[at] / 255, image.data[at + 1] / 255, image.data[at + 2] / 255],
        resolved,
      );
      packed =
        (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
      cache.set(key, packed);
    }
    out[at] = (packed >> 16) & 255;
    out[at + 1] = (packed >> 8) & 255;
    out[at + 2] = packed & 255;
    out[at + 3] = 255;
  }
  return { data: out, width: image.width, height: image.height };
}

export async function analyzeFootage(
  frame: RgbaImage,
  profile: CameraProfile,
): Promise<FootageAnalysis> {
  const proxy = proxyFrame(frame);
  const log = measureLog(proxy, profile);
  const rendered = await analyzeImage(renderFrame(proxy, profile), {
    exif: {},
    format: "jpeg",
  });

  const notes: string[] = [];
  const warnings: string[] = [];
  const sceneReferred = TRANSFERS[profile.transfer].kind === "scene";

  // --- Does the material match the declared profile? -----------------------
  //
  // Log recordings have a characteristic signature: a raised black floor (the
  // curve's own offset) and a compressed top end. A frame whose floor sits at
  // zero and whose top is already at 255 has a display curve baked in, whatever
  // the camera menu said.
  if (sceneReferred) {
    const expectedFloor = TRANSFERS[profile.transfer].encode(0);
    if (log.floor < expectedFloor * 0.5 && log.clippedLow > 0.02) {
      warnings.push(
        `Los negros llegan a ${(log.floor * 100).toFixed(1)}% cuando ${profile.profile} ` +
          `no debería bajar de ${(expectedFloor * 100).toFixed(1)}%. El material parece ya ` +
          "convertido a Rec.709, no log. Revisa el perfil antes de aplicar el LUT.",
      );
    }
    if (log.clippedHigh > 0.05) {
      warnings.push(
        `${(log.clippedHigh * 100).toFixed(1)}% del cuadro está al tope del rango. ` +
          "En log eso es información perdida en cámara: ningún LUT la recupera.",
      );
    }
  }

  // --- Exposure ------------------------------------------------------------
  //
  // Two independent readings. The skin one wins when there is a face, because
  // a face is what the viewer judges the exposure by; the frame one is the
  // fallback, and it is the weaker of the two on any scene with a large dark
  // or bright area.
  const skin = rendered.skin;
  const skinEv =
    skin.coverage >= 0.01 ? subjectExposureOffset(skin, rendered.tone.mean) : 0;
  const frameEv = rendered.exposure.evOffset;
  const suggestedExposureEv = round(
    clamp(skin.coverage >= 0.02 ? skinEv : frameEv, -2, 2),
    2,
  );

  if (skin.coverage >= 0.02) {
    notes.push(
      `Piel en ${(skin.coverage * 100).toFixed(0)}% del cuadro, luminancia media ` +
        `${((skin.meanLuma ?? 0) * 100).toFixed(0)}%, tono ${(skin.meanHue ?? 0).toFixed(0)}°.`,
    );
    if (suggestedExposureEv !== 0) {
      notes.push(
        `El sujeto pide ${suggestedExposureEv > 0 ? "+" : ""}${suggestedExposureEv} EV ` +
          "tras la conversión; el resto del cuadro se mueve con él.",
      );
    }
  } else if (suggestedExposureEv !== 0) {
    notes.push(
      `Sin piel medible en cuadro. Por distribución de tonos el material pide ` +
        `${suggestedExposureEv > 0 ? "+" : ""}${suggestedExposureEv} EV.`,
    );
  }

  // --- What the transform did to the highlights and shadows ----------------
  notes.push(
    `Tras la conversión: negros al ${(rendered.tone.p01 * 100).toFixed(1)}%, ` +
      `blancos al ${(rendered.tone.p99 * 100).toFixed(1)}%, contraste ` +
      `${(rendered.tone.stdDev * 100).toFixed(0)}.`,
  );
  if (rendered.tone.unrecoverableHighlights > 0.01) {
    warnings.push(
      `${(rendered.tone.unrecoverableHighlights * 100).toFixed(1)}% de altas luces sin ` +
        "detalle recuperable tras la conversión. Baja la exposición del LUT antes de subir el contraste.",
    );
  }

  // --- Colour --------------------------------------------------------------
  if (rendered.color.neutralConfidence > 0.15) {
    const { temperatureBias, tintBias } = rendered.color;
    if (Math.abs(temperatureBias) > 8 || Math.abs(tintBias) > 8) {
      notes.push(
        `Superficies neutras con desviación de ${temperatureBias > 0 ? "frío" : "cálido"} ` +
          `(${Math.abs(temperatureBias).toFixed(0)}) y ` +
          `${tintBias > 0 ? "verde" : "magenta"} (${Math.abs(tintBias).toFixed(0)}). ` +
          "Corrígelo con el balance del LUT, no con saturación.",
      );
    }
  } else {
    notes.push(
      "No hay superficie neutra fiable en el cuadro: el balance de blancos del LUT queda como decisión creativa, no como corrección.",
    );
  }
  if (rendered.color.oversaturated > 0.02) {
    warnings.push(
      `${(rendered.color.oversaturated * 100).toFixed(1)}% del cuadro ya está por encima ` +
        "de 0.85 de saturación tras la conversión. No subas saturación global.",
    );
  }

  // Skin coverage decides how hard the look is held back, on the same
  // close-up threshold the photo studio's skin guard uses.
  const suggestedSkinProtection =
    skin.coverage >= 0.12 ? 0.95 : skin.coverage >= 0.05 ? 0.85 : skin.coverage >= 0.01 ? 0.75 : 0.6;

  return {
    log,
    rendered,
    suggestedExposureEv,
    suggestedSkinProtection,
    notes,
    warnings,
  };
}
