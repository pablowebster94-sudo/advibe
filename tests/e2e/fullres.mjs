/**
 * Full-resolution export.
 *
 * The claim under test: a 6000x4000 ARW exports a 6000x4000 JPEG, with the
 * adjustments applied to those pixels — not the 1600 px proxy scaled up, and
 * not the proxy shipped as-is.
 *
 * Uses DSC09500.ARW, the 25 MB fixture whose embedded preview is a real
 * 6000x4000 frame, which is the shape of a camera original from a ZV-E10.
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

/** Pulls one STORED (uncompressed) entry out of a ZIP by file-name suffix. */
function extractStoredFile(zip, nameSuffix) {
  for (let i = 0; i + 30 < zip.length; i += 1) {
    if (zip.readUInt32LE(i) !== 0x04034b50) continue;
    const method = zip.readUInt16LE(i + 8);
    const compSize = zip.readUInt32LE(i + 18);
    const nameLen = zip.readUInt16LE(i + 26);
    const extraLen = zip.readUInt16LE(i + 28);
    const entryName = zip.subarray(i + 30, i + 30 + nameLen).toString("latin1");
    if (method === 0 && entryName.endsWith(nameSuffix)) {
      const start = i + 30 + nameLen + extraLen;
      return zip.subarray(start, start + compSize);
    }
  }
  return null;
}

/** Reads a JPEG's dimensions from its SOF marker, without decoding it. */
function jpegSize(bytes) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    // SOF0..SOF15, excluding DHT(c4) DAC(c8) and RSTn(d0-d7).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});
const context = await browser.newContext({
  acceptDownloads: true,
  viewport: { width: 1280, height: 900 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

try {
  // `?render=` lets the same test drive either backend; the CPU path is the one
  // that has to develop 24 MP in bands, so it is worth exercising explicitly.
  const RENDER = process.env.RENDER_BACKEND ? `?render=${process.env.RENDER_BACKEND}` : "";
  await page.goto(`${BASE}/studio${RENDER}`, { waitUntil: "networkidle" });
  await page.fill('[data-testid="new-project-name"]', "Resolucion completa");
  await Promise.all([page.waitForURL(/prj_/), page.click('[data-testid="create-project"]')]);
  // Carry the backend override onto the workspace, where the export runs.
  if (RENDER) await page.goto(`${page.url()}${RENDER}`, { waitUntil: "networkidle" });

  await page.setInputFiles('input[type="file"]', [join(fixtures, "DSC09500.ARW")]);
  await page.waitForFunction(() => document.body.innerText.includes("terminado"), null, {
    timeout: 600000,
  });
  await page.waitForTimeout(1000);

  // The proxy really is the small one, so "full resolution" cannot come from it.
  const stored = await page.evaluate(async () => {
    const db = await new Promise((r) => {
      const q = indexedDB.open("advibe-photo-studio");
      q.onsuccess = () => r(q.result);
    });
    const photos = await new Promise((r) => {
      const tx = db.transaction("photos", "readonly");
      const q = tx.objectStore("photos").getAll();
      q.onsuccess = () => r(q.result);
    });
    const photo = photos[0];
    return { proxyWidth: photo.proxyWidth, proxyHeight: photo.proxyHeight, exif: photo.exif };
  });
  check(
    "El proxy almacenado sigue siendo reducido",
    stored.proxyWidth <= 1700,
    `proxy=${stored.proxyWidth}x${stored.proxyHeight}`,
  );

  // ------------------------------------------------------------- export
  await page.locator('[data-testid="tab-export"]').click();
  await page.waitForSelector('[data-testid^="download-xmp-"]', { timeout: 20000 });

  // Tick "Archivos .jpg" (second checkbox) and pick the full-resolution preset.
  await page.locator('input[type="checkbox"]').nth(1).check();
  await page.locator('button:has-text("Resolución completa")').click();
  await page.waitForTimeout(300);

  const quality = await page.evaluate(() => {
    const input = document.querySelector('input[aria-label="Calidad JPG"]');
    return Number(input.value);
  });
  check("La calidad por defecto del preset es >= 0.95", quality >= 0.95, `calidad=${quality}`);

  const [zip] = await Promise.all([
    page.waitForEvent("download", { timeout: 300000 }),
    page.locator('button:has-text("Exportar ZIP")').click(),
  ]);
  const zipPath = join(downloads, zip.suggestedFilename());
  await zip.saveAs(zipPath);
  const zipBytes = readFileSync(zipPath);

  const jpeg = extractStoredFile(zipBytes, "DSC09500.jpg");
  check("El JPG se extrae del ZIP", jpeg && jpeg.length > 1000, jpeg ? `${jpeg.length} bytes` : "no encontrado");

  const size = jpegSize(jpeg);
  check(
    "El JPG exportado mide 6000x4000, igual que el original",
    size && size.width === 6000 && size.height === 4000,
    size ? `${size.width}x${size.height}` : "sin cabecera SOF",
  );
  check(
    "Y no es el proxy reducido",
    size && size.width > stored.proxyWidth * 3,
    `exportado=${size?.width} proxy=${stored.proxyWidth}`,
  );

  // The UI must state the verified dimensions back to the photographer.
  const shown = await page.evaluate(() => document.body.innerText);
  check(
    "La interfaz confirma las dimensiones exportadas",
    shown.includes("6000×4000") && shown.includes("igual que el original"),
    (shown.match(/JPG a [^.]*\./) ?? ["no encontrado"])[0],
  );
  check(
    "No se reporta ninguna incidencia de dimensiones",
    !shown.includes("y el original tiene"),
  );

  // And the pixels carry the edit: compare against the untouched embedded
  // preview decoded straight from the same original file.
  const jpegB64 = Buffer.from(jpeg).toString("base64");
  const compared = await page.evaluate(
    async ({ b64 }) => {
      const toBytes = (s) => {
        const bin = atob(s);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
        return out;
      };
      const meanOf = async (blob) => {
        const bmp = await createImageBitmap(blob);
        // Sample at a bounded size; we are comparing tone, not counting pixels.
        const w = 400;
        const h = Math.max(1, Math.round((bmp.height / bmp.width) * w));
        const c = new OffscreenCanvas(w, h);
        const ctx = c.getContext("2d");
        ctx.drawImage(bmp, 0, 0, w, h);
        bmp.close();
        const d = ctx.getImageData(0, 0, w, h).data;
        let sum = 0;
        for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
        return sum / (d.length / 4);
      };

      const db = await new Promise((r) => {
        const q = indexedDB.open("advibe-photo-studio");
        q.onsuccess = () => r(q.result);
      });
      const photos = await new Promise((r) => {
        const tx = db.transaction("photos", "readonly");
        const q = tx.objectStore("photos").getAll();
        q.onsuccess = () => r(q.result);
      });
      const proxyBlob = await new Promise((r) => {
        const tx = db.transaction("proxies", "readonly");
        const q = tx.objectStore("proxies").get(photos[0].id);
        q.onsuccess = () => r(q.result?.blob ?? q.result);
      });

      return {
        exported: await meanOf(new Blob([toBytes(b64)], { type: "image/jpeg" })),
        proxy: proxyBlob ? await meanOf(proxyBlob) : null,
        adjustments: photos[0].auto?.adjustments ?? null,
      };
    },
    { b64: jpegB64 },
  );

  const a = compared.adjustments ?? {};
  const touched =
    Math.abs(a.exposure ?? 0) > 0.01 ||
    Math.abs(a.highlights ?? 0) > 0.5 ||
    Math.abs(a.shadows ?? 0) > 0.5 ||
    Math.abs(a.whites ?? 0) > 0.5 ||
    Math.abs(a.blacks ?? 0) > 0.5 ||
    (a.sharpenAmount ?? 0) > 0.5;
  check(
    "La fotografía llevaba ajustes que aplicar",
    touched,
    JSON.stringify({
      exposure: a.exposure,
      highlights: a.highlights,
      shadows: a.shadows,
      whites: a.whites,
      blacks: a.blacks,
      sharpen: a.sharpenAmount,
    }),
  );
  check(
    "El JPG a resolución completa está revelado, no es la preview cruda",
    compared.proxy !== null && Math.abs(compared.exported - compared.proxy) > 0.4,
    `exportado=${compared.exported.toFixed(2)} vs proxy sin revelar=${compared.proxy?.toFixed(2)}`,
  );
} catch (error) {
  check("Ejecucion sin excepciones", false, error.message);
  console.error(error);
  await page.screenshot({ path: join(here, ".artifacts", "fullres-error.png") }).catch(() => {});
} finally {
  check("Sin errores de consola", errors.length === 0, [...new Set(errors)].slice(0, 3).join(" | "));
  await browser.close();
  console.log("");
  console.log(failures === 0 ? "Resolución completa: todo correcto" : `Resolución completa: ${failures} fallo(s)`);
  process.exit(failures > 0 ? 1 : 0);
}
