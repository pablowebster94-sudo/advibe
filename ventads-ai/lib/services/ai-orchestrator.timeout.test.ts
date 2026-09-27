import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProductBrief } from "@/lib/product-brief";

const brief: ProductBrief = {
  productName: "Hilux",
  category: "vehiculos",
  manufacturer: "Toyota",
  model: "SRV 4x4",
  priceDisplay: "$38,900",
  description: null,
  features: ["Motor 2.8 diésel", "Tracción 4x4"],
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

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("AI orchestrator time budget", () => {
  it("never outlives its budget when every provider hangs, and falls back", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("AI_TOTAL_TIMEOUT_MS", "4000");
    // A provider that never answers; only the AbortController can end it.
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { generateAICampaign } = await import("@/lib/services/ai-orchestrator");
    const { analyzeProduct } = await import("@/lib/services/analysis-engine");

    const started = Date.now();
    const result = await generateAICampaign(brief, analyzeProduct(brief, "VENDER"), {
      objective: "VENDER",
    });
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(6000);
    expect(result.variants).toHaveLength(3);
    expect(result.providerStatus).toEqual({ gemini: "fallback", claude: "fallback", openai: "fallback" });
    // Budget spent on the first provider; the others are skipped, not awaited.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
