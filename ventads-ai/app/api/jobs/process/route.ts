import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isWorkerRequestAuthorized } from "@/lib/auth";
import { processClaimedJob } from "@/lib/services/campaign-service";
import { dispatchWorkers } from "@/lib/services/job-dispatch";
import { claimNextJob, hasClaimableWork } from "@/lib/services/job-queue";

export const runtime = "nodejs";
// 180s Gemini timeout (lib/services/providers/gemini-image-provider.ts) plus
// margin for compositing/DB/storage/the next self-chain kick. A job stuck
// past this gets killed mid-flight — recovered later by the cron sweep,
// which resets anything PROCESSING for longer than 5 minutes back to
// PENDING (see app/api/cron/sweep/route.ts).
export const maxDuration = 240;

/**
 * Processes exactly one job per invocation (see AGENTS.md — the original
 * problem this replaces was up to 15 Gemini calls inside a single request).
 * Auth-gated: only Vercel Cron (auto-attaches CRON_SECRET) and our own
 * self-chain kicks (lib/services/job-dispatch.ts) may call this.
 */
export async function POST(request: Request) {
  if (!isWorkerRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  const campaignId = typeof body.campaignId === "string" ? body.campaignId : undefined;
  const invocationId = randomUUID();

  const job = await claimNextJob({ campaignId, claimedBy: invocationId });
  if (!job) {
    return NextResponse.json({ claimed: false }, { status: 200 });
  }

  await processClaimedJob(job.id);

  // Keep this chain's lane alive while there's more work for it to do.
  if (await hasClaimableWork(campaignId)) {
    dispatchWorkers(campaignId, 1);
  }

  return NextResponse.json({ claimed: true, jobId: job.id }, { status: 200 });
}
