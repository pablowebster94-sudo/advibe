/**
 * Log transfer functions: camera code value <-> scene-linear reflectance.
 *
 * Every `decode` here returns *scene-linear reflectance* on the convention
 * that 18% grey = 0.18 and a 100% diffuse white card = 1.0. Signals brighter
 * than 1.0 are specular highlights and are expected: that headroom is the whole
 * reason the footage was shot log, and throwing it away at this stage is what
 * makes a "log to 709" LUT clip the sky.
 *
 * Constants come from the manufacturers' own published curves — Sony's S-Log3
 * and S-Log2 technical summaries, Panasonic's V-Log/V-Gamut reference manual,
 * the Canon Log 2 / Log 3 white paper, ARRI's LogC3 (EI 800) and LogC4
 * specifications, the Fujifilm F-Log/F-Log2 data sheets, Nikon's N-Log
 * specification, DJI's D-Log white paper, RED's Log3G10 white paper,
 * Blackmagic Generation 5 Color Science, and ITU-R BT.2100 for HLG and PQ.
 * Nothing here is fitted or approximated; if a picture profile has no published
 * curve (Sony's Cine2/Cine4, Canon's Wide DR, most "flat" consumer profiles)
 * it is deliberately absent rather than guessed at — see `presets.ts`.
 */

export interface TransferFunction {
  /** Camera code value 0..1 -> scene-linear reflectance (0.18 = 18% grey). */
  decode(value: number): number;
  /** Scene-linear reflectance -> camera code value 0..1. */
  encode(value: number): number;
}

/**
 * `scene` curves carry real exposure headroom above diffuse white and want a
 * tone map; `display` curves are already graded for a screen and only want the
 * inverse EOTF so a creative look can be applied in a sane space.
 */
export type TransferKind = "scene" | "display";

export interface TransferSpec extends TransferFunction {
  label: string;
  kind: TransferKind;
}

const log10 = (x: number) => Math.log(x) / Math.LN10;

// ---------------------------------------------------------------------------
// Sony
// ---------------------------------------------------------------------------

const SLOG3_BREAK_CODE = 171.2102946929 / 1023;
const SLOG3_BREAK_LINEAR = 0.01125;

const sLog3: TransferFunction = {
  decode(value) {
    if (value >= SLOG3_BREAK_CODE) {
      return (10 ** ((value * 1023 - 420) / 261.5) * 0.19 - 0.01);
    }
    return ((value * 1023 - 95) * SLOG3_BREAK_LINEAR) / (171.2102946929 - 95);
  },
  encode(value) {
    if (value >= SLOG3_BREAK_LINEAR) {
      return (420 + log10((value + 0.01) / 0.19) * 261.5) / 1023;
    }
    return (value * (171.2102946929 - 95)) / SLOG3_BREAK_LINEAR / 1023 + 95 / 1023;
  },
};

/**
 * S-Log2, on full-range code values.
 *
 * Legacy — the a7S II / F55 generation. Sony's own curve is specified against
 * an IRE scale, so footage recorded legal-range must be expanded before this
 * LUT is applied; `pipeline.ts` exposes that as the `range` option rather than
 * silently assuming one.
 */
const sLog2: TransferFunction = {
  decode(value) {
    if (value >= 0.030001222851889303) {
      return (
        ((219 * (10 ** ((value - 0.616596 - 0.03) / 0.432699) - 0.037584)) / 155) * 0.9
      );
    }
    return ((value - 0.030001222851889303) / 3.53881278538813) * 0.9;
  },
  encode(value) {
    if (value >= 0) {
      return 0.432699 * log10((155 * value) / (0.9 * 219) + 0.037584) + 0.616596 + 0.03;
    }
    return (value * 3.53881278538813) / 0.9 + 0.030001222851889303;
  },
};

// ---------------------------------------------------------------------------
// Panasonic
// ---------------------------------------------------------------------------

const V_LOG_CUT_LINEAR = 0.01;
const V_LOG_CUT_CODE = 0.181;
const V_LOG_B = 0.00873;
const V_LOG_C = 0.241514;
const V_LOG_D = 0.598206;

const vLog: TransferFunction = {
  decode(value) {
    if (value < V_LOG_CUT_CODE) return (value - 0.125) / 5.6;
    return 10 ** ((value - V_LOG_D) / V_LOG_C) - V_LOG_B;
  },
  encode(value) {
    if (value < V_LOG_CUT_LINEAR) return 5.6 * value + 0.125;
    return V_LOG_C * log10(value + V_LOG_B) + V_LOG_D;
  },
};

// ---------------------------------------------------------------------------
// Canon
// ---------------------------------------------------------------------------

const cLog3: TransferFunction = {
  decode(value) {
    if (value < 0.097465473) return -(10 ** ((0.12783901 - value) / 0.36726845) - 1) / 14.98325;
    if (value <= 0.15277891) return (value - 0.12512219) / 1.9754798;
    return (10 ** ((value - 0.12240537) / 0.36726845) - 1) / 14.98325;
  },
  encode(value) {
    if (value < -0.014) return -0.36726845 * log10(1 - 14.98325 * value) + 0.12783901;
    if (value <= 0.014) return 1.9754798 * value + 0.12512219;
    return 0.36726845 * log10(14.98325 * value + 1) + 0.12240537;
  },
};

const cLog2: TransferFunction = {
  decode(value) {
    if (value < 0.092864125) {
      return -(10 ** ((0.092864125 - value) / 0.24136077) - 1) / 87.099375;
    }
    return (10 ** ((value - 0.092864125) / 0.24136077) - 1) / 87.099375;
  },
  encode(value) {
    if (value < 0) return -0.24136077 * log10(1 - 87.099375 * value) + 0.092864125;
    return 0.24136077 * log10(87.099375 * value + 1) + 0.092864125;
  },
};

// ---------------------------------------------------------------------------
// ARRI
// ---------------------------------------------------------------------------

/** LogC3 at EI 800, the exposure index the published constants are given for. */
const LOGC3 = {
  cut: 0.010591,
  a: 5.555556,
  b: 0.052272,
  c: 0.24719,
  d: 0.385537,
  e: 5.367655,
  f: 0.092809,
} as const;

const logC3: TransferFunction = {
  decode(value) {
    const breakCode = LOGC3.e * LOGC3.cut + LOGC3.f;
    if (value > breakCode) return (10 ** ((value - LOGC3.d) / LOGC3.c) - LOGC3.b) / LOGC3.a;
    return (value - LOGC3.f) / LOGC3.e;
  },
  encode(value) {
    if (value > LOGC3.cut) return LOGC3.c * log10(LOGC3.a * value + LOGC3.b) + LOGC3.d;
    return LOGC3.e * value + LOGC3.f;
  },
};

const LOGC4_A = (2 ** 18 - 16) / 117.45;
const LOGC4_B = (1023 - 95) / 1023;
const LOGC4_C = 95 / 1023;
const LOGC4_S = (7 * Math.LN2 * 2 ** (7 - (14 * LOGC4_C) / LOGC4_B)) / (LOGC4_A * LOGC4_B);
const LOGC4_T = (2 ** (14 * (-LOGC4_C / LOGC4_B) + 6) - 64) / LOGC4_A;

const logC4: TransferFunction = {
  decode(value) {
    if (value < 0) return value * LOGC4_S + LOGC4_T;
    return (2 ** ((14 * (value - LOGC4_C)) / LOGC4_B + 6) - 64) / LOGC4_A;
  },
  encode(value) {
    if (value < LOGC4_T) return (value - LOGC4_T) / LOGC4_S;
    return ((Math.log2(LOGC4_A * value + 64) - 6) / 14) * LOGC4_B + LOGC4_C;
  },
};

// ---------------------------------------------------------------------------
// Fujifilm
// ---------------------------------------------------------------------------

interface LogCurveConstants {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  cutLinear: number;
  cutCode: number;
}

/** The `c*log10(a*x+b)+d` family with a linear toe, shared by F-Log and F-Log2. */
function makeLogCurve(k: LogCurveConstants): TransferFunction {
  return {
    decode(value) {
      if (value < k.cutCode) return (value - k.f) / k.e;
      return (10 ** ((value - k.d) / k.c) - k.b) / k.a;
    },
    encode(value) {
      if (value < k.cutLinear) return k.e * value + k.f;
      return k.c * log10(k.a * value + k.b) + k.d;
    },
  };
}

const fLog = makeLogCurve({
  a: 0.555556,
  b: 0.009468,
  c: 0.344676,
  d: 0.790453,
  e: 8.735631,
  f: 0.092864,
  cutLinear: 0.00089,
  cutCode: 0.100537775223865,
});

const fLog2 = makeLogCurve({
  a: 5.555556,
  b: 0.064829,
  c: 0.245281,
  d: 0.384316,
  e: 8.799461,
  f: 0.092864,
  cutLinear: 0.000889,
  cutCode: 0.100686685370811,
});

// ---------------------------------------------------------------------------
// Nikon, DJI, RED, Blackmagic
// ---------------------------------------------------------------------------

const nLog: TransferFunction = {
  decode(value) {
    if (value < 452 / 1023) return ((value * 1023) / 650) ** 3 - 0.0075;
    return Math.exp((value * 1023 - 619) / 150);
  },
  encode(value) {
    if (value < 0.328) return (650 * Math.cbrt(Math.max(value + 0.0075, 0))) / 1023;
    return (150 * Math.log(value) + 619) / 1023;
  },
};

const dLog: TransferFunction = {
  decode(value) {
    if (value <= 0.14) return (value - 0.0929) / 6.025;
    return (10 ** ((value - 0.584555) / 0.256663) - 0.0108) / 0.9892;
  },
  encode(value) {
    if (value <= 0.0078) return 6.025 * value + 0.0929;
    return log10(value * 0.9892 + 0.0108) * 0.256663 + 0.584555;
  },
};

const LOG3G10 = { a: 0.224282, b: 155.975327, c: 0.01, g: 15.1927 } as const;

const log3G10: TransferFunction = {
  decode(value) {
    if (value < 0) return value / LOG3G10.g - LOG3G10.c;
    return (10 ** (value / LOG3G10.a) - 1) / LOG3G10.b - LOG3G10.c;
  },
  encode(value) {
    const shifted = value + LOG3G10.c;
    if (shifted < 0) return shifted * LOG3G10.g;
    return LOG3G10.a * log10(shifted * LOG3G10.b + 1);
  },
};

const BMD5 = {
  a: 0.08692876065491224,
  b: 0.005494072432257808,
  c: 0.5300133392291939,
  d: 8.283605932402494,
  e: 0.09246575342465753,
  cut: 0.005,
} as const;

const bmdFilmGen5: TransferFunction = {
  decode(value) {
    if (value < BMD5.d * BMD5.cut + BMD5.e) return (value - BMD5.e) / BMD5.d;
    return Math.exp((value - BMD5.c) / BMD5.a) - BMD5.b;
  },
  encode(value) {
    if (value < BMD5.cut) return BMD5.d * value + BMD5.e;
    return BMD5.a * Math.log(Math.max(value + BMD5.b, 1e-9)) + BMD5.c;
  },
};

// ---------------------------------------------------------------------------
// Broadcast HDR and SDR
// ---------------------------------------------------------------------------

const HLG_A = 0.17883277;
const HLG_B = 0.28466892;
const HLG_C = 0.55991073;

/** Scene light at HLG's 75% reference signal, used to put diffuse white at 1.0. */
const HLG_REFERENCE_WHITE =
  (Math.exp((0.75 - HLG_C) / HLG_A) + HLG_B) / 12;

const hlg: TransferFunction = {
  decode(value) {
    const scene =
      value <= 0.5 ? (value * value) / 3 : (Math.exp((value - HLG_C) / HLG_A) + HLG_B) / 12;
    return scene / HLG_REFERENCE_WHITE;
  },
  encode(value) {
    const scene = value * HLG_REFERENCE_WHITE;
    if (scene <= 1 / 12) return Math.sqrt(Math.max(3 * scene, 0));
    return HLG_A * Math.log(12 * scene - HLG_B) + HLG_C;
  },
};

const PQ_M1 = 0.1593017578125;
const PQ_M2 = 78.84375;
const PQ_C1 = 0.8359375;
const PQ_C2 = 18.8515625;
const PQ_C3 = 18.6875;
/** PQ is absolute; 100 cd/m^2 is the SDR reference white this maps to 1.0. */
const PQ_REFERENCE_NITS = 100;

const pq: TransferFunction = {
  decode(value) {
    const encoded = Math.max(value, 0) ** (1 / PQ_M2);
    const numerator = Math.max(encoded - PQ_C1, 0);
    const denominator = PQ_C2 - PQ_C3 * encoded;
    if (denominator <= 0) return 0;
    return ((numerator / denominator) ** (1 / PQ_M1) * 10000) / PQ_REFERENCE_NITS;
  },
  encode(value) {
    const nits = (Math.max(value, 0) * PQ_REFERENCE_NITS) / 10000;
    const powered = nits ** PQ_M1;
    return ((PQ_C1 + PQ_C2 * powered) / (1 + PQ_C3 * powered)) ** PQ_M2;
  },
};

/** ITU-R BT.709 OETF. The camera-side curve, not the BT.1886 display EOTF. */
const rec709: TransferFunction = {
  decode(value) {
    if (value < 0.081) return value / 4.5;
    return ((value + 0.099) / 1.099) ** (1 / 0.45);
  },
  encode(value) {
    if (value < 0.018) return 4.5 * value;
    return 1.099 * value ** 0.45 - 0.099;
  },
};

const srgb: TransferFunction = {
  decode(value) {
    if (value <= 0.04045) return value / 12.92;
    return ((value + 0.055) / 1.055) ** 2.4;
  },
  encode(value) {
    if (value <= 0.0031308) return value * 12.92;
    return 1.055 * value ** (1 / 2.4) - 0.055;
  },
};

const linear: TransferFunction = {
  decode: (value) => value,
  encode: (value) => value,
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const TRANSFERS = {
  sLog3: { ...sLog3, label: "S-Log3", kind: "scene" },
  sLog2: { ...sLog2, label: "S-Log2", kind: "scene" },
  vLog: { ...vLog, label: "V-Log", kind: "scene" },
  cLog3: { ...cLog3, label: "Canon Log 3", kind: "scene" },
  cLog2: { ...cLog2, label: "Canon Log 2", kind: "scene" },
  logC3: { ...logC3, label: "ARRI LogC3 (EI 800)", kind: "scene" },
  logC4: { ...logC4, label: "ARRI LogC4", kind: "scene" },
  fLog: { ...fLog, label: "F-Log", kind: "scene" },
  fLog2: { ...fLog2, label: "F-Log2", kind: "scene" },
  nLog: { ...nLog, label: "N-Log", kind: "scene" },
  dLog: { ...dLog, label: "D-Log", kind: "scene" },
  log3G10: { ...log3G10, label: "REDLog3G10", kind: "scene" },
  bmdFilmGen5: { ...bmdFilmGen5, label: "Blackmagic Film Gen 5", kind: "scene" },
  hlg: { ...hlg, label: "HLG (BT.2100)", kind: "scene" },
  pq: { ...pq, label: "PQ / ST 2084", kind: "scene" },
  rec709: { ...rec709, label: "Rec.709 (BT.709 OETF)", kind: "display" },
  srgb: { ...srgb, label: "sRGB", kind: "display" },
  linear: { ...linear, label: "Lineal", kind: "display" },
} as const satisfies Record<string, TransferSpec>;

export type TransferId = keyof typeof TRANSFERS;

/**
 * Where 18% grey lands on each curve, as a 0..1 code value.
 *
 * Computed, never tabulated: the numbers a colourist quotes ("S-Log3 grey sits
 * at 41 IRE") are then a property of the curve this module actually applies,
 * so a mistake in a constant shows up in the UI instead of hiding in a LUT.
 */
export function midGreyCode(id: TransferId): number {
  return TRANSFERS[id].encode(0.18);
}

/** Reflectance at code 1.0 — how much highlight headroom the curve carries. */
export function headroomStops(id: TransferId): number {
  const ceiling = TRANSFERS[id].decode(1);
  if (!(ceiling > 0.18)) return 0;
  return Math.log2(ceiling / 0.18);
}
