# ventADS.ai — instructions for Claude Code

This is an independent project inside the AdVibe repository. **Never edit
anything outside `ventads-ai/`** — that's the AdVibe marketing site and is
out of scope for any work on ventADS.ai, unless a human explicitly asks for
a cross-project change.

## Before writing code

This project pins `next@16.2.10`, which has real breaking changes from
older Next.js you may have trained on (async `params`/`searchParams`,
`middleware` → `proxy`, `next lint` removed in favor of ESLint directly,
`images.qualities` defaults to `[75]`, etc.). If you're touching routing,
config, or metadata files, skim
`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`
first — don't assume the API matches your training data.

Same caution applies to `prisma` (pinned at 7.x): the default generator is
`prisma-client` (TS source output, not `prisma-client-js`), and every
datasource needs an explicit **driver adapter** (`@prisma/adapter-pg`
here, over `pg`) — there's no more automatic query-engine binary. See
`lib/db.ts` for the working pattern, and
`archiver` (pinned at 8.x): it dropped the old callable-factory API in
favor of named exports (`import { ZipArchive } from "archiver"`), see
`app/api/campaigns/[id]/export/route.ts`.

`@google/genai` (the Gemini SDK, used by `IMAGE_PROVIDER=gemini`) moves
fast — the current image model is `gemini-3.1-flash-image` ("Nano Banana
2"), called via `client.models.generateContent({ model, contents, config:
{ responseModalities: ["IMAGE","TEXT"], imageConfig: { aspectRatio } } })`.
`imageConfig.aspectRatio` only accepts a fixed set of ratios (no 4:5 — see
`nearestSupportedAspectRatio`), and at least one build of the SDK has been
reported to ignore `imageConfig.imageSize`. Before changing anything in
`lib/services/providers/gemini-image-provider.ts`, re-check
`node_modules/@google/genai/dist/node/node.d.ts` (or search the web — this
model/SDK combination is newer than most training data) rather than
assuming the shape from memory.

When in doubt about a pinned dependency's current API, check
`node_modules/<pkg>/**/*.d.ts` or its README before guessing from memory.

## Ground rules specific to this project

- **Never invent product facts.** The analysis/concept/copy engines
  (`lib/services/analysis-engine.ts`, `concept-engine.ts`,
  `copy-service.ts`) must only read fields that exist on the
  `ProductBrief`. If a template needs something the user didn't provide,
  push it into `missingInfo`/`missingFields` — don't fabricate a value.
- **Never overwrite an original product photo.** `ProductImage.url` is
  immutable once created; every generation or regeneration produces a new
  `Creative` row with its own file. See ARCHITECTURE.md → "Preserving the
  product photo".
- **Keep the provider abstractions real abstractions.** `StorageService`,
  `ImageGenerationService`: a provider (e.g. `GeminiImageProvider` in
  `lib/services/providers/`) must go through the existing interface,
  selected by its `*_PROVIDER` env var — don't reach for a provider SDK
  directly from a route handler or component.
- **Never let an image provider render copy text.** Whatever produces the
  background (local `sharp` compositing or an AI model), the headline/
  price/CTA must still go through `applyScrimAndCopy()` in
  `creative-renderer.ts`. Generative image models are not reliable at
  spelling out exact prices or CTAs — see ARCHITECTURE.md → "Image
  generation" for why this is a hard split, not a style choice.
- **Catalogs, not enums, for anything the product brief says should be
  extensible** (`category`, `objective`, `style`, concept `type`, creative
  `format`). Add new options to `lib/catalog/*.ts`, not as Prisma enum
  values, unless there's a specific reason the set needs to be closed.
- **API keys** only ever get read inside the matching provider class in
  `lib/services/`, from `process.env`. Never in a client component, never
  hard-coded, never logged.

## Commands

```bash
npm run dev            # dev server, Turbopack
npm run build           # production build (also type-checks)
npm run lint            # ESLint flat config
npx tsc --noEmit         # type-check only, faster than a full build
npm run db:migrate       # create + apply a versioned migration (dev)
npm run db:deploy        # apply existing migrations only (production)
npx prisma studio        # inspect the local PostgreSQL data
```

Needs a real PostgreSQL `DATABASE_URL` (see `.env.example`) — SQLite was
dropped in favor of Postgres everywhere (dev, test, production; one
`schema.prisma`, no per-environment dialect switching — see
ARCHITECTURE.md → "Configuration"). `npm test` needs its own
`TEST_DATABASE_URL` (a separate database) and applies migrations to it
automatically via `pretest`.

Verify changes by actually running the dev server and driving the flow
(Producto → Fotos → ... → Resultados), and by `npm test` for the job-queue
concurrency logic — most
of the interesting bugs here are in the SVG/image compositing, which a
type-checker can't catch. See the QA pass method used during the initial
build: launch `next dev`, drive it with Playwright/chromium against
`localhost:3000`, and actually open the generated PNGs to check for text
overflow, clipping, or broken layouts — don't just check HTTP status codes.

## Where things live

- `lib/catalog/` — extensible option lists (categories, objectives,
  styles, concept types, formats).
- `lib/services/` — the engines (analysis, concepts, copy, image
  generation, storage) and the campaign orchestrator.
  `lib/services/providers/` holds concrete `ImageGenerationService`
  implementations (Gemini today).
- `lib/product-brief.ts` — the one normalized shape every engine reads.
- `components/wizard/` — the 6-step product creation flow (`app/new`).
- `components/results/` — the results/variants view (`app/results/[id]`).
- `prisma/schema.prisma` — data model; see ARCHITECTURE.md for the
  rationale behind each modeling choice before changing it.

Full system design: [ARCHITECTURE.md](./ARCHITECTURE.md).
