import { describe, expect, it } from "vitest";
import { displayCase } from "@/lib/product-brief";
import { analyzeProduct } from "@/lib/services/analysis-engine";
import { generateAICampaign } from "@/lib/services/ai-orchestrator";
import type { ProductBrief } from "@/lib/product-brief";

describe("displayCase", () => {
  it("capitalizes text typed all in lowercase", () => {
    expect(displayCase("chevrolet")).toBe("Chevrolet");
    expect(displayCase("único dueño")).toBe("Único dueño");
  });
  it("keeps deliberate casing", () => {
    expect(displayCase("iPhone 15")).toBe("iPhone 15");
    expect(displayCase("BMW X5")).toBe("BMW X5");
    expect(displayCase(null)).toBeNull();
  });
});

describe("headlines from minimal input", () => {
  it("never uses a lone word as headline and never repeats one", async () => {
    const keys = ["GEMINI_API_KEY", "ANTHROPIC_API_KEY", "OPENAI_API_KEY"] as const;
    const saved = keys.map((k) => process.env[k]);
    keys.forEach((k) => delete process.env[k]);
    try {
      const brief: ProductBrief = {
        productName: displayCase("chevrolet"),
        category: "Vehículos",
        manufacturer: null,
        model: null,
        priceDisplay: "$20.000",
        description: null,
        features: [displayCase("nuevo")],
        benefits: [],
        offer: null,
        cta: null,
        targetAudience: null,
        brandName: null,
        brandCta: null,
        brandContact: null,
        logoKey: null,
        brandColors: null,
      };
      const result = await generateAICampaign(brief, analyzeProduct(brief, "VENDER"), {
        objective: "VENDER",
        variantCount: 4,
      });
      const headlines = result.variants.map((v) => v.headline);
      expect(headlines).toContain("Chevrolet nuevo");
      expect(new Set(headlines.map((h) => h.toLowerCase())).size).toBe(headlines.length);
      for (const h of headlines) expect(h.trim().split(/\s+/).length).toBeGreaterThan(1);
    } finally {
      keys.forEach((k, i) => (saved[i] === undefined ? delete process.env[k] : (process.env[k] = saved[i])));
    }
  });
});
