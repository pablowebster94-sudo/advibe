import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/lib/licor/catalog";
import { BASE_PATH } from "@/lib/licor/config";

const baseUrl = "https://www.advibeagencia.com";

const licorRoutes = [
  { path: "", priority: 1, changeFrequency: "daily" as const },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/deals", priority: 0.8, changeFrequency: "daily" as const },
  { path: "/delivery", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/age-verification", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...licorRoutes.map((entry) => ({
      url: `${baseUrl}${BASE_PATH}${entry.path}`,
      lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    })),
    ...PRODUCTS.map((product) => ({
      url: `${baseUrl}${BASE_PATH}/product/${product.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
