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

Concretely, generating a campaign (`POST /api/campaigns`) runs
`lib/services/campaign-service.ts#runCampaign`, which:

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
5. `lib/services/image-generation.ts` → `lib/services/creative-renderer.ts`
   renders one PNG per concept × format by compositing the untouched
   product photo over a style-driven background with the copy as vector
   text (sharp + SVG).
6. Everything is persisted (`Concept`, `CopyVariant`, `Creative` rows) and
   files are written through the storage abstraction.

Regenerating a single creative (`POST /api/creatives/:id/regenerate`) reuses
the same renderer with a bumped `variantSeed` (different layout) and a
bumped `version` (old creative rows are kept, never overwritten).

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
- **`ProductImage.url` is never overwritten.** Creatives are separate rows
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
`urlFor`). `STORAGE_PROVIDER=local` (default) writes to `./storage` on disk
and serves files through `app/api/files/[...path]/route.ts`. To add S3:
implement a class satisfying the interface, register it in
`createStorageService()`, and point `urlFor` at the bucket's public URL (or
keep proxying through the API route for private buckets).

### Image generation

`lib/services/image-generation.ts` exports `ImageGenerationService` with
five methods mirroring the brief in AGENTS.md #14: `generateCreative`,
`generateVariation`, `editProductImage`, `createBackground`,
`createComposition`. `IMAGE_PROVIDER=local-compositor` (default) implements
all five with `sharp` + SVG, so the MVP needs no API key. To add a real
generative provider (OpenAI Images, Bedrock Nova Canvas, Replicate, ...):
implement the interface, register it in `createImageGenerationService()`,
and read the appropriate `*_API_KEY` from `process.env` inside that class
only — never in a route handler or client component (AGENTS.md #19).

### Copywriting

`lib/services/copy-service.ts#generateCopy` is deterministic and
template-based today (`COPY_PROVIDER=template`). It's the one engine not
yet behind a swappable class (there's only one implementation), but the
signature (`concept, brief, analysis, objective → CopyResult`) is already
provider-agnostic — an LLM-backed implementation can drop in behind the
same call site in `campaign-service.ts` when `ANTHROPIC_API_KEY` or similar
is available.

## Image generation

The local compositor never calls an external service:

1. `lib/services/svg.ts` — `escapeXml` (prevents malformed/injected SVG from
   user text) and `wrapText` (approximates line wrapping for `<text>`,
   which doesn't auto-wrap).
2. `lib/services/creative-renderer.ts#renderCreative` builds four SVG/raster
   layers — background gradient, the (untouched, contain-fit) product
   photo, a bottom scrim for legibility, and the copy as vector text — and
   composites them with `sharp`.
3. Two layout variants exist (`variantSeed % 2`) so "Regenerar" produces a
   visibly different composition, not just a stylistic seed change.

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
  original `ProductImage.url` row is never rewritten; every creative is a
  new file.

## Auth

There is no real authentication yet. `lib/auth.ts#getCurrentUser()`
resolves (and lazily creates) a single implicit demo user
(`demo@ventads.ai`). Every `Brand` and `Product` row already carries a
`userId` foreign key, so swapping in real auth (NextAuth, Clerk, ...) later
means replacing the body of `getCurrentUser()` with a real session lookup —
no data model change, no route handler changes (they all already scope
queries by `userId`).

## Configuration

All of it lives in `.env` / `.env.example`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | SQLite file path |
| `STORAGE_PROVIDER` | `local` | `local` \| (add your own) |
| `IMAGE_PROVIDER` | `local-compositor` | `local-compositor` \| (add your own) |
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
