import { BUSINESS, SITE, route } from "@/lib/licor/config";

/**
 * PWA manifest for the storefront.
 *
 * Next's `manifest.ts` convention only applies at the root of `app/`, which is
 * owned by the host site, so the storefront serves its own manifest from this
 * route and links it via `metadata.manifest` in the segment layout.
 */
export function GET() {
  const manifest = {
    id: `${route("/")}/`,
    name: `${BUSINESS.name} — ${BUSINESS.concept}`,
    short_name: BUSINESS.name,
    description: SITE.description,
    start_url: `${route("/")}?utm_source=pwa`,
    scope: `${route("/")}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A0A0B",
    theme_color: SITE.themeColor,
    lang: "en-US",
    dir: "ltr",
    categories: ["shopping", "food"],
    icons: [
      {
        src: route("/pwa-icon/192"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: route("/pwa-icon/512"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: route("/pwa-icon/512"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Shop", url: route("/shop") },
      { name: "Deals", url: route("/deals") },
      { name: "Cart", url: route("/cart") },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
