# ventADS.ai

ventADS.ai converts product information and real product photos into
professional advertising creatives ready for Meta Ads and social media.

It is a **fully independent project** living in its own directory
(`ventads-ai/`) inside the AdVibe repository. It does not share code,
dependencies, or configuration with the AdVibe marketing site at the repo
root, and nothing in this directory modifies it.

## Flow

```
PRODUCTO → FOTOS → MARCA → OBJETIVO → ESTILO → GENERAR → RESULTADOS
```

1. **Producto** — category, name, manufacturer, price, features, benefits,
   offer, CTA, target audience.
2. **Fotos** — real product photos (kept untouched — see
   [Preserving the product photo](#preserving-the-product-photo)).
3. **Marca** — optional saved brand identity (logo, contact info, CTA),
   reusable across future products.
4. **Objetivo** — Vender, Generar mensajes, Leads, Promocionar, Lanzamiento,
   Reconocimiento.
5. **Estilo** — Premium, Comercial, Minimalista, Moderno, Lifestyle,
   Urgencia, Elegante, Deportivo.
6. **Generar** — the analysis engine reads the product brief and produces
   up to 5 creative concepts (Venta directa, Beneficio, Aspiracional,
   Oferta, Característica), each with its own copy and a rendered creative
   in every advertising format (1:1, 4:5, 9:16).
7. **Resultados** — view every concept/format, regenerate a specific
   creative, and download individual PNGs or the whole campaign as a ZIP.

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **Tailwind CSS v4**
- **Prisma 7** + SQLite (via `@prisma/adapter-better-sqlite3`) for local,
  zero-config persistence
- **sharp** for server-side image compositing (no GPU/external API needed)
- No auth provider yet — see [Architecture](./ARCHITECTURE.md#auth)

## Getting started

```bash
cd ventads-ai
npm install
cp .env.example .env   # already sensible defaults, no secrets required
npx prisma db push     # creates dev.db
npm run dev
```

Open http://localhost:3000.

The MVP works with **zero API keys**: image generation is a local
compositor (sharp + SVG) and copywriting is a deterministic template
engine. Both are swappable — see
[Generación de imágenes](./ARCHITECTURE.md#image-generation) and
[Copywriting](./ARCHITECTURE.md#copywriting).

### Using a real AI image provider (Gemini / "Nano Banana")

Set these in `.env` to have Gemini compose the background scene around your
product photo (copy is still always rendered locally — see
[ARCHITECTURE.md](./ARCHITECTURE.md#image-generation-1) for why):

```bash
IMAGE_PROVIDER="gemini"
GEMINI_API_KEY="your-key-from-ai.google.dev"
```

No code changes needed. Without `IMAGE_PROVIDER` set (or set back to
`local-compositor`), it falls back to the local renderer.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Sync `prisma/schema.prisma` to `dev.db` |
| `npm run db:studio` | Open Prisma Studio |

## Environment variables

See [`.env.example`](./.env.example). Nothing is required to run the MVP;
every variable has a working default. Documented in full in
[Architecture → Configuration](./ARCHITECTURE.md#configuration).

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design, data model, provider
  abstractions, and how to swap them for real providers.
- [CLAUDE.md](./CLAUDE.md) — instructions for Claude Code when working in
  this specific subproject.

## Troubleshooting

- **"Module not found: @prisma/client"** — run `npx prisma generate`
  (also runs automatically on `npm install` via a Prisma-added flow, but
  a stale `generated/prisma` can lag behind schema changes).
- **Images 404 in the UI** — uploads and creatives live on local disk under
  `storage/` (gitignored) and are served through `/api/files/[...path]`.
  If you wiped `storage/` without wiping `dev.db`, old rows will point at
  missing files; reset with `rm dev.db && npx prisma db push`.
- **Upload rejected** — only JPG/PNG/WEBP up to 10MB are accepted; see
  `lib/uploads.ts`.
- **Turbopack workspace-root warning** — expected, since this project sits
  inside the AdVibe repo next to a sibling `package-lock.json`; already
  pinned via `turbopack.root` in `next.config.ts`.
