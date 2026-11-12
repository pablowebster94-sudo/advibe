import sharp from "sharp";
import { getFormat } from "@/lib/catalog/formats";
import type { GeneratedImage, ImageGenerationService } from "@/lib/services/image-generation";
import {
  applyScrimAndCopy,
  heroRatioFor,
  placeProductOnScene,
  type RenderCreativeInput,
} from "@/lib/services/creative-renderer";
import { buildBackgroundPrompt, buildScenePrompt } from "@/lib/services/gemini-prompt";

const DEFAULT_MODEL = "gpt-image-2";
const REQUEST_TIMEOUT_MS = 110_000;

type ImageResponse = { data?: Array<{ b64_json?: string }>; error?: { message?: string; code?: string } };

function generationSize(formatId: string) {
  switch (formatId) {
    case "PORTRAIT_4_5": return "1024x1280";
    case "STORY_9_16": return "1024x1824";
    default: return "1024x1024";
  }
}

export class OpenAIImageProvider implements ImageGenerationService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly quality: "low" | "medium" | "high";

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("IMAGE_PROVIDER=openai requiere OPENAI_API_KEY.");
    this.apiKey = apiKey;
    this.model = process.env.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_MODEL;
    const quality = process.env.OPENAI_IMAGE_QUALITY?.trim();
    this.quality = quality === "low" || quality === "high" ? quality : "medium";
  }

  private async generateBackground(prompt: string, formatId: string): Promise<Buffer> {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        prompt,
        size: generationSize(formatId),
        quality: this.quality,
        output_format: "png",
        n: 1,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const payload = await response.json().catch(() => ({})) as ImageResponse;
    if (!response.ok) {
      const detail = payload.error?.message || `HTTP ${response.status}`;
      throw new Error(`OpenAI Images no pudo generar la escena: ${detail.slice(0, 500)}`);
    }
    const encoded = payload.data?.[0]?.b64_json;
    if (!encoded) throw new Error("OpenAI Images no devolvió datos de imagen.");
    return Buffer.from(encoded, "base64");
  }

  async generateCreative(input: RenderCreativeInput): Promise<GeneratedImage> {
    const format = getFormat(input.formatId);

    // If segmentation cannot isolate the complete subject, do not send the
    // original product photo through a generative edit. Keep its pixels intact.
    if (input.productImageBuffer && !input.productCutout) {
      const local = await import("@/lib/services/creative-renderer").then(({ renderCreative }) => renderCreative(input));
      return { ...local, provider: "local-compositor:original-product-preserved", extension: "jpg",
        note: "No se pudo aislar el producto completo; se conservó la fotografía original sin redibujarla." };
    }

    const basePrompt = input.productCutout
      ? buildBackgroundPrompt({
          conceptType: input.conceptType,
          styleId: input.styleId,
          formatId: input.formatId,
          variantSeed: input.variantSeed,
          isVehicle: Boolean(input.isVehicle),
          visibleHeight: heroRatioFor(input.formatId),
        })
      : buildScenePrompt({
          conceptType: input.conceptType,
          styleId: input.styleId,
          formatId: input.formatId,
          variantSeed: input.variantSeed,
          hasProduct: false,
          isVehicle: Boolean(input.isVehicle),
          objective: input.objective,
          hasPrice: Boolean(input.priceDisplay || input.offerDisplay),
        });

    const prompt = [
      basePrompt,
      input.visualPrompt ? `DIRECCIÓN DE ARTE DEL USUARIO:\n${input.visualPrompt}` : "",
      input.productCutout
        ? "Deja una zona visual limpia y despejada para integrar después el producto original. No generes ningún producto, vehículo, persona, texto, cifra, logotipo ni marca."
        : "No incluyas textos, cifras, logotipos, marcas de agua ni letras legibles. La tipografía comercial se añadirá después mediante composición exacta.",
      `Formato de composición: ${format.width}x${format.height}. Fotografía publicitaria profesional, iluminación y materiales realistas.`,
    ].filter(Boolean).join("\n\n");

    let scene = await this.generateBackground(prompt, input.formatId);
    scene = await sharp(scene).rotate().resize(format.width, format.height, { fit: "cover", position: "attention" }).png().toBuffer();

    if (input.productCutout) {
      scene = await placeProductOnScene(scene, input.productCutout, {
        formatId: input.formatId,
        dark: input.styleId === "PREMIUM",
        reflection: input.styleId === "PREMIUM" ? 0.1 : 0,
      });
    }

    const composed = await applyScrimAndCopy(scene, {
      formatId: input.formatId,
      styleId: input.styleId,
      conceptType: input.conceptType,
      headline: input.headline,
      supportingLine: input.supportingLine,
      priceDisplay: input.priceDisplay,
      offerDisplay: input.offerDisplay,
      ctaLabel: input.ctaLabel,
      logoBuffer: input.logoBuffer,
      highlights: input.highlights,
    });

    return {
      ...composed,
      provider: input.productCutout ? `openai:${this.model}+producto-original` : `openai:${this.model}`,
      extension: "jpg",
    };
  }

  async generateVariation(input: RenderCreativeInput) {
    return this.generateCreative({ ...input, variantSeed: input.variantSeed + 1 });
  }

  async editProductImage(buffer: Buffer, targetFormatId: string): Promise<GeneratedImage> {
    const format = getFormat(targetFormatId);
    const out = await sharp(buffer).rotate().resize(format.width, format.height, {
      fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 },
    }).png().toBuffer();
    return { buffer: out, width: format.width, height: format.height, provider: "sharp-original-preserved", extension: "png" };
  }

  async createBackground(formatId: string, styleId: string): Promise<GeneratedImage> {
    const format = getFormat(formatId);
    const prompt = buildScenePrompt({
      conceptType: "VENTA_DIRECTA", styleId, formatId, variantSeed: 0,
      hasProduct: false, isVehicle: false,
    }) + "\nNo text, logos, lettering or watermark.";
    const buffer = await this.generateBackground(prompt, formatId);
    const resized = await sharp(buffer).resize(format.width, format.height, { fit: "cover" }).png().toBuffer();
    return { buffer: resized, width: format.width, height: format.height, provider: `openai:${this.model}`, extension: "png" };
  }

  async createComposition(backgroundBuffer: Buffer, productImageBuffer: Buffer): Promise<GeneratedImage> {
    const meta = await sharp(backgroundBuffer).metadata();
    const width = meta.width ?? 1080;
    const height = meta.height ?? 1080;
    const product = await sharp(productImageBuffer).rotate().resize(
      Math.round(width * 0.84), Math.round(height * 0.72),
      { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } },
    ).png().toBuffer();
    const buffer = await sharp(backgroundBuffer).composite([{
      input: product,
      left: Math.round((width - Math.round(width * 0.84)) / 2),
      top: Math.round((height - Math.round(height * 0.72)) / 2),
    }]).png().toBuffer();
    return { buffer, width, height, provider: "sharp-original-preserved", extension: "png" };
  }
}
