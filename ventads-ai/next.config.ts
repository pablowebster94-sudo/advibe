import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // ventADS.ai lives inside the AdVibe repo but is a fully independent
  // project; pin the workspace root so Turbopack doesn't try to reach
  // outside this directory because of the sibling package-lock.json.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    // Product photos and generated creatives are served from our own
    // /api/files route (local disk in dev). No remote domains needed yet.
    localPatterns: [{ pathname: "/api/files/**" }],
  },
};

export default nextConfig;
