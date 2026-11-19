import { describe, expect, it } from "vitest";
import {
  assessBudget,
  findMissingInfo,
  recommendStrategy,
  type CampaignBriefInput,
} from "@/lib/services/strategy-service";

/** A brief with every blocking fact present. Tests subtract from it. */
function completeBrief(overrides: Partial<CampaignBriefInput> = {}): CampaignBriefInput {
  return {
    offerSummary: "Sofá de 3 puestos en tela, entrega en 48 horas",
    priceDisplay: "$399",
    benefits: ["Entrega en 48 horas", "Garantía de 1 año"],
    restrictions: "Hasta agotar stock",
    destinationId: "WHATSAPP",
    whatsappNumber: "+593999999999",
    landingUrl: null,
    phoneNumber: null,
    countries: ["Ecuador"],
    cities: ["Cuenca"],
    radiusKm: 25,
    language: "es",
    audienceNotes: "Parejas jóvenes amoblando su primer departamento",
    dailyBudgetUsd: 20,
    lifetimeBudgetUsd: null,
    durationDays: 14,
    ...overrides,
  };
}

describe("findMissingInfo", () => {
  it("reports nothing blocking for a complete brief", () => {
    const missing = findMissingInfo(completeBrief(), "VENDER");
    expect(missing.filter((m) => m.blocking)).toEqual([]);
  });

  it("blocks when the WhatsApp destination has no number", () => {
    const missing = findMissingInfo(
      completeBrief({ destinationId: "WHATSAPP", whatsappNumber: null }),
      "MENSAJES"
    );
    const found = missing.find((m) => m.field === "whatsappNumber");
    expect(found?.blocking).toBe(true);
  });

  it("blocks when the website destination has no URL", () => {
    const missing = findMissingInfo(
      completeBrief({ destinationId: "SITIO_WEB", landingUrl: null }),
      "VENDER"
    );
    expect(missing.find((m) => m.field === "landingUrl")?.blocking).toBe(true);
  });

  it("does not demand a URL when the destination is an instant form", () => {
    const missing = findMissingInfo(
      completeBrief({ destinationId: "FORMULARIO", whatsappNumber: null }),
      "LEADS"
    );
    expect(missing.some((m) => m.field === "landingUrl")).toBe(false);
    expect(missing.some((m) => m.field === "whatsappNumber")).toBe(false);
  });

  it("blocks with no country and no city", () => {
    const missing = findMissingInfo(completeBrief({ countries: [], cities: [] }), "VENDER");
    expect(missing.find((m) => m.field === "geo")?.blocking).toBe(true);
  });

  it("treats whitespace-only geo as absent", () => {
    const missing = findMissingInfo(completeBrief({ countries: ["  "], cities: [""] }), "VENDER");
    expect(missing.find((m) => m.field === "geo")?.blocking).toBe(true);
  });

  it("blocks without any budget", () => {
    const missing = findMissingInfo(
      completeBrief({ dailyBudgetUsd: null, lifetimeBudgetUsd: null }),
      "VENDER"
    );
    expect(missing.find((m) => m.field === "budget")?.blocking).toBe(true);
  });

  it("requires a duration when only a lifetime budget is given", () => {
    const missing = findMissingInfo(
      completeBrief({ dailyBudgetUsd: null, lifetimeBudgetUsd: 300, durationDays: null }),
      "VENDER"
    );
    expect(missing.find((m) => m.field === "durationDays")?.blocking).toBe(true);
  });

  it("flags a missing price for a selling objective without blocking it", () => {
    const missing = findMissingInfo(completeBrief({ priceDisplay: null }), "VENDER");
    const price = missing.find((m) => m.field === "priceDisplay");
    expect(price).toBeDefined();
    expect(price?.blocking).toBe(false);
  });

  it("does not ask for a price when the objective is awareness", () => {
    const missing = findMissingInfo(completeBrief({ priceDisplay: null }), "RECONOCIMIENTO");
    expect(missing.some((m) => m.field === "priceDisplay")).toBe(false);
  });
});

describe("assessBudget", () => {
  it("reports no budget as such", () => {
    const b = assessBudget(
      completeBrief({ dailyBudgetUsd: null, lifetimeBudgetUsd: null }),
      "VENDER",
      1
    );
    expect(b.verdict).toBe("SIN_PRESUPUESTO");
  });

  it("derives a daily budget from a lifetime budget and duration", () => {
    const b = assessBudget(
      completeBrief({ dailyBudgetUsd: null, lifetimeBudgetUsd: 280, durationDays: 14 }),
      "VENDER",
      1
    );
    expect(b.dailyUsd).toBe(20);
    expect(b.totalUsd).toBe(280);
  });

  it("flags a daily budget below the per-ad-set floor", () => {
    const b = assessBudget(completeBrief({ dailyBudgetUsd: 8 }), "VENDER", 1);
    expect(b.verdict).toBe("POR_DEBAJO_DEL_MINIMO");
    expect(b.message).toContain("$10/día por conjunto");
  });

  it("multiplies the floor by the number of ad sets", () => {
    const brief = completeBrief({ dailyBudgetUsd: 20, cities: ["Cuenca", "Gualaceo", "Azogues"] });
    const b = assessBudget(brief, "VENDER", 3);
    // 3 ad sets x $10 floor = $30 needed, only $20 given.
    expect(b.verdict).toBe("POR_DEBAJO_DEL_MINIMO");
  });

  it("calls a budget just over the floor tight, not sufficient", () => {
    const b = assessBudget(completeBrief({ dailyBudgetUsd: 12 }), "VENDER", 1);
    expect(b.verdict).toBe("AJUSTADO");
  });

  it("calls a comfortable budget sufficient", () => {
    const b = assessBudget(completeBrief({ dailyBudgetUsd: 50 }), "VENDER", 1);
    expect(b.verdict).toBe("SUFICIENTE");
  });

  it("uses a lower floor for awareness than for selling", () => {
    const selling = assessBudget(completeBrief({ dailyBudgetUsd: 4 }), "VENDER", 1);
    const awareness = assessBudget(completeBrief({ dailyBudgetUsd: 4 }), "RECONOCIMIENTO", 1);
    expect(selling.verdict).toBe("POR_DEBAJO_DEL_MINIMO");
    expect(awareness.verdict).not.toBe("POR_DEBAJO_DEL_MINIMO");
  });
});

describe("recommendStrategy", () => {
  it("is ready to publish when nothing blocking is missing", () => {
    expect(recommendStrategy(completeBrief(), "VENDER").readyToPublish).toBe(true);
  });

  it("is not ready to publish when a blocking fact is missing", () => {
    const r = recommendStrategy(completeBrief({ whatsappNumber: null }), "MENSAJES");
    expect(r.readyToPublish).toBe(false);
  });

  it("stays ready when only non-blocking facts are missing", () => {
    const r = recommendStrategy(
      completeBrief({ priceDisplay: null, benefits: [], restrictions: null }),
      "VENDER"
    );
    expect(r.readyToPublish).toBe(true);
    expect(r.missingInfo.length).toBeGreaterThan(0);
  });

  it("honours the chosen destination in the recommendation", () => {
    const r = recommendStrategy(
      completeBrief({ destinationId: "SITIO_WEB", landingUrl: "https://ejemplo.com" }),
      "VENDER"
    );
    expect(r.recommended.destinationId).toBe("SITIO_WEB");
    expect(r.recommended.metaObjective).toBe("OUTCOME_TRAFFIC");
  });

  it("opens one ad set per city when there are several", () => {
    const r = recommendStrategy(
      completeBrief({ cities: ["Cuenca", "Gualaceo"], dailyBudgetUsd: 60 }),
      "VENDER"
    );
    expect(r.recommended.structure.adSets).toBe(2);
    expect(r.recommended.structure.totalAds).toBe(6);
  });

  it("uses a single ad set for a country-wide brief", () => {
    const r = recommendStrategy(completeBrief({ cities: [] }), "VENDER");
    expect(r.recommended.structure.adSets).toBe(1);
  });

  it("offers a conversation alternative when selling to a website", () => {
    const r = recommendStrategy(
      completeBrief({ destinationId: "SITIO_WEB", landingUrl: "https://ejemplo.com" }),
      "VENDER"
    );
    expect(r.alternatives.some((a) => a.destinationId === "WHATSAPP")).toBe(true);
  });

  it("offers consolidating ad sets when the city split starves the budget", () => {
    const r = recommendStrategy(
      completeBrief({ cities: ["Cuenca", "Gualaceo", "Azogues"], dailyBudgetUsd: 15 }),
      "VENDER"
    );
    const consolidated = r.alternatives.find((a) => a.id === "consolidado");
    expect(consolidated?.structure.adSets).toBe(1);
  });

  it("offers a reach-first alternative for a launch", () => {
    const r = recommendStrategy(completeBrief(), "LANZAMIENTO");
    expect(r.alternatives.some((a) => a.id === "alcance")).toBe(true);
  });

  it("every option states a rationale and a tradeoff", () => {
    const r = recommendStrategy(completeBrief({ destinationId: "SITIO_WEB", landingUrl: "https://x.com" }), "VENDER");
    for (const o of [r.recommended, ...r.alternatives]) {
      expect(o.rationale.length).toBeGreaterThan(20);
      expect(o.tradeoff.length).toBeGreaterThan(20);
    }
  });

  it("is deterministic: the same brief yields the same plan", () => {
    const a = recommendStrategy(completeBrief(), "VENDER");
    const b = recommendStrategy(completeBrief(), "VENDER");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("never fabricates a price into the plan", () => {
    const r = recommendStrategy(completeBrief({ priceDisplay: null }), "VENDER");
    // The budget block legitimately quotes dollar figures the operator typed.
    // Everything else — labels, rationales, tradeoffs — must stay free of any
    // currency amount, because the brief gave no price to quote.
    const withoutBudget = JSON.stringify(r, (key, value) =>
      key === "budget" ? undefined : value
    );
    expect(withoutBudget).not.toMatch(/\$\s?\d/);
  });

  it("does not leak a price the operator removed", () => {
    const r = recommendStrategy(completeBrief({ priceDisplay: null }), "VENDER");
    expect(JSON.stringify(r)).not.toContain("399");
  });
});
