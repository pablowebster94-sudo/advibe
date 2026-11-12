# ventADS.ai — Production release gates

This checklist is intentionally separate from the feature implementation. A green Next.js build is not proof that the application is safe for external customers.

## Current verified baseline

- The application uses a single implicit account: `demo@ventads.ai`.
- `proxy.ts` applies Basic Auth globally; this is a temporary access gate, not customer identity.
- Brand and product APIs scope records to the demo user's `userId`.
- Campaign ownership is currently derived indirectly through the product.
- PostgreSQL migrations and database-backed file storage are supported.
- The Preview deployment built successfully on Vercel from `feature/advibe-ai-integration` at commit `e57df10`.

## Required before customer production

### 1. Identity and sessions
- Select and configure a supported identity provider (managed OIDC/Auth service preferred).
- Implement server-verified sessions; never trust a user ID supplied by the browser.
- Protect UI routes and every API route by default; explicitly allow only health, provider callbacks, and signed worker endpoints.
- Add CSRF/origin protections for state-changing cookie-authenticated requests.
- Remove the shared Basic Auth gate only after the replacement is verified.

### 2. Tenant model and authorization
- Add Organization, Membership, and role models with explicit constraints and indexes.
- Add an active organization context to the authenticated session.
- Migrate existing demo-owned records to a designated owner organization with a reversible migration.
- Scope every read, update, delete, upload, campaign, creative, and file lookup by tenant.
- Validate that a product's brand, image, campaign, concept, creative, and stored file all belong to the same tenant.
- Add negative cross-tenant tests for every resource family before launch.

### 3. Production infrastructure
- Verify production PostgreSQL connectivity and apply committed migrations with `npm run db:deploy`.
- Verify `CRON_SECRET`, `APP_URL`, and the Vercel automation bypass arrangement for worker dispatch.
- Verify persistent storage (database or S3-compatible bucket) and upload/read/delete behavior.
- Verify production provider keys server-side without exposing values in logs or health output.
- Confirm Vercel root directory, project protection, function limits, and cron schedule.

### 4. Product and creative QA
- Exercise product creation, upload, campaign creation, job dispatch, retry, regeneration, and export end to end.
- Confirm original product photos, vehicle proportions, license plates, and logos remain unchanged.
- Validate 1:1, 4:5, and 9:16 outputs on mobile and desktop.
- Add rate limits, upload size/type limits, provider cost ceilings, and abuse monitoring.

### 5. Release procedure
- Require CI (lint, tests, production build) to pass.
- Test a protected Preview with non-production data and credentials.
- Review the PR and migration plan.
- Deploy to production only after the owner confirms the identity provider, production database, storage, and provider credentials are configured.
- Keep Meta publishing disabled until a separate permission-reviewed integration is implemented; any future campaign publishing must require explicit human approval and default to paused.

## Important

Do not replace the demo user with a client-supplied email or a random cookie. That would not create authentication or tenant isolation. Do not promote the current Preview to production while the demo identity remains the effective account boundary.
