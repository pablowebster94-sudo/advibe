import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isWorkerRequestAuthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { finalizeCampaignIfDone, processClaimedJob } from "@/lib/services/campaign-service";
import { claimNextJob } from "@/lib/services/job-queue";

export const runtime = "nodejs";
export const maxDuration = 240;

// Comfortably longer than a worker's own maxDuration (240s) — anything
// still PROCESSING past this was almost certainly killed mid-flight
// (function timeout, crash, deploy) rather than genuinely still running.
const ABANDONED_THRESHOLD_MS = 5 * 60 * 1000;

// How many globally-pending jobs this sweep drains directly per run, as a
// backstop for chains that never started (e.g. every kick for a campaign
// failed — see the recovery test in ARCHITECTURE.md). Small and bounded so
// one sweep invocation can't run long even with a large backlog; the next
// scheduled run picks up where this one left off.
const SWEEP_BATCH_SIZE = 5;

/**
 * Safety net, not the primary dispatch mechanism (see ARCHITECTURE.md →
 * "Async job queue" for why: Vercel Cron's minimum interval is once/day on
 * Hobby, so it can't be relied on for timely dispatch). Configured in
 * vercel.json. Three jobs:
 *   1. Reclaim PROCESSING jobs abandoned by a dead/killed worker.
 *   2. Finalize any campaign whose status never got closed out.
 *   3. Drain a small batch of otherwise-orphaned PENDING jobs directly.
 */
export async function GET(request: Request) {
  if (!isWorkerRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staleThreshold = new Date(Date.now() - ABANDONED_THRESHOLD_MS);
  const reclaimed = await prisma.creative.updateMany({
    where: { status: "PROCESSING", claimedAt: { lt: staleThreshold } },
    data: {
      status: "PENDING",
      claimedAt: null,
      claimedBy: null,
      error: "Recuperado tras timeout del worker.",
    },
  });

  const openCampaigns = await prisma.campaign.findMany({
    where: { status: "PENDING" },
    select: { id: true },
  });
  for (const campaign of openCampaigns) {
    await finalizeCampaignIfDone(campaign.id);
  }

  let processed = 0;
  for (let i = 0; i < SWEEP_BATCH_SIZE; i++) {
    const job = await claimNextJob({ claimedBy: `sweep-${randomUUID()}` });
    if (!job) break;
    await processClaimedJob(job.id);
    processed++;
  }

  return NextResponse.json(
    { reclaimed: reclaimed.count, campaignsChecked: openCampaigns.length, processed },
    { status: 200 }
  );
}
