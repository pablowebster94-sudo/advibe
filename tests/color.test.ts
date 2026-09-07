import { test } from "node:test";
import assert from "node:assert/strict";

import {
  GAMUTS,
  applyMatrix,
  gamutMatrix,
  invert,
  multiply,
  rgbToXyzMatrix,
  type Matrix3,
} from "../lib/color/gamut";
import { TRANSFERS, headroomStops, midGreyCode, type TransferId } from "../lib/color/transfer";
import {
  NEUTRAL_TONE_CURVE,
  compressGamut,
  creativeWhiteBalance,
  renderToDisplay,
  toneCurve,
  toneCurveInverse,
  withContrast,
} from "../lib/color/tonemap";
import {
  NEUTRAL_LOOK,
  applyLook,
  hueSaturationCeiling,
  skinWeight,
  type LookOptions,
} from "../lib/color/look";
import {
  createCube,
  nodeOffset,
  parseCube,
  sampleCube,
  serializeCube,
  validateCube,
} from "../lib/color/cube";
import {
  CAMERA_PROFILES,
  LOOK_PRESETS,
  findCameraProfile,
  findLookPreset,
} from "../lib/color/presets";
import { buildLut, resolveTechnical, transformPixel } from "../lib/color/pipeline";
import {
  analyzeClip,
  analyzeFootage,
  proxyFrame,
  renderFrame,
  summarizeClip,
  type ClipAnalysis,
} from "../lib/color/analyze";
import { deriveCorrection, isNeutralCorrection } from "../lib/color/correction";
import { SKIN_HUE_MAX, SKIN_HUE_MIN } from "../lib/photo/editing/skinGuard";
import { rgbToHsv } from "../lib/photo/analysis/image";

const TRANSFER_IDS = Object.keys(TRANSFERS) as TransferId[];

function closeTo(actual: number, expected: number, tolerance: number, what: string) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${what}: ${actual} no está dentro de ±${tolerance} de ${expected}`,
  );
}

// ---------------------------------------------------------------------------
// Gamut
// ---------------------------------------------------------------------------

/**
 * The published RGB->XYZ matrices, straight off the manufacturers' data
 * sheets. These are the anchor for the whole module: if the derivation from
 * chromaticities reproduces them, every other matrix derived the same way is
 * trustworthy, including the ones (AWG4, D-Gamut, REDWideGamutRGB) whose
 * Rec.709 form is not published anywhere convenient.
 */
const PUBLISHED_RGB_TO_XYZ: Array<[keyof typeof GAMUTS, Matrix3]> = [
  [
    "sGamut3",
    [
      0.7064827, 0.128801, 0.1151722,
      0.2709797, 0.7866064, -0.0575861,
      -0.0096778, 0.0046, 1.0941356,
    ],
  ],
  [
    "vGamut",
    [
      0.679644, 0.152211, 0.1186,
      0.260686, 0.774894, -0.03558,
      -0.00931, -0.004612, 1.10298,
    ],
  ],
  [
    "arriWideGamut3",
    [
      0.638008, 0.214704, 0.097744,
      0.291954, 0.823841, -0.115795,
      0.002798, -0.067034, 1.153294,
    ],
  ],
  [
    "arriWideGamut4",
    [
      0.7048583, 0.1297602, 0.1158373,
      0.2545241, 0.7814777, -0.0360018,
      0, 0, 1.0890578,
    ],
  ],
  [
    "rec709",
    [
      0.4123908, 0.3575843, 0.1804808,
      0.212639, 0.7151687, 0.0721923,
      0.0193308, 0.1191948, 0.9505322,
    ],
  ],
  [
    "rec2020",
    [
      0.636958, 0.1446169, 0.168881,
      0.2627002, 0.6779981, 0.0593017,
      0, 0.0280727, 1.0609851,
    ],
  ],
];

test("las matrices RGB->XYZ derivadas coinciden con las publicadas", () => {
  for (const [id, published] of PUBLISHED_RGB_TO_XYZ) {
    const derived = rgbToXyzMatrix(GAMUTS[id]);
    for (let index = 0; index < 9; index += 1) {
      closeTo(derived[index], published[index], 1e-5, `${id}[${index}]`);
    }
  }
});

test("cada gamut mapea su blanco a blanco en Rec.709", () => {
  for (const id of Object.keys(GAMUTS) as Array<keyof typeof GAMUTS>) {
    const [r, g, b] = applyMatrix(gamutMatrix(id, "rec709"), 1, 1, 1);
    // A row that does not sum to 1 is a matrix that tints every neutral in the
    // frame, which is the single most damaging thing a conversion can do.
    closeTo(r, 1, 1e-6, `${id} blanco R`);
    closeTo(g, 1, 1e-6, `${id} blanco G`);
    closeTo(b, 1, 1e-6, `${id} blanco B`);
  }
});

test("Rec.709 a Rec.709 es la identidad y las conversiones son reversibles", () => {
  const identity = gamutMatrix("rec709", "rec709");
  for (let index = 0; index < 9; index += 1) {
    closeTo(identity[index], index % 4 === 0 ? 1 : 0, 1e-9, `identidad[${index}]`);
  }
  for (const id of Object.keys(GAMUTS) as Array<keyof typeof GAMUTS>) {
    const round = multiply(gamutMatrix("rec709", id), gamutMatrix(id, "rec709"));
    for (let index = 0; index < 9; index += 1) {
      closeTo(round[index], index % 4 === 0 ? 1 : 0, 1e-9, `${id} ida y vuelta[${index}]`);
    }
  }
});

test("invert es la inversa real, no una transpuesta", () => {
  const m = rgbToXyzMatrix(GAMUTS.sGamut3Cine);
  const product = multiply(m, invert(m));
  for (let index = 0; index < 9; index += 1) {
    closeTo(product[index], index % 4 === 0 ? 1 : 0, 1e-9, `producto[${index}]`);
  }
});

// ---------------------------------------------------------------------------
// Transfer functions
// ---------------------------------------------------------------------------

test("decode y encode son inversas en todo el rango de código", () => {
  for (const id of TRANSFER_IDS) {
    const curve = TRANSFERS[id];
    for (let step = 0; step <= 100; step += 1) {
      const code = step / 100;
      const back = curve.encode(curve.decode(code));
      closeTo(back, code, 1e-5, `${id} ida y vuelta en ${code}`);
    }
  }
});

test("todas las curvas son monótonas crecientes", () => {
  for (const id of TRANSFER_IDS) {
    const curve = TRANSFERS[id];
    let previous = -Infinity;
    for (let step = 0; step <= 200; step += 1) {
      const value = curve.decode(step / 200);
      assert.ok(value > previous, `${id} no es monótona en ${step / 200}`);
      previous = value;
    }
  }
});

/**
 * Where each manufacturer says 18% grey sits on their curve. These are the
 * numbers printed on the camera's own waveform, so they are the check that
 * matters: a curve that puts grey in the wrong place is wrong by exactly the
 * amount the whole image will be off.
 */
test("el gris 18% cae donde el fabricante lo publica", () => {
  const published: Array<[TransferId, number, number]> = [
    ["sLog3", 0.41, 0.002],
    ["sLog2", 0.32, 0.005],
    ["vLog", 0.423, 0.002],
    ["cLog3", 0.331, 0.002],
    ["logC3", 0.391, 0.002],
    ["logC4", 0.2784, 0.0005],
    ["fLog", 0.4593, 0.002],
    ["fLog2", 0.391, 0.002],
    ["log3G10", 0.3332, 0.002],
    ["rec709", 0.409, 0.002],
  ];
  for (const [id, expected, tolerance] of published) {
    closeTo(midGreyCode(id), expected, tolerance, `gris 18% de ${id}`);
  }
});

test("los niveles de negro de Canon Log coinciden con los publicados", () => {
  closeTo(TRANSFERS.cLog3.encode(0), 0.125, 0.001, "negro de Canon Log 3");
  closeTo(TRANSFERS.cLog2.encode(0), 0.0929, 0.001, "negro de Canon Log 2");
});

test("las curvas log llevan más margen de altas luces que Rec.709", () => {
  // The entire reason for shooting log. If a curve reports less headroom than
  // a display gamma, its constants are wrong.
  const displayHeadroom = headroomStops("rec709");
  for (const id of TRANSFER_IDS) {
    if (TRANSFERS[id].kind !== "scene") continue;
    assert.ok(
      headroomStops(id) > displayHeadroom,
      `${id} declara ${headroomStops(id)} pasos, menos que Rec.709`,
    );
  }
  assert.ok(headroomStops("logC4") > 11, "LogC4 debería superar los 11 pasos sobre gris");
});

// ---------------------------------------------------------------------------
// Tone curve
// ---------------------------------------------------------------------------

test("la curva de tono clava sus dos anclas", () => {
  closeTo(toneCurve(0.18, NEUTRAL_TONE_CURVE), 0.41, 1e-9, "gris 18%");
  closeTo(toneCurve(1, NEUTRAL_TONE_CURVE), 0.9, 1e-9, "blanco 100%");
});

test("la curva de tono nunca recorta, por brillante o oscuro que sea el valor", () => {
  // 20 stops over middle grey is far beyond any sensor; the curve still has to
  // return something below 1, because a value at 1 is detail that is gone.
  for (const linear of [1e-6, 0.001, 0.18, 1, 10, 100, 1000, 0.18 * 2 ** 20]) {
    const value = toneCurve(linear, NEUTRAL_TONE_CURVE);
    assert.ok(value > 0, `recorte en negros con ${linear}`);
    assert.ok(value < 1, `recorte en altas luces con ${linear}`);
  }
  assert.equal(toneCurve(0, NEUTRAL_TONE_CURVE), 0);
});

test("la curva de tono es monótona y su inversa es exacta", () => {
  let previous = -Infinity;
  for (let stop = -12; stop <= 14; stop += 0.25) {
    const linear = 0.18 * 2 ** stop;
    const display = toneCurve(linear, NEUTRAL_TONE_CURVE);
    assert.ok(display > previous, `no monótona en ${stop} pasos`);
    previous = display;
    const back = toneCurveInverse(display, NEUTRAL_TONE_CURVE);
    closeTo(back / linear, 1, 1e-6, `inversa en ${stop} pasos`);
  }
});

test("la curva de tono no tiene un codo en el pivote", () => {
  // C1 continuity: the slope has to match on both sides of middle grey, or a
  // visible edge appears exactly where skin lives.
  const delta = 1e-5;
  const at = (stops: number) => toneCurve(0.18 * 2 ** stops, NEUTRAL_TONE_CURVE);
  const below = (at(0) - at(-delta)) / delta;
  const above = (at(delta) - at(0)) / delta;
  closeTo(above, below, 1e-3, "pendiente a ambos lados del pivote");
  closeTo(below, NEUTRAL_TONE_CURVE.slopePerStop, 1e-3, "pendiente en el pivote");
});

test("withContrast sólo mueve la pendiente y deja el gris donde estaba", () => {
  const steeper = withContrast(20);
  closeTo(steeper.slopePerStop, NEUTRAL_TONE_CURVE.slopePerStop * 1.2, 1e-9, "pendiente");
  closeTo(toneCurve(0.18, steeper), 0.41, 1e-9, "gris con más contraste");
  assert.ok(toneCurve(1, steeper) > toneCurve(1, NEUTRAL_TONE_CURVE));
  assert.ok(toneCurve(0.02, steeper) < toneCurve(0.02, NEUTRAL_TONE_CURVE));
});

// ---------------------------------------------------------------------------
// Gamut compression and rendering
// ---------------------------------------------------------------------------

test("la compresión de gamut deja intacto lo que ya está dentro", () => {
  for (const colour of [
    [0.5, 0.5, 0.5],
    [0.8, 0.6, 0.4],
    [0.2, 0.19, 0.18],
    [1, 0.5, 0.3],
  ] as Array<[number, number, number]>) {
    const out = compressGamut(colour[0], colour[1], colour[2], 1);
    for (let channel = 0; channel < 3; channel += 1) {
      closeTo(out[channel], colour[channel], 1e-9, `canal ${channel} intacto`);
    }
  }
});

test("la compresión de gamut convierte negativos en positivos y es monótona", () => {
  let previous = -Infinity;
  for (let green = -1; green <= 0.2; green += 0.02) {
    const out = compressGamut(1, green, 0.5, 1);
    assert.ok(out[1] >= 0, `canal negativo sin comprimir en ${green}`);
    assert.ok(out[1] > previous, `no monótona en ${green}`);
    previous = out[1];
    closeTo(out[0], 1, 1e-9, "el canal más brillante no se toca");
  }
});

test("la rendición preserva el matiz de los primarios en vez de lavarlos", () => {
  // The failure this guards against: per-channel tone mapping washing a bright
  // saturated colour out to white long before it actually clips.
  for (const [name, colour] of [
    ["rojo", [8, 0.02, 0.02]],
    ["verde", [0.02, 8, 0.02]],
    ["azul", [0.02, 0.02, 8]],
  ] as Array<[string, [number, number, number]]>) {
    const out = renderToDisplay(colour[0], colour[1], colour[2], NEUTRAL_TONE_CURVE, 1);
    const brightest = out.indexOf(Math.max(...out));
    assert.equal(brightest, colour.indexOf(Math.max(...colour)), `${name} cambia de canal`);
    const hsv = rgbToHsv(out[0] * 255, out[1] * 255, out[2] * 255);
    assert.ok(hsv.s > 0.5, `${name} sale lavado (saturación ${hsv.s.toFixed(2)})`);
  }
});

test("el balance creativo mantiene el neutro neutro y va en la dirección correcta", () => {
  assert.equal(creativeWhiteBalance(0, 0), null);
  const warm = creativeWhiteBalance(60, 0);
  assert.ok(warm !== null);
  const [r, g, b] = applyMatrix(warm!, 0.18, 0.18, 0.18);
  assert.ok(r > g && g > b, "un ajuste cálido debe subir rojo y bajar azul");
  const cool = applyMatrix(creativeWhiteBalance(-60, 0)!, 0.18, 0.18, 0.18);
  assert.ok(cool[2] > cool[0], "un ajuste frío debe subir azul");
});

// ---------------------------------------------------------------------------
// The look, and the skin rules it has to obey
// ---------------------------------------------------------------------------

/** Rec.709 display values for skin across a range of depths. */
const SKIN_PATCHES: Array<[string, [number, number, number]]> = [
  ["muy clara", [0.86, 0.72, 0.65]],
  ["clara", [0.75, 0.6, 0.52]],
  ["media", [0.6, 0.44, 0.35]],
  ["morena", [0.42, 0.29, 0.22]],
  ["oscura", [0.26, 0.17, 0.13]],
  ["muy oscura", [0.15, 0.1, 0.08]],
];

test("los parches de piel de referencia caen en la ventana de piel sana", () => {
  for (const [name, patch] of SKIN_PATCHES) {
    const hue = rgbToHsv(patch[0] * 255, patch[1] * 255, patch[2] * 255).h;
    assert.ok(
      hue >= SKIN_HUE_MIN && hue <= SKIN_HUE_MAX,
      `el parche "${name}" no es piel válida (${hue.toFixed(1)}°)`,
    );
  }
});

test("skinWeight vale 1 dentro de la ventana, 0 lejos, y no tiene escalón", () => {
  assert.equal(skinWeight(20), 1);
  assert.equal(skinWeight(SKIN_HUE_MIN), 1);
  assert.equal(skinWeight(SKIN_HUE_MAX), 1);
  assert.equal(skinWeight(120), 0);
  assert.equal(skinWeight(280), 0);
  let previous = skinWeight(SKIN_HUE_MAX);
  for (let hue = SKIN_HUE_MAX; hue <= SKIN_HUE_MAX + 8; hue += 0.25) {
    const value = skinWeight(hue);
    assert.ok(value <= previous + 1e-9, `skinWeight sube al alejarse en ${hue}`);
    assert.ok(Math.abs(value - previous) < 0.2, `escalón en ${hue}`);
    previous = value;
  }
});

test("la protección de piel retiene saturación en la cara y no en el resto", () => {
  const options: LookOptions = { ...NEUTRAL_LOOK, saturation: 60, skinProtection: 1 };
  const skin: [number, number, number] = [0.6, 0.44, 0.35];
  const foliage: [number, number, number] = [0.3, 0.5, 0.25];

  const skinOut = applyLook(skin, options);
  for (let channel = 0; channel < 3; channel += 1) {
    closeTo(skinOut[channel], skin[channel], 1e-9, `piel intacta con protección total`);
  }

  const foliageOut = applyLook(foliage, options);
  const before = rgbToHsv(foliage[0] * 255, foliage[1] * 255, foliage[2] * 255).s;
  const after = rgbToHsv(foliageOut[0] * 255, foliageOut[1] * 255, foliageOut[2] * 255).s;
  assert.ok(after > before, "el follaje sí debe saturarse");
});

test("ningún preset saca la piel de su ventana de tono ni la sobresatura", () => {
  for (const preset of LOOK_PRESETS) {
    for (const [name, patch] of SKIN_PATCHES) {
      const out = applyLook(patch, preset.look);
      const hsv = rgbToHsv(out[0] * 255, out[1] * 255, out[2] * 255);
      assert.ok(
        hsv.h >= SKIN_HUE_MIN - 2 && hsv.h <= SKIN_HUE_MAX + 2,
        `${preset.id} saca la piel "${name}" a ${hsv.h.toFixed(1)}°`,
      );
      assert.ok(
        hsv.s <= hueSaturationCeiling(hsv.h, preset.look.saturationCeiling) + 1e-6,
        `${preset.id} sobresatura la piel "${name}" (${hsv.s.toFixed(3)})`,
      );
    }
  }
});

test("el look nunca devuelve un valor fuera de 0..1", () => {
  const aggressive: LookOptions = {
    ...NEUTRAL_LOOK,
    saturation: 100,
    vibrance: 100,
    shadowLift: 100,
    skinProtection: 0,
    shadowToning: { hue: 210, strength: 100 },
    midtoneToning: { hue: 90, strength: 100 },
    highlightToning: { hue: 30, strength: 100 },
  };
  for (let r = 0; r <= 1; r += 0.1) {
    for (let g = 0; g <= 1; g += 0.1) {
      for (let b = 0; b <= 1; b += 0.1) {
        for (const out of [applyLook([r, g, b], aggressive), applyLook([r, g, b], NEUTRAL_LOOK)]) {
          for (const value of out) {
            assert.ok(Number.isFinite(value), `valor no finito en ${r},${g},${b}`);
            assert.ok(value >= -1e-9 && value <= 1 + 1e-9, `${value} fuera de rango`);
          }
        }
      }
    }
  }
});

// ---------------------------------------------------------------------------
// The .cube file itself
// ---------------------------------------------------------------------------

function identityCube(size: number) {
  const cube = createCube(size, "Identidad");
  const last = size - 1;
  for (let b = 0; b < size; b += 1) {
    for (let g = 0; g < size; g += 1) {
      for (let r = 0; r < size; r += 1) {
        const at = nodeOffset(size, r, g, b);
        cube.data[at] = r / last;
        cube.data[at + 1] = g / last;
        cube.data[at + 2] = b / last;
      }
    }
  }
  return cube;
}

test("un LUT identidad se serializa, se relee y sigue siendo la identidad", () => {
  const cube = identityCube(17);
  const parsed = parseCube(serializeCube(cube));
  assert.equal(parsed.size, 17);
  assert.equal(parsed.title, "Identidad");
  assert.equal(parsed.data.length, 17 ** 3 * 3);
  for (let index = 0; index < cube.data.length; index += 1) {
    closeTo(parsed.data[index], cube.data[index], 1e-6, `entrada ${index}`);
  }
  assert.equal(validateCube(parsed).valid, true);
});

test("el índice rojo es el que varía más rápido", () => {
  // The single most common way to ship a broken .cube. The second and fourth
  // data lines of an identity LUT tell you immediately which axis moved.
  const text = serializeCube(identityCube(2));
  const rows = text
    .split("\n")
    .filter((line) => /^[\d.]/.test(line))
    .map((line) => line.split(" ").map(Number));
  assert.deepEqual(rows[0], [0, 0, 0]);
  assert.deepEqual(rows[1], [1, 0, 0]);
  assert.deepEqual(rows[2], [0, 1, 0]);
  assert.deepEqual(rows[4], [0, 0, 1]);
});

test("la interpolación trilineal de la identidad devuelve la entrada", () => {
  const cube = identityCube(17);
  for (const value of [0, 0.13, 0.37, 0.5, 0.81, 1]) {
    const [r, g, b] = sampleCube(cube, value, 1 - value, 0.5);
    closeTo(r, value, 1e-6, "rojo interpolado");
    closeTo(g, 1 - value, 1e-6, "verde interpolado");
    closeTo(b, 0.5, 1e-6, "azul interpolado");
  }
});

test("la validación caza los archivos rotos", () => {
  const transposed = identityCube(9);
  // Swap the red and blue outputs: parses fine, ruins every frame.
  for (let index = 0; index < transposed.data.length; index += 3) {
    const red = transposed.data[index];
    transposed.data[index] = transposed.data[index + 2];
    transposed.data[index + 2] = red;
  }
  const result = validateCube(transposed);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("orden")));

  const outOfRange = identityCube(5);
  outOfRange.data[0] = 255;
  assert.equal(validateCube(outOfRange).valid, false);

  const nonFinite = identityCube(5);
  nonFinite.data[3] = Number.NaN;
  assert.equal(validateCube(nonFinite).valid, false);
});

test("el parser rechaza cuentas de entradas que no cuadran", () => {
  const text = serializeCube(identityCube(5)).replace("LUT_3D_SIZE 5", "LUT_3D_SIZE 9");
  assert.throws(() => parseCube(text), /LUT_3D_SIZE 9/);
  assert.throws(() => parseCube("LUT_1D_SIZE 32\n0 0 0\n"), /1D/);
  assert.throws(() => createCube(1, "x"), /inválido/);
  assert.throws(() => createCube(128, "x"), /inválido/);
});

test("los comentarios y el título sobreviven a la ida y vuelta", () => {
  const cube = createCube(2, 'Un "look"', ["línea uno", "línea dos"]);
  const parsed = parseCube(serializeCube(cube));
  assert.equal(parsed.title, "Un 'look'");
  assert.ok(parsed.notes.includes("línea uno"));
  assert.ok(parsed.notes.includes("línea dos"));
});

// ---------------------------------------------------------------------------
// End to end
// ---------------------------------------------------------------------------

test("todos los perfiles y looks producen un .cube válido y sin avisos", () => {
  for (const profile of CAMERA_PROFILES) {
    for (const preset of LOOK_PRESETS) {
      const { report } = buildLut({ name: preset.label, profile, preset, size: 17, exposureEv: 0 });
      assert.equal(
        report.validation.valid,
        true,
        `${profile.id} + ${preset.id}: ${report.validation.errors.join(" | ")}`,
      );
      assert.deepEqual(
        report.validation.warnings,
        [],
        `${profile.id} + ${preset.id} genera avisos`,
      );
    }
  }
});

test("el gris 18% de cada cámara sale donde la curva de tono lo pone", () => {
  for (const profile of CAMERA_PROFILES) {
    const grey = midGreyCode(profile.transfer);
    const out = transformPixel([grey, grey, grey], resolveTechnical(profile));
    // Material that is already display-referred has no transform to apply, so
    // grey has to come out exactly where it went in. Anything else would mean
    // the "creative" path is quietly re-rendering footage that was already
    // graded, which is the one thing it must never do.
    const expected =
      TRANSFERS[profile.transfer].kind === "scene" ? NEUTRAL_TONE_CURVE.greyTarget : grey;
    for (const channel of out) {
      closeTo(channel, expected, 0.005, `gris de ${profile.id}`);
    }
  }
});

test("la conversión técnica no aplasta negros ni revienta blancos", () => {
  for (const profile of CAMERA_PROFILES) {
    const preset = findLookPreset("neutral")!;
    const { report } = buildLut({ name: "t", profile, preset, size: 25, exposureEv: 0 });
    assert.equal(
      report.kind,
      TRANSFERS[profile.transfer].kind === "scene" ? "technical" : "creative",
    );
    assert.ok(report.measured.clippedHigh < 0.01, `${profile.id} revienta blancos`);
    assert.ok(report.measured.clippedLow < 0.01, `${profile.id} aplasta negros`);
    assert.equal(report.capcutIntensity, 100);
  }
});

test("un LUT técnico no depende del look seleccionado", () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  const first = buildLut({
    name: "t",
    profile,
    preset: findLookPreset("nocturno-urbano")!,
    size: 9,
    exposureEv: 0,
    technicalOnly: true,
  });
  const second = buildLut({
    name: "t",
    profile,
    preset: findLookPreset("pastel")!,
    size: 9,
    exposureEv: 0,
    technicalOnly: true,
  });
  assert.deepEqual(Array.from(first.cube.data), Array.from(second.cube.data));
  assert.equal(first.report.kind, "technical");
  assert.ok(first.report.fileName.includes("Tecnico"));
});

test("el tipo de LUT se clasifica por lo que realmente hace", () => {
  const log = findCameraProfile("panasonic-vlog")!;
  const display = findCameraProfile("rec709")!;
  const neutral = findLookPreset("neutral")!;
  const styled = findLookPreset("comercial-calido")!;

  assert.equal(buildLut({ name: "a", profile: log, preset: neutral, size: 5, exposureEv: 0 }).report.kind, "technical");
  assert.equal(buildLut({ name: "b", profile: log, preset: styled, size: 5, exposureEv: 0 }).report.kind, "combined");
  assert.equal(buildLut({ name: "c", profile: display, preset: styled, size: 5, exposureEv: 0 }).report.kind, "creative");
  // An exposure move alone is already more than a pure transform.
  assert.equal(buildLut({ name: "d", profile: log, preset: neutral, size: 5, exposureEv: 0.5 }).report.kind, "combined");
});

test("un LUT creativo sobre Rec.709 neutro es prácticamente la identidad", () => {
  const { cube } = buildLut({
    name: "id",
    profile: findCameraProfile("rec709")!,
    preset: findLookPreset("neutral")!,
    size: 17,
    exposureEv: 0,
  });
  for (const value of [0.1, 0.25, 0.41, 0.6, 0.85]) {
    const [r, g, b] = sampleCube(cube, value, value, value);
    closeTo(r, value, 0.01, `identidad en ${value} (R)`);
    closeTo(g, value, 0.01, `identidad en ${value} (G)`);
    closeTo(b, value, 0.01, `identidad en ${value} (B)`);
  }
});

/** Rec.709 display skin -> scene linear -> camera gamut -> camera code value. */
function skinAsCameraCode(
  patch: [number, number, number],
  profile: (typeof CAMERA_PROFILES)[number],
): [number, number, number] {
  const linear = patch.map((value) => toneCurveInverse(value, NEUTRAL_TONE_CURVE));
  const camera = applyMatrix(
    gamutMatrix("rec709", profile.gamut),
    linear[0],
    linear[1],
    linear[2],
  );
  const curve = TRANSFERS[profile.transfer];
  return camera.map((value) => Math.min(Math.max(curve.encode(value), 0), 1)) as [
    number,
    number,
    number,
  ];
}

/**
 * The rule the whole tool exists to keep: skin comes out of the transform
 * looking like skin, on every camera, under every look, at every depth.
 *
 * This asserts on the transform itself rather than on the interpolated grid.
 * That is the guarantee the maths can actually make — see the test below for
 * what the grid then does to it.
 */
test("la piel atraviesa la cadena completa sin salirse de su ventana", () => {
  for (const profile of CAMERA_PROFILES) {
    for (const preset of LOOK_PRESETS) {
      const resolved = {
        ...resolveTechnical(profile),
        look: preset.look,
        tone: preset.tone,
        warmth: preset.warmth,
        tint: preset.tint,
        whiteBalance: creativeWhiteBalance(preset.warmth, preset.tint),
      };
      for (const [name, patch] of SKIN_PATCHES) {
        const out = transformPixel(skinAsCameraCode(patch, profile), resolved);
        const hsv = rgbToHsv(out[0] * 255, out[1] * 255, out[2] * 255);
        const where = `${profile.id} + ${preset.id}, piel "${name}"`;
        assert.ok(
          hsv.h >= SKIN_HUE_MIN && hsv.h <= SKIN_HUE_MAX,
          `${where}: tono ${hsv.h.toFixed(1)}° fuera de la ventana`,
        );
        assert.ok(hsv.s <= 0.55, `${where}: saturación ${hsv.s.toFixed(2)}, piel anaranjada`);
        assert.ok(hsv.v > 0.02 && hsv.v < 0.995, `${where}: piel recortada`);
      }
    }
  }
});

/**
 * And what the grid does to it.
 *
 * A .cube is trilinear between its nodes, so the file always disagrees with the
 * transform by a little. In the midtones that is invisible. In deep shadow it
 * is not negligible in *hue* terms, because at 11 IRE the red and blue channels
 * are a couple of hundredths apart and an interpolation error of one hundredth
 * swings the angle a long way — which is why the report carries the measured
 * interpolation error and why a finer grid is worth offering. This test pins
 * down the part that is actually a promise: the file matches the transform to
 * within a bounded amount, and skin that is bright enough for its hue to be
 * visible at all stays in the window.
 */
test("el archivo .cube reproduce la piel dentro del error de la rejilla", () => {
  for (const profile of CAMERA_PROFILES) {
    for (const preset of LOOK_PRESETS) {
      const resolved = {
        ...resolveTechnical(profile),
        look: preset.look,
        tone: preset.tone,
        warmth: preset.warmth,
        tint: preset.tint,
        whiteBalance: creativeWhiteBalance(preset.warmth, preset.tint),
      };
      const { cube } = buildLut({ name: preset.label, profile, preset, size: 33, exposureEv: 0 });
      for (const [name, patch] of SKIN_PATCHES) {
        const code = skinAsCameraCode(patch, profile);
        const sampled = sampleCube(cube, code[0], code[1], code[2]);
        const exact = transformPixel(code, resolved);
        const where = `${profile.id} + ${preset.id}, piel "${name}"`;

        // The bound is the same order as the neutral-ramp interpolation error
        // the report publishes for a 33-node grid; anything much larger would
        // mean the grid is not the explanation.
        for (let channel = 0; channel < 3; channel += 1) {
          assert.ok(
            Math.abs(sampled[channel] - exact[channel]) < 0.03,
            `${where}: el archivo se desvía ${(sampled[channel] - exact[channel]).toFixed(4)} en el canal ${channel}`,
          );
        }

        const hsv = rgbToHsv(sampled[0] * 255, sampled[1] * 255, sampled[2] * 255);
        if (hsv.v > 0.2) {
          assert.ok(
            hsv.h >= SKIN_HUE_MIN - 2 && hsv.h <= SKIN_HUE_MAX + 2,
            `${where}: tono ${hsv.h.toFixed(1)}° tras interpolar`,
          );
        }
        assert.ok(hsv.s < 0.62, `${where}: saturación ${hsv.s.toFixed(2)} tras interpolar`);
      }
    }
  }
});

test("subir la exposición del LUT sube la imagen, y bajarla la baja", () => {
  const profile = findCameraProfile("arri-logc3")!;
  const preset = findLookPreset("neutral")!;
  const grey = midGreyCode(profile.transfer);
  const at = (ev: number) =>
    transformPixel([grey, grey, grey], resolveTechnical(profile)) &&
    buildLut({ name: "e", profile, preset, size: 33, exposureEv: ev }).report.measured.midGrey;
  assert.ok(at(1) > at(0));
  assert.ok(at(0) > at(-1));
  closeTo(at(0), 0.41, 0.001, "gris sin compensación");
  // One stop of exposure has to move grey by about one stop of the curve.
  closeTo(at(1) - at(0), NEUTRAL_TONE_CURVE.slopePerStop, 0.03, "un paso de exposición");
});

test("la rejilla del LUT acota el error de interpolación, y el informe lo dice", () => {
  const profile = findCameraProfile("arri-logc3")!;
  const preset = findLookPreset("neutral")!;
  const errorAt = (size: number) =>
    buildLut({ name: "g", profile, preset, size, exposureEv: 0 }).report.measured
      .interpolationError;

  // A 3D LUT is trilinear between nodes and this transform is not, so there is
  // always some error; what must hold is that it shrinks with the grid and
  // stays small enough at the default size to grade on top of.
  const coarse = errorAt(17);
  const standard = errorAt(33);
  const fine = errorAt(65);
  assert.ok(standard < coarse, "33 debería interpolar mejor que 17");
  assert.ok(fine < standard, "65 debería interpolar mejor que 33");
  assert.ok(standard < 0.035, `error de ${standard.toFixed(4)} en la rejilla por defecto`);
  assert.ok(fine < 0.02, `error de ${fine.toFixed(4)} en la rejilla fina`);
});

test("el rango legal se expande y no se confunde con el completo", () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  const preset = findLookPreset("neutral")!;
  const full = buildLut({ name: "f", profile, preset, size: 17, exposureEv: 0 });
  const legal = buildLut({ name: "l", profile, preset, size: 17, exposureEv: 0, inputRange: "legal" });
  // 64/1023 in a legal-range recording is black, and has to land where code 0
  // lands in a full-range one.
  const [r] = sampleCube(legal.cube, 64 / 1023, 64 / 1023, 64 / 1023);
  const [reference] = sampleCube(full.cube, 0, 0, 0);
  closeTo(r, reference, 0.01, "negro de rango legal");
  assert.ok(legal.text.includes("rango legal"), "el archivo debe declarar el rango");
});

test("el informe describe el material sin inventarse nada", () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  const { report, text } = buildLut({
    name: "Entrevista tarde",
    profile,
    preset: findLookPreset("piel-natural")!,
    size: 33,
    exposureEv: 0,
    metadata: { camera: "FX3", iso: "800", lighting: "ventana lateral" },
  });

  assert.equal(report.inputTransfer, "S-Log3");
  assert.equal(report.inputGamut, "S-Gamut3.Cine");
  closeTo(report.inputMidGrey, 41.06, 0.1, "gris declarado en el informe");
  assert.ok(report.capcutIntensity >= 40 && report.capcutIntensity <= 100);
  assert.ok(report.fileName.endsWith(".cube"));
  assert.ok(report.fileName.startsWith("AdVibe_Entrevista-tarde"));

  // Declared metadata is written down; everything not declared stays out.
  assert.ok(text.includes("Cámara: FX3"));
  assert.ok(text.includes("ISO: 800"));
  assert.ok(text.includes("Iluminación: ventana lateral"));
  assert.ok(!text.includes("Obturador"), "no debe inventar datos que nadie dio");
  assert.ok(!text.includes("Diafragma"));
});

// ---------------------------------------------------------------------------
// Footage analysis
// ---------------------------------------------------------------------------

/** A frame of log footage: a face-sized skin patch on a neutral background. */
function logFrame(profile: (typeof CAMERA_PROFILES)[number], skin: [number, number, number]) {
  const width = 160;
  const height = 120;
  const data = new Uint8ClampedArray(width * height * 4);
  const background = skinAsCameraCode([0.28, 0.28, 0.29], profile);
  const face = skinAsCameraCode(skin, profile);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const inFace =
        ((x - width / 2) / 34) ** 2 + ((y - height / 2) / 44) ** 2 <= 1;
      const colour = inFace ? face : background;
      const at = (y * width + x) * 4;
      data[at] = colour[0] * 255;
      data[at + 1] = colour[1] * 255;
      data[at + 2] = colour[2] * 255;
      data[at + 3] = 255;
    }
  }
  return { data, width, height };
}

test("el proxy conserva la imagen y respeta el borde largo", () => {
  const frame = logFrame(findCameraProfile("sony-slog3-cine")!, [0.6, 0.44, 0.35]);
  const proxy = proxyFrame(frame, 64);
  assert.equal(Math.max(proxy.width, proxy.height), 64);
  assert.equal(proxyFrame(frame, 4096), frame, "no debe ampliar");
});

test("renderFrame convierte el cuadro a Rec.709 antes de medirlo", () => {
  const profile = findCameraProfile("panasonic-vlog")!;
  const grey = Math.round(midGreyCode(profile.transfer) * 255);
  const frame = { data: new Uint8ClampedArray([grey, grey, grey, 255]), width: 1, height: 1 };
  const rendered = renderFrame(frame, profile);
  closeTo(rendered.data[0] / 255, 0.41, 0.01, "gris tras la conversión");
});

test("el análisis encuentra la piel de un cuadro log y propone protección", async () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  const analysis = await analyzeFootage(logFrame(profile, [0.6, 0.44, 0.35]), profile);

  assert.ok(analysis.rendered.skin.coverage > 0.05, "no encontró la cara");
  assert.ok(analysis.suggestedSkinProtection >= 0.85);
  assert.ok(analysis.notes.some((note) => note.includes("Piel en")));
  closeTo(analysis.log.expectedMidGrey, 0.4106, 0.001, "gris esperado de la curva");
  assert.ok(Math.abs(analysis.suggestedExposureEv) <= 2);
});

test("el análisis avisa cuando el material no parece log", async () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  // A frame with crushed blacks cannot be S-Log3: the curve's own floor is 9%.
  const width = 64;
  const height = 64;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let at = 0; at < data.length; at += 4) {
    const bright = (at / 4) % width > width / 2;
    data[at] = bright ? 250 : 0;
    data[at + 1] = bright ? 250 : 0;
    data[at + 2] = bright ? 250 : 0;
    data[at + 3] = 255;
  }
  const analysis = await analyzeFootage({ data, width, height }, profile);
  assert.ok(
    analysis.warnings.some((warning) => warning.includes("no log") || warning.includes("Rec.709")),
    `esperaba un aviso de perfil; hubo: ${analysis.warnings.join(" | ")}`,
  );
});

// ---------------------------------------------------------------------------
// The corrective layer
// ---------------------------------------------------------------------------

/**
 * Builds a synthetic clip in a camera's own log encoding.
 *
 * The frame has to be a plausible *scene*, not a colour swatch: a two-tone
 * patch has no tonal range, so it measures as flat with milky blacks and the
 * correction quite rightly tries to fix that. So it carries a neutral gradient
 * from near-black to near-white (contrast, a black floor, and a white-balance
 * reference at every brightness), a grey card, a face and two saturated
 * patches.
 *
 * `biasStops` shifts the whole frame's exposure before encoding and `cast`
 * multiplies the linear channels, so a clip can be made a stop under or a stop
 * too warm on purpose and the correction checked against what was done to it.
 */
function syntheticClip(
  profile: (typeof CAMERA_PROFILES)[number],
  options: {
    frames?: number;
    biasStops?: number;
    cast?: [number, number, number];
    skin?: [number, number, number];
  } = {},
) {
  const { frames = 3, biasStops = 0, cast = [1, 1, 1], skin = [0.6, 0.44, 0.35] } = options;

  const curve = TRANSFERS[profile.transfer];
  const toCamera = gamutMatrix("rec709", profile.gamut);
  const encode = (display: [number, number, number]): [number, number, number] => {
    const linear = display.map(
      (value, index) =>
        toneCurveInverse(value, NEUTRAL_TONE_CURVE) * 2 ** biasStops * cast[index],
    );
    const camera = applyMatrix(toCamera, linear[0], linear[1], linear[2]);
    return camera.map((value) => Math.min(Math.max(curve.encode(value), 0), 1)) as [
      number,
      number,
      number,
    ];
  };

  const width = 160;
  const height = 120;
  const face = encode(skin);
  const card = encode([0.6, 0.6, 0.6]);
  const red = encode([0.55, 0.18, 0.16]);
  const green = encode([0.22, 0.42, 0.2]);

  // The neutral ramp is precomputed per row: it is the same in every frame and
  // it is what gives the white-balance estimate something to work with.
  const ramp = Array.from({ length: height }, (_, y) => {
    const value = 0.02 + (y / (height - 1)) * 0.86;
    return encode([value, value, value]);
  });

  return Array.from({ length: frames }, (_, index) => {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let colour = ramp[height - 1 - y];
        if (x > 12 && x < 44 && y > 12 && y < 40) colour = card;
        if (x > 118 && x < 148 && y > 14 && y < 40) colour = red;
        if (x > 118 && x < 148 && y > 50 && y < 76) colour = green;
        if (((x - 80) / 24) ** 2 + ((y - 74) / 32) ** 2 <= 1) colour = face;
        const at = (y * width + x) * 4;
        data[at] = colour[0] * 255;
        data[at + 1] = colour[1] * 255;
        data[at + 2] = colour[2] * 255;
        data[at + 3] = 255;
      }
    }
    return { timeSeconds: index * 2, image: { data, width, height } };
  });
}

test("el análisis de clip agrega por mediana e ignora un fotograma atípico", async () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  const good = syntheticClip(profile, { frames: 4 });
  // One frame where somebody walked in front of the light: two stops down.
  const outlier = syntheticClip(profile, { frames: 1, biasStops: -2 })[0];
  const clip = await analyzeClip([...good, { ...outlier, timeSeconds: 9 }], profile);

  assert.equal(clip.frames.length, 5);
  const reference = await analyzeClip(good, profile);
  // The median has to be barely moved by one frame in five.
  closeTo(clip.exposureEv, reference.exposureEv, 0.2, "exposición con un fotograma atípico");
  closeTo(clip.blackLevel, reference.blackLevel, 0.03, "negros con un fotograma atípico");
});

test("un clip bien expuesto y neutro no recibe corrección", async () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  const clip = await analyzeClip(syntheticClip(profile), profile);
  const { options, notes } = deriveCorrection(clip);

  assert.equal(
    isNeutralCorrection(options),
    true,
    `no debería corregir nada, y propuso: ${JSON.stringify(options)}`,
  );
  // "Nothing to correct" is still a statement worth making, not silence.
  assert.ok(notes.every((note) => Math.abs(note.value) < 1e-6));
});

test("un clip subexpuesto pide subir exposición, y uno sobreexpuesto bajarla", async () => {
  const profile = findCameraProfile("panasonic-vlog")!;
  const dark = deriveCorrection(
    await analyzeClip(syntheticClip(profile, { biasStops: -1.5 }), profile),
  );
  const bright = deriveCorrection(
    await analyzeClip(syntheticClip(profile, { biasStops: 1.2 }), profile),
  );

  assert.ok(dark.options.exposureEv > 0.3, `esperaba subir, propuso ${dark.options.exposureEv}`);
  assert.ok(
    bright.options.exposureEv < -0.1,
    `esperaba bajar, propuso ${bright.options.exposureEv}`,
  );
  assert.ok(dark.notes.some((note) => note.field === "exposureEv"));
});

test("una dominante de color en superficies neutras se corrige en la dirección contraria", async () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  // A tungsten-ish cast: red up, blue down. The correction has to cool it.
  const warm = deriveCorrection(
    await analyzeClip(syntheticClip(profile, { cast: [1.22, 1, 0.78] }), profile),
  );
  const cool = deriveCorrection(
    await analyzeClip(syntheticClip(profile, { cast: [0.8, 1, 1.24] }), profile),
  );

  assert.ok(warm.options.warmth < 0, `un plano cálido debe enfriarse, propuso ${warm.options.warmth}`);
  assert.ok(cool.options.warmth > 0, `un plano frío debe calentarse, propuso ${cool.options.warmth}`);
});

test("sin superficie neutra fiable el balance se declara decisión creativa, no se corrige", () => {
  const clip = {
    frames: [],
    exposureEv: 0,
    contrast: 0.2,
    saturation: 0.2,
    oversaturated: 0,
    temperatureBias: 40,
    tintBias: -30,
    neutralConfidence: 0.05,
    blackLevel: 0.02,
    whiteLevel: 0.9,
    shadowClipping: 0,
    highlightClipping: 0,
    unrecoverableHighlights: 0,
    skinCoverage: 0,
    skinLuma: null,
    skinHue: null,
    skinSaturation: null,
    suggestedSkinProtection: 0.6,
    notes: [],
    warnings: [],
  } satisfies ClipAnalysis;

  const { options, notes } = deriveCorrection(clip);
  // A strong reading on a weak reference is the grey-world trap: a frame full
  // of one colour reads as a cast and "correcting" it drains the subject.
  assert.equal(options.warmth, 0);
  assert.equal(options.tint, 0);
  assert.ok(notes.some((note) => note.reason.includes("creativa")));
});

test("la corrección se refleja en el LUT y desactivarla lo devuelve al estado sin corregir", async () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  const preset = findLookPreset("neutral")!;
  const clip = await analyzeClip(syntheticClip(profile, { biasStops: -1.2 }), profile);
  const correction = deriveCorrection(clip);
  assert.ok(!isNeutralCorrection(correction.options), "el montaje debería necesitar corrección");

  const base = { name: "c", profile, preset, size: 17, exposureEv: 0 } as const;
  const uncorrected = buildLut(base);
  const corrected = buildLut({ ...base, correction });

  assert.equal(uncorrected.report.kind, "technical");
  assert.equal(corrected.report.kind, "corrected");
  // The correction lifts a dark clip, so mid grey has to come out brighter.
  assert.ok(
    corrected.report.measured.midGrey > uncorrected.report.measured.midGrey + 0.05,
    "la corrección debería levantar la imagen",
  );
  assert.equal(corrected.report.capcutIntensity, 100);
  assert.ok(corrected.report.fileName.includes("Tecnico-Corregido"));

  // technicalOnly has to override the correction, not merely the look.
  const forced = buildLut({ ...base, correction, technicalOnly: true });
  assert.deepEqual(Array.from(forced.cube.data), Array.from(uncorrected.cube.data));
});

test("las tres capas quedan escritas y separadas en la cabecera del archivo", async () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  const clip = await analyzeClip(syntheticClip(profile, { biasStops: -1.2 }), profile);
  const correction = deriveCorrection(clip);
  const { text, report } = buildLut({
    name: "Tres capas",
    profile,
    preset: findLookPreset("comercial-calido")!,
    size: 9,
    exposureEv: 0,
    correction,
    analysisSummary: summarizeClip(clip),
  });

  assert.ok(text.includes("Capa 1: transformación técnica"));
  assert.ok(text.includes("Capa 2: corrección medida"));
  assert.ok(text.includes("Capa 3: look creativo"));
  assert.ok(text.includes("Análisis del material"));
  assert.ok(text.includes("Fotogramas analizados: 3"));
  assert.equal(report.kind, "combined");
  // The reasoning travels with the file, not just with the session that made it.
  assert.ok(text.includes("EV"));
});

test("el informe distingue no haber analizado de haber analizado y no necesitar nada", async () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  const preset = findLookPreset("neutral")!;
  const base = { name: "r", profile, preset, size: 5, exposureEv: 0 } as const;

  const never = buildLut(base).report.correctionSummary;
  assert.ok(never.includes("no se ha analizado"), never);

  const clean = deriveCorrection(await analyzeClip(syntheticClip(profile), profile));
  const measured = buildLut({ ...base, correction: clean }).report.correctionSummary;
  assert.ok(measured.includes("no hay nada que corregir") || measured.includes("Ninguna"), measured);
  assert.ok(!measured.includes("no se ha analizado"), measured);
});

test("skipLook conserva la corrección y descarta el look", async () => {
  const profile = findCameraProfile("arri-logc3")!;
  const clip = await analyzeClip(syntheticClip(profile, { biasStops: -1 }), profile);
  const correction = deriveCorrection(clip);
  const base = { name: "s", profile, preset: findLookPreset("teal-orange")!, size: 9, exposureEv: 0 };

  const withLook = buildLut({ ...base, correction });
  const without = buildLut({ ...base, correction, skipLook: true });
  const neither = buildLut({ ...base, correction, technicalOnly: true });

  assert.equal(withLook.report.kind, "combined");
  assert.equal(without.report.kind, "corrected");
  assert.equal(neither.report.kind, "technical");
  assert.notDeepEqual(Array.from(without.cube.data), Array.from(withLook.cube.data));
  assert.notDeepEqual(Array.from(without.cube.data), Array.from(neither.cube.data));
});

test("el LUT depende del material: dos clips distintos dan dos archivos distintos", async () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  const preset = findLookPreset("piel-natural")!;
  const base = { name: "m", profile, preset, size: 17, exposureEv: 0 };

  const dark = deriveCorrection(
    await analyzeClip(syntheticClip(profile, { biasStops: -1.3 }), profile),
  );
  const warm = deriveCorrection(
    await analyzeClip(syntheticClip(profile, { cast: [1.25, 1, 0.76] }), profile),
  );

  const first = buildLut({ ...base, correction: dark });
  const second = buildLut({ ...base, correction: warm });

  // This is the whole point of the tool: same camera, same look, different
  // footage, different file. A preset pack cannot do this.
  assert.notDeepEqual(Array.from(first.cube.data), Array.from(second.cube.data));
  assert.notEqual(first.report.correctionSummary, second.report.correctionSummary);
});

test("la corrección no saca la piel de su ventana en ningún montaje", async () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  const cases: Array<Parameters<typeof syntheticClip>[1]> = [
    { biasStops: -1.5 },
    { biasStops: 1.2 },
    { cast: [1.25, 1, 0.76] },
    { cast: [0.78, 1, 1.25] },
    { cast: [1, 1.18, 1] },
  ];

  for (const options of cases) {
    const clip = await analyzeClip(syntheticClip(profile, options), profile);
    const correction = deriveCorrection(clip);
    for (const preset of LOOK_PRESETS) {
      const resolved = {
        ...resolveTechnical(profile),
        look: preset.look,
        tone: preset.tone,
        warmth: preset.warmth + correction.options.warmth,
        tint: preset.tint + correction.options.tint,
        whiteBalance: creativeWhiteBalance(
          preset.warmth + correction.options.warmth,
          preset.tint + correction.options.tint,
        ),
        gain: 2 ** correction.options.exposureEv,
      };
      for (const [name, patch] of SKIN_PATCHES) {
        const out = transformPixel(skinAsCameraCode(patch, profile), resolved);
        const hsv = rgbToHsv(out[0] * 255, out[1] * 255, out[2] * 255);
        assert.ok(
          hsv.h >= SKIN_HUE_MIN && hsv.h <= SKIN_HUE_MAX,
          `${JSON.stringify(options)} + ${preset.id}, piel "${name}": ${hsv.h.toFixed(1)}°`,
        );
      }
    }
  }
});

test("una rejilla de 65 interpola mejor que una de 33 en el mismo LUT", () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  const preset = findLookPreset("piel-natural")!;
  const at = (size: number) =>
    buildLut({ name: "g", profile, preset, size, exposureEv: 0 }).report.measured
      .interpolationError;
  const coarse = at(33);
  const fine = at(65);
  assert.ok(fine < coarse, `65³ (${fine.toFixed(4)}) debería batir a 33³ (${coarse.toFixed(4)})`);
  assert.ok(fine < 0.02, `error de ${fine.toFixed(4)} en la rejilla recomendada`);
});

test("la piel anaranjada se detecta y se baja la saturación, aunque el cuadro no lo pida", async () => {
  const profile = findCameraProfile("sony-slog3-cine")!;
  // Skin at 68% HSV saturation: past the point where a face reads as orange,
  // but a small enough part of the frame that the frame-wide figure is calm.
  const orange = await analyzeClip(
    syntheticClip(profile, { skin: [0.62, 0.34, 0.2] }),
    profile,
  );
  const natural = await analyzeClip(syntheticClip(profile), profile);

  assert.ok(
    (orange.skinSaturation ?? 0) > 0.5,
    `el montaje debería dar piel saturada, dio ${orange.skinSaturation}`,
  );
  assert.ok(orange.oversaturated < 0.015, "el cuadro entero no debería estar sobresaturado");

  const corrected = deriveCorrection(orange);
  assert.ok(
    corrected.options.saturationTrim <= -2,
    `esperaba bajar saturación, propuso ${corrected.options.saturationTrim}`,
  );
  assert.ok(corrected.notes.some((note) => note.reason.includes("anaranjada")));

  // And the natural skin must not trigger it.
  assert.equal(deriveCorrection(natural).options.saturationTrim, 0);
});
