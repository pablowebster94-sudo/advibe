/** Dumps the full analysis record so engine decisions can be audited. */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Playwright may be installed globally rather than in this repo (the e2e suite
// is not part of `npm ci`), so it is resolved through an env var with a bare
// specifier as the fallback. See tests/e2e/README.md.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, ".artifacts", "fixtures");

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto("http://localhost:3210/studio", { waitUntil: "networkidle" });
await page.fill('[data-testid="new-project-name"]', "probe");
await Promise.all([page.waitForURL(/prj_/), page.click('[data-testid="create-project"]')]);
await page.setInputFiles('input[type="file"]', [
  join(fixtures, "DSC08481.ARW"),
  join(fixtures, "DSC08482.ARW"),
  join(fixtures, "DSC08483.ARW"),
]);
await page.waitForFunction(() => document.body.innerText.includes("terminado"), null, { timeout: 300000 });

const dump = await page.evaluate(async () => {
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
    file: p.fileName,
    tone: p.analysis.tone,
    color: p.analysis.color,
    skin: {
      coverage: p.analysis.skin.coverage,
      faces: p.analysis.skin.faceCount,
      hue: p.analysis.skin.meanHue,
      sat: p.analysis.skin.meanSaturation,
      luma: p.analysis.skin.meanLuma,
      cast: p.analysis.skin.cast,
      regions: p.analysis.skin.regions.length,
    },
    scene: p.analysis.scene,
    exposure: p.analysis.exposure,
    sharpness: p.analysis.sharpness,
    noise: p.analysis.noise,
    strategy: p.auto.strategy,
    rationale: p.auto.rationale.map((r) => `${r.key}=${r.value}: ${r.reason}`),
  }));
});

for (const entry of dump) {
  console.log("=".repeat(78));
  console.log(entry.file, " estrategia:", entry.strategy);
  console.log("  tone   ", JSON.stringify(entry.tone));
  console.log("  color  ", JSON.stringify(entry.color));
  console.log("  skin   ", JSON.stringify(entry.skin));
  console.log("  scene  ", JSON.stringify(entry.scene));
  console.log("  expo   ", JSON.stringify(entry.exposure));
  console.log("  sharp/noise", entry.sharpness, entry.noise);
  console.log("  razones:");
  for (const line of entry.rationale) console.log("    -", line);
}
await browser.close();
