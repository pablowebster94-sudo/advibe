# Informe ejecutivo: AdVibe AI (2026-09-27)

## Qué se construyó

Un sistema multiagente dentro del repo `advibe`, que funciona en cualquier sesión de Claude Code abierta sobre este repo.

- **Orquestador (AdVibe COO)**: `CLAUDE.md` importa `docs/advibe-os/COO.md`. Contiene las reglas de contexto, delegación, fuentes, aprobaciones y calidad.
- **6 subagentes nuevos** en `.claude/agents/`: `meta-ads`, `prospeccion-ventas`, `contenido`, `cuentas-operaciones`, `finanzas` e `investigacion`. Se integró el `guionista` que ya existía.
- **2 skills** en `.claude/skills/`: `reporte-advibe` (formato RESULTADOS → ANÁLISIS → INSIGHTS → ACCIONES → PRÓXIMOS PASOS) y `briefing-semanal`.
- **Permisos técnicos**:
  - Cada subagente tiene solo herramientas de lectura (y borradores de Gmail donde aplica).
  - `.claude/settings.json` pide confirmación para 36 acciones de nivel 3: enviar correos, tocar campañas o presupuesto, compartir o borrar archivos, gestionar eventos.
- **Datos**: `fuentes-de-verdad.md` (qué fuente manda para cada dato), `clientes.md` (registro y reglas de aislamiento) y `auditoria.md`.
- **Arquitectura**: `arquitectura.md` (mapa, ficha de cada agente, decisiones de diseño, automatizaciones propuestas).

## Qué puede hacer ya

- Analizar las campañas de un cliente en la cuenta Enfoque Visual ADS, aislando sus campañas del resto, con comparación de periodos y anomalías.
- Responder "¿qué tengo esta semana?" o "¿qué hago hoy?" cruzando la hoja CONTROL con Calendar.
- Investigar prospectos y competidores, y redactar propuestas y mensajes sin inventar precios ni garantías.
- Crear parrillas, copies y briefs para el guionista.
- Resumir cobros por cliente, etiquetando cada cifra como confirmada o estimada.

## Probado

Dos flujos reales en modo lectura: el diagnóstico de campañas de AM Motorsport y la semana operativa. Detalle en `prueba-2026-09-27.md`. Los dos funcionaron. La prueba también encontró y corrigió un error del propio sistema.

## Hallazgos del negocio que surgieron en la auditoría

1. **4 de 5 cuentas de Meta figuran como UNSETTLED y no se pueden consultar.** Probablemente hay saldo pendiente con Meta.
2. **La campaña "Leads AM" está activa pero vacía**: no tiene conjuntos de anuncios.
3. **13 piezas pendientes (Muebles Ideal y Paola Miguitama) sin nada agendado**, con cobros el día 2 y el día 5.
4. **5 marcas con publicaciones recurrentes en Calendar que no están en la hoja de clientes**: Bocabel, Cardagali, Kueva, Panera y La Trinidad.
5. **La hoja CONTROL está duplicada 4 veces, con valores distintos entre copias.** La hoja "Analisis_Avanzado_Meta_Ads" tiene las cifras mal importadas y no es fiable.
6. **CETAD San Lucas tiene contrato pero no tiene día de pago definido.** Además, su fila está desplazada una columna.

## Pendientes: qué falta y qué necesito de ti

| # | Qué | Quién |
|---|---|---|
| 1 | Abrir una **sesión nueva** para que se registren los subagentes. Después, probar el enrutamiento automático y la restricción de `tools` | Pablo abre la sesión; Claude prueba |
| 2 | **Reconectar Gmail con permiso de lectura** (ahora devuelve "Insufficient scope") | Pablo |
| 3 | Regularizar las cuentas de Meta en estado UNSETTLED, o confirmar cuáles se usan | Pablo |
| 4 | Llenar SERVICIOS (precios) y CLIENTE_SERVICIOS en la hoja CONTROL | Pablo |
| 5 | Decidir qué son Bocabel, Cardagali, Kueva, Panera, La Trinidad, Chemu, Latin Eagle y Enfoque Visual (cliente, prueba o antiguo) | Pablo |
| 6 | Confirmar a qué cliente pertenecen Mini Cooper, Citroen C4, Hyundai Tucson y Trailblazer | Pablo |
| 7 | Borrar o archivar las 3 copias sobrantes de la hoja CONTROL | Pablo (nivel 3) |
| 8 | Crear carpetas `clientes/<slug>/` en Drive con el brand kit de cada cliente | Pablo, o Claude con aprobación |
| 9 | Aprobar las rutinas programadas propuestas en `arquitectura.md` | Pablo |
| 10 | Opcional: integrar un CRM o pipeline de ventas. Hoy no existe; la interfaz mínima sería una pestaña PROSPECTOS en la hoja CONTROL | Decisión de Pablo |
| 11 | En modo de permisos "bypass", las reglas `ask` pueden no mostrar confirmación. Usa el modo por defecto o auto | Pablo |
