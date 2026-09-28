import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// Fotos de Enfoque Visual: bucket público listing-media de Supabase Storage.
function supabaseImagePatterns() {
  const patterns: Array<{ protocol: "https"; hostname: string; pathname: string }> = [
    { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/listing-media/**" },
  ];
  const custom = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (custom?.startsWith("https://")) {
    const host = new URL(custom).hostname;
    if (!host.endsWith(".supabase.co")) patterns.push({ protocol: "https", hostname: host, pathname: "/storage/v1/object/public/listing-media/**" });
  }
  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [...supabaseImagePatterns(), { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" }],
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Panel y APIs de Enfoque Visual: nunca indexables.
      { source: "/enfoque-visual/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/enfoque-visual/admin", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/enfoque/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      // En enfoque.advibeagencia.com el panel se sirve como /admin (reescrito por middleware.ts).
      ...["enfoque.advibeagencia.com", "enfoquevisual.advibeagencia.com"].flatMap((host) => ["/admin", "/admin/:path*"].map((source) => ({
        source, has: [{ type: "host" as const, value: host }], headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      }))),
    ];
  },
};

export default nextConfig;
