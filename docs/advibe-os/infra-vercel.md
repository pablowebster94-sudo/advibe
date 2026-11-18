# Infraestructura: repos y proyectos de Vercel

Auditoría del 18 nov 2026. Equipo Vercel: `advibe` (`team_D4RH2PCtzqCyaPnBVTBB12ba`).

## Problema detectado

7 de los 14 proyectos de Vercel apuntan a solo 2 repositorios. Cada push lanza
builds en todos los proyectos enlazados al mismo repo: se paga varias veces por
el mismo commit y queda ambiguo cuál URL es la válida.

## Mapeo real (verificado vía deployments)

### Repo `pablowebster94-sudo/advibe` → 4 proyectos

| Proyecto Vercel | ID | Dominios | Estado último deploy |
|---|---|---|---|
| `advibe` | `prj_sWckPevOjXWZHN89X0n3IAKJDWTH` | advibeagencia.com, www, enfoque. | READY (preview) |
| `advibe-ai` | `prj_biu3oGeTQdWUoNK2AL5RHDPECofY` | solo *.vercel.app | READY (preview) |
| `advibe-control` | `prj_9tGtqPDJlWu9a5mh8sRhaSu64OGF` | solo *.vercel.app | READY (preview) |
| `alvitec` | `prj_s7VmLZjSWnd5fvOL2aGuA7tSqAu0` | solo *.vercel.app | ERROR (3 seguidos) |

Los cuatro deployaron el commit `4550a37` (rama
`feat/advibe-meta-marketing-api-integration`) en el mismo segundo.

### Repo `pablowebster94-sudo/jarvis-advibe` → 3 proyectos

| Proyecto Vercel | ID | Estado commit `5a0190b` | Rol |
|---|---|---|---|
| `jarvis-advibe-ai` | `prj_LWQ9YkaGSACQhclU6zkvkdPoBVLN` | READY | **EL VIVO** |
| `jarvis-advibe` | `prj_OzZGiG4n397M6iyofuMIuh2j3dMl` | ERROR | duplicado |
| `jarvis-advibe-yd7w` | `prj_FbePKGQWShGT4TmLMiOuxVrugSZL` | BLOCKED | duplicado |

El vivo es `jarvis-advibe-ai`: el sitio público le envía los prospectos. Está
fijado en `.env.example` (`JARVIS_URL=https://jarvis-advibe-ai.vercel.app`) y en
las variables del proyecto `advibe` (`JARVIS_URL`, `JARVIS_WEBHOOK_URL`,
`JARVIS_WEBHOOK_SECRET`). Borrar ese proyecto cortaría la entrada de prospectos.

Ninguno tiene dominio propio fuera de `*.vercel.app`.

### Qué es cada proyecto del cluster `advibe` (confirmado por variables)

Los tres que se conservan son aplicaciones distintas, no copias:

- **`advibe`** — el sitio público. Dominios reales, Meta Pixel y el webhook que
  manda prospectos a JARVIS.
- **`advibe-control`** — el panel de pagos. Supabase (`NEXT_PUBLIC_SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`) y `CRON_SECRET`. Confirmado por Pablo: funciona.
- **`advibe-ai`** — el generador de imágenes que luego crea las campañas.
  OpenAI, Gemini, Pixazo, `META_SYSTEM_USER_TOKEN`, `META_AD_ACCOUNT_ID`,
  `DATABASE_URL`. Sus variables de preview dicen "Preview access for ventADS
  AI", así que corresponde a la app de la carpeta `ventads-ai/`.

### Resto de proyectos

`melany-gonzalez-joyeria`, `etika`, `am-motorsport`,
`am-motorsport-messenger-bot`, `advibe-imagenes`, `paola-miguitama-web`.

POSIBLE DUPLICADO: `advibe-ads-ai` (`prj_Az3Z0oNUDJ4xi4GKszBvq6YSMPsP`) se
solapa en nombre y propósito con `advibe-ai`. Sin deploys desde el 1 nov 2026.
Pendiente de revisar.

### Repos sin proyecto en Vercel

`advibe-eventos`, `am-motorsport-fotos`.

### Nombres que no coinciden

- Repo `melany-gonzalez-web` → proyecto `melany-gonzalez-joyeria`.
- Proyecto `alvitec` alimentado por el repo `advibe` (enlace incorrecto).

## Causa raíz

El repo `advibe` contiene tres aplicaciones Next independientes sin
configuración de monorepo (no hay `workspaces` en `package.json` ni
`vercel.json`):

- `advibe-web` — raíz del repo
- `ventads-ai` — `ventads-ai/` (app completa, con Prisma y Supabase propios)
- `latin-eagle-multiservices` — ver más abajo

Los 4 proyectos de Vercel enlazados a este repo parecen intentos de deployar
subcarpetas distintas. PENDIENTE DE CONFIRMAR: el "Root Directory" de cada
proyecto en el panel de Vercel.

## Ningún deploy en producción

Los 14 proyectos están `live: false` y los deploys recientes son `target: null`
(preview). `advibe` tiene los dominios reales pero su último deploy no es de
producción: el dominio sirve una versión anterior.

## Resuelto el 18 nov 2026

Duplicación de Latin Eagle dentro del repo. Existían dos copias:

- `app/latin-eagle/` — **la viva**. Referenciada por `middleware.ts` (redirección
  de dominio propio) y `components/MetaPixel.tsx`; usa los assets de
  `public/latin-eagle/`; tiene `content.ts` con i18n, OG y Twitter images.
- `latin-eagle/` (raíz) — borrador inicial abandonado. 9 archivos, sin imágenes,
  sin OG, sin i18n, sin referencias desde ningún otro archivo del repo.

Se eliminó la copia de la raíz. Recuperable desde el historial de git.

## Plan de limpieza pendiente (requiere aprobación por acción)

1. **Cluster Jarvis** — conservar `jarvis-advibe-ai`; borrar `jarvis-advibe` y
   `jarvis-advibe-yd7w`. Sin dominios propios, no rompe nada.
2. **`alvitec`** — borrar. Confirmado por Pablo el 18 nov 2026: descartado.
3. **Cluster advibe** — conservar los tres (`advibe`, `advibe-control`,
   `advibe-ai`): son apps distintas. Lo que hay que arreglar no es el número de
   proyectos sino el Root Directory de cada uno, para que cada proyecto compile
   su propia carpeta y no el repo entero.
4. **Separar el repo** — mover `ventads-ai` a su propio repositorio, o declarar
   workspaces.
5. **Promover producción** en `advibe` para que `advibeagencia.com` sirva el
   código actual.
6. **Revisar `advibe-ads-ai`** — posible duplicado de `advibe-ai`.

Nota: el MCP de Vercel no puede borrar proyectos. Solo genera un enlace a la
sección Delete Project; el borrado lo confirma Pablo en el panel.

### Datos que faltan para ejecutar

- INFORMACIÓN FALTANTE: Root Directory configurado en cada proyecto (fuente
  esperada: panel de Vercel).
- INFORMACIÓN FALTANTE: si `advibe-ads-ai` sigue en uso (fuente esperada: Pablo).
