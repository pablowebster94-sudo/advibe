# Catálogos de remates y liquidaciones

Página pública de muebles en remate que lee sus productos **en vivo desde una hoja de Google
publicada como CSV**. El cliente actualiza la hoja y la página se actualiza sola: no hay base de
datos, ni panel, ni despliegue por cada cambio de precio.

Primera implementación: **Muebles Ideal / Paola Miguitama** en `/muebles-ideal/remates`.

## Piezas

| Archivo | Qué hace |
|---|---|
| `lib/remates.ts` | Parser CSV, normalización de columnas, precios, fotos y utilidades de vista. Sin dependencias de Next: es lo que cubren las pruebas. |
| `lib/remates-data.ts` | Configuración por cliente, lectura de la hoja con `revalidate: 60` y datos demo. |
| `components/remates/Catalogo.tsx` | Tarjetas, filtros por categoría y botón flotante de WhatsApp. |
| `app/muebles-ideal/remates/page.tsx` | La página del cliente. |
| `tests/remates.test.ts` | Pruebas del parser y las utilidades (`npm test`). |

## Variables de entorno

| Variable | Para qué |
|---|---|
| `REMATES_MUEBLES_IDEAL_CSV` | Enlace de la hoja publicada. Se acepta tal cual lo da Google: el código lo normaliza a `output=csv`. |
| `NEXT_PUBLIC_REMATES_MUEBLES_IDEAL_WA` | WhatsApp del cliente con código de país. Sin esto, las tarjetas no muestran botón de WhatsApp. |
| `REMATES_ALLOW_DEMO` | `true` fuerza los muebles de ejemplo (útil en una preview). En producción, sin CSV configurado, el catálogo sale **vacío**, nunca con demo. |

## Columnas de la hoja

Obligatoria: **nombre**. Todo lo demás es opcional. Los encabezados no distinguen mayúsculas,
acentos ni guiones bajos, y aceptan sinónimos (`lib/remates.ts` → `ALIAS`).

| Columna | Sinónimos | Notas |
|---|---|---|
| `nombre` | producto, mueble, titulo | Si está vacía, la fila se ignora. |
| `precio_antes` | antes, precio_regular, precio_lista | Acepta `$1.200`, `1,200.50`, `890,50`. |
| `precio_remate` | precio_ahora, ahora, remate, precio | Con los dos precios se calcula el `-%` de la etiqueta roja. |
| `foto` | fotos, imagen, url_foto | URL, enlace de Drive o el puro ID. Varias separadas por `\|`. |
| `categoria` | cat, tipo, linea | Genera los filtros de arriba. |
| `medidas` | dimensiones | |
| `descripcion` | desc, detalle | |
| `etiqueta` | tag, badge | Texto libre: "Último disponible", "Remate". |
| `ubicacion` | local, sucursal, ciudad | Para Gualaceo / Montecristi. |
| `vendido` | agotado, reservado | `si`/`x`/`1` lo marca vendido: sale en gris, al final y sin botón. |
| `mostrar` | publicar, activo | `no` oculta la fila sin borrarla. |

Las fotos de Drive se sirven por `lh3.googleusercontent.com/d/<id>`, declarado en `next.config.ts`.
Cualquier otro host se sirve sin optimizar, para que una URL ajena nunca rompa la página.

## Publicar la hoja (lo hace el cliente o AdVibe con su permiso)

1. En la hoja: **Archivo → Compartir → Publicar en la web**.
2. Elegir la pestaña de productos y el formato **Valores separados por comas (.csv)**.
3. Copiar el enlace y ponerlo en `REMATES_MUEBLES_IDEAL_CSV`.

> Publicar la hoja la deja **legible por cualquiera que tenga el enlace**. No pongas costos,
> proveedores ni margen en esa pestaña: solo lo que puede ver un cliente.

## Añadir otra mueblería

1. Nueva entrada tipo `MUEBLES_IDEAL` en `lib/remates-data.ts` con su slug, negocio y variables.
2. Nueva ruta `app/<slug>/remates/page.tsx` copiando la de Muebles Ideal y cambiando la constante.
3. Sus dos variables de entorno en Vercel.
