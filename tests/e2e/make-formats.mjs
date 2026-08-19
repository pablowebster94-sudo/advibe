/**
 * Generates the awkward inputs the app has to survive:
 *   - a PNG with no metadata at all
 *   - a large JPEG (5000x3333, ~15 MP)
 *   - an uncompressed RGB TIFF and an LZW TIFF, neither with a preview
 *   - a ~25 MB ARW carrying a full 6000x4000 embedded preview, the shape of a
 *     real Sony ZV-E10 file and the one that actually stresses memory
 *   - an ARW whose metadata reads but whose pixels cannot be decoded
 *   - a DNG, the same TIFF container under Adobe's extension
 *
 * The TIFFs are real files built byte by byte, not renamed JPEGs: they are the
 * only way to exercise the decoder, since a TIFF that happens to carry an
 * embedded preview never reaches it.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, ".artifacts", "fixtures");
mkdirSync(out, { recursive: true });

// --------------------------------------------------------------- raster art
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage();
await page.goto("about:blank");

async function encode(width, height, draw, type, quality) {
  const base64 = await page.evaluate(
    async ({ w, h, source, mime, q }) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      new Function("ctx", "W", "H", source)(ctx, w, h);
      const blob = await new Promise((r) => canvas.toBlob(r, mime, q));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = "";
      const chunk = 8192;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      }
      return btoa(binary);
    },
    { w: width, h: height, source: draw, mime: type, q: quality },
  );
  return Buffer.from(base64, "base64");
}

const SCENE = `
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#f4efe6'); g.addColorStop(0.5, '#8a6248'); g.addColorStop(1, '#1b2027');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
    ctx.fillRect((i * 137) % W, (i * 211) % H, W / 12, H / 16);
  }
  ctx.fillStyle = '#c8996f';
  ctx.beginPath(); ctx.ellipse(W * 0.5, H * 0.5, W * 0.12, H * 0.2, 0, 0, Math.PI * 2); ctx.fill();
`;

// A PNG never carries EXIF, which makes it the honest "no metadata" case.
const png = await encode(900, 600, SCENE, "image/png");
writeFileSync(join(out, "sin-exif.png"), png);
console.log(`PNG sin EXIF      sin-exif.png       ${(png.length / 1024).toFixed(0)} KB`);

const big = await encode(5000, 3333, SCENE, "image/jpeg", 0.92);
writeFileSync(join(out, "grande.jpg"), big);
console.log(`JPEG grande       grande.jpg         ${(big.length / 1024 / 1024).toFixed(1)} MB, 5000x3333`);

const plain = await encode(1400, 900, SCENE, "image/jpeg", 0.9);
writeFileSync(join(out, "normal.jpg"), plain);
console.log(`JPEG normal       normal.jpg         ${(plain.length / 1024).toFixed(0)} KB`);

// Raw RGB samples for the TIFFs, read back out of the canvas.
const width = 1200;
const height = 800;
const rgb = Buffer.from(
  await page.evaluate(
    async ({ w, h, source }) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      new Function("ctx", "W", "H", source)(ctx, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const out = new Uint8Array(w * h * 3);
      for (let i = 0, o = 0; i < data.length; i += 4, o += 3) {
        out[o] = data[i];
        out[o + 1] = data[i + 1];
        out[o + 2] = data[i + 2];
      }
      let binary = "";
      const chunk = 8192;
      for (let i = 0; i < out.length; i += chunk) {
        binary += String.fromCharCode.apply(null, out.subarray(i, i + chunk));
      }
      return btoa(binary);
    },
    { w: width, h: height, source: SCENE },
  ),
  "base64",
);

// ------------------------------------------------- a real-sized Sony-style ARW
// A camera ARW embeds a full-resolution preview: 6000x4000 is ~96 MB once
// decoded, which is exactly the case the import path has to survive without
// three copies alive at a time. The container is then padded to ~25 MB so the
// Blob is the size of a real file, proving we only ever slice what we need
// instead of reading the whole thing into memory.
const bigPreview = await encode(6000, 4000, SCENE, "image/jpeg", 0.94);
console.log(`Preview 24 MP     (en memoria)      ${(bigPreview.length / 1024 / 1024).toFixed(1)} MB, 6000x4000`);

await browser.close();

const { makeImageTiff, encodeLzw, makeTiff, makeUnreadableArw } = await import("../fixtures.ts");

const bigArw = makeTiff(
  [
    {
      name: "ifd0",
      tags: [
        [0x010f, { type: "ascii", value: "SONY" }],
        [0x0110, { type: "ascii", value: "ZV-E10" }],
        [0x0112, { type: "short", value: [1] }],
      ],
    },
    {
      name: "exif",
      tags: [
        [0x829a, { type: "rational", value: [[1, 250]] }],
        [0x829d, { type: "rational", value: [[20, 10]] }],
        [0x8827, { type: "short", value: [400] }],
        [0x9003, { type: "ascii", value: "2026:08:09 09:14:33" }],
        [0x920a, { type: "rational", value: [[35, 1]] }],
        [0xa002, { type: "long", value: [6000] }],
        [0xa003, { type: "long", value: [4000] }],
        [0xa434, { type: "ascii", value: "E 35mm F1.8 OSS" }],
      ],
    },
    {
      name: "sub",
      tags: [
        [0x0100, { type: "long", value: [6000] }],
        [0x0101, { type: "long", value: [4000] }],
        [0x0103, { type: "short", value: [6] }],
        [0x0201, { type: "jpegOffset" }],
        [0x0202, { type: "jpegLength" }],
      ],
    },
  ],
  new Uint8Array(bigPreview),
);

// Trailing bytes a TIFF reader never visits, only there to make the file the
// weight of a camera original.
const TARGET_BYTES = 25 * 1024 * 1024;
const padded = Buffer.concat([
  Buffer.from(bigArw),
  Buffer.alloc(Math.max(0, TARGET_BYTES - bigArw.length)),
]);
writeFileSync(join(out, "DSC09500.ARW"), padded);
console.log(
  `ARW 25 MB          DSC09500.ARW       ${(padded.length / 1024 / 1024).toFixed(1)} MB, preview 6000x4000`,
);

// A DNG is the same TIFF container with Adobe's tags; what the app has to get
// right is detecting it by extension and reading its preview like any other.
const dng = makeTiff(
  [
    {
      name: "ifd0",
      tags: [
        [0x010f, { type: "ascii", value: "SONY" }],
        [0x0110, { type: "ascii", value: "ZV-E10" }],
        [0x0112, { type: "short", value: [1] }],
        // DNGVersion 1.4.0.0, the tag that makes a TIFF a DNG.
        [0xc612, { type: "undefined", value: [1, 4, 0, 0] }],
      ],
    },
    {
      name: "exif",
      tags: [
        [0x829a, { type: "rational", value: [[1, 125]] }],
        [0x829d, { type: "rational", value: [[40, 10]] }],
        [0x8827, { type: "short", value: [3200] }],
        [0x9003, { type: "ascii", value: "2026:08:09 20:31:47" }],
        [0x920a, { type: "rational", value: [[24, 1]] }],
        [0xa002, { type: "long", value: [6000] }],
        [0xa003, { type: "long", value: [4000] }],
        [0xa434, { type: "ascii", value: "E 24mm F2.8 G" }],
      ],
    },
    {
      name: "sub",
      tags: [
        [0x0100, { type: "long", value: [1400] }],
        [0x0101, { type: "long", value: [900] }],
        [0x0103, { type: "short", value: [6] }],
        [0x0201, { type: "jpegOffset" }],
        [0x0202, { type: "jpegLength" }],
      ],
    },
  ],
  new Uint8Array(plain),
);
writeFileSync(join(out, "DSC09600.dng"), Buffer.from(dng));
console.log(`DNG                DSC09600.dng       ${(dng.length / 1024).toFixed(0)} KB, preview 1400x900`);

const unreadable = makeUnreadableArw();
writeFileSync(join(out, "DSC09501.ARW"), Buffer.from(unreadable));
console.log(
  `ARW no legible     DSC09501.ARW       ${unreadable.length} bytes, compresion 7 sin preview`,
);
const samples = new Uint8Array(rgb);

const uncompressed = makeImageTiff({
  width,
  height,
  compression: 1,
  photometric: 2,
  samples,
  rowsPerStrip: 64,
});
writeFileSync(join(out, "escaneo.tif"), Buffer.from(uncompressed));
console.log(
  `TIFF sin comprimir escaneo.tif        ${(uncompressed.length / 1024 / 1024).toFixed(1)} MB, ${width}x${height}`,
);

const lzw = makeImageTiff({
  width,
  height,
  compression: 5,
  photometric: 2,
  samples,
  strips: [encodeLzw(samples)],
});
writeFileSync(join(out, "capa.tif"), Buffer.from(lzw));
console.log(
  `TIFF LZW           capa.tif           ${(lzw.length / 1024 / 1024).toFixed(1)} MB, ${width}x${height}`,
);

console.log("\nFormatos listos en tests/e2e/.artifacts/fixtures");
