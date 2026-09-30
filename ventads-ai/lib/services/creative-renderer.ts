// Must run before sharp renders any text (points fontconfig at ./fonts).
import "@/lib/fonts";
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
  /** Real promotion/offer, shown with higher visual priority than price when present. */
  offerDisplay?: string | null;
  ctaLabel: string;
  productImageBuffer: Buffer | null;
  logoBuffer: Buffer | null;
  /** Cycles the layout/scene so repeated regenerations look meaningfully different. */
  variantSeed: number;
  /** Real benefits/features from the product record (never invented), max 3 shown. */
  highlights?: string[];
  /** Whether the product is a vehicle (stricter art direction in AI providers). */
  isVehicle?: boolean;
  /** Campaign objective id (VENDER, MENSAJES, ...), tone only. */
  objective?: string | null;
};

const FONT = "'DejaVu Sans', sans-serif";
// Average advance width of DejaVu Sans glyphs, in em. SVG <text> has no
// wrapping or measuring, so layout sizes text from these (conservatively).
const BOLD_EM = 0.62;
const REGULAR_EM = 0.56;

type Layout = {
  /** Clear zone at the top (story UI) and bottom (story reply bar). */
  topSafe: number;
  bottomSafe: number;
  margin: number;
  headlineSize: number;
  headlineMaxLines: number;
  supportingSize: number;
  supportingMaxLines: number;
  chipSize: number;
  chipsVertical: boolean;
  ctaHeight: number;
  /** Square: price and CTA share one row to save height. */
  priceBesideCta: boolean;
  /** Where the photo sits when the local compositor lays it out. */
  heroTop: number;
  heroBottom: number;
};

function layoutFor(formatId: string, width: number, height: number): Layout {
  switch (formatId) {
    case "STORY_9_16":
      return {
        topSafe: Math.round(height * 0.1),
        bottomSafe: Math.round(height * 0.13),
        margin: 72,
        headlineSize: 84,
        headlineMaxLines: 3,
        supportingSize: 36,
        supportingMaxLines: 2,
        chipSize: 32,
        chipsVertical: true,
        ctaHeight: 120,
        priceBesideCta: false,
        heroTop: Math.round(height * 0.17),
        heroBottom: Math.round(height * 0.62),
      };
    case "PORTRAIT_4_5":
      return {
        topSafe: 52,
        bottomSafe: 60,
        margin: 64,
        headlineSize: 74,
        headlineMaxLines: 2,
        supportingSize: 33,
        supportingMaxLines: 1,
        chipSize: 29,
        chipsVertical: false,
        ctaHeight: 100,
        priceBesideCta: false,
        heroTop: 0,
        heroBottom: Math.round(height * 0.66),
      };
    default:
      return {
        topSafe: 48,
        bottomSafe: 52,
        margin: 60,
        headlineSize: 66,
        headlineMaxLines: 2,
        supportingSize: 30,
        supportingMaxLines: 1,
        chipSize: 27,
        chipsVertical: false,
        ctaHeight: 92,
        priceBesideCta: true,
        heroTop: 0,
        heroBottom: Math.round(height * 0.7),
      };
  }
}

/** Per-angle treatment, so the three concepts read differently even on the same photo. */
function conceptTreatment(conceptType: string) {
  switch (conceptType) {
    case "VENTA_DIRECTA":
      return { badge: "EN VENTA", priceScale: 1.3, scrim: 0.92, ctaStyle: "solid" as const, accentRule: false };
    case "OFERTA":
      return { badge: "OFERTA", priceScale: 1.3, scrim: 0.92, ctaStyle: "solid" as const, accentRule: false };
    case "CARACTERISTICA":
      return { badge: null, priceScale: 0.8, scrim: 0.88, ctaStyle: "solid" as const, accentRule: true };
    case "ASPIRACIONAL":
      return { badge: null, priceScale: 0.6, scrim: 0.8, ctaStyle: "light" as const, accentRule: false };
    default:
      return { badge: null, priceScale: 0.9, scrim: 0.88, ctaStyle: "solid" as const, accentRule: false };
  }
}

function textWidth(text: string, size: number, em: number) {
  return text.length * size * em;
}

/**
 * Headline size: keeps the base size unless shrinking (down to 78%) saves a
 * line — avoids a lone word on its own line — and never truncates while a
 * smaller size (down to 70%) would fit everything.
 */
function fitHeadline(text: string, baseSize: number, maxWidth: number, maxLines: number) {
  const linesAt = (size: number) =>
    wrapText(text, Math.max(6, Math.floor(maxWidth / (size * BOLD_EM))), maxLines);
  const truncated = (lines: string[]) => Boolean(lines[lines.length - 1]?.endsWith("…"));
  const base = linesAt(baseSize);
  for (let size = baseSize - 2; size >= Math.round(baseSize * 0.7); size -= 2) {
    const lines = linesAt(size);
    if (truncated(base) ? !truncated(lines) : size >= baseSize * 0.78 && lines.length < base.length) {
      return { size, lines };
    }
  }
  return { size: baseSize, lines: base };
}

function scrimSvg(width: number, height: number, blockTop: number, strength: number, topShade: number) {
  const fadeStart = Math.max(0, blockTop - Math.round(height * 0.12));
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#000" stop-opacity="0" />
          <stop offset="0.35" stop-color="#000" stop-opacity="${(strength * 0.72).toFixed(2)}" />
          <stop offset="1" stop-color="#000" stop-opacity="${strength.toFixed(2)}" />
        </linearGradient>
        <linearGradient id="t" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#000" stop-opacity="0.55" />
          <stop offset="1" stop-color="#000" stop-opacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="${fadeStart}" width="${width}" height="${height - fadeStart}" fill="url(#b)" />
      <rect x="0" y="0" width="${width}" height="${topShade}" fill="url(#t)" />
    </svg>`;
}

type CopyLayer = { svg: string; blockTop: number };

function copyLayer(params: {
  formatId: string;
  width: number;
  height: number;
  conceptType: string;
  headline: string;
  supportingLine: string | null;
  priceDisplay: string | null;
  offerDisplay?: string | null;
  ctaLabel: string;
  highlights: string[];
  hasLogo: boolean;
  palette: { accent: string; text: string; panel: string };
}): CopyLayer {
  const { width, height, palette } = params;
  const L = layoutFor(params.formatId, width, height);
  const T = conceptTreatment(params.conceptType);
  const content = width - L.margin * 2;
  const parts: string[] = [];
  const ink = "#ffffff"; // copy sits on the dark scrim, always light

  // ---- top row: logo plate (drawn separately as a bitmap) and badge
  if (T.badge) {
    const size = Math.round(L.headlineSize * 0.4);
    const w = Math.round(textWidth(T.badge, size, 0.72) + size * 2.2);
    const h = Math.round(size * 2.1);
    const x = params.hasLogo ? width - L.margin - w : L.margin;
    parts.push(`
      <rect x="${x}" y="${L.topSafe}" width="${w}" height="${h}" rx="${h / 2}" fill="${palette.accent}" />
      <text x="${x + w / 2}" y="${L.topSafe + h * 0.66}" text-anchor="middle" font-family="${FONT}"
        font-weight="700" font-size="${size}" letter-spacing="3" fill="${palette.panel}">${escapeXml(T.badge)}</text>`);
  }

  // ---- bottom block, laid out bottom-up from the safe zone
  let y = height - L.bottomSafe;

  // CTA (and, in square, the price beside it)
  const ctaSize = Math.round(L.ctaHeight * 0.36);
  const ctaY = y - L.ctaHeight;
  const price = params.priceDisplay;
  const offer = params.offerDisplay?.trim() || null;
  const commercialHighlight = offer || price;
  let priceDrawnInCtaRow = false;
  let ctaW = content;
  let ctaX = L.margin;
  if (L.priceBesideCta) {
    ctaW = Math.min(content * 0.52, Math.round(textWidth(params.ctaLabel, ctaSize, BOLD_EM) + ctaSize * 3));
    ctaX = width - L.margin - ctaW;
    if (commercialHighlight) {
      const pSize = Math.min(Math.round(L.headlineSize * (offer ? 0.72 : 1.05) * Math.max(T.priceScale, 0.75)), Math.floor((content - ctaW - 24) / (commercialHighlight.length * BOLD_EM)));
      parts.push(`<text x="${L.margin}" y="${ctaY + L.ctaHeight / 2 + pSize * 0.36}" font-family="${FONT}" font-weight="700"
        font-size="${pSize}" fill="${palette.accent}">${escapeXml(commercialHighlight)}</text>`);
      priceDrawnInCtaRow = true;
    }
  }
  const ctaFill = T.ctaStyle === "solid" ? palette.accent : "#ffffff";
  const ctaInk = T.ctaStyle === "solid" ? palette.panel : "#111111";
  parts.push(`
    <rect x="${ctaX}" y="${ctaY}" width="${ctaW}" height="${L.ctaHeight}" rx="${L.ctaHeight / 2}" fill="${ctaFill}" />
    <text x="${ctaX + ctaW / 2}" y="${ctaY + L.ctaHeight / 2 + ctaSize * 0.36}" text-anchor="middle" font-family="${FONT}"
      font-weight="700" font-size="${ctaSize}" fill="${ctaInk}">${escapeXml(params.ctaLabel)}</text>`);
  y = ctaY - Math.round(L.ctaHeight * 0.34);

  // Highlight chips: only real data, max 3 (2 in square)
  const maxChips = params.formatId === "SQUARE_1_1" ? 2 : 3;
  const chips = params.highlights.slice(0, maxChips);
  if (chips.length) {
    const cs = L.chipSize;
    const ch = Math.round(cs * 1.75);
    const gap = Math.round(cs * 0.45);
    const chipText = (text: string) => wrapText(text, Math.max(8, Math.floor((content - cs * 2.4) / (cs * REGULAR_EM))), 1)[0];
    const chipSvg = (text: string, x: number, cy: number, w: number) => `
      <rect x="${x}" y="${cy}" width="${w}" height="${ch}" rx="${ch / 2}" fill="#ffffff" fill-opacity="0.12"
        stroke="${palette.accent}" stroke-opacity="0.9" stroke-width="2" />
      <circle cx="${x + cs * 0.95}" cy="${cy + ch / 2}" r="${cs * 0.22}" fill="${palette.accent}" />
      <text x="${x + cs * 1.55}" y="${cy + ch / 2 + cs * 0.36}" font-family="${FONT}" font-size="${cs}" fill="${ink}">${escapeXml(text)}</text>`;
    if (L.chipsVertical) {
      for (const text of [...chips].reverse()) {
        const label = chipText(text);
        const w = Math.min(content, Math.round(textWidth(label, cs, REGULAR_EM) + cs * 2.4));
        y -= ch;
        parts.push(chipSvg(label, L.margin, y, w));
        y -= gap;
      }
    } else {
      // Horizontal rows, wrapping to a second row when needed.
      const rows: { label: string; w: number }[][] = [[]];
      let rowWidth = 0;
      for (const text of chips) {
        const label = chipText(text);
        const w = Math.min(content, Math.round(textWidth(label, cs, REGULAR_EM) + cs * 2.4));
        if (rowWidth + w > content && rows[rows.length - 1].length) {
          if (rows.length === 2) break;
          rows.push([]);
          rowWidth = 0;
        }
        rows[rows.length - 1].push({ label, w });
        rowWidth += w + gap;
      }
      for (const row of [...rows].reverse()) {
        y -= ch;
        let x = L.margin;
        for (const chip of row) {
          parts.push(chipSvg(chip.label, x, y, chip.w));
          x += chip.w + gap;
        }
        y -= gap;
      }
    }
    y -= Math.round(gap * 0.6);
  }

  // Supporting line
  const supporting = params.supportingLine?.trim();
  // Skip a supporting line that only repeats the price or the headline.
  if (
    supporting &&
    supporting !== price &&
    !params.headline.toLowerCase().includes(supporting.toLowerCase())
  ) {
    const s = L.supportingSize;
    const lines = wrapText(supporting, Math.max(8, Math.floor(content / (s * REGULAR_EM))), L.supportingMaxLines);
    const lh = s * 1.25;
    for (let i = lines.length - 1; i >= 0; i--) {
      parts.push(`<text x="${L.margin}" y="${y - s * 0.25}" font-family="${FONT}" font-size="${s}" fill="${ink}" fill-opacity="0.88">${escapeXml(lines[i])}</text>`);
      y -= lh;
    }
    y -= Math.round(s * 0.35);
  }

  // Headline (auto-fitted, never truncated when a smaller size fits)
  const fitted = fitHeadline(params.headline, L.headlineSize, content, L.headlineMaxLines);
  const hl = fitted.size * 1.1;
  const headlineTop = y - fitted.lines.length * hl;
  parts.push(`<text font-family="${FONT}" font-weight="700" font-size="${fitted.size}" fill="${ink}">${fitted.lines
    .map((line, i) => `<tspan x="${L.margin}" y="${headlineTop + (i + 0.82) * hl}">${escapeXml(line)}</tspan>`)
    .join("")}</text>`);
  y = headlineTop - Math.round(fitted.size * 0.3);

  if (T.accentRule) {
    parts.push(`<rect x="${L.margin}" y="${y - 8}" width="${Math.round(fitted.size * 1.4)}" height="8" rx="4" fill="${palette.accent}" />`);
    y -= Math.round(fitted.size * 0.45);
  }

  // Price above the headline (portrait formats)
  if (commercialHighlight && !priceDrawnInCtaRow) {
    const pSize = Math.min(Math.round(L.headlineSize * (offer ? 0.78 : T.priceScale)), Math.floor(content / (commercialHighlight.length * BOLD_EM)));
    if (T.ctaStyle === "light") {
      // Aspirational: understated price pill
      const w = Math.round(textWidth(price, pSize, BOLD_EM) + pSize * 1.4);
      const h = Math.round(pSize * 1.6);
      parts.push(`
        <rect x="${L.margin}" y="${y - h}" width="${w}" height="${h}" rx="${h / 2}" fill="none" stroke="${palette.accent}" stroke-width="3" />
        <text x="${L.margin + pSize * 0.7}" y="${y - h / 2 + pSize * 0.36}" font-family="${FONT}" font-weight="700" font-size="${pSize}" fill="${palette.accent}">${escapeXml(commercialHighlight)}</text>`);
      y -= h + Math.round(pSize * 0.4);
    } else {
      parts.push(`<text x="${L.margin}" y="${y}" font-family="${FONT}" font-weight="700" font-size="${pSize}" fill="${palette.accent}">${escapeXml(price)}</text>`);
      y -= Math.round(pSize * 1.05);
    }
  }

  return {
    blockTop: y,
    svg: `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`,
  };
}

/** Top-to-bottom alpha fade so a photo melts into the backdrop instead of ending in a hard edge. */
function fadeMask(width: number, height: number, fadeTop: boolean) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="m" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="${fadeTop ? 0 : 1}" />
        <stop offset="${fadeTop ? 0.12 : 0}" stop-color="#fff" stop-opacity="1" />
        <stop offset="0.78" stop-color="#fff" stop-opacity="1" />
        <stop offset="1" stop-color="#fff" stop-opacity="0" />
      </linearGradient></defs>
      <rect width="${width}" height="${height}" fill="url(#m)" />
    </svg>`);
}

/**
 * Local (no AI) key visual: the untouched product photo, full-bleed across
 * the width and as large as the format allows, over a blurred, darkened
 * extension of the same photo — the product owns the canvas instead of
 * sitting in a box on a flat gradient. Never crops the photo horizontally
 * (AGENTS.md #3/#15: proportions are preserved; only fit/position change).
 */
export async function composeLocalBackground(
  input: Pick<RenderCreativeInput, "formatId" | "styleId" | "productImageBuffer" | "variantSeed">
): Promise<Buffer> {
  const format = getFormat(input.formatId);
  const style = getStyle(input.styleId);
  const { width, height } = format;
  const L = layoutFor(format.id, width, height);

  const gradient = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${style.palette.panel}" />
          <stop offset="1" stop-color="${style.palette.background}" />
        </linearGradient>
        <radialGradient id="glow" cx="${input.variantSeed % 2 ? "25%" : "75%"}" cy="30%" r="70%">
          <stop offset="0" stop-color="${style.palette.accent}" stop-opacity="0.25" />
          <stop offset="1" stop-color="${style.palette.accent}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)" />
      <rect width="${width}" height="${height}" fill="url(#glow)" />
    </svg>`);

  if (!input.productImageBuffer) {
    return sharp(gradient).png().toBuffer();
  }

  const photo = sharp(input.productImageBuffer).rotate();
  const meta = await photo.metadata();
  const ratio = (meta.width ?? width) / (meta.height ?? height);

  // Backdrop: the same photo, cover-filled, heavily blurred and darkened.
  const backdrop = await sharp(input.productImageBuffer)
    .rotate()
    .resize(width, height, { fit: "cover" })
    .blur(40)
    .modulate({ brightness: 0.45, saturation: 0.9 })
    .png()
    .toBuffer();

  // Hero: full width; if taller than the hero zone, crop top/bottom only.
  const zone = L.heroBottom - L.heroTop;
  const naturalH = Math.round(width / ratio);
  const heroH = Math.min(naturalH, zone);
  const hero = await sharp(input.productImageBuffer)
    .rotate()
    .resize(width, heroH, { fit: "cover", position: "centre" })
    .ensureAlpha()
    .composite([{ input: fadeMask(width, heroH, L.heroTop > 0), blend: "dest-in" }])
    .png()
    .toBuffer();
  // Regenerations nudge the hero within its zone for a different framing.
  const slack = zone - heroH;
  const offset = slack > 0 ? Math.round(slack * [0.35, 0.1, 0.6][Math.abs(input.variantSeed) % 3]) : 0;

  return sharp(backdrop)
    .composite([
      { input: gradient, blend: "soft-light" },
      { input: hero, left: 0, top: L.heroTop + offset },
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
  ctaLabel: string;
  logoBuffer: Buffer | null;
  highlights?: string[];
  /** Kept for callers; the overlay adapts to the copy block instead. */
  hasProductPhoto?: boolean;
};

/**
 * Lays the exact copy (headline, price, supporting line, real highlights,
 * CTA, badge) and the logo over any base image: the local key visual or an
 * AI-generated scene. No generative model ever draws this text
 * (AGENTS.md #7), so it is always exactly what the copy engine produced.
 * Output is a high-quality JPEG — photographic creatives are ~10x smaller
 * than PNG, which matters when files are stored in PostgreSQL.
 */
export async function applyScrimAndCopy(
  baseImageBuffer: Buffer,
  input: CopyOverlayInput
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const format = getFormat(input.formatId);
  const style = getStyle(input.styleId);
  const { width, height } = format;
  const L = layoutFor(format.id, width, height);
  const T = conceptTreatment(input.conceptType);

  const copy = copyLayer({
    formatId: format.id,
    width,
    height,
    conceptType: input.conceptType,
    headline: input.headline,
    supportingLine: input.supportingLine,
    priceDisplay: input.priceDisplay,
    offerDisplay: input.offerDisplay,
    ctaLabel: input.ctaLabel,
    highlights: input.highlights ?? [],
    hasLogo: Boolean(input.logoBuffer),
    palette: style.palette,
  });

  const layers: OverlayOptions[] = [
    { input: Buffer.from(scrimSvg(width, height, copy.blockTop, T.scrim, L.topSafe + 180)) },
    { input: Buffer.from(copy.svg) },
  ];

  if (input.logoBuffer) {
    // Logo on a light plate so dark and transparent logos stay legible on any scene.
    const boxW = Math.round(width * 0.2);
    const boxH = Math.round(width * 0.085);
    const pad = Math.round(boxH * 0.16);
    const logo = await sharp(input.logoBuffer)
      .resize(boxW - pad * 2, boxH - pad * 2, { fit: "inside" })
      .png()
      .toBuffer();
    const logoMeta = await sharp(logo).metadata();
    const plateW = (logoMeta.width ?? boxW) + pad * 2;
    const plateH = (logoMeta.height ?? boxH) + pad * 2;
    layers.push({
      input: Buffer.from(`<svg width="${plateW}" height="${plateH}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${plateW}" height="${plateH}" rx="${Math.round(plateH * 0.22)}" fill="#ffffff" fill-opacity="0.94" /></svg>`),
      left: L.margin,
      top: L.topSafe,
    });
    layers.push({ input: logo, left: L.margin + pad, top: L.topSafe + pad });
  }

  const buffer = await sharp(baseImageBuffer)
    // AI scenes are not exactly on-format: force the exact target canvas.
    .resize(width, height, { fit: "cover", position: "attention" })
    .composite(layers)
    .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();

  return { buffer, width, height };
}

/**
 * Renders one creative entirely locally: key visual from the real photo +
 * exact copy overlay. Pure image compositing, no external API, so the app
 * is fully functional without any provider key and as a fallback.
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
    highlights: input.highlights,
  });
}
