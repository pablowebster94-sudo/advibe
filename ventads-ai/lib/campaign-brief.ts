/**
 * Maps the CampaignBrief database row to the one shape the strategy engine
 * reads, and validates operator input on the way in.
 *
 * Mirrors lib/product-brief.ts: the engines never touch Prisma rows directly,
 * they read a single normalized type. JSON-encoded list columns (benefits,
 * countries, cities) and Decimal budgets are decoded here, once.
 */
import { isDestinationId, type DestinationId } from "@/lib/catalog/destinations";
import type { CampaignBriefInput } from "@/lib/services/strategy-service";

/** A CampaignBrief row, loosely typed so this module does not depend on the
 *  generated Prisma client's exact Decimal representation. */
export type CampaignBriefRow = {
  offerSummary: string;
  priceDisplay: string | null;
  benefits: string;
  restrictions: string | null;
  destinationId: string;
  whatsappNumber: string | null;
  landingUrl: string | null;
  phoneNumber: string | null;
  countries: string;
  cities: string;
  radiusKm: number | null;
  language: string | null;
  audienceNotes: string | null;
  dailyBudgetUsd: unknown;
  lifetimeBudgetUsd: unknown;
  durationDays: number | null;
};

/** Decodes a JSON array column into trimmed, non-empty strings. A corrupt or
 *  non-array value yields an empty list rather than throwing: a malformed
 *  column must not take down the whole campaign screen. */
export function parseStringList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean);
  }
  if (typeof raw !== "string") return [];
  try {
    return parseStringList(JSON.parse(raw));
  } catch {
    return [];
  }
}

/** Prisma Decimal, number, numeric string or null -> number | null. Rejects
 *  NaN and negatives, which are never a valid budget. */
export function parseMoney(raw: unknown): number | null {
  if (raw == null) return null;
  const value =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw)
        : typeof raw === "object" && raw !== null && "toString" in raw
          ? Number(String(raw))
          : Number.NaN;
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

function text(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

function positiveInt(raw: unknown): number | null {
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

export function toCampaignBriefInput(row: CampaignBriefRow): CampaignBriefInput {
  return {
    offerSummary: row.offerSummary ?? "",
    priceDisplay: text(row.priceDisplay),
    benefits: parseStringList(row.benefits),
    restrictions: text(row.restrictions),
    destinationId: isDestinationId(row.destinationId) ? row.destinationId : "WHATSAPP",
    whatsappNumber: text(row.whatsappNumber),
    landingUrl: text(row.landingUrl),
    phoneNumber: text(row.phoneNumber),
    countries: parseStringList(row.countries),
    cities: parseStringList(row.cities),
    radiusKm: positiveInt(row.radiusKm),
    language: text(row.language),
    audienceNotes: text(row.audienceNotes),
    dailyBudgetUsd: parseMoney(row.dailyBudgetUsd),
    lifetimeBudgetUsd: parseMoney(row.lifetimeBudgetUsd),
    durationDays: positiveInt(row.durationDays),
  };
}

/** The columns a PUT may set, normalized. Unknown keys are dropped, so a
 *  client cannot write to a column the brief does not own. */
export type CampaignBriefPatch = {
  offerSummary?: string;
  priceDisplay?: string | null;
  benefits?: string;
  restrictions?: string | null;
  destinationId?: DestinationId;
  whatsappNumber?: string | null;
  landingUrl?: string | null;
  phoneNumber?: string | null;
  countries?: string;
  cities?: string;
  radiusKm?: number | null;
  language?: string | null;
  audienceNotes?: string | null;
  dailyBudgetUsd?: number | null;
  lifetimeBudgetUsd?: number | null;
  durationDays?: number | null;
};

/**
 * Turns an untrusted request body into a patch. Only recognized fields
 * survive; a bad value becomes null (cleared) rather than an error, except
 * destinationId, which falls back to leaving the column untouched so a typo
 * cannot silently redirect every ad.
 */
export function toCampaignBriefPatch(body: unknown): CampaignBriefPatch {
  const input = (body ?? {}) as Record<string, unknown>;
  const patch: CampaignBriefPatch = {};
  const has = (key: string) => Object.hasOwn(input, key);

  if (has("offerSummary")) patch.offerSummary = String(input.offerSummary ?? "").slice(0, 2000);
  if (has("priceDisplay")) patch.priceDisplay = text(input.priceDisplay);
  if (has("benefits")) patch.benefits = JSON.stringify(parseStringList(input.benefits).slice(0, 20));
  if (has("restrictions")) patch.restrictions = text(input.restrictions);
  if (has("destinationId") && isDestinationId(input.destinationId)) {
    patch.destinationId = input.destinationId;
  }
  if (has("whatsappNumber")) patch.whatsappNumber = text(input.whatsappNumber);
  if (has("landingUrl")) patch.landingUrl = text(input.landingUrl);
  if (has("phoneNumber")) patch.phoneNumber = text(input.phoneNumber);
  if (has("countries")) patch.countries = JSON.stringify(parseStringList(input.countries).slice(0, 20));
  if (has("cities")) patch.cities = JSON.stringify(parseStringList(input.cities).slice(0, 20));
  if (has("radiusKm")) patch.radiusKm = positiveInt(input.radiusKm);
  if (has("language")) patch.language = text(input.language);
  if (has("audienceNotes")) patch.audienceNotes = text(input.audienceNotes);
  if (has("dailyBudgetUsd")) patch.dailyBudgetUsd = parseMoney(input.dailyBudgetUsd);
  if (has("lifetimeBudgetUsd")) patch.lifetimeBudgetUsd = parseMoney(input.lifetimeBudgetUsd);
  if (has("durationDays")) patch.durationDays = positiveInt(input.durationDays);

  return patch;
}
