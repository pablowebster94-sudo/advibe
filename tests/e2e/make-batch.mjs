/**
 * Builds a realistic 40-file batch: 10 distinct scenes shot as bursts of 4.
 *
 * Within a burst the frames differ slightly (a small subject shift and an
 * exposure nudge) and their EXIF timestamps are seconds apart; between bursts
 * the scene changes and the timestamps jump by minutes. That is what real
 * wedding coverage looks like, and it is what duplicate grouping has to handle.
 */
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Playwright may be installed globally rather than in this repo (the e2e suite
// is not part of `npm ci`), so it is resolved through an env var with a bare
// specifier as the fallback. See tests/e2e/README.md.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, ".artifacts", "batch");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

/** 10 visually distinct scenes, parameterised by burst index and frame index. */
function sceneSource(scene, frame) {
  const jitter = frame * 7;
  const gain = 1 + frame * 0.03;
  const palettes = [
    ["#f2ede4", "#8a6248", "#241f1c"], // preparativos, luz de ventana
    ["#cfd8e6", "#6b4a38", "#101418"], // ceremonia interior
    ["#e9f0f7", "#c0a080", "#3c4652"], // salida de iglesia
    ["#101014", "#d8a05a", "#050508"], // fiesta nocturna
    ["#dfe8d8", "#7a5a44", "#2a3324"], // exterior jardin
    ["#f7f4ef", "#b98d6c", "#4a4038"], // retrato clave alta
    ["#1a1d24", "#9a6a4a", "#0a0c10"], // baile
    ["#efe6d8", "#a8825f", "#5a4c3c"], // recepcion
    ["#c8d4e2", "#94684c", "#2c3440"], // pareja exterior
    ["#f4f4f2", "#cfcfcd", "#8e8e8c"], // detalle, bodegon claro
  ];
  const [bg, subject, dark] = palettes[scene % palettes.length];
  return `
    const W = 1616, H = 1080;
    const g = ctx.createLinearGradient(0, 0, W * ${0.3 + (scene % 5) * 0.15}, H);
    g.addColorStop(0, '${bg}');
    g.addColorStop(1, '${dark}');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Structure that differs per scene so the hashes separate.
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = i % 2 ? '${dark}' : '${bg}';
      const x = ((i * ${37 + scene * 11}) % W);
      const y = ((i * ${53 + scene * 17}) % H);
      ctx.fillRect(x, y, ${60 + scene * 12}, ${40 + scene * 9});
    }
    ctx.globalAlpha = 1;

    // Subject: shifts a few pixels between frames of the same burst.
    ctx.fillStyle = '${subject}';
    ctx.beginPath();
    ctx.ellipse(W * ${0.35 + (scene % 4) * 0.1} + ${jitter}, H * 0.55, W * 0.09, H * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(W * ${0.35 + (scene % 4) * 0.1} + ${jitter}, H * 0.3, W * 0.06, H * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Exposure nudge across the burst.
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255,255,255,${((gain - 1) * 0.8).toFixed(3)})';
    ctx.fillRect(0, 0, W, H);
  `;
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
});
const page = await browser.newPage();
await page.goto("about:blank");

const jpegs = [];
for (let scene = 0; scene < 10; scene += 1) {
  for (let frame = 0; frame < 4; frame += 1) {
    const base64 = await page.evaluate(async (source) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1616;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      new Function("ctx", source)(ctx);
      const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.9));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    }, sceneSource(scene, frame));
    jpegs.push({ scene, frame, bytes: new Uint8Array(Buffer.from(base64, "base64")) });
  }
}
await browser.close();

const { makeTiff } = await import("../fixtures.ts");

const pad = (n) => String(n).padStart(2, "0");
let index = 0;
for (const { scene, frame, bytes } of jpegs) {
  index += 1;
  // Bursts are seconds apart; scenes are minutes apart.
  const minute = 10 + scene * 4;
  const second = frame * 2;
  const iso = [200, 3200, 400, 6400, 200, 320, 6400, 1600, 250, 800][scene];

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
          [0x829a, { type: "rational", value: [[1, scene % 3 === 1 ? 60 : 250]] }],
          [0x829d, { type: "rational", value: [[18, 10]] }],
          [0x8827, { type: "short", value: [iso] }],
          [0x9003, { type: "ascii", value: `2026:08:08 1${scene % 2 ? 6 : 1}:${pad(minute)}:${pad(second)}` }],
          [0x9208, { type: "short", value: [scene % 3 === 1 ? 3 : 1] }],
          [0x9209, { type: "short", value: [scene === 3 || scene === 6 ? 9 : 16] }],
          [0x920a, { type: "rational", value: [[scene % 2 ? 85 : 35, 1]] }],
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
    bytes,
  );
  writeFileSync(join(out, `DSC0${7700 + index}.ARW`), Buffer.from(arw));
}

console.log(`Lote realista: ${index} archivos .ARW en 10 ráfagas de 4`);
