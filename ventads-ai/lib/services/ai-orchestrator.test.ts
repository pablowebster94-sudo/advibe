
import { describe, expect, it } from "vitest";
import { analyzeProduct } from "@/lib/services/analysis-engine";
import { conceptTypeForVariant, generateAICampaign } from "@/lib/services/ai-orchestrator";
import type { ProductBrief } from "@/lib/product-brief";

const brief: ProductBrief = {
  productName: "Ford F-150",
  category: "Vehículos",
  manufacturer: "Ford",
  model: "F-150 3.7 V6",
  priceDisplay: "$24,900",
  description: "Pickup para trabajo y uso diario.",
  features: ["Motor 3.7 V6", "Caja automática de 6 velocidades"],
  benefits: ["Versatilidad"],
  offer: null,
  cta: "Escríbenos",
  targetAudience: "Personas que buscan una pickup",
  brandName: "AM Motorsport",
  brandCta: null,
  brandContact: null,
  logoKey: null,
  brandColors: null,
};

describe("AI campaign orchestrator", () => {
  it("falls back to deterministic output and returns exactly three variants", async () => {
    const oldGemini = process.env.GEMINI_API_KEY;
    const oldClaude = process.env.ANTHROPIC_API_KEY;
    const oldOpenAI = process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const analysis = analyzeProduct(brief, "MENSAJES");
      const result = await generateAICampaign(brief, analysis, { objective: "MENSAJES" });

      expect(result.variants).toHaveLength(3);
      expect(result.providerStatus).toEqual({
        gemini: "not_configured",
        claude: "not_configured",
        openai: "not_configured",
      });
      expect(result.variants[0]?.angle).toBe("Venta directa");
      // Vehicles keep their dedicated angle mix in the deterministic fallback.
      expect(result.variants.map((variant) => variant.angle)).toEqual([
        "Venta directa",
        "Característica",
        "Aspiracional",
      ]);
      expect([0, 1, 2].map((index) => conceptTypeForVariant(index, brief))).toEqual([
        "VENTA_DIRECTA",
        "CARACTERISTICA",
        "ASPIRACIONAL",
      ]);
      for (const variant of result.variants) {
        expect(variant.headline).toBeTruthy();
        expect(variant.primary_text).toBeTruthy();
        expect(variant.cta).toBeTruthy();
        expect(variant.whatsapp_message).toBeTruthy();
        expect(variant.visual_prompt).toBeTruthy();
      }
    } finally {
      if (oldGemini === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = oldGemini;
      if (oldClaude === undefined) delete process.env.ANTHROPIC_API_KEY;
      else process.env.ANTHROPIC_API_KEY = oldClaude;
      if (oldOpenAI === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = oldOpenAI;
    }
  });
});
