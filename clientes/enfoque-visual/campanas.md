# Campañas — Enfoque Visual

Inventario estructural de campañas. Verificado vía MCP de Meta Ads el
**10/09/2026 21:42 (America/Guayaquil)**, modo solo lectura.

Este archivo describe **estructura**, no rendimiento. Las métricas que
aparecen son contexto; los veredictos los produce el auditor.

Datos no determinables marcados **`NO DISPONIBLE`**.

> **Nota de método — ventana de datos.** Las métricas de este archivo usan
> `time_range 2026-09-08 → 2026-09-10`, que cubre la vida completa de cada
> campaña activa **e incluye el día en curso**.
>
> **No usar `last_14d` ni `last_7d` para esta cuenta.** Los presets de Meta
> terminan en el último día completo y **excluyen hoy**. Como todas las
> campañas activas se crearon hace menos de 72 h, el día en curso es el de
> mayor gasto: `last_14d` omitía entre el 30 % y el 50 % del gasto y de los
> resultados de cada campaña.
>
> Una versión anterior de este archivo usaba `last_14d` y, por eso,
> documentaba una falsa "anomalía de entrega" en Santa Bárbara (§1.4).
> Corregido el 10/09/2026.

---

## 1. Campañas activas

Seis campañas con `effective_status: ACTIVE`. Cinco entregan; una no.

### 1.1 Terreno Chemu

| Campo | Valor |
|---|---|
| ID campaña | `120255924724590242` |
| ID conjunto | `120255924724610242` |
| Objetivo | `OUTCOME_ENGAGEMENT` |
| `optimization_goal` | `CONVERSATIONS` |
| `destination_type` | `WHATSAPP` |
| `billing_event` | `IMPRESSIONS` |
| Indicador de resultado | `actions:onsite_conversion.messaging_conversation_started_7d` |
| Presupuesto | $5,00 USD / día |
| Estado | ACTIVE (campaña y conjunto) |
| Creada | 08/09/2026 22:31 |
| Nombre del conjunto | `Nuevo conjunto de anuncios de Interacción` |

**Público:** Ecuador — Cuenca (+30 km), Gualaceo (+25 km), Azuay.
Edad 24–62 (mín. declarado 18, "Unknown age on WhatsApp: Included").
Advantage+ Audience: **On**.
**Perfil de benchmark: Ecuador/Local.**

**Métricas (08/09 → 10/09):** $13,47 · 28 conversaciones · $0,48 c/resultado ·
CTR 7,35 % · CPM $1,53 · Frecuencia 1,54 · 8.800 impresiones.

**Anuncio:** `Nuevo anuncio de Interacción` (`120255924724620242`), ACTIVE,
creado 08/09 22:31. Un segundo anuncio (`..._Group_1`,
`120255925365930242`) inició entrega el 09/09 00:04.

**Observaciones estructurales:**
- Mejor CPA de la cuenta entre los conjuntos activos.
- Nomenclatura genérica: nada en el nombre indica público ni oferta.
- `learning_stage_info`: `null` → **NO DISPONIBLE**.
- `ads_get_opportunity_score` recomienda video vertical 9:16 en Reels para
  este conjunto (+2 pts, ~8 % menor costo por resultado).

---

### 1.2 Chemu Tienda 2

| Campo | Valor |
|---|---|
| ID campaña | `120255925418310242` |
| ID conjunto | `120255925418320242` |
| Objetivo | `OUTCOME_ENGAGEMENT` |
| `optimization_goal` | `CONVERSATIONS` |
| `destination_type` | `WHATSAPP` |
| `billing_event` | `IMPRESSIONS` |
| Presupuesto | $5,00 USD / día |
| Estado | ACTIVE (campaña y conjunto) |
| Creada | 08/09/2026 22:43 |

**Público:** Ecuador — Cuenca (+30 km), Gualaceo (+22 km), Paute (+18 km),
Azuay. Edad 22–58. Advantage+ Audience: **On**.
**Perfil de benchmark: Ecuador/Local.**

**Métricas (08/09 → 10/09):** $12,81 · 20 conversaciones · $0,64 c/resultado ·
CTR 6,18 % · CPM $1,85 · Frecuencia 1,42 · 6.926 impresiones.

**Anuncios:** `Nuevo anuncio de Interacción` (`120255925418330242`),
ACTIVE. Dos anuncios adicionales del grupo iniciaron entrega el 09/09
00:02 y el **09/09 21:25**.

**Observaciones estructurales:**
- **El anuncio que entró en entrega el 09/09 21:25 corre la ventana de
  cambios recientes.** Para esta campaña la ventana de 72 h no vence al
  cumplirse 72 h de su creación, sino 72 h después de ese anuncio.
- Es la campaña de reemplazo de `Chemu Tienda` (§3.1).
- `learning_stage_info`: `null` → **NO DISPONIBLE**.
- Recomendación de Opportunity Score: video vertical 9:16 en Reels.

---

### 1.3 Latin Eagle 2

| Campo | Valor |
|---|---|
| ID campaña | `120255925493030242` |
| ID conjunto | `120255925493020242` |
| Objetivo | `OUTCOME_ENGAGEMENT` |
| `optimization_goal` | `CONVERSATIONS` |
| `destination_type` | **`MESSENGER`** |
| `billing_event` | `IMPRESSIONS` |
| Presupuesto | $5,00 USD / día |
| Estado | ACTIVE (campaña y conjunto) |
| Creada | 08/09/2026 23:01 |

**Público:** Estados Unidos — Patchogue (+25 km), New York.
Edad 18–65+. Advantage+ Audience: **On**.
**Perfil de benchmark: Internacional.**

**Métricas (08/09 → 10/09):** $13,85 · 15 conversaciones · $0,92 c/resultado ·
CTR 6,11 % · CPM $9,62 · Frecuencia 1,46 · 1.440 impresiones.

**Observaciones estructurales:**
- **Desvío de destino:** único conjunto de la cuenta con `MESSENGER`.
  Todo el histórico de la marca Latin Eagle usó `WHATSAPP`
  (`Mensajes Latin Eagle`, `Mensajes Latin Eagle - Centroamérica`,
  `Latin Eagle ec`). El `optimization_goal` y el indicador de resultados
  **sí** corresponden a conversaciones, así que los umbrales aplican —
  pero el benchmark internacional se calibró sobre campañas de WhatsApp.
  **Comparabilidad limitada**, no inconsistencia bloqueante.
- Si el cambio a Messenger fue intencional: **`NO DISPONIBLE`**.
- `learning_stage_info`: `null` → **NO DISPONIBLE**.
- Recomendación de Opportunity Score: video vertical 9:16 en Reels.

---

### 1.4 Santa Bárbara Cuenca | Inscripciones | WhatsApp

| Campo | Valor |
|---|---|
| ID campaña | `120255950577470242` |
| ID conjunto | `120255950579470242` |
| Nombre del conjunto | **`Cuenca \| Padres \| WhatsApp`** |
| Objetivo | `OUTCOME_ENGAGEMENT` |
| `optimization_goal` | `CONVERSATIONS` |
| `destination_type` | `WHATSAPP` |
| `billing_event` | `IMPRESSIONS` |
| Presupuesto | $5,00 USD / día |
| Estado | ACTIVE (campaña y conjunto) |
| Creada | 10/09/2026 01:05 · Activada 01:10 |

**Público:** Ecuador — Cuenca (Azuay) + Azogues (+18 km, Cañar).
Edad 25–65. Advantage+ Audience: **On**.
**Perfil de benchmark: Ecuador/Local.**

**Métricas (08/09 → 10/09):** $4,65 · 7 conversaciones · $0,66 c/resultado ·
CTR 5,38 % · CPM $1,32 · Frecuencia 1,42 · 3.534 impresiones.

**Anuncio:** `SB Cuenca | Inscripciones | v1` (`120255950583150242`),
ACTIVE, creado 10/09 01:06. Inició entrega 10/09 **02:23**. Un segundo
anuncio del grupo (`120255950632930242`) inició entrega 10/09 **01:24**.

**Observaciones estructurales:**
- **Configuración coherente:** nombre, `optimization_goal`,
  `destination_type` e indicador de resultados están alineados. Es la
  única campaña activa con nomenclatura descriptiva del público.
- **Entrega normal.** Una versión anterior de esta ficha reportaba "cero
  impresiones pese a ~20 h en entrega". Era un artefacto de `last_14d`,
  que excluía el día en curso. La campaña entrega con normalidad:
  3.534 impresiones y 7 conversaciones en ~20 h. No hay anomalía.
- Targeting editado el 10/09 01:09, tras la creación: se añadió Azogues y
  la edad mínima pasó de 18 a 25.
- `learning_stage_info`: `null` → **NO DISPONIBLE**.

---

### 1.5 constructora — FUERA DEL ALCANCE DE LOS BENCHMARKS

| Campo | Valor |
|---|---|
| ID campaña | `120255922778510242` |
| ID conjunto | `120255922778490242` |
| Objetivo | `OUTCOME_ENGAGEMENT` |
| `optimization_goal` | **`PROFILE_AND_PAGE_ENGAGEMENT`** |
| `destination_type` | **`FACEBOOK_PAGE`** |
| Indicador de resultado | **`page_visit_view`** |
| Presupuesto | $3,00 USD / día |
| Estado | ACTIVE (campaña y conjunto) |
| Creada | 08/09/2026 21:59 |

**Público:** **`NO DISPONIBLE`** en detalle — no aparece en el registro de
`targets_spec` consultado. Advantage+ Audience: `On`.
**Perfil de benchmark: no aplica.**

**Métricas (08/09 → 10/09):** $5,61 · 111 visitas a la página · $0,05
c/resultado · CTR 5,16 % · CPM $0,87 · Frecuencia 1,58.

**Observaciones estructurales:**
- **No mide conversaciones.** Los umbrales de `benchmarks.md` no aplican
  (§10). Sin veredicto de rendimiento.
- El nombre no sugiere mensajería, así que **no** se marca como
  configuración inconsistente. Es una campaña de otro tipo, no una
  campaña mal configurada.
- Presumiblemente asociada a la página `Constructora Peralta`
  (`220405694491935`), pero la asociación página ↔ campaña es
  **`NO DISPONIBLE`** (ver `cuenta-meta.md` §3.1).
- Para auditarla haría falta un perfil de umbrales propio en
  `benchmarks.md`.

---

### 1.6 Santa Barbara Cuenca — ⚠️ CONFIGURACIÓN INCONSISTENTE

| Campo | Valor |
|---|---|
| ID campaña | `120255948425820242` |
| ID conjunto | `120255948425830242` |
| Objetivo | `OUTCOME_ENGAGEMENT` |
| `optimization_goal` | **`LINK_CLICKS`** |
| `destination_type` | **`WHATSAPP`** |
| Indicador de resultado | **`actions:link_click`** |
| Presupuesto | $5,00 USD / día |
| Estado campaña | **ACTIVE** |
| Estado conjunto | **PAUSED** (desactivado 10/09 01:04) |
| Creada | 09/09/2026 22:45 |

**Público:** Ecuador — Cuenca (Azuay). Edad mín. 25.
(Editado el 10/09 01:04, justo antes de desactivarse; antes era
Cuenca + Azogues, 22–62.)

**Métricas (08/09 → 10/09):** $0,00 · 1 impresión · sin resultados.

**Observaciones estructurales:**
- **Inconsistencia doble.** El nombre replica al de una campaña de
  inscripciones por WhatsApp y el `destination_type` **sí** es
  `WHATSAPP` — pero el `optimization_goal` es `LINK_CLICKS` y el
  indicador de resultados es `actions:link_click`. Es decir: **envía a
  WhatsApp pero compra clics, no conversaciones.** Meta optimiza por
  quién hace clic, no por quién escribe.
- Los umbrales de `benchmarks.md` **no se aplican**: fueron calibrados
  sobre conversaciones y un costo por clic no es la misma magnitud (§9).
- **Campaña ACTIVE con conjunto PAUSED** → no entrega nada. Es una
  cáscara.
- Duplicado abandonado: creada 09/09 22:45 con Power Editor; su conjunto
  fue desactivado el 10/09 01:04, un minuto antes de que se creara la
  versión correcta (§1.4) a la 01:05.

---

## 2. Campañas pausadas con histórico relevante

Usadas en la calibración de `benchmarks.md`. No requieren veredicto.

| Campaña | Gasto | Conv. | CPA | CTR | CPM | Perfil |
|---|---|---|---|---|---|---|
| Venta Local Comercial - Gualaceo \| Chemu | $15,89 | 48 | $0,33 | 7,60 % | $1,41 | EC |
| MENSAJES PM | $10,69 | 20 | $0,53 | 3,31 % | $2,33 | EC |
| Mensajes Latin Eagle | $20,53 | 19 | $1,08 | 7,10 % | $9,65 | Intl |
| mensajes uk (advibe) | $25,79 | 17 | $1,52 | 1,57 % | $3,65 | Intl |
| venta eeuu | $13,36 | 13 | $1,03 | 11,54 % | $9,95 | Intl |
| Trailblazer | $2,52 | 11 | $0,23 | 11,24 % | $1,29 | EC |
| Paola Miguitama \| Dormitorios \| WhatsApp | $12,13 | 9 | $1,35 | 3,04 % | $2,49 | EC |
| Hyundai Tucson | $1,59 | 6 | $0,27 | 7,88 % | $1,42 | EC |
| Citroen C4 | $2,58 | 5 | $0,52 | 6,24 % | $1,53 | EC |
| Mensajes Latin Eagle - Centroamérica | $8,51 | 3 | $2,84 | 2,56 % | $10,90 | Intl |
| uk 12*8 | $5,31 | 2 | $2,66 | 1,31 % | $2,32 | Indet. |
| MENSAJES PM ago | $2,21 | 2 | $1,11 | 1,26 % | $2,31 | EC |
| **Latin Eagle ec** | **$5,09** | **1** | **$5,09** | **2,05 %** | **$2,38** | **EC** |

**`Latin Eagle ec`** (`120255925669270242`) merece mención aparte: fue
pausada el **10/09 01:06** con 1 conversación y $5,09 de gasto. Falla
ambos mínimos de evidencia del perfil Ecuador/Local ($8 y 10
conversaciones). Es el caso más reciente del patrón documentado en
`benchmarks.md` §7.5 y `contexto.md` §5.3.

**`uk 12*8`** queda con perfil indeterminado: el nombre sugiere Reino
Unido pero su CPM de $2,32 es propio del perfil Ecuador/Local. Otro
recordatorio de que el nombre no es fuente de verdad.

---

## 3. Patrones estructurales de la cuenta

### 3.1 Pares duplicados

| Versión antigua | Goal | Versión de reemplazo | Goal | Resultado |
|---|---|---|---|---|
| `Chemu Tienda` (08/09 22:38) | `LINK_CLICKS` | `Chemu Tienda 2` (08/09 22:43) | `CONVERSATIONS` | Antigua pausada a los 3 min, sin gasto |
| `Santa Barbara Cuenca` (09/09 22:45) | `LINK_CLICKS` | `Santa Bárbara Cuenca \| Inscripciones \| WhatsApp` (10/09 01:05) | `CONVERSATIONS` | Conjunto antiguo desactivado; **campaña sigue ACTIVE** |

En ambos casos el error corregido fue el mismo: `LINK_CLICKS` donde
correspondía `CONVERSATIONS`. Ver `contexto.md` §5.2.

### 3.2 Nomenclatura

| Conjunto | Nombre |
|---|---|
| `120255924724610242` | `Nuevo conjunto de anuncios de Interacción` |
| `120255925418320242` | `Nuevo conjunto de anuncios de Interacción` |
| `120255925493020242` | `Nuevo conjunto de anuncios de Interacción` |
| `120255922778490242` | `Nuevo conjunto de anuncios de Interacción` |
| `120255948425830242` | `Nuevo conjunto de anuncios de Interacción` |
| `120255950579470242` | `Cuenca \| Padres \| WhatsApp` ✓ |

Cinco de seis conjuntos comparten el mismo nombre por defecto. Los
anuncios repiten el patrón (`Nuevo anuncio de Interacción`), salvo
`SB Cuenca | Inscripciones | v1`.

Convención legible observada, cuando se usa:
`<Marca/Producto> | <Público o ángulo> | <Canal>`.
Está documentada aquí como referencia; **no está aplicada** en la
mayoría de la cuenta.

### 3.3 Configuración común a todos los conjuntos activos

| Parámetro | Valor |
|---|---|
| `billing_event` | `IMPRESSIONS` |
| Estrategia de puja (log) | "Automatically bid for actions" |
| `bid_strategy` (campo) | **`NO DISPONIBLE`** |
| Advantage+ Audience | `On` |
| `promoted_object` | vacío — sin píxel ni evento de conversión |
| `end_time` | ausente — sin fecha de fin programada |
| Presupuesto | a nivel conjunto (no CBO) |
| `learning_stage_info` | `null` → **NO DISPONIBLE** |

### 3.4 Estructura de cuenta

Todas las campañas activas son **1 campaña → 1 conjunto → 1–2 anuncios**.
No hay campañas con múltiples conjuntos ni pruebas A/B estructuradas.
Sin Campaign Budget Optimization.

---

## 4. Resumen de campos `NO DISPONIBLE` en este archivo

| Dato | Motivo |
|---|---|
| Página promocionada por campaña | `page_id` no es campo consultable (`cuenta-meta.md` §3.1) |
| Público detallado de `constructora` | No presente en el registro de `targets_spec` consultado |
| `bid_strategy` por conjunto | Campo existe, la API no lo devolvió poblado |
| `learning_stage_info` (los 6 conjuntos) | Devuelto como `null` |
| Intencionalidad del destino MESSENGER en Latin Eagle 2 | No determinable desde la plataforma |
| Número de WhatsApp por campaña | No expuesto por las herramientas de consulta |
| Texto y creativo de los anuncios | `ads_get_creatives` en listado devuelve solo campos parciales; mapear `creative_id` por anuncio queda fuera de esta ficha |
