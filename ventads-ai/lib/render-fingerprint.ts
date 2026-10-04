import { createHash } from "node:crypto";
import { ensureFontsConfigured } from "@/lib/fonts";
import { renderCreative } from "@/lib/services/creative-renderer";

/**
 * A fixed reference creative (text only, no photo) and the SHA-256 of its
 * bytes. Same code + same bundled fonts + same sharp/libvips build must give
 * the same hash everywhere, so comparing the production value (exposed by
 * /api/health) with the one pinned in tests/fixtures/render-fingerprint.json
 * proves the creatives rendered on Vercel are identical to local ones —
 * fonts included (a missing font changes every glyph, hence the hash).
 */
export const REFERENCE_CREATIVE = {
  formatId: "SQUARE_1_1",
  styleId: "COMERCIAL",
  conceptType: "VENTA_DIRECTA",
  headline: "Ñandú ágil: ¿qué incluye?",
  supportingLine: "Único dueño · 30.000 km · garantía",
  priceDisplay: "$38.900",
  ctaLabel: "Escríbenos por WhatsApp",
  productImageBuffer: null,
  logoBuffer: null,
  variantSeed: 0,
  highlights: ["Único dueño", "Full equipo"],
} as const;

let cached: Promise<string> | null = null;

export function renderFingerprint(): Promise<string> {
  if (!cached) {
    cached = (async () => {
      ensureFontsConfigured();
      const { buffer } = await renderCreative({ ...REFERENCE_CREATIVE, highlights: [...REFERENCE_CREATIVE.highlights] });
      return createHash("sha256").update(buffer).digest("hex");
    })().catch((error) => {
      cached = null;
      throw error;
    });
  }
  return cached;
}
