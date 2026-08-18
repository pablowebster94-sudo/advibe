/**
 * XMP sidecar parsing.
 *
 * Used by "Aprender mi estilo": the photographer hands us the sidecars
 * Lightroom wrote for photos they already finished, and we recover the exact
 * slider positions they chose. That is far more precise than inferring the edit
 * from a before/after image pair.
 *
 * Written as a targeted regex reader rather than a full XML parse: an XMP packet
 * is machine-generated, the `crs` properties we want appear either as attributes
 * or as simple elements, and this keeps the module dependency-free and usable in
 * a worker.
 */
import type { Adjustments, CurvePoint, HslChannel } from "../types";
import { HSL_CHANNELS } from "../types";
import { clampAdjustments, defaultAdjustments } from "../editing/adjustments";
import { CRS_HSL_SUFFIX } from "./crs";

export interface ParsedXmp {
  adjustments: Adjustments;
  /** Property names we found but do not model, surfaced in the UI. */
  unsupported: string[];
  processVersion?: string;
  crsVersion?: string;
  whiteBalance?: string;
  /** True when the sidecar carried no crs properties at all. */
  empty: boolean;
}

function unescapeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Collects every `crs:Name` property, whether attribute or element form. */
export function extractCrsProperties(xmp: string): Map<string, string> {
  const found = new Map<string, string>();

  const attributePattern = /crs:([A-Za-z0-9_]+)\s*=\s*"([^"]*)"/g;
  for (const match of xmp.matchAll(attributePattern)) {
    found.set(match[1], unescapeXml(match[2]));
  }

  // Element form: <crs:Exposure2012>+0.35</crs:Exposure2012>
  const elementPattern = /<crs:([A-Za-z0-9_]+)>\s*([^<]*?)\s*<\/crs:\1>/g;
  for (const match of xmp.matchAll(elementPattern)) {
    if (!found.has(match[1])) found.set(match[1], unescapeXml(match[2]));
  }
  return found;
}

/** Reads a Seq container such as `crs:ToneCurvePV2012` into its `rdf:li` values. */
export function extractSequence(xmp: string, property: string): string[] {
  const pattern = new RegExp(`<crs:${property}>([\\s\\S]*?)</crs:${property}>`);
  const block = pattern.exec(xmp);
  if (!block) return [];
  return [...block[1].matchAll(/<rdf:li>\s*([^<]*?)\s*<\/rdf:li>/g)].map((match) =>
    unescapeXml(match[1]),
  );
}

function num(values: Map<string, string>, key: string): number | undefined {
  const raw = values.get(key);
  if (raw === undefined) return undefined;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function bool(values: Map<string, string>, key: string): boolean | undefined {
  const raw = values.get(key);
  if (raw === undefined) return undefined;
  return raw.toLowerCase() === "true" || raw === "1";
}

/** Properties we knowingly ignore, so they are not reported as unsupported. */
const IGNORED = new Set([
  "Version",
  "ProcessVersion",
  "HasSettings",
  "AlreadyApplied",
  "RawFileName",
  "WhiteBalance",
  "ToneCurveName2012",
  "ToneCurveName",
  "CameraProfile",
  "CameraProfileDigest",
  "LensProfileSetup",
  "LensProfileName",
  "LensProfileFilename",
  "LensProfileDigest",
  "UprightVersion",
  "AutoWhiteVersion",
  "PostCropVignetteStyle",
  "CropConstrainToWarp",
  "HasCrop",
  "ColorGradeBlending",
]);

export function parseXmp(xmp: string): ParsedXmp {
  const values = extractCrsProperties(xmp);
  const adjustments = defaultAdjustments();
  const consumed = new Set<string>(IGNORED);

  const take = (key: string): number | undefined => {
    consumed.add(key);
    return num(values, key);
  };
  const assign = (target: keyof Adjustments, key: string) => {
    const value = take(key);
    if (value !== undefined) (adjustments as unknown as Record<string, unknown>)[target] = value;
  };

  // White balance: absolute Kelvin (raw + Custom) cannot be expressed in our
  // relative model, so it is reported as unsupported rather than mangled.
  const whiteBalance = values.get("WhiteBalance");
  const incrementalTemperature = take("IncrementalTemperature");
  const incrementalTint = take("IncrementalTint");
  const absoluteTemperature = take("Temperature");
  const absoluteTint = take("Tint");

  if (incrementalTemperature !== undefined) adjustments.temperature = incrementalTemperature;
  if (incrementalTint !== undefined) adjustments.tint = incrementalTint;
  const unsupported: string[] = [];
  if (absoluteTemperature !== undefined) {
    if (Math.abs(absoluteTemperature) <= 100) {
      // Non-raw sidecar: already relative, so it maps straight across.
      if (incrementalTemperature === undefined) adjustments.temperature = absoluteTemperature;
      if (absoluteTint !== undefined && incrementalTint === undefined) {
        adjustments.tint = absoluteTint;
      }
    } else {
      unsupported.push(
        `Temperature=${absoluteTemperature}K (balance absoluto: requiere la matriz de color de la cámara)`,
      );
    }
  }

  assign("exposure", "Exposure2012");
  assign("contrast", "Contrast2012");
  assign("highlights", "Highlights2012");
  assign("shadows", "Shadows2012");
  assign("whites", "Whites2012");
  assign("blacks", "Blacks2012");
  assign("clarity", "Clarity2012");
  assign("texture", "Texture");
  assign("dehaze", "Dehaze");
  assign("vibrance", "Vibrance");
  assign("saturation", "Saturation");
  assign("sharpenAmount", "Sharpness");
  assign("sharpenRadius", "SharpenRadius");
  assign("sharpenDetail", "SharpenDetail");
  assign("sharpenMasking", "SharpenEdgeMasking");
  assign("luminanceNR", "LuminanceSmoothing");
  assign("luminanceNRDetail", "LuminanceNoiseReductionDetail");
  assign("colorNR", "ColorNoiseReduction");
  assign("colorNRDetail", "ColorNoiseReductionDetail");
  assign("defringePurple", "DefringePurpleAmount");
  assign("defringeGreen", "DefringeGreenAmount");
  assign("vignetteAmount", "PostCropVignetteAmount");
  assign("vignetteMidpoint", "PostCropVignetteMidpoint");
  assign("vignetteFeather", "PostCropVignetteFeather");
  assign("vignetteRoundness", "PostCropVignetteRoundness");

  const lensProfile = take("LensProfileEnable");
  if (lensProfile !== undefined) adjustments.lensProfile = lensProfile === 1;
  const lateralCa = take("AutoLateralCA");
  if (lateralCa !== undefined) adjustments.autoLateralCA = lateralCa === 1;

  for (const channel of HSL_CHANNELS as readonly HslChannel[]) {
    const suffix = CRS_HSL_SUFFIX[channel];
    const hue = take(`HueAdjustment${suffix}`);
    const saturation = take(`SaturationAdjustment${suffix}`);
    const luminance = take(`LuminanceAdjustment${suffix}`);
    if (hue !== undefined) adjustments.hsl.hue[channel] = hue;
    if (saturation !== undefined) adjustments.hsl.saturation[channel] = saturation;
    if (luminance !== undefined) adjustments.hsl.luminance[channel] = luminance;
  }

  const gradeMap: Array<[keyof Adjustments["colorGrade"], string]> = [
    ["shadowHue", "SplitToningShadowHue"],
    ["shadowSat", "SplitToningShadowSaturation"],
    ["highlightHue", "SplitToningHighlightHue"],
    ["highlightSat", "SplitToningHighlightSaturation"],
    ["balance", "SplitToningBalance"],
    ["midtoneHue", "ColorGradeMidtoneHue"],
    ["midtoneSat", "ColorGradeMidtoneSat"],
    ["shadowLum", "ColorGradeShadowLum"],
    ["midtoneLum", "ColorGradeMidtoneLum"],
    ["highlightLum", "ColorGradeHighlightLum"],
    ["globalHue", "ColorGradeGlobalHue"],
    ["globalSat", "ColorGradeGlobalSat"],
    ["globalLum", "ColorGradeGlobalLum"],
  ];
  for (const [field, property] of gradeMap) {
    const value = take(property);
    if (value !== undefined) adjustments.colorGrade[field] = value;
  }

  // Crop
  const hasCrop = bool(values, "HasCrop");
  const cropTop = take("CropTop");
  const cropLeft = take("CropLeft");
  const cropBottom = take("CropBottom");
  const cropRight = take("CropRight");
  const cropAngle = take("CropAngle");
  if (hasCrop && cropTop !== undefined && cropLeft !== undefined) {
    adjustments.crop = {
      top: cropTop,
      left: cropLeft,
      bottom: cropBottom ?? 1,
      right: cropRight ?? 1,
      angle: cropAngle ?? 0,
    };
  } else if (cropAngle !== undefined && cropAngle !== 0) {
    adjustments.straighten = cropAngle;
  }

  // Tone curve
  const curve = extractSequence(xmp, "ToneCurvePV2012");
  consumed.add("ToneCurvePV2012");
  if (curve.length > 0) {
    const points: CurvePoint[] = [];
    for (const entry of curve) {
      const [x, y] = entry.split(",").map((part) => Number.parseFloat(part.trim()));
      if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
    }
    const isLinear =
      points.length === 2 && points[0].x === 0 && points[0].y === 0 && points[1].x === 255 && points[1].y === 255;
    if (!isLinear) adjustments.toneCurve = points;
  }

  for (const name of values.keys()) {
    if (!consumed.has(name)) unsupported.push(name);
  }

  return {
    adjustments: clampAdjustments(adjustments),
    unsupported,
    processVersion: values.get("ProcessVersion"),
    crsVersion: values.get("Version"),
    whiteBalance,
    empty: values.size === 0,
  };
}
