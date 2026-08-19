import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MISSING,
  formatAperture,
  formatCamera,
  formatCaptureDate,
  formatDimensions,
  formatFlash,
  formatFocalLength,
  formatIso,
  formatLens,
  formatMakerNotes,
  formatShutter,
  formatWhiteBalance,
  metadataRows,
} from "../lib/photo/raw/exifDisplay";
import { extractExif, estimateAsShotKelvin } from "../lib/photo/raw/exif";
import { parseTiff } from "../lib/photo/raw/tiff";
import { bufferSource } from "../lib/photo/raw/bytes";
import { makeArw } from "./fixtures";

test("un archivo sin ningún metadato muestra guiones, no inventos", () => {
  const rows = metadataRows({});
  assert.equal(rows.length, 11);
  for (const row of rows) {
    assert.equal(row.value, MISSING, `${row.label} debería estar vacío`);
    assert.equal(row.missing, true);
  }
});

test("formatCamera no repite la marca cuando el modelo ya la incluye", () => {
  // Sony separa marca y modelo, así que los dos aportan información.
  assert.equal(formatCamera({ make: "SONY", model: "ZV-E10" }), "SONY ZV-E10");
  // Canon repite la marca dentro del modelo; ahí sí sobra.
  assert.equal(formatCamera({ make: "Canon", model: "Canon EOS R6" }), "Canon EOS R6");
  assert.equal(formatCamera({ make: "Canon", model: "EOS R6" }), "Canon EOS R6");
  assert.equal(formatCamera({ model: "X-T5" }), "X-T5");
  assert.equal(formatCamera({}), MISSING);
});

test("velocidad y apertura se formatean como en la cámara", () => {
  assert.equal(formatShutter({ exposureTime: 1 / 200 }), "1/200 s");
  assert.equal(formatShutter({ exposureTime: 2 }), "2 s");
  assert.equal(formatShutter({ exposureTime: 1 }), "1 s");
  assert.equal(formatShutter({}), MISSING);
  assert.equal(formatShutter({ exposureTime: 0 }), MISSING);

  assert.equal(formatAperture({ fNumber: 1.8 }), "f/1.8");
  assert.equal(formatAperture({ fNumber: 8 }), "f/8");
  assert.equal(formatAperture({ fNumber: 11 }), "f/11");
  assert.equal(formatAperture({}), MISSING);
});

test("la distancia focal añade el equivalente solo si difiere", () => {
  assert.equal(formatFocalLength({ focalLength: 35 }), "35 mm");
  assert.equal(formatFocalLength({ focalLength: 35, focalLength35mm: 52 }), "35 mm (52 mm equiv.)");
  assert.equal(formatFocalLength({ focalLength: 50, focalLength35mm: 50 }), "50 mm");
  assert.equal(formatFocalLength({}), MISSING);
});

test("el balance de blancos distingue medición de modo", () => {
  // MakerNote: valor medido por la cámara.
  assert.equal(
    formatWhiteBalance({ whiteBalanceSetting: "Luz de día", colorTemperature: 5500 }),
    "Luz de día · 5500 K",
  );
  // Solo EXIF: es un modo, no una medición.
  assert.equal(formatWhiteBalance({ lightSource: 3 }), "Tungsteno");
  assert.equal(formatWhiteBalance({ whiteBalanceMode: 0 }), "Automático");
  assert.equal(formatWhiteBalance({}), MISSING);
});

test("estimateAsShotKelvin deja de estimar cuando hay un valor real", () => {
  const measured = estimateAsShotKelvin({ colorTemperature: 4800, lightSource: 1 });
  assert.equal(measured.kelvin, 4800);
  assert.equal(measured.estimated, false, "un valor de MakerNote no es una estimación");

  const guessed = estimateAsShotKelvin({ lightSource: 3 });
  assert.equal(guessed.kelvin, 2850);
  assert.equal(guessed.estimated, true);
});

test("flash y resolución se leen sin adornos", () => {
  assert.equal(formatFlash({ flash: 9 }), "Disparó");
  assert.equal(formatFlash({ flash: 16 }), "No disparó");
  assert.equal(formatFlash({}), MISSING);
  assert.equal(formatDimensions({ width: 6000, height: 4000 }), "6000 × 4000 (24.0 MP)");
  assert.equal(formatDimensions({ width: 6000 }), MISSING);
});

test("MakerNotes informa de lo que se pudo leer y de lo que no", () => {
  assert.equal(formatMakerNotes({}), MISSING);
  assert.match(formatMakerNotes({ makerNotes: true }), /sin campos legibles/);
  assert.match(
    formatMakerNotes({ makerNotes: true, colorTemperature: 5200, lensTypeId: 42 }),
    /temperatura de color, tipo de objetivo/,
  );
});

test("un ARW real rellena todos los campos que el archivo trae", async () => {
  const { bytes } = makeArw({ iso: 1600 });
  const exif = await extractExif(await parseTiff(bufferSource(bytes)));
  const rows = metadataRows(exif);
  const byLabel = Object.fromEntries(rows.map((row) => [row.label, row]));

  assert.equal(byLabel["Cámara"].value, "SONY ZV-E10");
  assert.equal(byLabel["ISO"].value, "ISO 1600");
  assert.equal(byLabel["Apertura"].value, "f/1.8");
  assert.equal(byLabel["Velocidad"].value, "1/200 s");
  assert.equal(byLabel["Distancia focal"].value, "35 mm");
  assert.equal(byLabel["Objetivo"].value, "E 35mm F1.8 OSS");
  assert.equal(byLabel["Resolución"].value, "6000 × 4000 (24.0 MP)");
  assert.equal(byLabel["Flash"].value, "Disparó");
  assert.equal(byLabel["Balance de blancos"].missing, false);
  assert.notEqual(byLabel["Fecha"].value, MISSING);

  // Este fixture no lleva MakerNote, y eso se dice en lugar de disimularse.
  assert.equal(byLabel["MakerNotes"].value, MISSING);
});

test("un JPEG sin EXIF no rompe nada y se muestra vacío", () => {
  const rows = metadataRows({});
  assert.equal(rows.filter((row) => !row.missing).length, 0);
  assert.equal(formatIso({}), MISSING);
  assert.equal(formatLens({}), MISSING);
  assert.equal(formatCaptureDate({}), MISSING);
});
