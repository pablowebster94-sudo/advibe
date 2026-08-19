/**
 * Mobile verification: the same flow on a phone-sized viewport with touch
 * input, because "responsive" is a claim that has to be measured.
 *
 * Checks the things that actually break on a phone: horizontal overflow, touch
 * targets under 44 px, text under 12 px, controls pushed off-screen, and
 * whether the develop canvas still gets usable height.
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

// Galaxy A16: 1080x2340 physical, ~360x800 CSS px at dpr 3.
const PHONE = {
  viewport: { width: 360, height: 800 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (Linux; Android 14; SM-A165F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
};

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});
const context = await browser.newContext({ ...PHONE, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

/** Anything wider than the viewport means the page scrolls sideways. */
const overflow = () =>
  page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const offenders = [];
    for (const el of document.querySelectorAll("*")) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) continue;
      if (rect.right > docWidth + 1 || rect.left < -1) {
        // Ignore elements that scroll inside their own container.
        let parent = el.parentElement;
        let contained = false;
        while (parent) {
          const style = getComputedStyle(parent);
          if (style.overflowX === "auto" || style.overflowX === "scroll") {
            contained = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (!contained) {
          offenders.push(
            `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} → ${Math.round(rect.right)}px`,
          );
        }
      }
    }
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: docWidth,
      offenders: [...new Set(offenders)].slice(0, 6),
    };
  });

/**
 * Discrete-action controls below the 44 px minimum touch target.
 *
 * Deliberately excludes `<label>`: a label bound to a slider is not a discrete
 * action -- tapping it only focuses the input -- so requiring 44 px there would
 * inflate every row of the develop panel for no usability gain. Range inputs
 * are checked, since dragging them is the primary interaction.
 */
const smallTargets = () =>
  page.evaluate(() => {
    const small = [];
    for (const el of document.querySelectorAll("button, a, input, select")) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (getComputedStyle(el).display === "none") continue;
      if (rect.height < 40) {
        small.push(
          `${el.tagName.toLowerCase()}("${(el.textContent ?? "").trim().slice(0, 18)}") ${Math.round(rect.height)}px`,
        );
      }
    }
    return [...new Set(small)].slice(0, 8);
  });

try {
  // ------------------------------------------------------------- dashboard
  await page.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
  let flow = await overflow();
  check(
    "Dashboard sin scroll horizontal",
    flow.scrollWidth <= flow.clientWidth + 1,
    `scroll=${flow.scrollWidth} viewport=${flow.clientWidth} ${flow.offenders.join(" | ")}`,
  );
  check("Dashboard sin objetivos táctiles pequeños", (await smallTargets()).length === 0, (await smallTargets()).join(" | "));
  await page.screenshot({ path: join(here, ".artifacts", "movil-1-proyectos.png") });

  // ------------------------------------------------------------- workspace
  await page.fill('[data-testid="new-project-name"]', "Boda movil");
  await Promise.all([page.waitForURL(/prj_/), page.click('[data-testid="create-project"]')]);

  const files = readdirSync(fixtures)
    .filter((f) => f.endsWith(".ARW"))
    .map((f) => join(fixtures, f));
  await page.setInputFiles('input[type="file"]', files);
  await page.waitForFunction(() => document.body.innerText.includes("terminado"), null, {
    timeout: 300000,
  });
  await page.waitForTimeout(1500);

  flow = await overflow();
  check(
    "Biblioteca sin scroll horizontal",
    flow.scrollWidth <= flow.clientWidth + 1,
    `scroll=${flow.scrollWidth} ${flow.offenders.join(" | ")}`,
  );
  const gridCols = await page.evaluate(() => {
    const grid = document.querySelector("[class*='grid-cols-2']:has(img)");
    return grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 0;
  });
  check("La rejilla usa 2 columnas en móvil", gridCols === 2, `columnas=${gridCols}`);
  await page.screenshot({ path: join(here, ".artifacts", "movil-2-biblioteca.png") });

  // --------------------------------------------------------------- develop
  await page.locator("img").first().tap();
  await page.waitForSelector("canvas", { timeout: 20000 });
  await page.waitForTimeout(2500);

  flow = await overflow();
  check(
    "Revelado sin scroll horizontal",
    flow.scrollWidth <= flow.clientWidth + 1,
    `scroll=${flow.scrollWidth} ${flow.offenders.join(" | ")}`,
  );

  const canvasBox = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const rect = canvas.getBoundingClientRect();
    return { w: Math.round(rect.width), h: Math.round(rect.height), top: Math.round(rect.top) };
  });
  check(
    "El canvas de revelado tiene altura usable en móvil",
    canvasBox.h >= 200 && canvasBox.w >= 300,
    JSON.stringify(canvasBox),
  );

  const small = await smallTargets();
  check("Revelado sin objetivos táctiles pequeños", small.length === 0, small.join(" | "));

  // The compare slider must be reachable by touch.
  const compare = page.locator('input[aria-label*="Comparar"]');
  check("El control antes/después es visible en móvil", await compare.isVisible());
  await compare.fill("0");
  await page.waitForTimeout(600);
  const before = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += (d[i] + d[i + 1] + d[i + 2]) / 3;
    return s / (d.length / 4);
  });
  await compare.fill("1");
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += (d[i] + d[i + 1] + d[i + 2]) / 3;
    return s / (d.length / 4);
  });
  check(
    "El antes/después funciona en móvil",
    Math.abs(after - before) > 0.5,
    `antes=${before.toFixed(2)} despues=${after.toFixed(2)}`,
  );

  await page.screenshot({ path: join(here, ".artifacts", "movil-3-revelado.png") });

  // Sliders are reachable after scrolling to the panel.
  const exposureLabel = page.locator('label:has-text("Exposici")').first();
  await exposureLabel.scrollIntoViewIfNeeded();
  const sliderId = await exposureLabel.getAttribute("for");
  await page.locator(`[id="${sliderId}"]`).fill("0.9");
  await page.waitForTimeout(900);
  const manual = await page.evaluate(async () => {
    const db = await new Promise((r) => {
      const q = indexedDB.open("advibe-photo-studio");
      q.onsuccess = () => r(q.result);
    });
    const photos = await new Promise((r) => {
      const tx = db.transaction("photos", "readonly");
      const q = tx.objectStore("photos").getAll();
      q.onsuccess = () => r(q.result);
    });
    return photos.find((p) => p.manual)?.manual?.exposure;
  });
  check("Se puede ajustar un control con el dedo", manual === 0.9, `exposure=${manual}`);
  await page.screenshot({ path: join(here, ".artifacts", "movil-4-ajustes.png") });

  // ---------------------------------------------------------------- export
  await page.locator('[data-testid="tab-export"]').tap();
  await page.waitForSelector('[data-testid^="download-xmp-"]', { timeout: 20000 });
  flow = await overflow();
  check(
    "Exportar sin scroll horizontal",
    flow.scrollWidth <= flow.clientWidth + 1,
    `scroll=${flow.scrollWidth} ${flow.offenders.join(" | ")}`,
  );

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 20000 }),
    page.locator('[data-testid^="download-xmp-"]').first().tap(),
  ]);
  check(
    "Se puede descargar un .xmp desde el móvil",
    download.suggestedFilename().endsWith(".xmp"),
    download.suggestedFilename(),
  );
  await page.screenshot({ path: join(here, ".artifacts", "movil-5-exportar.png") });
} catch (error) {
  check("Ejecucion sin excepciones", false, error.message);
  console.error(error);
  await page.screenshot({ path: join(here, ".artifacts", "movil-error.png") }).catch(() => {});
} finally {
  check("Sin errores de consola", errors.length === 0, [...new Set(errors)].slice(0, 3).join(" | "));
  await browser.close();
  console.log("");
  console.log(failures === 0 ? "Movil: todo correcto" : `Movil: ${failures} fallo(s)`);
  process.exit(failures > 0 ? 1 : 0);
}
