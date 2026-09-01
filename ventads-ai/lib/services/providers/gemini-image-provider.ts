import {
  GoogleGenAI,
  createPartFromBase64,
  createUserContent,
  type Part,
} from "@google/genai";
import sharp from "sharp";
import { getFormat } from "@/lib/catalog/formats";
import type { GeneratedImage, ImageGenerationService } from "@/lib/services/image-generation";
import { applyScrimAndCopy, type RenderCreativeInput } from "@/lib/services/creative-renderer";
import { buildScenePrompt } from "@/lib/services/gemini-prompt";
import { detectMimeType, nearestSupportedAspectRatio } from "@/lib/services/image-utils";

// "Nano Banana 2" — Gemini's native image generation/editing model. Chosen
// over the older gemini-2.5-flash-image because it's the current
// recommended model for this use case (multi-image blending, precise
// edits, product-identity preservation).
const MODEL = "gemini-3.1-flash-image";

async function callGemini(
  client: GoogleGenAI,
  { prompt, images, aspectRatio }: { prompt: string; images: Buffer[]; aspectRatio: string }
): Promise<Buffer> {
  const imageParts: Part[] = await Promise.all(
    images.map(async (buffer) =>
      createPartFromBase64(buffer.toString("base64"), await detectMimeType(buffer))
    )
  );

  const response = await client.models.generateContent({
    model: MODEL,
    contents: createUserContent([prompt, ...imageParts]),
    config: {
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: { aspectRatio },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);
  if (imagePart?.inlineData?.data) {
    return Buffer.from(imagePart.inlineData.data, "base64");
  }

  const blockReason = response.promptFeedback?.blockReason;
  const textPart = parts.find((part) => part.text)?.text;
  throw new Error(
    blockReason
      ? `Gemini bloqueó la generación (${blockReason}).`
      : textPart
        ? `Gemini no devolvió una imagen: ${textPart.slice(0, 200)}`
        : "Gemini no devolvió ninguna imagen."
  );
}

/**
 * Real generative provider: Gemini ("Nano Banana") composes the background
 * scene and integrates the product photo into it. The copy (headline,
 * price, CTA) is still rendered deterministically by
 * `applyScrimAndCopy` — no generative model is ever asked to draw text, so
 * ad copy is always exactly what the analysis/copy engines produced,
 * regardless of which image backend is active (see AGENTS.md #7 and
 * ARCHITECTURE.md → Image generation).
 */
export class GeminiImageProvider implements ImageGenerationService {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        "IMAGE_PROVIDER=gemini requiere GEMINI_API_KEY. Configúrala en .env."
      );
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateCreative(input: RenderCreativeInput): Promise<GeneratedImage> {
    const format = getFormat(input.formatId);
    const aspectRatio = nearestSupportedAspectRatio(format.width, format.height);
    const prompt = buildScenePrompt({
      conceptType: input.conceptType,
      styleId: input.styleId,
      headline: input.headline,
      variantSeed: input.variantSeed,
      hasProduct: Boolean(input.productImageBuffer),
    });

    const background = await callGemini(this.client, {
      prompt,
      images: input.productImageBuffer ? [input.productImageBuffer] : [],
      aspectRatio,
    });

    return applyScrimAndCopy(background, {
      formatId: input.formatId,
      styleId: input.styleId,
      conceptType: input.conceptType,
      headline: input.headline,
      supportingLine: input.supportingLine,
      priceDisplay: input.priceDisplay,
      ctaLabel: input.ctaLabel,
      logoBuffer: input.logoBuffer,
      hasProductPhoto: Boolean(input.productImageBuffer),
    });
  }

  async generateVariation(input: RenderCreativeInput): Promise<GeneratedImage> {
    return this.generateCreative({ ...input, variantSeed: input.variantSeed + 1 });
  }

  async editProductImage(buffer: Buffer, targetFormatId: string): Promise<GeneratedImage> {
    // Never runs this through the generative model — resizing/positioning
    // the product photo must never alter the product itself (AGENTS.md
    // #3/#15), so this is the same non-AI transform the local provider uses.
    const format = getFormat(targetFormatId);
    const out = await sharp(buffer)
      .resize(format.width, format.height, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toBuffer();
    return { buffer: out, width: format.width, height: format.height };
  }

  async createBackground(formatId: string, styleId: string): Promise<GeneratedImage> {
    const format = getFormat(formatId);
    const aspectRatio = nearestSupportedAspectRatio(format.width, format.height);
    const prompt = buildScenePrompt({
      conceptType: "VENTA_DIRECTA",
      styleId,
      headline: "",
      variantSeed: 0,
      hasProduct: false,
    });
    const buffer = await callGemini(this.client, { prompt, images: [], aspectRatio });
    const resized = await sharp(buffer)
      .resize(format.width, format.height, { fit: "cover" })
      .png()
      .toBuffer();
    return { buffer: resized, width: format.width, height: format.height };
  }

  async createComposition(
    backgroundBuffer: Buffer,
    productImageBuffer: Buffer
  ): Promise<GeneratedImage> {
    const bgMeta = await sharp(backgroundBuffer).metadata();
    const width = bgMeta.width ?? 1080;
    const height = bgMeta.height ?? 1080;

    const buffer = await callGemini(this.client, {
      prompt: [
        "The first attached image is a background scene. The second attached image is a real product photo.",
        "Blend the product naturally and realistically into the background scene, matching its lighting, perspective, and shadows.",
        "Preserve the product exactly as photographed — do not alter its shape, color, or any physical detail.",
        "Do not render any text, numbers, logos, or watermarks anywhere in the image.",
      ].join("\n"),
      images: [backgroundBuffer, productImageBuffer],
      aspectRatio: nearestSupportedAspectRatio(width, height),
    });

    const resized = await sharp(buffer).resize(width, height, { fit: "cover" }).png().toBuffer();
    return { buffer: resized, width, height };
  }
}
