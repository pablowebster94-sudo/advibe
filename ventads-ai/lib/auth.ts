import { prisma } from "@/lib/db";

const DEMO_USER_EMAIL = "demo@ventads.ai";

/**
 * ventADS.ai has no real auth yet (MVP scope). Every record still carries a
 * userId so multi-tenant auth can be dropped in later without a data model
 * change — this resolves the single implicit demo user, creating it on
 * first use.
 */
export async function getCurrentUser() {
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
  });
  if (existing) return existing;

  return prisma.user.create({
    data: { email: DEMO_USER_EMAIL, name: "Demo" },
  });
}

/**
 * Shared auth check for the worker (`/api/jobs/process`) and the cron
 * sweep (`/api/cron/sweep`): both require `Authorization: Bearer
 * ${CRON_SECRET}`. Vercel Cron sends this header automatically once
 * CRON_SECRET is set as an env var; our own self-chain kicks
 * (lib/services/job-dispatch.ts) add it manually. Fails closed — if
 * CRON_SECRET isn't configured at all, every request is rejected rather
 * than the route silently accepting unauthenticated callers.
 */
export function isWorkerRequestAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
