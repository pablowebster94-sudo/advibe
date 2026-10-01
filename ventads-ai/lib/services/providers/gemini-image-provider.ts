import {
  GoogleGenAI,
  createPartFromBase64,
  createUserContent,
  type Part,
} from "@google/genai";
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
import { detectMimeType, nearestSupportedAspectRatio } from "@/lib/services/image-utils";

const DEFAULT_MODEL = "gemini-3.1-flash-image";
const REQUEST_TIMEOUT_MS = 100_000;
const RETRY_ATTEMPTS = 1;
const IMAGE_SIZE = "2K";

function getImageModel() {
  return process.env.GEMINI_IMAGE_MODEL?.trim() || DEFAULT_MODEL;
}

function redactSecrets(value: string, apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return value;
  return value.split(apiKey).join("[REDACTED]");
}

export class GeminiImageProvider implements ImageGenerationService {
  private client: GoogleGenAI;
  private apiKey: string;
  private model: string;
  private fallback: ImageGenerationService | null;

  /**
   * Identifies which key/project failed without exposing the key: its last 4
   * characters (as Google AI Studio lists keys) and the Google Cloud project
   * number that Google's error reports, when present.
   */
  private keyContext(detail: string): string {
    const project = /projects\/(\d+)/.exec(detail)?.[1];
    const parts = [`key …${this.apiKey.slice(-4)}`];
    if (project) parts.push(`proyecto ${project}`);
    return parts.join(", ");
  }

  constructor(apiKey: string, fallback: ImageGenerationService | null = null) {
    if (!apiKey) throw new Error("IMAGE_PROVIDER=gemini requiere GEMINI_API_KEY. Configúrala en .env.");
    this.apiKey = apiKey;
    this.fallback = fallback;
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

    try {
      const response = await this.client.models.generateContent({
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

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((part) => part.inlineData?.data);
      if (imagePart?.inlineData?.data) return Buffer.from(imagePart.inlineData.data, "base64");

      const blockReason = response.promptFeedback?.blockReason;
      const textPart = parts.find((part) => part.text)?.text;
      throw new Error(
        blockReason
          ? `Gemini bloqueó la generación (${blockReason}).`
          : textPart
            ? `Gemini no devolvió una imagen: ${redactSecrets(textPart.slice(0, 200), this.apiKey)}`
            : "Gemini no devolvió ninguna imagen."
      );
    } catch (error) {
      const detail = redactSecrets(error instanceof Error ? error.message : String(error), this.apiKey);
      if (detail.startsWith("Gemini bloqueó") || detail.startsWith("Gemini no devolvió")) throw new Error(detail);
      throw new Error(`No se pudo generar la imagen con Gemini: ${detail}`);
    }
  }

  async generateCreative(input: RenderCreativeInput): Promise<GeneratedImage> {
    const format = getFormat(input.formatId);
    const aspectRatio = nearestSupportedAspectRatio(format.width, format.height);

    // The real product is never sent to the model to be redrawn: with a
    // cut-out, Gemini paints only the empty set and the original pixels are
    // placed on it; without one, the original photo is used as is.
    if (input.productImageBuffer && !input.productCutout && this.fallback) {
      const local = await this.fallback.generateCreative(input);
      return {
        ...local,
        note: "No se pudo aislar el producto de la foto (fondo poco claro o producto cortado por el borde); se usó la foto original sin modificar.",
      };
    }

    const prompt = input.productCutout
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

    let scene: Buffer;
    try {
      scene = await this.callGemini({ prompt, images: [], aspectRatio });
      if (input.productCutout) {
        scene = await placeProductOnScene(scene, input.productCutout, {
          formatId: input.formatId,
          dark: false,
          reflection: 0.08,
        });
      }
    } catch (error) {
      if (!this.fallback) throw error;
      const detail = error instanceof Error ? error.message : String(error);
      console.error(`[gemini-image] ${this.model} failed, using local compositor: ${detail.slice(0, 300)}`);
      const local = await this.fallback.generateCreative(input);
      return {
        ...local,
        provider: "local-compositor:gemini-fallback",
        note: `Gemini (${this.model}) no generó la escena [${this.keyContext(detail)}]: ${redactSecrets(detail, this.apiKey).slice(0, 400)}`,
      };
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
      provider: input.productCutout ? `gemini:${this.model}+producto-real` : `gemini:${this.model}`,
      extension: "jpg",
    };
  }

  async generateVariation(input: RenderCreativeInput): Promise<GeneratedImage> {
    return this.generateCreative({ ...input, variantSeed: input.variantSeed + 1 });
  }

  async editProductImage(buffer: Buffer, targetFormatId: string): Promise<GeneratedImage> {
    const format = getFormat(targetFormatId);
    const out = await sharp(buffer)
      .resize(format.width, format.height, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
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
      formatId,
      variantSeed: 0,
      hasProduct: false,
      isVehicle: false,
    });
    const buffer = await this.callGemini({ prompt, images: [], aspectRatio });
    const resized = await sharp(buffer).resize(format.width, format.height, { fit: "cover" }).png().toBuffer();
    return { buffer: resized, width: format.width, height: format.height };
  }

  async createComposition(backgroundBuffer: Buffer, productImageBuffer: Buffer): Promise<GeneratedImage> {
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
