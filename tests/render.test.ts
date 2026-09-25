import { test } from "node:test";
import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";

import { buildCurveLut, toUniforms } from "../lib/photo/render/uniforms";
import { defaultAdjustments } from "../lib/photo/editing/adjustments";
import { ZipWriter, crc32, dosDateTime } from "../lib/photo/zip";
import { DEVELOP_SHADER, BLUR_SHADER, VERTEX_SHADER } from "../lib/photo/render/glsl";

test("buildCurveLut devuelve null para una curva lineal", () => {
  assert.equal(buildCurveLut([]), null);
  assert.equal(
    buildCurveLut([
      { x: 0, y: 0 },
      { x: 255, y: 255 },
    ]),
    null,
  );
});

test("buildCurveLut interpola de forma monótona y sin sobrepasar", () => {
  const lut = buildCurveLut([
    { x: 0, y: 0 },
    { x: 64, y: 40 },
    { x: 192, y: 215 },
    { x: 255, y: 255 },
  ]);
  assert.ok(lut);
  assert.equal(lut[0], 0);
  assert.equal(lut[255], 255);
  assert.equal(lut[64], 40);
  assert.equal(lut[192], 215);
  for (let index = 1; index < 256; index += 1) {
    assert.ok(lut[index] >= lut[index - 1], `la curva retrocede en ${index}`);
    assert.ok(lut[index] >= 0 && lut[index] <= 255);
  }
});

test("toUniforms normaliza los rangos de Lightroom al espacio del shader", () => {
  const adjustments = defaultAdjustments();
  adjustments.exposure = 1.5;
  adjustments.highlights = -50;
  adjustments.shadows = 100;
  adjustments.sharpenAmount = 150;
  adjustments.hsl.saturation.orange = -40;
  adjustments.colorGrade.shadowHue = 210;
  adjustments.colorGrade.shadowSat = 30;

  const uniforms = toUniforms(adjustments);
  assert.equal(uniforms.exposure, 1.5);
  assert.equal(uniforms.highlights, -0.5);
  assert.equal(uniforms.shadows, 1);
  assert.equal(uniforms.sharpen, 0.5);
  // El orden de bandas debe coincidir con bandWeight() del shader: naranja = 1.
  // Float32Array redondea, así que se compara con tolerancia.
  assert.ok(Math.abs(uniforms.hslSat[1] - -0.4) < 1e-6);
  assert.equal(uniforms.hslSat[0], 0);
  assert.deepEqual(uniforms.gradeShadow, [210, 0.3, 0]);
  assert.equal(uniforms.curve, null);
});

test("los shaders declaran todos los uniformes que el renderizador envía", () => {
  const declared = new Set(
    [...DEVELOP_SHADER.matchAll(/uniform\s+\w+\s+(\w+)/g)].map((match) => match[1]),
  );
  for (const name of [
    "uExposure",
    "uContrast",
    "uHighlights",
    "uShadows",
    "uWhites",
    "uBlacks",
    "uTemperature",
    "uTint",
    "uVibrance",
    "uSaturation",
    "uTexture",
    "uClarity",
    "uDehaze",
    "uSharpen",
    "uVignette",
    "uHslHue",
    "uHslSat",
    "uHslLum",
    "uGradeShadow",
    "uGradeGlobal",
    "uCurve",
    "uTexel",
    "uAspect",
  ]) {
    assert.ok(declared.has(name), `falta el uniform ${name} en el shader`);
  }
  for (const source of [DEVELOP_SHADER, BLUR_SHADER, VERTEX_SHADER]) {
    assert.ok(source.startsWith("#version 300 es"), "los shaders deben ser GLSL ES 3.00");
    const opens = (source.match(/\{/g) ?? []).length;
    const closes = (source.match(/\}/g) ?? []).length;
    assert.equal(opens, closes, "llaves desbalanceadas en el shader");
  }
});

// ---------------------------------------------------------------------------
// ZIP
// ---------------------------------------------------------------------------

test("crc32 coincide con el vector de referencia", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
  assert.equal(crc32(new Uint8Array(0)), 0);
});

test("dosDateTime codifica fecha y hora", () => {
  const { time, date } = dosDateTime(new Date(2026, 7, 18, 14, 3, 10));
  assert.equal((date >> 9) + 1980, 2026);
  assert.equal((date >> 5) & 0xf, 8);
  assert.equal(date & 0x1f, 18);
  assert.equal(time >> 11, 14);
  assert.equal((time >> 5) & 0x3f, 3);
});

test("ZipWriter produce un archivo que se puede descomprimir", async () => {
  const writer = new ZipWriter();
  const xmp = "<?xpacket begin=''?>".repeat(80);
  await writer.addFile("DSC08487.xmp", xmp, { modified: new Date(2026, 7, 18, 12, 0, 0) });
  await writer.addFile("DSC08488.xmp", xmp);
  // Mismo nombre otra vez: no debe sobrescribir en silencio.
  await writer.addFile("DSC08487.xmp", "otro contenido");

  assert.equal(writer.fileCount, 3);
  const bytes = new Uint8Array(await writer.finish().arrayBuffer());

  // Firma local, firma central y fin de directorio central.
  assert.equal(new DataView(bytes.buffer).getUint32(0, true), 0x04034b50);
  const eocdAt = bytes.length - 22;
  assert.equal(new DataView(bytes.buffer).getUint32(eocdAt, true), 0x06054b50);
  assert.equal(new DataView(bytes.buffer).getUint16(eocdAt + 10, true), 3);

  // Descomprimir la primera entrada con zlib demuestra que el DEFLATE es válido.
  const view = new DataView(bytes.buffer);
  const method = view.getUint16(8, true);
  const compressedSize = view.getUint32(18, true);
  const uncompressedSize = view.getUint32(22, true);
  const nameLength = view.getUint16(26, true);
  const extraLength = view.getUint16(28, true);
  const name = new TextDecoder().decode(bytes.subarray(30, 30 + nameLength));
  assert.equal(name, "DSC08487.xmp");

  const dataStart = 30 + nameLength + extraLength;
  const payload = bytes.subarray(dataStart, dataStart + compressedSize);
  const restored = method === 8 ? inflateRawSync(payload) : payload;
  assert.equal(restored.length, uncompressedSize);
  assert.equal(new TextDecoder().decode(restored), xmp);
  assert.equal(view.getUint32(14, true), crc32(new TextEncoder().encode(xmp)));

  // El tercer archivo debe haberse renombrado.
  const archive = new TextDecoder().decode(bytes);
  assert.ok(archive.includes("DSC08487-2.xmp"), "el nombre duplicado debe renombrarse");
});

test("ZipWriter no comprime cuando no ayuda", async () => {
  const writer = new ZipWriter();
  // Bytes incompresibles: xorshift determinista (los bits bajos de un LCG
  // simple sí se comprimen, así que no sirven para esta prueba).
  let state = 0x9e3779b9;
  const random = new Uint8Array(8192).map(() => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return (state >>> 24) & 0xff;
  });
  await writer.addFile("ruido.bin", random);
  const bytes = new Uint8Array(await writer.finish().arrayBuffer());
  const view = new DataView(bytes.buffer);
  assert.equal(view.getUint16(8, true), 0, "debe quedar almacenado sin comprimir");
  assert.equal(view.getUint32(18, true), view.getUint32(22, true));
});
