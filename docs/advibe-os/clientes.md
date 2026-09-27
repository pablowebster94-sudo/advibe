# Registro de clientes y aislamiento

Este archivo solo mapea **identidad → dónde viven sus datos**. Mensualidades, días de pago y contratos NO van aquí: están en la hoja `ADvibe_CONTROL_2026 (1)` (ver `fuentes-de-verdad.md`).

Revisión del 2026-09-27. El detalle y las pruebas están en Drive: `AdVibe OS/Reportes/Revisión: marcas, campañas y copias de hojas (2026-09-27)`.

## Regla de aislamiento en Meta Ads

El cliente se identifica por la **página de Facebook que publica el anuncio**, no por el nombre de la campaña. Los nombres engañan: "Santa Bárbara Cuenca" se publica desde la página de Gualaceo, y "Mini Cooper" es de AM Motorsport.

Cómo hacerlo:
1. `ads_get_ad_entities` a nivel `ad`, con los campos `campaign_name` y `creative_id`.
2. `ads_get_creatives` con `effective_object_story_id`. El número antes del `_` es el `page_id`.
3. Cruza ese `page_id` con la tabla de abajo.

Si no se puede consultar la página, usa como respaldo el patrón de nombre y márcalo como "asignación por nombre, sin verificar".

## Clientes de la hoja oficial (CLIENTES)

| Slug | Cliente | Página de Facebook (page_id) en Enfoque Visual ADS | Notas |
|---|---|---|---|
| `kamauto` | KAMAUTO | ❓ "Komauto Importadora" (106355732206742), sin anuncios | ¿Es la misma marca con otra ortografía? Confirmar |
| `muebles-ideal` | MUEBLES IDEAL | — (no está en esta cuenta; tiene anuncios propios activos) | **Dos ubicaciones: Gualaceo y Montecristi** (confirmado por Pablo). "Pendiente prod. Manta" = Montecristi. En el CRM de portafolio figura como prospecto y con Paola Miguitama como contacto: CONFLICTO |
| `paola-miguitama` | PAOLA MIGUITAMA | Paola Miguitama (1226660540522114) | Campañas: MENSAJES PM, PM ago, Dormitorios |
| `sb-cuenca` | CLUB SANTA BÁRBARA CUENCA | ❓ Sus campañas salen de la página de Gualaceo | CONFLICTO: ¿no tiene página propia? |
| `sb-gualaceo` | CLUB SANTA BÁRBARA GUALACEO | Club Formativo Santa Bárbara "Gualaceo" (502746606252797) | También publica las campañas llamadas "Cuenca" |
| `am-motorsport` | AM MOTORSPORT | AM Motorsport (124405067312010) | Incluye Mini Cooper, Citroen C4, Hyundai Tucson y Trailblazer (verificado por página). El CRM lo marca como cliente anterior: CONFLICTO |
| `cetad-san-lucas` | CETAD SAN LUCAS | Cetad San Lucas (456955030832533) | Estado y día de pago sin definir |
| `advibe` | AdVibe (interno) | Ad Vibe Agencia (592020173996524) | ADVIBE MENSAJES, Diagnóstico Digital Gratuito, Tráfico Instagram |

## Marcas con actividad que no están en la hoja oficial (sin clasificar)

Mientras Pablo no las clasifique, no se mezclan con ningún cliente de la hoja.

| Marca | Evidencia |
|---|---|
| United Kingdom English Academy - Cuenca | Página 111042744144670, campañas "uk", $35. El CRM la marca como cliente activo |
| LatinEagle Multiservices | Página 1305480965973274, campañas "Latin", $67,61. "Latin 3" se creó el 27-09 |
| Multiservices A&N Latino Corp | Página 911320888728139, "venta eeuu" |
| Roxy's Joyería | Página 101351141775273, "Mensajes FB Joyeria" ACTIVA |
| Constructora Peralta | Página 220405694491935, "Venta Peralta" y "constructora" |
| Enfoque Visual | Página 531199800087373. Publica Chemu, terrenos, casa, bus y venta local. Según `docs/enfoque-visual.md` es la plataforma de propiedades y vehículos de AdVibe (hipótesis: la pauta la paga el anunciante de cada propiedad) |
| Bocabel(l), Cardagali/Cardagal, Kueva, Panera, La Trinidad Restaurant | Publicaciones recurrentes mar/jue 09:00 en Calendar. Bocabell, Cardagal y La Trinidad también están en la web de AdVibe |
| G3L, Verónica López (Arquitectura), Carla Molina | El CRM de portafolio los marca como clientes activos |

## Carpetas de Drive

| Carpeta | Drive id |
|---|---|
| AdVibe OS | `1XerWn2zCz2aKgeGrb5BTH-5zWYTwuNOo` |
| AdVibe OS/Reportes | `19PcsmtgCOAR4212BfXq05L4IyipDI3rT` |
| AdVibe OS/Prospectos | `1--7idIvVXkV46LCzq1ldDrPQRfeUBTJC` |
| AdVibe OS/Clientes | `1TRVDjheay6ja3heEoDzOWJ_Rzn01gjon` |
| Clientes/kamauto | `1hHm6xVNFqZxNqOtm8rlilYu2-KqkvWsc` |
| Clientes/muebles-ideal | `1_Ha1rxoDyV9ppfOqsdbdH4h1ilY2FFEK` |
| Clientes/paola-miguitama | `1zw5__4j1IqAqWLxuKXQ6cic2GbhQ3V3_` |
| Clientes/sb-cuenca | `1tWwvuwCwnW2wBudTO9uOhfEwE63QMfw0` |
| Clientes/sb-gualaceo | `1-oddy2_DbLu2BGf6qSHhWCB0k2ZMxrpn` |
| Clientes/am-motorsport | `1vW11AvzL5misUMUXQJtyhG4ScZcbNkM8` |
| Clientes/cetad-san-lucas | `1BfXjpkGZmCixnWaz9dySTBbfuSO6fY9j` |
| Clientes/advibe | `1xrxLMQJGMfXG6oTe_wHUesjPQuqFgaI3` |

## Otras fuentes

1. Hoja CONTROL: filtra por la columna Cliente / Cliente ID.
2. Material de marca: Drive `AdVibe OS/Clientes/<slug>/`.
3. Hay 12 hojas relacionadas en Drive. Solo manda la oficial (ver `fuentes-de-verdad.md`).
