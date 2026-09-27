# Arquitectura de AdVibe AI

```
Pablo
  │
  ▼
AdVibe COO  (sesión principal · CLAUDE.md → docs/advibe-os/COO.md)
  │  fija cliente/periodo · decide · delega en paralelo · verifica · consolida · ejecuta nivel 3 tras "sí"
  │
  ├── meta-ads ─────────── Meta Ads (solo lectura) + Drive
  ├── prospeccion-ventas ─ Web, Biblioteca de Anuncios, Drive, borradores Gmail
  ├── contenido ────────── Drive, Calendar, Biblioteca de Anuncios, web
  │     └─(brief)→ guionista (ya existía)
  ├── cuentas-operaciones ─ Hoja CONTROL, Calendar, Gmail (lectura + borradores)
  ├── finanzas ─────────── Hoja CONTROL, contrato base
  └── investigacion ────── Web, Biblioteca de Anuncios, Drive
Skills compartidas: reporte-advibe (formato de informes) · briefing-semanal (flujo semanal)
Fuentes: fuentes-de-verdad.md · Aislamiento: clientes.md · Permisos: .claude/settings.json
```

## Decisiones de diseño

| Decisión | Por qué |
|---|---|
| El COO es la sesión principal, no un subagente | En Claude Code los subagentes no pueden lanzar otros subagentes |
| Se fusionan Sales y Prospecting, y Client Success y Operations | Usan las mismas fuentes y sus funciones se solapaban. Con menos agentes, la delegación del COO es más fiable |
| Reporting pasa a ser una skill | Es un formato que usan todos los agentes, no un dominio propio |
| Content no escribe guiones | Ya existía `guionista`, así que se evita duplicarlo |
| Los subagentes solo tienen herramientas de lectura (`tools`) | Los permisos quedan aplicados técnicamente, no solo escritos en el prompt |
| `settings.json` usa `ask` para las herramientas de nivel 3 | Así hace falta confirmación incluso si el COO intenta ejecutarlas |
| Aislamiento por patrón de nombre de campaña | Una misma cuenta de Meta contiene campañas de varios clientes |

## Ficha de agentes

| Agente | Propósito | Entradas | Salidas | Puede | No puede |
|---|---|---|---|---|---|
| meta-ads | Diagnóstico de campañas | Cliente, patrón, cuenta, periodos | Tabla, interpretación, hipótesis, recomendaciones con nivel | Leer Meta y Drive | Tocar campañas o presupuesto |
| prospeccion-ventas | Captar clientes | Negocio o zona | Ficha puntuada /15, mensajes, propuesta | Investigar, crear borradores en Gmail | Enviar, fijar precios, prometer resultados |
| contenido | Estrategia y copy | Cliente, objetivo, mes | Parrilla, copies A/B, brief para el guionista | Leer Drive y Calendar, investigar | Publicar, mezclar marcas |
| cuentas-operaciones | Qué hacer y para quién | Rango de fechas o cliente | Lista priorizada, alertas, datos que faltan | Leer la hoja, Calendar y Gmail; crear borradores | Escribir en la hoja, crear eventos, enviar |
| finanzas | Cobros y rentabilidad | Periodo | Tabla etiquetada CONFIRMADO / ESTIMACIÓN / PROYECCIÓN | Leer la hoja y el contrato | Pagos, cobros, escribir |
| investigacion | Inteligencia de mercado | Pregunta | Hechos con fuente, análisis, inferencias | Web, Biblioteca de Anuncios | Afirmar sin fuente |
| guionista | Guiones grabables | Brief y cliente | Guion con planos | Leer y escribir archivos | Copy de pauta |

## Automatizaciones propuestas (no creadas: requieren aprobación)

| Rutina | Cuándo | Qué hace |
|---|---|---|
| Briefing semanal | Lunes 07:50 (America/Guayaquil) | Skill `briefing-semanal` |
| Alertas de campañas | Diario 08:50 | `meta-ads` en modo alertas sobre las campañas ACTIVE |
| Aviso de cobros | Diario 08:00 | `finanzas`: vencimientos en los próximos N días (CONFIGURACION) |
| Cierre mensual | Día 1 | `reporte-advibe` por cliente con Meta Ads + contenido entregado |
