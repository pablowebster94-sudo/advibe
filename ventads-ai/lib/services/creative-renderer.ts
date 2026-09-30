import "@/lib/fonts";
import sharp, { type OverlayOptions } from "sharp";
import { getFormat } from "@/lib/catalog/formats";
import { escapeXml, wrapText } from "@/lib/services/svg";

export type RenderCreativeInput = {
  formatId: string;
  styleId: string;
  conceptType: string;
  headline: string;
  supportingLine: string | null;
  priceDisplay: string | null;
  offerDisplay?: string | null;
  ctaLabel: string;
  productImageBuffer: Buffer | null;
  logoBuffer: Buffer | null;
  variantSeed: number;
  highlights?: string[];
  isVehicle?: boolean;
  objective?: string | null;
};

const FONT = "'DejaVu Sans', sans-serif";
const BOLD_EM = 0.62;
const REGULAR_EM = 0.54;

type Layout = {
  heroRatio: number;
  margin: number;
  topSafe: number;
  bottomSafe: number;
  headlineSize: number;
  headlineMaxLines: number;
  supportingSize: number;
  ctaHeight: number;
};

function layoutFor(formatId: string): Layout {
  if (formatId === "STORY_9_16") {
    return { heroRatio: 0.55, margin: 72, topSafe: 76, bottomSafe: 88, headlineSize: 82, headlineMaxLines: 3, supportingSize: 34, ctaHeight: 116 };
  }
  if (formatId === "PORTRAIT_4_5") {
    return { heroRatio: 0.61, margin: 64, topSafe: 48, bottomSafe: 56, headlineSize: 72, headlineMaxLines: 3, supportingSize: 32, ctaHeight: 100 };
  }
  return { heroRatio: 0.62, margin: 60, topSafe: 44, bottomSafe: 48, headlineSize: 66, headlineMaxLines: 2, supportingSize: 30, ctaHeight: 92 };
}

type Theme = {
  background: string;
  panel: string;
  ink: string;
  muted: string;
  accent: string;
  accentInk: string;
  dark: boolean;
};

function themeFor(styleId: string): Theme {
  switch (styleId) {
    case "PREMIUM":
      return { background: "#0f1110", panel: "#171a18", ink: "#fff", muted: "#d5d9d6", accent: "#d7b35a", accentInk: "#17130a", dark: true };
    case "URGENCIA":
      return { background: "#fff7f5", panel: "#fff", ink: "#171313", muted: "#665c5c", accent: "#e53935", accentInk: "#fff", dark: false };
    case "LIFESTYLE":
      return { background: "#f6eee4", panel: "#fffaf4", ink: "#241d17", muted: "#6e6258", accent: "#c96f3d", accentInk: "#fff", dark: false };
    case "MODERNO":
      return { background: "#eef4f3", panel: "#fff", ink: "#10211f", muted: "#58706c", accent: "#0f8f83", accentInk: "#fff", dark: false };
    case "ELEGANTE":
      return { background: "#f2f0eb", panel: "#fff", ink: "#1c1c1c", muted: "#66635e", accent: "#303030", accentInk: "#fff", dark: false };
    case "MINIMALISTA":
      return { background: "#f5f5f2", panel: "#fff", ink: "#111", muted: "#666", accent: "#111", accentInk: "#fff", dark: false };
    case "DEPORTIVO":
      return { background: "#edf5f7", panel: "#fff", ink: "#0d1c22", muted: "#55707a", accent: "#00a9c0", accentInk: "#06252c", dark: false };
    case "COMERCIAL":
    default:
      return { background: "#f3f4f1", panel: "#fff", ink: "#101514", muted: "#5f6865", accent: "#f4a900", accentInk: "#17120a", dark: false };
  }
}

function textWidth(text: string, size: number, em: number) {
  return text.length * size * em;
}

function fitHeadline(text: string, baseSize: number, maxWidth: number, maxLines: number) {
  const at = (size: number) => wrapText(text, Math.max(6, Math.floor(maxWidth / (size * BOLD_EM))), maxLines);
  let size = baseSize;
  let lines = at(size);
  while (lines.length >= maxLines && size > baseSize * 0.7) {
    size -= 2;
    lines = at(size);
  }
  return { size, lines };
}

function badgeSvg(text: string, x: number, y: number, height: number, theme: Theme) {
  const size = Math.round(height * 0.34);
  const width = Math.max(Math.round(textWidth(text, size, REGULAR_EM) + height * 1.5), Math.round(height * 3.2));
  return {
    width,
    svg: `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${theme.accent}"/>
      <text x="${x + width / 2}" y="${y + height * 0.66}" text-anchor="middle" font-family="${FONT}" font-weight="800"
        font-size="${size}" letter-spacing="1.2" fill="${theme.accentInk}">${escapeXml(text.toUpperCase())}</text>`,
  };
}

function contentLayer(input: {
  formatId: string;
  width: number;
  height: number;
  headline: string;
  supportingLine: string | null;
  priceDisplay: string | null;
  offerDisplay?: string | null;
  ctaLabel: string;
  highlights: string[];
  theme: Theme;
}): string {
  const L = layoutFor(input.formatId);
  const theme = input.theme;
  const panelTop = Math.round(input.height * L.heroRatio);
  const contentWidth = input.width - L.margin * 2;
  const parts: string[] = [
    `<rect x="0" y="${panelTop}" width="${input.width}" height="${input.height - panelTop}" fill="${theme.panel}"/>`,
  ];

  const offer = input.offerDisplay?.trim() || null;
  const price = input.priceDisplay?.trim() || null;

  let y = panelTop + Math.round(L.headlineSize * 0.7);

  if (offer) {
    const badge = badgeSvg(offer, L.margin, y, Math.round(L.headlineSize * 0.62), theme);
    parts.push(badge.svg);
    y += Math.round(L.headlineSize * 0.92);
  }

  const fitted = fitHeadline(input.headline, L.headlineSize, contentWidth, L.headlineMaxLines);
  const lineHeight = Math.round(fitted.size * 1.04);
  for (const [index, line] of fitted.lines.entries()) {
    parts.push(
      `<text x="${L.margin}" y="${y + (index + 0.82) * lineHeight}" font-family="${FONT}" font-weight="800"
        font-size="${fitted.size}" fill="${theme.ink}">${escapeXml(line)}</text>`
    );
  }
  y += fitted.lines.length * lineHeight + Math.round(fitted.size * 0.16);

  const supporting = input.supportingLine?.trim();
  if (
    supporting &&
    supporting.toLowerCase() !== input.headline.trim().toLowerCase() &&
    supporting.toLowerCase() !== price?.toLowerCase() &&
    supporting.toLowerCase() !== offer?.toLowerCase()
  ) {
    const lines = wrapText(supporting, Math.max(8, Math.floor(contentWidth / (L.supportingSize * REGULAR_EM))), 2);
    for (const line of lines) {
      parts.push(
        `<text x="${L.margin}" y="${y + L.supportingSize * 0.82}" font-family="${FONT}"
          font-size="${L.supportingSize}" fill="${theme.muted}">${escapeXml(line)}</text>`
      );
      y += Math.round(L.supportingSize * 1.12);
    }
    y += 12;
  }

  const availableForChips = input.height - L.bottomSafe - L.ctaHeight - 28 - y;
  if (availableForChips > 55 && input.highlights.length) {
    const hs = Math.round(L.supportingSize * 0.72);
    let x = L.margin;
    for (const item of input.highlights.slice(0, 2)) {
      const label = wrapText(item.trim(), Math.max(8, Math.floor((contentWidth * 0.46) / (hs * REGULAR_EM))), 1)[0];
      const w = Math.min(Math.round(contentWidth * 0.46), Math.round(textWidth(label, hs, REGULAR_EM) + hs * 2));
      parts.push(
        `<rect x="${x}" y="${y}" width="${w}" height="${Math.round(hs * 1.75)}" rx="${Math.round(hs * 0.9)}"
          fill="${theme.accent}" fill-opacity="0.10"/>
         <circle cx="${x + hs * 0.72}" cy="${y + hs * 0.88}" r="${hs * 0.17}" fill="${theme.accent}"/>
         <text x="${x + hs * 1.2}" y="${y + hs * 1.13}" font-family="${FONT}" font-size="${hs}" fill="${theme.muted}">${escapeXml(label)}</text>`
      );
      x += w + Math.round(hs * 0.6);
    }
  }

  const ctaY = input.height - L.bottomSafe - L.ctaHeight;
  const ctaWidth = Math.min(
    Math.round(contentWidth * 0.7),
    Math.max(Math.round(contentWidth * 0.44), Math.round(textWidth(input.ctaLabel, 30, BOLD_EM) + 72))
  );
  parts.push(
    `<rect x="${L.margin}" y="${ctaY}" width="${ctaWidth}" height="${L.ctaHeight}" rx="${L.ctaHeight / 2}" fill="${theme.accent}"/>
     <text x="${L.margin + ctaWidth / 2}" y="${ctaY + L.ctaHeight / 2 + 11}" text-anchor="middle"
       font-family="${FONT}" font-weight="800" font-size="30" fill="${theme.accentInk}">${escapeXml(input.ctaLabel)}</text>`
  );

  if (price && !offer) {
    const priceSize = Math.min(Math.round(L.headlineSize * 0.7), Math.floor(contentWidth / Math.max(8, price.length * BOLD_EM)));
    parts.push(
      `<text x="${input.width - L.margin}" y="${ctaY + priceSize}" text-anchor="end"
        font-family="${FONT}" font-weight="800" font-size="${priceSize}" fill="${theme.accent}">${escapeXml(price)}</text>`
    );
  }

  return `<svg width="${input.width}" height="${input.height}" xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
}

function heroFadeSvg(width: number, height: number, dark: boolean) {
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.78" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity="${dark ? "0.18" : "0.06"}"/>
      </linearGradient></defs>
      <rect width="${width}" height="${height}" fill="url(#f)"/>
    </svg>`
  );
}

export async function composeLocalBackground(
  input: Pick<RenderCreativeInput, "formatId" | "styleId" | "productImageBuffer" | "variantSeed">
): Promise<Buffer> {
  const format = getFormat(input.formatId);
  const L = layoutFor(format.id);
  const theme = themeFor(input.styleId);
  const { width, height } = format;
  const heroHeight = Math.round(height * L.heroRatio);

  const base = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${theme.background}"/>
      <rect y="${heroHeight}" width="${width}" height="${height - heroHeight}" fill="${theme.panel}"/>
    </svg>`
  );

  if (!input.productImageBuffer) return sharp(base).png().toBuffer();

  const hero = await sharp(input.productImageBuffer)
    .rotate()
    .resize(width, heroHeight, {
      fit: "cover",
      position: input.variantSeed % 2 === 0 ? "attention" : "centre",
    })
    .jpeg({ quality: 94 })
    .toBuffer();

  return sharp(base)
    .composite([
      { input: hero, left: 0, top: 0 },
      { input: heroFadeSvg(width, heroHeight, theme.dark), left: 0, top: 0 },
    ])
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
  offerDisplay?: string | null;
  ctaLabel: string;
  logoBuffer: Buffer | null;
  highlights?: string[];
  hasProductPhoto?: boolean;
};

export async function applyScrimAndCopy(
  baseImageBuffer: Buffer,
  input: CopyOverlayInput
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const format = getFormat(input.formatId);
  const L = layoutFor(format.id);
  const theme = themeFor(input.styleId);
  const { width, height } = format;

  const layers: OverlayOptions[] = [
    {
      input: Buffer.from(
        contentLayer({
          formatId: format.id,
          width,
          height,
          headline: input.headline,
          supportingLine: input.supportingLine,
          priceDisplay: input.priceDisplay,
          offerDisplay: input.offerDisplay,
          ctaLabel: input.ctaLabel,
          highlights: input.highlights ?? [],
          theme,
        })
      ),
    },
  ];

  if (input.logoBuffer) {
    const boxW = Math.round(width * 0.22);
    const boxH = Math.round(width * 0.085);
    const pad = Math.round(boxH * 0.14);
    const logo = await sharp(input.logoBuffer)
      .resize(boxW - pad * 2, boxH - pad * 2, { fit: "inside" })
      .png()
      .toBuffer();
    const meta = await sharp(logo).metadata();
    const plateW = (meta.width ?? boxW - pad * 2) + pad * 2;
    const plateH = (meta.height ?? boxH - pad * 2) + pad * 2;
    layers.push(
      {
        input: Buffer.from(
          `<svg width="${plateW}" height="${plateH}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${plateW}" height="${plateH}" rx="${Math.round(plateH * 0.24)}" fill="#fff" fill-opacity="0.94"/>
          </svg>`
        ),
        left: L.margin,
        top: L.topSafe,
      },
      { input: logo, left: L.margin + pad, top: L.topSafe + pad }
    );
  }

  const buffer = await sharp(baseImageBuffer)
    .resize(width, height, { fit: "cover", position: "attention" })
    .composite(layers)
    .jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();

  return { buffer, width, height };
}

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
    offerDisplay: input.offerDisplay,
    ctaLabel: input.ctaLabel,
    logoBuffer: input.logoBuffer,
    highlights: input.highlights,
  });
}
