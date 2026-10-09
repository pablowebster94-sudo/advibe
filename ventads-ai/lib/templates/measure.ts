import sharp from "sharp";
import { ensureFontsConfigured } from "@/lib/fonts";
import type { FontRole, Measurer } from "@/lib/templates/types";

/** The bundled fonts behind each role (see ./fonts and lib/fonts.ts). */
export const FONT_ROLES: Record<FontRole, { family: string; weight: number }> = {
  display: { family: "Playfair Display SC", weight: 900 },
  displayBold: { family: "Playfair Display SC", weight: 700 },
  sans: { family: "DejaVu Sans", weight: 400 },
  sansBold: { family: "DejaVu Sans", weight: 700 },
};

const REFERENCE_SIZE = 100;

function escapeMarkup(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Exact text widths from the same Pango/fontconfig stack librsvg uses to
 * draw the SVG text, so layout decisions match the pixels. Each word is
 * measured once at 100px (widths scale linearly) and cached; a line is its
 * words plus the font's space width.
 */
class PangoMeasurer implements Measurer {
  private cache = new Map<string, Promise<number>>();

  private measureWord(word: string, role: FontRole): Promise<number> {
    const key = `${role}\u0000${word}`;
    let pending = this.cache.get(key);
    if (!pending) {
      const font = FONT_ROLES[role];
      pending = sharp({
        text: {
          text: `<span font_family="${font.family}" font_weight="${font.weight}" size="${REFERENCE_SIZE}pt">${escapeMarkup(word)}</span>`,
          dpi: 72,
          rgba: true,
        },
      })
        .metadata()
        .then((meta) => meta.width ?? word.length * REFERENCE_SIZE * 0.6);
      this.cache.set(key, pending);
    }
    return pending;
  }

  async width(text: string, role: FontRole, size: number): Promise<number> {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return 0;
    const [widths, space] = await Promise.all([
      Promise.all(words.map((word) => this.measureWord(word, role))),
      // "x x" minus "xx": the space advance, including any side bearings.
      Promise.all([this.measureWord("x x", role), this.measureWord("xx", role)]).then(([a, b]) => a - b),
    ]);
    const total = widths.reduce((sum, w) => sum + w, 0) + space * (words.length - 1);
    return (total * size) / REFERENCE_SIZE;
  }
}

let shared: PangoMeasurer | null = null;

export function pangoMeasurer(): Measurer {
  ensureFontsConfigured();
  if (!shared) shared = new PangoMeasurer();
  return shared;
}

/** Fixed-advance estimate, for layout tests that must not depend on fonts. */
export const estimateMeasurer: Measurer = {
  async width(text, role, size) {
    const em = role === "display" || role === "displayBold" ? 0.72 : role === "sansBold" ? 0.62 : 0.55;
    return text.length * size * em;
  },
};
