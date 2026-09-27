import type { MetadataRoute } from "next";
import { caseStudies } from "@/lib/cases";
import { absoluteUrl } from "@/lib/seo";

// Public, indexable routes of advibeagencia.com. Internal tools (/control,
// /studio), private proposals (/propuestas) and client microsites (/drive,
// /enfoque-visual, served on its own subdomain) are intentionally excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/casos"), lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/diagnostico"), lastModified, changeFrequency: "monthly", priority: 0.8 },
  ];
  const cases: MetadataRoute.Sitemap = caseStudies.map((item) => ({
    url: absoluteUrl(`/casos/${item.slug}`),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [...staticRoutes, ...cases];
}
