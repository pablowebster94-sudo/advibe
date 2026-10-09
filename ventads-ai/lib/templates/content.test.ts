import { describe, expect, it } from "vitest";
import { buildAdContent, parsePromotions } from "@/lib/templates/content";
import type { ProductBrief } from "@/lib/product-brief";

const brief: ProductBrief = {
  productName: "Juego de sala Imperial",
  category: "Productos de retail",
  manufacturer: null,
  model: null,
  priceDisplay: "$1.299",
  description: "Elegancia y confort. Hecho en Ecuador.",
  features: ["Tapizado antifluido"],
  benefits: [],
  offer: null,
  cta: null,
  targetAudience: null,
  brandName: "Muebles Ideal",
  brandCta: null,
  brandContact: "099 336 1284",
  logoKey: null,
  brandColors: null,
};

const product = { adTitle: "Juego de sala\nImperial", name: "Juego de sala Imperial", description: brief.description, includes: "Sofá triple\nmesa de centro", promotions: null };

describe("buildAdContent", () => {
  it("splits the ad title, capitalizes lists and never repeats title or price in the subtitle", () => {
    const c = buildAdContent({ product, brand: null, brief, conceptType: "CARACTERISTICA", copy: { headline: "Juego de sala Imperial desde $1.299", cta: "Escríbenos" } });
    expect(c.kicker).toBe("Juego de sala");
    expect(c.title).toBe("Imperial");
    expect(c.subtitle).toBe("Elegancia y confort.");
    expect(c.includes).toEqual(["Sofá triple", "Mesa de centro"]);
    expect(c.benefits).toEqual(["Tapizado antifluido"]);
  });

  it("turns an offer that starts with a figure into a promotion, and drops malformed promotions", () => {
    const c = buildAdContent({ product, brand: null, brief: { ...brief, offer: "15% de descuento" }, conceptType: "VENTA_DIRECTA", copy: { headline: "x", cta: "Escríbenos" } });
    expect(c.promotions).toEqual([{ value: "15%", label: "de descuento" }]);
    expect(parsePromotions([{ value: "", label: "x" }])).toEqual([]);
    expect(parsePromotions("nope")).toEqual([]);
  });
});
