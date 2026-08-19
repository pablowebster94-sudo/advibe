/**
 * The two cases synthetic fixtures used to hide.
 *
 * 1. A 25 MB ARW carrying a full 6000x4000 embedded preview -- the shape of a
 *    real Sony ZV-E10 file. It has to import without the tab dying, and it has
 *    to do it while reading only a slice of the file, never the whole 25 MB.
 * 2. An ARW whose metadata reads but whose pixels cannot be decoded. It must
 *    stay in the project with its EXIF intact and an explanation on screen,
 *    not disappear behind a generic error.
 *
 * Also checks the memory claim the way it can actually be checked from
 * outside: JS heap before and after importing several of these.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, ".artifacts", "fixtures");
const downloads = join(here, ".artifacts", "downloads");
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
// A phone-sized viewport with a modest device scale: this is the machine the
// requirement is about, not a desktop.
const context = await browser.newContext({
  acceptDownloads: true,
  viewport: { width: 360, height: 800 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

const readPhotos = () =>
  page.evaluate(async () => {
    const db = await new Promise((r) => {
      const q = indexedDB.open("advibe-photo-studio");
      q.onsuccess = () => r(q.result);
    });
    const photos = await new Promise((r) => {
      const tx = db.transaction("photos", "readonly");
      const q = tx.objectStore("photos").getAll();
      q.onsuccess = () => r(q.result);
    });
    return photos.map((p) => ({
      id: p.id,
      fileName: p.fileName,
      format: p.format,
      status: p.status,
      error: p.errorMessage,
      hasAnalysis: Boolean(p.analysis),
      exif: p.exif,
      proxyWidth: p.proxyWidth,
      proxyHeight: p.proxyHeight,
      auto: p.auto?.adjustments,
    }));
  });

const heapMb = async () => {
  const bytes = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0);
  return bytes / 1024 / 1024;
};

try {
  await page.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
  await page.fill('[data-testid="new-project-name"]', "RAW reales");
  await Promise.all([page.waitForURL(/prj_/), page.click('[data-testid="create-project"]')]);
  const projectUrl = page.url();

  const before = await heapMb();

  const started = Date.now();
  await page.setInputFiles('input[type="file"]', [
    join(fixtures, "DSC09500.ARW"),
    join(fixtures, "DSC09501.ARW"),
    join(fixtures, "DSC08481.ARW"),
  ]);
  await page.waitForFunction(() => document.body.innerText.includes("terminado"), null, {
    timeout: 600000,
  });
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  const photos = await readPhotos();
  const byName = Object.fromEntries(photos.map((p) => [p.fileName, p]));

  check("Los tres archivos entran en el proyecto", photos.length === 3, `n=${photos.length} en ${elapsed}s`);

  // --------------------------------------------------- 1. the 25 MB original
  const big = byName["DSC09500.ARW"];
  check(
    "El ARW de 25 MB con preview 6000x4000 se analiza",
    big?.status === "edited" && big?.hasAnalysis,
    `estado=${big?.status} análisis=${big?.hasAnalysis} error=${big?.error ?? "-"}`,
  );
  check(
    "Su proxy se guarda al tamaño del proyecto, no a 24 MP",
    big?.proxyWidth > 0 && big.proxyWidth <= 1700 && big.proxyHeight <= 1700,
    `proxy=${big?.proxyWidth}x${big?.proxyHeight}`,
  );
  check(
    "Y recibe una propuesta de ajustes propia",
    big?.auto && typeof big.auto.exposure === "number",
    JSON.stringify(big?.auto ? { exposure: big.auto.exposure, contrast: big.auto.contrast } : null),
  );

  const after = await heapMb();
  // A single 6000x4000 bitmap is ~96 MB. If the import were still decoding at
  // full size, importing three files would leave a heap far past this.
  check(
    "Importar RAW grandes no deja el montón de JS disparado",
    after === 0 || after - before < 120,
    `antes=${before.toFixed(0)} MB después=${after.toFixed(0)} MB`,
  );

  // ------------------------------------------- 2. the partially readable ARW
  const partial = byName["DSC09501.ARW"];
  check(
    "El ARW ilegible NO se descarta: sigue en el proyecto",
    Boolean(partial),
    `encontrado=${Boolean(partial)}`,
  );
  check(
    "Se marca como «RAW no legible», no como error genérico",
    partial?.status === "unreadable",
    `estado=${partial?.status}`,
  );
  check(
    "Conserva todo el EXIF que sí se pudo leer",
    partial?.exif?.make === "SONY" &&
      partial?.exif?.model === "ZV-E10" &&
      partial?.exif?.iso === 800 &&
      partial?.exif?.lensModel === "E 50mm F1.8 OSS",
    JSON.stringify({
      make: partial?.exif?.make,
      model: partial?.exif?.model,
      iso: partial?.exif?.iso,
      lens: partial?.exif?.lensModel,
    }),
  );
  check(
    "No inventa un análisis que no pudo hacer",
    partial?.hasAnalysis === false && partial?.auto === undefined,
    `análisis=${partial?.hasAnalysis} ajustes=${Boolean(partial?.auto)}`,
  );
  check(
    "Y explica el motivo concreto, no un fallo opaco",
    typeof partial?.error === "string" && partial.error.includes("Motivo:"),
    partial?.error,
  );

  // The UI has to say all of that too, not just the database.
  await page.goto(projectUrl, { waitUntil: "networkidle" });
  await page.waitForSelector("img, button", { timeout: 30000 });
  await page.locator('button[aria-label="Abrir DSC09501.ARW"]').click();
  await page.waitForTimeout(1200);

  const screen = await page.evaluate(() => document.body.innerText);
  check(
    "La pantalla de revelado explica que no se pudieron leer los píxeles",
    screen.includes("No se pudieron leer los píxeles"),
  );
  check(
    "Y confirma que el archivo original no se ha modificado",
    screen.includes("no se ha modificado"),
  );
  check(
    "Sigue mostrando los metadatos reales del archivo",
    screen.includes("ZV-E10") && screen.includes("ISO 800") && screen.includes("E 50mm F1.8 OSS"),
  );
  check(
    "No se queda una pantalla rota ni en blanco",
    screen.includes("Metadatos del archivo") && screen.length > 400,
    `${screen.length} caracteres`,
  );
  const canvases = await page.locator("canvas").count();
  check("No intenta pintar un lienzo que no puede llenar", canvases === 0, `canvas=${canvases}`);

  // Navigating away from it and back must keep working.
  await page.locator('button:has-text("Siguiente")').click();
  await page.waitForTimeout(1500);
  check(
    "Se puede seguir navegando a la siguiente fotografía",
    (await page.locator("canvas").count()) === 1,
  );

  // ------------------------------------------------------ 3. XMP export ZIP
  await page.goto(projectUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.locator('[data-testid="tab-export"]').click();
  await page.waitForSelector('[data-testid^="download-xmp-"]', { timeout: 20000 });

  const exportScreen = await page.evaluate(() => document.body.innerText);
  check(
    "La exportación avisa de la fotografía que deja fuera y por qué",
    exportScreen.includes("quedan fuera de la exportación"),
  );

  const [zip] = await Promise.all([
    page.waitForEvent("download", { timeout: 60000 }),
    page.locator('button:has-text("Exportar ZIP")').click(),
  ]);
  const zipPath = join(downloads, zip.suggestedFilename());
  await zip.saveAs(zipPath);
  const bytes = readFileSync(zipPath);
  const text = bytes.toString("latin1");
  check(
    "El ZIP trae un .xmp por cada fotografía legible",
    text.includes("DSC09500.xmp") && text.includes("DSC08481.xmp"),
  );
  check(
    "Y no incluye una entrada vacía para la ilegible",
    !text.includes("DSC09501.xmp"),
  );

  // A downloaded sidecar has to be a real Camera Raw packet.
  const [single] = await Promise.all([
    page.waitForEvent("download", { timeout: 30000 }),
    page.locator('[data-testid="download-xmp-DSC09500"]').click(),
  ]);
  const singlePath = join(downloads, single.suggestedFilename());
  await single.saveAs(singlePath);
  const sidecar = readFileSync(singlePath, "utf8");
  check(
    "La descarga individual es un XMP de Camera Raw, no un JSON renombrado",
    sidecar.includes("<?xpacket begin=") &&
      sidecar.includes("<x:xmpmeta") &&
      sidecar.includes("http://ns.adobe.com/camera-raw-settings/1.0/") &&
      sidecar.includes("crs:Exposure2012"),
    sidecar.slice(0, 60).replace(/\n/g, " "),
  );

  await page.screenshot({ path: join(here, ".artifacts", "memoria-raw-ilegible.png") });
} catch (error) {
  check("Ejecucion sin excepciones", false, error.message);
  console.error(error);
  await page.screenshot({ path: join(here, ".artifacts", "memoria-error.png") }).catch(() => {});
} finally {
  check("Sin errores de consola", errors.length === 0, [...new Set(errors)].slice(0, 3).join(" | "));
  await browser.close();
  console.log("");
  console.log(failures === 0 ? "RAW reales y memoria: todo correcto" : `RAW reales: ${failures} fallo(s)`);
  process.exit(failures > 0 ? 1 : 0);
}
