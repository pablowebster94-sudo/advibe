import { test } from "node:test";
import assert from "node:assert/strict";

import { bufferSource } from "../lib/photo/raw/bytes";
import { parseTiff, TIFF_TAGS, findEntry, readString } from "../lib/photo/raw/tiff";
import { extractExif, parseExifDate, estimateAsShotKelvin } from "../lib/photo/raw/exif";
import { extractLargestPreview, readJpegSize } from "../lib/photo/raw/preview";
import { makeArw, makeJpeg } from "./fixtures";

test("readJpegSize lee dimensiones desde el marcador SOF0", () => {
  const jpeg = makeJpeg(1616, 1080);
  assert.deepEqual(readJpegSize(jpeg), { width: 1616, height: 1080 });
});

test("readJpegSize rechaza datos que no son JPEG", () => {
  assert.equal(readJpegSize(new Uint8Array([1, 2, 3, 4])), null);
});

test("parseTiff recorre IFD0, ExifIFD y SubIFD", async () => {
  const { bytes } = makeArw();
  const tiff = await parseTiff(bufferSource(bytes));

  assert.equal(tiff.littleEndian, true);
  const kinds = tiff.ifds.map((ifd) => ifd.kind).sort();
  assert.deepEqual(kinds, ["exif", "ifd0", "sub"]);

  assert.equal(await readString(tiff, findEntry(tiff, TIFF_TAGS.Make, ["ifd0"])), "SONY");
  assert.equal(await readString(tiff, findEntry(tiff, TIFF_TAGS.Model, ["ifd0"])), "ZV-E10");
});

test("parseTiff rechaza archivos que no son TIFF", async () => {
  await assert.rejects(
    () => parseTiff(bufferSource(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]))),
    /orden de bytes/,
  );
});

test("extractExif devuelve los campos que usa el motor", async () => {
  const { bytes } = makeArw({ iso: 3200 });
  const exif = await extractExif(await parseTiff(bufferSource(bytes)));

  assert.equal(exif.make, "SONY");
  assert.equal(exif.model, "ZV-E10");
  assert.equal(exif.iso, 3200);
  assert.equal(exif.lensModel, "E 35mm F1.8 OSS");
  assert.ok(Math.abs(exif.exposureTime! - 1 / 200) < 1e-9);
  assert.ok(Math.abs(exif.fNumber! - 1.8) < 1e-9);
  assert.equal(exif.focalLength, 35);
  assert.equal(exif.flash, 9);
  assert.equal(exif.width, 6000);
  assert.equal(exif.height, 4000);
  assert.equal(exif.dateTimeOriginal, "2026:08:08 19:42:11");
  assert.equal(exif.capturedAt, new Date(2026, 7, 8, 19, 42, 11).getTime());
});

test("parseExifDate tolera valores ausentes o corruptos", () => {
  assert.equal(parseExifDate(undefined), undefined);
  assert.equal(parseExifDate("no es fecha"), undefined);
  assert.equal(parseExifDate("2026:01:02 03:04:05"), new Date(2026, 0, 2, 3, 4, 5).getTime());
});

test("estimateAsShotKelvin usa LightSource y se marca como estimado", async () => {
  const { bytes } = makeArw();
  const exif = await extractExif(await parseTiff(bufferSource(bytes)));
  const estimate = estimateAsShotKelvin(exif);
  assert.equal(estimate.kelvin, 2850); // LightSource 3 = tungsteno
  assert.equal(estimate.estimated, true);
});

test("extractLargestPreview devuelve el JPEG embebido intacto", async () => {
  const { bytes, jpeg } = makeArw({ previewWidth: 1616, previewHeight: 1080 });
  const tiff = await parseTiff(bufferSource(bytes));
  const preview = await extractLargestPreview(tiff);

  assert.ok(preview, "se esperaba una previsualización");
  assert.equal(preview.width, 1616);
  assert.equal(preview.height, 1080);
  assert.equal(preview.length, jpeg.length);
  assert.deepEqual([...preview.bytes.subarray(0, 4)], [...jpeg.subarray(0, 4)]);
});

test("extractLargestPreview descarta previsualizaciones diminutas", async () => {
  const { bytes } = makeArw({ previewWidth: 120, previewHeight: 80 });
  const tiff = await parseTiff(bufferSource(bytes));
  assert.equal(await extractLargestPreview(tiff), null);
});
