import { afterEach, describe, expect, it } from "vitest";
import { activeImageProviderName } from "@/lib/services/image-generation";

afterEach(() => {
  delete process.env.IMAGE_PROVIDER;
  delete process.env.OPENAI_API_KEY;
  delete process.env.GEMINI_API_KEY;
});

describe("image provider selection", () => {
  it("prefers OpenAI when its key is available and no provider is pinned", () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.GEMINI_API_KEY = "gemini-key";
    expect(activeImageProviderName()).toBe("openai");
  });

  it("falls back to OpenAI when Gemini is selected but has no configured key", () => {
    process.env.IMAGE_PROVIDER = "gemini";
    process.env.OPENAI_API_KEY = "test-key";
    expect(activeImageProviderName()).toBe("openai");
  });

  it("uses local composition when no image provider key is available", () => {
    expect(activeImageProviderName()).toBe("local-compositor");
  });
});
