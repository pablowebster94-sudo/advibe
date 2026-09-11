# Cuenta Meta — Enfoque Visual

Ficha estructural de la cuenta publicitaria. Datos verificados vía MCP de
Meta Ads el **10/09/2026 21:42 (America/Guayaquil)**, en modo solo lectura.

Todo dato que no pudo determinarse con las herramientas de consulta
disponibles está marcado **`NO DISPONIBLE`**, con el motivo.

---

## 1. Identificación

| Campo | Valor | Fuente |
|---|---|---|
| Nombre de la cuenta | **Enfoque Visual ADS** | `ads_get_ad_accounts` |
| ID de cuenta | **`960229743528284`** | `ads_get_ad_accounts` |
| Business Manager | **Enfoque Visual** | `ads_get_ad_accounts` |
| Business ID | **`1032465225456763`** | `ads_get_ad_accounts` |
| Moneda | **USD** | `ads_get_ad_accounts` |
| Zona horaria | **America/Guayaquil** (UTC−05) | `ads_get_ad_entities` (`timezone_name`) |
| Presupuesto diario mínimo | **$1,00 USD** (100 centavos) | `ads_get_ad_accounts` |

**Advertencia sobre la zona horaria:** la API devuelve `created_time` y
`updated_time` con offset `-0500`, mientras que
`ads_account_get_activity_logs` devuelve `datetime` como texto sin offset
(ej. `"9/10/2026 at 9:25 PM"`). Ambos están en hora de la cuenta. No
mezclar con UTC al calcular la ventana de 72 h.

---

## 2. Estado

| Campo | Valor |
|---|---|
| `account_status` | **`IN_GRACE_PERIOD`** |
| `is_queryable` | `true` |
| `is_ads_mcp_enabled` | `true` |
| `has_payment_method` | `true` |
| `not_queryable_reason` | `null` |

### 2.1 Historial de estado (verificado en `activity_logs`)

| Fecha y hora | Evento |
|---|---|
| 10/09/2026 05:04 | Active → **In grace period** |
| 10/09/2026 05:19 | Cuenta cobrada $1,87 |
| 10/09/2026 21:23 | Cuenta cobrada $13,17 |
| 10/09/2026 21:23 | In grace period → **Active** |
| 10/09/2026 21:25 | Active → **In grace period** |

**Patrón observado:** dos entradas en período de gracia el mismo día. La
segunda ocurrió **dos minutos después de un cobro exitoso de $13,17**.
Un período de gracia inmediatamente posterior a un pago que sí se
procesó no es consistente con saldo insuficiente. Causa raíz:
**`NO DISPONIBLE`** — las herramientas de consulta no exponen el detalle
del método de pago ni el motivo del rechazo.

**Consecuencia operativa:** `IN_GRACE_PERIOD` es una condición de
severidad CRÍTICA según §8 de `benchmarks.md`. Debe encabezar todo
reporte y tiene prioridad sobre cualquier hallazgo de campaña.

### 2.2 Otras cuentas del mismo usuario

Visibles en `ads_get_ad_accounts` pero **fuera del alcance** de este
cliente. No auditar:

| Cuenta | ID | Estado | Consultable |
|---|---|---|---|
| Pablo Webster | `176897303` | `UNSETTLED` | No |
| AdVibe ADS | `1291988673043325` | `UNSETTLED` | No |
| B (Pikchus FC) | `1725915511910745` | `UNSETTLED` | No |

---

## 3. Páginas asociadas

`ads_get_ad_account_pages` devuelve **9 páginas** promocionables bajo esta
cuenta:

| Página | `page_id` | `leadgen_tos_accepted` |
|---|---|---|
| Enfoque Visual | `531199800087373` | `false` |
| Club Formativo Santa Bárbara "Gualaceo" | `502746606252797` | `false` |
| LatinEagle Multiservices | `1305480965973274` | `false` |
| Constructora Peralta | `220405694491935` | `false` |
| Paola Miguitama | `1226660540522114` | `false` |
| Ad Vibe Agencia | `592020173996524` | `false` |
| Multiservices A&N Latino Corp | `911320888728139` | `false` |
| United Kingdom English Academy - Cuenca | `111042744144670` | `false` |
| AM Motorsport | `124405067312010` | `false` |

**Implicación estructural:** esta no es la cuenta de un solo anunciante.
Es una cuenta que promociona **múltiples marcas distintas**. Los
benchmarks agregados de la cuenta mezclan negocios diferentes; por eso
`benchmarks.md` segmenta por perfil geográfico y no por cuenta.

**Ninguna página tiene aceptados los Términos de Lead Generation.**
Consecuencia: no se pueden ejecutar campañas de formularios nativos
(`OUTCOME_LEADS` con `LEAD_GENERATION` / `QUALITY_LEAD`) sin aceptar
antes los ToS. Esto explica —al menos parcialmente— por qué toda la
captación se canaliza por mensajería.

### 3.1 Asociación página ↔ campaña

**`NO DISPONIBLE`.**

Motivo: `page_id` no existe en el catálogo de campos consultables
(`ads_get_field_context` lo devuelve en `unknown_fields`). `ads_get_creatives`
en modo listado devuelve únicamente `id`, `name`, `status` y `account_id`
— no expone `object_story_id`, que es donde vive la referencia a la
página. Determinar qué página promociona cada campaña requeriría mapear
`creative_id` por anuncio y consultar cada creativo individualmente.

La correspondencia entre nombre de campaña y página es **plausible pero
no verificada**, y `benchmarks.md` §7.3 establece que el nombre no es
fuente de verdad. No asumir.

---

## 4. Cuentas de Instagram vinculadas

**`ads_get_ig_accounts` devolvió una lista vacía (`[]`).**

Esto significa una de dos cosas, y las herramientas de consulta no
permiten distinguir cuál:

1. No hay cuentas de Instagram vinculadas a esta cuenta publicitaria para
   publicidad, o
2. La app no tiene concedido el permiso `instagram_basic` sobre las
   cuentas vinculadas.

Cuál de las dos: **`NO DISPONIBLE`**.

**Nota:** esto no impide entregar en Instagram. Los `placements`
registrados en `activity_logs` incluyen Instagram feed, Stories, Reels,
Explore y Profile Feed en todos los conjuntos activos. La entrega en
Instagram ocurre a través de la página de Facebook asociada.

---

## 5. Destinos y configuración de entrega

### 5.1 Destinos en uso (`destination_type`)

| Destino | Conjuntos | Observación |
|---|---|---|
| `WHATSAPP` | 4 | Destino dominante de la cuenta |
| `MESSENGER` | 1 | Solo `Latin Eagle 2`. Desvío respecto al histórico de esa marca |
| `FACEBOOK_PAGE` | 1 | Solo `constructora`. Fuera del alcance de los benchmarks |

**Número o cuenta de WhatsApp de destino: `NO DISPONIBLE`.** Las
herramientas de consulta no exponen el número de WhatsApp vinculado a un
conjunto ni al creativo.

### 5.2 Resultado medido

Indicador dominante de la cuenta:
`actions:onsite_conversion.messaging_conversation_started_7d`
→ **conversaciones iniciadas, ventana de atribución de 7 días**.

Indicadores secundarios presentes:

| Indicador | Dónde |
|---|---|
| `page_visit_view` | `constructora` |
| `profile_visit_view` | `Tráfico AINSTAGRAM` (pausada) |
| `actions:link_click` | `Santa Barbara Cuenca`, `Chemu Tienda` |
| `actions:post_engagement` | campañas AdVibe de diagnóstico (pausadas) |

**`attribution_spec` como campo consultable: `NO DISPONIBLE`** — no existe
en el catálogo de campos. La ventana de 7 días se deduce del sufijo
`_7d` del indicador de resultados, que sí es observable.

### 5.3 Configuración de puja y facturación

| Campo | Valor | Fuente |
|---|---|---|
| `billing_event` | **`IMPRESSIONS`** en los 6 conjuntos | `ads_get_ad_entities` |
| Estrategia de puja (log) | "Automatically bid for actions" en los 6 | `activity_logs` (`bid_type`) |
| `bid_strategy` (campo) | **`NO DISPONIBLE`** — el campo existe en el catálogo pero la API no lo devolvió poblado | `ads_get_ad_entities` |
| `promoted_object` | `pixel_id: null`, `custom_event_type: null`, `pixel_rule: null` en los 6 | `ads_get_ad_entities` |

**Implicación del `promoted_object` vacío:** no hay píxel ni evento de
conversión configurado en ningún conjunto activo. Toda la medición
depende de eventos on-site de Meta (conversaciones iniciadas en
WhatsApp/Messenger). **No hay señal de lo que ocurre después del primer
mensaje.** Una conversación iniciada es el final del embudo medible,
no el final del embudo real.

### 5.4 Programación

- `start_time` presente en los 6 conjuntos.
- `end_time`: **ausente en todos** → las campañas corren de forma abierta,
  sin fecha de finalización programada.
- `budget_remaining`: `$0,00` en todos — valor esperado para conjuntos con
  presupuesto diario, no indica agotamiento.

---

## 6. Audiencias

### 6.1 Advantage+ Audience
**Activado (`On`) en los 6 conjuntos**, verificado en el histórico de
`targets_spec` de `activity_logs`. El targeting declarado funciona como
sugerencia, no como límite duro: Meta puede entregar fuera de él.

**Consecuencia para la auditoría:** la asignación de perfil por
`targeting.geo_locations` (§2 de `benchmarks.md`) describe la *intención*
del targeting, no necesariamente la entrega real. Es la mejor señal
disponible, pero no es exacta.

### 6.2 Públicos personalizados
`activity_logs` registra numerosos eventos `Custom audience created` y
`Custom audience updated` con `actor_name: Meta` y nombre
`asa_auto_custom_audience`. Son públicos generados automáticamente por
Meta, **no creados por el operador**. No requieren mantenimiento y no
deben interpretarse como estrategia de retargeting deliberada.

Públicos personalizados creados manualmente: **`NO DISPONIBLE`** —
requeriría `ads_get_ad_account_custom_audiences`, que no está en la lista
de herramientas del auditor.

---

## 7. Volumen histórico de la cuenta

`ads_get_ad_entities` a nivel `ad_account`, `date_preset: last_90d`:

| Métrica | Valor |
|---|---|
| Gasto total | **$165,33 USD** |
| Impresiones | 60.003 |
| Alcance | 35.976 |
| Clics | 3.068 |
| CTR | 5,11 % |
| CPM | $2,76 USD |
| Frecuencia | 1,67 |

La ventana `last_90d` cubre prácticamente toda la historia de la cuenta
(ver `benchmarks.md` §1). Estas cifras son el universo, no una muestra.

---

## 8. Higiene estructural conocida

1. **Sin píxel ni eventos de conversión** en ningún conjunto activo (§5.3).
2. **Sin ToS de Lead Generation** en ninguna de las 9 páginas (§3).
3. **Nomenclatura degradada:** cuatro de los cinco conjuntos que entregan
   se llaman literalmente `Nuevo conjunto de anuncios de Interacción`.
   Un solo conjunto (`Cuenca | Padres | WhatsApp`) sigue una convención
   legible.
4. **Campañas duplicadas:** dos pares conocidos, donde la versión antigua
   usa `LINK_CLICKS` y la nueva `CONVERSATIONS`. Detalle en `campanas.md`.
5. **Sin fechas de fin programadas** (§5.4).
6. **`learning_stage_info` devuelto como `null`** en los conjuntos
   consultados. El campo existe y es válido a nivel `adset` (verificado
   con `ads_get_field_context`), pero no viene poblado. Ver §6 de
   `benchmarks.md`.

---

## 9. Operación

| Campo | Valor |
|---|---|
| Actor registrado en los logs | **Pablo Webster** (cambios manuales) |
| Actor `Meta` | eventos automáticos: revisión de anuncios, entrega, públicos automáticos, cobros, estado de cuenta |
| Herramientas de creación observadas | Ads Manager / Power Editor, y creación vía MCP |
| Roles y permisos de la cuenta | **`NO DISPONIBLE`** — requeriría consultas de administración de usuarios, fuera del alcance del auditor |

---

## 10. Resumen de campos marcados `NO DISPONIBLE`

| Dato | Motivo |
|---|---|
| Página promocionada por campaña | `page_id` no existe como campo; `ads_get_creatives` en listado no expone `object_story_id` |
| Número de WhatsApp de destino | No expuesto por ninguna herramienta de consulta |
| Cuentas de Instagram vinculadas | API devolvió `[]`; no se puede distinguir "no hay" de "sin permiso `instagram_basic`" |
| `bid_strategy` | Campo existe en el catálogo, la API no lo devolvió poblado |
| `attribution_spec` | No existe en el catálogo de campos |
| `learning_stage_info` | Devuelto como `null` en todos los conjuntos |
| Causa del período de gracia | No expuesta por las herramientas de consulta |
| Públicos personalizados manuales | Herramienta fuera del alcance del auditor |
| Roles y permisos de usuario | Fuera del alcance del auditor |
