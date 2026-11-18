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

| Proyecto Vercel | ID | Estado commit `5a0190b` |
|---|---|---|
| `jarvis-advibe` | `prj_OzZGiG4n397M6iyofuMIuh2j3dMl` | ERROR |
| `jarvis-advibe-yd7w` | `prj_FbePKGQWShGT4TmLMiOuxVrugSZL` | BLOCKED |
| `jarvis-advibe-ai` | `prj_LWQ9YkaGSACQhclU6zkvkdPoBVLN` | READY |

Ninguno tiene dominio propio fuera de `*.vercel.app`.

### Resto de proyectos

`melany-gonzalez-joyeria`, `etika`, `am-motorsport`,
`am-motorsport-messenger-bot`, `advibe-imagenes`, `paola-miguitama-web`,
`advibe-ads-ai`. Sin duplicación detectada.

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

1. **Cluster Jarvis** — conservar `jarvis-advibe`; desconectar el repo de
   `jarvis-advibe-yd7w` y `jarvis-advibe-ai` y borrarlos. Sin dominios propios,
   no rompe nada.
2. **Cluster advibe** — conservar `advibe` (tiene los dominios). Decidir el
   destino de `advibe-ai`, `advibe-control` y `alvitec` según qué debía servir
   cada uno.
3. **Separar el repo** — mover `ventads-ai` a su propio repositorio, o declarar
   workspaces y fijar el Root Directory de cada proyecto de Vercel.
4. **Promover producción** en `advibe` para que `advibeagencia.com` sirva el
   código actual.

### Datos que faltan para ejecutar

- INFORMACIÓN FALTANTE: propósito de `advibe-control` y `advibe-ai` (fuente
  esperada: Pablo).
- INFORMACIÓN FALTANTE: si `alvitec` es un cliente real con sitio propio
  (fuente esperada: Pablo / `clientes.md`).
- INFORMACIÓN FALTANTE: Root Directory configurado en cada proyecto (fuente
  esperada: panel de Vercel).
