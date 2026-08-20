import type { MetadataRoute } from "next";
import { BASE_PATH } from "@/lib/licor/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.advibeagencia.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Transactional screens carry no crawlable content.
      disallow: [
        `${BASE_PATH}/cart`,
        `${BASE_PATH}/checkout`,
        `${BASE_PATH}/order`,
        `${BASE_PATH}/account`,
        `${BASE_PATH}/offline`,
        "/api/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
