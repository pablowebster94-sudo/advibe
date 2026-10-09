import "@/lib/fonts";
import sharp, { type OverlayOptions } from "sharp";
import { escapeXml } from "@/lib/services/svg";
import { iconFor, iconSvg } from "@/lib/templates/icons";
import type { IconName } from "@/lib/templates/icon-shapes";
import { computeLayout } from "@/lib/templates/layout";
import { FONT_ROLES, pangoMeasurer } from "@/lib/templates/measure";
import type { AdContent, Block, FontRole, Layout, Measurer, Rect, TemplateBrand, TextLines } from "@/lib/templates/types";

/**
 * Draws the final ad: scene (original photo, or an AI scene later) +
 * deterministic design layer (logo, type, icons, promotions, CTA, footer).
 * Pure function of its inputs: same content, brand and scene → same bytes.
 */

type Palette = {
  primary: string;
  primaryDark: string;
  accent: string;
  onPrimary: string;
  ink: string;
  muted: string;
  surface: string;
};

function hexToRgb(hex: string): [number, number, number] {
  const clean = /^#?([0-9a-f]{6})$/i.exec(hex.trim())?.[1] ?? "333333";
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16)) as [number, number, number];
}

function rgbToHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
}

function shade(hex: string, amount: number) {
  return rgbToHex(hexToRgb(hex).map((v) => v * (1 - amount)) as [number, number, number]);
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function paletteFor(brand: TemplateBrand): Palette {
  const ink = "#2a1f17";
  return {
    primary: brand.primary,
    primaryDark: shade(brand.primary, 0.32),
    accent: brand.accent,
    onPrimary: luminance(brand.primary) > 0.45 ? ink : "#ffffff",
    ink,
    muted: "#6d5f52",
    surface: "#fffaf2",
  };
}

// ---------------------------------------------------------------- svg helpers

function textSvg(
  t: TextLines,
  role: FontRole,
  x: number,
  top: number,
  color: string,
  anchor: "start" | "middle" | "end" = "middle",
  extra = ""
) {
  const font = FONT_ROLES[role];
  return t.lines
    .map((line, i) => {
      const baseline = Math.round(top + i * t.lineHeight + t.size * 0.8 + (t.lineHeight - t.size) / 2);
      return `<text x="${Math.round(x)}" y="${baseline}" text-anchor="${anchor}" font-family="'${font.family}'" font-weight="${font.weight}" font-size="${t.size}" fill="${color}"${extra}>${escapeXml(line)}</text>`;
    })
    .join("");
}

function height(t: TextLines | null) {
  return t ? t.lines.length * t.lineHeight : 0;
}

async function blockSvg(block: Block, p: Palette, m: Measurer): Promise<string> {
  const cx = (r: Rect) => r.x + r.w / 2;
  switch (block.kind) {
    case "logo":
      return "";
    case "brandName":
      return textSvg(block.text, "sansBold", block.rect.x, block.rect.y, p.primary, "start");
    case "kicker": {
      const textW = await m.width(block.text.lines[0], "displayBold", block.text.size);
      const lineW = Math.min(130, (block.rect.w - textW) / 2 - 18);
      const ly = block.rect.y + block.text.lineHeight / 2 + 2;
      const lines =
        lineW > 24
          ? `<rect x="${cx(block.rect) - textW / 2 - 16 - lineW}" y="${ly}" width="${lineW}" height="3" fill="${p.accent}"/>` +
            `<rect x="${cx(block.rect) + textW / 2 + 16}" y="${ly}" width="${lineW}" height="3" fill="${p.accent}"/>`
          : "";
      return lines + textSvg(block.text, "displayBold", cx(block.rect), block.rect.y, p.ink);
    }
    case "title":
      return textSvg(block.text, "display", cx(block.rect), block.rect.y, p.primary);
    case "subtitle":
      return textSvg(block.text, "sans", cx(block.rect), block.rect.y, p.ink);
    case "priceBadge": {
      const r = block.rect;
      return (
        `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.h / 2}" fill="${p.primary}" stroke="${p.accent}" stroke-width="3"/>` +
        textSvg(block.text, "sansBold", cx(r), r.y + (r.h - height(block.text)) / 2, p.onPrimary)
      );
    }
    case "includes": {
      const r = block.rect;
      const pad = 18;
      const plus = 34;
      const cols = block.cols;
      const colW = (r.w - pad * 2 - plus * (cols - 1)) / cols;
      const labelH = Math.max(...block.items.map((i) => height(i.label)));
      const rowH = block.iconSize + 10 + labelH;
      let out = `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="28" fill="${p.surface}" fill-opacity="0.93" stroke="${p.accent}" stroke-opacity="0.55" stroke-width="2"/>`;
      block.items.forEach((item, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = r.x + pad + col * (colW + plus);
        const y = r.y + pad + row * (rowH + 16);
        out += iconSvg(item.icon as IconName, x + colW / 2 - block.iconSize / 2, y, block.iconSize, p.primary, 1.6);
        out += textSvg(item.label, "sans", x + colW / 2, y + block.iconSize + 10, p.ink);
        if (col < cols - 1) {
          out += `<text x="${x + colW + plus / 2}" y="${y + block.iconSize / 2 + 13}" text-anchor="middle" font-family="'DejaVu Sans'" font-weight="700" font-size="36" fill="${p.accent}">+</text>`;
        }
      });
      return out;
    }
    case "benefits": {
      const r = block.rect;
      const colW = (r.w - 24) / block.items.length;
      let out = `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="26" fill="#ffffff" fill-opacity="0.9"/>`;
      block.items.forEach((item, i) => {
        const x = r.x + 12 + i * colW;
        const d = block.iconSize;
        out += `<circle cx="${x + colW / 2}" cy="${r.y + 14 + d / 2}" r="${d / 2}" fill="${p.primary}" stroke="${p.accent}" stroke-width="3"/>`;
        out += iconSvg(item.icon as IconName, x + colW / 2 - d * 0.29, r.y + 14 + d * 0.21, Math.round(d * 0.58), p.onPrimary, 1.7);
        out += textSvg(item.label, "sansBold", x + colW / 2, r.y + 14 + d + 10, p.primaryDark);
        if (i > 0) out += `<rect x="${x - 1}" y="${r.y + 22}" width="2" height="${r.h - 44}" fill="${p.accent}" fill-opacity="0.6"/>`;
      });
      return out;
    }
    case "promoCards": {
      const r = block.rect;
      const gap = 18;
      const cardW = (r.w - gap * (block.cards.length - 1)) / block.cards.length;
      let out = "";
      block.cards.forEach((c, i) => {
        const x = r.x + i * (cardW + gap);
        const mid = x + cardW / 2;
        out += `<rect x="${x}" y="${r.y}" width="${cardW}" height="${r.h}" rx="22" fill="#ffffff" fill-opacity="0.96" stroke="${p.accent}" stroke-width="2.5"/>`;
        out += `<circle cx="${mid}" cy="${r.y + 2}" r="28" fill="${p.accent}" stroke="#ffffff" stroke-width="3"/>`;
        out += iconSvg(c.icon as IconName, mid - 16, r.y - 14, 32, p.primaryDark, 2);
        let y = r.y + 40;
        out += textSvg(c.value, "sansBold", mid, y, p.primaryDark);
        y += height(c.value) + 6;
        out += textSvg(c.label, "sansBold", mid, y, p.primary);
        y += height(c.label);
        if (c.detail) {
          y += 12;
          const dh = height(c.detail) + 16;
          out += `<rect x="${x + 16}" y="${y}" width="${cardW - 32}" height="${dh}" rx="${Math.min(dh / 2, 22)}" fill="${p.primary}"/>`;
          out += textSvg(c.detail, "sans", mid, y + 8, p.onPrimary);
          y += dh;
        }
        if (c.note) out += textSvg(c.note, "sans", mid, y + 8, p.muted);
      });
      return out;
    }
    case "promoStrip": {
      const r = block.rect;
      const colW = (r.w - 24) / block.items.length;
      let out = `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${Math.min(r.h / 2, 30)}" fill="#ffffff" fill-opacity="0.94" stroke="${p.accent}" stroke-width="2.5"/>`;
      for (const [i, item] of block.items.entries()) {
        const x = r.x + 12 + i * colW;
        const valueW = await m.width(item.value.lines[0], "sansBold", item.value.size);
        const labelW = Math.max(...(await Promise.all(item.label.lines.map((l) => m.width(l, "sans", item.label.size)))));
        const total = valueW + 14 + labelW;
        const start = x + Math.max(10, (colW - total) / 2);
        out += textSvg(item.value, "sansBold", start, r.y + (r.h - height(item.value)) / 2, p.primaryDark, "start");
        out += textSvg(item.label, "sans", start + valueW + 14, r.y + (r.h - height(item.label)) / 2, p.ink, "start");
        if (i > 0) out += `<rect x="${x - 1}" y="${r.y + 16}" width="2" height="${r.h - 32}" fill="${p.accent}" fill-opacity="0.6"/>`;
      }
      return out;
    }
    case "footer": {
      const r = block.rect;
      const W = r.w;
      const wave = `M0 ${r.y + 26} Q ${W * 0.5} ${r.y - 22} ${W} ${r.y + 26}`;
      let out = `<path d="${wave} L ${W} ${r.y + r.h} L 0 ${r.y + r.h} Z" fill="${p.primary}"/>`;
      out += `<path d="${wave}" fill="none" stroke="${p.accent}" stroke-width="7"/>`;
      const c = block.cta.rect;
      out += `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="${c.h / 2}" fill="${p.primaryDark}" stroke="${p.accent}" stroke-width="3.5"/>`;
      const disc = c.h - 26;
      out += `<circle cx="${c.x + 13 + disc / 2}" cy="${c.y + c.h / 2}" r="${disc / 2}" fill="${p.accent}"/>`;
      out += iconSvg(block.cta.main ? "message-circle" : "phone", c.x + 13 + disc * 0.22, c.y + c.h / 2 - disc * 0.28, Math.round(disc * 0.56), p.primaryDark, 2.2);
      const tx = c.x + 13 + disc + 22;
      const lines = [block.cta.top, block.cta.main, block.cta.phone].filter(Boolean) as TextLines[];
      let y = c.y + (c.h - lines.reduce((s, t) => s + height(t), 0)) / 2;
      out += textSvg(block.cta.top, block.cta.main ? "sans" : "sansBold", tx, y, "#ffffff", "start");
      y += height(block.cta.top);
      if (block.cta.main) {
        out += textSvg(block.cta.main, "sansBold", tx, y, "#ffffff", "start");
        y += height(block.cta.main);
      }
      if (block.cta.phone) out += textSvg(block.cta.phone, "sansBold", tx, y, p.accent, "start");
      if (block.note) {
        const n = block.note.rect;
        const d = 64;
        out += `<circle cx="${n.x + d / 2}" cy="${n.y + n.h / 2}" r="${d / 2}" fill="none" stroke="${p.accent}" stroke-width="3"/>`;
        out += iconSvg(iconFor(block.note.text.lines.join(" ")), n.x + d * 0.22, n.y + n.h / 2 - d * 0.28, Math.round(d * 0.56), p.accent, 2);
        out += textSvg(block.note.text, "sansBold", n.x + d + 14, n.y + (n.h - height(block.note.text)) / 2, p.onPrimary, "start");
      }
      return out;
    }
  }
}

// ---------------------------------------------------------------- scene

async function sceneLayer(scene: Buffer | null, layout: Layout, p: Palette): Promise<Buffer> {
  const { width: W, height: H, sceneBox } = layout;
  if (!scene) {
    const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="g" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${p.surface}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
  }
  // Ambient backdrop: the same photo, blurred, so translucent panels sit on
  // the scene's own colors instead of a flat fill.
  const backdrop = await sharp(scene).rotate().resize(W, H, { fit: "cover" }).blur(30).modulate({ brightness: 1.06 }).png().toBuffer();

  // The real photo, sharp, framed on the product zone and feathered into the
  // backdrop above and below.
  const ext = Math.round(H * 0.09);
  const y0 = Math.max(0, sceneBox.y - ext);
  const y1 = Math.min(H, sceneBox.y + sceneBox.h + ext);
  const bandH = Math.max(1, y1 - y0);
  const feather = Math.min(ext, Math.round(bandH / 4));
  const mask = Buffer.from(
    `<svg width="${W}" height="${bandH}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="${y0 === 0 ? 1 : 0}"/>
      <stop offset="${feather / bandH}" stop-color="#fff" stop-opacity="1"/>
      <stop offset="${1 - feather / bandH}" stop-color="#fff" stop-opacity="1"/>
      <stop offset="1" stop-color="#fff" stop-opacity="${y1 === H ? 1 : 0}"/>
    </linearGradient></defs><rect width="${W}" height="${bandH}" fill="url(#f)"/></svg>`
  );
  const band = await sharp(scene)
    .rotate()
    .resize(W, bandH, { fit: "cover", position: "centre" })
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  return sharp(backdrop).composite([{ input: band, left: 0, top: y0 }]).png().toBuffer();
}

function headerWash(layout: Layout, p: Palette) {
  const { width: W, height: H, sceneBox } = layout;
  const solid = Math.max(0, sceneBox.y - 30) / H;
  const clear = Math.min(1, (sceneBox.y + 90) / H);
  return Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.surface}" stop-opacity="0.95"/>
      <stop offset="${solid}" stop-color="${p.surface}" stop-opacity="0.86"/>
      <stop offset="${clear}" stop-color="${p.surface}" stop-opacity="0"/>
    </linearGradient></defs><rect width="${W}" height="${H}" fill="url(#w)"/></svg>`
  );
}

// ---------------------------------------------------------------- entry point

export type TemplateRenderInput = {
  formatId: string;
  conceptType: string;
  content: AdContent;
  brand: TemplateBrand;
  /** Original product photo (or, later, an AI scene). Null → brand backdrop. */
  scene: Buffer | null;
  sceneSource: "original" | "ai" | "none";
};

export type TemplateRenderResult = {
  buffer: Buffer;
  width: number;
  height: number;
  meta: { template: string; sceneSource: string; blocks: string[]; omitted: string[]; titleSize: number };
};

export const POSTER_TEMPLATE_ID = "poster-elegante";

/** Stories: Meta's reply bar covers the bottom; a quiet brand signature fills it. */
function signatureSvg(layout: Layout, brand: TemplateBrand, p: Palette, formatId: string) {
  if (formatId !== "STORY_9_16" || !brand.name) return "";
  const y = layout.height - 120;
  return `<text x="${layout.width / 2}" y="${y}" text-anchor="middle" font-family="'Playfair Display SC'" font-weight="700" font-size="44" letter-spacing="3" fill="${p.accent}" fill-opacity="0.85">${escapeXml(brand.name)}</text>`;
}

export async function renderTemplate(input: TemplateRenderInput, measurer: Measurer = pangoMeasurer()): Promise<TemplateRenderResult> {
  const palette = paletteFor(input.brand);
  const logoMeta = input.brand.logo ? await sharp(input.brand.logo).metadata().catch(() => null) : null;
  const logoAspect = logoMeta?.width && logoMeta.height ? logoMeta.width / logoMeta.height : null;

  const layout = await computeLayout(
    input.content,
    { formatId: input.formatId, conceptType: input.conceptType, logoAspect, brandName: input.brand.name },
    measurer
  );
  const { width: W, height: H } = layout;

  const parts = await Promise.all(layout.blocks.map((b) => blockSvg(b, palette, measurer)));
  const signature = signatureSvg(layout, input.brand, palette, input.formatId);
  const design = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${parts.join("")}${signature}</svg>`);

  const layers: OverlayOptions[] = [{ input: headerWash(layout, palette) }, { input: design }];
  const logoBlock = layout.blocks.find((b) => b.kind === "logo");
  if (logoBlock && input.brand.logo) {
    const logo = await sharp(input.brand.logo).resize(logoBlock.rect.w, logoBlock.rect.h, { fit: "inside" }).png().toBuffer();
    layers.push({ input: logo, left: logoBlock.rect.x, top: logoBlock.rect.y });
  }

  const base = await sceneLayer(input.scene, layout, palette);
  const buffer = await sharp(base)
    .composite(layers)
    .jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();

  const title = layout.blocks.find((b) => b.kind === "title");
  return {
    buffer,
    width: W,
    height: H,
    meta: {
      template: POSTER_TEMPLATE_ID,
      sceneSource: input.sceneSource,
      blocks: layout.blocks.map((b) => b.kind),
      omitted: layout.omitted,
      titleSize: title && "text" in title ? title.text.size : 0,
    },
  };
}
