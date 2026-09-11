# Benchmarks — Enfoque Visual

Fuente de configuración única del agente `campaign-auditor`.
Ningún umbral vive dentro del prompt del auditor: todos se leen de este archivo.
Recalibrar = editar este archivo. No hay que tocar el agente.

- **Cuenta:** Enfoque Visual ADS (`960229743528284`)
- **Moneda:** USD
- **Zona horaria de la cuenta:** America/Guayaquil (UTC−05)
- **Última calibración:** 10/09/2026
- **Estado de los benchmarks:** INICIALES

---

## 0. Advertencia de interpretación (obligatoria en todo reporte)

> **Los benchmarks históricos son REFERENCIAS, no garantías de rendimiento.**
>
> Describen lo que esta cuenta logró en un período corto y con presupuestos
> pequeños. No son una predicción, ni una promesa de resultados, ni un
> estándar de la industria. Una campaña que cumple el benchmark puede
> rendir peor mañana; una que no lo cumple puede ser correcta en un
> contexto distinto (audiencia nueva, estacionalidad, producto distinto,
> subasta distinta).
>
> El auditor los usa como **punto de comparación para ordenar la
> atención**, nunca como prueba de que algo funciona o no funciona.
> Toda conclusión debe poder sostenerse con los datos observados de la
> campaña, no solo con el hecho de cruzar un umbral.

El auditor debe reproducir esta advertencia, en forma resumida, en el
encabezado de cada reporte.

---

## 1. Origen de la calibración

Calibrado el **10/09/2026** con `ads_get_ad_entities` a nivel campaña,
`date_preset: last_90d`, sobre el histórico disponible de la cuenta.

**Base de calibración:**

| Concepto | Valor |
|---|---|
| Campañas de conversaciones con ≥1 resultado | 16 |
| Gasto total de esas campañas | $151,50 USD |
| Conversaciones totales | 187 |
| CPA combinado (blended) | $0,81 USD |
| Gasto máximo de una sola campaña | $25,79 USD |

Se excluyeron de la calibración las campañas cuyo resultado medido **no
es una conversación** (`constructora` → visitas a la página de Facebook;
`Tráfico AINSTAGRAM` → visitas al perfil de Instagram). Mezclar esos
resultados con conversaciones produciría umbrales sin sentido.

### Limitaciones conocidas de esta calibración

1. **La ventana `last_90d` cubre casi toda la historia de la cuenta.**
   No es una muestra de un período: es prácticamente el universo
   completo. No hay un período anterior contra el cual contrastar.
2. **Ninguna campaña superó los $26 de gasto acumulado.** Los umbrales
   están calibrados sobre presupuestos muy pequeños ($3–$7/día) y
   duraciones cortas. No se sabe cómo se comportan estas métricas con
   presupuestos mayores.
3. **Casi ninguna campaña vivió lo suficiente para acumular frecuencia.**
   Ver §4.
4. **La cuenta se reconstruyó casi por completo entre el 07 y el 10 de
   septiembre de 2026.** La mayor parte del volumen activo actual tiene
   días de vida, no semanas.

**Consecuencia:** estos son benchmarks **iniciales**. Se espera que
cambien. Deben recalibrarse cuando haya campañas con mayor duración y
mayor gasto acumulado.

---

## 2. Asignación de perfil

El perfil se asigna por el **targeting real del conjunto de anuncios**
(`targeting.geo_locations`), **nunca por el nombre de la campaña**.
Los nombres de esta cuenta son poco confiables (ver §7).

| Condición sobre `targeting.geo_locations` | Perfil |
|---|---|
| Todas las ubicaciones en Ecuador (`country: EC`) | **Ecuador/Local** |
| Todas las ubicaciones fuera de Ecuador | **Internacional** |
| Mezcla de Ecuador y fuera, o no se puede determinar | **Internacional** + nota explícita |

La regla de desempate hacia Internacional es deliberada: el perfil
Internacional es el más permisivo en CPA, de modo que una asignación
equivocada no produce un APAGAR injusto. Cuando se aplique por desempate,
el auditor debe decirlo en el reporte.

---

## 3. Perfiles de umbrales

### 3.1 Perfil Ecuador/Local

Aplica a conjuntos cuyo targeting está íntegramente en Ecuador.

| Umbral | Valor | Derivación |
|---|---|---|
| `CPA_OBJETIVO` | **$0,70 USD** | Por encima del CPA histórico EC ($0,54 combinado). Meta conservadora, no aspiracional. |
| `CPA_MAXIMO` | **$1,50 USD** | ≈2× objetivo. Apenas por encima del peor caso histórico con volumen real (Paola Miguitama, $1,35). |
| `CTR_REFERENCIA` | **5,0 %** | Piso, no promedio. La mediana EC observada está por encima. |
| `CPM_RANGO` | **$1,30 – $3,90 USD** | Banda operativa. El rango EC observado fue $1,05–$2,49; la banda se ensancha a propósito para no marcar variación normal de subasta. |
| `EVIDENCIA_MINIMA_GASTO` | **$8,00 USD** | |
| `EVIDENCIA_MINIMA_CONVERSACIONES` | **10** | |

### 3.2 Perfil Internacional

Aplica a conjuntos cuyo targeting está fuera de Ecuador (EE. UU., UK,
Centroamérica, etc.).

| Umbral | Valor | Derivación |
|---|---|---|
| `CPA_OBJETIVO` | **$1,30 USD** | CPA histórico internacional combinado: $1,36. |
| `CPA_MAXIMO` | **$2,60 USD** | ≈2× objetivo. Los peores casos históricos ($2,66 y $2,84) quedan apenas fuera. |
| `CTR_REFERENCIA` | **4,0 %** | Piso. |
| `CPM_RANGO` | **$8,50 – $11,00 USD** | Corresponde al clúster real de campañas internacionales ($8,64–$10,90). Un CPM internacional muy por debajo de esta banda es señal de que el targeting quizá no es realmente internacional. |
| `EVIDENCIA_MINIMA_GASTO` | **$15,00 USD** | Más alto que EC porque el CPM internacional es ~5× mayor: se necesita más gasto para comprar el mismo volumen de señal. |
| `EVIDENCIA_MINIMA_CONVERSACIONES` | **10** | |

### 3.3 Regla de evidencia mínima — operador Y (AND)

> `EVIDENCIA_SUFICIENTE = (gasto ≥ EVIDENCIA_MINIMA_GASTO) **Y** (conversaciones ≥ EVIDENCIA_MINIMA_CONVERSACIONES)`

**Ambas** condiciones deben cumplirse. No es `O`.

Motivo: con `O`, un conjunto que gastó $15 y produjo 2 conversaciones
pasaría el filtro de evidencia y habilitaría un veredicto fuerte sobre
una base de 2 eventos. Con `Y`, no. El gasto solo demuestra que hubo
entrega; las conversaciones demuestran que hubo resultado medible.
Hacen falta las dos cosas.

Si `EVIDENCIA_SUFICIENTE` es falsa, el veredicto no puede ser ESCALAR ni
APAGAR, sin importar qué tan buenas o malas se vean las métricas.

---

## 4. Frecuencia — PROVISIONAL

| Umbral | Valor | Estado |
|---|---|---|
| `FRECUENCIA_ALERTA` | **2,5** | **PROVISIONAL** |

Aplica a ambos perfiles.

**Por qué es provisional:** la frecuencia máxima observada en todo el
histórico de la cuenta es **1,80** (Venta Local Comercial Gualaceo). Ninguna
campaña vivió lo suficiente ni gastó lo suficiente para acercarse a 2,5.
El valor no está calibrado con datos de esta cuenta — es una convención
de la industria puesta como marcador de posición.

### Restricción operativa mientras esté marcado PROVISIONAL

> Mientras `FRECUENCIA_ALERTA` lleve la marca PROVISIONAL, **la frecuencia
> no puede ser una de las dos señales que sustentan un APAGAR.**
> Solo puede aparecer como señal de apoyo, y el reporte debe indicar que
> el umbral no está calibrado.

Esto no es una nota al pie: es una regla que el auditor debe aplicar.

**Cuándo recalibrar:** cuando existan al menos 3 campañas con ≥14 días
continuos de entrega y ≥$50 de gasto acumulado cada una. Con eso se
podrá observar en qué nivel de frecuencia el CPA de esta cuenta empieza
efectivamente a degradarse, y reemplazar 2,5 por un número propio.
Al recalibrar, eliminar la marca PROVISIONAL y esta restricción.

---

## 5. Ventana de cambios recientes — CONFIGURABLE

| Parámetro | Valor |
|---|---|
| `VENTANA_CAMBIO_RECIENTE` | **72 horas** |

Editable. Para cambiarla, modificar el valor aquí; el auditor lo lee de
este archivo.

**Qué hace:** si un conjunto o campaña tuvo un cambio relevante dentro de
esta ventana, el veredicto se fuerza a **OBSERVAR**. El razonamiento es
que las métricas posteriores a un cambio relevante mezclan dos
configuraciones distintas y aún no describen ninguna de las dos.

### 5.1 Cambios que SÍ activan la ventana

| Cambio | Evento en `ads_account_get_activity_logs` |
|---|---|
| Presupuesto | `Ad set budget updated`, `Campaign budget updated`, `Ad set budget scheduling enabled` |
| Targeting | `Ad set targeting updated` |
| Creativo | `Ad created`, `Update ad creative`, `Edit images`, `Add images` |
| Optimization goal | `Ad set optimization goal updated`, `Conversion event updated` |
| Pausa / reactivación | `Campaign status updated`, `Ad set status updated`, `Ad status updated` |
| Destino | cambio de `destination_type` (WhatsApp / Messenger / Instagram / sitio web / página) |
| Creación | `Campaign created`, `Ad set created` — un conjunto creado hace menos de `VENTANA_CAMBIO_RECIENTE` está dentro de la ventana por definición |

### 5.2 Cambios que NO activan la ventana

| Cambio | Evento |
|---|---|
| Nombre de campaña | `Update campaign name` |
| Nombre de conjunto | `Update ad set name` |
| Nombre de anuncio | `Update ad friendly name` |
| Etiquetas / organización | cualquier evento de etiquetado |

**Los cambios de nombre no activan la ventana.** Renombrar no altera la
entrega ni reinicia el aprendizaje.

---

## 6. Estado de aprendizaje

| Valor de `learning_stage_info` | Tratamiento |
|---|---|
| `LEARNING` | Fuerza **OBSERVAR** |
| `LEARNING_LIMITED` | Fuerza **OBSERVAR** |
| `SUCCESS` / aprendizaje completado | No fuerza nada |
| Campo ausente, `null` o no devuelto por la API | **`NO DISPONIBLE`** — ver abajo |

### 6.1 LEARNING_LIMITED fuerza OBSERVAR

Un conjunto en aprendizaje limitado no está entregando de forma estable:
no sale de la fase de aprendizaje porque no acumula suficientes eventos
de optimización. Sus métricas describen una entrega degradada, no el
mérito del conjunto. Juzgar rendimiento sobre esa base —en cualquier
dirección— es juzgar el síntoma equivocado.

El problema a resolver en ese caso es estructural (presupuesto,
audiencia, evento de optimización), y pertenece a la auditoría
estructural, no a la de rendimiento.

### 6.2 Cuando `learning_stage_info` no está disponible

> El auditor debe declarar explícitamente **`ESTADO DE APRENDIZAJE: NO
> DISPONIBLE`** y **nunca inferir** el estado de aprendizaje a partir de
> otros datos.

Prohibido deducirlo de días activos, volumen de conversiones, estabilidad
del CPA, o cualquier proxy. Si la API no lo devolvió, no se sabe.

`NO DISPONIBLE` **no** fuerza OBSERVAR por sí solo, pero **sí** limita la
confianza a **MEDIA como máximo**: no se puede tener confianza ALTA sobre
un juicio de rendimiento sin saber si el conjunto terminó de aprender.

**Estado observado en esta cuenta (10/09/2026):** la API devolvió
`learning_stage_info: null` para los 5 conjuntos activos. El campo existe
y es válido a nivel `adset` (verificado con `ads_get_field_context`), pero
no vino poblado.

---

## 7. Contexto no numérico de la cuenta

Datos que no son umbrales pero que el auditor necesita para interpretar
correctamente lo que lee.

### 7.1 Ventana de atribución
El indicador de resultados de esta cuenta es
`actions:onsite_conversion.messaging_conversation_started_7d` —
**atribución de 7 días**. Una campaña con menos de 7 días de vida aún
tiene conversaciones por atribuir. Sus resultados están subcontados y su
CPA sobrestimado.

### 7.2 Estado de la cuenta
La cuenta ha entrado en `IN_GRACE_PERIOD` (período de gracia por pago)
más de una vez. Es una condición que corta la entrega de toda la cuenta y
tiene prioridad sobre cualquier hallazgo de campaña. Ver §8.

### 7.3 Nomenclatura
- Cuatro de los cinco conjuntos activos se llaman literalmente
  `Nuevo conjunto de anuncios de Interacción`. Los nombres no distinguen
  nada.
- Existen nombres de campaña que contradicen su configuración real
  (§7.4). **El nombre no es fuente de verdad para nada.**

### 7.4 Patrón conocido de configuraciones inconsistentes
Campañas cuyo nombre sugiere mensajes/WhatsApp pero cuyo
`optimization_goal` real es `LINK_CLICKS`. Casos conocidos:
`Santa Barbara Cuenca` y `Chemu Tienda`. Ver §9.

### 7.5 Patrón histórico de pausado
El operador de la cuenta ha pausado campañas con 1–3 conversaciones
acumuladas. Es un umbral de decisión muy por debajo de la evidencia
mínima definida en §3.3. El auditor no debe imitar ese patrón: es
precisamente el sesgo que estos benchmarks existen para corregir.

---

## 8. Alerta crítica de cuenta

Ciertas condiciones afectan a **toda la cuenta** y vuelven irrelevante
cualquier optimización de campaña. Deben aparecer como
**ALERTA CRÍTICA DE CUENTA al inicio del reporte**, antes de cualquier
otra sección.

| Condición (`account_status` de `ads_get_ad_accounts`) | Severidad |
|---|---|
| `IN_GRACE_PERIOD` | **CRÍTICA** |
| `UNSETTLED` | **CRÍTICA** |
| `DISABLED`, `CLOSED`, `PENDING_RISK_REVIEW`, `ANY_ACTIVE_REJECTED` | **CRÍTICA** |
| `is_queryable: false` | **CRÍTICA** — la auditoría no puede completarse |
| Errores devueltos por `ads_get_errors` a nivel cuenta | **CRÍTICA** |

Regla: si existe una alerta crítica de cuenta, el reporte la presenta
primero y declara explícitamente que las recomendaciones por campaña
quedan supeditadas a resolverla.

---

## 9. Chequeo de consistencia de configuración

El auditor compara **lo que el nombre promete** contra **lo que la
configuración realmente compra**:

- `optimization_goal` del conjunto
- `destination_type` del conjunto
- `results.indicator` devuelto por la API

Si el nombre sugiere mensajes / WhatsApp / conversaciones / inscripciones
y el `optimization_goal` real es otra cosa (`LINK_CLICKS`,
`POST_ENGAGEMENT`, `PROFILE_AND_PAGE_ENGAGEMENT`, etc.), o el
`results.indicator` no es
`actions:onsite_conversion.messaging_conversation_started_7d`:

1. Marcar **`⚠️ CONFIGURACIÓN INCONSISTENTE`**.
2. **No aplicar los umbrales de §3.** Fueron calibrados sobre
   conversaciones; un CPA de $0,05 por clic en enlace no es comparable
   con un CPA de $0,70 por conversación. Compararlos produce
   conclusiones falsas en cualquier dirección.
3. Forzar **OBSERVAR** con confianza **BAJA**.
4. Reportarlo en la **auditoría estructural**, no en la de rendimiento.

Un desajuste de `destination_type` respecto al histórico de esa misma
marca (ej. `MESSENGER` donde el histórico era `WHATSAPP`) **no** es una
inconsistencia bloqueante si el `optimization_goal` y el
`results.indicator` sí corresponden a conversaciones — pero sí debe
señalarse como comparabilidad limitada contra el benchmark histórico.

---

## 10. Campañas fuera del alcance de estos benchmarks

Estos benchmarks cubren **únicamente** campañas cuyo resultado medido es
`actions:onsite_conversion.messaging_conversation_started_7d`.

Quedan fuera del alcance, y deben reportarse como tales sin veredicto de
rendimiento:

| Indicador | Ejemplo en la cuenta |
|---|---|
| `page_visit_view` | `constructora` |
| `profile_visit_view` | `Tráfico AINSTAGRAM` |
| `actions:link_click` | `Santa Barbara Cuenca`, `Chemu Tienda` |
| `actions:post_engagement` | campañas AdVibe de diagnóstico |

Si se quiere auditar estas campañas, necesitan sus propios perfiles de
umbrales en este archivo.

---

## 11. Reglas de escalado cuantitativo — PENDIENTE

> **ESTADO: PENDIENTE. No definidas.**

No hay datos para definirlas. Ninguna campaña de esta cuenta ha superado
$26 de gasto acumulado, de modo que no existe evidencia sobre cómo se
comporta el CPA de esta cuenta cuando sube el presupuesto.

**Mientras esto siga PENDIENTE:** un veredicto ESCALAR recomienda subir
presupuesto **sin cuantificar cuánto ni con qué cadencia**. El auditor
debe decir explícitamente que la magnitud del incremento no está definida
en los benchmarks y queda a criterio del operador.

Definir aquí, cuando haya datos: incremento porcentual por paso, tiempo
mínimo de espera entre incrementos, y criterio de reversión.

---

## 12. Registro de cambios

| Fecha | Cambio |
|---|---|
| 10/09/2026 | Calibración inicial. Dos perfiles (Ecuador/Local, Internacional) sobre `last_90d`: 16 campañas, $151,50, 187 conversaciones. Frecuencia 2,5 marcada PROVISIONAL. Ventana de cambios en 72 h. Reglas de escalado en PENDIENTE. |
| 10/09/2026 | Evidencia mínima cambiada de `gasto O conversaciones` a `gasto Y conversaciones` (§3.3). `LEARNING_LIMITED` pasa a forzar OBSERVAR (§6.1). |
| 10/09/2026 | Añadidos: alerta crítica de cuenta (§8), tratamiento `NO DISPONIBLE` de `learning_stage_info` (§6.2), advertencia de interpretación de benchmarks (§0). |
