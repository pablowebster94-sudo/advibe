import { prisma } from "@/lib/db";
import type { Creative } from "@/generated/prisma/client";

/** Statuses a job can be claimed from. PROCESSING/COMPLETED are never claimable. */
const CLAIMABLE_STATUSES = ["PENDING", "FAILED"] as const;

/** How many candidates to fetch per round. */
const CANDIDATE_BATCH_SIZE = 20;

/**
 * How many times to re-fetch a fresh candidate batch after losing every race
 * in the current one. A single static batch isn't enough under real
 * contention: if N workers all fetch the same (still-unclaimed) top-20
 * candidates and each loses some races, the jobs ranked below the batch
 * size are never even considered unless the batch is re-fetched — a worker
 * must be able to discover newly-uncontested jobs, not just retry the ones
 * it already saw.
 */
const MAX_CLAIM_ROUNDS = 10;

export type ClaimResult = Creative;

/**
 * Atomically claims the next available generation job (a Creative row) and
 * marks it PROCESSING, or returns null if there's nothing to claim right
 * now.
 *
 * Race-safety: candidate selection (findMany) and the claim itself
 * (updateMany) are two separate steps, but the claim's WHERE clause
 * re-checks `status IN (PENDING, FAILED)` on the specific row. If two
 * callers pick the same candidate, only one `updateMany` can see the row
 * still in a claimable status — PostgreSQL's row-level locking guarantees
 * the loser's UPDATE matches zero rows once the winner's UPDATE has
 * committed. No raw SQL, no `SELECT ... FOR UPDATE SKIP LOCKED` needed —
 * this pattern only uses Prisma's standard query API, and is verified
 * under real concurrency against Postgres itself in `job-queue.test.ts`.
 * See ARCHITECTURE.md → "Async job queue" for the fuller rationale.
 *
 * `attempts < maxAttempts` is a same-row column comparison, which Prisma's
 * filter API can't express directly — it's applied in application code
 * after fetching a small batch of candidates, rather than reaching for raw
 * SQL for what is only a read (never the correctness-critical part).
 */
export async function claimNextJob({
  campaignId,
  claimedBy,
}: {
  /** Scope the claim to one campaign's jobs (used by the self-chain dispatcher). Omit to claim from anywhere (used by the sweep). */
  campaignId?: string;
  /** Opaque id of the claiming invocation, stored for observability only. */
  claimedBy: string;
}): Promise<ClaimResult | null> {
  for (let round = 0; round < MAX_CLAIM_ROUNDS; round++) {
    const now = new Date();

    const candidates = await prisma.creative.findMany({
      where: {
        status: { in: [...CLAIMABLE_STATUSES] },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        ...(campaignId ? { concept: { campaignId } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: CANDIDATE_BATCH_SIZE,
    });

    if (candidates.length === 0) return null; // nothing claimable at all, no point retrying

    const eligible = candidates.filter((candidate) => candidate.attempts < candidate.maxAttempts);

    for (const candidate of eligible) {
      const claim = await prisma.creative.updateMany({
        where: { id: candidate.id, status: { in: [...CLAIMABLE_STATUSES] } },
        data: {
          status: "PROCESSING",
          claimedAt: now,
          claimedBy,
          startedAt: now,
          attempts: { increment: 1 },
        },
      });

      if (claim.count === 1) {
        return prisma.creative.findUniqueOrThrow({ where: { id: candidate.id } });
      }
      // Lost the race on this candidate (another caller claimed it first) — try the next one.
    }

    // Every candidate in this batch was claimed by someone else between our
    // read and our writes — re-fetch a fresh batch rather than giving up;
    // there may be uncontested jobs outside this batch now.
  }

  return null;
}

/**
 * Whether there's any claimable (PENDING/retriable-FAILED, backoff elapsed)
 * job left. Same same-row `attempts < maxAttempts` limitation as
 * `claimNextJob` — filtered in application code over a bounded batch
 * rather than expressed in the WHERE clause.
 */
export async function hasClaimableWork(campaignId?: string): Promise<boolean> {
  const now = new Date();
  const candidates = await prisma.creative.findMany({
    where: {
      status: { in: [...CLAIMABLE_STATUSES] },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      ...(campaignId ? { concept: { campaignId } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: CANDIDATE_BATCH_SIZE,
    select: { attempts: true, maxAttempts: true },
  });
  return candidates.some((row) => row.attempts < row.maxAttempts);
}

/**
 * True when a campaign has claimable work but no job currently being
 * processed (nothing PROCESSING claimed within `activeWindowMs`) — i.e. its
 * worker chain has stopped. Used by the results polling to restart it.
 */
export async function isCampaignStalled(campaignId: string, activeWindowMs = 30_000): Promise<boolean> {
  const active = await prisma.creative.count({
    where: {
      status: "PROCESSING",
      claimedAt: { gte: new Date(Date.now() - activeWindowMs) },
      concept: { campaignId },
    },
  });
  if (active > 0) return false;
  return hasClaimableWork(campaignId);
}

/**
 * A job left PROCESSING longer than any healthy run takes was abandoned by a
 * worker that died mid-flight (timeout, crash, out of memory, redeploy).
 * Puts it back in the queue — or marks it FAILED once it has used all its
 * attempts, so a job that keeps killing its worker can never block its
 * campaign forever. Returns how many jobs were requeued / failed.
 */
export const ABANDONED_JOB_MS = 3 * 60 * 1000;

export async function reclaimAbandonedJobs({
  campaignId,
  olderThanMs = ABANDONED_JOB_MS,
}: { campaignId?: string; olderThanMs?: number } = {}): Promise<{ requeued: number; failed: number }> {
  const stale = await prisma.creative.findMany({
    where: {
      status: "PROCESSING",
      claimedAt: { lt: new Date(Date.now() - olderThanMs) },
      ...(campaignId ? { concept: { campaignId } } : {}),
    },
    select: { id: true, attempts: true, maxAttempts: true },
    take: 50,
  });

  let requeued = 0;
  let failed = 0;
  for (const job of stale) {
    const exhausted = job.attempts >= job.maxAttempts;
    // Re-checks PROCESSING so a worker that finishes right now wins the race.
    const result = await prisma.creative.updateMany({
      where: { id: job.id, status: "PROCESSING" },
      data: exhausted
        ? { status: "FAILED", error: "El worker se detuvo varias veces procesando este creative." }
        : { status: "PENDING", claimedAt: null, claimedBy: null, error: "Recuperado tras detenerse el worker." },
    });
    if (result.count === 1) {
      if (exhausted) failed++;
      else requeued++;
    }
  }
  return { requeued, failed };
}
