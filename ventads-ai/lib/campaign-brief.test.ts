import { describe, expect, it } from "vitest";
import {
  parseMoney,
  parseStringList,
  toCampaignBriefInput,
  toCampaignBriefPatch,
  type CampaignBriefRow,
} from "@/lib/campaign-brief";

function row(overrides: Partial<CampaignBriefRow> = {}): CampaignBriefRow {
  return {
    offerSummary: "Sofá de 3 puestos",
    priceDisplay: "$399",
    benefits: '["Entrega en 48 horas"]',
    restrictions: null,
    destinationId: "WHATSAPP",
    whatsappNumber: "+593999999999",
    landingUrl: null,
    phoneNumber: null,
    countries: '["Ecuador"]',
    cities: '["Cuenca"]',
    radiusKm: 25,
    language: "es",
    audienceNotes: null,
    dailyBudgetUsd: "20.00",
    lifetimeBudgetUsd: null,
    durationDays: 14,
    ...overrides,
  };
}

describe("parseStringList", () => {
  it("decodes a JSON array string", () => {
    expect(parseStringList('["a","b"]')).toEqual(["a", "b"]);
  });
  it("accepts an array directly", () => {
    expect(parseStringList(["a", "b"])).toEqual(["a", "b"]);
  });
  it("trims and drops empty entries", () => {
    expect(parseStringList('["  a  ","","  "]')).toEqual(["a"]);
  });
  it("drops non-string entries", () => {
    expect(parseStringList('["a",3,null]')).toEqual(["a"]);
  });
  it("returns an empty list for corrupt JSON instead of throwing", () => {
    expect(parseStringList("{not json")).toEqual([]);
  });
  it("returns an empty list for a JSON object", () => {
    expect(parseStringList('{"a":1}')).toEqual([]);
  });
  it("returns an empty list for null", () => {
    expect(parseStringList(null)).toEqual([]);
  });
});

describe("parseMoney", () => {
  it("accepts a numeric string, as Prisma Decimal serializes", () => {
    expect(parseMoney("20.00")).toBe(20);
  });
  it("accepts a number", () => {
    expect(parseMoney(12.5)).toBe(12.5);
  });
  it("accepts an object with toString, like a Decimal instance", () => {
    expect(parseMoney({ toString: () => "35.5" })).toBe(35.5);
  });
  it("returns null for null", () => {
    expect(parseMoney(null)).toBeNull();
  });
  it("rejects a negative budget", () => {
    expect(parseMoney(-5)).toBeNull();
  });
  it("rejects a non-numeric string", () => {
    expect(parseMoney("gratis")).toBeNull();
  });
});

describe("toCampaignBriefInput", () => {
  it("decodes a full row", () => {
    const input = toCampaignBriefInput(row());
    expect(input.benefits).toEqual(["Entrega en 48 horas"]);
    expect(input.cities).toEqual(["Cuenca"]);
    expect(input.dailyBudgetUsd).toBe(20);
    expect(input.destinationId).toBe("WHATSAPP");
  });

  it("falls back to WhatsApp for an unknown destination", () => {
    expect(toCampaignBriefInput(row({ destinationId: "TIKTOK" })).destinationId).toBe("WHATSAPP");
  });

  it("turns blank text into null so missing-info detection sees it as absent", () => {
    const input = toCampaignBriefInput(row({ priceDisplay: "   ", audienceNotes: "" }));
    expect(input.priceDisplay).toBeNull();
    expect(input.audienceNotes).toBeNull();
  });

  it("rejects a zero or negative radius", () => {
    expect(toCampaignBriefInput(row({ radiusKm: 0 })).radiusKm).toBeNull();
    expect(toCampaignBriefInput(row({ radiusKm: -3 })).radiusKm).toBeNull();
  });
});

describe("toCampaignBriefPatch", () => {
  it("keeps only recognized fields", () => {
    const patch = toCampaignBriefPatch({ offerSummary: "Algo", campaignId: "hack", id: "hack" });
    expect(patch).toEqual({ offerSummary: "Algo" });
  });

  it("distinguishes an absent field from a cleared one", () => {
    expect(toCampaignBriefPatch({})).toEqual({});
    expect(toCampaignBriefPatch({ priceDisplay: null })).toEqual({ priceDisplay: null });
  });

  it("re-encodes lists as JSON", () => {
    expect(toCampaignBriefPatch({ cities: ["Cuenca", " Gualaceo "] }).cities).toBe(
      '["Cuenca","Gualaceo"]'
    );
  });

  it("ignores an invalid destination rather than redirecting every ad", () => {
    expect(toCampaignBriefPatch({ destinationId: "TIKTOK" })).toEqual({});
  });

  it("accepts a valid destination", () => {
    expect(toCampaignBriefPatch({ destinationId: "SITIO_WEB" }).destinationId).toBe("SITIO_WEB");
  });

  it("clears a budget that is not a usable number", () => {
    expect(toCampaignBriefPatch({ dailyBudgetUsd: "mucho" }).dailyBudgetUsd).toBeNull();
  });

  it("caps the offer summary length", () => {
    const patch = toCampaignBriefPatch({ offerSummary: "x".repeat(5000) });
    expect(patch.offerSummary?.length).toBe(2000);
  });

  it("caps list length", () => {
    const patch = toCampaignBriefPatch({ cities: Array.from({ length: 50 }, (_, i) => `c${i}`) });
    expect(JSON.parse(patch.cities!)).toHaveLength(20);
  });
});
