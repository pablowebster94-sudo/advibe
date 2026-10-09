import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ensureFontsConfigured } from "@/lib/fonts";
import { REFERENCE_CREATIVE, renderFingerprint, templateFingerprint } from "@/lib/render-fingerprint";
import { renderCreative } from "@/lib/services/creative-renderer";
import { FORMATS } from "@/lib/catalog/formats";

const pinned = JSON.parse(
  readFileSync(path.join(process.cwd(), "tests/fixtures/render-fingerprint.json"), "utf8")
) as { sha256: string; templateSha256: string };

describe("creative renderer", () => {
  it("uses only the bundled fonts", () => {
    expect(ensureFontsConfigured()).toBe(true);
    expect(process.env.FONTCONFIG_FILE).toMatch(/ventads-fontconfig/);
  });

  it("renders the reference creative byte-for-byte as pinned (same output local and in production)", async () => {
    expect(await renderFingerprint()).toBe(pinned.sha256);
  });

  it("renders the reference template ad byte-for-byte as pinned (Playfair + DejaVu + icons)", async () => {
    expect(await templateFingerprint()).toBe(pinned.templateSha256);
  });

  it.each(FORMATS.map((f) => [f.id, f.width, f.height] as const))(
    "renders %s at %ix%i with visible copy in the text panel",
    async (formatId, width, height) => {
      const { buffer } = await renderCreative({
        ...REFERENCE_CREATIVE,
        highlights: [...REFERENCE_CREATIVE.highlights],
        formatId,
      });
      const meta = await sharp(buffer).metadata();
      expect([meta.width, meta.height, meta.format]).toEqual([width, height, "jpeg"]);

      // The lower panel (headline, CTA, price) must contain real glyph ink:
      // dark headline pixels and the accent-colored button.
      const { data, info } = await sharp(buffer)
        .extract({ left: 0, top: Math.round(height * 0.6), width, height: Math.round(height * 0.4) })
        .raw()
        .toBuffer({ resolveWithObject: true });
      let dark = 0;
      for (let i = 0; i < data.length; i += info.channels) {
        if (data[i] < 60 && data[i + 1] < 60 && data[i + 2] < 60) dark++;
      }
      expect(dark / (info.width * info.height)).toBeGreaterThan(0.005);
    }
  );
});
