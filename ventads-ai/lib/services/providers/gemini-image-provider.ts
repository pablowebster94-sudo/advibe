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
// edits, product-identity preservation). Overridable in case Google renames
// it again — see the AdVibe /estudio implementation, which hit exactly that
// with the preview id being retired.
const DEFAULT_MODEL = "gemini-3.1-flash-image";

// A single campaign can trigger up to 5 concepts x 3 formats = 15 of these
// calls in one request (see campaign-service.ts). A hung request must fail
// loudly instead of blocking the whole campaign indefinitely, and a failed
// request must never silently become a second billable retry.
const REQUEST_TIMEOUT_MS = 180_000;
const RETRY_ATTEMPTS = 1;

// Our largest target canvas is 1080x1920 (STORY_9_16). Requesting 2K headroom
// from Gemini avoids upscaling a 1K result through applyScrimAndCopy's final
// resize, which would look soft. Good to know: some SDK/model builds have
// been reported to ignore imageConfig.imageSize and always return 1K — this
// is harmless to request either way, just re-check if output looks soft.
const IMAGE_SIZE = "2K";

function getImageModel() {
  return process.env.GEMINI_IMAGE_MODEL?.trim() || DEFAULT_MODEL;
}

/** Strips the API key out of an error message before it's logged or persisted. */
function redactSecrets(value: string, apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return value;
  return value.split(apiKey).join("[REDACTED]");
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
  private apiKey: string;
  private model: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        "IMAGE_PROVIDER=gemini requiere GEMINI_API_KEY. Configúrala en .env."
      );
    }
    this.apiKey = apiKey;
    this.client = new GoogleGenAI({ apiKey });
    this.model = getImageModel();
  }

  private async callGemini({
    prompt,
    images,
    aspectRatio,
  }: {
    prompt: string;
    images: Buffer[];
    aspectRatio: string;
  }): Promise<Buffer> {
    const imageParts: Part[] = await Promise.all(
      images.map(async (buffer) =>
        createPartFromBase64(buffer.toString("base64"), await detectMimeType(buffer))
      )
    );

    let response;
    try {
      response = await this.client.models.generateContent({
        model: this.model,
        contents: createUserContent([prompt, ...imageParts]),
        config: {
          responseModalities: ["IMAGE", "TEXT"],
          candidateCount: 1,
          imageConfig: { aspectRatio, imageSize: IMAGE_SIZE },
          httpOptions: {
            timeout: REQUEST_TIMEOUT_MS,
            retryOptions: { attempts: RETRY_ATTEMPTS },
          },
        },
      });
    } catch (error) {
      const detail = redactSecrets(
        error instanceof Error ? error.message : String(error),
        this.apiKey
      );
      throw new Error(`No se pudo generar la imagen con Gemini: ${detail}`);
    }

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
          ? `Gemini no devolvió una imagen: ${redactSecrets(textPart.slice(0, 200), this.apiKey)}`
          : "Gemini no devolvió ninguna imagen."
    );
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

    const background = await this.callGemini({
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
    const buffer = await this.callGemini({ prompt, images: [], aspectRatio });
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

    const buffer = await this.callGemini({
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
