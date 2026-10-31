# ventADS.ai — readiness and deployment boundaries

This document records the deployment contract for the independent `ventads-ai/` app.

## Isolation

- Vercel Root Directory must be `ventads-ai`.
- Do not attach this directory to the existing `advibe-control` Vercel project: that project serves the AdVibe marketing site.
- Preview deployment is the first deployment target. Production is intentionally not wired until runtime secrets and persistent services are configured.

## Runtime requirements

Required for a functional production-like deployment:

- `DATABASE_URL`: PostgreSQL connection string for Prisma 7.
- `CRON_SECRET`: random secret used by worker and cron endpoints.
- `BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD`: shared UI gate for this single-tenant MVP. Never use the demo password from local examples.
- `APP_URL`: stable public URL of the VentADS deployment, not a per-deployment URL.
- Persistent storage: `STORAGE_PROVIDER=s3` and S3-compatible credentials, or another explicitly configured durable provider. The local filesystem is not persistent across Vercel function invocations.
- `GEMINI_API_KEY`: optional; required only when `IMAGE_PROVIDER=gemini`. The application falls back to the local compositor if Gemini generation fails.

## Important architecture status

The current app is not yet the earlier Supabase Auth/RLS blueprint. It currently uses:
- Next.js 16 / React 19.
- Prisma 7 with PostgreSQL.
- A single implicit demo user (`demo@ventads.ai`).
- HTTP Basic Auth for the entire UI.
- A server-side Gemini image provider with local-compositor fallback.

Do not describe this as multi-tenant or Supabase-authenticated until those modules are implemented and tested.

## Safe deployment order

1. Configure a separate Vercel project named `ventads-ai`, linked to this repository, Root Directory `ventads-ai`.
2. Configure Preview environment variables with a disposable/test PostgreSQL database and private durable object storage.
3. Run committed Prisma migrations against that test database.
4. Deploy a Preview, validate `/api/health`, sign-in gate, upload, campaign generation, Gemini (when enabled), creative serving and ZIP export.
5. Configure Production separately after Preview verification. Do not point this app at the AdVibe site's database or secrets.

## Verification

Use `npm ci`, `npm run db:generate`, `npm run lint`, `npm test`, and `npm run build` from this directory. Tests require a separate `TEST_DATABASE_URL`; never run the test migration against production data.
