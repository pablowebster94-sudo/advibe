import { test } from "node:test";
import assert from "node:assert/strict";

import { buildHistogram, computeColorStats, computeToneStats, percentile } from "../lib/photo/analysis/stats";
import { laplacianVariance, noiseScore, normalizeSharpness } from "../lib/photo/analysis/sharpness";
import { analyzeSkin, grayWorldGain } from "../lib/photo/analysis/skin";
import { assessExposure } from "../lib/photo/analysis/exposure";
import { computeHashes, hammingDistance } from "../lib/photo/analysis/phash";
import { classifyScene, estimateSkyFraction } from "../lib/photo/analysis/scene";
import { analyzeImage } from "../lib/photo/analysis/analyze";
import { rgbToHsv, meanHue } from "../lib/photo/analysis/image";
import { gradientImage, makeImage, noisyImage, skinImage, solidImage } from "./fixtures";

test("rgbToHsv y meanHue manejan el salto 0/360", () => {
  assert.deepEqual(rgbToHsv(255, 0, 0), { h: 0, s: 1, v: 1 });
  assert.equal(Math.round(rgbToHsv(0, 255, 0).h), 120);
  // 350° y 10° promedian a 0°, no a 180°.
  assert.ok(Math.min(meanHue([350, 10]), 360 - meanHue([350, 10])) < 0.001);
});

test("percentile sigue la distribución acumulada", () => {
  const image = gradientImage(256, 4);
  const histogram = buildHistogram(image);
  assert.ok(Math.abs(percentile(histogram.luma, histogram.samples, 0.5) - 0.5) < 0.02);
  assert.ok(percentile(histogram.luma, histogram.samples, 0.99) > 0.95);
});

test("computeToneStats mide clipping recuperable e irrecuperable por separado", () => {
  // Mitad blanco puro (irrecuperable), mitad gris medio.
  const image = makeImage(64, 64, (x) => (x < 32 ? [255, 255, 255] : [128, 128, 128]));
  const tone = computeToneStats(image, buildHistogram(image));
  assert.ok(Math.abs(tone.highlightClipping - 0.5) < 0.01);
  assert.ok(Math.abs(tone.unrecoverableHighlights - 0.5) < 0.01);

  // Solo el canal rojo saturado: Lightroom puede reconstruirlo desde G y B.
  const partial = makeImage(64, 64, (x) => (x < 32 ? [255, 180, 160] : [128, 128, 128]));
  const partialTone = computeToneStats(partial, buildHistogram(partial));
  assert.ok(Math.abs(partialTone.highlightClipping - 0.5) < 0.01);
  assert.equal(partialTone.unrecoverableHighlights, 0);
});

test("computeColorStats detecta una dominante fría y pide calentar", () => {
  const cool = solidImage(32, 32, [110, 128, 168]);
  const stats = computeColorStats(cool);
  assert.ok(stats.temperatureBias > 20, `esperaba corrección cálida, obtuve ${stats.temperatureBias}`);

  const warm = solidImage(32, 32, [178, 130, 96]);
  assert.ok(computeColorStats(warm).temperatureBias < -20);

  const neutral = solidImage(32, 32, [128, 128, 128]);
  assert.ok(Math.abs(computeColorStats(neutral).temperatureBias) < 1);
});

test("computeColorStats ignora los píxeles recortados al estimar el balance", () => {
  // Un fondo neutro con una ventana quemada no debe inventar una corrección.
  const image = makeImage(64, 64, (x) => (x < 16 ? [255, 255, 255] : [128, 128, 128]));
  const stats = computeColorStats(image);
  assert.ok(Math.abs(stats.temperatureBias) < 1);
});

test("un sujeto de color que llena el cuadro no se lee como dominante", () => {
  // El caso real que producía el tinte magenta: una foto dominada por un coche
  // gris-azulado sobre hormigón. El gris (superficie neutra) tiene que mandar
  // sobre el azul saturado del sujeto, no al revés.
  const carScene = makeImage(80, 80, (x) =>
    x < 56 ? [70, 96, 150] : [150, 150, 150], // 70% carrocería azul, 30% hormigón
  );
  const stats = computeColorStats(carScene);
  assert.ok(
    Math.abs(stats.temperatureBias) < 18,
    `un sujeto azul saturado no debe pedir una corrección fuerte, dio ${stats.temperatureBias}`,
  );
  // Y la confianza refleja cuánta superficie realmente neutra había.
  assert.ok(stats.neutralConfidence > 0 && stats.neutralConfidence < 1);
});

test("una superficie neutra con dominante real sí se detecta", () => {
  // Control: mismo tipo de escena, pero ahora las superficies neutras están
  // teñidas de cálido (luz de tungsteno). El balance sí debe reaccionar.
  const tungsten = makeImage(80, 80, () => [178, 150, 110]);
  const stats = computeColorStats(tungsten);
  assert.ok(stats.temperatureBias < -15, `esperaba enfriar, dio ${stats.temperatureBias}`);
});

test("laplacianVariance ordena nítida > borrosa", () => {
  const sharp = noisyImage(64, 64, 128, 70);
  const flat = solidImage(64, 64, [128, 128, 128]);
  assert.ok(laplacianVariance(sharp) > laplacianVariance(flat));
  assert.equal(laplacianVariance(flat), 0);
  assert.equal(normalizeSharpness(0), 0);
  assert.equal(normalizeSharpness(220), 0.5);
  assert.ok(normalizeSharpness(2000) > normalizeSharpness(220));
});

test("noiseScore crece con el ISO", () => {
  const image = noisyImage(48, 48, 128, 10);
  assert.ok(noiseScore(image, 12800) > noiseScore(image, 100));
});

test("grayWorldGain neutraliza una dominante sin exagerar", () => {
  const [gr, gg, gb] = grayWorldGain(solidImage(32, 32, [100, 128, 170]));
  assert.ok(gr > 1 && gb < 1, `ganancias ${gr}/${gg}/${gb}`);
  assert.ok(gr <= 1.45 && gb >= 0.7);
});

test("analyzeSkin encuentra una región de piel y la marca como rostro", () => {
  const skin = analyzeSkin(skinImage(), null);
  assert.ok(skin.coverage > 0.05, `cobertura ${skin.coverage}`);
  assert.ok(skin.regions.length >= 1);
  assert.equal(skin.regions[0].faceLike, true);
  assert.equal(skin.faceCount, 1);
  assert.equal(skin.detector, "skin-region-heuristic");
  assert.ok(skin.meanHue !== null && skin.meanHue > 10 && skin.meanHue < 40);
  assert.equal(skin.cast, "neutral");
});

test("analyzeSkin no inventa piel en una escena sin personas", () => {
  const skin = analyzeSkin(solidImage(96, 96, [40, 90, 160]), null);
  assert.equal(skin.regions.length, 0);
  assert.equal(skin.faceCount, 0);
  assert.equal(skin.meanLuma, null);
  assert.equal(skin.detector, "none");
});

test("analyzeSkin detecta piel naranja sobresaturada", () => {
  const skin = analyzeSkin(skinImage(96, 96, { rgb: [236, 122, 46] }), null);
  assert.equal(skin.cast, "orange");
});

test("analyzeSkin respeta el conteo del detector nativo cuando existe", () => {
  const skin = analyzeSkin(skinImage(), 3);
  assert.equal(skin.faceCount, 3);
  assert.equal(skin.detector, "native-shape-detection");
});

test("assessExposure deja en cero una foto bien expuesta", () => {
  // Rampa suave de 60 a 190: media dentro de la banda y contraste normal.
  const image = makeImage(128, 128, (x) => {
    const value = Math.round(60 + (x / 127) * 130);
    return [value, value, value];
  });
  const result = assessExposure(computeToneStats(image, buildHistogram(image)), {}, true);
  assert.equal(result.evOffset, 0, `ev=${result.evOffset}`);
  assert.deepEqual(result.verdicts, ["correct"]);
  assert.deepEqual(result.notes, []);
});

test("assessExposure no confunde alto contraste con mala exposición", () => {
  // Rampa completa 0-255: exposición correcta pero contraste alto.
  const result = assessExposure(
    computeToneStats(gradientImage(128, 128), buildHistogram(gradientImage(128, 128))),
    {},
    true,
  );
  assert.equal(result.evOffset, 0);
  assert.ok(result.verdicts.includes("high-contrast"));
  assert.ok(!result.verdicts.includes("underexposed"));
  assert.ok(!result.verdicts.includes("overexposed"));
});

test("assessExposure levanta una foto subexpuesta y avisa del ISO", () => {
  const dark = solidImage(64, 64, [38, 38, 38]);
  const tone = computeToneStats(dark, buildHistogram(dark));
  const result = assessExposure(tone, { iso: 12800 }, true);
  assert.ok(result.evOffset > 0.5, `ev=${result.evOffset}`);
  assert.ok(result.verdicts.includes("underexposed"));
  assert.ok(result.notes.some((note) => note.includes("ruido")));
});

test("assessExposure reconoce lo que no se puede recuperar", () => {
  const blown = makeImage(64, 64, (x) => (x < 40 ? [255, 255, 255] : [90, 90, 90]));
  const tone = computeToneStats(blown, buildHistogram(blown));
  const result = assessExposure(tone, {}, true);
  assert.ok(result.verdicts.includes("clipped-highlights"));
  assert.ok(result.recoverableHighlightRatio < 0.05);
  assert.ok(result.notes.some((note) => note.includes("sin recuperación")));
});

test("assessExposure respeta la banda de tolerancia en ambos extremos", () => {
  // Dentro de la banda: no se toca.
  for (const value of [85, 110, 138]) {
    const image = solidImage(32, 32, [value, value, value]);
    const tone = computeToneStats(image, buildHistogram(image));
    assert.equal(assessExposure(tone, {}, true).evOffset, 0, `luma ${value} debería quedarse igual`);
  }
  // Por encima de la banda: se baja solo hasta el borde, no hasta el centro.
  const bright = solidImage(32, 32, [200, 200, 200]);
  const tone = computeToneStats(bright, buildHistogram(bright));
  const ev = assessExposure(tone, {}, true).evOffset;
  const expected = Math.log2(0.55 / (200 / 255));
  assert.ok(Math.abs(ev - expected) < 0.03, `ev=${ev}, esperado ~${expected.toFixed(2)}`);
});

test("assessExposure limita el levantamiento cuando hay luces aún salvables", () => {
  // Escena oscura con un vestido blanco justo por debajo del recorte: subir
  // exposición sin límite lo quemaría.
  const withDress = makeImage(64, 64, (x) => (x < 13 ? [237, 237, 237] : [10, 10, 10]));
  const dressTone = computeToneStats(withDress, buildHistogram(withDress));
  const limited = assessExposure(dressTone, {}, true).evOffset;

  // Misma escena oscura, pero la zona brillante ya está quemada: es coste
  // hundido y no debe frenar la corrección.
  const withBlown = makeImage(64, 64, (x) => (x < 13 ? [255, 255, 255] : [10, 10, 10]));
  const blownTone = computeToneStats(withBlown, buildHistogram(withBlown));
  const free = assessExposure(blownTone, {}, true).evOffset;

  assert.ok(limited > 0, "debe seguir corrigiendo algo");
  assert.ok(free > limited + 0.5, `sin luces que proteger debe subir más: ${free} vs ${limited}`);
});

test("computeHashes agrupa variantes y separa escenas distintas", () => {
  const base = noisyImage(64, 64, 128, 60);
  // Misma escena, medio punto más clara.
  const brighter = makeImage(64, 64, (x, y) => {
    const at = (y * 64 + x) * 4;
    const value = Math.min(255, base.data[at] + 18);
    return [value, value, value];
  });
  const other = gradientImage(64, 64);

  const a = computeHashes(base);
  const b = computeHashes(brighter);
  const c = computeHashes(other);

  assert.ok(hammingDistance(a.dHash, b.dHash) <= 6, "una variación de exposición debe agrupar");
  assert.ok(hammingDistance(a.dHash, c.dHash) > 12, "escenas distintas deben separarse");
  assert.equal(hammingDistance("ff", "abc"), Number.MAX_SAFE_INTEGER);
});

test("estimateSkyFraction distingue cielo de interior", () => {
  const sky = makeImage(64, 64, (_x, y) => (y < 21 ? [120, 165, 230] : [80, 90, 70]));
  assert.ok(estimateSkyFraction(sky) > 0.9);
  const indoor = solidImage(64, 64, [90, 70, 50]);
  assert.equal(estimateSkyFraction(indoor), 0);
});

test("classifyScene marca flash y noche con ISO alto", () => {
  const image = solidImage(64, 64, [45, 42, 48]);
  const tone = computeToneStats(image, buildHistogram(image));
  const color = computeColorStats(image);
  const skin = analyzeSkin(image, 0);
  const scene = classifyScene({
    exif: { iso: 6400, flash: 9, capturedAt: new Date(2026, 7, 8, 23, 10).getTime() },
    tone,
    color,
    skin,
    skyFraction: 0,
    sharpness: 0.5,
  });
  assert.ok(scene.tags.includes("night"));
  assert.ok(scene.tags.includes("flash"));
  assert.ok(scene.tags.includes("indoor"));
});

test("classifyScene marca retrato cuando hay un rostro", async () => {
  const image = skinImage(128, 128, { radius: 40 });
  const analysis = await analyzeImage(image, { exif: { iso: 200 }, format: "arw", faceCount: 1 });
  assert.equal(analysis.scene.primary, "portrait");
  assert.equal(analysis.skin.faceCount, 1);
});

test("analyzeImage devuelve un registro completo y determinista", async () => {
  const image = gradientImage(128, 96);
  const exif = { iso: 400, fNumber: 2.8, focalLength: 50 };
  const first = await analyzeImage(image, { exif, format: "arw", faceCount: null });
  const second = await analyzeImage(image, { exif, format: "arw", faceCount: null });

  assert.equal(first.version, 1);
  assert.equal(first.proxyWidth, 128);
  assert.equal(first.proxyHeight, 96);
  assert.deepEqual(first.hashes, second.hashes);
  assert.equal(first.tone.mean, second.tone.mean);
  assert.ok(first.quality >= 0 && first.quality <= 1);
});
