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
    "/**": ["./node_modules/@img/sharp-libvips-linux-x64/lib/**/*"],
  },
  images: {
    // Product photos and generated creatives are served from our own
    // /api/files route (local disk in dev). No remote domains needed yet.
    localPatterns: [{ pathname: "/api/files/**" }],
  },
};

export default nextConfig;
