import sharp, { type OverlayOptions } from "sharp";
import { getFormat } from "@/lib/catalog/formats";
import { getStyle } from "@/lib/catalog/styles";
import { escapeXml, wrapText } from "@/lib/services/svg";

export type RenderCreativeInput = {
  formatId: string;
  styleId: string;
  conceptType: string;
  headline: string;
  supportingLine: string | null;
  priceDisplay: string | null;
  ctaLabel: string;
  productImageBuffer: Buffer | null;
  logoBuffer: Buffer | null;
  /** Cycles the layout so repeated regenerations look meaningfully different. */
  variantSeed: number;
};

function backgroundLayer(width: number, height: number, palette: {
  background: string;
  panel: string;
  accent: string;
}) {
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.background}" />
          <stop offset="100%" stop-color="${palette.panel}" />
        </linearGradient>
        <radialGradient id="glow" cx="80%" cy="10%" r="60%">
          <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.22" />
          <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)" />
      <rect width="${width}" height="${height}" fill="url(#glow)" />
    </svg>
  `;
}

function scrimLayer(width: number, height: number, scrimHeightRatio: number) {
  const scrimHeight = Math.round(height * scrimHeightRatio);
  const y = height - scrimHeight;
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scrim" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.82" />
        </linearGradient>
      </defs>
      <rect x="0" y="${y}" width="${width}" height="${scrimHeight}" fill="url(#scrim)" />
    </svg>
  `;
}

function textLayer(params: {
  width: number;
  height: number;
  headline: string;
  supportingLine: string | null;
  priceDisplay: string | null;
  ctaLabel: string;
  conceptType: string;
  accent: string;
  textColor: string;
  panel: string;
}) {
  const {
    width,
    height,
    headline,
    supportingLine,
    priceDisplay,
    ctaLabel,
    conceptType,
    accent,
    textColor,
    panel,
  } = params;

  const margin = Math.round(width * 0.06);
  const fontFamily = "'DejaVu Sans', 'Liberation Sans', sans-serif";
  const headlineSize = Math.round(width * 0.075);
  const availableWidth = width - margin * 2;
  // Bold DejaVu Sans averages ~0.62em per glyph; leave a small safety
  // margin so wrapped lines never run past the right edge of the canvas.
  const maxCharsPerLine = Math.max(
    6,
    Math.floor(availableWidth / (headlineSize * 0.62))
  );
  const headlineLines = wrapText(headline, maxCharsPerLine, 3);
  const lineHeight = headlineSize * 1.12;

  const ctaWidth = Math.min(
    width - margin * 2,
    Math.round(ctaLabel.length * headlineSize * 0.34 + headlineSize * 1.6)
  );
  const ctaHeight = Math.round(headlineSize * 1.1);
  const ctaY = height - margin - ctaHeight;
  const headlineBaseY = ctaY - headlineSize * 0.9 - (supportingLine ? headlineSize * 0.85 : 0);
  const headlineStartY = headlineBaseY - (headlineLines.length - 1) * lineHeight;

  const badge =
    priceDisplay && conceptType !== "OFERTA"
      ? `
        <rect x="${width - margin - priceDisplay.length * headlineSize * 0.42 - headlineSize * 0.8}" y="${margin * 0.6}"
          width="${priceDisplay.length * headlineSize * 0.42 + headlineSize * 0.8}" height="${headlineSize * 1.1}"
          rx="${headlineSize * 0.55}" fill="${accent}" />
        <text x="${width - margin - (priceDisplay.length * headlineSize * 0.42 + headlineSize * 0.8) / 2}"
          y="${margin * 0.6 + headlineSize * 0.75}" text-anchor="middle"
          font-family="${fontFamily}" font-weight="700" font-size="${headlineSize * 0.5}"
          fill="${panel}">${escapeXml(priceDisplay)}</text>
      `
      : "";

  const ribbon =
    conceptType === "OFERTA"
      ? `
        <rect x="${margin}" y="${margin * 0.6}" width="${headlineSize * 3.6}" height="${headlineSize * 0.85}"
          rx="${headlineSize * 0.18}" fill="${accent}" />
        <text x="${margin + headlineSize * 1.8}" y="${margin * 0.6 + headlineSize * 0.58}" text-anchor="middle"
          font-family="${fontFamily}" font-weight="700" font-size="${headlineSize * 0.42}"
          letter-spacing="1" fill="${panel}">OFERTA</text>
        ${
          priceDisplay
            ? `<text x="${margin}" y="${margin * 0.6 + headlineSize * 1.55}"
                font-family="${fontFamily}" font-weight="700" font-size="${headlineSize * 0.62}"
                fill="${textColor}">${escapeXml(priceDisplay)}</text>`
            : ""
        }
      `
      : "";

  const headlineTspans = headlineLines
    .map(
      (line, index) =>
        `<tspan x="${margin}" y="${headlineStartY + index * lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("");

  const supportingSize = headlineSize * 0.42;
  const supportingMaxChars = Math.max(
    6,
    Math.floor(availableWidth / (supportingSize * 0.58))
  );
  const supportingText = supportingLine
    ? wrapText(supportingLine, supportingMaxChars, 1)[0]
    : null;
  const supporting = supportingText
    ? `<text x="${margin}" y="${ctaY - headlineSize * 0.35}" font-family="${fontFamily}"
        font-size="${supportingSize}" fill="${textColor}" opacity="0.85">${escapeXml(supportingText)}</text>`
    : "";

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${badge}
      ${ribbon}
      <text font-family="${fontFamily}" font-weight="800" font-size="${headlineSize}" fill="${textColor}">
        ${headlineTspans}
      </text>
      ${supporting}
      <rect x="${margin}" y="${ctaY}" width="${ctaWidth}" height="${ctaHeight}" rx="${ctaHeight / 2}" fill="${accent}" />
      <text x="${margin + ctaWidth / 2}" y="${ctaY + ctaHeight * 0.65}" text-anchor="middle"
        font-family="${fontFamily}" font-weight="700" font-size="${headlineSize * 0.46}"
        fill="${panel}">${escapeXml(ctaLabel)}</text>
    </svg>
  `;
}

/**
 * Composites the style-driven background with the untouched product photo
 * resized to fit — never cropped in a way that alters proportions, per
 * AGENTS.md #3/#15. This is the piece an AI image provider (see
 * GeminiImageProvider) replaces with a generated scene; everything else in
 * this file — the text overlay — stays identical either way, so copy
 * accuracy never depends on which image backend produced the background.
 */
export async function composeLocalBackground(
  input: Pick<RenderCreativeInput, "formatId" | "styleId" | "productImageBuffer" | "variantSeed">
): Promise<Buffer> {
  const format = getFormat(input.formatId);
  const style = getStyle(input.styleId);
  const { width, height } = format;
  const variant = input.variantSeed % 2;

  const layers: OverlayOptions[] = [
    { input: Buffer.from(backgroundLayer(width, height, style.palette)) },
  ];

  if (input.productImageBuffer) {
    // Stage rect: the photo owns the upper portion of the canvas so the
    // bottom scrim + copy never overlap it awkwardly.
    const stageTop = variant === 0 ? Math.round(height * 0.04) : Math.round(height * 0.0);
    const stageHeight = Math.round(height * (variant === 0 ? 0.62 : 0.7));
    const stageWidth = width - Math.round(width * 0.1);
    const stageLeft = Math.round((width - stageWidth) / 2);

    const resizedProduct = await sharp(input.productImageBuffer)
      .resize(stageWidth, stageHeight, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    layers.push({ input: resizedProduct, left: stageLeft, top: stageTop });
  }

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite(layers)
    .png()
    .toBuffer();
}

export type CopyOverlayInput = {
  formatId: string;
  styleId: string;
  conceptType: string;
  headline: string;
  supportingLine: string | null;
  priceDisplay: string | null;
  ctaLabel: string;
  logoBuffer: Buffer | null;
  /** Whether the base image already shows the product — widens the bottom
   * scrim when it doesn't, since there's no photo detail to protect. */
  hasProductPhoto: boolean;
};

/**
 * Applies the legibility scrim, the copy (as vector text), and the logo on
 * top of any base image (full canvas, any source). Used by both the local
 * compositor and any AI image provider so copy is always rendered exactly
 * as written — no generative model is ever asked to draw the headline,
 * price, or CTA (AGENTS.md #7).
 */
export async function applyScrimAndCopy(
  baseImageBuffer: Buffer,
  input: CopyOverlayInput
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const format = getFormat(input.formatId);
  const style = getStyle(input.styleId);
  const { width, height } = format;

  const layers: OverlayOptions[] = [];

  const scrimRatio = input.hasProductPhoto ? 0.46 : 0.6;
  layers.push({ input: Buffer.from(scrimLayer(width, height, scrimRatio)) });

  layers.push({
    input: Buffer.from(
      textLayer({
        width,
        height,
        headline: input.headline,
        supportingLine: input.supportingLine,
        priceDisplay: input.priceDisplay,
        ctaLabel: input.ctaLabel,
        conceptType: input.conceptType,
        accent: style.palette.accent,
        textColor: style.palette.text,
        panel: style.palette.panel,
      })
    ),
  });

  if (input.logoBuffer) {
    const logoSize = Math.round(width * 0.12);
    const resizedLogo = await sharp(input.logoBuffer)
      .resize(logoSize, logoSize, { fit: "inside" })
      .png()
      .toBuffer();
    layers.push({
      input: resizedLogo,
      left: Math.round(width * 0.06),
      top: Math.round(width * 0.06),
    });
  }

  const buffer = await sharp(baseImageBuffer)
    // Base images from an AI provider won't be exactly on-format — force
    // the final canvas to the exact target size every time.
    .resize(width, height, { fit: "cover" })
    .composite(layers)
    .png()
    .toBuffer();

  return { buffer, width, height };
}

/**
 * Renders one creative entirely locally: style-driven background + the
 * untouched product photo + scrim + copy. Pure image compositing, no
 * external API, so the MVP is fully functional without any provider key.
 */
export async function renderCreative(
  input: RenderCreativeInput
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const base = await composeLocalBackground(input);
  return applyScrimAndCopy(base, {
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
