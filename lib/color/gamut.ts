/**
 * Colour gamuts: primaries in, 3x3 matrices out.
 *
 * Every camera gamut here is stored as chromaticities rather than as a
 * pre-baked matrix. The matrices are then derived with the standard
 * SMPTE RP 177 construction (primaries + white point -> RGB->XYZ) and chained
 * through a Bradford adaptation when the white points differ.
 *
 * That is deliberate. A hand-copied matrix is one transposed digit away from a
 * green cast that nobody notices until the footage is on a client's timeline,
 * and there is no way to check it. Chromaticities, by contrast, come straight
 * off the manufacturer's datasheet and the derivation is verifiable: the tests
 * re-derive Sony's, Panasonic's, Canon's and ARRI's published matrices from
 * these numbers and compare against the published values.
 */

/** A 3x3 matrix in row-major order. */
export type Matrix3 = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
];

export interface Chromaticity {
  x: number;
  y: number;
}

export interface GamutPrimaries {
  red: Chromaticity;
  green: Chromaticity;
  blue: Chromaticity;
  white: Chromaticity;
}

export const D65: Chromaticity = { x: 0.3127, y: 0.329 };

/**
 * Camera and delivery gamuts.
 *
 * Sources: Sony "S-Gamut3/S-Gamut3.Cine" technical summary, Panasonic V-Log/
 * V-Gamut reference manual, Canon "Cinema Gamut" white paper, ARRI ALEXA LogC
 * (AWG3) and ALEXA 35 (AWG4) specifications, DJI D-Log/D-Gamut white paper,
 * RED "White Paper on REDWideGamutRGB and Log3G10", Blackmagic Generation 5
 * Color Science, ITU-R BT.709-6 and BT.2020-2.
 *
 * Note the negative blue-y values: these gamuts are deliberately larger than
 * anything physically realisable, which is why a naive conversion to Rec.709
 * produces negative channel values. `compressGamut` in `tonemap.ts` is what
 * deals with those rather than clipping them.
 */
export const GAMUTS = {
  rec709: {
    red: { x: 0.64, y: 0.33 },
    green: { x: 0.3, y: 0.6 },
    blue: { x: 0.15, y: 0.06 },
    white: D65,
  },
  rec2020: {
    red: { x: 0.708, y: 0.292 },
    green: { x: 0.17, y: 0.797 },
    blue: { x: 0.131, y: 0.046 },
    white: D65,
  },
  sGamut3: {
    red: { x: 0.73, y: 0.28 },
    green: { x: 0.14, y: 0.855 },
    blue: { x: 0.1, y: -0.05 },
    white: D65,
  },
  sGamut3Cine: {
    red: { x: 0.766, y: 0.275 },
    green: { x: 0.225, y: 0.8 },
    blue: { x: 0.089, y: -0.087 },
    white: D65,
  },
  vGamut: {
    red: { x: 0.73, y: 0.28 },
    green: { x: 0.165, y: 0.84 },
    blue: { x: 0.1, y: -0.03 },
    white: D65,
  },
  cinemaGamut: {
    red: { x: 0.74, y: 0.27 },
    green: { x: 0.17, y: 1.14 },
    blue: { x: 0.08, y: -0.1 },
    white: D65,
  },
  arriWideGamut3: {
    red: { x: 0.684, y: 0.313 },
    green: { x: 0.221, y: 0.848 },
    blue: { x: 0.0861, y: -0.102 },
    white: D65,
  },
  arriWideGamut4: {
    red: { x: 0.7347, y: 0.2653 },
    green: { x: 0.1424, y: 0.8576 },
    blue: { x: 0.0991, y: -0.0308 },
    white: D65,
  },
  dGamut: {
    red: { x: 0.71, y: 0.31 },
    green: { x: 0.21, y: 0.88 },
    blue: { x: 0.09, y: -0.08 },
    white: D65,
  },
  redWideGamut: {
    red: { x: 0.780308, y: 0.304253 },
    green: { x: 0.121595, y: 1.493994 },
    blue: { x: 0.095612, y: -0.084589 },
    white: D65,
  },
  blackmagicWideGamut: {
    red: { x: 0.7177215, y: 0.3171181 },
    green: { x: 0.228041, y: 0.861569 },
    blue: { x: 0.1005841, y: -0.0820452 },
    white: { x: 0.312717, y: 0.3290312 },
  },
} as const satisfies Record<string, GamutPrimaries>;

export type GamutId = keyof typeof GAMUTS;

export const GAMUT_LABELS: Record<GamutId, string> = {
  rec709: "Rec.709",
  rec2020: "Rec.2020 / F-Gamut / N-Gamut",
  sGamut3: "S-Gamut3",
  sGamut3Cine: "S-Gamut3.Cine",
  vGamut: "V-Gamut",
  cinemaGamut: "Cinema Gamut",
  arriWideGamut3: "ARRI Wide Gamut 3",
  arriWideGamut4: "ARRI Wide Gamut 4",
  dGamut: "DJI D-Gamut",
  redWideGamut: "REDWideGamutRGB",
  blackmagicWideGamut: "Blackmagic Wide Gamut",
};

// ---------------------------------------------------------------------------
// Matrix helpers
// ---------------------------------------------------------------------------

export function multiply(a: Matrix3, b: Matrix3): Matrix3 {
  const out = new Array<number>(9);
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      out[row * 3 + column] =
        a[row * 3] * b[column] +
        a[row * 3 + 1] * b[3 + column] +
        a[row * 3 + 2] * b[6 + column];
    }
  }
  return out as unknown as Matrix3;
}

export function invert(m: Matrix3): Matrix3 {
  const [a, b, c, d, e, f, g, h, i] = m;
  const determinant =
    a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  if (Math.abs(determinant) < 1e-12) {
    throw new Error("Matriz singular: las primarias no forman un gamut válido.");
  }
  const inverseDeterminant = 1 / determinant;
  return [
    (e * i - f * h) * inverseDeterminant,
    (c * h - b * i) * inverseDeterminant,
    (b * f - c * e) * inverseDeterminant,
    (f * g - d * i) * inverseDeterminant,
    (a * i - c * g) * inverseDeterminant,
    (c * d - a * f) * inverseDeterminant,
    (d * h - e * g) * inverseDeterminant,
    (b * g - a * h) * inverseDeterminant,
    (a * e - b * d) * inverseDeterminant,
  ];
}

export function applyMatrix(
  m: Matrix3,
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  return [
    m[0] * r + m[1] * g + m[2] * b,
    m[3] * r + m[4] * g + m[5] * b,
    m[6] * r + m[7] * g + m[8] * b,
  ];
}

/** Chromaticity to a unit-luminance XYZ triple. */
function toXyz(c: Chromaticity): [number, number, number] {
  if (Math.abs(c.y) < 1e-9) {
    throw new Error("Cromaticidad inválida: y = 0.");
  }
  return [c.x / c.y, 1, (1 - c.x - c.y) / c.y];
}

/**
 * RGB -> XYZ for a set of primaries (SMPTE RP 177).
 *
 * The primaries fix the *directions* of the three columns; the white point
 * fixes their lengths, by requiring that RGB (1,1,1) lands exactly on the
 * white point.
 */
export function rgbToXyzMatrix(primaries: GamutPrimaries): Matrix3 {
  const [xr, yr, zr] = toXyz(primaries.red);
  const [xg, yg, zg] = toXyz(primaries.green);
  const [xb, yb, zb] = toXyz(primaries.blue);
  const directions: Matrix3 = [xr, xg, xb, yr, yg, yb, zr, zg, zb];
  const white = toXyz(primaries.white);
  const [sr, sg, sb] = applyMatrix(invert(directions), white[0], white[1], white[2]);
  return [
    xr * sr, xg * sg, xb * sb,
    yr * sr, yg * sg, yb * sb,
    zr * sr, zg * sg, zb * sb,
  ];
}

/** Bradford cone response, the CAT used by ACES and by every NLE worth trusting. */
const BRADFORD: Matrix3 = [
  0.8951, 0.2664, -0.1614,
  -0.7502, 1.7135, 0.0367,
  0.0389, -0.0685, 1.0296,
];

/** Chromatic adaptation from one white point to another. */
export function adaptationMatrix(from: Chromaticity, to: Chromaticity): Matrix3 {
  const source = toXyz(from);
  const destination = toXyz(to);
  const [sourceR, sourceG, sourceB] = applyMatrix(BRADFORD, source[0], source[1], source[2]);
  const [destinationR, destinationG, destinationB] = applyMatrix(
    BRADFORD,
    destination[0],
    destination[1],
    destination[2],
  );
  const scale: Matrix3 = [
    destinationR / sourceR, 0, 0,
    0, destinationG / sourceG, 0,
    0, 0, destinationB / sourceB,
  ];
  return multiply(invert(BRADFORD), multiply(scale, BRADFORD));
}

const conversionCache = new Map<string, Matrix3>();

/**
 * Linear `source` RGB -> linear `destination` RGB.
 *
 * Cached because the LUT builder asks for the same matrix once per grid node
 * and a 33^3 grid is 35 937 nodes.
 */
export function gamutMatrix(source: GamutId, destination: GamutId): Matrix3 {
  const key = `${source}>${destination}`;
  const cached = conversionCache.get(key);
  if (cached) return cached;

  const sourcePrimaries = GAMUTS[source];
  const destinationPrimaries = GAMUTS[destination];
  const toXyzMatrix = rgbToXyzMatrix(sourcePrimaries);
  const fromXyzMatrix = invert(rgbToXyzMatrix(destinationPrimaries));

  const sameWhite =
    Math.abs(sourcePrimaries.white.x - destinationPrimaries.white.x) < 1e-6 &&
    Math.abs(sourcePrimaries.white.y - destinationPrimaries.white.y) < 1e-6;

  const matrix = sameWhite
    ? multiply(fromXyzMatrix, toXyzMatrix)
    : multiply(
        fromXyzMatrix,
        multiply(
          adaptationMatrix(sourcePrimaries.white, destinationPrimaries.white),
          toXyzMatrix,
        ),
      );

  conversionCache.set(key, matrix);
  return matrix;
}
