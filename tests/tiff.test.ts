import { test } from "node:test";
import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";

import { bufferSource } from "../lib/photo/raw/bytes";
import { parseTiff } from "../lib/photo/raw/tiff";
import {
  decodeLzw,
  decodePackBits,
  decodeTiffImage,
  findLargestDecodableIfd,
  inspectTiffImage,
} from "../lib/photo/raw/tiffImage";
import { encodeLzw, encodePackBits, makeImageTiff } from "./fixtures";

/** A deterministic RGB ramp with structure the predictor can bite on. */
function rgbSamples(width: number, height: number): Uint8Array {
  const out = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 3;
      out[at] = Math.round((x / Math.max(1, width - 1)) * 255);
      out[at + 1] = Math.round((y / Math.max(1, height - 1)) * 255);
      out[at + 2] = (x * 7 + y * 13) % 256;
    }
  }
  return out;
}

async function decode(bytes: Uint8Array) {
  const file = await parseTiff(bufferSource(bytes));
  const index = await findLargestDecodableIfd(file);
  assert.notEqual(index, -1, "debería haber un IFD decodificable");
  return decodeTiffImage(file, index);
}

test("decodePackBits expande runs literales y repetidos", () => {
  // 0xFE 0xAA -> "AA" x3 ; 0x02 "abc" -> literal
  const input = Uint8Array.of(0xfe, 0xaa, 0x02, 0x61, 0x62, 0x63);
  assert.deepEqual([...decodePackBits(input, 6)], [0xaa, 0xaa, 0xaa, 0x61, 0x62, 0x63]);
});

test("decodePackBits ignora el byte de relleno -128", () => {
  const input = Uint8Array.of(0x80, 0x00, 0x41);
  assert.deepEqual([...decodePackBits(input, 2)], [0x41, 0x00]);
});

test("decodeLzw invierte a un codificador independiente", () => {
  const original = new Uint8Array(3000);
  for (let index = 0; index < original.length; index += 1) {
    original[index] = (index * 31 + Math.floor(index / 97)) % 256;
  }
  const decoded = decodeLzw(encodeLzw(original), original.length);
  assert.deepEqual([...decoded], [...original], "el ida y vuelta LZW debe conservar los bytes");
});

test("decodeLzw sobrevive a un flujo truncado sin colgarse", () => {
  const encoded = encodeLzw(new Uint8Array(500).fill(7));
  const truncated = encoded.subarray(0, Math.floor(encoded.length / 2));
  const decoded = decodeLzw(truncated, 500);
  assert.equal(decoded.length, 500);
});

test("decodifica un TIFF RGB sin comprimir", async () => {
  const samples = rgbSamples(16, 12);
  const image = await decode(
    makeImageTiff({ width: 16, height: 12, compression: 1, photometric: 2, samples }),
  );

  assert.equal(image.width, 16);
  assert.equal(image.height, 12);
  // Esquina superior izquierda: rojo 0, verde 0.
  assert.equal(image.data[0], 0);
  assert.equal(image.data[1], 0);
  // Esquina superior derecha: rojo al máximo.
  assert.equal(image.data[15 * 4], 255);
  // Última fila: verde al máximo.
  assert.equal(image.data[(11 * 16) * 4 + 1], 255);
  // Alfa siempre opaco.
  assert.equal(image.data[3], 255);
});

test("decodifica TIFF con PackBits, LZW y Deflate al mismo resultado", async () => {
  const width = 24;
  const height = 16;
  const samples = rgbSamples(width, height);
  const base = await decode(
    makeImageTiff({ width, height, compression: 1, photometric: 2, samples }),
  );

  const variants: Array<[string, Uint8Array]> = [
    ["PackBits", makeImageTiff({ width, height, compression: 32773, photometric: 2, samples, strips: [encodePackBits(samples)] })],
    ["LZW", makeImageTiff({ width, height, compression: 5, photometric: 2, samples, strips: [encodeLzw(samples)] })],
    ["Deflate", makeImageTiff({ width, height, compression: 8, photometric: 2, samples, strips: [new Uint8Array(deflateSync(Buffer.from(samples)))] })],
  ];

  for (const [name, bytes] of variants) {
    const image = await decode(bytes);
    assert.deepEqual([...image.data], [...base.data], `${name} debe dar el mismo píxel que sin comprimir`);
  }
});

test("decodifica TIFF en varias bandas (strips)", async () => {
  const width = 20;
  const height = 15;
  const samples = rgbSamples(width, height);
  const single = await decode(makeImageTiff({ width, height, compression: 1, photometric: 2, samples }));
  const striped = await decode(
    makeImageTiff({ width, height, compression: 1, photometric: 2, samples, rowsPerStrip: 4 }),
  );
  assert.deepEqual([...striped.data], [...single.data]);
});

test("deshace el predictor horizontal", async () => {
  const width = 16;
  const height = 8;
  const samples = rgbSamples(width, height);

  // Aplica la diferencia horizontal que el predictor 2 espera encontrar.
  const differenced = new Uint8Array(samples);
  for (let y = 0; y < height; y += 1) {
    const row = y * width * 3;
    for (let x = width - 1; x >= 1; x -= 1) {
      for (let c = 0; c < 3; c += 1) {
        differenced[row + x * 3 + c] = (samples[row + x * 3 + c] - samples[row + (x - 1) * 3 + c]) & 0xff;
      }
    }
  }

  const image = await decode(
    makeImageTiff({ width, height, compression: 1, photometric: 2, samples: differenced, predictor: 2 }),
  );
  const expected = await decode(makeImageTiff({ width, height, compression: 1, photometric: 2, samples }));
  assert.deepEqual([...image.data], [...expected.data]);
});

test("decodifica gris de 16 bits y respeta WhiteIsZero", async () => {
  const width = 8;
  const height = 4;
  const samples = new Uint8Array(width * height * 2);
  const view = new DataView(samples.buffer);
  for (let index = 0; index < width * height; index += 1) {
    view.setUint16(index * 2, Math.round((index / (width * height - 1)) * 65535), true);
  }

  const blackIsZero = await decode(
    makeImageTiff({ width, height, compression: 1, photometric: 1, bitsPerSample: 16, samples }),
  );
  assert.equal(blackIsZero.data[0], 0);
  assert.equal(blackIsZero.data[(width * height - 1) * 4], 255);

  const whiteIsZero = await decode(
    makeImageTiff({ width, height, compression: 1, photometric: 0, bitsPerSample: 16, samples }),
  );
  assert.equal(whiteIsZero.data[0], 255, "WhiteIsZero invierte la rampa");
  assert.equal(whiteIsZero.data[(width * height - 1) * 4], 0);
});

test("decodifica TIFF con paleta", async () => {
  const width = 4;
  const height = 2;
  const samples = Uint8Array.from([0, 1, 2, 0, 1, 2, 0, 1]);
  // Tres entradas de paleta: rojo, verde, azul (valores de 16 bits).
  const palette = [65535, 0, 0, 0, 65535, 0, 0, 0, 65535];
  const image = await decode(
    makeImageTiff({ width, height, compression: 1, photometric: 3, samples, palette }),
  );
  assert.deepEqual([...image.data.slice(0, 4)], [255, 0, 0, 255]);
  assert.deepEqual([...image.data.slice(4, 8)], [0, 255, 0, 255]);
  assert.deepEqual([...image.data.slice(8, 12)], [0, 0, 255, 255]);
});

test("informa con claridad de lo que no soporta en lugar de fallar de forma opaca", async () => {
  const samples = rgbSamples(8, 8);
  const bytes = makeImageTiff({ width: 8, height: 8, compression: 7, photometric: 2, samples });
  const file = await parseTiff(bufferSource(bytes));
  const support = await inspectTiffImage(file, 0);
  assert.equal(support.supported, false);
  assert.match(support.reason ?? "", /Compresión TIFF 7/);
  assert.equal(await findLargestDecodableIfd(file), -1);
});
