import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MetaNotConfiguredError,
  MetaNotImplementedError,
  metaConfiguration,
  publishPausedCampaign,
} from "@/lib/services/meta/meta-ads-service";

const KEYS = [
  "META_SYSTEM_USER_TOKEN",
  "META_AD_ACCOUNT_ID",
  "META_PAGE_ID",
  "META_INSTAGRAM_ACCOUNT_ID",
];

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

function configureBase() {
  process.env.META_SYSTEM_USER_TOKEN = "token";
  process.env.META_AD_ACCOUNT_ID = "act_1";
  process.env.META_PAGE_ID = "page_1";
}

describe("metaConfiguration", () => {
  it("reports every base credential as missing when nothing is set", () => {
    const config = metaConfiguration();
    expect(config.configured).toBe(false);
    expect(config.missing.map((m) => m.key)).toEqual([
      "META_SYSTEM_USER_TOKEN",
      "META_AD_ACCOUNT_ID",
      "META_PAGE_ID",
    ]);
  });

  it("explains how to supply each missing credential", () => {
    for (const requirement of metaConfiguration().missing) {
      expect(requirement.how.length).toBeGreaterThan(20);
      expect(requirement.label.length).toBeGreaterThan(3);
    }
  });

  it("is configured once the base credentials are present", () => {
    configureBase();
    expect(metaConfiguration().configured).toBe(true);
  });

  it("treats a blank value as missing", () => {
    configureBase();
    process.env.META_PAGE_ID = "   ";
    expect(metaConfiguration().missing.map((m) => m.key)).toEqual(["META_PAGE_ID"]);
  });

  it("demands an Instagram account only for the Instagram destination", () => {
    configureBase();
    expect(metaConfiguration("WHATSAPP").configured).toBe(true);
    expect(metaConfiguration("MENSAJES_IG").missing.map((m) => m.key)).toEqual([
      "META_INSTAGRAM_ACCOUNT_ID",
    ]);
  });

  it("never returns a credential's value", () => {
    process.env.META_PAGE_ID = "super-secreto";
    expect(JSON.stringify(metaConfiguration())).not.toContain("super-secreto");
  });
});

describe("publishPausedCampaign", () => {
  const request = {
    campaignId: "c1",
    destinationId: "WHATSAPP" as const,
    metaObjective: "OUTCOME_ENGAGEMENT",
    dailyBudgetUsd: 20,
    adSets: 1,
  };

  it("refuses and names what is missing when Meta is not connected", async () => {
    await expect(publishPausedCampaign(request)).rejects.toBeInstanceOf(MetaNotConfiguredError);
    const error = await publishPausedCampaign(request).catch((e) => e);
    expect(error.missing.map((m: { key: string }) => m.key)).toContain("META_SYSTEM_USER_TOKEN");
  });

  it("never reports a fake success once configured", async () => {
    configureBase();
    await expect(publishPausedCampaign(request)).rejects.toBeInstanceOf(MetaNotImplementedError);
  });
});
