---
name: briefing-semanal
description: Resumen operativo de la semana de AdVibe (agenda, entregas, pendientes de contenido, cobros próximos, alertas de campañas). Úsalo cuando Pablo pregunte "¿qué tengo esta semana?", "¿qué hago hoy?" o pida el briefing del lunes.
---

# Briefing semanal

Lo orquesta el COO. Lanza en paralelo:

1. `cuentas-operaciones`: agenda de Calendar de los próximos 7 días + pendientes de la hoja CONTROL (contenido pendiente por cliente, PRODUCCION, TAREAS, ENTREGAS).
2. `finanzas`: pagos que vencen en los próximos 7 días (día de pago en CLIENTES) y estado de COBROS.
3. `meta-ads`: campañas ACTIVE de la cuenta consultable, últimos 7 días vs 7 anteriores. Solo alertas (gasto sin resultados, coste por resultado disparado, campañas activas que no entregan).

Luego consolida en:

```
# Semana <fecha inicio> – <fecha fin>
## Hoy
## Esta semana (priorizado)
## Cobros próximos
## Alertas de campañas
## Clientes que necesitan atención
## Datos que faltan para operar mejor
```

Máximo una pantalla. Cada línea: acción · cliente · fecha · fuente.
