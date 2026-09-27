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

## Conflictos pendientes de conciliación

No se borra ni se sobrescribe ninguna de las fuentes en conflicto: se conservan las originales y el conflicto se muestra siempre que afecte a una respuesta.

| Conflicto | Fuente A | Fuente B | Estado |
|---|---|---|---|
| Cobros de septiembre 2026 | Hoja nº 5 "Hoja de cálculo sin título" (`1x5X7g9d23KkX5bZ2e8E8Lrz8HDGEDL1W3cWi3e8wgcY`): Kamauto PAGADO $200, Muebles Ideal abono $100 (saldo $100), Paola pendiente $150 | Hoja nº 9 "AdVibe_Control_Clientes_Cobros_2026" (`16D3eHPMakpQ_39CeyxeHwdgML-yoLW5JZwoyEg59De8`): los 6 cobros de septiembre VENCIDOS | **Pendiente de conciliación.** Pablo no ha confirmado qué se cobró. No reportes septiembre como pagado ni como vencido: cita ambas fuentes |
| Estado de UKEA, LatinEagle, Roxy's y Constructora Peralta | Tienen campañas en Meta y el CRM (nº 12) marca a UKEA como activo | No están en CLIENTES | **Estado de cliente pendiente de confirmar** |
| Muebles Ideal / Paola Miguitama: dos filas en CLIENTES ($200 día 2 y $150 día 5) | Hoja oficial | Pablo confirma que son el mismo negocio | Pendiente saber si son dos líneas o un duplicado. No fusionar |

## Cómo entra el dato

Pablo registra producción, grabaciones, publicaciones y tareas con la web app **ADvibe CONTROL** (`apps-script/advibe-control/`), vinculada a la hoja oficial. Los agentes de Claude solo leen: no deben escribir en la hoja sin pasar por el nivel 2.

## Reglas

- Métricas de Meta: la API manda sobre cualquier hoja o CSV exportado.
- Si hay varias copias de una hoja, manda la indicada arriba. En Drive hay 12 hojas relacionadas; están inventariadas en `AdVibe OS/Reportes/Revisión: marcas, campañas y copias de hojas`. Las nº 5 (`1x5X7g9d…`) y nº 9 (`16D3eHPM…`) contienen cobros y producción que la oficial no tiene: pendiente de migrar, no borrar. La nº 12 (`1dX6Iz38…`) es un CRM de portafolio con clientes fuera de la hoja oficial.
- No se guardan en este repo contratos, cifras de facturación ni datos personales de clientes: quedan en Drive.
- Escribir en la hoja CONTROL es nivel 2 (preparar el cambio y esperar un "sí").
