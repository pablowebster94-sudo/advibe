import { getFormat } from "@/lib/catalog/formats";
import { iconFor } from "@/lib/templates/icons";
import type { AdContent, Block, FontRole, Layout, Measurer, Recipe, Rect, TextLines } from "@/lib/templates/types";

/**
 * Deterministic layout for the "poster" template: same inputs, same
 * geometry, always. The template defines zones, hierarchy, margins and type
 * scale; this file adapts them to the format and to the content (how many
 * included items, benefits and promotions there are, how long the title is,
 * whether there is a price). Nothing here draws pixels — see render.ts.
 */

type Geometry = {
  margin: number;
  /** Space Meta's own UI covers (stories), or a visual margin. */
  safeTop: number;
  safeBottom: number;
  footer: number;
  /** The product photo must keep at least this share of the height. */
  minScene: number;
  titleMax: number;
  titleMin: number;
  logoBox: [number, number];
  /** Title next to the logo (feed) or centered below it (stories). */
  headerBeside: boolean;
  includesPerRow: number;
  includesRows: number;
  benefitsMax: number;
  promosMax: number;
  body: number;
};

const GEOMETRY: Record<string, Geometry> = {
  SQUARE_1_1: {
    margin: 52, safeTop: 44, safeBottom: 0, footer: 150, minScene: 0.28,
    titleMax: 118, titleMin: 58, logoBox: [220, 150], headerBeside: true,
    includesPerRow: 5, includesRows: 1, benefitsMax: 4, promosMax: 3, body: 25,
  },
  PORTRAIT_4_5: {
    margin: 56, safeTop: 52, safeBottom: 0, footer: 164, minScene: 0.28,
    titleMax: 132, titleMin: 62, logoBox: [230, 160], headerBeside: true,
    includesPerRow: 5, includesRows: 1, benefitsMax: 4, promosMax: 3, body: 26,
  },
  STORY_9_16: {
    margin: 64, safeTop: 180, safeBottom: 250, footer: 176, minScene: 0.2,
    titleMax: 150, titleMin: 70, logoBox: [270, 140], headerBeside: false,
    includesPerRow: 4, includesRows: 2, benefitsMax: 4, promosMax: 3, body: 28,
  },
};

export function geometryFor(formatId: string): Geometry {
  return GEOMETRY[formatId] ?? GEOMETRY.SQUARE_1_1;
}

/** What each ad angle emphasizes. Unknown concepts use the direct-sale recipe. */
export const RECIPES: Record<string, Recipe> = {
  VENTA_DIRECTA: { id: "VENTA_DIRECTA", showSubtitle: true, showPriceBadge: true, showIncludes: true, showBenefits: true, promotions: "cards", priority: ["promoCards", "subtitle", "includes", "benefits"] },
  OFERTA: { id: "OFERTA", showSubtitle: true, showPriceBadge: true, showIncludes: false, showBenefits: false, promotions: "cards", priority: ["promoCards", "subtitle"] },
  CARACTERISTICA: { id: "CARACTERISTICA", showSubtitle: true, showPriceBadge: false, showIncludes: true, showBenefits: true, promotions: "strip", priority: ["includes", "subtitle", "benefits"] },
  BENEFICIO: { id: "BENEFICIO", showSubtitle: true, showPriceBadge: false, showIncludes: false, showBenefits: true, promotions: "strip", priority: ["benefits", "subtitle"] },
  // Aspirational: the scene is the protagonist (no icon rows).
  ASPIRACIONAL: { id: "ASPIRACIONAL", showSubtitle: true, showPriceBadge: false, showIncludes: false, showBenefits: false, promotions: "strip", priority: ["subtitle"] },
};

export function recipeFor(conceptType: string): Recipe {
  return RECIPES[conceptType] ?? RECIPES.VENTA_DIRECTA;
}

// ---------------------------------------------------------------- text fit

async function wrap(
  m: Measurer,
  text: string,
  role: FontRole,
  size: number,
  maxWidth: number,
  maxLines: number
): Promise<string[] | null> {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if ((await m.width(candidate, role, size)) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (!current) return null; // a single word wider than the box
    lines.push(current);
    current = word;
    if ((await m.width(word, role, size)) > maxWidth) return null;
  }
  if (current) lines.push(current);
  return lines.length <= maxLines ? lines : null;
}

/**
 * Largest size (step 2px) at which `text` fits `maxWidth` in `maxLines`.
 * Below `minSize` it never shrinks further except for a single word that is
 * wider than the box; text that still does not fit is cut at a word with "…".
 */
export async function fitText(
  m: Measurer,
  text: string,
  role: FontRole,
  opts: { max: number; min: number; width: number; lines: number; lineHeight: number }
): Promise<TextLines> {
  const clean = text.replace(/\s+/g, " ").trim();
  for (let size = opts.max; size >= opts.min; size -= 2) {
    const lines = await wrap(m, clean, role, size, opts.width, opts.lines);
    if (lines) return { lines, size, lineHeight: Math.round(size * opts.lineHeight) };
  }
  let size = opts.min;
  const words = clean.split(" ");
  const longest = Math.max(...(await Promise.all(words.map((w) => m.width(w, role, size)))));
  if (longest > opts.width) size = Math.max(12, Math.floor((size * opts.width) / longest));
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if ((await m.width(candidate, role, size)) <= opts.width || !current) current = candidate;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length > opts.lines) {
    const kept = lines.slice(0, opts.lines);
    let last = `${kept[kept.length - 1]}…`;
    while ((await m.width(last, role, size)) > opts.width && last.includes(" ")) {
      last = `${last.slice(0, last.lastIndexOf(" "))}…`;
    }
    kept[kept.length - 1] = last;
    return { lines: kept, size, lineHeight: Math.round(size * opts.lineHeight) };
  }
  return { lines, size, lineHeight: Math.round(size * opts.lineHeight) };
}

function textHeight(t: TextLines | null) {
  return t ? t.lines.length * t.lineHeight : 0;
}

// ---------------------------------------------------------------- layout

export type LayoutOptions = {
  formatId: string;
  conceptType: string;
  /** width / height of the logo image, when there is one. */
  logoAspect: number | null;
  brandName: string | null;
};

type Toggles = { subtitle: boolean; includes: boolean; benefits: boolean; promoStyle: "cards" | "strip" };

export async function computeLayout(content: AdContent, options: LayoutOptions, m: Measurer): Promise<Layout> {
  const recipe = recipeFor(options.conceptType);
  const g = geometryFor(options.formatId);

  // Start from the blocks that are never dropped (title, price, CTA and
  // promotions as a compact strip), then add the optional ones in priority
  // order, keeping each only if the product still gets enough room. Same
  // content + format → same result, and no empty or half-filled block.
  const toggles: Toggles = { subtitle: false, includes: false, benefits: false, promoStyle: "strip" };
  const optional: Record<Recipe["priority"][number], [boolean, (t: Toggles) => Toggles]> = {
    promoCards: [recipe.promotions === "cards" && content.promotions.length > 0, (t) => ({ ...t, promoStyle: "cards" })],
    subtitle: [recipe.showSubtitle && Boolean(content.subtitle), (t) => ({ ...t, subtitle: true })],
    includes: [recipe.showIncludes && content.includes.length > 0, (t) => ({ ...t, includes: true })],
    benefits: [recipe.showBenefits && content.benefits.length > 0, (t) => ({ ...t, benefits: true })],
  };
  const candidates = recipe.priority.map((name) => [name, ...optional[name]] as const);

  let current = toggles;
  let layout = await layoutWith(content, options, recipe, current, m);
  const omitted: string[] = [];
  for (const [name, wanted, enable] of candidates) {
    if (!wanted) continue;
    const next = enable(current);
    const attempt = await layoutWith(content, options, recipe, next, m);
    if (attempt.sceneBox.h >= g.minScene * attempt.height) {
      current = next;
      layout = attempt;
    } else {
      omitted.push(name);
    }
  }
  return { ...layout, omitted: [...layout.omitted, ...omitted] };
}

async function layoutWith(
  content: AdContent,
  options: LayoutOptions,
  recipe: Recipe,
  toggles: Toggles,
  m: Measurer
): Promise<Layout> {
  const format = getFormat(options.formatId);
  const W = format.width;
  const H = format.height;
  const g = geometryFor(format.id);
  const blocks: Block[] = [];
  const omitted: string[] = [];
  const inner = W - g.margin * 2;

  // ---- header: logo / brand name + title column
  let leftW = 0;
  let leftH = 0;
  if (options.logoAspect) {
    const [bw, bh] = g.logoBox;
    const lw = Math.min(bw, Math.round(bh * options.logoAspect));
    const lh = Math.round(lw / options.logoAspect);
    const x = g.headerBeside ? g.margin : Math.round((W - lw) / 2);
    blocks.push({ kind: "logo", rect: { x, y: g.safeTop, w: lw, h: lh } });
    leftW = lw;
    leftH = lh;
  } else if (options.brandName) {
    const width = g.headerBeside ? g.logoBox[0] : inner;
    const text = await fitText(m, options.brandName, "sansBold", { max: 34, min: 22, width, lines: 2, lineHeight: 1.15 });
    const w = g.headerBeside ? width : inner;
    const x = g.headerBeside ? g.margin : g.margin;
    blocks.push({ kind: "brandName", rect: { x, y: g.safeTop, w, h: textHeight(text) }, text });
    leftW = width;
    leftH = textHeight(text);
  }

  const besideLogo = g.headerBeside && leftW > 0;
  const colX = besideLogo ? g.margin + leftW + 32 : g.margin;
  const colW = W - g.margin - colX;
  let y = besideLogo || leftH === 0 ? g.safeTop : g.safeTop + leftH + 28;

  if (content.kicker) {
    const kicker = await fitText(m, content.kicker, "displayBold", {
      max: Math.round(g.titleMax * 0.42), min: 26, width: colW * 0.72, lines: 1, lineHeight: 1.2,
    });
    blocks.push({ kind: "kicker", rect: { x: colX, y, w: colW, h: textHeight(kicker) }, text: kicker });
    y += textHeight(kicker) + 4;
  }

  const title = await fitText(m, content.title, "display", {
    max: g.titleMax, min: g.titleMin, width: colW, lines: 2, lineHeight: 1.0,
  });
  blocks.push({ kind: "title", rect: { x: colX, y, w: colW, h: textHeight(title) }, text: title });
  y += textHeight(title) + 12;

  if (toggles.subtitle && content.subtitle) {
    const subtitle = await fitText(m, content.subtitle, "sans", {
      max: g.body + 10, min: g.body, width: colW, lines: 2, lineHeight: 1.3,
    });
    blocks.push({ kind: "subtitle", rect: { x: colX, y, w: colW, h: textHeight(subtitle) }, text: subtitle });
    y += textHeight(subtitle) + 12;
  }

  if (recipe.showPriceBadge && content.price) {
    const text = await fitText(m, content.price, "sansBold", { max: 48, min: 32, width: colW - 64, lines: 1, lineHeight: 1.1 });
    const w = Math.round((await m.width(text.lines[0], "sansBold", text.size)) + 64);
    const h = text.lineHeight + 26;
    blocks.push({ kind: "priceBadge", rect: { x: Math.round(colX + (colW - w) / 2), y, w, h }, text });
    y += h + 12;
  }

  let top = Math.max(y, g.safeTop + leftH) + 20;

  // ---- "what it includes" row(s), under the header
  if (toggles.includes) {
    const maxItems = g.includesPerRow * g.includesRows;
    const items = content.includes.slice(0, maxItems);
    if (content.includes.length > maxItems) omitted.push(`includes:+${content.includes.length - maxItems}`);
    const rows = Math.ceil(items.length / g.includesPerRow);
    const cols = Math.ceil(items.length / rows);
    const pad = 18;
    const plus = 34;
    const colWidth = (inner - pad * 2 - plus * (cols - 1)) / cols;
    const iconSize = Math.round(g.body * 2.1);
    const labels = await Promise.all(
      items.map((label) => fitText(m, label, "sans", { max: g.body, min: g.body - 6, width: colWidth, lines: 2, lineHeight: 1.2 }))
    );
    const labelH = Math.max(...labels.map(textHeight));
    const rowH = iconSize + 10 + labelH;
    const h = pad * 2 + rows * rowH + (rows - 1) * 16;
    blocks.push({
      kind: "includes",
      rect: { x: g.margin, y: top, w: inner, h },
      items: items.map((label, i) => ({ label: labels[i], icon: iconFor(label) })),
      iconSize,
      cols,
    });
    top += h + 16;
  }

  // ---- bottom stack, built upwards from the footer
  const footerTop = H - g.safeBottom - g.footer;
  const footer = await footerBlock(content, W, H, g, footerTop, m);
  blocks.push(footer);
  let bottom = footerTop - 18;

  if (content.promotions.length > 0) {
    const promos = content.promotions.slice(0, g.promosMax);
    if (content.promotions.length > g.promosMax) omitted.push(`promotions:+${content.promotions.length - g.promosMax}`);
    const block =
      toggles.promoStyle === "cards"
        ? await promoCards(promos, g, inner, bottom, m)
        : await promoStrip(promos, g, inner, bottom, m);
    blocks.push(block);
    bottom = block.rect.y - 16;
  }

  if (toggles.benefits) {
    const items = content.benefits.slice(0, g.benefitsMax);
    if (content.benefits.length > g.benefitsMax) omitted.push(`benefits:+${content.benefits.length - g.benefitsMax}`);
    const colWidth = (inner - 24) / items.length;
    const iconSize = Math.round(g.body * 2.9);
    const labels = await Promise.all(
      items.map((label) =>
        fitText(m, label, "sansBold", { max: g.body - 1, min: g.body - 7, width: colWidth - 20, lines: 3, lineHeight: 1.2 })
      )
    );
    const h = 14 + iconSize + 10 + Math.max(...labels.map(textHeight)) + 14;
    const rect = { x: g.margin, y: bottom - h, w: inner, h };
    blocks.push({ kind: "benefits", rect, items: items.map((label, i) => ({ label: labels[i], icon: iconFor(label) })), iconSize });
    bottom = rect.y - 16;
  }

  const sceneBox: Rect = { x: 0, y: top, w: W, h: Math.max(0, bottom - top) };
  return { width: W, height: H, sceneBox, blocks, omitted };
}

async function footerBlock(content: AdContent, W: number, H: number, g: Geometry, footerTop: number, m: Measurer): Promise<Block> {
  const rect = { x: 0, y: footerTop, w: W, h: H - footerTop };
  const contentH = g.footer - 30;
  const hasNote = Boolean(content.footerNote);
  const ctaW = Math.round(hasNote ? (W - g.margin * 2) * 0.6 : Math.min(W - g.margin * 2, 760));
  const ctaX = hasNote ? W - g.margin - ctaW : Math.round((W - ctaW) / 2);
  const ctaRect = { x: ctaX, y: footerTop + 22, w: ctaW, h: contentH };
  const textW = ctaW - contentH - 40; // icon disc on the left

  let top: TextLines;
  let main: TextLines | null = null;
  let phone: TextLines | null = null;
  if (content.whatsapp) {
    top = await fitText(m, "ESCRÍBENOS POR", "sans", { max: Math.round(g.body * 0.95), min: 18, width: textW, lines: 1, lineHeight: 1.15 });
    main = await fitText(m, "WHATSAPP", "sansBold", { max: Math.round(g.body * 1.7), min: 28, width: textW, lines: 1, lineHeight: 1.1 });
    phone = await fitText(m, content.whatsapp, "sansBold", { max: Math.round(g.body * 1.3), min: 22, width: textW, lines: 1, lineHeight: 1.1 });
  } else {
    top = await fitText(m, content.cta.toUpperCase(), "sansBold", { max: Math.round(g.body * 1.5), min: 22, width: textW, lines: 2, lineHeight: 1.15 });
  }

  let note: { rect: Rect; text: TextLines } | null = null;
  if (hasNote && content.footerNote) {
    const noteW = W - g.margin * 2 - ctaW - 28 - 76;
    const text = await fitText(m, content.footerNote, "sansBold", { max: g.body + 4, min: g.body - 6, width: noteW, lines: 3, lineHeight: 1.2 });
    note = { rect: { x: g.margin, y: footerTop + 22, w: W - g.margin * 2 - ctaW - 28, h: contentH }, text };
  }
  return { kind: "footer", rect, cta: { rect: ctaRect, top, main, phone }, note };
}

async function promoCards(
  promos: AdContent["promotions"],
  g: Geometry,
  inner: number,
  bottom: number,
  m: Measurer
): Promise<Block> {
  const gap = 18;
  const cardW = (inner - gap * (promos.length - 1)) / promos.length;
  const textW = cardW - 36;
  const cards = await Promise.all(
    promos.map(async (p) => ({
      value: await fitText(m, p.value, "sansBold", { max: Math.round(g.body * 3.6), min: Math.round(g.body * 1.8), width: textW, lines: 1, lineHeight: 1.0 }),
      label: await fitText(m, p.label, "sansBold", { max: g.body, min: g.body - 6, width: textW, lines: 2, lineHeight: 1.15 }),
      detail: p.detail
        ? await fitText(m, p.detail, "sans", { max: g.body, min: g.body - 6, width: textW - 24, lines: 2, lineHeight: 1.2 })
        : null,
      note: p.note ? await fitText(m, p.note, "sans", { max: g.body - 6, min: 15, width: textW, lines: 2, lineHeight: 1.2 }) : null,
      icon: iconFor(`${p.value} ${p.label} ${p.detail ?? ""}`),
    }))
  );
  const inside = (c: (typeof cards)[number]) =>
    46 + textHeight(c.value) + 6 + textHeight(c.label) + (c.detail ? 12 + textHeight(c.detail) + 16 : 0) + (c.note ? 8 + textHeight(c.note) : 0) + 18;
  const h = Math.max(...cards.map(inside));
  return { kind: "promoCards", rect: { x: g.margin, y: bottom - h, w: inner, h }, cards };
}

async function promoStrip(
  promos: AdContent["promotions"],
  g: Geometry,
  inner: number,
  bottom: number,
  m: Measurer
): Promise<Block> {
  const colW = (inner - 24) / promos.length;
  const items = await Promise.all(
    promos.map(async (p) => {
      const value = await fitText(m, p.value, "sansBold", { max: Math.round(g.body * 2), min: Math.round(g.body * 1.2), width: colW * 0.45, lines: 1, lineHeight: 1.0 });
      const valueW = await m.width(value.lines[0], "sansBold", value.size);
      const label = await fitText(m, p.label, "sans", {
        max: g.body - 3, min: g.body - 9, width: Math.max(80, colW - valueW - 40), lines: 3, lineHeight: 1.15,
      });
      return { value, label };
    })
  );
  const h = Math.max(...items.map((i) => Math.max(textHeight(i.value), textHeight(i.label)))) + 34;
  return { kind: "promoStrip", rect: { x: g.margin, y: bottom - h, w: inner, h }, items };
}
