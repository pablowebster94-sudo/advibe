import { test } from "node:test";
import assert from "node:assert/strict";

import { analyzeImage } from "../lib/photo/analysis/analyze";
import {
  BLACK_POINT_BAND,
  WHITE_POINT_BAND,
  bandCorrection,
  generateAdjustments,
  pickStrategy,
} from "../lib/photo/editing/engine";
import { STRATEGIES } from "../lib/photo/editing/strategies";
import { applySkinGuard, subjectExposureOffset } from "../lib/photo/editing/skinGuard";
import { defaultAdjustments } from "../lib/photo/editing/adjustments";
import { learnStyleProfile, inferAdjustments } from "../lib/photo/editing/styleLearning";
import { applyStyleProfile, biasReliability, summarizeBias } from "../lib/photo/editing/style";
import { groupDuplicates, scoreBestShot } from "../lib/photo/grouping/duplicates";
import type {
  ExifData,
  PhotoAnalysis,
  PhotoRecord,
  ProjectSettings,
  SourceFormat,
  StyleSample,
} from "../lib/photo/types";
import { gradientImage, makeImage, noisyImage, skinImage, solidImage } from "./fixtures";

const SETTINGS: ProjectSettings = { mode: "general", styleStrength: 0, intensity: 0.5, proxyEdge: 1600 };
const WEDDING: ProjectSettings = { mode: "wedding", styleStrength: 0, intensity: 0.5, proxyEdge: 1600 };

async function edit(
  image: { data: Uint8ClampedArray; width: number; height: number },
  exif: ExifData = {},
  settings: ProjectSettings = SETTINGS,
  faceCount: number | null = null,
  format: SourceFormat = "arw",
) {
  const analysis = await analyzeImage(image, { exif, format, faceCount });
  return { analysis, result: generateAdjustments({ analysis, exif, format, settings }) };
}

/** Una foto correctamente expuesta, con contraste normal y sin dominante. */
function wellExposedImage() {
  return makeImage(96, 96, (x, y) => {
    const value = Math.round(70 + ((x + y) / (96 + 96)) * 120);
    return [value, value, value];
  });
}

test("una foto bien expuesta no recibe correcciones de tono", async () => {
  const { result } = await edit(wellExposedImage());
  const { adjustments } = result;

  assert.equal(adjustments.exposure, 0, "no debe tocar la exposición");
  assert.equal(adjustments.highlights, 0, "no debe recuperar luces que no están en riesgo");
  assert.equal(adjustments.shadows, 0, "no debe abrir sombras con detalle");
  assert.equal(Math.abs(adjustments.temperature) <= 1, true);

  const reasons = result.rationale.map((entry) => entry.reason).join(" ");
  assert.match(reasons, /ya dentro de la banda correcta/);
  assert.match(reasons, /No hay altas luces en riesgo/);
});

test("dos fotos distintas reciben ajustes distintos (no es un preset)", async () => {
  const dark = await edit(solidImage(64, 64, [34, 34, 40]));
  const bright = await edit(solidImage(64, 64, [206, 200, 190]));

  assert.notEqual(dark.result.adjustments.exposure, bright.result.adjustments.exposure);
  assert.ok(dark.result.adjustments.exposure > 0.5);
  assert.ok(bright.result.adjustments.exposure < 0);
});

test("no se recuperan luces que ya no tienen información", async () => {
  // Toda la zona quemada tiene los tres canales al máximo: no hay nada que salvar.
  const dead = makeImage(96, 96, (x) => (x < 40 ? [255, 255, 255] : [70, 70, 70]));
  // Solo el canal rojo saturado: Lightroom puede reconstruir desde G y B.
  const alive = makeImage(96, 96, (x) => (x < 40 ? [255, 205, 190] : [70, 70, 70]));

  const deadEdit = await edit(dead);
  const aliveEdit = await edit(alive);

  assert.ok(deadEdit.analysis.exposure.recoverableHighlightRatio < 0.05);
  assert.ok(aliveEdit.analysis.exposure.recoverableHighlightRatio > 0.9);
  assert.ok(
    Math.abs(aliveEdit.result.adjustments.highlights) >
      Math.abs(deadEdit.result.adjustments.highlights),
    "con información recuperable debe tirar más de altas luces",
  );
  assert.match(
    deadEdit.result.rationale.map((entry) => entry.reason).join(" "),
    /no tiene información/,
  );
});

test("la estrategia de ceremonia conserva el ambiente frente a la de exterior", async () => {
  const dim = makeImage(96, 96, (x, y) => {
    const value = Math.round(18 + ((x + y) / 192) * 55);
    return [value, value, value];
  });
  const analysis = await analyzeImage(dim, { exif: { iso: 3200 }, format: "arw", faceCount: 2 });

  const ceremony = generateAdjustments({
    analysis,
    exif: { iso: 3200 },
    format: "arw",
    settings: SETTINGS,
    strategyOverride: "ceremony",
  }).adjustments;
  const outdoor = generateAdjustments({
    analysis,
    exif: { iso: 3200 },
    format: "arw",
    settings: SETTINGS,
    strategyOverride: "outdoor",
  }).adjustments;

  assert.ok(
    ceremony.shadows < outdoor.shadows,
    `ceremonia debe abrir menos las sombras: ${ceremony.shadows} vs ${outdoor.shadows}`,
  );
  assert.ok(
    ceremony.exposure < outdoor.exposure,
    `ceremonia debe levantar menos: ${ceremony.exposure} vs ${outdoor.exposure}`,
  );
});

test("la prioridad de sujeto rescata un contraluz que la media declara correcto", async () => {
  // Fondo muy brillante en los bordes, sujeto oscuro en el centro.
  const backlit = makeImage(128, 128, (x, y) => {
    const centred = Math.abs(x - 64) < 26 && Math.abs(y - 64) < 32;
    return centred ? [86, 62, 52] : [246, 244, 238];
  });
  const analysis = await analyzeImage(backlit, { exif: {}, format: "arw", faceCount: 1 });

  const backlitEdit = generateAdjustments({
    analysis,
    exif: {},
    format: "arw",
    settings: SETTINGS,
    strategyOverride: "backlit",
  });
  const flat = generateAdjustments({
    analysis,
    exif: {},
    format: "arw",
    settings: SETTINGS,
    strategyOverride: "detail", // subjectWeight 0
  });

  assert.ok(
    backlitEdit.adjustments.exposure > flat.adjustments.exposure,
    `contraluz debe levantar más por el sujeto: ${backlitEdit.adjustments.exposure} vs ${flat.adjustments.exposure}`,
  );
  assert.ok(backlitEdit.adjustments.highlights < 0, "y proteger el fondo");
});

test("subjectExposureOffset respeta los tonos de piel oscuros y solo actúa en extremos", () => {
  const base = {
    coverage: 0.2,
    regions: [],
    faceCount: 1,
    meanHue: 22,
    meanSaturation: 0.35,
    cast: "neutral" as const,
    detector: "skin-region-heuristic" as const,
  };
  // Piel oscura pero perfectamente expuesta: no se toca.
  assert.equal(subjectExposureOffset({ ...base, meanLuma: 0.33 }), 0);
  assert.equal(subjectExposureOffset({ ...base, meanLuma: 0.62 }), 0);
  // Piel enterrada en sombra: sí se levanta.
  assert.ok(subjectExposureOffset({ ...base, meanLuma: 0.12 }) > 1);
  // Piel a punto de recortar: se baja.
  assert.ok(subjectExposureOffset({ ...base, meanLuma: 0.95 }) < 0);
});

test("el guardián de piel limita claridad, saturación y textura en un primer plano", async () => {
  const { result, analysis } = await edit(skinImage(128, 128, { radius: 46 }), {}, SETTINGS, 1);
  assert.ok(analysis.skin.coverage > 0.15, `cobertura ${analysis.skin.coverage}`);
  assert.ok(result.adjustments.clarity <= 0, `claridad ${result.adjustments.clarity}`);
  assert.ok(result.adjustments.saturation <= 0);
  assert.ok(result.adjustments.vibrance <= 12);
  assert.ok(result.adjustments.sharpenMasking >= 55, "debe enmascarar el enfoque sobre la piel");
});

test("el guardián de piel corrige el tono naranja bajando el naranja del HSL", () => {
  const skin = {
    coverage: 0.2,
    regions: [{ x: 0.3, y: 0.3, w: 0.3, h: 0.3, area: 0.15, luma: 0.6, hue: 24, saturation: 0.68, sharpness: 300, faceLike: true }],
    faceCount: 1,
    meanLuma: 0.6,
    meanHue: 24,
    meanSaturation: 0.68,
    cast: "orange" as const,
    detector: "skin-region-heuristic" as const,
  };
  const input = { ...defaultAdjustments(), vibrance: 30, saturation: 20 };
  const { adjustments, rationale } = applySkinGuard(input, skin, true);

  assert.ok(adjustments.hsl.saturation.orange < -10, `naranja ${adjustments.hsl.saturation.orange}`);
  assert.ok(adjustments.saturation <= 0);
  assert.ok(adjustments.vibrance <= 6);
  assert.match(rationale.map((entry) => entry.reason).join(" "), /tono naranja/);
});

test("el guardián de piel corrige una dominante magenta con el matiz", () => {
  const skin = {
    coverage: 0.2,
    regions: [],
    faceCount: 1,
    meanLuma: 0.6,
    meanHue: 4,
    meanSaturation: 0.3,
    cast: "magenta" as const,
    detector: "skin-region-heuristic" as const,
  };
  const { adjustments } = applySkinGuard(defaultAdjustments(), skin, true);
  assert.ok(adjustments.tint < 0, `matiz ${adjustments.tint}`);
  assert.ok(adjustments.tint >= -12, "la corrección debe ser contenida");
});

test("una cobertura de piel dudosa no mueve el matiz de toda la foto", () => {
  // El falso positivo que producía el tinte: unos pocos píxeles cálidos (metal
  // de un motor, tapicería beige) clasificados como piel. Por debajo del umbral
  // significativo el guardián no debe tocar nada global.
  const base = defaultAdjustments();
  const skin = {
    coverage: 0.03, // 3%: por debajo de SIGNIFICANT_COVERAGE
    regions: [],
    faceCount: 0,
    meanLuma: 0.55,
    meanHue: 45, // amarillo/verde: antes empujaba el matiz hacia magenta
    meanSaturation: 0.6,
    cast: "none" as const,
    detector: "skin-region-heuristic" as const,
  };
  const { adjustments, rationale } = applySkinGuard(base, skin, true);
  assert.equal(adjustments.tint, base.tint, `el matiz no debe cambiar, dio ${adjustments.tint}`);
  assert.equal(adjustments.saturation, base.saturation);
  assert.equal(rationale.length, 0, "no debe justificar ninguna corrección");
});

test("una escena sin piel no activa ningún límite del guardián", () => {
  const skin = {
    coverage: 0,
    regions: [],
    faceCount: 0,
    meanLuma: null,
    meanHue: null,
    meanSaturation: null,
    cast: "neutral" as const,
    detector: "none" as const,
  };
  const input = { ...defaultAdjustments(), clarity: 30, vibrance: 35 };
  const { adjustments, rationale } = applySkinGuard(input, skin, true);
  assert.equal(adjustments.clarity, 30);
  assert.equal(adjustments.vibrance, 35);
  assert.deepEqual(rationale, []);
});

test("el ruido alto frena la apertura de sombras y sube la reducción de ruido", async () => {
  const dark = solidImage(80, 80, [30, 30, 30]);
  const clean = await edit(dark, { iso: 100 });
  const noisy = await edit(dark, { iso: 12800 });

  assert.ok(
    noisy.result.adjustments.shadows < clean.result.adjustments.shadows,
    `${noisy.result.adjustments.shadows} debería ser menor que ${clean.result.adjustments.shadows}`,
  );
  assert.ok(noisy.result.adjustments.luminanceNR > clean.result.adjustments.luminanceNR);
  assert.match(
    noisy.result.rationale.map((entry) => entry.reason).join(" "),
    /limitado por ruido/,
  );
});

test("la intensidad escala solo la parte creativa, nunca la correctiva", async () => {
  const image = solidImage(64, 64, [30, 30, 34]);
  const neutral = await edit(image, {}, { ...SETTINGS, intensity: 0.5 });
  const flat = await edit(image, {}, { ...SETTINGS, intensity: 0 });

  assert.equal(
    neutral.result.adjustments.exposure,
    flat.result.adjustments.exposure,
    "la exposición es corrección, no gusto",
  );
  assert.equal(neutral.result.adjustments.luminanceNR, flat.result.adjustments.luminanceNR);
  assert.equal(flat.result.adjustments.vibrance, 0);
  assert.ok(Math.abs(flat.result.adjustments.contrast) < Math.abs(neutral.result.adjustments.contrast) + 1);
});

test("pickStrategy usa las categorías de boda cuando el modo es boda", async () => {
  const analysis = await analyzeImage(skinImage(128, 128), {
    exif: { iso: 200, capturedAt: new Date(2026, 7, 8, 10, 0).getTime() },
    format: "arw",
    faceCount: 1,
  });
  const strategy = pickStrategy({ analysis, exif: {}, format: "arw", settings: WEDDING });
  assert.ok(strategy.id.length > 0);
  assert.equal(typeof strategy.intent, "string");
  assert.equal(STRATEGIES.ceremony.shadowGain < STRATEGIES.outdoor.shadowGain, true);
});

// ---------------------------------------------------------------------------
// Mi Estilo
// ---------------------------------------------------------------------------

test("summarizeBias y biasReliability castigan la dispersión", () => {
  const consistent = summarizeBias([8, 9, 8, 8, 9]);
  const scattered = summarizeBias([-25, 30, -10, 22, 5]);

  assert.ok(Math.abs(consistent.mean - 8.4) < 0.1);
  assert.ok(consistent.stdDev < 1);
  assert.ok(
    biasReliability(consistent, "temperature") > biasReliability(scattered, "temperature") * 3,
    "un criterio consistente debe pesar mucho más que uno disperso",
  );
});

test("learnStyleProfile aprende la desviación respecto de la corrección neutra", async () => {
  const analysis = await analyzeImage(wellExposedImage(), { exif: {}, format: "arw", faceCount: null });

  // El fotógrafo siempre calienta +10 y sube exposición +0.3 sobre lo neutro.
  const neutralBaseline = generateAdjustments({
    analysis,
    exif: {},
    format: "arw",
    settings: { mode: "general", styleStrength: 0, intensity: 0.5, proxyEdge: 1600 },
  }).adjustments;

  const samples: StyleSample[] = Array.from({ length: 6 }, (_, index) => ({
    id: `s${index}`,
    fileName: `DSC0${index}.ARW`,
    before: analysis as PhotoAnalysis,
    adjustments: {
      ...neutralBaseline,
      exposure: neutralBaseline.exposure + 0.3,
      temperature: neutralBaseline.temperature + 10,
    },
    source: "xmp",
    scene: analysis.scene.primary,
    addedAt: Date.now(),
  }));

  const profile = learnStyleProfile(samples, { id: "pablo", name: "Estilo de Pablo" });
  assert.equal(profile.sampleCount, 6);
  assert.ok(Math.abs(profile.biases.exposure.mean - 0.3) < 0.01);
  assert.ok(Math.abs(profile.biases.temperature.mean - 10) < 0.01);
  assert.ok(profile.confidence > 0.5, `confianza ${profile.confidence}`);

  const applied = applyStyleProfile(neutralBaseline, profile, analysis.scene.primary, 1);
  assert.ok(applied.adjustments.exposure > neutralBaseline.exposure + 0.2);
  assert.ok(applied.adjustments.temperature > neutralBaseline.temperature + 8);
  assert.match(applied.rationale[0].reason, /Estilo "Estilo de Pablo"/);
});

test("un estilo con criterios contradictorios casi no se aplica", async () => {
  const analysis = await analyzeImage(wellExposedImage(), { exif: {}, format: "arw", faceCount: null });
  const baseline = generateAdjustments({
    analysis,
    exif: {},
    format: "arw",
    settings: SETTINGS,
  }).adjustments;

  const scatter = [-40, 45, -30, 38, -20, 25];
  const samples: StyleSample[] = scatter.map((value, index) => ({
    id: `s${index}`,
    fileName: `x${index}.ARW`,
    before: analysis,
    adjustments: { ...baseline, temperature: baseline.temperature + value },
    source: "xmp",
    scene: analysis.scene.primary,
    addedAt: Date.now(),
  }));

  const profile = learnStyleProfile(samples, { id: "ruido", name: "Sin criterio" });
  const applied = applyStyleProfile(baseline, profile, analysis.scene.primary, 1);
  assert.ok(
    Math.abs(applied.adjustments.temperature - baseline.temperature) < 5,
    "no debe seguir un patrón que no existe",
  );
});

test("el estilo se aplica antes del guardián de piel, que sigue teniendo la última palabra", async () => {
  const image = skinImage(128, 128, { radius: 46 });
  const analysis = await analyzeImage(image, { exif: {}, format: "arw", faceCount: 1 });
  const baseline = generateAdjustments({ analysis, exif: {}, format: "arw", settings: SETTINGS }).adjustments;

  // Un estilo que empuja saturación y claridad muy arriba.
  const samples: StyleSample[] = Array.from({ length: 6 }, (_, index) => ({
    id: `s${index}`,
    fileName: `x${index}.ARW`,
    before: analysis,
    adjustments: { ...baseline, saturation: baseline.saturation + 60, clarity: baseline.clarity + 50 },
    source: "xmp" as const,
    scene: analysis.scene.primary,
    addedAt: Date.now(),
  }));
  const profile = learnStyleProfile(samples, { id: "fuerte", name: "Estilo intenso" });

  const styled = generateAdjustments({
    analysis,
    exif: {},
    format: "arw",
    settings: { mode: "general", styleStrength: 1, intensity: 0.5, proxyEdge: 1600 },
    style: profile,
  }).adjustments;

  assert.ok(styled.saturation <= 0, `la piel manda: saturación ${styled.saturation}`);
  assert.ok(styled.clarity <= 0, `la piel manda: claridad ${styled.clarity}`);
});

test("inferAdjustments deduce la dirección del cambio entre original y editada", async () => {
  const before = await analyzeImage(solidImage(64, 64, [90, 90, 90]), { exif: {}, format: "jpeg", faceCount: null });
  const after = await analyzeImage(solidImage(64, 64, [140, 140, 140]), { exif: {}, format: "jpeg", faceCount: null });
  const inferred = inferAdjustments(before, after);
  assert.ok((inferred.exposure ?? 0) > 0.4, `exposición inferida ${inferred.exposure}`);
});

// ---------------------------------------------------------------------------
// Duplicados
// ---------------------------------------------------------------------------

function photoFrom(id: string, analysis: PhotoAnalysis, capturedAt: number, index: number): PhotoRecord {
  return {
    id,
    projectId: "p1",
    fileName: `${id}.ARW`,
    baseName: id,
    format: "arw",
    byteSize: 25_000_000,
    lastModified: capturedAt,
    status: "analyzed",
    exif: { capturedAt },
    analysis,
    picked: false,
    rejected: false,
    addedAt: capturedAt,
    orderIndex: index,
  };
}

test("groupDuplicates agrupa una ráfaga y deja fuera una escena distinta", async () => {
  const base = noisyImage(96, 96, 120, 55);
  const variants = await Promise.all(
    [0, 6, 12, 18].map(async (shift) => {
      const image = makeImage(96, 96, (x, y) => {
        const at = (y * 96 + x) * 4;
        const value = Math.min(255, base.data[at] + shift);
        return [value, value, value];
      });
      return analyzeImage(image, { exif: {}, format: "arw", faceCount: null });
    }),
  );
  const other = await analyzeImage(gradientImage(96, 96), { exif: {}, format: "arw", faceCount: null });

  const start = Date.now();
  const photos = [
    ...variants.map((analysis, index) =>
      photoFrom(`DSC0771${index + 1}`, analysis, start + index * 1200, index),
    ),
    photoFrom("DSC07799", other, start + 5000, 4),
  ];

  const groups = groupDuplicates(photos);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].label, "GRUPO 001");
  assert.equal(groups[0].photoIds.length, 4);
  assert.ok(!groups[0].photoIds.includes("DSC07799"));
  assert.ok(groups[0].photoIds.includes(groups[0].suggestedId));
  assert.equal(Object.keys(groups[0].scores).length, 4);
});

test("groupDuplicates no une fotos idénticas separadas en el tiempo", async () => {
  const analysis = await analyzeImage(noisyImage(64, 64), { exif: {}, format: "arw", faceCount: null });
  const start = Date.now();
  const groups = groupDuplicates([
    photoFrom("a", analysis, start, 0),
    photoFrom("b", analysis, start + 10 * 60 * 1000, 1),
  ]);
  assert.equal(groups.length, 0);
});

test("scoreBestShot explica la recomendación sin afirmar lo que no mide", async () => {
  const sharp = await analyzeImage(noisyImage(96, 96, 128, 70), { exif: {}, format: "arw", faceCount: null });
  const blurry = await analyzeImage(solidImage(96, 96, [128, 128, 128]), { exif: {}, format: "arw", faceCount: null });

  const sharpScore = scoreBestShot(photoFrom("a", sharp, Date.now(), 0));
  const blurryScore = scoreBestShot(photoFrom("b", blurry, Date.now(), 1));

  assert.ok(sharpScore.total > blurryScore.total);
  assert.match(sharpScore.summary, /nitidez/);
  assert.ok(!sharpScore.summary.includes("ojos"), "no se afirma detección de ojos");
});


// ---------------------------------------------------------------------------
// Bandas de tolerancia: ninguna corrección debe saturar en fotos normales
// ---------------------------------------------------------------------------

test("bandCorrection devuelve cero dentro de la banda y la distancia al borde fuera", () => {
  assert.equal(bandCorrection(0.5, [0.3, 0.6]), 0);
  assert.equal(bandCorrection(0.3, [0.3, 0.6]), 0);
  assert.ok(Math.abs(bandCorrection(0.2, [0.3, 0.6]) - 0.1) < 1e-9);
  assert.ok(Math.abs(bandCorrection(0.8, [0.3, 0.6]) - -0.2) < 1e-9);
});

test("los extremos tonales no se clavan en el tope en fotografías con rango normal", async () => {
  // Escenas que alcanzan negro y usan el rango tonal, como cualquier fotografía
  // bien expuesta: ninguna debe recibir una corrección extrema.
  const scenes = [
    makeImage(96, 96, (x, y) => {
      const v = Math.round(4 + ((x + y) / 192) * 240);
      return [v, v, v];
    }),
    makeImage(96, 96, (x, y) => {
      const v = Math.round(6 + (x / 95) * 200 * (0.4 + 0.6 * (y / 95)));
      return [v, v + 4, Math.max(0, v - 6)];
    }),
    makeImage(96, 96, (x, y) => (x + y < 40 ? [5, 6, 8] : noisyPixel(x, y))),
  ];

  for (const [index, image] of scenes.entries()) {
    const { result } = await edit(image, { iso: 400 });
    const { blacks, whites, contrast } = result.adjustments;
    assert.ok(Math.abs(blacks) < 22, `escena ${index}: negros clavados en ${blacks}`);
    assert.ok(Math.abs(whites) < 25, `escena ${index}: blancos clavados en ${whites}`);
    assert.ok(Math.abs(contrast) < 28, `escena ${index}: contraste clavado en ${contrast}`);
  }
});

/** Ruido determinista para las escenas de prueba. */
function noisyPixel(x: number, y: number): [number, number, number] {
  const seed = (x * 73 + y * 151) % 255;
  const v = 60 + (seed % 170);
  return [v, v, v];
}

test("escenas distintas reciben extremos tonales distintos (no hay valor fijo)", async () => {
  const scenes = [
    makeImage(96, 96, (x, y) => {
      const v = Math.round(4 + ((x + y) / 192) * 240);
      return [v, v, v];
    }),
    makeImage(96, 96, () => [190, 188, 184]),
    makeImage(96, 96, (x) => (x < 48 ? [230, 230, 230] : [24, 24, 26])),
    skinImage(96, 96, { radius: 24 }),
  ];

  const values = [];
  for (const image of scenes) {
    const { result } = await edit(image, { iso: 400 });
    values.push(
      `${result.adjustments.blacks}/${result.adjustments.whites}/${result.adjustments.contrast}`,
    );
  }
  assert.equal(new Set(values).size, values.length, `combinaciones repetidas: ${values.join(" ")}`);
});

test("un punto de negro ya correcto no se toca", async () => {
  // p01 dentro de la banda: la imagen ya llega casi a negro.
  const image = makeImage(96, 96, (x) => {
    const v = Math.round(8 + (x / 95) * 240);
    return [v, v, v];
  });
  const analysis = await analyzeImage(image, { exif: {}, format: "arw", faceCount: null });
  assert.ok(
    analysis.tone.p01 >= BLACK_POINT_BAND[0] && analysis.tone.p01 <= BLACK_POINT_BAND[1],
    `p01=${analysis.tone.p01} debería estar dentro de la banda`,
  );
  const result = generateAdjustments({ analysis, exif: {}, format: "arw", settings: SETTINGS });
  assert.equal(result.adjustments.blacks, 0);
});

test("un punto de blanco ya correcto no se toca", async () => {
  const image = makeImage(96, 96, (x) => {
    const v = Math.round(10 + (x / 95) * 235);
    return [v, v, v];
  });
  const analysis = await analyzeImage(image, { exif: {}, format: "arw", faceCount: null });
  assert.ok(
    analysis.tone.highlightReference >= WHITE_POINT_BAND[0],
    `hlRef=${analysis.tone.highlightReference}`,
  );
  const result = generateAdjustments({ analysis, exif: {}, format: "arw", settings: SETTINGS });
  assert.equal(result.adjustments.whites, 0);
});

test("el contraste descuenta el aplanado que ya provocan luces y sombras", async () => {
  // Escena de alto contraste: no debe pedir el máximo de contraste negativo,
  // porque la recuperación de luces y sombras ya la aplana.
  const harsh = makeImage(96, 96, (x) => (x < 48 ? [242, 242, 242] : [16, 16, 16]));
  const { result } = await edit(harsh);
  assert.ok(
    result.adjustments.contrast > -28,
    `no debe saturar: ${result.adjustments.contrast}`,
  );
  assert.match(
    result.rationale.map((entry) => entry.reason).join(" "),
    /Contraste efectivo/,
  );
});

test("dehaze no se aplica en interior aunque las señales tonales coincidan", async () => {
  // Tono alto y contraste bajo, pero ISO alto -> interior: es una pared blanca,
  // no niebla. La neblina es atmosférica y no ocurre bajo techo.
  const highKey = makeImage(96, 96, (x, y) => {
    const v = Math.round(168 + ((x + y) % 14));
    return [v, v, v];
  });
  const indoor = await edit(highKey, { iso: 6400 });
  assert.ok(indoor.analysis.color.haze > 0.55, `haze=${indoor.analysis.color.haze}`);
  assert.ok(indoor.analysis.tone.stdDev < 0.17, `stdDev=${indoor.analysis.tone.stdDev}`);
  assert.ok(indoor.analysis.scene.tags.includes("indoor"), "la escena debe ser interior");
  assert.equal(indoor.result.adjustments.dehaze, 0);
  assert.match(
    indoor.result.rationale.map((entry) => entry.reason).join(" "),
    /tono alto, no neblina/,
  );
});

test("dehaze en exterior se aplica de forma conservadora", async () => {
  // Cielo claro arriba + velo uniforme: exterior con las dos señales.
  const hazy = makeImage(96, 96, (x, y) =>
    y < 32 ? [206, 214, 232] : [178, 180, 184],
  );
  const outdoor = await edit(hazy, { iso: 200 });
  assert.ok(outdoor.analysis.scene.tags.includes("outdoor"), "la escena debe ser exterior");
  assert.ok(outdoor.result.adjustments.dehaze > 0, "con las tres condiciones sí se aplica");
  assert.ok(
    outdoor.result.adjustments.dehaze <= 12,
    `debe ser conservador: ${outdoor.result.adjustments.dehaze}`,
  );
});

// ---------------------------------------------------------------------------
// Contraluz: se decide por la relación de luz, no por el tono de piel
// ---------------------------------------------------------------------------

test("el contraluz se detecta por la relación de luz sujeto/escena", async () => {
  // Fondo muy brillante, sujeto con piel claramente más oscuro que la escena.
  const backlit = makeImage(160, 160, (x, y) => {
    const inSubject = Math.abs(x - 80) < 30 && Math.abs(y - 78) < 40;
    return inSubject ? [96, 70, 58] : [244, 242, 236];
  });
  const analysis = await analyzeImage(backlit, { exif: {}, format: "arw", faceCount: 1 });

  assert.ok(analysis.skin.coverage > 0.02, `cobertura=${analysis.skin.coverage}`);
  assert.ok(
    analysis.scene.confidence.backlit >= 0.5,
    `confianza contraluz=${analysis.scene.confidence.backlit}`,
  );
  assert.ok(analysis.scene.tags.includes("backlit"));

  const result = generateAdjustments({ analysis, exif: {}, format: "arw", settings: SETTINGS });
  assert.equal(result.strategy, "backlit");
  assert.ok(result.adjustments.exposure > 0, `debe levantar el sujeto: ${result.adjustments.exposure}`);
  assert.ok(result.adjustments.highlights < 0, "y proteger el fondo");
});

test("subjectExposureOffset no confunde piel oscura con subexposición", () => {
  const base = {
    coverage: 0.2,
    regions: [],
    faceCount: 1,
    meanHue: 22,
    meanSaturation: 0.35,
    cast: "neutral" as const,
    detector: "skin-region-heuristic" as const,
  };

  // Piel oscura, iluminada igual que la escena: no se toca.
  assert.equal(subjectExposureOffset({ ...base, meanLuma: 0.34 }, 0.38), 0);
  // Piel clara, iluminada igual que la escena: tampoco.
  assert.equal(subjectExposureOffset({ ...base, meanLuma: 0.68 }, 0.62), 0);
  // La MISMA piel oscura, pero a contraluz: sí se levanta.
  assert.ok(subjectExposureOffset({ ...base, meanLuma: 0.34 }, 0.72) > 0.2);
  // Y la misma piel clara a contraluz también.
  assert.ok(subjectExposureOffset({ ...base, meanLuma: 0.5 }, 0.88) > 0.2);
  // Sin dato de escena, solo actúa la regla absoluta.
  assert.equal(subjectExposureOffset({ ...base, meanLuma: 0.34 }), 0);
});
