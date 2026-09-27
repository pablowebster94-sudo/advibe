# Registro de clientes y aislamiento

Este archivo solo mapea **identidad → dónde viven sus datos**. Mensualidades, días de pago y contratos NO van aquí: están en la hoja `ADvibe_CONTROL_2026` (ver `fuentes-de-verdad.md`).

Estado a 2026-09-27 (auditoría). Marcado ❓ lo que no está confirmado.

| Slug | Cliente (hoja CONTROL) | Cuenta Meta Ads | Patrón de campañas (nombre contiene) | En Calendar como | Estado |
|---|---|---|---|---|---|
| `kamauto` | KAMAUTO | ❓ (campaña "Kamauto" en un análisis antiguo) | `Kamauto` | — | Activo en hoja |
| `muebles-ideal` | MUEBLES IDEAL | ❓ | ❓ | — | Activo en hoja |
| `paola-miguitama` | PAOLA MIGUITAMA | 960229743528284 (Enfoque Visual ADS) | `Paola Miguitama`, `PM` ❓ | — | Activo en hoja |
| `sb-cuenca` | CLUB SANTA BÁRBARA CUENCA | 960229743528284 | `Santa Bárbara Cuenca`, `Santa Barbara Cuenca` | — | Activo en hoja |
| `sb-gualaceo` | CLUB SANTA BÁRBARA GUALACEO | ❓ | ❓ | — | Activo en hoja |
| `am-motorsport` | AM MOTORSPORT | 960229743528284 | `AM Motorsport`, `AM Carrucel`, `Leads AM`, `Leads Web AM` | Publicación - AM Motorsport | Activo |
| `cetad-san-lucas` | CETAD SAN LUCAS | 960229743528284 | `CETAD` | — | Estado/día de pago sin definir |

## Nombres que aparecen fuera de la hoja CONTROL

CONFLICTO DETECTADO: estos nombres tienen actividad en Calendar o Meta Ads pero no están en la hoja CLIENTES. Hasta que Pablo los clasifique, trátalos como "sin clasificar" y no los mezcles con ningún cliente.

- Calendar (publicaciones recurrentes mar/jue 09:00): **Bocabel** (también hay videos "bocabell" en Drive), **Cardagali**, **Kueva**, **Panera**, **La Trinidad Restaurant**.
- Meta Ads (Enfoque Visual ADS): **Chemu** / Terreno Chemu, **Latin Eagle**, **Venta Peralta**, **Venta Bus**, **Mensajes FB Joyeria**, **constructora**, **venta local**, **Terreno Los Pinos Gualaceo**, **uk**.
- Meta Ads, posibles de AM Motorsport (nombres de vehículos): **Mini Cooper**, **Citroen C4**, **Hyundai Tucson**, **Trailblazer**. Sin confirmar.
- Meta Ads, propias de AdVibe: **AdVibe | Diagnóstico Digital Gratuito** (v1, v2), **ADVIBE MENSAJES**, **mensajes uk (advibe)**. Tratar como cliente interno `advibe`.
- Cuenta **Enfoque Visual ADS**: ¿es un cliente, una marca propia o la cuenta operativa de la agencia?

## Regla de aislamiento

1. Resuelve el slug antes de consultar datos.
2. En Meta Ads, filtra por el patrón de nombre de campaña; si una campaña no encaja en ningún patrón, repórtala aparte como "sin asignar".
3. En la hoja CONTROL, filtra por la columna Cliente / Cliente ID.
4. Material de marca de un cliente: `clientes/<slug>/` en Drive (INFORMACIÓN FALTANTE: aún no existen esas carpetas).
