# Enfoque Visual — puesta en producción

## 1. Qué hay que configurar (una sola vez)

### Supabase
1. Aplicar `supabase/schema.sql` y luego `supabase/migrations/*.sql` en orden (SQL Editor o `psql`).
   Si la base ya existía, basta con las migraciones que falten. **003** (`003_busco_propiedad.sql`)
   añade `busco_propiedad` al enum `interest_type` y las columnas `leads.search_criteria` (jsonb) y
   `leads.consent_at`; es idempotente. Sin ella, el formulario *Busco propiedad* responde error 500 y
   el panel de leads no puede leer los criterios.
   Crea tablas, RLS, triggers (portada, historial de leads) y el bucket público `listing-media`.
2. Crear el usuario del panel en **Authentication → Users** (email + contraseña, confirmado).
3. Darle acceso al panel (sin fila en `profiles` no entra):
   ```sql
   insert into public.profiles (id, full_name, role)
   values ('<uuid del usuario en auth.users>', 'Nombre', 'admin');
   ```

### Variables de entorno (Vercel → Project → Settings → Environment Variables)
| Variable | Uso | Obligatoria |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://enfoque.advibeagencia.com` (canonical, sitemap, OG) | Sí |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Solo dígitos con código de país, ej. `593984966335` | Sí |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon / publishable | Sí |
| `SUPABASE_URL` | Igual que la anterior (servidor) | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role / secret (leads, fotos). Nunca en el cliente | Sí |
| `NEXT_PUBLIC_ENFOQUE_META_PIXEL_ID` | Pixel/dataset de Enfoque (navegador) | Sí |
| `META_ENFOQUE_PIXEL_ID` | **El mismo** ID (CAPI, servidor) | Sí |
| `META_ENFOQUE_ACCESS_TOKEN` | Token de CAPI del dataset | Sí |
| `META_ENFOQUE_GRAPH_API_VERSION` | Por defecto `v26.0` | No |
| `NEXT_PUBLIC_ENFOQUE_GA_ID` | GA4 de Enfoque | No |
| `ENFOQUE_LEAD_WEBHOOK_URL` | URL **https** que recibe un POST JSON por cada lead nuevo (Make, Zapier, n8n, bot). Puede llevar un token: trátala como secreto. Sin ella no hay aviso inmediato | Recomendada |
| `META_ENFOQUE_TEST_EVENT_CODE` | Solo mientras se valida en “Probar eventos” | No |
| `ENFOQUE_ALLOW_DEMO` | Nunca en producción | No |

Las `NEXT_PUBLIC_*` se incrustan al compilar: tras cambiarlas hay que **volver a desplegar**.

Dominio: `enfoque.advibeagencia.com` apunta al mismo proyecto de Vercel; `middleware.ts` reescribe
`/` → `/enfoque-visual` para ese host.

## 2. Verificación en producción (15 min)

1. **/admin/estado** (en el dominio de Enfoque): todo en ✓. Comprueba de verdad Supabase (lectura,
   service role y bucket público), el token de CAPI contra la Graph API y que el pixel del navegador
   y el de CAPI coincidan.
2. **Probar Meta CAPI**: Administrador de eventos → dataset → *Probar eventos* → copiar el código
   `TEST…` → pegarlo en /admin/estado → el Lead de prueba aparece en Meta.
3. Crear una propiedad real desde el panel con fotos y video → *Crear y publicar* → verla en el
   catálogo y en la ficha.
4. Desde un móvil, abrir la ficha con `?utm_source=test&utm_campaign=verificacion`:
   - WhatsApp: abre el chat con `(Ref: EV-XXXXXX)`; en /admin/leads → *Clics a WhatsApp* aparece la
     referencia con la publicación y la campaña.
   - Formulario: aparece en /admin/leads vinculado a la publicación y con la campaña.
   - /admin/estado → *Últimos eventos*: `Contact` y `Lead` con CAPI `enviado`.
   - Pixel Helper: `ViewContent`, `Contact` y `Lead` con `eventID`; en Meta salen deduplicados.
5. **Busco propiedad y aviso de lead** (requiere la migración 003 y `ENFOQUE_LEAD_WEBHOOK_URL`):
   - /admin/estado → *Aviso de lead nuevo (webhook)* en ✓ (muestra solo el host).
   - Abrir `/busco-propiedad?utm_source=test&utm_campaign=verificacion`, enviar sin marcar el
     consentimiento (debe pedirlo) y luego completo.
   - El webhook recibe `lead.created` con `search_criteria` en segundos (ver el historial de Make/Zapier/n8n).
   - /admin/leads → *Buscadores*: aparece con los criterios, la campaña y la fecha de consentimiento.
   - *Exportar CSV* descarga el archivo con las columnas de búsqueda.
   - Pixel Helper: `Lead` con `eventID`; en /admin/estado el Lead sale con CAPI `enviado`.
   - En una ficha: sección *Otras propiedades* y el CTA lleva al formulario prellenado.
   - Pixel Helper al navegar entre páginas: un `PageView` por cambio de ruta, solo al pixel de Enfoque.
6. Search Console: enviar `https://enfoque.advibeagencia.com/sitemap.xml` (incluye `/busco-propiedad`).
7. Quitar `META_ENFOQUE_TEST_EVENT_CODE` si se usó y volver a desplegar.

## 3. Cómo funciona el tracking

| Evento | Navegador (Pixel) | Servidor (CAPI) | Se guarda en |
|---|---|---|---|
| PageView | carga inicial y cada cambio de ruta (`components/MetaPixel.tsx`, solo pixel de Enfoque) | — | — |
| ViewContent | al abrir una ficha | `/api/enfoque/track` (mismo `event_id`) | — |
| Contact | clic en WhatsApp | `/api/enfoque/track` (mismo `event_id`) | `conversion_events` con `ref_code` |
| Lead | tras guardar el formulario (contacto, ficha o *Busco propiedad*) | `/api/enfoque/leads` (mismo `event_id`) | `leads` + `conversion_events` |

- UTM, `fbclid` y `gclid` los captura `middleware.ts` en la cookie `ev_attr` (first y last touch).
- `_fbp`/`_fbc` se leen de las cookies del Pixel; si no hay `_fbc` (Pixel bloqueado) se construye desde
  el `fbclid` y el momento del clic.
- CAPI envía email y teléfono con SHA-256 (teléfono en E.164 sin `+`), IP, user agent y
  `external_id` (visitante). Se ejecuta después de responder: si Meta falla o no está configurado, el
  lead ya está guardado y el evento queda como `fallido`/`omitido` con el error.
- Precio y publicación se validan contra la base de datos, no se confía en el navegador.
- Los eventos de Enfoque usan `fbq('trackSingle', <pixel de Enfoque>, …)`: nunca llegan al pixel de AdVibe.
- **Límite de peticiones** (`lib/enfoque-rate-limit.ts`): `/api/enfoque/leads` 5 envíos cada 10 min por
  IP y `/api/enfoque/track` 60 eventos por minuto por IP (429 + `Retry-After`). En Vercel es **por
  instancia y en memoria**: se reinicia en cada arranque en frío y no se comparte entre instancias, así
  que solo frena ráfagas de un mismo cliente. Para un límite global, añadir una regla de rate limiting
  en Vercel Firewall o un almacén compartido (Upstash Redis).

## 4. Pruebas

```bash
npm test          # unitarias (filtros, video, payloads, CAPI con fetch simulado, teléfonos, etc.)
npm run typecheck
npx eslint app/enfoque-visual components/enfoque lib/enfoque-*.ts app/api/enfoque middleware.ts
npm run build
```

E2E real (Playwright) contra un Supabase **local o de pruebas** (crea y borra datos):

```bash
npx supabase start                      # Supabase local (Docker)
psql "$DB_URL" -f supabase/schema.sql   # + migraciones; crear usuario admin y su fila en profiles
# build + start con las variables apuntando al Supabase local, luego:
EV_BASE=http://localhost:3300 SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
EV_ADMIN_EMAIL=… EV_ADMIN_PASSWORD=… node tests/e2e/enfoque.mjs
# Con Supabase detenido: catálogo vacío y errores reales en formularios
EV_BASE=http://localhost:3300 node tests/e2e/enfoque-outage.mjs
```
