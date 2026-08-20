# Licor Store 24 — tienda 24/7 con delivery

Storefront completo (catálogo, buscador, carrito, checkout y pedido) montado
sobre el mismo proyecto Next.js 16 + TypeScript + Tailwind 4 que ya usa AdVibe.
No sustituye nada existente: vive bajo su propio segmento de ruta.

**URL base:** `/licor-store-24` — definida en `lib/licor/config.ts` (`BASE_PATH`).

---

## El embudo

```
META ADS → /licor-store-24 → /shop → /product/[slug] → /cart → /checkout → /order
                                  ↘ ORDER BY PHONE (tel:) ↙
```

Cada paso emite el evento estándar de Meta correspondiente (ver *Analítica*).
La ruta telefónica está presente en **todas** las pantallas porque en licorería
sigue siendo el camino de mayor intención.

---

## Rutas

| Ruta | Qué es |
| --- | --- |
| `/licor-store-24` | Home: hero, destacados, categorías, deals, beer cases, pedido por teléfono, cómo funciona |
| `/licor-store-24/shop` | Catálogo con buscador instantáneo y filtros (categoría, marca, precio, ofertas, stock, orden) |
| `/licor-store-24/product/[slug]` | Ficha de producto + relacionados (pre-renderizada para cada producto) |
| `/licor-store-24/cart` | Carrito completo |
| `/licor-store-24/checkout` | Datos del cliente + datos de entrega + resumen |
| `/licor-store-24/order?id=…` | Confirmación del pedido (dispara `Purchase`) |
| `/licor-store-24/deals` | TODAY'S DEALS + productos rebajados |
| `/licor-store-24/delivery` | 24/7 FREE DELIVERY + HOW IT WORKS |
| `/licor-store-24/contact` | Teléfonos y datos de la tienda |
| `/licor-store-24/account` | Carrito actual y accesos rápidos (aún no hay cuentas de cliente) |
| `/licor-store-24/privacy` · `/terms` · `/age-verification` | Páginas legales (plantillas) |
| `/licor-store-24/offline` | Fallback del service worker |
| `/api/licor/orders` | Recepción de pedidos (re-tarifica en servidor) |
| `/api/licor/meta-capi` | Relay de la Conversions API de Meta |

---

## Administrar la tienda

Todo el contenido comercial es **dato**, nunca está dentro de un componente.

| Qué quieres cambiar | Archivo |
| --- | --- |
| Productos, precios, tamaños, stock, imágenes, destacados | `lib/licor/catalog.ts` |
| Categorías y su paleta | `lib/licor/catalog.ts` (`CATEGORIES`) |
| Promociones de la página Deals | `lib/licor/deals.ts` |
| Teléfonos, dirección, horario, área de servicio | `lib/licor/config.ts` (`BUSINESS`) |
| Delivery, impuestos, pago, aviso de precios demo | `lib/licor/config.ts` (`COMMERCE`) |
| Navegación, footer, "cómo funciona" | `lib/licor/config.ts` |
| SEO (title, description, dominio) | `lib/licor/config.ts` (`SITE`) |

Esta forma de organizar los datos es la que permitirá añadir después un panel de
administración: basta con sustituir estos módulos por llamadas a una API o a una
base de datos manteniendo los mismos tipos (`lib/licor/types.ts`).

### Añadir un producto

```ts
// lib/licor/catalog.ts
{
  slug: "nuevo-producto",        // identificador en la URL, único
  name: "Nombre del producto",
  brand: "Marca",
  category: "whiskey",           // una de CategoryId
  size: "750ml",
  price: 29.99,
  compareAtPrice: 34.99,         // opcional: activa el badge de descuento
  description: "…",
  stock: 12,                     // null = no se controla stock
  availability: "in-stock",      // in-stock | low-stock | out-of-stock
  image: "/licor/mi-foto.jpg",   // opcional; si falta se dibuja la botella
  featured: true,
  bestSeller: true,
  isCase: false,                 // true = aparece en BEER CASES
  tags: ["weekend", "premium"],
}
```

### Imágenes de producto

Mientras un producto no tenga `image`, la ficha dibuja una botella (o un pack)
generada por código a partir de la categoría y la marca
(`components/licor/BottleArt.tsx`). Es vectorial, pesa cero peticiones de red y
se ve nítida en cualquier pantalla. En cuanto se añade `image` apuntando a un
archivo dentro de `public/`, se usa la fotografía real con `next/image`.

### Precios DEMO

`COMMERCE.demoPricing = true` mantiene visible el aviso de "DEMO CATALOG" en
home, shop, ficha, carrito y checkout, y **omite el bloque `offers` de los datos
estructurados** para no publicar precios de muestra como si fueran reales.
Cuando cargues los precios reales, pon la bandera a `false`.

---

## Analítica y Meta Ads

Configurado por variables de entorno; **no hay ningún ID escrito en el código**.
Si una variable está vacía, esa integración simplemente no se carga.

```bash
NEXT_PUBLIC_META_PIXEL_ID=      # "META_PIXEL_ID" — píxel del navegador
META_CAPI_ACCESS_TOKEN=         # solo servidor, para la Conversions API
META_CAPI_TEST_EVENT_CODE=      # opcional, eventos de prueba
NEXT_PUBLIC_GA4_ID=             # G-XXXXXXXXXX
NEXT_PUBLIC_LICOR_SITE_URL=     # origen público para canonical / OG / schema
```

Eventos emitidos (`lib/licor/analytics.ts`):

| Evento Meta | Cuándo | Equivalente GA4 |
| --- | --- | --- |
| `PageView` | carga y cada navegación de cliente | `page_view` |
| `ViewContent` | ficha de producto | `view_item` |
| `Search` | búsqueda estabilizada (no por tecla) | `search` |
| `AddToCart` | añadir al carrito | `add_to_cart` |
| `InitiateCheckout` | entrar al checkout con carrito | `begin_checkout` |
| `Purchase` | confirmación del pedido | `purchase` |
| `Contact` | pulsar un botón de llamada | — |

Cada evento del navegador lleva un `event_id` y se replica al servidor
(`/api/licor/meta-capi`) con el mismo id, de modo que Meta **deduplica** píxel y
Conversions API. Los identificadores de cliente se envían con hash SHA-256.

---

## Pagos

No hay pasarela conectada y no se ha inventado ninguna. El checkout funciona en
modo *solicitud de pedido*: valida, re-tarifica en el servidor a partir del
catálogo (nunca confía en los precios del cliente), genera una referencia
`LS24-…` y la tienda cierra el pedido con el cliente.

Para activar Stripe u otro proveedor más adelante:

1. `COMMERCE.payment.provider = "stripe"` en `lib/licor/config.ts`
2. implementar `createCheckoutSession` en `lib/licor/payments.ts`
3. conectar `persistOrder` en `app/api/licor/orders/route.ts` al sistema real
   (base de datos, email, SMS, POS o CRM)

---

## Datos que faltan (marcadores editables)

Aparecen en pantalla con un recuadro punteado para que sea imposible
confundirlos con información real:

- `[BUSINESS ADDRESS]`, `[BUSINESS EMAIL]`, `[INSTAGRAM URL]`, `[FACEBOOK URL]`
- `[DELIVERY ZONES]`, `[DELIVERY TIME]`
- `[TAXES & FEES]`, `[PAYMENT METHOD TO BE CONFIRMED WITH THE STORE]`
- `[LICENSE INFORMATION]`, `[GOVERNING LAW]`, `[PRIVACY CONTACT]`, `[LAST UPDATED]`

La dirección **no** se emite en los datos estructurados: publicar un marcador
como si fuera una ubicación real sería peor que no publicar nada.

---

## Verificación de edad

- Puerta 21+ al entrar, con la confirmación guardada en `localStorage`.
- "NO, EXIT" bloquea la sesión y esa pantalla **no ofrece ninguna vía de vuelta**.
- El checkout exige una confirmación explícita de edad para poder enviar.
- No existe ningún mecanismo para saltarse el control.

---

## PWA

- Manifest en `/licor-store-24/manifest.webmanifest` (iconos PNG generados en
  `/licor-store-24/pwa-icon/192` y `/512`).
- Service worker en `/licor-store-24/sw.js`: *network-first* para navegaciones
  con fallback a `/licor-store-24/offline`, *stale-while-revalidate* para
  estáticos, y `/api/*` nunca se cachea. Se registra solo en producción.

---

## Llevarlo a su propio dominio

El storefront es autocontenido bajo `BASE_PATH`. Para servirlo en la raíz de un
dominio propio, apunta el dominio a la aplicación con un rewrite
`/:path*` → `/licor-store-24/:path*`, o cambia `BASE_PATH` en
`lib/licor/config.ts` (todos los enlaces internos se construyen con `route()`).

---

## Comprobaciones

```bash
npm run typecheck     # TypeScript
npm run lint          # ESLint
npm test              # 157 pruebas unitarias (carrito, buscador, validación)
npm run build         # build de producción

# Verificación de extremo a extremo (requiere Playwright y el servidor arrancado)
npm run build && npx next start -p 3210
npm run test:licor
```

`tests/e2e/licor.mjs` recorre el embudo completo en un viewport de móvil con
entrada táctil: puerta de edad, home, búsqueda instantánea, filtros, ficha,
carrito, persistencia tras recargar, checkout con validación y pedido
confirmado. Además comprueba desbordamiento horizontal, tamaño de los objetivos
táctiles, enlaces `tel:`, los eventos de analítica del embudo y el SEO técnico.
