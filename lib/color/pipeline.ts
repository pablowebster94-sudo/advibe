/**
 * Turning a shot description into a `.cube` file.
 *
 * The whole module exists to keep four things apart that a single "cinematic
 * LUT" download normally smears together:
 *
 *   - the **technical transform** — the camera's log curve and gamut to
 *     Rec.709. There is one right answer and it comes from the manufacturer's
 *     published curve.
 *   - the **tone rendering** — how eleven stops get into a two-and-a-half stop
 *     display without clipping. Judgement, but constrained judgement.
 *   - the **correction** — what this particular clip needs, measured off its
 *     own frames. See `correction.ts`.
 *   - the **creative look** — taste, and the only part that should ever be
 *     dialled back on the intensity slider.
 *
 * `LutSpec.technicalOnly` emits the transform and the rendering alone; adding
 * `skipLook` keeps the correction and drops the taste. Those are the LUTs you
 * put *under* a grade, and neither is the same file as the one you put on top.
 */
import { applyMatrix, gamutMatrix, type Matrix3 } from "./gamut";
import { TRANSFERS, headroomStops, midGreyCode, type TransferId } from "./transfer";
import { GAMUT_LABELS, type GamutId } from "./gamut";
import {
  NEUTRAL_TONE_CURVE,
  applyOptionalMatrix,
  compressGamut,
  creativeWhiteBalance,
  renderToDisplay,
  toneCurve,
  toneCurveInverse,
  type ToneCurveOptions,
} from "./tonemap";
import { NEUTRAL_LOOK, applyLook, clampDisplay, type LookOptions } from "./look";
import {
  createCube,
  nodeOffset,
  sampleCube,
  serializeCube,
  validateCube,
  type Cube,
  type CubeValidation,
} from "./cube";
import type { CameraProfile, LookPreset } from "./presets";
import {
  CORRECTION_LABELS,
  NEUTRAL_CORRECTION,
  formatCorrection,
  isNeutralCorrection,
  type CorrectionOptions,
  type DerivedCorrection,
} from "./correction";

/**
 * What the shooter told us about the material.
 *
 * Every field is optional and every one of them is *only* written into the
 * file's comment header. None of it is inferred, and nothing here changes a
 * single output value — the rule is that the LUT must never be built on a
 * number the user did not actually provide.
 */
export interface ShotMetadata {
  camera?: string;
  lens?: string;
  iso?: string;
  shutter?: string;
  aperture?: string;
  whiteBalance?: string;
  ev?: string;
  exposureNote?: string;
  resolution?: string;
  frameRate?: string;
  lighting?: string;
  intent?: string;
}

export interface LutSpec {
  name: string;
  profile: CameraProfile;
  preset: LookPreset;
  /** Grid resolution per axis. 33 is what every NLE, CapCut included, expects. */
  size: number;
  /** Exposure offset in stops, applied in linear light before the tone map. */
  exposureEv: number;
  /** Overrides on top of the preset's look. */
  look?: Partial<LookOptions>;
  /** Overrides on top of the preset's tone curve. */
  tone?: Partial<ToneCurveOptions>;
  warmth?: number;
  tint?: number;
  /** How far out-of-gamut colour is pulled back in, 0..1. */
  gamutCompression?: number;
  /**
   * Whether the recorded code values fill 0..1 or sit in the 64..940 video
   * range. Getting this wrong lifts the blacks and clips the whites, so it is
   * asked rather than assumed.
   */
  inputRange?: "full" | "legal";
  /**
   * The corrective layer, measured off this clip's own frames. Absent means the
   * material was never analysed, which is a different thing from analysed and
   * found to need nothing — the report says which.
   */
  correction?: DerivedCorrection;
  /** Emit the transform and the rendering alone: no correction, no look. */
  technicalOnly?: boolean;
  /** Keep the correction, drop the creative look. */
  skipLook?: boolean;
  /** Lines describing the analysed material, written into the file header. */
  analysisSummary?: string[];
  metadata?: ShotMetadata;
}

export type LutKind = "technical" | "corrected" | "creative" | "combined";

export interface LutReport {
  name: string;
  fileName: string;
  kind: LutKind;
  kindLabel: string;
  inputTransfer: string;
  inputGamut: string;
  /** Encoded value of 18% grey on the input curve, as a percentage. */
  inputMidGrey: number;
  /** Stops of highlight headroom above middle grey the input curve carries. */
  inputHeadroom: number;
  transformation: string;
  /** What the correction layer does, or why it does nothing. */
  correctionSummary: string;
  correction: CorrectionOptions;
  lookDescription: string;
  capcutIntensity: number;
  intensityReason: string;
  size: number;
  validation: CubeValidation;
  /** Measured on the generated grid, not predicted. */
  measured: LutMeasurements;
}

export interface LutMeasurements {
  /** Where 18% grey ends up, 0..1. */
  midGrey: number;
  /** Output at input code 0 and 1. */
  black: number;
  white: number;
  /** Fraction of grid nodes pinned at 0 or 1. */
  clippedLow: number;
  clippedHigh: number;
  /** Largest HSV saturation anywhere on the grid. */
  peakSaturation: number;
  /**
   * Largest difference between what the LUT interpolates and what the
   * transform actually computes, measured on the neutral ramp.
   *
   * This is the cost of the grid, and it is not negligible: a 3D LUT is
   * trilinear between its nodes while a log-to-display transform is not, so
   * the midtones — where the curve bends hardest and where skin lives — bow
   * slightly towards the chord. Worth knowing before grading on top of it.
   */
  interpolationError: number;
}

export interface LutResult {
  cube: Cube;
  text: string;
  report: LutReport;
}

const LEGAL_MIN = 64 / 1023;
const LEGAL_SPAN = (940 - 64) / 1023;

/** Expands video-range code values to the 0..1 the transfer curves expect. */
function normalizeRange(value: number, range: "full" | "legal"): number {
  if (range === "full") return value;
  return (value - LEGAL_MIN) / LEGAL_SPAN;
}

function isNeutralLook(look: LookOptions): boolean {
  return (
    Math.abs(look.saturation) < 1e-6 &&
    Math.abs(look.vibrance) < 1e-6 &&
    Math.abs(look.shadowLift) < 1e-6 &&
    look.shadowToning.strength < 1e-6 &&
    look.midtoneToning.strength < 1e-6 &&
    look.highlightToning.strength < 1e-6
  );
}

function isNeutralTone(tone: ToneCurveOptions): boolean {
  return (
    Math.abs(tone.greyTarget - NEUTRAL_TONE_CURVE.greyTarget) < 1e-6 &&
    Math.abs(tone.slopePerStop - NEUTRAL_TONE_CURVE.slopePerStop) < 1e-6 &&
    Math.abs(tone.toePower - NEUTRAL_TONE_CURVE.toePower) < 1e-6 &&
    Math.abs(tone.shoulderPower - NEUTRAL_TONE_CURVE.shoulderPower) < 1e-6
  );
}

export interface ResolvedSpec {
  look: LookOptions;
  tone: ToneCurveOptions;
  warmth: number;
  tint: number;
  gamutCompression: number;
  inputRange: "full" | "legal";
  matrix: Matrix3;
  whiteBalance: Matrix3 | null;
  gain: number;
  sceneReferred: boolean;
  transfer: TransferId;
  gamut: GamutId;
}

/**
 * The transform alone, with no creative pass — what `analyze.ts` renders a
 * frame through before measuring it, and what `technicalOnly` emits.
 */
export function resolveTechnical(
  profile: CameraProfile,
  inputRange: "full" | "legal" = "full",
): ResolvedSpec {
  return {
    look: { ...NEUTRAL_LOOK, skinProtection: 1 },
    tone: NEUTRAL_TONE_CURVE,
    warmth: 0,
    tint: 0,
    gamutCompression: 1,
    inputRange,
    matrix: gamutMatrix(profile.gamut, "rec709"),
    whiteBalance: null,
    gain: 1,
    sceneReferred: TRANSFERS[profile.transfer].kind === "scene",
    transfer: profile.transfer,
    gamut: profile.gamut,
  };
}

/**
 * Composes the three layers into the single set of knobs the pixel loop uses.
 *
 * The layers are additive and they are applied in a fixed order, because the
 * order is what makes them separable: the correction is decided against the
 * *technically converted* material, so it has to sit on top of the transform
 * and underneath the look. A look chosen for the corrected image would be
 * wrong if the correction were applied afterwards.
 *
 * Nothing here is clever. Each correction value is an offset on a knob the
 * creative preset also uses, so a colourist reading the report can see exactly
 * how far the correction moved each one and dial it back by hand.
 */
function resolve(spec: LutSpec): ResolvedSpec {
  const technicalOnly = spec.technicalOnly === true;
  const skipLook = technicalOnly || spec.skipLook === true;

  // Layer 2. Dropped entirely by `technicalOnly`, kept by `skipLook`.
  const correction: CorrectionOptions = technicalOnly
    ? NEUTRAL_CORRECTION
    : (spec.correction?.options ?? NEUTRAL_CORRECTION);

  // Layer 3.
  const look: LookOptions = skipLook
    ? { ...NEUTRAL_LOOK, skinProtection: 1 }
    : { ...spec.preset.look, ...spec.look };
  const baseTone: ToneCurveOptions = skipLook
    ? NEUTRAL_TONE_CURVE
    : { ...spec.preset.tone, ...spec.tone };
  const creativeWarmth = skipLook ? 0 : (spec.warmth ?? spec.preset.warmth);
  const creativeTint = skipLook ? 0 : (spec.tint ?? spec.preset.tint);
  const creativeExposure = skipLook ? 0 : spec.exposureEv;

  // Correction folded in. The clamps are the ranges the controls themselves
  // offer, so a strong correction plus a strong look cannot walk a knob off
  // the end of the scale that the UI can express.
  const tone: ToneCurveOptions = {
    ...baseTone,
    slopePerStop: baseTone.slopePerStop * (1 + correction.contrastTrim / 100),
    // A shoulder power below 1 stops being a shoulder and starts being a kink.
    shoulderPower: Math.max(1.05, baseTone.shoulderPower + correction.shoulderTrim),
  };
  const merged: LookOptions = {
    ...look,
    shadowLift: clampRange(look.shadowLift + correction.blackTrim, -100, 100),
    saturation: clampRange(look.saturation + correction.saturationTrim, -100, 100),
  };
  const warmth = clampRange(creativeWarmth + correction.warmth, -100, 100);
  const tint = clampRange(creativeTint + correction.tint, -100, 100);
  const exposureEv = clampRange(creativeExposure + correction.exposureEv, -5, 5);

  const transfer = spec.profile.transfer;
  const gamut = spec.profile.gamut;
  return {
    look: merged,
    tone,
    warmth,
    tint,
    gamutCompression: spec.gamutCompression ?? 1,
    inputRange: spec.inputRange ?? "full",
    matrix: gamutMatrix(gamut, "rec709"),
    whiteBalance: creativeWhiteBalance(warmth, tint),
    gain: 2 ** exposureEv,
    sceneReferred: TRANSFERS[transfer].kind === "scene",
    transfer,
    gamut,
  };
}

function clampRange(value: number, low: number, high: number): number {
  return value < low ? low : value > high ? high : value;
}

/**
 * One pixel, start to finish.
 *
 * Exported because the preview renders through exactly this function rather
 * than through a second copy of the maths: if what the browser draws and what
 * the `.cube` contains can drift apart, they will.
 */
export function transformPixel(
  input: [number, number, number],
  resolved: ResolvedSpec,
): [number, number, number] {
  const curve = TRANSFERS[resolved.transfer];

  // 1. Code value -> scene-linear reflectance, in the camera's own gamut.
  let r = curve.decode(normalizeRange(input[0], resolved.inputRange));
  let g = curve.decode(normalizeRange(input[1], resolved.inputRange));
  let b = curve.decode(normalizeRange(input[2], resolved.inputRange));

  // 2. Camera gamut -> Rec.709, in linear light. Wide gamuts produce negative
  //    values here; that is expected and is dealt with in step 5.
  [r, g, b] = applyMatrix(resolved.matrix, r, g, b);

  // 3. Creative white balance and exposure, both linear-light operations.
  [r, g, b] = applyOptionalMatrix(resolved.whiteBalance, r, g, b);
  if (resolved.gain !== 1) {
    r *= resolved.gain;
    g *= resolved.gain;
    b *= resolved.gain;
  }

  let display: [number, number, number];
  if (resolved.sceneReferred) {
    // 4. The filmic rendering, which also handles the out-of-gamut colour the
    //    matrix in step 2 produced.
    display = renderToDisplay(r, g, b, resolved.tone, resolved.gamutCompression);
  } else {
    // The material is already display-referred: re-encode with the curve it
    // arrived on, then apply the tone options *relative* to neutral. When the
    // look asks for no tone change this round trip is the identity, so a
    // creative LUT never silently re-renders footage that was already graded.
    // The white balance matrix can push a saturated colour below zero here.
    // Display-referred material has no meaning below black, and every display
    // OETF is undefined for a negative, so out-of-gamut colour is compressed
    // back in and what is left is floored before it reaches the curve.
    [r, g, b] = compressGamut(r, g, b, resolved.gamutCompression);
    const encoded: [number, number, number] = [
      curve.encode(Math.max(r, 0)),
      curve.encode(Math.max(g, 0)),
      curve.encode(Math.max(b, 0)),
    ];
    if (isNeutralTone(resolved.tone)) {
      display = encoded;
    } else {
      display = encoded.map((value) => {
        const clamped = Math.min(Math.max(value, 1e-6), 1 - 1e-6);
        return toneCurve(toneCurveInverse(clamped, NEUTRAL_TONE_CURVE), resolved.tone);
      }) as [number, number, number];
    }
  }

  // 6. Taste.
  const graded = applyLook(display, resolved.look);
  return [clampDisplay(graded[0]), clampDisplay(graded[1]), clampDisplay(graded[2])];
}

// ---------------------------------------------------------------------------
// Building the cube
// ---------------------------------------------------------------------------

export function buildLut(spec: LutSpec): LutResult {
  const resolved = resolve(spec);
  const size = spec.size;
  const kind = classify(spec, resolved);
  const notes = headerNotes(spec, resolved, kind);
  const cube = createCube(size, spec.name, notes);
  const last = size - 1;

  for (let blue = 0; blue < size; blue += 1) {
    for (let green = 0; green < size; green += 1) {
      for (let red = 0; red < size; red += 1) {
        const out = transformPixel([red / last, green / last, blue / last], resolved);
        // Red varies fastest — see the note at the top of `cube.ts`.
        const at = nodeOffset(size, red, green, blue);
        cube.data[at] = out[0];
        cube.data[at + 1] = out[1];
        cube.data[at + 2] = out[2];
      }
    }
  }

  const text = serializeCube(cube);
  const report = describe(spec, resolved, kind, cube);
  return { cube, text, report };
}

function classify(spec: LutSpec, resolved: ResolvedSpec): LutKind {
  if (spec.technicalOnly) return "technical";
  if (!resolved.sceneReferred) return "creative";

  const corrects =
    spec.correction !== undefined && !isNeutralCorrection(spec.correction.options);
  const styles =
    spec.skipLook !== true &&
    (!isNeutralLook({ ...spec.preset.look, ...spec.look }) ||
      !isNeutralTone({ ...spec.preset.tone, ...spec.tone }) ||
      Math.abs(spec.warmth ?? spec.preset.warmth) > 1e-6 ||
      Math.abs(spec.tint ?? spec.preset.tint) > 1e-6 ||
      spec.exposureEv !== 0);

  if (styles) return "combined";
  return corrects ? "corrected" : "technical";
}

const KIND_LABELS: Record<LutKind, string> = {
  technical: "Conversión técnica (transformación pura)",
  corrected: "Técnico + corrección (medida de este material)",
  creative: "Creativo (sobre material ya en Rec.709)",
  combined: "Transformación + corrección + look",
};

// ---------------------------------------------------------------------------
// Measurement and reporting
// ---------------------------------------------------------------------------

function measure(cube: Cube, resolved: ResolvedSpec): LutMeasurements {
  const grey = midGreyCode(resolved.transfer);
  const greyOut = transformPixel([grey, grey, grey], resolved);
  const black = transformPixel([0, 0, 0], resolved);
  const white = transformPixel([1, 1, 1], resolved);

  // What a player will actually get out of the file, versus what the transform
  // says the answer is. Sampled off the grid on purpose: on a node the two
  // agree by construction and the measurement would be meaningless.
  let interpolationError = 0;
  for (let step = 0; step <= 512; step += 1) {
    const code = step / 512;
    const interpolated = sampleCube(cube, code, code, code);
    const exact = transformPixel([code, code, code], resolved);
    for (let channel = 0; channel < 3; channel += 1) {
      const difference = Math.abs(interpolated[channel] - exact[channel]);
      if (difference > interpolationError) interpolationError = difference;
    }
  }

  let clippedLow = 0;
  let clippedHigh = 0;
  let peakSaturation = 0;
  const nodes = cube.size ** 3;
  for (let index = 0; index < nodes; index += 1) {
    const at = index * 3;
    const r = cube.data[at];
    const g = cube.data[at + 1];
    const b = cube.data[at + 2];
    if (r <= 0 && g <= 0 && b <= 0) clippedLow += 1;
    if (r >= 1 && g >= 1 && b >= 1) clippedHigh += 1;
    const max = Math.max(r, g, b);
    if (max > 1e-6) {
      const saturation = (max - Math.min(r, g, b)) / max;
      if (saturation > peakSaturation) peakSaturation = saturation;
    }
  }

  return {
    midGrey: (greyOut[0] + greyOut[1] + greyOut[2]) / 3,
    black: (black[0] + black[1] + black[2]) / 3,
    white: (white[0] + white[1] + white[2]) / 3,
    clippedLow: clippedLow / nodes,
    clippedHigh: clippedHigh / nodes,
    peakSaturation,
    interpolationError,
  };
}

/**
 * How hard the creative pass is pushing, 0..1.
 *
 * Drives the CapCut intensity recommendation. A look built almost entirely out
 * of toning survives at full strength; one that leans on saturation and a steep
 * curve wants backing off, because CapCut's slider is the only control the
 * editor has once the file is loaded.
 */
function lookStrength(resolved: ResolvedSpec, exposureEv: number): number {
  const { look, tone } = resolved;
  const saturation = (Math.abs(look.saturation) + Math.abs(look.vibrance)) / 200;
  const toning =
    (look.shadowToning.strength + look.midtoneToning.strength + look.highlightToning.strength) /
    300;
  const lift = Math.abs(look.shadowLift) / 100;
  const contrast = Math.abs(tone.slopePerStop - NEUTRAL_TONE_CURVE.slopePerStop) / 0.06;
  const balance = (Math.abs(resolved.warmth) + Math.abs(resolved.tint)) / 200;
  const exposure = Math.min(Math.abs(exposureEv) / 2, 1);
  return Math.min(
    1,
    saturation * 0.9 + toning * 0.8 + lift * 0.5 + contrast * 0.7 + balance * 0.6 + exposure * 0.4,
  );
}

function describe(
  spec: LutSpec,
  resolved: ResolvedSpec,
  kind: LutKind,
  cube: Cube,
): LutReport {
  const transferLabel = TRANSFERS[resolved.transfer].label;
  const gamutLabel = GAMUT_LABELS[resolved.gamut];
  const measured = measure(cube, resolved);

  const transformation = resolved.sceneReferred
    ? `${transferLabel} · ${gamutLabel} → Rec.709 (BT.709). Decodificación logarítmica a ` +
      `escena lineal, matriz de gamut derivada de las primarias publicadas, compresión de ` +
      `gamut y curva fílmica asintótica hacia Rec.709.`
    : `Sin transformación técnica: el material ya es ${transferLabel} · ${gamutLabel}. ` +
      `El LUT sólo aplica la intención creativa.`;

  const correction = spec.correction?.options ?? NEUTRAL_CORRECTION;
  const correctionSummary = summarizeCorrection(spec, kind);

  const strength = lookStrength(resolved, spec.exposureEv);
  let capcutIntensity: number;
  let intensityReason: string;

  if (kind === "technical" || kind === "corrected") {
    capcutIntensity = 100;
    intensityReason =
      kind === "technical"
        ? "Es una conversión técnica: al 100%. Bajar la intensidad de un LUT de transformación " +
          "deja el material a medio camino entre log y Rec.709, que no es ningún espacio válido."
        : "Transformación más corrección medida de este material, sin look: al 100%. Todo lo que " +
          "hay en el archivo es lo que el plano necesitaba, así que rebajarlo sólo deja el trabajo " +
          "a medias.";
  } else {
    const base = spec.preset.capcutIntensity;
    capcutIntensity = Math.round(Math.min(base, 100 - strength * 45) / 5) * 5;
    capcutIntensity = Math.min(100, Math.max(40, capcutIntensity));
    intensityReason =
      kind === "combined"
        ? `El look va incorporado sobre la transformación, así que por debajo del ~60% el ` +
          `material empieza a volver hacia el log. Empieza en ${capcutIntensity}% y ajusta ` +
          `mirando la piel, no el fondo.`
        : `El material ya está en Rec.709, así que la intensidad es libre. ${capcutIntensity}% ` +
          `es el punto donde el look se lee sin que la piel pierda su tono.`;
  }

  return {
    name: spec.name,
    fileName: fileNameFor(spec, kind),
    kind,
    kindLabel: KIND_LABELS[kind],
    inputTransfer: transferLabel,
    inputGamut: gamutLabel,
    inputMidGrey: midGreyCode(resolved.transfer) * 100,
    inputHeadroom: headroomStops(resolved.transfer),
    transformation,
    correctionSummary,
    correction,
    lookDescription:
      kind === "technical" || kind === "corrected"
        ? "Ninguno. Rendición neutra de Rec.709, lista para poner un look encima."
        : spec.preset.description,
    capcutIntensity,
    intensityReason,
    size: spec.size,
    validation: validateCube(cube),
    measured,
  };
}

/**
 * The correction layer in one paragraph.
 *
 * The distinction it has to carry is between "analysed and found to need
 * nothing" and "never analysed", because those recommend completely different
 * things to the person holding the file.
 */
function summarizeCorrection(spec: LutSpec, kind: LutKind): string {
  if (kind === "creative") {
    return "No aplica: el material ya está en Rec.709 y no se ha medido para corregirlo.";
  }
  if (spec.technicalOnly) {
    return "Desactivada a propósito: este archivo es sólo la transformación.";
  }
  if (!spec.correction) {
    return (
      "Ninguna: no se ha analizado material. El LUT es genérico para el perfil de cámara, " +
      "no para este plano. Carga el vídeo y analízalo para que la corrección se mida."
    );
  }
  const applied = (Object.keys(spec.correction.options) as Array<keyof CorrectionOptions>)
    .filter((field) => Math.abs(spec.correction!.options[field]) > 1e-6)
    .map((field) => `${CORRECTION_LABELS[field]} ${formatCorrection(field, spec.correction!.options[field])}`);

  if (applied.length === 0) {
    return (
      "Ninguna. El material se analizó y midió correctamente en exposición, balance, contraste " +
      "y saturación: no hay nada que corregir, que es un resultado y no un fallo."
    );
  }
  return `Medida sobre los fotogramas analizados: ${applied.join(", ")}.`;
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function fileNameFor(spec: LutSpec, kind: LutKind): string {
  const suffix =
    kind === "technical"
      ? "Tecnico"
      : kind === "corrected"
        ? "Tecnico-Corregido"
        : kind === "creative"
          ? "Look"
          : "Look-Tecnico";
  return `AdVibe_${slug(spec.name) || "Color-Lab"}_${suffix}_${spec.size}.cube`;
}

/**
 * The comment header.
 *
 * Worth the bytes: six months later the only thing that says which camera and
 * which picture profile a `.cube` belongs to is the file itself, and a LUT
 * applied to the wrong log curve fails quietly rather than loudly.
 */
function headerNotes(spec: LutSpec, resolved: ResolvedSpec, kind: LutKind): string[] {
  const notes = [
    `AdVibe Color Lab — ${spec.name}`,
    `Tipo: ${KIND_LABELS[kind]}`,
    `Entrada: ${TRANSFERS[resolved.transfer].label} · ${GAMUT_LABELS[resolved.gamut]}` +
      `${resolved.inputRange === "legal" ? " (rango legal 64-940)" : ""}`,
    "Salida: Rec.709 (BT.709), rango completo 0-1",
    `Rejilla: ${spec.size}x${spec.size}x${spec.size}`,
  ];

  if (spec.exposureEv !== 0) {
    notes.push(`Exposición: ${spec.exposureEv > 0 ? "+" : ""}${spec.exposureEv.toFixed(2)} EV`);
  }
  // The three layers, named, so that six months from now the file itself says
  // which parts of it are opinion.
  notes.push("--- Capa 1: transformación técnica ---");
  notes.push(
    resolved.sceneReferred
      ? `${TRANSFERS[resolved.transfer].label} · ${GAMUT_LABELS[resolved.gamut]} -> Rec.709, curva fílmica asintótica`
      : "Ninguna: el material ya es display-referred",
  );

  notes.push("--- Capa 2: corrección medida ---");
  const correction = spec.correction;
  if (spec.technicalOnly) {
    notes.push("Desactivada: archivo de transformación pura");
  } else if (!correction) {
    notes.push("Ninguna: no se analizó material, el LUT es genérico para el perfil");
  } else if (correction.notes.length === 0) {
    notes.push("Ninguna: el material analizado no necesitaba corrección");
  } else {
    for (const note of correction.notes) {
      const value = formatCorrection(note.field, note.value);
      notes.push(`${CORRECTION_LABELS[note.field]} ${value} — ${note.reason}`);
    }
  }

  notes.push("--- Capa 3: look creativo ---");
  notes.push(kind === "technical" || kind === "corrected" ? "Ninguno" : spec.preset.label);

  if (spec.analysisSummary && spec.analysisSummary.length > 0) {
    notes.push("--- Análisis del material ---");
    for (const line of spec.analysisSummary) notes.push(line);
  }

  // Only what the shooter actually told us. An empty field stays out of the
  // file rather than being filled in with a plausible-looking default.
  const metadata = spec.metadata;
  if (metadata) {
    const fields: Array<[string, string | undefined]> = [
      ["Cámara", metadata.camera],
      ["Óptica", metadata.lens],
      ["ISO", metadata.iso],
      ["Obturador", metadata.shutter],
      ["Diafragma", metadata.aperture],
      ["Balance de blancos", metadata.whiteBalance],
      ["EV declarado", metadata.ev],
      ["Exposición declarada", metadata.exposureNote],
      ["Resolución", metadata.resolution],
      ["Frame rate", metadata.frameRate],
      ["Iluminación", metadata.lighting],
      ["Intención", metadata.intent],
    ];
    const provided = fields.filter(([, value]) => value && value.trim() !== "");
    if (provided.length > 0) {
      notes.push("--- Material declarado por el operador ---");
      for (const [label, value] of provided) notes.push(`${label}: ${value!.trim()}`);
    }
  }

  notes.push(`Generado: ${new Date().toISOString().slice(0, 10)}`);
  return notes;
}
