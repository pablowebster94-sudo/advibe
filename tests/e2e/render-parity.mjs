/**
 * Backend parity: WebGL2 and Canvas 2D must show the *same* edit.
 *
 * The Canvas 2D path exists so a phone that cannot get a GL context still gets
 * a real preview. That claim is only worth anything if the two backends agree,
 * so this drives the same photo and the same adjustments through both and
 * compares the pixels the user actually sees.
 *
 * It also proves the thing the whole feature is for: that moving each slider
 * changes the picture on the Canvas 2D path.
 */
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, ".artifacts", "fixtures");
const BASE = "http://localhost:3210";

let failures = 0;
function check(name, condition, detail = "") {
  const ok = Boolean(condition);
  if (!ok) failures += 1;
  console.log(`${ok ? "PASA " : "FALLA"}  ${name}${detail ? `  -- ${detail}` : ""}`);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});
const context = await browser.newContext({ viewport: { width: 1100, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

/** Mean per-channel value plus a coarse 4x4 spatial signature of the canvas. */
const sampleCanvas = () =>
  page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let r = 0;
    let g = 0;
    let b = 0;
    const cells = new Array(16).fill(0);
    const counts = new Array(16).fill(0);
    const width = canvas.width;
    const height = canvas.height;

    for (let i = 0, px = 0; i < data.length; i += 4, px += 1) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      const x = px % width;
      const y = (px - x) / width;
      const cell = Math.min(3, Math.floor((y / height) * 4)) * 4 + Math.min(3, Math.floor((x / width) * 4));
      cells[cell] += (data[i] + data[i + 1] + data[i + 2]) / 3;
      counts[cell] += 1;
    }
    const n = data.length / 4;
    return {
      width,
      height,
      r: r / n,
      g: g / n,
      b: b / n,
      cells: cells.map((sum, index) => sum / Math.max(1, counts[index])),
    };
  });

/** Opens every collapsed section so all sliders are reachable. */
async function expandPanels() {
  for (const title of ["Presencia", "Detalle", "Efectos"]) {
    const header = page.locator(`button:has-text("${title}")`).first();
    if ((await header.count()) === 0) continue;
    if ((await header.getAttribute("aria-expanded")) === "false") await header.click();
  }
  await page.waitForTimeout(300);
}

/** Sets one slider by its label and waits for the frame to be repainted. */
async function setSlider(label, value) {
  const target = page.locator(`label:has-text("${label}")`).first();
  await target.scrollIntoViewIfNeeded();
  const id = await target.getAttribute("for");
  await page.locator(`[id="${id}"]`).fill(String(value));
  await page.waitForTimeout(700);
}

async function openDevelop(query) {
  await page.goto(`${BASE}/studio${query}`, { waitUntil: "networkidle" });
  const projects = await page.locator("a[href^='/studio/prj_']").count();
  if (projects === 0) throw new Error("no hay proyecto para abrir");
  const href = await page.locator("a[href^='/studio/prj_']").first().getAttribute("href");
  await page.goto(`${BASE}${href}${query}`, { waitUntil: "networkidle" });
  await page.waitForSelector("img[alt$='.ARW']", { timeout: 30000 });
  await page.locator("img[alt$='.ARW']").first().click();
  await page.waitForSelector("canvas", { timeout: 30000 });
  await page.waitForTimeout(2500);
}

try {
  // Seed one project both runs will share.
  await page.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
  await page.fill('[data-testid="new-project-name"]', "Paridad de render");
  await Promise.all([page.waitForURL(/prj_/), page.click('[data-testid="create-project"]')]);
  const files = readdirSync(fixtures)
    .filter((f) => f.endsWith(".ARW"))
    .slice(0, 1)
    .map((f) => join(fixtures, f));
  await page.setInputFiles('input[type="file"]', files);
  await page.waitForFunction(() => document.body.innerText.includes("terminado"), null, {
    timeout: 300000,
  });

  // --------------------------------------------------------------- backends
  await openDevelop("?render=webgl2");
  const badgeGpu = await page.locator("span", { hasText: /^GPU$/ }).count();
  check("Con WebGL2 el preview reporta backend GPU", badgeGpu === 1, `insignias=${badgeGpu}`);
  const webgl = await sampleCanvas();

  await openDevelop("?render=canvas2d");
  const badgeCpu = await page.locator("span", { hasText: /^CPU$/ }).count();
  check("Forzando Canvas 2D el preview reporta backend CPU", badgeCpu === 1, `insignias=${badgeCpu}`);
  const canvas2d = await sampleCanvas();

  check(
    "Ningún backend deja el canvas vacío",
    webgl && canvas2d && webgl.r > 5 && canvas2d.r > 5,
    JSON.stringify({ webgl: webgl?.r?.toFixed(1), canvas2d: canvas2d?.r?.toFixed(1) }),
  );

  const channelDelta = Math.max(
    Math.abs(webgl.r - canvas2d.r),
    Math.abs(webgl.g - canvas2d.g),
    Math.abs(webgl.b - canvas2d.b),
  );
  check(
    "Los dos backends producen el mismo color medio",
    channelDelta < 6,
    `delta max por canal = ${channelDelta.toFixed(2)}/255`,
  );

  // Per-zone comparison catches what a mean cannot: an image rendered upside
  // down has an identical average and a completely different picture. That is
  // not hypothetical -- it is the bug this check was written after finding.
  const cellDelta = Math.max(...webgl.cells.map((v, i) => Math.abs(v - canvas2d.cells[i])));
  check(
    "Los dos backends coinciden también por zonas de la imagen",
    cellDelta < 12,
    `delta max por celda = ${cellDelta.toFixed(2)}/255`,
  );

  const topHalf = (s) => (s.cells.slice(0, 8).reduce((a, b) => a + b, 0)) / 8;
  const bottomHalf = (s) => (s.cells.slice(8).reduce((a, b) => a + b, 0)) / 8;
  check(
    "Ningún backend invierte la imagen verticalmente",
    Math.sign(topHalf(webgl) - bottomHalf(webgl)) === Math.sign(topHalf(canvas2d) - bottomHalf(canvas2d)),
    `webgl arriba=${topHalf(webgl).toFixed(0)} abajo=${bottomHalf(webgl).toFixed(0)} | canvas2d arriba=${topHalf(canvas2d).toFixed(0)} abajo=${bottomHalf(canvas2d).toFixed(0)}`,
  );

  // ------------------------------------------- every slider moves the pixels
  // This is the requirement in plain terms: on the Canvas 2D path, changing a
  // control has to change what you see.
  const controls = [
    ["Exposición", 0.9, 3],
    ["Contraste", 60, 1.5],
    ["Altas luces", -80, 1.5],
    ["Sombras", 80, 1.5],
    ["Blancos", 60, 1],
    ["Negros", -60, 1],
    ["Temperatura", 70, 2],
    ["Matiz", 60, 1],
    ["Saturación", 80, 1],
    ["Intensidad", 80, 0.6],
    ["Claridad", 70, 0.6],
    ["Textura", 70, 0.4],
    ["Neblina", 60, 1],
    ["Viñeta", -80, 1.5],
  ];

  await expandPanels();
  let baseline = await sampleCanvas();
  for (const [label, value, minDelta] of controls) {
    try {
      await setSlider(label, value);
    } catch (error) {
      check(`Canvas 2D: "${label}" existe en el panel`, false, error.message);
      continue;
    }
    const after = await sampleCanvas();
    const delta =
      Math.abs(after.r - baseline.r) + Math.abs(after.g - baseline.g) + Math.abs(after.b - baseline.b);
    const cells = Math.max(...after.cells.map((v, i) => Math.abs(v - baseline.cells[i])));
    check(
      `Canvas 2D: "${label}" cambia el preview`,
      delta > minDelta || cells > minDelta,
      `delta color=${delta.toFixed(2)} delta zonas=${cells.toFixed(2)} (mínimo ${minDelta})`,
    );
    baseline = after;
  }

  await page.screenshot({ path: join(here, ".artifacts", "paridad-canvas2d.png") });
} catch (error) {
  check("Ejecucion sin excepciones", false, error.message);
  console.error(error);
  await page.screenshot({ path: join(here, ".artifacts", "paridad-error.png") }).catch(() => {});
} finally {
  check("Sin errores de consola", errors.length === 0, [...new Set(errors)].slice(0, 3).join(" | "));
  await browser.close();
  console.log("");
  console.log(failures === 0 ? "Paridad de render: todo correcto" : `Paridad: ${failures} fallo(s)`);
  process.exit(failures > 0 ? 1 : 0);
}
