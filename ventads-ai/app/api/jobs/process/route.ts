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
const CLAIM_WINDOW_MS = 45_000;

/**
 * Processes jobs one at a time for up to CLAIM_WINDOW_MS per invocation
 * (the original problem this replaces was up to 15 Gemini calls inside the
 * user's own request, with no retry story).
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

  // Several jobs per invocation, not one: each self-chain kick is a function
  // calling its own deployment, and a stopped chain leaves a campaign stuck
  // until something kicks it again. A new job is only claimed while
  // CLAIM_WINDOW_MS has not elapsed, so even a slow provider call started at
  // the end of the window (Gemini's own timeout is 180s) ends inside
  // maxDuration.
  const startedAt = Date.now();
  const processed: string[] = [];
  while (Date.now() - startedAt < CLAIM_WINDOW_MS) {
    const job = await claimNextJob({ campaignId, claimedBy: invocationId });
    if (!job) break;
    await processClaimedJob(job.id);
    processed.push(job.id);
  }
  if (processed.length === 0) {
    return NextResponse.json({ claimed: false }, { status: 200 });
  }

  // Keep this chain's lane alive while there's more work for it to do.
  if (await hasClaimableWork(campaignId)) {
    dispatchWorkers(campaignId, 1);
  }

  return NextResponse.json({ claimed: true, jobIds: processed }, { status: 200 });
}
