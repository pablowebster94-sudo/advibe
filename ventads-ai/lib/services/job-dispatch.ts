import { after } from "next/server";

/**
 * Resolves this app's own public URL for the self-chaining worker kick.
 * Deliberately NOT `VERCEL_URL` (that's the current deployment's unique
 * URL, which changes on every deploy/preview) — `APP_URL` must be set
 * explicitly in production. Falls back to localhost only outside
 * production, where "this app's own URL" is unambiguous.
 */
function resolveAppUrl(): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") {
    return `http://localhost:${process.env.PORT ?? "3000"}`;
  }
  throw new Error(
    "APP_URL no está configurada. En producción es obligatoria — debe ser el dominio público de la app (no VERCEL_URL, que cambia por deployment)."
  );
}

function jobConcurrency(): number {
  const raw = Number(process.env.JOB_CONCURRENCY ?? "1");
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
}

/**
 * Fires one worker-kick request. Always fire-and-forget by design: a
 * failed kick (misconfigured APP_URL, network blip, Deployment Protection
 * intercepting the call, the worker being briefly unreachable) must never
 * throw back into the caller — it leaves the affected jobs safely PENDING,
 * recoverable by the next successful kick (another dispatch, the
 * poll-triggered self-heal, or the cron sweep). Logged loudly so a
 * systemic misconfiguration (e.g. missing APP_URL) is visible in server
 * logs rather than silently swallowed.
 */
async function kickWorker(body: { campaignId?: string }) {
  try {
    const url = `${resolveAppUrl()}/api/jobs/process`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) headers["Authorization"] = `Bearer ${cronSecret}`;

    // Only relevant if Vercel Deployment Protection is enabled on this
    // project; harmless (and unused) otherwise.
    const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (bypass) headers["x-vercel-protection-bypass"] = bypass;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error(
        `[job-dispatch] worker kick returned ${response.status} for`,
        JSON.stringify(body)
      );
    }
  } catch (error) {
    console.error("[job-dispatch] worker kick failed:", error, "payload:", JSON.stringify(body));
  }
}

/**
 * Starts `lanes` parallel, self-perpetuating worker chains (each chain
 * processes one job per invocation, then re-kicks itself while there's more
 * claimable work — see app/api/jobs/process/route.ts). Scoping to a
 * campaignId keeps a chain focused on that campaign's own jobs; omitting it
 * lets a chain claim from anywhere (used by the cron sweep).
 *
 * Uses Next.js `after()` so the kick is sent without delaying the response
 * — this works identically in `next start` (self-hosted/local) and on
 * Vercel, where it's backed by the platform's `waitUntil`.
 */
export function dispatchWorkers(campaignId?: string, lanes = 1) {
  for (let i = 0; i < lanes; i++) {
    after(() => kickWorker(campaignId ? { campaignId } : {}));
  }
}

export function currentJobConcurrency() {
  return jobConcurrency();
}
