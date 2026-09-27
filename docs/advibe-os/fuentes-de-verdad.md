# Fuentes de verdad

| Dato | Fuente oficial | Estado |
|---|---|---|
| Clientes, mensualidad, día de pago, estado | Drive · hoja `ADvibe_CONTROL_2026 (1)` (id `137EdqtLXOtB0pU1Yhqb9VpigWcyQl4lW0hOCCD_0DNc`), pestaña CLIENTES | Parcial: faltan contacto, servicio, fechas de inicio/renovación |
| Servicios y precios de lista | misma hoja, pestaña SERVICIOS | Vacío: 3 servicios sin precio ni descripción |
| Servicio contratado por cliente | misma hoja, CLIENTE_SERVICIOS | Vacío |
| Contrato base (condiciones, pagos, alcance) | Drive · doc `Contrato_Base_AdVibe_3_Meses` (id `10SlyY8YvZ2hITkemhiINmTVZ-Hlbs4O46taVWhtn_TI`) | Plantilla completa |
| Contrato firmado de un cliente | Drive (p. ej. `Contrato_AdVibe_CETAD_San_Lucas_3_meses_Actualizado-1.docx`) | Solo CETAD localizado |
| Campañas y métricas | Meta Ads API (conector META_ADS), en vivo | Solo la cuenta Enfoque Visual ADS es consultable |
| Producción, tareas, entregas, grabaciones, publicaciones | hoja CONTROL, pestañas homónimas | Vacías (solo cabeceras) |
| Agenda | Google Calendar `primary` | Activo: publicaciones recurrentes |
| Cobros y pagos | hoja CONTROL, COBROS / PAGOS | Vacías |
| Comunicaciones | Gmail | Solo lectura y borradores |
| Configuración operativa | hoja CONTROL, CONFIGURACION | Existe |

## Cómo entra el dato

Pablo registra producción, grabaciones, publicaciones y tareas con la web app **ADvibe CONTROL** (`apps-script/advibe-control/`), vinculada a la hoja oficial. Los agentes de Claude solo leen: no deben escribir en la hoja sin pasar por el nivel 2.

## Reglas

- Métricas de Meta: la API manda sobre cualquier hoja o CSV exportado.
- Si hay varias copias de una hoja, manda la indicada arriba. En Drive hay 12 hojas relacionadas; están inventariadas en `AdVibe OS/Reportes/Revisión: marcas, campañas y copias de hojas`. Las nº 5 (`1x5X7g9d…`) y nº 9 (`16D3eHPM…`) contienen cobros y producción que la oficial no tiene: pendiente de migrar, no borrar. La nº 12 (`1dX6Iz38…`) es un CRM de portafolio con clientes fuera de la hoja oficial.
- No se guardan en este repo contratos, cifras de facturación ni datos personales de clientes: quedan en Drive.
- Escribir en la hoja CONTROL es nivel 2 (preparar el cambio y esperar un "sí").
