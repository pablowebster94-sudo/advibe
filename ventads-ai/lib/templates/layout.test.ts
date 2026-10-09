import { describe, expect, it } from "vitest";
import { FORMATS } from "@/lib/catalog/formats";
import { computeLayout, geometryFor } from "@/lib/templates/layout";
import { estimateMeasurer } from "@/lib/templates/measure";
import type { AdContent, Block } from "@/lib/templates/types";

const base: AdContent = {
  kicker: null,
  title: "Imperial",
  subtitle: null,
  price: null,
  includes: [],
  benefits: [],
  promotions: [],
  cta: "Escríbenos",
  whatsapp: null,
  footerNote: null,
};

const layout = (content: Partial<AdContent>, formatId = "PORTRAIT_4_5", conceptType = "VENTA_DIRECTA") =>
  computeLayout({ ...base, ...content }, { formatId, conceptType, logoAspect: 1.5, brandName: "Muebles Ideal" }, estimateMeasurer);

const find = <K extends Block["kind"]>(blocks: Block[], kind: K) =>
  blocks.find((b) => b.kind === kind) as Extract<Block, { kind: K }> | undefined;

describe("template layout", () => {
  it("lays out 4 included items in one row of 4 columns", async () => {
    const l = await layout({ includes: ["Sofá triple", "Sofá doble", "2 poltronas", "Mesa de centro"] }, "PORTRAIT_4_5", "CARACTERISTICA");
    const inc = find(l.blocks, "includes");
    expect(inc?.items).toHaveLength(4);
    expect(inc?.cols).toBe(4);
  });

  it("shows no promotion block at all when there are no promotions", async () => {
    const l = await layout({});
    expect(l.blocks.some((b) => b.kind === "promoCards" || b.kind === "promoStrip")).toBe(false);
  });

  it("uses exactly as many benefit columns as benefits (no empty slots)", async () => {
    const l = await layout({ benefits: ["Durabilidad", "Confort"] }, "PORTRAIT_4_5", "BENEFICIO");
    expect(find(l.blocks, "benefits")?.items).toHaveLength(2);
  });

  it("shrinks a long title deterministically and keeps it within 2 lines", async () => {
    const short = await layout({ title: "Imperial" });
    const long = await layout({ title: "Juego de sala modular reclinable Imperial Deluxe" });
    const s = find(short.blocks, "title")!.text;
    const l = find(long.blocks, "title")!.text;
    expect(l.size).toBeLessThan(s.size);
    expect(l.lines.length).toBeLessThanOrEqual(2);
  });

  it("only shows a price badge when there is a price", async () => {
    expect(find((await layout({})).blocks, "priceBadge")).toBeUndefined();
    expect(find((await layout({ price: "$1.299" })).blocks, "priceBadge")).toBeDefined();
  });

  it("keeps the product visible in every format, even with all content", async () => {
    const full: Partial<AdContent> = {
      kicker: "Juego de sala",
      subtitle: "Elegancia, comodidad y estilo para transformar tu sala.",
      price: "$1.299",
      includes: ["Sofá triple", "Sofá doble", "2 poltronas", "Mesa de centro"],
      benefits: ["Madera de alta calidad", "Tapizado antifluido", "Durabilidad y confort", "Diseño moderno"],
      promotions: [
        { value: "15%", label: "de descuento", detail: "En toda la tienda", note: "(Efectivo)" },
        { value: "12", label: "meses sin intereses" },
      ],
      whatsapp: "099 336 1284",
      footerNote: "Envío a todo el país",
    };
    for (const format of FORMATS) {
      for (const concept of ["VENTA_DIRECTA", "CARACTERISTICA", "BENEFICIO", "ASPIRACIONAL"]) {
        const l = await layout(full, format.id, concept);
        expect(l.sceneBox.h).toBeGreaterThanOrEqual(geometryFor(format.id).minScene * format.height);
        // Title, CTA and the promotions are never dropped.
        expect(find(l.blocks, "title")).toBeDefined();
        expect(find(l.blocks, "footer")).toBeDefined();
        expect(l.blocks.some((b) => b.kind === "promoCards" || b.kind === "promoStrip")).toBe(true);
      }
    }
  });

  it("keeps the story CTA out of the zone Meta's reply bar covers", async () => {
    const l = await layout({ whatsapp: "099 336 1284" }, "STORY_9_16");
    const footer = find(l.blocks, "footer")!;
    expect(footer.cta.rect.y + footer.cta.rect.h).toBeLessThanOrEqual(1920 - geometryFor("STORY_9_16").safeBottom);
  });

  it("is deterministic", async () => {
    const content = { includes: ["Sofá", "Mesa"], benefits: ["Confort"], price: "$10" };
    expect(JSON.stringify(await layout(content))).toBe(JSON.stringify(await layout(content)));
  });
});
