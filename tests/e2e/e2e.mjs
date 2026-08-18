/**
 * End-to-end verification of the MVP against a real browser and real files.
 *
 * Flow under test, exactly as a photographer would run it:
 *   create project -> import files -> analyse -> generate adjustments ->
 *   preview -> change an adjustment -> generate XMP -> download.
 *
 * Every assertion checks a real artefact (pixels, parsed XMP, downloaded bytes),
 * never just that a button exists.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Playwright may be installed globally rather than in this repo (the e2e suite
// is not part of `npm ci`), so it is resolved through an env var with a bare
// specifier as the fallback. See tests/e2e/README.md.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, ".artifacts", "fixtures");
const downloads = join(here, ".artifacts", "downloads");
mkdirSync(downloads, { recursive: true });

const BASE = "http://localhost:3210";
const results = [];
let failures = 0;

function check(name, condition, detail = "") {
  const ok = Boolean(condition);
  if (!ok) failures += 1;
  results.push(`${ok ? "PASA " : "FALLA"}  ${name}${detail ? `  -- ${detail}` : ""}`);
  console.log(`${ok ? "PASA " : "FALLA"}  ${name}${detail ? `  -- ${detail}` : ""}`);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});
const context = await browser.newContext({
  acceptDownloads: true,
  viewport: { width: 1400, height: 1000 },
});
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

try {
  // ---------------------------------------------------------------- 1. project
  await page.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
  await page.fill('[data-testid="new-project-name"]', "Verificacion MVP");
  await Promise.all([
    page.waitForURL(/\/studio\/prj_/, { timeout: 20000 }),
    page.click('[data-testid="create-project"]'),
  ]);
  check("Crear proyecto y navegar al workspace", page.url().includes("/studio/prj_"), page.url());

  // ---------------------------------------------------------------- 2. import
  const files = [
    join(fixtures, "DSC08481.ARW"),
    join(fixtures, "DSC08482.ARW"),
    join(fixtures, "DSC08483.ARW"),
    join(fixtures, "retrato-contraluz.jpg"),
  ];
  await page.setInputFiles('input[type="file"]', files);

  await page.waitForFunction(() => document.body.innerText.includes("Analisis terminado") || document.body.innerText.includes("Análisis terminado"), null, { timeout: 300000 });
  check("Importar 3 ARW + 1 JPG y terminar el analisis", true);

  // Read what actually landed in IndexedDB, not what the DOM says.
  const stored = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("advibe-photo-studio");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const readAll = (store) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    const photos = await readAll("photos");
    const proxies = (await readAll("proxies")).map((b) => b.size);
    const thumbs = (await readAll("thumbnails")).map((b) => b.size);
    return {
      count: photos.length,
      proxySizes: proxies,
      thumbSizes: thumbs,
      photos: photos.map((p) => ({
        fileName: p.fileName,
        format: p.format,
        status: p.status,
        error: p.errorMessage,
        iso: p.exif?.iso,
        model: p.exif?.model,
        lens: p.exif?.lensModel,
        capturedAt: p.exif?.capturedAt,
        width: p.exif?.width,
        hasAnalysis: Boolean(p.analysis),
        strategy: p.auto?.strategy,
        scene: p.analysis?.scene?.primary,
        wedding: p.analysis?.scene?.weddingCategory,
        skinCoverage: p.analysis?.skin?.coverage,
        faces: p.analysis?.skin?.faceCount,
        mean: p.analysis?.tone?.mean,
        clip: p.analysis?.tone?.highlightClipping,
        dead: p.analysis?.tone?.unrecoverableHighlights,
        recoverable: p.analysis?.exposure?.recoverableHighlightRatio,
        dHash: p.analysis?.hashes?.dHash,
        adj: p.auto?.adjustments && {
          exposure: p.auto.adjustments.exposure,
          highlights: p.auto.adjustments.highlights,
          shadows: p.auto.adjustments.shadows,
          contrast: p.auto.adjustments.contrast,
          temperature: p.auto.adjustments.temperature,
          vibrance: p.auto.adjustments.vibrance,
          clarity: p.auto.adjustments.clarity,
          luminanceNR: p.auto.adjustments.luminanceNR,
        },
        rationale: p.auto?.rationale?.length,
      })),
    };
  });

  check("Las 4 fotografias se guardaron en IndexedDB", stored.count === 4, `n=${stored.count}`);
  const errored = stored.photos.filter((p) => p.status === "error");
  check(
    "Ninguna termino en error",
    errored.length === 0,
    errored.map((p) => `${p.fileName}: ${p.error}`).join(" | "),
  );

  const arw = stored.photos.filter((p) => p.format === "arw");
  check("Los .ARW se detectaron como formato RAW", arw.length === 3, `arw=${arw.length}`);
  check(
    "EXIF real leido del ARW (modelo, ISO, objetivo, fecha)",
    arw.length === 3 &&
      arw.every(
        (p) => p.model === "ZV-E10" && p.iso > 0 && p.lens === "E 35mm F1.8 OSS" && p.capturedAt > 0,
      ),
    JSON.stringify(arw.map((p) => ({ m: p.model, iso: p.iso, lens: p.lens }))),
  );
  check(
    "Dimensiones del sensor leidas del ARW (6000x4000), no del preview",
    arw.length === 3 && arw.every((p) => p.width === 6000),
    `widths=${arw.map((p) => p.width).join(",")}`,
  );
  check(
    "Proxy JPEG generado y almacenado para cada foto",
    stored.proxySizes.length === 4 && stored.proxySizes.every((s) => s > 5000),
    `tamanos=${stored.proxySizes.join(",")}`,
  );
  check(
    "Miniatura generada para cada foto",
    stored.thumbSizes.length === 4 && stored.thumbSizes.every((s) => s > 500),
    `tamanos=${stored.thumbSizes.join(",")}`,
  );
  check("Todas tienen analisis", stored.photos.every((p) => p.hasAnalysis));
  check("Todas tienen ajustes generados", stored.photos.every((p) => p.adj));
  check(
    "Cada foto trae su explicacion (rationale)",
    stored.photos.every((p) => p.rationale > 3),
    `n=${stored.photos.map((p) => p.rationale).join(",")}`,
  );

  // -------------------------------------------------- 3. adjustments are real
  const byName = Object.fromEntries(stored.photos.map((p) => [p.fileName, p]));
  const backlit = byName["DSC08481.ARW"];
  const neutral = byName["DSC08482.ARW"];
  const blown = byName["DSC08483.ARW"];

  console.log("");
  console.log("--- Ajustes generados por foto ---");
  for (const p of stored.photos) {
    console.log(
      `${p.fileName.padEnd(24)} ${String(p.strategy).padEnd(18)} escena=${String(p.scene).padEnd(9)} ${JSON.stringify(p.adj)}`,
    );
  }
  console.log("");

  const signatures = new Set(stored.photos.map((p) => JSON.stringify(p.adj)));
  check(
    "Cada fotografia recibe ajustes distintos (no es un preset fijo)",
    signatures.size >= 3,
    `${signatures.size} combinaciones distintas de ${stored.photos.length}`,
  );
  check(
    "La foto correctamente expuesta no recibe correccion de exposicion",
    neutral.adj.exposure === 0,
    `exposure=${neutral.adj.exposure}, media=${neutral.mean}`,
  );
  check(
    "La foto con luces quemadas se reconoce como irrecuperable",
    blown.dead > 0.2 && blown.recoverable < 0.1,
    `sin recuperar=${(blown.dead * 100).toFixed(1)}%, ratio recuperable=${blown.recoverable}`,
  );
  check(
    "El ISO alto sube la reduccion de ruido",
    blown.adj.luminanceNR > neutral.adj.luminanceNR,
    `ISO6400 NR=${blown.adj.luminanceNR} vs ISO800 NR=${neutral.adj.luminanceNR}`,
  );
  check(
    "El ARW y el JPG con el mismo contenido comparten huella perceptual",
    backlit.dHash === byName["retrato-contraluz.jpg"].dHash,
    `${backlit.dHash} vs ${byName["retrato-contraluz.jpg"].dHash}`,
  );

  // ------------------------------------------------------------- 4. preview
  await page.click('[data-testid="tab-library"]');
  await page.waitForSelector("img[alt='DSC08481.ARW']", { timeout: 20000 });
  await page.click("img[alt='DSC08481.ARW']");
  await page.waitForSelector("canvas", { timeout: 20000 });
  await page.waitForTimeout(2000);

  const measure = () =>
    page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      if (!canvas) return null;
      const data = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0;
      let nonBlank = 0;
      for (let i = 0; i < data.length; i += 4) {
        const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
        sum += v;
        if (data[i + 3] > 0 && v > 2) nonBlank += 1;
      }
      return {
        width: canvas.width,
        height: canvas.height,
        meanLuma: sum / (data.length / 4),
        nonBlankRatio: nonBlank / (data.length / 4),
      };
    });

  const webgl2 = await page.evaluate(() =>
    Boolean(document.createElement("canvas").getContext("webgl2")),
  );
  check("WebGL2 disponible en el navegador de prueba", webgl2);

  const render = await measure();
  check(
    "El canvas de revelado pinta la imagen (no esta en blanco)",
    render && render.nonBlankRatio > 0.3 && render.meanLuma > 5,
    render ? `no-vacio=${(render.nonBlankRatio * 100).toFixed(0)}%, luma=${render.meanLuma.toFixed(1)}` : "sin canvas",
  );

  const compareSlider = page.locator('input[aria-label="Comparar antes y despues"], input[aria-label="Comparar antes y después"]');
  await compareSlider.fill("0");
  await page.waitForTimeout(800);
  const beforeRender = (await measure()).meanLuma;
  await compareSlider.fill("1");
  await page.waitForTimeout(800);
  const afterRender = (await measure()).meanLuma;
  check(
    "El antes/despues muestra imagenes distintas (el render aplica de verdad)",
    Math.abs(afterRender - beforeRender) > 0.8,
    `antes=${beforeRender.toFixed(2)} despues=${afterRender.toFixed(2)} delta=${(afterRender - beforeRender).toFixed(2)}`,
  );

  await page.screenshot({ path: join(here, ".artifacts", "revelado.png") });

  // -------------------------------------------------- 5. manual adjustment
  const exposureLabel = page.locator('label:has-text("Exposici")').first();
  const sliderId = await exposureLabel.getAttribute("for");
  check("El panel de revelado expone el slider de Exposicion", Boolean(sliderId), String(sliderId));
  const slider = page.locator(`[id="${sliderId}"]`);
  await slider.fill("1.25");
  await page.waitForTimeout(1200);

  const afterManual = await page.evaluate(async () => {
    const db = await new Promise((resolve) => {
      const request = indexedDB.open("advibe-photo-studio");
      request.onsuccess = () => resolve(request.result);
    });
    const photos = await new Promise((resolve) => {
      const tx = db.transaction("photos", "readonly");
      const req = tx.objectStore("photos").getAll();
      req.onsuccess = () => resolve(req.result);
    });
    const photo = photos.find((p) => p.fileName === "DSC08481.ARW");
    const canvas = document.querySelector("canvas");
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    return {
      manual: photo.manual,
      autoExposure: photo.auto.adjustments.exposure,
      luma: sum / (data.length / 4),
    };
  });

  check(
    "El ajuste manual se guarda como capa sobre el de la IA",
    afterManual.manual?.exposure === 1.25 && afterManual.autoExposure !== 1.25,
    `manual=${afterManual.manual?.exposure}, ia=${afterManual.autoExposure}`,
  );
  check(
    "El ajuste manual cambia el render en pantalla",
    afterManual.luma > afterRender + 3,
    `luma antes=${afterRender.toFixed(2)} con +1.25EV=${afterManual.luma.toFixed(2)}`,
  );

  // --------------------------------------------------------- 6. XMP download
  await page.click('[data-testid="tab-export"]');
  await page.waitForSelector('[data-testid="download-xmp-DSC08481"]', { timeout: 20000 });
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 20000 }),
    page.click('[data-testid="download-xmp-DSC08481"]'),
  ]);
  const xmpPath = join(downloads, download.suggestedFilename());
  await download.saveAs(xmpPath);
  const xmp = readFileSync(xmpPath, "utf8");

  check(
    "El .xmp se descarga con el nombre que espera Lightroom",
    download.suggestedFilename() === "DSC08481.xmp",
    download.suggestedFilename(),
  );
  check(
    "El XMP contiene el paquete xpacket",
    xmp.startsWith("<?xpacket begin=") && xmp.includes('<?xpacket end="w"?>'),
  );
  check("El XMP declara el namespace crs", xmp.includes("http://ns.adobe.com/camera-raw-settings/1.0/"));
  check(
    "El XMP lleva la exposicion modificada a mano (+1.25), no la de la IA",
    xmp.includes('crs:Exposure2012="+1.25"'),
    (xmp.match(/crs:Exposure2012="[^"]*"/) ?? ["no encontrado"])[0],
  );
  check(
    "El XMP de un RAW usa balance incremental y conserva As Shot",
    xmp.includes('crs:WhiteBalance="As Shot"') &&
      xmp.includes("crs:IncrementalTemperature") &&
      !xmp.includes("crs:Temperature="),
    (xmp.match(/crs:WhiteBalance="[^"]*"/) ?? [""])[0],
  );
  check("El XMP referencia el RAW original", xmp.includes('crs:RawFileName="DSC08481.ARW"'));
  check(
    "El XMP incluye la curva de tonos como Seq",
    xmp.includes("<crs:ToneCurvePV2012>") && xmp.includes("<rdf:li>"),
  );

  // ------------------------------------------------------ 7. ZIP with XMP+JPG
  const jpegCheckbox = page.locator('input[type="checkbox"]').nth(1);
  await jpegCheckbox.check();
  const [zipDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 180000 }),
    page.click('button:has-text("Exportar ZIP")'),
  ]);
  const zipPath = join(downloads, zipDownload.suggestedFilename());
  await zipDownload.saveAs(zipPath);
  const zipBytes = readFileSync(zipPath);
  check("El ZIP se descarga", zipBytes.length > 1000, `${zipBytes.length} bytes`);
  check(
    "El ZIP tiene firma valida y directorio central",
    zipBytes.readUInt32LE(0) === 0x04034b50 &&
      zipBytes.includes(Buffer.from([0x50, 0x4b, 0x05, 0x06])),
  );
  const zipText = zipBytes.toString("latin1");
  check(
    "El ZIP contiene los .xmp",
    zipText.includes("DSC08481.xmp") && zipText.includes("DSC08483.xmp"),
  );
  check("El ZIP contiene los .jpg revelados", zipText.includes("DSC08481.jpg"));

  writeFileSync(join(here, ".artifacts", "sidecar-descargado.xmp"), xmp);
} catch (error) {
  check("Ejecucion sin excepciones", false, error.message);
  console.error(error);
  await page.screenshot({ path: join(here, ".artifacts", "error.png") }).catch(() => {});
} finally {
  if (consoleErrors.length > 0) {
    console.log("");
    console.log("--- Errores de consola del navegador ---");
    for (const line of [...new Set(consoleErrors)].slice(0, 15)) console.log("  " + line);
  }
  check("Sin errores de consola en el navegador", consoleErrors.length === 0, `${consoleErrors.length} error(es)`);
  await browser.close();
  console.log("");
  console.log(`${results.filter((r) => r.startsWith("PASA")).length} pasan / ${failures} fallan`);
  process.exit(failures > 0 ? 1 : 0);
}
