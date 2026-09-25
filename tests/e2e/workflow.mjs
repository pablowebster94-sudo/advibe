/**
 * The rest of the workflow, on real files.
 *
 * Formats (JPG, PNG without EXIF, a 15 MP file, uncompressed TIFF, LZW TIFF,
 * ARW), then copy / sync / restore / discard / select, persistence across a
 * full page reload, and a check that the app never talks to anything but its
 * own origin.
 */
import { readFileSync } from "node:fs";
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
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 1000 } });
const page = await context.newPage();

const errors = [];
const external = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
// Every request the page makes, so "todo es local" is measured, not asserted.
page.on("request", (request) => {
  const url = request.url();
  if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith(BASE)) return;
  external.push(url);
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
      picked: p.picked,
      rejected: p.rejected,
      hasAnalysis: Boolean(p.analysis),
      exif: p.exif,
      auto: p.auto?.adjustments,
      manual: p.manual,
      mean: p.analysis?.tone?.mean,
      sharpness: p.analysis?.sharpness,
    }));
  });

try {
  await page.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
  await page.fill('[data-testid="new-project-name"]', "Flujo completo");
  await Promise.all([page.waitForURL(/prj_/), page.click('[data-testid="create-project"]')]);
  const projectUrl = page.url();

  // ------------------------------------------------------------- 1. formats
  const files = [
    "normal.jpg",
    "sin-exif.png",
    "grande.jpg",
    "escaneo.tif",
    "capa.tif",
    "DSC08481.ARW",
    "DSC09600.dng",
  ].map((name) => join(fixtures, name));

  const started = Date.now();
  await page.setInputFiles('input[type="file"]', files);
  await page.waitForFunction(() => document.body.innerText.includes("terminado"), null, {
    timeout: 600000,
  });
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  const photos = await readPhotos();
  const byName = Object.fromEntries(photos.map((p) => [p.fileName, p]));

  check("Se importaron los 7 archivos", photos.length === 7, `n=${photos.length} en ${elapsed}s`);
  const errored = photos.filter((p) => p.status === "error");
  check(
    "Ningún formato falló",
    errored.length === 0,
    errored.map((p) => `${p.fileName}: ${p.error}`).join(" | "),
  );

  for (const [name, format] of [
    ["normal.jpg", "jpeg"],
    ["sin-exif.png", "png"],
    ["grande.jpg", "jpeg"],
    ["escaneo.tif", "tiff"],
    ["capa.tif", "tiff"],
    ["DSC08481.ARW", "arw"],
    ["DSC09600.dng", "dng"],
  ]) {
    check(
      `${name} se detecta como ${format} y se analiza`,
      byName[name]?.format === format && byName[name]?.hasAnalysis,
      `formato=${byName[name]?.format} análisis=${byName[name]?.hasAnalysis}`,
    );
  }

  check(
    "El TIFF sin comprimir se decodifica de verdad (no venía con preview)",
    byName["escaneo.tif"]?.mean > 0.05 && byName["escaneo.tif"]?.mean < 0.95,
    `luminancia media=${byName["escaneo.tif"]?.mean}`,
  );
  check(
    "El TIFF LZW da el mismo análisis que el TIFF sin comprimir",
    Math.abs((byName["capa.tif"]?.mean ?? 0) - (byName["escaneo.tif"]?.mean ?? 1)) < 0.02,
    `LZW=${byName["capa.tif"]?.mean} vs plano=${byName["escaneo.tif"]?.mean}`,
  );

  // --------------------------------------------------- 2. image without EXIF
  const noExif = byName["sin-exif.png"];
  check(
    "Una imagen sin EXIF se analiza igual, sin inventar metadatos",
    noExif?.hasAnalysis && Object.keys(noExif.exif ?? {}).length === 0,
    `campos EXIF=${Object.keys(noExif?.exif ?? {}).length}`,
  );
  check(
    "Y recibe igualmente una propuesta de ajustes",
    noExif?.auto && typeof noExif.auto.exposure === "number",
    JSON.stringify({ exposure: noExif?.auto?.exposure, contrast: noExif?.auto?.contrast }),
  );

  // The metadata panel must say "No disponible", not blanks or invented values.
  await page.goto(projectUrl, { waitUntil: "networkidle" });
  await page.waitForSelector("img[alt='sin-exif.png']", { timeout: 30000 });
  await page.click("img[alt='sin-exif.png']");
  await page.waitForSelector("canvas", { timeout: 30000 });
  await page.waitForTimeout(1200);
  const dashes = await page.evaluate(() => {
    const text = document.body.innerText;
    const block = text.slice(text.indexOf("Metadatos del archivo"));
    return {
      hasPanel: text.includes("Metadatos del archivo"),
      dashCount: (block.match(/No disponible/g) ?? []).length,
    };
  });
  check(
    "El panel de metadatos dice «No disponible» en todo lo que el PNG no trae",
    dashes.hasPanel && dashes.dashCount >= 9,
    JSON.stringify(dashes),
  );

  // Y con el ARW sí se rellena.
  await page.goto(projectUrl, { waitUntil: "networkidle" });
  await page.click("img[alt='DSC08481.ARW']");
  await page.waitForSelector("canvas", { timeout: 30000 });
  await page.waitForTimeout(1200);
  const arwMeta = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.slice(text.indexOf("Metadatos del archivo"), text.indexOf("Metadatos del archivo") + 700);
  });
  check(
    "El ARW muestra cámara, ISO, apertura, velocidad y objetivo reales",
    /ZV-E10/.test(arwMeta) && /ISO \d+/.test(arwMeta) && /f\/1\.8/.test(arwMeta) && /1\/160 s/.test(arwMeta) && /35 mm/.test(arwMeta),
    arwMeta.replace(/\n+/g, " | ").slice(0, 200),
  );

  // ------------------------------------------------- 3. copy / sync / restore
  // Set a distinctive manual value on the ARW, copy it, and sync elsewhere.
  const exposureLabel = page.locator('label:has-text("Exposici")').first();
  await exposureLabel.scrollIntoViewIfNeeded();
  const sliderId = await exposureLabel.getAttribute("for");
  await page.locator(`[id="${sliderId}"]`).fill("1.4");
  await page.waitForTimeout(900);

  let after = await readPhotos();
  const source = after.find((p) => p.fileName === "DSC08481.ARW");
  check(
    "Un cambio manual queda marcado como manual, sin tocar la propuesta",
    source?.manual?.exposure === 1.4 && source?.auto?.exposure !== 1.4,
    `manual=${source?.manual?.exposure} propuesta=${source?.auto?.exposure}`,
  );
  const manualBadge = await page.locator("span", { hasText: /^Editada a mano$/ }).count();
  check("La interfaz lo señala como «Editada a mano»", manualBadge === 1);

  await page.click('button:has-text("Copiar ajustes")');
  await page.waitForTimeout(300);

  // Select two other photos in the grid and sync onto them.
  await page.click('[data-testid="tab-library"]');
  await page.waitForSelector("img[alt='normal.jpg']", { timeout: 20000 });
  await page.click("img[alt='normal.jpg']", { modifiers: ["Shift"] });
  await page.click("img[alt='escaneo.tif']", { modifiers: ["Shift"] });
  const selectedLabel = await page.locator("text=/\\d+ marcada/").first().textContent();
  check("Se pueden marcar varias fotografías en la rejilla", /2 marcada/.test(selectedLabel ?? ""), selectedLabel ?? "");

  await page.click('button:has-text("Pegar ajustes")');
  await page.waitForTimeout(900);

  after = await readPhotos();
  const synced = ["normal.jpg", "escaneo.tif"].map((name) => after.find((p) => p.fileName === name));
  check(
    "Sincronizar aplica los ajustes copiados a las seleccionadas",
    synced.every((p) => p?.manual?.exposure === 1.4),
    synced.map((p) => `${p?.fileName}=${p?.manual?.exposure}`).join(" | "),
  );
  const untouched = after.find((p) => p.fileName === "grande.jpg");
  check(
    "Y no toca las que no estaban seleccionadas",
    untouched?.manual === undefined,
    JSON.stringify(untouched?.manual),
  );

  // Restore original on one of them.
  await page.click("img[alt='normal.jpg']");
  await page.waitForSelector("canvas", { timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.click('button:has-text("Restaurar original")');
  await page.waitForTimeout(900);
  after = await readPhotos();
  const restored = after.find((p) => p.fileName === "normal.jpg");
  check(
    "Restaurar original elimina los ajustes manuales y deja la propuesta",
    restored?.manual === undefined && restored?.auto !== undefined,
    `manual=${JSON.stringify(restored?.manual)} propuesta=${restored?.auto ? "sí" : "no"}`,
  );

  // ------------------------------------------------ 4. select / discard flags
  await page.click('button:has-text("★ Seleccionar")');
  await page.waitForTimeout(500);
  after = await readPhotos();
  check(
    "Marcar como seleccionada se guarda",
    after.find((p) => p.fileName === "normal.jpg")?.picked === true,
  );
  await page.click('button:has-text("✕ Descartar")');
  await page.waitForTimeout(500);
  after = await readPhotos();
  const flagged = after.find((p) => p.fileName === "normal.jpg");
  check(
    "Descartar se guarda y desmarca la selección",
    flagged?.rejected === true && flagged?.picked === false,
    `picked=${flagged?.picked} rejected=${flagged?.rejected}`,
  );

  // ------------------------------------------------- 5. reanalyse (no Gemini)
  await page.click("img[alt='grande.jpg']").catch(() => {});
  await page.click('[data-testid="tab-library"]');
  await page.waitForSelector("img[alt='grande.jpg']", { timeout: 20000 });
  await page.click("img[alt='grande.jpg']");
  await page.waitForSelector("canvas", { timeout: 30000 });
  await page.waitForTimeout(1000);
  const externalBefore = external.length;
  await page.click('button:has-text("Reanalizar")');
  await page.waitForTimeout(1500);
  check(
    "«Reanalizar» existe y no hace ninguna llamada de red",
    external.length === externalBefore,
    `nuevas peticiones externas=${external.length - externalBefore}`,
  );

  // ------------------------------------------------------- 6. persistence
  await page.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const dashboard = await page.evaluate(() => document.body.innerText);
  check(
    "Tras recargar, el proyecto sigue en el listado",
    dashboard.includes("Flujo completo"),
    dashboard.slice(0, 120).replace(/\n+/g, " | "),
  );

  await page.goto(projectUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const reloaded = await readPhotos();
  const reloadedSource = reloaded.find((p) => p.fileName === "DSC08481.ARW");
  check(
    "Tras recargar, siguen las 7 fotografías con sus análisis",
    reloaded.length === 7 && reloaded.every((p) => p.hasAnalysis),
    `n=${reloaded.length}`,
  );
  check(
    "Tras recargar, el ajuste manual sigue ahí",
    reloadedSource?.manual?.exposure === 1.4,
    `exposure=${reloadedSource?.manual?.exposure}`,
  );
  check(
    "Tras recargar, se conservan selección y descarte",
    reloaded.find((p) => p.fileName === "normal.jpg")?.rejected === true,
  );

  // ------------------------------------------------------------- 7. XMP real
  await page.click('[data-testid="tab-export"]');
  await page.waitForSelector('[data-testid="download-xmp-DSC08481"]', { timeout: 20000 });
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 30000 }),
    page.click('[data-testid="download-xmp-DSC08481"]'),
  ]);
  const xmpPath = join(here, ".artifacts", "downloads", download.suggestedFilename());
  await download.saveAs(xmpPath);
  const xmp = readFileSync(xmpPath, "utf8");

  check("El XMP no es JSON renombrado", !xmp.trimStart().startsWith("{") && xmp.includes("<rdf:RDF"));
  check(
    "El XMP lleva el valor manual, no el propuesto",
    xmp.includes('crs:Exposure2012="+1.40"'),
    (xmp.match(/crs:Exposure2012="[^"]*"/) ?? ["no encontrado"])[0],
  );
  // Cada parámetro del XMP debe corresponder con lo que hay guardado.
  const stored = reloaded.find((p) => p.fileName === "DSC08481.ARW");
  const effective = { ...stored.auto, ...stored.manual };
  const mapping = [
    ["Contrast2012", effective.contrast],
    ["Highlights2012", effective.highlights],
    ["Shadows2012", effective.shadows],
    ["Whites2012", effective.whites],
    ["Blacks2012", effective.blacks],
    ["Vibrance", effective.vibrance],
    ["Saturation", effective.saturation],
    ["IncrementalTemperature", effective.temperature],
    ["IncrementalTint", effective.tint],
  ];
  const mismatches = mapping.filter(([property, value]) => {
    const found = xmp.match(new RegExp(`crs:${property}="([^"]*)"`));
    return !found || Number.parseFloat(found[1]) !== value;
  });
  check(
    "Cada parámetro del XMP corresponde al ajuste guardado",
    mismatches.length === 0,
    mismatches.map(([p]) => p).join(", "),
  );
} catch (error) {
  check("Ejecucion sin excepciones", false, error.message);
  console.error(error);
  await page.screenshot({ path: join(here, ".artifacts", "flujo-error.png") }).catch(() => {});
} finally {
  check(
    "La aplicación no hace NINGUNA llamada a un servidor externo",
    external.length === 0,
    [...new Set(external)].slice(0, 5).join(" | "),
  );
  check("Sin errores de consola", errors.length === 0, [...new Set(errors)].slice(0, 3).join(" | "));
  await browser.close();
  console.log("");
  console.log(failures === 0 ? "Flujo completo: todo correcto" : `Flujo: ${failures} fallo(s)`);
  process.exit(failures > 0 ? 1 : 0);
}
