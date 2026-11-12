import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAIImageProvider } from "@/lib/services/providers/openai-image-provider";

afterEach(() => vi.unstubAllGlobals());

describe("OpenAI image provider", () => {
  it("requests a background and returns a correctly composed square ad", async () => {
    const generated = await sharp({
      create: { width: 1024, height: 1024, channels: 3, background: { r: 225, g: 230, b: 225 } },
    }).png().toBuffer();
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      void input;
      void init;
      return new Response(JSON.stringify({ data: [{ b64_json: generated.toString("base64") }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAIImageProvider("test-api-key");
    const result = await provider.generateCreative({
      formatId: "SQUARE_1_1",
      styleId: "COMERCIAL",
      conceptType: "VENTA_DIRECTA",
      headline: "Muebles para tu hogar",
      supportingLine: "Diseño y comodidad",
      priceDisplay: null,
      ctaLabel: "Solicita información",
      productImageBuffer: null,
      logoBuffer: null,
      variantSeed: 0,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/v1/images/generations");
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as { model: string; size: string; quality: string };
    expect(requestBody.model).toBe("gpt-image-2");
    expect(requestBody.size).toBe("1024x1024");
    expect(requestBody.quality).toBe("medium");
    expect(result.width).toBe(1080);
    expect(result.height).toBe(1080);
    expect(result.provider).toContain("openai:gpt-image-2");
  });

  it("never sends an uncut original product photo to the image model", async () => {
    const original = await sharp({
      create: { width: 600, height: 400, channels: 3, background: { r: 30, g: 80, b: 140 } },
    }).png().toBuffer();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAIImageProvider("test-api-key");
    const result = await provider.generateCreative({
      formatId: "PORTRAIT_4_5",
      styleId: "COMERCIAL",
      conceptType: "VENTA_DIRECTA",
      headline: "Producto original",
      supportingLine: null,
      priceDisplay: null,
      ctaLabel: "Consulta",
      productImageBuffer: original,
      productCutout: null,
      logoBuffer: null,
      variantSeed: 0,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.provider).toContain("original-product-preserved");
    expect(result.note).toContain("fotografía original");
  });
});
