import type { NextConfig } from "next";
import path from "node:path";

const repoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  // ventADS.ai lives inside the AdVibe repo (Vercel Root Directory =
  // ventads-ai). Vercel injects `outputFileTracingRoot` = the repo root,
  // and Next requires `turbopack.root` to match it, so pin both to the
  // repo root explicitly (this also silences the multiple-lockfile guess).
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
  images: {
    // Product photos and generated creatives are served from our own
    // /api/files route (local disk in dev). No remote domains needed yet.
    localPatterns: [{ pathname: "/api/files/**" }],
  },
};

export default nextConfig;
