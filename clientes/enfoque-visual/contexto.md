# Contexto — Enfoque Visual

Contexto comercial y estratégico necesario para interpretar las campañas.

**Advertencia de origen, importante:** este archivo se construyó
**exclusivamente con datos observables en la plataforma de Meta Ads**.
El repositorio del proyecto no contiene material sobre Enfoque Visual, y
no hubo briefing, contrato ni conversación con el cliente disponible.

En consecuencia, casi todo el contexto *comercial* real —el que
normalmente vendría del cliente— está marcado **`NO DISPONIBLE`**.
Lo que sí hay es contexto *operativo* inferido de la plataforma, y está
etiquetado como tal.

Verificado el 10/09/2026 21:42 (America/Guayaquil), modo solo lectura.

---

## 1. Naturaleza del anunciante

### 1.1 Lo que dice la plataforma

`ads_insights_advertiser_context` (`last_30d`):

| Campo | Valor |
|---|---|
| Vertical | **Professional Services** |
| Sub-vertical | **Real Estate** |
| Tipo de embudo | **Single Funnel** (70 %+ del gasto en una sola etapa) |
| Etapa del embudo | **Consideración** — captación de prospectos interesados |
| Objetivo de rendimiento | **Volumen** — maximizar conversiones al menor costo |

### 1.2 Lo que se observa en la estructura

La cuenta promociona **9 páginas de marcas distintas** (ver
`cuenta-meta.md` §3): un club deportivo formativo, una constructora, una
academia de inglés, dos empresas de multiservicios, un negocio de
motorsport, una marca personal, una agencia de publicidad y la propia
Enfoque Visual.

**Lectura estructural:** el patrón es el de una cuenta que opera
publicidad **para terceros**, no el de una marca única anunciando su
propio producto. Enfoque Visual aparece como una de las nueve páginas, no
como la única.

**Confirmación de este modelo de negocio: `NO DISPONIBLE`.** No hay
contrato, briefing ni documentación que confirme la relación entre
Enfoque Visual y las otras ocho marcas. El patrón es consistente con un
modelo de agencia o de servicio publicitario tercerizado, pero eso es
una lectura de la estructura, no un hecho verificado.

**Consecuencia práctica para la auditoría:** los benchmarks de la cuenta
mezclan negocios con economías distintas. Un CPA de $0,70 puede ser
excelente para un club deportivo y marginal para una constructora,
porque el valor de una conversación no es el mismo. Esto es precisamente
lo que `benchmarks.md` no puede corregir: segmenta por geografía porque
es lo único observable, no porque la geografía sea la variable económica
correcta.

---

## 2. Mercados y geografía

Derivado de `targeting.geo_locations` de los conjuntos, histórico y activo.

### 2.1 Mercado principal — Ecuador, eje Azuay/Cañar

| Ciudad | Provincia | Aparece en |
|---|---|---|
| Cuenca | Azuay | La mayoría de conjuntos EC |
| Gualaceo | Azuay | Chemu, Terreno Los Pinos |
| Paute | Azuay | Chemu Tienda 2 |
| Azogues | Cañar | Santa Bárbara (añadida el 10/09) |

Radios de 18 a 30 km. `location_types`: `frequently_in`, `home`, `recent`.

Es un mercado **local y compacto**. Cuenca y su área de influencia, no
Ecuador completo. Nunca se observó targeting a Quito ni Guayaquil.

### 2.2 Mercado secundario — internacional

| Ubicación | Aparece en |
|---|---|
| Patchogue, New York, EE. UU. | Latin Eagle 2 (activa) |
| EE. UU. (genérico) | `venta eeuu` (pausada) |
| Reino Unido | campañas `uk *` (pausadas) |
| Centroamérica | `Mensajes Latin Eagle - Centroamérica` (pausada) |

**Lectura:** el bloque internacional se concentra en la marca
**LatinEagle / Multiservices A&N Latino Corp**, y apunta a ubicaciones
con presencia de población latina (Patchogue NY es un caso claro). El
CPM internacional es ~5× el ecuatoriano ($8,50–$11,00 vs $1,30–$3,90),
lo que justifica que `benchmarks.md` mantenga dos perfiles separados.

**Confirmación de la estrategia detrás del bloque internacional:
`NO DISPONIBLE`.**

---

## 3. Modelo de captación

### 3.1 Canal

**Mensajería, casi exclusivamente.** El indicador de resultados dominante
de la cuenta es
`actions:onsite_conversion.messaging_conversation_started_7d`.

Destinos observados: WhatsApp (4 conjuntos activos), Messenger (1).

### 3.2 Por qué mensajería y no formularios

Observación relevante: **ninguna de las 9 páginas tiene aceptados los
Términos de Lead Generation** (`leadgen_tos_accepted: false` en las
nueve). Las campañas de formulario nativo no son ejecutables sin
aceptarlos primero.

No se puede determinar si la mensajería es una elección estratégica o una
consecuencia de esa limitación. **`NO DISPONIBLE`.**

### 3.3 Dónde termina la medición

`promoted_object` está vacío en los 6 conjuntos consultados: sin
`pixel_id`, sin `custom_event_type`, sin `pixel_rule`.

**Esto define el límite de todo lo que el auditor puede saber:** la
métrica final disponible es *una conversación iniciada*. No hay señal de
qué pasó después — si la conversación se respondió, si calificó, si
cerró, ni con qué valor.

Datos comerciales que quedan fuera de alcance, todos **`NO DISPONIBLE`**:

- Tasa de respuesta a las conversaciones iniciadas
- Tasa de calificación del prospecto
- Tasa de cierre
- Ticket promedio por venta
- Valor de vida del cliente
- Margen por servicio o por marca
- Costo de adquisición objetivo desde el punto de vista del negocio
- CRM o sistema de seguimiento de prospectos

**Implicación crítica para interpretar cualquier veredicto:** cuando el
auditor dice que un CPA de $0,58 es "bueno", quiere decir *bueno
comparado con el histórico de esta cuenta*. No puede decir si es
rentable. Un CPA de $0,58 por conversaciones que nunca se responden vale
cero. `benchmarks.md` §0 declara esto como advertencia obligatoria del
reporte, y la razón de fondo es esta ausencia de datos de negocio.

---

## 4. Escala y madurez operativa

| Dimensión | Valor observado |
|---|---|
| Gasto total histórico (`last_90d`) | $165,33 USD |
| Presupuestos diarios | $3,00 – $7,00 USD |
| Gasto máximo de una campaña | $25,79 USD |
| Campañas activas | 6 |
| Campañas creadas en total | ~31 |
| Duración típica | Días, no semanas |

**Lectura:** es una operación de escala muy pequeña, en fase de prueba.
La cuenta se reconstruyó casi por completo entre el 07 y el 10 de
septiembre de 2026: todas las campañas activas tienen menos de dos días
de vida, salvo una creada hace ~20 horas.

**Consecuencia para el auditor:** ninguna campaña ha operado lo
suficiente para producir evidencia estable. Por eso los benchmarks son
iniciales, la frecuencia 2,5 es provisional, y las reglas de escalado
están en PENDIENTE.

---

## 5. Patrón de operación observado

### 5.1 Ciclo de trabajo
Los `activity_logs` muestran creación de campañas concentrada en franjas
nocturnas (21:00–02:00 hora de la cuenta), en ráfagas: cuatro campañas
creadas en 72 minutos el 08/09 (21:59 → 23:11).

### 5.2 Corrección por duplicación, no por edición
Patrón repetido: ante una configuración incorrecta, el operador **crea
una campaña nueva y pausa la anterior**, en lugar de corregir la
existente.

- `Chemu Tienda` (LINK_CLICKS) creada 08/09 22:38 → pausada 22:41 →
  `Chemu Tienda 2` (CONVERSATIONS) creada 22:43.
- `Santa Barbara Cuenca` (LINK_CLICKS) creada 09/09 22:45 → conjunto
  desactivado 10/09 01:04 → `Santa Bárbara Cuenca | Inscripciones |
  WhatsApp` (CONVERSATIONS) creada 01:05.

**Consecuencia:** quedan cáscaras de campaña activas sin entrega, que el
chequeo de consistencia detecta. No son errores en curso; son residuos
de correcciones ya hechas. El auditor debe reportarlas como higiene
estructural, no como problemas de rendimiento.

### 5.3 Umbral de pausado muy bajo
Documentado en `benchmarks.md` §7.5: el operador ha pausado campañas con
1–3 conversaciones acumuladas. Caso más reciente: `Latin Eagle ec`
pausada el 10/09 01:06 con 1 conversación y $5,09 de gasto — falla
ambos mínimos de evidencia del perfil que le corresponde.

**Este es el sesgo específico que el auditor existe para contrarrestar.**
No debe imitarlo. Con evidencia insuficiente el veredicto es OBSERVAR,
aunque las métricas se vean mal.

### 5.4 Herramientas mixtas
Se observan campañas creadas desde Ads Manager / Power Editor y otras vía
MCP. La nomenclatura genérica (`Nuevo conjunto de anuncios de
Interacción`) corresponde a creación con valores por defecto.

---

## 6. Estacionalidad y calendario

**`NO DISPONIBLE`.**

El histórico disponible (~90 días, con volumen real concentrado en ~3
semanas) es demasiado corto para observar cualquier patrón estacional.

Señal única, no confirmada: la campaña de Santa Bárbara habla de
"Inscripciones abiertas", lo que sugiere un calendario de inscripción
escolar o deportiva. No hay forma de verificar fechas ni recurrencia con
las herramientas disponibles.

---

## 7. Contexto comercial NO DISPONIBLE

Lo siguiente sería necesario para una interpretación comercial completa y
**no existe en ninguna fuente accesible** (ni en Meta Ads, ni en el
repositorio del proyecto):

| Dato | Por qué importaría |
|---|---|
| Relación contractual entre Enfoque Visual y las otras 8 marcas | Define de quién es el presupuesto y quién decide |
| Objetivos comerciales por marca | Sin esto, "bueno" solo puede significar "mejor que el histórico" |
| Presupuesto mensual comprometido | Define si $165 es la escala real o una prueba |
| Ticket promedio y margen por marca | Convierte el CPA en rentabilidad |
| Tasa de respuesta y cierre de conversaciones | Determina si las conversaciones valen algo |
| Capacidad de atención de WhatsApp | Escalar volumen sin capacidad de respuesta destruye valor |
| Propuesta de valor y diferenciadores | Contexto para evaluar el creativo |
| Competencia local en Cuenca | Contexto para interpretar CPM y saturación |
| Restricciones legales o de marca | Límites de lo recomendable |
| Responsable de decisión por marca | A quién va dirigida cada recomendación |

**Regla para el auditor:** no suplir ninguno de estos con supuestos. Si
una conclusión depende de un dato de esta tabla, declarar que el dato no
está disponible y bajar la confianza en consecuencia.

---

## 8. Resumen para el auditor

1. Cuenta **multimarca** (9 páginas), probablemente operada para
   terceros. Los promedios de cuenta mezclan negocios distintos.
2. Vertical **Professional Services / Real Estate**, embudo único en
   etapa de **consideración**, optimizando **volumen**.
3. Dos mercados con economías muy distintas: **Cuenca y alrededores**
   (CPM bajo) y **destinos internacionales latinos** (CPM ~5× mayor).
   Por eso hay dos perfiles de benchmark.
4. Captación **100 % por mensajería**. Sin píxel. **La medición termina
   en la conversación iniciada.**
5. Escala **muy pequeña y muy reciente**: $165 históricos, campañas de
   días. Todo benchmark es provisional.
6. El operador **corrige duplicando** y **pausa muy pronto**. Lo primero
   genera residuos estructurales; lo segundo es el sesgo que el auditor
   debe contrarrestar.
7. **Ningún dato de rentabilidad está disponible.** Todo veredicto de
   rendimiento es relativo al histórico de la cuenta, nunca al negocio.
