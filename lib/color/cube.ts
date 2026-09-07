/**
 * Reading, writing, validating and sampling Adobe `.cube` 3D LUTs.
 *
 * The format is defined by the Adobe Cube LUT Specification 1.0. Two details in
 * it are responsible for most broken LUTs in the wild, and both are handled
 * explicitly here:
 *
 *  1. **Red varies fastest.** The entry order is red inner, then green, then
 *     blue. Writing the loops the other way round produces a file that parses
 *     cleanly, loads without complaint and swaps the red and blue channels of
 *     everything it touches.
 *  2. **The values are floats, not 8-bit codes.** A file full of `0 255 128`
 *     is a valid parse and a completely white image.
 *
 * `validateCube` exists so that no file leaves this module without those two
 * things having been checked against the actual numbers.
 */

export interface CubeMetadata {
  /** Free-form lines written as `#` comments above the header. */
  notes: string[];
}

export interface Cube {
  title: string;
  size: number;
  domainMin: [number, number, number];
  domainMax: [number, number, number];
  /** `size^3 * 3` floats, red index varying fastest. */
  data: Float32Array;
  notes: string[];
}

export const MIN_LUT_SIZE = 2;
export const MAX_LUT_SIZE = 65;

/** Index of the (r, g, b) grid node in `Cube.data`, in floats. */
export function nodeOffset(size: number, r: number, g: number, b: number): number {
  return (r + size * (g + size * b)) * 3;
}

export function createCube(
  size: number,
  title: string,
  notes: string[] = [],
): Cube {
  if (!Number.isInteger(size) || size < MIN_LUT_SIZE || size > MAX_LUT_SIZE) {
    throw new Error(`Tamaño de LUT inválido: ${size}. Debe estar entre ${MIN_LUT_SIZE} y ${MAX_LUT_SIZE}.`);
  }
  return {
    title,
    size,
    domainMin: [0, 0, 0],
    domainMax: [1, 1, 1],
    data: new Float32Array(size * size * size * 3),
    notes,
  };
}

// ---------------------------------------------------------------------------
// Serialising
// ---------------------------------------------------------------------------

/** Six decimals: below the precision of any 12-bit pipeline, above the noise. */
function formatValue(value: number): string {
  const safe = Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0;
  return safe.toFixed(6);
}

export function serializeCube(cube: Cube): string {
  const lines: string[] = [];
  for (const note of cube.notes) {
    // A stray newline inside a note would break out of the comment.
    for (const line of note.split(/\r?\n/)) lines.push(`# ${line}`);
  }
  // The title is quoted, so an embedded quote has to go.
  lines.push(`TITLE "${cube.title.replace(/"/g, "'")}"`);
  lines.push("");
  lines.push(`LUT_3D_SIZE ${cube.size}`);
  lines.push(`DOMAIN_MIN ${cube.domainMin.map(formatValue).join(" ")}`);
  lines.push(`DOMAIN_MAX ${cube.domainMax.map(formatValue).join(" ")}`);
  lines.push("");

  const count = cube.size ** 3;
  for (let index = 0; index < count; index += 1) {
    const at = index * 3;
    lines.push(
      `${formatValue(cube.data[at])} ${formatValue(cube.data[at + 1])} ${formatValue(cube.data[at + 2])}`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export function parseCube(text: string): Cube {
  let size = 0;
  let title = "";
  const notes: string[] = [];
  let domainMin: [number, number, number] = [0, 0, 0];
  let domainMax: [number, number, number] = [1, 1, 1];
  const values: number[] = [];

  const triple = (parts: string[], where: string): [number, number, number] => {
    if (parts.length !== 3) throw new Error(`${where}: se esperaban 3 valores.`);
    const parsed = parts.map(Number);
    if (parsed.some((value) => !Number.isFinite(value))) {
      throw new Error(`${where}: valor no numérico.`);
    }
    return parsed as [number, number, number];
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "") continue;
    if (line.startsWith("#")) {
      notes.push(line.slice(1).trim());
      continue;
    }

    const parts = line.split(/\s+/);
    const keyword = parts[0].toUpperCase();

    if (keyword === "TITLE") {
      title = line.slice(line.indexOf("TITLE") + 5).trim().replace(/^"|"$/g, "");
    } else if (keyword === "LUT_3D_SIZE") {
      size = Number(parts[1]);
    } else if (keyword === "DOMAIN_MIN") {
      domainMin = triple(parts.slice(1), "DOMAIN_MIN");
    } else if (keyword === "DOMAIN_MAX") {
      domainMax = triple(parts.slice(1), "DOMAIN_MAX");
    } else if (keyword === "LUT_1D_SIZE") {
      throw new Error("Es un LUT 1D; este módulo sólo maneja LUTs 3D .cube.");
    } else {
      const [r, g, b] = triple(parts, `Línea de datos ${values.length / 3 + 1}`);
      values.push(r, g, b);
    }
  }

  if (!Number.isInteger(size) || size < MIN_LUT_SIZE || size > MAX_LUT_SIZE) {
    throw new Error(`Falta o es inválido LUT_3D_SIZE (leído: ${size}).`);
  }
  const expected = size ** 3 * 3;
  if (values.length !== expected) {
    throw new Error(
      `El archivo declara LUT_3D_SIZE ${size} (${expected / 3} entradas) pero contiene ${values.length / 3}.`,
    );
  }

  return { title, size, domainMin, domainMax, data: Float32Array.from(values), notes };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface CubeValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Checks that a cube is structurally valid *and* behaves like a LUT.
 *
 * The structural half is the specification. The behavioural half is the part
 * that catches the mistakes that still load: a LUT written in 0..255, a LUT
 * whose channels came out transposed, a LUT that clips a quarter of its own
 * output range to pure white.
 */
export function validateCube(cube: Cube): CubeValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Number.isInteger(cube.size) || cube.size < MIN_LUT_SIZE || cube.size > MAX_LUT_SIZE) {
    errors.push(`LUT_3D_SIZE fuera de rango: ${cube.size}.`);
  }
  const expected = cube.size ** 3 * 3;
  if (cube.data.length !== expected) {
    errors.push(`Se esperaban ${expected / 3} entradas y hay ${cube.data.length / 3}.`);
  }
  if (cube.title.trim() === "") warnings.push("El LUT no tiene TITLE.");

  if (errors.length > 0) return { valid: false, errors, warnings };

  let clippedLow = 0;
  let clippedHigh = 0;
  let outOfRange = 0;
  for (let index = 0; index < cube.data.length; index += 1) {
    const value = cube.data[index];
    if (!Number.isFinite(value)) {
      errors.push(`Valor no finito en la posición ${index}.`);
      break;
    }
    if (value < 0 || value > 1) outOfRange += 1;
    if (value <= 0) clippedLow += 1;
    if (value >= 1) clippedHigh += 1;
  }
  if (outOfRange > 0) {
    errors.push(`${outOfRange} valores fuera del dominio 0..1.`);
  }

  const total = cube.data.length;
  // The corners are legitimately 0 and 1, so a handful of clipped samples is
  // expected; a large fraction means the transform is throwing away range.
  if (clippedHigh / total > 0.1) {
    warnings.push(
      `${((clippedHigh / total) * 100).toFixed(1)}% de los valores están en 1.0: hay recorte en altas luces.`,
    );
  }
  if (clippedLow / total > 0.1) {
    warnings.push(
      `${((clippedLow / total) * 100).toFixed(1)}% de los valores están en 0.0: los negros están aplastados.`,
    );
  }

  // A transposed write shows up immediately: pure red in must stay reddest out.
  const last = cube.size - 1;
  const red = sampleNode(cube, last, 0, 0);
  const blue = sampleNode(cube, 0, 0, last);
  if (red[0] < red[2] || blue[2] < blue[0]) {
    errors.push(
      "El orden de los datos es incorrecto: el rojo puro no sale rojo. " +
        "En .cube el índice rojo es el que varía más rápido.",
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function sampleNode(cube: Cube, r: number, g: number, b: number): [number, number, number] {
  const at = nodeOffset(cube.size, r, g, b);
  return [cube.data[at], cube.data[at + 1], cube.data[at + 2]];
}

// ---------------------------------------------------------------------------
// Sampling
// ---------------------------------------------------------------------------

/**
 * Trilinear interpolation, the same thing the NLE does when it applies the LUT.
 *
 * Used for the preview and by the tests: checking the interpolated result
 * rather than the grid nodes is what proves a 17-node LUT still behaves between
 * its nodes, which is where banding would show up.
 */
export function sampleCube(
  cube: Cube,
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const last = cube.size - 1;
  const axis = (value: number, index: 0 | 1 | 2) => {
    const min = cube.domainMin[index];
    const max = cube.domainMax[index];
    const normalized = max > min ? (value - min) / (max - min) : 0;
    return Math.min(Math.max(normalized, 0), 1) * last;
  };

  const positions = [axis(r, 0), axis(g, 1), axis(b, 2)] as const;
  const base = positions.map((value) => Math.min(Math.floor(value), last - 1 < 0 ? 0 : last - 1));
  const fraction = positions.map((value, index) => value - base[index]);

  const out: [number, number, number] = [0, 0, 0];
  for (let corner = 0; corner < 8; corner += 1) {
    const dr = corner & 1;
    const dg = (corner >> 1) & 1;
    const db = (corner >> 2) & 1;
    const weight =
      (dr ? fraction[0] : 1 - fraction[0]) *
      (dg ? fraction[1] : 1 - fraction[1]) *
      (db ? fraction[2] : 1 - fraction[2]);
    if (weight === 0) continue;
    const at = nodeOffset(
      cube.size,
      Math.min(base[0] + dr, last),
      Math.min(base[1] + dg, last),
      Math.min(base[2] + db, last),
    );
    out[0] += cube.data[at] * weight;
    out[1] += cube.data[at + 1] * weight;
    out[2] += cube.data[at + 2] * weight;
  }
  return out;
}
