import { afterEach, describe, expect, it, vi } from "vitest";
import { buildScenePrompt, pickScene } from "@/lib/services/gemini-prompt";
import { activeImageProviderName } from "@/lib/services/image-generation";


const base = {
  conceptType: "VENTA_DIRECTA",
  styleId: "COMERCIAL",
  formatId: "PORTRAIT_4_5",
  variantSeed: 0,
  hasProduct: true,
  isVehicle: true,
  objective: "VENDER",
  hasPrice: true,
};

afterEach(() => vi.unstubAllEnvs());

describe("Gemini art direction prompt", () => {
  it("forbids every kind of rendered text and keeps the vehicle identical", () => {
    const prompt = buildScenePrompt(base);
    expect(prompt).toMatch(/ABSOLUTELY NO TEXT/);
    for (const word of ["prices", "phone numbers", "URLs", "call-to-action", "brand names"]) {
      expect(prompt).toContain(word);
    }
    expect(prompt).toMatch(/same paint color/);
    expect(prompt).toMatch(/same wheels/);
    expect(prompt).toMatch(/do not add accessories/);
  });

  it("gives each concept its own art direction and scene", () => {
    const prompts = ["VENTA_DIRECTA", "CARACTERISTICA", "ASPIRACIONAL"].map((conceptType) =>
      buildScenePrompt({ ...base, conceptType })
    );
    expect(new Set(prompts).size).toBe(3);
    const scenes = ["VENTA_DIRECTA", "CARACTERISTICA", "ASPIRACIONAL"].map((c) => pickScene(c, true, 0).setting);
    expect(new Set(scenes).size).toBe(3);
  });

  it("composes differently per format and changes the scene on every regeneration", () => {
    const formats = ["SQUARE_1_1", "PORTRAIT_4_5", "STORY_9_16"].map((formatId) =>
      buildScenePrompt({ ...base, formatId })
    );
    expect(new Set(formats).size).toBe(3);
    expect(formats[2]).toMatch(/Story\/Reel/);
    const seeds = [0, 1, 2, 3].map((variantSeed) => pickScene("ASPIRACIONAL", true, variantSeed).setting);
    expect(new Set(seeds).size).toBe(4);
  });

  it("never passes the price, headline or CTA to the image model", () => {
    const prompt = buildScenePrompt(base);
    expect(prompt).not.toMatch(/\$\d/);
  });
});

describe("image provider selection", () => {
  it("defaults to Gemini when GEMINI_API_KEY exists and to local otherwise", () => {
    vi.stubEnv("IMAGE_PROVIDER", "");
    vi.stubEnv("GEMINI_API_KEY", "key");
    expect(activeImageProviderName()).toBe("gemini");
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(activeImageProviderName()).toBe("local-compositor");
    vi.stubEnv("IMAGE_PROVIDER", "gemini");
    expect(activeImageProviderName()).toBe("local-compositor");
    vi.stubEnv("IMAGE_PROVIDER", "local-compositor");
    vi.stubEnv("GEMINI_API_KEY", "key");
    expect(activeImageProviderName()).toBe("local-compositor");
  });
});
