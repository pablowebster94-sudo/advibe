import type { MetadataRoute } from "next";
import { caseStudies } from "@/lib/cases";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.advibeagencia.com";
  const cases = caseStudies.map((item) => ({
    url: `${baseUrl}/casos/${item.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/casos`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    ...cases,
  ];
}
