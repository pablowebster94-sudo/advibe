/**
 * Domain types for the AdVibe AI Photo Editor.
 *
 * Everything here is transport-agnostic on purpose: the MVP runs entirely in
 * the browser (IndexedDB + Web Workers), but the same records are what a
 * future server/worker deployment would persist. See docs/ARCHITECTURE.md.
 */

// ---------------------------------------------------------------------------
// Files & formats
// ---------------------------------------------------------------------------

export type SourceFormat = "arw" | "dng" | "tiff" | "jpeg" | "png" | "unknown";

/** Formats whose pixels we never touch and for which we emit a `.xmp` sidecar. */
export const RAW_FORMATS: readonly SourceFormat[] = ["arw", "dng"] as const;

export function isRawFormat(format: SourceFormat): boolean {
  return RAW_FORMATS.includes(format);
}

// ---------------------------------------------------------------------------
// EXIF
// ---------------------------------------------------------------------------

export interface ExifData {
  make?: string;
  model?: string;
  lensModel?: string;
  /** Seconds. */
  exposureTime?: number;
  fNumber?: number;
  iso?: number;
  /** Millimetres. */
  focalLength?: number;
  focalLength35mm?: number;
  /** EXIF Flash tag; bit 0 set means the flash fired. */
  flash?: number;
  /** EXIF ExposureProgram. */
  exposureProgram?: number;
  /** EXIF MeteringMode. */
  meteringMode?: number;
  /** EXIF LightSource — our only in-band hint about as-shot white balance. */
  lightSource?: number;
  /** EXIF WhiteBalance: 0 = auto, 1 = manual. */
  whiteBalanceMode?: number;
  /** ISO 8601-ish string as stored by the camera, plus a parsed epoch. */
  dateTimeOriginal?: string;
  capturedAt?: number;
  orientation?: number;
  /** Full-resolution sensor dimensions when the file advertises them. */
  width?: number;
  height?: number;

  // --- vendor MakerNotes ---------------------------------------------------
  /** True when a MakerNote block was found and parsed at all. */
  makerNotes?: boolean;
  /**
   * As-shot colour temperature in Kelvin, read from the Sony MakerNote.
   * This is a *measured* value, unlike the EXIF LightSource estimate, and is
   * absent (not zero) when the camera was on auto white balance.
   */
  colorTemperature?: number;
  /** Sony white-balance setting, decoded to a label. */
  whiteBalanceSetting?: string;
  /** Raw Sony LensType id; the readable name comes from EXIF LensModel. */
  lensTypeId?: number;
}

export function flashFired(exif: ExifData): boolean {
  return typeof exif.flash === "number" && (exif.flash & 0x1) === 1;
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export interface Histogram {
  /** 256-bin counts. */
  luma: Uint32Array;
  red: Uint32Array;
  green: Uint32Array;
  blue: Uint32Array;
  /** Number of pixels sampled. */
  samples: number;
}

export interface ToneStats {
  /** Mean luma, 0..1. */
  mean: number;
  median: number;
  /** Percentiles of the luma distribution, 0..1. */
  p01: number;
  p05: number;
  p25: number;
  p75: number;
  p95: number;
  p99: number;
  /** Standard deviation of luma, 0..1 — our contrast proxy. */
  stdDev: number;
  /** Fraction of pixels at/above 250 in any channel. */
  highlightClipping: number;
  /** Fraction of pixels at/below 5 in every channel. */
  shadowClipping: number;
  /**
   * Fraction of pixels where *all three* channels are >= 253. Detail here is
   * physically unrecoverable — we never pretend otherwise.
   */
  unrecoverableHighlights: number;
  /**
   * Luma at the 98th percentile of the *non-clipped* pixels, 0..1. This is the
   * brightest tone we can still damage, so it is what bounds an exposure lift.
   */
  highlightReference: number;
  /** Mean luma of the centre 40% of the frame. */
  centerMean: number;
  /** Mean luma of the outer border. */
  edgeMean: number;
}

export interface ColorStats {
  /** Channel means, 0..1. */
  meanR: number;
  meanG: number;
  meanB: number;
  /**
   * Gray-world white balance error, expressed as a relative correction in the
   * app's -100..100 slider space. Positive = image is too cool, needs warming.
   */
  temperatureBias: number;
  /** Positive = image is too green, needs magenta. */
  tintBias: number;
  /** Mean HSV saturation, 0..1. */
  saturation: number;
  /** Fraction of pixels above 0.85 saturation. */
  oversaturated: number;
  /** Estimated haze level 0..1 from the dark-channel prior. */
  haze: number;
}

export interface SkinRegion {
  /** Normalised bounding box, 0..1. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Pixel count in the region relative to the whole frame. */
  area: number;
  /** Mean luma of the region, 0..1. */
  luma: number;
  /** Mean hue in degrees (0..360) — healthy skin sits near 15-30. */
  hue: number;
  /** Mean HSV saturation, 0..1. */
  saturation: number;
  /** Laplacian variance inside the region — our focus proxy. */
  sharpness: number;
  /** True when the blob's shape/position is consistent with a face. */
  faceLike: boolean;
}

export type SkinCast = "neutral" | "orange" | "magenta" | "green" | "gray" | "yellow";

export interface SkinAnalysis {
  /** Fraction of the frame classified as skin. */
  coverage: number;
  regions: SkinRegion[];
  /** Regions whose geometry makes them plausible faces. */
  faceCount: number;
  /** Mean skin luma across all regions, 0..1. Null when no skin was found. */
  meanLuma: number | null;
  meanHue: number | null;
  meanSaturation: number | null;
  cast: SkinCast;
  /** How the detector arrived at `faceCount`. */
  detector: FaceDetectorKind;
}

export type FaceDetectorKind = "native-shape-detection" | "skin-region-heuristic" | "none";

export type SceneTag =
  | "portrait"
  | "couple"
  | "group"
  | "ceremony"
  | "indoor"
  | "outdoor"
  | "reception"
  | "party"
  | "detail"
  | "night"
  | "flash"
  | "backlit";

export type WeddingCategory =
  | "preparations"
  | "ceremony"
  | "church-exit"
  | "couple"
  | "family"
  | "portraits"
  | "reception"
  | "dance"
  | "party"
  | "details"
  | "unassigned";

export interface SceneClassification {
  tags: SceneTag[];
  /** The single tag that drives the editing strategy. */
  primary: SceneTag;
  weddingCategory: WeddingCategory;
  /** 0..1 per tag, so the UI can show why a decision was made. */
  confidence: Record<string, number>;
}

export type ExposureVerdict =
  | "correct"
  | "underexposed"
  | "overexposed"
  | "clipped-highlights"
  | "crushed-shadows"
  | "high-contrast"
  | "flat";

export interface ExposureAssessment {
  verdicts: ExposureVerdict[];
  /** Suggested exposure change in EV before any style is applied. */
  evOffset: number;
  /**
   * Fraction of the blown area that still holds recoverable data. RAW files
   * carry roughly one extra stop past the preview's clipping point; anything
   * beyond that is gone and we say so.
   */
  recoverableHighlightRatio: number;
  /** Human-readable notes, already localised to Spanish. */
  notes: string[];
}

export interface PerceptualHashes {
  /** 64-bit difference hash as a hex string. */
  dHash: string;
  /** 64-bit average hash as a hex string. */
  aHash: string;
}

export interface PhotoAnalysis {
  version: number;
  analyzedAt: number;
  /** Dimensions of the proxy we analysed, not of the original. */
  proxyWidth: number;
  proxyHeight: number;
  tone: ToneStats;
  color: ColorStats;
  skin: SkinAnalysis;
  scene: SceneClassification;
  exposure: ExposureAssessment;
  hashes: PerceptualHashes;
  /** Laplacian variance over the whole frame, normalised 0..1. */
  sharpness: number;
  /** Estimated sensor noise 0..1, from ISO plus flat-area variance. */
  noise: number;
  /** Overall keeper score, 0..1. */
  quality: number;
}

export const ANALYSIS_VERSION = 1;

// ---------------------------------------------------------------------------
// Adjustments
// ---------------------------------------------------------------------------

export type HslChannel =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "aqua"
  | "blue"
  | "purple"
  | "magenta";

export const HSL_CHANNELS: readonly HslChannel[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "aqua",
  "blue",
  "purple",
  "magenta",
] as const;

export type HslBand = Record<HslChannel, number>;

export interface HslAdjustments {
  hue: HslBand;
  saturation: HslBand;
  luminance: HslBand;
}

export interface ColorGrade {
  shadowHue: number;
  shadowSat: number;
  shadowLum: number;
  midtoneHue: number;
  midtoneSat: number;
  midtoneLum: number;
  highlightHue: number;
  highlightSat: number;
  highlightLum: number;
  globalHue: number;
  globalSat: number;
  globalLum: number;
  blending: number;
  balance: number;
}

export interface CurvePoint {
  /** 0..255 input. */
  x: number;
  /** 0..255 output. */
  y: number;
}

export interface Crop {
  /** Normalised 0..1 crop rectangle in the *unrotated* frame. */
  top: number;
  left: number;
  bottom: number;
  right: number;
  /** Degrees, positive = counter-clockwise, matching Camera Raw. */
  angle: number;
}

export interface Adjustments {
  // Tone
  exposure: number; // EV, -5..+5
  contrast: number; // -100..100
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;

  // White balance, expressed as *relative* slider units (-100..100).
  // See docs/XMP.md for why this is the only representation we can map to
  // Lightroom losslessly without the camera's colour matrix.
  temperature: number;
  tint: number;

  // Presence & colour
  vibrance: number;
  saturation: number;
  texture: number;
  clarity: number;
  dehaze: number;

  // Detail
  sharpenAmount: number; // 0..150
  sharpenRadius: number; // 0.5..3.0
  sharpenDetail: number; // 0..100
  sharpenMasking: number; // 0..100
  luminanceNR: number; // 0..100
  luminanceNRDetail: number; // 0..100
  colorNR: number; // 0..100
  colorNRDetail: number; // 0..100

  // Optics
  lensProfile: boolean;
  autoLateralCA: boolean;
  defringePurple: number; // 0..20
  defringeGreen: number; // 0..20

  // Effects
  vignetteAmount: number; // -100..100
  vignetteMidpoint: number; // 0..100
  vignetteFeather: number; // 0..100
  vignetteRoundness: number; // -100..100

  hsl: HslAdjustments;
  colorGrade: ColorGrade;
  /** Parametric point curve in PV2012 space; empty means linear. */
  toneCurve: CurvePoint[];

  crop: Crop | null;
  /** Degrees of straightening applied without cropping. */
  straighten: number;
}

/** Explains, per parameter, why the engine chose the value it chose. */
export interface AdjustmentRationale {
  key: keyof Adjustments | string;
  value: number | boolean;
  reason: string;
}

export interface EditResult {
  adjustments: Adjustments;
  rationale: AdjustmentRationale[];
  /** Which strategy produced this edit. */
  strategy: string;
  /** Style profile applied, if any. */
  styleProfileId?: string;
  generatedAt: number;
}

// ---------------------------------------------------------------------------
// Photos & projects
// ---------------------------------------------------------------------------

export type PhotoStatus = "pending" | "analyzing" | "analyzed" | "edited" | "error";

export interface PhotoRecord {
  id: string;
  projectId: string;
  fileName: string;
  /** Base name without extension — used for the `.xmp` sidecar name. */
  baseName: string;
  format: SourceFormat;
  byteSize: number;
  lastModified: number;
  status: PhotoStatus;
  errorMessage?: string;
  exif: ExifData;
  analysis?: PhotoAnalysis;
  /** Adjustments generated by the engine. */
  auto?: EditResult;
  /** User overrides layered on top of `auto`. Partial by design. */
  manual?: Partial<Adjustments>;
  /** Photographer's pick flag, independent of the duplicate-group suggestion. */
  picked: boolean;
  rejected: boolean;
  /** Group id assigned by duplicate detection. */
  groupId?: string;
  addedAt: number;
  orderIndex: number;
}

export interface ProjectSettings {
  /** Wedding mode enables the wedding sub-category strategies. */
  mode: "wedding" | "general";
  styleProfileId?: string;
  /** Strength of the style profile, 0..1. */
  styleStrength: number;
  /** Global creative intent nudge applied after the corrective pass. */
  intensity: number; // 0..1, 0.5 = neutral
  /**
   * Long edge of the stored edit proxy, in pixels. It bounds both the develop
   * preview and the JPEG export, and it is the main driver of how much space a
   * project takes on the device. The `.xmp` output is unaffected — Lightroom
   * always develops the full-resolution RAW.
   */
  proxyEdge: number;
}

export interface ProjectRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  settings: ProjectSettings;
}

export interface ProjectStats {
  total: number;
  analyzed: number;
  edited: number;
  picked: number;
  errors: number;
  bytes: number;
}

// ---------------------------------------------------------------------------
// Duplicate groups
// ---------------------------------------------------------------------------

export interface DuplicateGroup {
  id: string;
  label: string;
  photoIds: string[];
  /** Photo id the engine recommends keeping. */
  suggestedId: string;
  /** Per-photo score breakdown so the UI can explain the recommendation. */
  scores: Record<string, BestShotScore>;
}

export interface BestShotScore {
  total: number;
  sharpness: number;
  exposure: number;
  faces: number;
  composition: number;
  /** Spanish, shown verbatim in the UI. */
  summary: string;
}

// ---------------------------------------------------------------------------
// Style profiles ("Mi Estilo")
// ---------------------------------------------------------------------------

export interface StyleSample {
  id: string;
  /** Name of the original file the sample was learnt from. */
  fileName: string;
  /** Analysis of the *original*, so the profile learns deltas in context. */
  before: PhotoAnalysis;
  /** Adjustments the photographer actually applied. */
  adjustments: Adjustments;
  /** Where the adjustments came from. */
  source: "xmp" | "paired-images";
  scene: SceneTag;
  addedAt: number;
}

/** A learnt bias: how the photographer deviates from the corrective baseline. */
export interface StyleBias {
  mean: number;
  /** Standard deviation across samples — high variance means low confidence. */
  stdDev: number;
  samples: number;
}

export interface StyleProfile {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  sampleCount: number;
  /** Biases keyed by adjustment name, in that parameter's own units. */
  biases: Record<string, StyleBias>;
  /** Per-scene refinements; falls back to the global bias when absent. */
  sceneBiases: Partial<Record<SceneTag, Record<string, StyleBias>>>;
  /** 0..1 — how much of the parameter space we have enough evidence for. */
  confidence: number;
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export type JobKind = "analyze" | "edit" | "group" | "export";
export type JobState = "queued" | "running" | "done" | "error" | "cancelled";

export interface JobProgress {
  total: number;
  completed: number;
  failed: number;
  /** Items per second over a rolling window. */
  rate: number;
  /** Milliseconds, null while unknown. */
  etaMs: number | null;
  bytesProcessed: number;
}
