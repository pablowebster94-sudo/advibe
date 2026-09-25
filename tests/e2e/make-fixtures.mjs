/**
 * Generates real test files:
 *  - a genuine JPEG, encoded by Chromium's own encoder
 *  - a synthetic Sony-style .ARW: a real TIFF container whose SubIFD points at
 *    that real JPEG as the embedded preview, with a real EXIF IFD
 *
 * The ARW is synthetic, not a camera file, but it is structurally what the
 * parser has to handle: II*\0 header, IFD chain, ExifIFD pointer, SubIFD with
 * JpegInterchangeFormat/Length.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Playwright may be installed globally rather than in this repo (the e2e suite
// is not part of `npm ci`), so it is resolved through an env var with a bare
// specifier as the fallback. See tests/e2e/README.md.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, ".artifacts", "fixtures");
mkdirSync(out, { recursive: true });

const SCENES = {
  // A backlit portrait: bright window behind, skin-toned subject in the middle,
  // deliberately under-exposed so the engine has a real decision to make.
  "retrato-contraluz": (w, h) => `
    const g = ctx.createLinearGradient(0, 0, ${w}, 0);
    g.addColorStop(0, '#f6f4ee'); g.addColorStop(0.28, '#cfd4d8');
    g.addColorStop(0.5, '#41474d'); g.addColorStop(0.72, '#cfd4d8'); g.addColorStop(1, '#f8f6f0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, ${w}, ${h});
    ctx.fillStyle = '#1c2024'; ctx.fillRect(0, ${h} * 0.62, ${w}, ${h} * 0.38);
    ctx.fillStyle = '#6b4a38';
    ctx.beginPath(); ctx.ellipse(${w}/2, ${h}*0.62, ${w}*0.13, ${h}*0.26, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#8a6248';
    ctx.beginPath(); ctx.ellipse(${w}/2, ${h}*0.36, ${w}*0.085, ${h}*0.13, 0, 0, Math.PI*2); ctx.fill();
  `,
  // A well-exposed neutral scene: the engine should leave this one alone.
  "correcta-neutra": (w, h) => `
    const g = ctx.createLinearGradient(0, 0, 0, ${h});
    g.addColorStop(0, '#b9b9b9'); g.addColorStop(1, '#4a4a4a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, ${w}, ${h});
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = 'rgba(' + (90 + (i*37)%110) + ',' + (90 + (i*53)%110) + ',' + (90 + (i*71)%110) + ',0.5)';
      ctx.fillRect((i*97)%${w}, (i*61)%${h}, 26, 26);
    }
  `,
  // Blown highlights with no data left: the engine must refuse to "recover" them.
  "luces-quemadas": (w, h) => `
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(0, 0, ${w}, ${h});
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, ${w} * 0.42, ${h});
    for (let i = 0; i < 150; i++) {
      ctx.fillStyle = 'rgba(20,20,20,0.35)';
      ctx.fillRect(${w}*0.45 + (i*53)%(${w}*0.5), (i*79)%${h}, 18, 18);
    }
  `,
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage();
await page.goto("about:blank");

const jpegs = {};
for (const [name, draw] of Object.entries(SCENES)) {
  const base64 = await page.evaluate(
    async ({ drawSource, w, h }) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      new Function("ctx", drawSource)(ctx);
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      const buffer = await blob.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    },
    { drawSource: draw(1616, 1080), w: 1616, h: 1080 },
  );
  const bytes = Buffer.from(base64, "base64");
  jpegs[name] = new Uint8Array(bytes);
  writeFileSync(join(out, `${name}.jpg`), bytes);
  console.log(`JPEG real  ${name}.jpg  ${bytes.length} bytes  SOI=${bytes[0].toString(16)}${bytes[1].toString(16)}`);
}

await browser.close();

// --- Wrap the real JPEGs into real TIFF/ARW containers ---------------------
const { makeTiff } = await import("../fixtures.ts");

let index = 0;
for (const jpeg of Object.values(jpegs)) {
  index += 1;
  const arw = makeTiff(
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
          [0x829a, { type: "rational", value: [[1, 160]] }],
          [0x829d, { type: "rational", value: [[18, 10]] }],
          [0x8827, { type: "short", value: [index === 3 ? 6400 : 800] }],
          [0x9003, { type: "ascii", value: `2026:08:08 1${index}:2${index}:11` }],
          [0x9208, { type: "short", value: [index === 1 ? 1 : 3] }],
          [0x9209, { type: "short", value: [index === 3 ? 9 : 16] }],
          [0x920a, { type: "rational", value: [[35, 1]] }],
          [0xa002, { type: "long", value: [6000] }],
          [0xa003, { type: "long", value: [4000] }],
          [0xa434, { type: "ascii", value: "E 35mm F1.8 OSS" }],
        ],
      },
      {
        name: "sub",
        tags: [
          [0x0100, { type: "long", value: [1616] }],
          [0x0101, { type: "long", value: [1080] }],
          [0x0103, { type: "short", value: [6] }],
          [0x0201, { type: "jpegOffset" }],
          [0x0202, { type: "jpegLength" }],
        ],
      },
    ],
    jpeg,
  );
  const fileName = `DSC0${8480 + index}.ARW`;
  writeFileSync(join(out, fileName), Buffer.from(arw));
  console.log(`ARW real   ${fileName}  ${arw.length} bytes  header=${String.fromCharCode(arw[0], arw[1])}`);
}
console.log("\nFixtures listos en tests/e2e/.artifacts/fixtures");
