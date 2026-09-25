/**
 * The adjustment model: ranges, defaults, merging and clamping.
 *
 * Ranges mirror Lightroom Classic's sliders so that what the UI shows, what the
 * WebGL preview renders and what lands in the `.xmp` are the same numbers. The
 * one deliberate departure is white balance — see `temperature` below and
 * docs/XMP.md.
 */
import type {
  Adjustments,
  ColorGrade,
  HslAdjustments,
  HslBand,
  HslChannel,
} from "../types";
import { HSL_CHANNELS } from "../types";
import { clamp, round } from "../analysis/image";

export interface Range {
  min: number;
  max: number;
  step: number;
  /** Value that means "no change". */
  neutral: number;
  label: string;
  /** Decimal places used when the value is displayed. */
  decimals: number;
}

export const RANGES = {
  exposure: { min: -5, max: 5, step: 0.05, neutral: 0, label: "Exposición", decimals: 2 },
  contrast: { min: -100, max: 100, step: 1, neutral: 0, label: "Contraste", decimals: 0 },
  highlights: { min: -100, max: 100, step: 1, neutral: 0, label: "Altas luces", decimals: 0 },
  shadows: { min: -100, max: 100, step: 1, neutral: 0, label: "Sombras", decimals: 0 },
  whites: { min: -100, max: 100, step: 1, neutral: 0, label: "Blancos", decimals: 0 },
  blacks: { min: -100, max: 100, step: 1, neutral: 0, label: "Negros", decimals: 0 },
  temperature: { min: -100, max: 100, step: 1, neutral: 0, label: "Temperatura", decimals: 0 },
  tint: { min: -100, max: 100, step: 1, neutral: 0, label: "Matiz", decimals: 0 },
  vibrance: { min: -100, max: 100, step: 1, neutral: 0, label: "Intensidad", decimals: 0 },
  saturation: { min: -100, max: 100, step: 1, neutral: 0, label: "Saturación", decimals: 0 },
  texture: { min: -100, max: 100, step: 1, neutral: 0, label: "Textura", decimals: 0 },
  clarity: { min: -100, max: 100, step: 1, neutral: 0, label: "Claridad", decimals: 0 },
  dehaze: { min: -100, max: 100, step: 1, neutral: 0, label: "Neblina", decimals: 0 },
  sharpenAmount: { min: 0, max: 150, step: 1, neutral: 40, label: "Enfoque", decimals: 0 },
  sharpenRadius: { min: 0.5, max: 3, step: 0.1, neutral: 1, label: "Radio", decimals: 1 },
  sharpenDetail: { min: 0, max: 100, step: 1, neutral: 25, label: "Detalle", decimals: 0 },
  sharpenMasking: { min: 0, max: 100, step: 1, neutral: 0, label: "Máscara", decimals: 0 },
  luminanceNR: { min: 0, max: 100, step: 1, neutral: 0, label: "Ruido luminancia", decimals: 0 },
  luminanceNRDetail: { min: 0, max: 100, step: 1, neutral: 50, label: "Detalle ruido", decimals: 0 },
  colorNR: { min: 0, max: 100, step: 1, neutral: 25, label: "Ruido color", decimals: 0 },
  colorNRDetail: { min: 0, max: 100, step: 1, neutral: 50, label: "Detalle color", decimals: 0 },
  defringePurple: { min: 0, max: 20, step: 1, neutral: 0, label: "Defringe púrpura", decimals: 0 },
  defringeGreen: { min: 0, max: 20, step: 1, neutral: 0, label: "Defringe verde", decimals: 0 },
  vignetteAmount: { min: -100, max: 100, step: 1, neutral: 0, label: "Viñeta", decimals: 0 },
  vignetteMidpoint: { min: 0, max: 100, step: 1, neutral: 50, label: "Punto medio", decimals: 0 },
  vignetteFeather: { min: 0, max: 100, step: 1, neutral: 50, label: "Suavizado", decimals: 0 },
  vignetteRoundness: { min: -100, max: 100, step: 1, neutral: 0, label: "Redondez", decimals: 0 },
  straighten: { min: -45, max: 45, step: 0.1, neutral: 0, label: "Enderezar", decimals: 1 },
} as const satisfies Record<string, Range>;

export type NumericAdjustmentKey = keyof typeof RANGES;

export const NUMERIC_KEYS = Object.keys(RANGES) as NumericAdjustmentKey[];

/** The tone panel, in the order Lightroom lists it. */
export const BASIC_KEYS: NumericAdjustmentKey[] = [
  "exposure",
  "contrast",
  "highlights",
  "shadows",
  "whites",
  "blacks",
];

export const COLOR_KEYS: NumericAdjustmentKey[] = [
  "temperature",
  "tint",
  "vibrance",
  "saturation",
];

export const PRESENCE_KEYS: NumericAdjustmentKey[] = ["texture", "clarity", "dehaze"];

export const DETAIL_KEYS: NumericAdjustmentKey[] = [
  "sharpenAmount",
  "sharpenRadius",
  "sharpenDetail",
  "sharpenMasking",
  "luminanceNR",
  "colorNR",
];

function emptyBand(): HslBand {
  return {
    red: 0,
    orange: 0,
    yellow: 0,
    green: 0,
    aqua: 0,
    blue: 0,
    purple: 0,
    magenta: 0,
  };
}

export function emptyHsl(): HslAdjustments {
  return { hue: emptyBand(), saturation: emptyBand(), luminance: emptyBand() };
}

export function emptyColorGrade(): ColorGrade {
  return {
    shadowHue: 0,
    shadowSat: 0,
    shadowLum: 0,
    midtoneHue: 0,
    midtoneSat: 0,
    midtoneLum: 0,
    highlightHue: 0,
    highlightSat: 0,
    highlightLum: 0,
    globalHue: 0,
    globalSat: 0,
    globalLum: 0,
    blending: 50,
    balance: 0,
  };
}

/** A neutral starting point: Camera Raw's own defaults, nothing applied. */
export function defaultAdjustments(): Adjustments {
  return {
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    temperature: 0,
    tint: 0,
    vibrance: 0,
    saturation: 0,
    texture: 0,
    clarity: 0,
    dehaze: 0,
    sharpenAmount: 40,
    sharpenRadius: 1,
    sharpenDetail: 25,
    sharpenMasking: 0,
    luminanceNR: 0,
    luminanceNRDetail: 50,
    colorNR: 25,
    colorNRDetail: 50,
    lensProfile: false,
    autoLateralCA: false,
    defringePurple: 0,
    defringeGreen: 0,
    vignetteAmount: 0,
    vignetteMidpoint: 50,
    vignetteFeather: 50,
    vignetteRoundness: 0,
    hsl: emptyHsl(),
    colorGrade: emptyColorGrade(),
    toneCurve: [],
    crop: null,
    straighten: 0,
  };
}

export function cloneAdjustments(source: Adjustments): Adjustments {
  return {
    ...source,
    hsl: {
      hue: { ...source.hsl.hue },
      saturation: { ...source.hsl.saturation },
      luminance: { ...source.hsl.luminance },
    },
    colorGrade: { ...source.colorGrade },
    toneCurve: source.toneCurve.map((point) => ({ ...point })),
    crop: source.crop ? { ...source.crop } : null,
  };
}

/** Clamps every numeric field into its slider range and rounds for display. */
export function clampAdjustments(input: Adjustments): Adjustments {
  const out = cloneAdjustments(input);
  for (const key of NUMERIC_KEYS) {
    const range = RANGES[key];
    out[key] = round(clamp(out[key], range.min, range.max), range.decimals);
  }
  for (const band of ["hue", "saturation", "luminance"] as const) {
    for (const channel of HSL_CHANNELS) {
      out.hsl[band][channel] = Math.round(clamp(out.hsl[band][channel], -100, 100));
    }
  }
  for (const key of Object.keys(out.colorGrade) as Array<keyof ColorGrade>) {
    const isHue = key.endsWith("Hue");
    out.colorGrade[key] = Math.round(
      clamp(out.colorGrade[key], isHue ? 0 : key === "balance" ? -100 : -100, isHue ? 360 : 100),
    );
  }
  out.toneCurve = out.toneCurve
    .map((point) => ({
      x: Math.round(clamp(point.x, 0, 255)),
      y: Math.round(clamp(point.y, 0, 255)),
    }))
    .sort((a, b) => a.x - b.x);
  if (out.crop) {
    out.crop = {
      top: clamp(out.crop.top, 0, 1),
      left: clamp(out.crop.left, 0, 1),
      bottom: clamp(out.crop.bottom, 0, 1),
      right: clamp(out.crop.right, 0, 1),
      angle: round(clamp(out.crop.angle, -45, 45), 2),
    };
  }
  return out;
}

/** Layers a partial override (a manual edit) on top of generated adjustments. */
export function mergeAdjustments(
  base: Adjustments,
  overrides: Partial<Adjustments> | undefined,
): Adjustments {
  if (!overrides) return cloneAdjustments(base);
  const merged = cloneAdjustments(base);
  for (const [key, value] of Object.entries(overrides) as Array<
    [keyof Adjustments, Adjustments[keyof Adjustments]]
  >) {
    if (value === undefined) continue;
    if (key === "hsl") {
      const hsl = value as HslAdjustments;
      for (const band of ["hue", "saturation", "luminance"] as const) {
        if (hsl[band]) merged.hsl[band] = { ...merged.hsl[band], ...hsl[band] };
      }
    } else if (key === "colorGrade") {
      merged.colorGrade = { ...merged.colorGrade, ...(value as ColorGrade) };
    } else {
      // The cast is safe: we copied the key straight out of `overrides`.
      (merged as unknown as Record<string, unknown>)[key] = value;
    }
  }
  return clampAdjustments(merged);
}

/** Keys whose value differs from `reference`, used by the sync/paste tools. */
export function changedKeys(
  candidate: Adjustments,
  reference: Adjustments = defaultAdjustments(),
): NumericAdjustmentKey[] {
  return NUMERIC_KEYS.filter((key) => Math.abs(candidate[key] - reference[key]) > 1e-6);
}

/** `+0.35` / `-31` — the sign-prefixed form Lightroom uses. */
export function formatAdjustment(key: NumericAdjustmentKey, value: number): string {
  const range = RANGES[key];
  const text = value.toFixed(range.decimals);
  return value > 0 ? `+${text}` : text;
}

export function hslChannelLabel(channel: HslChannel): string {
  const labels: Record<HslChannel, string> = {
    red: "Rojo",
    orange: "Naranja",
    yellow: "Amarillo",
    green: "Verde",
    aqua: "Aguamarina",
    blue: "Azul",
    purple: "Púrpura",
    magenta: "Magenta",
  };
  return labels[channel];
}
