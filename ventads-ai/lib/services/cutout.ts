import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

/**
 * Removes the background of the REAL product photo so the creative can show
 * the exact product (every pixel of the car comes from the user's photo)
 * on a new scene. Runs a small open segmentation model (rembg's "silueta",
 * a U^2-Net variant, ~44 MB) on CPU through onnxruntime-web's WebAssembly
 * build: no native install, no paid API, ~4 s per photo.
 *
 * Never throws: on any problem (model download, unclear subject, product cut
 * by the photo's edges) it returns null and the renderer keeps using the
 * original photo as is.
 */

const MODEL_INPUT = 320;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

const DEFAULT_MODEL_URL = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/silueta.onnx";
const DEFAULT_MODEL_SHA256 = "75da6c8d2f8096ec743d071951be73b4a8bc7b3e51d9a6625d63644f90ffeedb";
const DOWNLOAD_TIMEOUT_MS = 60_000;

export type ProductCutout = {
  /** RGBA PNG trimmed to the product, original pixels with a soft alpha edge. */
  png: Buffer;
  width: number;
  height: number;
};

export function cutoutEnabled() {
  return process.env.PRODUCT_CUTOUT?.trim().toLowerCase() !== "off";
}

type OrtModule = typeof import("onnxruntime-web");
type Session = import("onnxruntime-web").InferenceSession;

let sessionPromise: Promise<{ ort: OrtModule; session: Session }> | null = null;

async function loadModelBytes(): Promise<Uint8Array> {
  const localPath = process.env.CUTOUT_MODEL_PATH?.trim();
  if (localPath) return readFile(localPath);

  const url = process.env.CUTOUT_MODEL_URL?.trim() || DEFAULT_MODEL_URL;
  const expected = process.env.CUTOUT_MODEL_SHA256?.trim() || (url === DEFAULT_MODEL_URL ? DEFAULT_MODEL_SHA256 : "");
  const cacheFile = path.join(tmpdir(), "ventads-models", `${createHash("sha1").update(url).digest("hex")}.onnx`);
  const verified = (bytes: Uint8Array) =>
    !expected || createHash("sha256").update(bytes).digest("hex") === expected;

  const cached = await readFile(cacheFile).catch(() => null);
  if (cached && verified(cached)) return cached;

  const res = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`cutout model download failed: HTTP ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (!verified(bytes)) throw new Error("cutout model checksum mismatch");

  await mkdir(path.dirname(cacheFile), { recursive: true });
  const partial = `${cacheFile}.${process.pid}.part`;
  await writeFile(partial, bytes);
  await rename(partial, cacheFile);
  return bytes;
}

function getSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = await import("onnxruntime-web");
      // Single-threaded: serverless CPUs are small and worker threads add
      // nothing but startup cost here.
      ort.env.wasm.numThreads = 1;
      const session = await ort.InferenceSession.create(await loadModelBytes());
      return { ort, session };
    })().catch((error) => {
      sessionPromise = null; // let the next creative retry (e.g. transient download error)
      throw error;
    });
  }
  return sessionPromise;
}

/** 0..255 mask (full image size) from the model's 320x320 probability map. */
async function predictMask(rgb: Buffer, width: number, height: number): Promise<Buffer> {
  const { ort, session } = await getSession();
  const { data } = await sharp(rgb, { raw: { width, height, channels: 3 } })
    .resize(MODEL_INPUT, MODEL_INPUT, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const plane = MODEL_INPUT * MODEL_INPUT;
  const input = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    for (let c = 0; c < 3; c++) input[c * plane + i] = (data[i * 3 + c] / 255 - MEAN[c]) / STD[c];
  }

  const outputs = await session.run({
    [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, MODEL_INPUT, MODEL_INPUT]),
  });
  const pred = outputs[session.outputNames[0]].data as Float32Array;

  let min = Infinity;
  let max = -Infinity;
  for (const v of pred) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  const small = Buffer.alloc(plane);
  for (let i = 0; i < plane; i++) {
    // Normalize, then a gentle contrast curve: kills faint haze around the
    // product while keeping a soft (anti-aliased) edge.
    const p = (pred[i] - min) / range;
    small[i] = Math.round(Math.min(1, Math.max(0, (p - 0.2) / 0.7)) * 255);
  }

  return sharp(small, { raw: { width: MODEL_INPUT, height: MODEL_INPUT, channels: 1 } })
    .resize(width, height, { fit: "fill", kernel: "lanczos3" })
    .extractChannel(0) // keep it single-channel (sharp would otherwise emit sRGB)
    .raw()
    .toBuffer();
}

/**
 * Bounding box of the product, or null when the mask does not isolate one
 * clear, whole product (nothing found, almost everything selected, or the
 * product is cut by the photo's frame — it would look amputated on a scene).
 * Exported for tests.
 */
export function analyzeMask(mask: Uint8Array, width: number, height: number) {
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;
  let solid = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] < 128) continue;
      solid++;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  const coverage = solid / (width * height);
  if (right < 0 || coverage < 0.03 || coverage > 0.9) return null;

  const edgeShare = (count: number, length: number) => count / length;
  const border = 2;
  let leftHits = 0;
  let rightHits = 0;
  let topHits = 0;
  let bottomHits = 0;
  for (let y = 0; y < height; y++) {
    for (let b = 0; b < border; b++) {
      if (mask[y * width + b] >= 128) leftHits++;
      if (mask[y * width + (width - 1 - b)] >= 128) rightHits++;
    }
  }
  for (let x = 0; x < width; x++) {
    for (let b = 0; b < border; b++) {
      if (mask[b * width + x] >= 128) topHits++;
      if (mask[(height - 1 - b) * width + x] >= 128) bottomHits++;
    }
  }
  const limit = 0.06;
  if (
    edgeShare(leftHits, height * border) > limit ||
    edgeShare(rightHits, height * border) > limit ||
    edgeShare(topHits, width * border) > limit ||
    edgeShare(bottomHits, width * border) > limit
  ) {
    return null;
  }

  return { left, top, width: right - left + 1, height: bottom - top + 1, coverage };
}

async function computeCutout(photo: Buffer): Promise<ProductCutout | null> {
  const upright = await sharp(photo).rotate().removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
  const { width, height } = upright.info;
  const mask = await predictMask(upright.data, width, height).catch((error) => {
    console.error(`[cutout] segmentation failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  });
  if (!mask) return null;

  const box = analyzeMask(mask, width, height);
  if (!box) {
    console.warn("[cutout] no clean, whole product found in the photo; using the original photo");
    return null;
  }

  const pad = Math.round(Math.max(box.width, box.height) * 0.01);
  const extract = {
    left: Math.max(0, box.left - pad),
    top: Math.max(0, box.top - pad),
    width: Math.min(width, box.left + box.width + pad) - Math.max(0, box.left - pad),
    height: Math.min(height, box.top + box.height + pad) - Math.max(0, box.top - pad),
  };

  // Two pipelines on purpose: sharp runs extract() before joinChannel() within
  // one pipeline, which would pair the cropped photo with the full-size mask.
  const rgba = await sharp(upright.data, { raw: { width, height, channels: 3 } })
    .joinChannel(mask, { raw: { width, height, channels: 1 } })
    .raw()
    .toBuffer();
  const png = await sharp(rgba, { raw: { width, height, channels: 4 } }).extract(extract).png().toBuffer();
  return { png, width: extract.width, height: extract.height };
}

// The 3 creatives of a campaign share one photo; cache per worker instance.
const cache = new Map<string, Promise<ProductCutout | null>>();
const CACHE_LIMIT = 8;

export function cutoutProduct(photo: Buffer): Promise<ProductCutout | null> {
  if (!cutoutEnabled()) return Promise.resolve(null);
  const key = createHash("sha1").update(photo).digest("hex");
  let pending = cache.get(key);
  if (!pending) {
    pending = computeCutout(photo).catch((error) => {
      console.error(`[cutout] ${error instanceof Error ? error.message : String(error)}`);
      cache.delete(key);
      return null;
    });
    cache.set(key, pending);
    if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
  }
  return pending;
}
