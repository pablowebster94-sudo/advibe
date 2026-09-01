# Architecture

## Independence from AdVibe

This directory (`ventads-ai/`) is a self-contained Next.js project: its own
`package.json`, `tsconfig.json`, lockfile, database, and storage. It happens
to live inside the same git repository as the AdVibe marketing site (at the
repo root) because that's where the working environment for this task was
set up, but the two share nothing at runtime or build time. `next.config.ts`
pins `turbopack.root` to this directory specifically so tooling never
reaches into the sibling project.

## Request flow

```
PRODUCTO → INFORMACIÓN → ANÁLISIS → ESTRATEGIA → CONCEPTO → DISEÑO → COPY → FORMATOS → VARIANTES → EXPORTACIÓN
```

Concretely, `POST /api/campaigns` runs
`lib/services/campaign-service.ts#createCampaignJobs`, which:

1. Loads the `Product` (+ `Brand`, + `ProductImage`s) and builds a
   `ProductBrief` (`lib/product-brief.ts`) — a normalized, Prisma-free view
   every downstream engine reads from.
2. `lib/services/analysis-engine.ts` inspects the brief and decides what to
   emphasize (top features, primary benefit, differentiating feature,
   recommended CTA) and what's missing — it never invents facts.
3. `lib/services/concept-engine.ts` turns that analysis into a set of
   creative angles (`ConceptPlan[]`), skipping angles the data can't
   support (e.g. no OFERTA concept without a price or offer).
4. `lib/services/copy-service.ts` generates headline/primary text/
   description/CTA/short/long copy per concept, template-based, tracking
   `missingInfo` instead of fabricating anything.
5. Persists `Concept` + `CopyVariant` rows, and one `Creative` row per
   concept × format in status `PENDING` — **no image is generated in this
   request.** Image generation is a background job; see "Async job queue"
   below. The route returns as soon as these rows exist (real p50 in local
   testing: well under 100ms).

Regenerating a single creative (`POST /api/creatives/:id/regenerate`)
creates one more `PENDING` `Creative` row (bumped `version`, same concept +
format) and returns immediately (202) — old versions are kept, never
overwritten, and it goes through the same job queue as a fresh campaign.

## Async job queue

**Why:** a campaign can have up to 5 concepts × 3 formats = 15 creatives.
Generating them synchronously inside `POST /api/campaigns` — the original
MVP design — means up to 15 sequential calls to an image provider inside
one HTTP request. Even with Vercel's Fluid Compute `maxDuration` ceilings
(300s Hobby, 800s Pro), a slow or rate-limited provider could blow through
that easily, and there is no retry story for a request that times out
mid-way. Every job now runs as its own, independent invocation instead.

### Job = Creative row

There's no separate `Job` table. A job and the creative it produces are
1:1 forever, so `Creative` carries the job-tracking fields directly:
`status` (`PENDING → PROCESSING → COMPLETED`, or back to `PENDING` with
backoff / on to terminal `FAILED`), `attempts`/`maxAttempts`, `claimedAt`/
`claimedBy` (invocation id, observability only), `nextAttemptAt` (backoff),
`startedAt`/`completedAt`.

### Atomic claim (`lib/services/job-queue.ts#claimNextJob`)

Portable across SQLite and PostgreSQL using only Prisma's standard query
API — no raw SQL, no `SELECT ... FOR UPDATE SKIP LOCKED`. Candidate
selection (`findMany`) and the claim (`updateMany`) are separate steps, but
the claim's `WHERE` re-checks `status IN (PENDING, FAILED)` on that exact
row — if two callers picked the same candidate, only one `updateMany` can
still see it claimable; the loser's update matches zero rows. Verified
under real concurrency in `job-queue.test.ts`: 20 concurrent claimers
against 8 jobs claim each exactly once. That test caught a real bug on
first run (a single static candidate batch meant jobs ranked below the
batch size were never reconsidered once contested — fixed by re-fetching
across up to 10 rounds instead of giving up after one).

### Dispatch (`lib/services/job-dispatch.ts`)

Not Vercel Cron as the primary mechanism — its minimum interval is once a
day on the Hobby plan, unusable for timely dispatch. Instead: **self-
perpetuating HTTP chains.** `POST /api/campaigns` (and regenerate) fire
`JOB_CONCURRENCY` (default 1, tested at 3) parallel kicks to `POST
/api/jobs/process`; each invocation claims and processes exactly one job,
then — if there's more claimable work for that campaign — kicks itself
again before returning. This is deliberately the *only* mechanism that
needs `waitUntil`-style durability, and only for one thing: making sure the
kick's `fetch()` is actually sent before the invocation's response flushes
and the process may be frozen/recycled. Uses Next.js's `after()` (from
`next/server`), which works identically self-hosted (`next start`) and on
Vercel (backed by the platform's `waitUntil` there).

**`after()`/`waitUntil()` is explicitly NOT the durability mechanism for
the job itself** — it only extends one invocation's lifetime up to its own
`maxDuration`; if the process dies (deploy, crash, platform hiccup) mid-way
for any reason, anything not yet persisted is gone, no retry, no trace.
Durability comes entirely from persisting `PENDING` rows in Postgres/SQLite
*before* any dispatch is attempted — a kick can fail for any reason
(network blip, misconfigured `APP_URL`, Deployment Protection intercepting
the call) and the affected jobs simply stay `PENDING`, safely recoverable
by the next successful kick from anywhere (another dispatch, the sweep).
Kicks never throw back into their caller; failures are logged
(`[job-dispatch] worker kick failed: ...`) and swallowed by design.

`APP_URL` (not `VERCEL_URL`, which is per-deployment and changes on every
deploy/preview) must be set explicitly in production — `lib/services/job-
dispatch.ts#resolveAppUrl` throws if it's missing there (defaults to
`http://localhost:3000` outside production). If the project has Vercel
Deployment Protection enabled, its SSO/password gate would otherwise
intercept our own self-chain calls silently; setting
`VERCEL_AUTOMATION_BYPASS_SECRET` (auto-injected once you configure
"Protection Bypass for Automation" in the Vercel project) makes the
dispatcher send `x-vercel-protection-bypass` automatically — harmless and
unused if Deployment Protection is off.

### Worker (`POST /api/jobs/process`)

Auth-gated by `CRON_SECRET` (`Authorization: Bearer`, checked by
`lib/auth.ts#isWorkerRequestAuthorized`, shared with the sweep). `maxDuration
= 240` — Gemini's own request timeout is 180s
(`lib/services/providers/gemini-image-provider.ts`), so this leaves ~60s of
margin for compositing/DB/storage/the next kick. Claims one job, calls
`campaign-service.ts#processClaimedJob` (renders the creative, saves it,
updates the row — on failure, backoff-and-retry or terminal `FAILED`
depending on `attempts` vs `maxAttempts`), finalizes the campaign's status
if that was its last open job, and re-kicks itself if there's more work.

### Sweep (`GET /api/cron/sweep`, `vercel.json`)

Safety net, not primary dispatch — see above on why cron alone can't be.
Same `CRON_SECRET` auth (Vercel auto-attaches it to real cron invocations).
Three jobs per run: reclaim `PROCESSING` rows abandoned for >5 minutes
(comfortably longer than the worker's own 240s `maxDuration` — anything
still `PROCESSING` past that was killed mid-flight, not genuinely still
running) back to `PENDING`; finalize any campaign whose status was never
closed out; and directly process a small batch (5) of any otherwise-
orphaned globally-pending jobs — in-process, not via another HTTP kick, so
it works even if `APP_URL` itself is the thing that's broken. The
`vercel.json` schedule (`*/5 * * * *`) needs Pro or higher — Hobby will
reject anything more frequent than daily at deploy time; fall back to e.g.
`"0 3 * * *"` there.

## Data model (`prisma/schema.prisma`)

```
User ──< Brand
User ──< Product >── Brand
Product ──< ProductImage
Product ──< Campaign ──< Concept ──1:1── CopyVariant
                          Concept ──< Creative >── ProductImage (sourceImage)
```

Design choices worth calling out:

- **`category`, `objective`, `style`, concept `type`, and creative `format`
  are all free-form strings**, not Prisma enums. Each has a catalog file
  under `lib/catalog/` (`categories.ts`, `objectives.ts`, `styles.ts`,
  `concepts.ts`, `formats.ts`) that's the single source of truth for
  labels/metadata. Adding a new advertising format (Stories, Marketplace, a
  banner size) or a 6th concept angle is one object in a catalog file — no
  migration (AGENTS.md #4/#5).
- **`ProductImage.key` is never overwritten.** Creatives are separate rows
  with their own `imageUrl`, pointing at a separate file. The original
  upload is immutable (AGENTS.md #15).
- **`Creative.version`** — regenerating never deletes the previous result;
  it inserts a new row. The UI shows the latest version per format but the
  history exists in the database.
- **No auth tables beyond a single implicit `User`** — see [Auth](#auth).

## Provider abstractions

Three services are designed so a concrete provider can be swapped via one
environment variable, without touching any caller:

### Storage

`lib/services/storage.ts` exports `StorageService` (`save`, `read`,
`urlFor`). Every row that goes through it (`Brand.logoKey`,
`ProductImage.key`, `Creative.imageKey`) stores the object **key**, never a
URL — `urlFor(key)` resolves a URL at read time, right before an API
response or a Server Component renders (see `lib/serialize.ts`). This
matters because a real object-store URL is either not stable (a signed URL
expires) or shouldn't be public at all; resolving on every read means the
bucket can be private and the DB never goes stale.

`STORAGE_PROVIDER=local` (default) writes to `./storage` on disk and serves
files through `app/api/files/[...path]/route.ts` — fine for a single
long-lived server, **not** for Vercel (ephemeral filesystem per
invocation). `STORAGE_PROVIDER=s3` (`S3StorageService`) targets any
S3-API-compatible bucket via `@aws-sdk/client-s3` +
`@aws-sdk/s3-request-presigner`: real AWS S3, or an S3-compatible store
like Cloudflare R2 (recommended here — zero egress fees fit this app's
read-heavy image serving) or Supabase Storage. `urlFor` signs a GET URL
valid for `S3_SIGNED_URL_TTL_SECONDS` (default 1h). See `.env.example` for
the full variable list (`S3_BUCKET`, `AWS_REGION`, `S3_ENDPOINT`,
`S3_FORCE_PATH_STYLE`, `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`).

### Image generation

`lib/services/image-generation.ts` exports `ImageGenerationService` with
five methods mirroring the brief in AGENTS.md #14: `generateCreative`,
`generateVariation`, `editProductImage`, `createBackground`,
`createComposition`. `IMAGE_PROVIDER=local-compositor` (default) implements
all five with `sharp` + SVG, so the MVP needs no API key.

`IMAGE_PROVIDER=gemini` (`lib/services/providers/gemini-image-provider.ts`)
uses Google's Gemini image model ("Nano Banana 2" /
`gemini-3.1-flash-image`, overridable via `GEMINI_IMAGE_MODEL`) for the
parts an AI is actually good at — composing a background scene and
integrating the real product photo into it — while copy stays
deterministic. See
[Image generation → hybrid AI/local rendering](#image-generation-1) below
for why it's split this way. Needs `GEMINI_API_KEY`; the provider is
constructed lazily (only on first actual generation call), so a missing key
surfaces as a normal failed-creative error rather than crashing the app at
import time — see `getProvider()` in `image-generation.ts`.

Because a single campaign can trigger up to 15 Gemini calls in one request
(5 concepts × 3 formats), every call sets an explicit 180s timeout and
disables the SDK's default auto-retry (`httpOptions.retryOptions.attempts:
1`) — a failed call must fail loudly, not silently retry into a second
billable generation or hang the whole campaign. Error messages are also
scrubbed of the API key before being stored on `Creative.error` or logged
(`redactSecrets`), in case the SDK ever echoes request config in an error.
`imageConfig.imageSize` is requested at `"2K"` — our largest target canvas
is 1080×1920, and asking for headroom avoids `applyScrimAndCopy`'s final
resize upscaling a soft 1K result. (These three practices — timeout,
no-retry, secret redaction — match an independent implementation of the
same model/SDK built for AdVibe's own `/estudio` image tool on a sibling
branch; useful cross-validation that this is the right way to call this
particular API.)

Both providers are registered in `createImageGenerationService()`. To add
another (OpenAI Images, Bedrock Nova Canvas, Replicate, ...): implement the
interface, register it there, and read its `*_API_KEY` from `process.env`
inside that class only — never in a route handler or client component
(AGENTS.md #19).

### Copywriting

`lib/services/copy-service.ts#generateCopy` is deterministic and
template-based today (`COPY_PROVIDER=template`). It's the one engine not
yet behind a swappable class (there's only one implementation), but the
signature (`concept, brief, analysis, objective → CopyResult`) is already
provider-agnostic — an LLM-backed implementation can drop in behind the
same call site in `campaign-service.ts` when `ANTHROPIC_API_KEY` or similar
is available.

## Image generation

**Copy is always rendered the same way, regardless of image backend.**
`lib/services/creative-renderer.ts` splits into two independent steps:

1. **Background composition** — either `composeLocalBackground()` (pure
   `sharp`/SVG: gradient + the untouched, contain-fit product photo) or
   `GeminiImageProvider` calling out to Gemini to generate a photorealistic
   scene with the product integrated into it.
2. **`applyScrimAndCopy()`** — a legibility scrim, the logo, and the copy
   (headline/price/CTA) as vector text via `lib/services/svg.ts`
   (`escapeXml` against malformed/injected SVG, `wrapText` for line
   wrapping — `<text>` doesn't auto-wrap). This step is identical no matter
   which provider produced the background.

This split exists on purpose: text rendering inside generative image models
is unreliable (typos, garbled characters, wrong price), which is
unacceptable for ad copy. So no image provider is ever asked to draw
text — the prompt built in `lib/services/gemini-prompt.ts` explicitly tells
Gemini not to render any text, numbers, or logos, and product-identity
preservation ("don't alter the product, only its surroundings") is spelled
out the same way `renderCreative` enforces it structurally for the local
path.

With the local provider, two layout variants exist (`variantSeed % 2`) so
"Regenerar" produces a visibly different composition. With Gemini,
`variantSeed` instead rotates through a small set of scene descriptions
(`SCENE_IDEAS` in `gemini-prompt.ts`) — plus the model's own
non-determinism — for the same effect.

Gemini's `imageConfig.aspectRatio` only accepts a fixed set of ratios (no
4:5), so `lib/services/image-utils.ts#nearestSupportedAspectRatio` picks
the closest one; `applyScrimAndCopy`'s final `resize(..., { fit: "cover" })`
still forces the exact target pixel size regardless, so this only affects
how much the model has to crop internally.

Fonts render via the system's fontconfig (DejaVu Sans / Liberation Sans are
present in the container); no font files are bundled.

## Preserving the product photo

Per AGENTS.md #3/#15, the pipeline never alters the pixels of the uploaded
product photo:

- Uploads are re-encoded once on ingest (`lib/uploads.ts`) purely to
  normalize format/strip metadata and cap dimensions — not to "improve" or
  alter the product.
- The renderer only ever resizes the photo with `fit: "contain"` (no crop,
  no distortion) and composites it onto a separate background layer. The
  original `ProductImage.key` row is never rewritten; every creative is a
  new file.

## Auth

Two independent layers, deliberately not merged:

- **App gate (`proxy.ts`):** whole-app HTTP Basic Auth, one shared
  `BASIC_AUTH_USER`/`BASIC_AUTH_PASSWORD` pair. "Simple y suficiente" —
  this exists specifically so an unauthenticated third party can't call
  `/api/campaigns` and burn the deployment's real, billable
  `GEMINI_API_KEY`. Required in production (fails closed with a 500 if
  unset, rather than silently serving the app unauthenticated); optional
  in local dev. Excludes `/api/jobs/process` and `/api/cron/sweep`, which
  carry their own `CRON_SECRET` bearer auth for server-to-server calls
  (self-chain dispatch, Vercel Cron) — mixing the two schemes on those
  routes would break both.
- **User model (`lib/auth.ts#getCurrentUser()`):** no real per-user
  sessions yet — resolves (and lazily creates) a single implicit demo user
  (`demo@ventads.ai`). Every `Brand` and `Product` row already carries a
  `userId` foreign key, so swapping in real multi-user auth (NextAuth,
  Clerk, ...) later means replacing the body of `getCurrentUser()` with a
  real session lookup — no data model change, no route handler changes
  (they all already scope queries by `userId`).

## Configuration

All of it lives in `.env` / `.env.example`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | SQLite file path |
| `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` | *(required in prod)* | Whole-app Basic Auth gate (`proxy.ts`); optional locally |
| `CRON_SECRET` | *(required)* | Auth for `/api/jobs/process` and `/api/cron/sweep`; also set in Vercel's project settings |
| `APP_URL` | `http://localhost:3000` outside prod, else required | This app's own URL, for the self-chaining worker dispatch — not `VERCEL_URL` |
| `JOB_CONCURRENCY` | `1` | Parallel worker chains per campaign; tested at `3` |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | — | Only if Vercel Deployment Protection is on; auto-injected by Vercel |
| `STORAGE_PROVIDER` | `local` | `local` \| `s3` (AWS S3 or any S3-compatible store, e.g. Cloudflare R2) |
| `S3_BUCKET` / `AWS_REGION` | — | Required when `STORAGE_PROVIDER=s3` |
| `S3_ENDPOINT` / `S3_FORCE_PATH_STYLE` | — | Set for R2/non-AWS stores; leave unset for real AWS S3 |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | — | Falls back to the AWS SDK's default credential chain if unset |
| `S3_SIGNED_URL_TTL_SECONDS` | `3600` | How long a signed read URL stays valid |
| `IMAGE_PROVIDER` | `local-compositor` | `local-compositor` \| `gemini` |
| `COPY_PROVIDER` | `template` | reserved for a future LLM-backed engine |

No secret is required to run the MVP. Provider API keys (documented but
commented out in `.env.example`) are only read inside the matching
provider class, never in a route handler, never sent to the client.

## Security notes

- Uploads are validated by MIME type, size (≤10MB), dimensions, and
  re-encoded through `sharp` — a file that merely claims to be a JPEG can't
  smuggle arbitrary bytes through (`lib/uploads.ts`).
- `app/api/files/[...path]/route.ts` resolves storage keys against
  `path.resolve` and rejects anything that escapes the storage root
  (path traversal guard in `LocalStorageService`).
- All mutation routes scope every query by the current user's `userId` —
  there is no endpoint that reads or writes another user's data by id
  alone.
- Nothing under `storage/`, `dev.db`, or `.env` is committed
  (see `.gitignore`).

## What's intentionally not built yet

Per AGENTS.md #13 ("ship the full flow first"), these are structured for
but not implemented:

- Real multi-user auth (single demo user today, see [Auth](#auth)).
- A job queue for image generation (local compositing is fast enough to run
  synchronously in the request; swapping in a slow external provider later
  would want `GenerationJob`-style async tracking).
- In-canvas editing (move text, change colors/fonts, drag elements) — the
  renderer is a pure function of structured inputs, which is what makes
  this addable later without a rewrite.
- Additional formats (Stories, Reels, Marketplace, banners) — one entry in
  `lib/catalog/formats.ts` away.
