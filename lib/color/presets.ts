/**
 * Camera profiles and creative looks.
 *
 * Two rules govern this file:
 *
 *  1. **Nothing is guessed.** A profile appears here only when the
 *     manufacturer publishes the transfer function and the gamut primaries for
 *     it. Sony's Cine2/Cine4, Canon's Wide DR, Nikon's Flat, the various
 *     "cinematic" consumer profiles — all of them are proprietary curves with
 *     no published definition, and inventing one produces a LUT that is wrong
 *     in a way nobody can debug. Those profiles are handled the honest way:
 *     grade them as Rec.709 with a creative-only LUT.
 *  2. **Every look is skin-first.** No preset here pushes global saturation
 *     past the point where skin starts to go orange; the ones that want strong
 *     colour get it from the toning wheels and the tone curve, which act on
 *     the parts of the frame that are not a face.
 */
import type { GamutId } from "./gamut";
import type { TransferId } from "./transfer";
import { NEUTRAL_LOOK, type LookOptions } from "./look";
import { NEUTRAL_TONE_CURVE, withContrast, type ToneCurveOptions } from "./tonemap";

export interface CameraProfile {
  id: string;
  /** Camera family, as the shooter would say it. */
  camera: string;
  /** Picture profile / gamma setting on the camera menu. */
  profile: string;
  transfer: TransferId;
  gamut: GamutId;
  /** Anything the shooter needs to know before trusting the transform. */
  note?: string;
}

export const CAMERA_PROFILES: CameraProfile[] = [
  {
    id: "sony-slog3-cine",
    camera: "Sony (Alpha / FX)",
    profile: "S-Log3 · S-Gamut3.Cine (PP8)",
    transfer: "sLog3",
    gamut: "sGamut3Cine",
    note: "El perfil por defecto de FX3/FX30/a7S III para grabar log.",
  },
  {
    id: "sony-slog3",
    camera: "Sony (Alpha / FX)",
    profile: "S-Log3 · S-Gamut3 (PP9)",
    transfer: "sLog3",
    gamut: "sGamut3",
  },
  {
    id: "sony-slog2",
    camera: "Sony (Alpha, generación a7S II)",
    profile: "S-Log2 · S-Gamut (PP7)",
    transfer: "sLog2",
    gamut: "sGamut3",
    note: "Curva heredada. Sony la define sobre escala IRE: si el material se grabó en rango legal, marca esa opción antes de generar.",
  },
  {
    id: "sony-hlg3",
    camera: "Sony (Alpha / FX)",
    profile: "HLG · BT.2020 (PP10)",
    transfer: "hlg",
    gamut: "rec2020",
  },
  {
    id: "panasonic-vlog",
    camera: "Panasonic (LUMIX S / GH)",
    profile: "V-Log / V-Log L · V-Gamut",
    transfer: "vLog",
    gamut: "vGamut",
  },
  {
    id: "canon-clog3",
    camera: "Canon (EOS R / C)",
    profile: "Canon Log 3 · Cinema Gamut",
    transfer: "cLog3",
    gamut: "cinemaGamut",
  },
  {
    id: "canon-clog3-709",
    camera: "Canon (EOS R / C)",
    profile: "Canon Log 3 · BT.709",
    transfer: "cLog3",
    gamut: "rec709",
    note: "Varias EOS R graban C-Log3 con primarias BT.709, no Cinema Gamut. Compruébalo en el menú antes de elegir.",
  },
  {
    id: "canon-clog2",
    camera: "Canon (EOS C / R5 C)",
    profile: "Canon Log 2 · Cinema Gamut",
    transfer: "cLog2",
    gamut: "cinemaGamut",
  },
  {
    id: "arri-logc3",
    camera: "ARRI ALEXA / AMIRA",
    profile: "LogC3 (EI 800) · ARRI Wide Gamut 3",
    transfer: "logC3",
    gamut: "arriWideGamut3",
    note: "Las constantes publicadas de LogC3 son para EI 800. Otro índice de exposición desplaza la curva.",
  },
  {
    id: "arri-logc4",
    camera: "ARRI ALEXA 35",
    profile: "LogC4 · ARRI Wide Gamut 4",
    transfer: "logC4",
    gamut: "arriWideGamut4",
  },
  {
    id: "fuji-flog",
    camera: "Fujifilm X / GFX",
    profile: "F-Log · F-Gamut (BT.2020)",
    transfer: "fLog",
    gamut: "rec2020",
  },
  {
    id: "fuji-flog2",
    camera: "Fujifilm X-H2 / X-T5 y posteriores",
    profile: "F-Log2 · F-Gamut (BT.2020)",
    transfer: "fLog2",
    gamut: "rec2020",
  },
  {
    id: "nikon-nlog",
    camera: "Nikon Z",
    profile: "N-Log · BT.2020",
    transfer: "nLog",
    gamut: "rec2020",
  },
  {
    id: "dji-dlog",
    camera: "DJI (Mavic / Air / Osmo / Ronin)",
    profile: "D-Log · D-Gamut",
    transfer: "dLog",
    gamut: "dGamut",
  },
  {
    id: "red-log3g10",
    camera: "RED",
    profile: "Log3G10 · REDWideGamutRGB",
    transfer: "log3G10",
    gamut: "redWideGamut",
  },
  {
    id: "bmd-gen5",
    camera: "Blackmagic Design",
    profile: "Blackmagic Film Gen 5 · BMD Wide Gamut",
    transfer: "bmdFilmGen5",
    gamut: "blackmagicWideGamut",
  },
  {
    id: "rec709",
    camera: "Cualquiera",
    profile: "Rec.709 estándar (perfil no log)",
    transfer: "rec709",
    gamut: "rec709",
    note: "Elige esto para perfiles sin curva publicada (Cine2/Cine4, Wide DR, Flat, 'cinematic' de móvil): el material ya es Rec.709 y sólo admite un LUT creativo.",
  },
  {
    id: "srgb",
    camera: "Cualquiera",
    profile: "sRGB (pantalla / material ya entregado)",
    transfer: "srgb",
    gamut: "rec709",
  },
];

export function findCameraProfile(id: string): CameraProfile | undefined {
  return CAMERA_PROFILES.find((profile) => profile.id === id);
}

// ---------------------------------------------------------------------------
// Looks
// ---------------------------------------------------------------------------

export interface LookPreset {
  id: string;
  label: string;
  description: string;
  look: LookOptions;
  tone: ToneCurveOptions;
  /** Creative warm/cool shift, -100..100, applied in linear light. */
  warmth: number;
  /** Green/magenta shift, -100..100. */
  tint: number;
  /** Where to start the intensity slider in CapCut, as a percentage. */
  capcutIntensity: number;
}

function look(overrides: Partial<LookOptions>): LookOptions {
  return { ...NEUTRAL_LOOK, ...overrides };
}

/** `contrast` is a percentage offset from the neutral rendering's slope. */
function tone(contrast: number, overrides: Partial<ToneCurveOptions> = {}): ToneCurveOptions {
  return contrast === 0 && Object.keys(overrides).length === 0
    ? NEUTRAL_TONE_CURVE
    : withContrast(contrast, overrides);
}

export const LOOK_PRESETS: LookPreset[] = [
  {
    id: "neutral",
    label: "Neutro Rec.709",
    description:
      "Sólo la transformación técnica: gamma y gamut a Rec.709, sin intención creativa. " +
      "Es el punto de partida sobre el que corregir, no un look.",
    look: look({}),
    tone: tone(0),
    warmth: 0,
    tint: 0,
    capcutIntensity: 100,
  },
  {
    id: "piel-natural",
    label: "Piel natural",
    description:
      "Contraste suave, altas luces con rodadura larga y saturación contenida en naranjas. " +
      "Pensado para primeros planos y entrevistas: la piel manda y todo lo demás cede.",
    look: look({
      vibrance: 8,
      saturation: -2,
      skinProtection: 0.85,
      shadowLift: 6,
      saturationCeiling: 0.86,
      highlightToning: { hue: 40, strength: 6 },
    }),
    tone: tone(-4, { shoulderPower: 3.4, toePower: 1.4 }),
    warmth: 4,
    tint: 0,
    capcutIntensity: 100,
  },
  {
    id: "comercial-calido",
    label: "Comercial cálido",
    description:
      "El look de anuncio: medios luminosos, blancos ligeramente cálidos y color limpio. " +
      "Funciona con producto, gastronomía e interiores.",
    look: look({
      vibrance: 16,
      saturation: 4,
      shadowLift: 4,
      skinProtection: 0.75,
      highlightToning: { hue: 45, strength: 10 },
      shadowToning: { hue: 220, strength: 6 },
      saturationCeiling: 0.9,
    }),
    tone: tone(5, { greyTarget: 0.425 }),
    warmth: 18,
    tint: -2,
    capcutIntensity: 85,
  },
  {
    id: "teal-orange",
    label: "Teal & orange suave",
    description:
      "Sombras hacia el cian y altas luces hacia el ámbar, con la separación puesta en el " +
      "fondo y no en la cara. La versión sobria del cliché.",
    look: look({
      vibrance: 12,
      saturation: 2,
      skinProtection: 0.9,
      shadowLift: 8,
      shadowToning: { hue: 195, strength: 18 },
      highlightToning: { hue: 38, strength: 12 },
      saturationCeiling: 0.88,
    }),
    tone: tone(7, { toePower: 1.4, shoulderPower: 2.8 }),
    warmth: 6,
    tint: -3,
    capcutIntensity: 75,
  },
  {
    id: "documental",
    label: "Documental plano",
    description:
      "Contraste bajo y negros abiertos, para material que todavía va a pasar por " +
      "corrección o que se mezcla con cámaras distintas.",
    look: look({
      vibrance: 4,
      saturation: -4,
      shadowLift: 12,
      skinProtection: 0.8,
      saturationCeiling: 0.85,
    }),
    tone: tone(-13, { greyTarget: 0.42, toePower: 1.3 }),
    warmth: 0,
    tint: 0,
    capcutIntensity: 100,
  },
  {
    id: "nocturno-urbano",
    label: "Nocturno urbano",
    description:
      "Negros densos pero no cerrados, azules profundos y las luces de la calle sin " +
      "reventar. Para exteriores de noche y neón.",
    look: look({
      vibrance: 14,
      saturation: 0,
      shadowLift: -6,
      skinProtection: 0.85,
      shadowToning: { hue: 225, strength: 16 },
      midtoneToning: { hue: 205, strength: 6 },
      highlightToning: { hue: 30, strength: 8 },
      saturationCeiling: 0.9,
    }),
    tone: tone(12, { toePower: 1.9, shoulderPower: 3.2 }),
    warmth: -8,
    tint: 2,
    capcutIntensity: 70,
  },
  {
    id: "pastel",
    label: "Pastel suave",
    description:
      "Negro mate, saturación baja y luz difusa. Para moda, lifestyle y todo lo que " +
      "se vaya a ver en vertical a pantalla pequeña.",
    look: look({
      vibrance: -6,
      saturation: -12,
      shadowLift: 22,
      skinProtection: 0.7,
      shadowToning: { hue: 260, strength: 8 },
      highlightToning: { hue: 35, strength: 8 },
      saturationCeiling: 0.8,
    }),
    tone: tone(-11, { greyTarget: 0.435, toePower: 1.25 }),
    warmth: 8,
    tint: 3,
    capcutIntensity: 80,
  },
];

export function findLookPreset(id: string): LookPreset | undefined {
  return LOOK_PRESETS.find((preset) => preset.id === id);
}
