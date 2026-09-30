import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.advibeagencia.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/control", "/studio", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
