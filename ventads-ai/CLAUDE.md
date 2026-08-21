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
datasource needs an explicit **driver adapter**
(`@prisma/adapter-better-sqlite3` here) — there's no more automatic
query-engine binary. See `lib/db.ts` for the working pattern, and
`archiver` (pinned at 8.x): it dropped the old callable-factory API in
favor of named exports (`import { ZipArchive } from "archiver"`), see
`app/api/campaigns/[id]/export/route.ts`.

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
  `ImageGenerationService`: if you add a second provider, it must go
  through the existing interface in `lib/services/*.ts`, selected by its
  `*_PROVIDER` env var — don't reach for a provider SDK directly from a
  route handler or component.
- **Catalogs, not enums, for anything the product brief says should be
  extensible** (`category`, `objective`, `style`, concept `type`, creative
  `format`). Add new options to `lib/catalog/*.ts`, not as Prisma enum
  values, unless there's a specific reason the set needs to be closed.
- **API keys** only ever get read inside the matching provider class in
  `lib/services/`, from `process.env`. Never in a client component, never
  hard-coded, never logged.

## Commands

```bash
npm run dev          # dev server, Turbopack
npm run build         # production build (also type-checks)
npm run lint          # ESLint flat config
npx tsc --noEmit       # type-check only, faster than a full build
npx prisma db push     # apply schema.prisma to dev.db (no migration files yet)
npx prisma studio      # inspect the local SQLite data
```

There is no test suite yet. Verify changes by actually running the dev
server and driving the flow (Producto → Fotos → ... → Resultados) — most
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
- `lib/product-brief.ts` — the one normalized shape every engine reads.
- `components/wizard/` — the 6-step product creation flow (`app/new`).
- `components/results/` — the results/variants view (`app/results/[id]`).
- `prisma/schema.prisma` — data model; see ARCHITECTURE.md for the
  rationale behind each modeling choice before changing it.

Full system design: [ARCHITECTURE.md](./ARCHITECTURE.md).
