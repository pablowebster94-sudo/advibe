/**
 * Template engine types. The split is deliberate:
 *  - AdContent: exact commercial content (only what the user entered);
 *  - TemplateBrand: Brand Kit (logo, colors, contact, footer);
 *  - computeLayout(): pure, deterministic geometry from content + format;
 *  - renderTemplate(): turns that geometry into the final image over the
 *    scene (original photo today, optional AI scene later).
 * No AI model ever draws any of this text.
 */

export type Promotion = {
  /** Big figure: "15%", "12", "2x1". */
  value: string;
  /** Next to the figure: "de descuento", "meses sin intereses". */
  label: string;
  /** Pill under the figure: "En TODA la tienda". */
  detail?: string | null;
  /** Small print: "(Para pagos en efectivo)". */
  note?: string | null;
};

export type AdContent = {
  /** Small line above the title ("Juego de sala"), optional. */
  kicker: string | null;
  /** Main title ("Imperial" / "Chevrolet Blazer RS 2021"). */
  title: string;
  subtitle: string | null;
  price: string | null;
  includes: string[];
  benefits: string[];
  promotions: Promotion[];
  /** Button text when there is no WhatsApp number ("Escríbenos"). */
  cta: string;
  whatsapp: string | null;
  footerNote: string | null;
};

export type TemplateBrand = {
  name: string | null;
  /** Logo image (any format sharp reads), drawn as is — never redrawn. */
  logo: Buffer | null;
  primary: string;
  accent: string;
};

/** How a concept uses the template (what it emphasizes). */
export type Recipe = {
  id: string;
  showSubtitle: boolean;
  showPriceBadge: boolean;
  showIncludes: boolean;
  showBenefits: boolean;
  promotions: "cards" | "strip";
  /** Optional blocks in the order this angle wants them when space is short. */
  priority: Array<"promoCards" | "subtitle" | "includes" | "benefits">;
};

export type FontRole = "display" | "displayBold" | "sans" | "sansBold";

export type Rect = { x: number; y: number; w: number; h: number };

export type TextLines = { lines: string[]; size: number; lineHeight: number };

export type Block =
  | { kind: "logo"; rect: Rect }
  | { kind: "brandName"; rect: Rect; text: TextLines }
  | { kind: "kicker"; rect: Rect; text: TextLines }
  | { kind: "title"; rect: Rect; text: TextLines }
  | { kind: "subtitle"; rect: Rect; text: TextLines }
  | { kind: "priceBadge"; rect: Rect; text: TextLines }
  | { kind: "includes"; rect: Rect; items: Array<{ label: TextLines; icon: string }>; iconSize: number; cols: number }
  | { kind: "benefits"; rect: Rect; items: Array<{ label: TextLines; icon: string }>; iconSize: number }
  | {
      kind: "promoCards";
      rect: Rect;
      cards: Array<{ value: TextLines; label: TextLines; detail: TextLines | null; note: TextLines | null; icon: string }>;
    }
  | { kind: "promoStrip"; rect: Rect; items: Array<{ value: TextLines; label: TextLines }> }
  | {
      kind: "footer";
      rect: Rect;
      cta: { rect: Rect; top: TextLines; main: TextLines | null; phone: TextLines | null };
      note: { rect: Rect; text: TextLines } | null;
    };

export type Layout = {
  width: number;
  height: number;
  /** Area where the product must stay visible (between top and bottom blocks). */
  sceneBox: Rect;
  blocks: Block[];
  /** Blocks dropped because they did not fit this format, in drop order. */
  omitted: string[];
};

export interface Measurer {
  /** Rendered width in px of `text` in `role` at `size` px. */
  width(text: string, role: FontRole, size: number): Promise<number>;
}
