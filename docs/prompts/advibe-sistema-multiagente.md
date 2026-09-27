# AdVibe AI: sistema multiagente de operaciones

> Prompt para Claude Code, ejecutado dentro del repo `advibe` con los conectores Gmail, Google Calendar, Google Drive y Meta Ads.
> Antes de usarlo, rellena los campos `[COMPLETAR]` de la sección 2. Lo que dejes vacío, el sistema lo tratará como INFORMACIÓN FALTANTE.

---

## 1. Objetivo

Construye en este repositorio el sistema de agentes de IA de AdVibe Agencia. Debe servir como capa operativa: investigar, analizar, planificar, preparar, revisar y reportar el trabajo de la agencia.

Lo que construyes aquí son archivos reales de Claude Code:
- instrucciones del orquestador en `CLAUDE.md`/`AGENTS.md`;
- subagentes en `.claude/agents/*.md`;
- skills en `.claude/skills/*/SKILL.md` para procedimientos repetibles (reportes, auditorías);
- documentación en `docs/advibe-os/`;
- plantillas de datos.

Una conversación de diseño no cuenta como entregable. Termina con archivos creados, probados y confirmados en git.

## 2. Datos del negocio

- Servicios que ofrece AdVibe y su alcance: [COMPLETAR]
- Precios o rangos oficiales: [COMPLETAR, o "no definidos"]
- Clientes activos (nombre, slug, cuenta de Meta Ads, carpeta de Drive): [COMPLETAR]
- Equipo y responsables: [COMPLETAR]
- Dónde viven hoy los datos (tareas, facturación, contratos): [COMPLETAR, p. ej. "Google Sheets en Drive/AdVibe/Operaciones"]
- Idioma y tono de las respuestas: español, directo y sin relleno.

Nunca inventes precios, condiciones, métricas, fechas ni compromisos. Si falta un dato, escribe `INFORMACIÓN FALTANTE: <dato> (fuente esperada: <dónde debería estar>)` y sigue con lo demás.

## 3. Arquitectura

Ten en cuenta cómo funciona Claude Code: los subagentes no pueden invocar a otros subagentes. Por eso el orquestador es la sesión principal, no un subagente.

- **AdVibe COO (sesión principal):** sus reglas van en `CLAUDE.md`/`AGENTS.md`. Interpreta la petición, decide si delegar, lanza los subagentes (en paralelo cuando las tareas sean independientes), verifica y consolida la respuesta. Solo delega cuando eso mejora el resultado. Las tareas simples las resuelve él mismo.
- **Subagentes propuestos.** Puedes fusionar o dividir si lo justificas, siempre que no se pierda ninguna función:
  1. `prospeccion-ventas`: investigar prospectos y su presencia digital, calificarlos con criterios explícitos, preparar auditorías, propuestas, discovery calls, follow-ups y manejo de objeciones. Sin spam: prioriza pocas oportunidades reales.
  2. `meta-ads`: leer campañas, conjuntos y anuncios; métricas (CPL, CPA, CTR, CPC, CPM, frecuencia, conversiones); comparar periodos; detectar anomalías; hacer diagnóstico de funnel y proponer acciones.
  3. `contenido`: estrategia, calendarios, copies, hooks, conceptos y variantes A/B por plataforma. Debe coordinarse con el subagente existente `guionista` y no duplicarlo: los guiones siguen siendo trabajo del guionista.
  4. `cuentas-operaciones`: cubre client success y operaciones. Entregables, pendientes, retrasos, bloqueos, agendas, actualizaciones a clientes y riesgos de satisfacción. Responde a "¿qué tengo pendiente esta semana?" y "¿qué debería hacer hoy?". Prioriza por impacto económico, urgencia, dependencias, compromiso con el cliente y esfuerzo.
  5. `finanzas`: facturación, cobros, vencimientos, ingresos recurrentes, gastos y rentabilidad. Etiqueta cada cifra como CONFIRMADO, ESTIMACIÓN o PROYECCIÓN.
  6. `investigacion`: mercados, competidores, tendencias y herramientas. Cita las fuentes y separa hechos, análisis e inferencias.
- **Reporting como skill (`reporte-advibe`), no como agente.** Es un formato que usan varios agentes, con esta estructura fija: RESULTADOS (qué pasó) → ANÁLISIS (por qué probablemente pasó) → INSIGHTS → ACCIONES → PRÓXIMOS PASOS.

Cada archivo de subagente debe incluir: `description`, que es lo que usa el COO para decidir a quién delegar; `tools`, restringidas a lo mínimo necesario; propósito; entradas; salidas; límites; y el formato de entrega.

## 4. Reglas que aplican a todos los agentes

- **Jerarquía de fuentes.** FUENTE DE VERDAD (archivos o hojas oficiales, APIs) > memoria o notas > inferencia. Si dos fuentes se contradicen, escribe `CONFLICTO DETECTADO`, nombra ambas fuentes y no elijas una en silencio.
- **Separar dato de opinión.** Presenta siempre la cadena dato observado → interpretación → hipótesis → recomendación. Una hipótesis nunca se presenta como hecho.
- **Aislamiento de clientes.** Antes de cualquier tarea, fija y declara cliente, cuenta, periodo y fuente de datos. Los datos de un cliente viven en su propia carpeta o espacio (`clientes/<slug>/` o su carpeta de Drive) y nunca se usan para responder sobre otro. Si la petición no deja claro el cliente, pregunta.
- **Control de calidad antes de entregar.** Revisa cliente y periodo correctos, cifras que cuadran, fuentes citadas, supuestos declarados y pendientes listados.
- **Leer antes de afirmar.** Si hay archivos relevantes, léelos antes de responder algo que dependa de ellos.

## 5. Permisos y aprobaciones

| Nivel | Qué incluye | Cómo se ejecuta |
|---|---|---|
| 1. Autónomo | Investigar, leer archivos, Drive y correo, consultar Meta Ads en modo lectura, analizar, ejecutar código local, redactar borradores (también borradores de Gmail), crear documentos internos | Sin pedir permiso |
| 2. Preparar y esperar | Mensajes comerciales, cambios de estrategia, propuestas de cambio en campañas, eventos de calendario con invitados externos | El agente deja la acción lista (borrador o diff exacto) y se detiene hasta recibir aprobación |
| 3. Confirmación explícita por acción | Enviar emails, publicar, crear, activar o editar campañas, anuncios o audiencias, cualquier cambio de presupuesto o gasto, pagos, compartir o borrar archivos, compromisos contractuales | Solo con un "sí" explícito a esa acción concreta. Nunca en bloque ni por inferencia |

Aplícalo también de forma técnica, no solo en el texto. En el `tools` de cada subagente incluye solo herramientas de lectura. Por ejemplo, `meta-ads` recibe las herramientas `ads_get_*` y `ads_insights_*`, pero no `ads_create_*`, `ads_update_*` ni `ads_activate_*`. `finanzas` y `prospeccion-ventas` no reciben `send_message`. Las acciones de nivel 3 solo puede ejecutarlas la sesión principal, después de la confirmación.

## 6. Datos y memoria

1. Audita qué fuentes existen realmente (Drive, repo, Supabase, Meta Ads).
2. Define en `docs/advibe-os/fuentes-de-verdad.md` qué fuente manda para cada tipo de dato: clientes, servicios, precios, contratos, campañas, métricas, tareas, cobros, entregables y responsables.
3. Si un tipo de dato no tiene fuente, crea una plantilla (CSV o Markdown con columnas definidas) y márcala como pendiente de llenar.
4. No subas al repo datos sensibles de clientes (contratos, facturación, datos personales). Esos datos se quedan en Drive y el repo guarda solo estructura, plantillas e instrucciones. Si dudas, pregunta.

## 7. Cómo trabajar

Trabaja por etapas y de forma autónoma. No pidas confirmación para decisiones reversibles, como crear o editar archivos del sistema. Detente solo para acciones de nivel 2 o 3, o si falta un dato que bloquea la etapa.

1. **Auditoría.** Revisa las herramientas y conectores disponibles (incluidas las herramientas diferidas vía ToolSearch), el repo (`.claude/`, `docs/`, `supabase/`) y Drive. Documenta en `docs/advibe-os/auditoria.md` qué está disponible, qué no, y los permisos de cada conector.
2. **Diseño.** Escribe `docs/advibe-os/arquitectura.md` con el mapa de agentes, los flujos de delegación y la tabla de permisos.
3. **Implementación.** Crea los subagentes, skills, la sección del COO en `CLAUDE.md` y las plantillas de datos.
4. **Prueba.** Ejecuta en modo lectura, sin efectos externos, al menos un flujo real de punta a punta. Ejemplo: "Analiza cómo van las campañas de <cliente> en los últimos 14 días frente a los 14 anteriores y dime qué hacer esta semana". Así pruebas la delegación a `meta-ads`, el uso de la skill de reporte y la consolidación. Si no hay datos reales accesibles, usa un cliente ficticio llamado "CLIENTE-PRUEBA" y dilo claramente. Prueba también que una petición de nivel 3 (por ejemplo "sube el presupuesto un 20%") se detiene y pide confirmación.
5. **Commit** en la rama de trabajo, con mensajes claros. No hagas push a `main`.

Si una integración no existe (CRM, facturación, gestor de tareas): identifícala, define la interfaz que necesitaría (qué datos y en qué formato), deja preparada la estructura y no afirmes que está conectada.

## 8. Entregable final

Un informe ejecutivo breve en el chat, y el mismo informe en `docs/advibe-os/informe.md`, con:

- **A. Arquitectura:** mapa de agentes.
- **B. Agentes:** tabla con nombre, propósito, herramientas, entradas, salidas, permisos y límites.
- **C. Orquestación:** cómo decide y delega el COO.
- **D. Memoria:** qué fuente usa cada agente.
- **E. Automatizaciones:** qué podría programarse, por ejemplo un resumen semanal de campañas cada lunes. No crees tareas programadas sin mi aprobación: propónlas.
- **F. Aprobaciones:** la tabla de niveles.
- **G. Implementado:** lista de archivos creados.
- **H. Pendientes:** qué falta y qué necesitas de mí, concretamente.
- **I. Prueba:** qué se ejecutó, resultado y fallos encontrados.

Sé honesto: si algo no funcionó o no se pudo probar, dilo.
