import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { claimNextJob } from "@/lib/services/job-queue";

async function makeCampaignWithJobs(count: number, campaignSuffix: string = randomUUID()) {
  const user = await prisma.user.create({
    data: { email: `test-${randomUUID()}@ventads.ai` },
  });
  const product = await prisma.product.create({
    data: { userId: user.id, category: "vehiculos", name: `Test Product ${campaignSuffix}` },
  });
  const campaign = await prisma.campaign.create({
    data: { productId: product.id, objective: "VENDER", style: "COMERCIAL" },
  });
  const concept = await prisma.concept.create({
    data: { campaignId: campaign.id, type: "VENTA_DIRECTA", label: "Venta directa" },
  });

  const creatives = [];
  for (let i = 0; i < count; i++) {
    creatives.push(
      await prisma.creative.create({
        data: { conceptId: concept.id, format: `FORMAT_${i}` },
      })
    );
  }

  return { user, product, campaign, concept, creatives };
}

// Every table this suite touches, in FK-safe delete order.
async function resetDb() {
  await prisma.creative.deleteMany();
  await prisma.copyVariant.deleteMany();
  await prisma.concept.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.user.deleteMany();
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
});

describe("claimNextJob", () => {
  it("claims a PENDING job and marks it PROCESSING", async () => {
    const { creatives } = await makeCampaignWithJobs(1);

    const claimed = await claimNextJob({ claimedBy: "worker-a" });

    expect(claimed).not.toBeNull();
    expect(claimed?.id).toBe(creatives[0].id);
    expect(claimed?.status).toBe("PROCESSING");
    expect(claimed?.claimedBy).toBe("worker-a");
    expect(claimed?.attempts).toBe(1);
    expect(claimed?.claimedAt).not.toBeNull();
    expect(claimed?.startedAt).not.toBeNull();
  });

  it("returns null when there is nothing claimable", async () => {
    const claimed = await claimNextJob({ claimedBy: "worker-a" });
    expect(claimed).toBeNull();
  });

  it("never claims a job that is already PROCESSING", async () => {
    const { creatives } = await makeCampaignWithJobs(1);
    await prisma.creative.update({
      where: { id: creatives[0].id },
      data: { status: "PROCESSING", claimedBy: "worker-a" },
    });

    const claimed = await claimNextJob({ claimedBy: "worker-b" });
    expect(claimed).toBeNull();
  });

  it("never claims a job that is already COMPLETED", async () => {
    const { creatives } = await makeCampaignWithJobs(1);
    await prisma.creative.update({
      where: { id: creatives[0].id },
      data: { status: "COMPLETED" },
    });

    const claimed = await claimNextJob({ claimedBy: "worker-a" });
    expect(claimed).toBeNull();
  });

  it("re-claims a FAILED job (retriable) but not once attempts reach maxAttempts", async () => {
    const { creatives } = await makeCampaignWithJobs(1);
    await prisma.creative.update({
      where: { id: creatives[0].id },
      data: { status: "FAILED", attempts: 2, maxAttempts: 3 },
    });

    const claimed = await claimNextJob({ claimedBy: "worker-a" });
    expect(claimed?.status).toBe("PROCESSING");
    expect(claimed?.attempts).toBe(3);

    // Now exhausted: a subsequent failure would leave attempts === maxAttempts.
    await prisma.creative.update({
      where: { id: creatives[0].id },
      data: { status: "FAILED" }, // attempts stays 3, maxAttempts stays 3
    });
    const exhausted = await claimNextJob({ claimedBy: "worker-b" });
    expect(exhausted).toBeNull();
  });

  it("does not claim a job whose nextAttemptAt is in the future, but does once it has passed", async () => {
    const { creatives } = await makeCampaignWithJobs(1);
    const future = new Date(Date.now() + 60_000);
    await prisma.creative.update({
      where: { id: creatives[0].id },
      data: { status: "PENDING", nextAttemptAt: future },
    });

    expect(await claimNextJob({ claimedBy: "worker-a" })).toBeNull();

    await prisma.creative.update({
      where: { id: creatives[0].id },
      data: { nextAttemptAt: new Date(Date.now() - 1000) },
    });
    expect(await claimNextJob({ claimedBy: "worker-a" })).not.toBeNull();
  });

  it("scopes claims to campaignId when provided", async () => {
    const { campaign: campaignA, creatives: creativesA } = await makeCampaignWithJobs(1, "a");
    const { creatives: creativesB } = await makeCampaignWithJobs(1, "b");

    const claimed = await claimNextJob({ claimedBy: "worker-a", campaignId: campaignA.id });

    expect(claimed?.id).toBe(creativesA[0].id);
    expect(claimed?.id).not.toBe(creativesB[0].id);

    // The other campaign's job is untouched.
    const untouched = await prisma.creative.findUniqueOrThrow({ where: { id: creativesB[0].id } });
    expect(untouched.status).toBe("PENDING");
  });

  it("race guard: a losing claim on an already-claimed row returns null, never double-claims", async () => {
    const { creatives } = await makeCampaignWithJobs(1);

    const first = await claimNextJob({ claimedBy: "worker-a" });
    expect(first?.status).toBe("PROCESSING");

    // Simulates a second worker whose candidate-selection read the row
    // while it was still PENDING, then lost the race to claim it.
    const second = await claimNextJob({ claimedBy: "worker-b" });
    expect(second).toBeNull();

    const row = await prisma.creative.findUniqueOrThrow({ where: { id: creatives[0].id } });
    expect(row.claimedBy).toBe("worker-a");
    expect(row.attempts).toBe(1); // only incremented once, not twice
  });

  it("concurrency stress: N concurrent claimers against M jobs claim each job exactly once", async () => {
    const jobCount = 8;
    const workerCount = 20;
    const { creatives } = await makeCampaignWithJobs(jobCount);

    const results = await Promise.all(
      Array.from({ length: workerCount }, (_, i) => claimNextJob({ claimedBy: `worker-${i}` }))
    );

    const successful = results.filter((result) => result !== null);
    expect(successful).toHaveLength(jobCount);

    const claimedIds = successful.map((result) => result!.id);
    expect(new Set(claimedIds).size).toBe(jobCount); // no id claimed twice
    expect(new Set(claimedIds)).toEqual(new Set(creatives.map((creative) => creative.id)));

    // Every underlying row landed on exactly one attempt and one claimant.
    const rows = await prisma.creative.findMany({ where: { id: { in: claimedIds } } });
    for (const row of rows) {
      expect(row.status).toBe("PROCESSING");
      expect(row.attempts).toBe(1);
    }
  });
});
