import sharp from "sharp";
import { getFormat } from "@/lib/catalog/formats";
import { getStyle } from "@/lib/catalog/styles";
import { renderCreative, type RenderCreativeInput } from "@/lib/services/creative-renderer";

export type GeneratedImage = { buffer: Buffer; width: number; height: number };

/**
 * Every image-producing operation in ventADS.ai goes through this
 * interface. Nothing outside this file knows whether creatives come from
 * local compositing or a real generative model — swapping providers later
 * (Bedrock, OpenAI Images, Replicate, ...) means adding one class here and
 * flipping IMAGE_PROVIDER, per AGENTS.md #14.
 */
export interface ImageGenerationService {
  /** Produces a finished, ready-to-publish ad creative. */
  generateCreative(input: RenderCreativeInput): Promise<GeneratedImage>;
  /** Produces a differently-composed take on the same creative. */
  generateVariation(input: RenderCreativeInput): Promise<GeneratedImage>;
  /** Resizes/positions a product photo without altering the product itself. */
  editProductImage(
    buffer: Buffer,
    targetFormatId: string
  ): Promise<GeneratedImage>;
  /** Renders just the style-driven background layer for a format. */
  createBackground(
    formatId: string,
    styleId: string
  ): Promise<GeneratedImage>;
  /** Composites a product photo onto a background, no text. */
  createComposition(
    backgroundBuffer: Buffer,
    productImageBuffer: Buffer
  ): Promise<GeneratedImage>;
}

class LocalCompositorProvider implements ImageGenerationService {
  async generateCreative(input: RenderCreativeInput) {
    return renderCreative(input);
  }

  async generateVariation(input: RenderCreativeInput) {
    return renderCreative({ ...input, variantSeed: input.variantSeed + 1 });
  }

  async editProductImage(buffer: Buffer, targetFormatId: string) {
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

  async createBackground(formatId: string, styleId: string) {
    const format = getFormat(formatId);
    const style = getStyle(styleId);
    const svg = `
      <svg width="${format.width}" height="${format.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${style.palette.background}" />
            <stop offset="100%" stop-color="${style.palette.panel}" />
          </linearGradient>
        </defs>
        <rect width="${format.width}" height="${format.height}" fill="url(#bg)" />
      </svg>
    `;
    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    return { buffer, width: format.width, height: format.height };
  }

  async createComposition(backgroundBuffer: Buffer, productImageBuffer: Buffer) {
    const bgMeta = await sharp(backgroundBuffer).metadata();
    const width = bgMeta.width ?? 1080;
    const height = bgMeta.height ?? 1080;
    const stageWidth = Math.round(width * 0.85);
    const stageHeight = Math.round(height * 0.7);

    const resizedProduct = await sharp(productImageBuffer)
      .resize(stageWidth, stageHeight, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    const buffer = await sharp(backgroundBuffer)
      .composite([
        {
          input: resizedProduct,
          left: Math.round((width - stageWidth) / 2),
          top: Math.round((height - stageHeight) / 2),
        },
      ])
      .png()
      .toBuffer();

    return { buffer, width, height };
  }
}

function createImageGenerationService(): ImageGenerationService {
  const provider = process.env.IMAGE_PROVIDER ?? "local-compositor";
  switch (provider) {
    case "local-compositor":
      return new LocalCompositorProvider();
    default:
      throw new Error(`Unknown IMAGE_PROVIDER: ${provider}`);
  }
}

export const imageGeneration = createImageGenerationService();
