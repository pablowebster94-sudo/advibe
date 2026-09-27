# Auditoría del entorno (2026-09-27)

## Conectores

| Conector | Estado real | Uso en el sistema |
|---|---|---|
| Google Drive | ✅ Lectura y escritura | Fuente de verdad: hoja CONTROL, contratos, material |
| Google Calendar | ✅ Lectura y escritura | Agenda, publicaciones |
| Gmail | ⚠️ Conectado, pero **sin permiso de lectura**: `search_threads` devuelve "Insufficient scope" | Sin lectura de correos. Pendiente de reconectar |
| Meta Ads | ⚠️ 5 cuentas visibles, **solo 1 consultable** | Análisis de campañas |
| GitHub | ✅ Repo `advibe` | Versiona el sistema |
| Claude Code: subagentes, skills, rutinas | ✅ | Implementación |

## Meta Ads: cuentas

| Cuenta | ID | Estado | ¿Consultable? |
|---|---|---|---|
| Enfoque Visual ADS | 960229743528284 | ACTIVE | ✅ Contiene campañas de casi todos los clientes |
| AdVibe Agencia | 1694392422051692 | UNSETTLED | ❌ "Unknown error" |
| AdVibe ADS | 1291988673043325 | UNSETTLED | ❌ |
| Pablo Webster | 176897303 | UNSETTLED | ❌ |
| B (Pikchus FC) | 1725915511910745 | UNSETTLED | ❌ |

UNSETTLED suele indicar un saldo pendiente con Meta. Es probable que sea la causa de que no se puedan consultar (hipótesis).

## Drive: hallazgos

- **Hoja CONTROL duplicada 4 veces.** Existen `ADvibe CONTROL 2026` (`1S365…`, `1gSAE…`) y `ADvibe_CONTROL_2026 (1)` (`137Ed…`, `1d5v7…`). Se eligió `137Ed…` como oficial porque es la más completa y la más reciente. Además hay una `AdVibe_Control_DB` vacía, una `Hoja de cálculo sin título` y una quinta hoja, `AdVibe_Control_Clientes_Cobros_2026`, que encontró el agente de contenido y que incluye la nota "Pendiente prod. Manta" para Muebles Ideal.
- CONFLICTO DETECTADO entre copias:
  - `DIAS_AVISO_COBRO` vale 1 en la oficial y 3 en `1S365…`.
  - En la oficial, la fila de CETAD está desplazada una columna: "PENDIENTE_DEFINICION" cae en Día de pago y Estado queda vacío.
- **Datos vacíos en la hoja oficial:** SERVICIOS sin precios; CLIENTE_SERVICIOS, PRODUCCION, TAREAS, COBROS y PAGOS solo tienen cabeceras.
- **`Analisis_Avanzado_Meta_Ads` no es fiable:**
  - Las cifras están mal importadas por el separador decimal (p. ej. CPA "15.170.588.235.294.100").
  - Clasifica como "Élite" a campañas con 1–4 resultados, y cuenta el alcance como si fueran resultados.
  - Queda descartada como fuente. Meta Ads en vivo manda.
- El contrato base de 3 meses está completo y define las condiciones de pago y la exclusión de garantías.

## Repo

- Ya existía el subagente `guionista` y se ha integrado.
- `docs/` contenía documentación de otros productos (photo editor, ventads).
- `supabase/` contiene esquemas de leads de otros productos. No se usa como fuente operativa.
