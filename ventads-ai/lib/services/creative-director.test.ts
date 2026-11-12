import { describe, expect, it } from "vitest";
import { fallbackCreativeBrief, inferCreativeStyle } from "@/lib/services/creative-director";

describe("creative director fallback", () => {
  it("extracts a vehicle category and only uses a price stated by the user", () => {
    const brief = fallbackCreativeBrief("Diseña un anuncio para vender una Chevrolet Tracker por $18.500, elegante y moderno.");
    expect(brief.category).toBe("Vehículos");
    expect(brief.price).toBe(18500);
    expect(brief.name.toLowerCase()).toContain("chevrolet tracker");
  });

  it("does not invent a price when the prompt has none", () => {
    const brief = fallbackCreativeBrief("Crea un flyer premium para promocionar muebles de sala.");
    expect(brief.price).toBeUndefined();
    expect(brief.features).toEqual([]);
    expect(brief.benefits).toEqual([]);
  });

  it("selects a deterministic visual style from explicit direction", () => {
    expect(inferCreativeStyle("Quiero algo minimalista y limpio")).toBe("MINIMALISTA");
    expect(inferCreativeStyle("Una campaña elegante y sobria")).toBe("ELEGANTE");
    expect(inferCreativeStyle("Promoción con descuento por pocos días")).toBe("URGENCIA");
  });
});
