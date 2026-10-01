import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // ventADS.ai lives inside the AdVibe repo but is a fully independent
  // project; pin the workspace root so Turbopack doesn't try to reach
  // outside this directory because of the sibling package-lock.json.
  turbopack: {
    root: path.join(__dirname),
  },
  // sharp's native binding (@img/sharp-linux-x64/*.node) dynamically links
  // libvips-cpp.so from @img/sharp-libvips-linux-x64, but Next's file
  // tracing misses that shared library. Vercel only ships traced files, so
  // without this every route that loads sharp (uploads, campaign creation,
  // the creative worker, export) crashed at module load with an HTML 500.
  outputFileTracingIncludes: {
    // ./fonts: serverless hosts have no system fonts for the creative text.
    "/**": ["./node_modules/@img/sharp-libvips-linux-x64/lib/**/*", "./fonts/**/*"],
    // Product cut-out (lib/services/cutout.ts): the Node build of
    // onnxruntime-web loads its WebAssembly runtime from disk at runtime.
    "/api/**": [
      "./node_modules/onnxruntime-web/dist/ort.node.min.mjs",
      "./node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs",
      "./node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm",
    ],
  },
  // Keep the other ~120 MB of onnxruntime-web builds (browser/WebGPU) out of
  // the serverless bundles.
  outputFileTracingExcludes: {
    "/**": [
      "./node_modules/onnxruntime-web/dist/*.map",
      "./node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.{asyncify,jsep,jspi}.*",
      "./node_modules/onnxruntime-web/dist/ort.{all,bundle,jspi,wasm,webgpu,webgl,min}*",
    ],
  },
  // Loaded with a plain Node import so its WebAssembly files resolve from
  // node_modules instead of being rewritten by the bundler.
  serverExternalPackages: ["onnxruntime-web"],
  images: {
    // Served by our own /api/files behind the Basic Auth gate. Next's image
    // optimizer fetches the source server-side *without* the viewer's
    // credentials (401 -> "isn't a valid image"), so the browser loads these
    // files directly instead.
    unoptimized: true,
    // Product photos and generated creatives are served from our own
    // /api/files route (local disk in dev). No remote domains needed yet.
    localPatterns: [{ pathname: "/api/files/**" }],
  },
};

export default nextConfig;
