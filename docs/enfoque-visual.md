# Enfoque Visual

Plataforma de propiedades y vehículos para captación desde Meta Ads, servida en
`enfoque.advibeagencia.com` desde este mismo proyecto (rutas `app/enfoque-visual`).

- Puesta en producción, variables, verificación y pruebas: [enfoque-visual-produccion.md](enfoque-visual-produccion.md)
- Arquitectura de datos: [enfoque-visual-architecture.md](enfoque-visual-architecture.md) y `supabase/schema.sql`

## Modelo de negocio (confirmado por Pablo, 10-10-2026)
- Enfoque Visual es una marca de AdVibe Agencia.
- Servicio actual: AdVibe crea y gestiona la campaña de Meta en la página Enfoque Visual; el dueño de la propiedad o vehículo paga la inversión publicitaria; se conecta el WhatsApp del dueño para que las conversaciones le lleguen directamente.
- La página casi no publica en el feed: el contenido son anuncios cargados (dark posts).
- Señal de demanda: compradores escriben preguntando si hay otras casas disponibles. Objetivo: crecer hacia una plataforma de inventario (web propia + captación de compradores), no solo campañas sueltas.

## Captación de demanda

Problema: quien llega por un anuncio de una propiedad pregunta por otras, y esa demanda se perdía
en el chat. La web la convierte en una **base de compradores** consultable desde el panel.

| Pieza | Dónde | Qué hace |
|---|---|---|
| **Busco propiedad** | `/busco-propiedad` (`app/enfoque-visual/busco-propiedad`, `components/enfoque/BuscoForm.tsx`) | Formulario: qué busca (casa, terreno, local, departamento, vehículo, otro), comprar/alquilar, cantón (Gualaceo, Paute, Chordeleg, Sígsig, Cuenca, Azogues, otro), presupuesto máximo opcional, compra desde el exterior + país, plazo, nombre, WhatsApp, correo opcional, consentimiento LOPDP **obligatorio** y campo trampa. Se puede prellenar: `?tipo=casa&canton=gualaceo&operacion=venta`. |
| Validación | `lib/enfoque-demand.ts` | El servidor valida todo (opciones cerradas, WhatsApp E.164 —también extranjeros—, presupuesto ≥ 0, país si compra desde fuera, consentimiento `true`). Guarda un lead `interest_type = busco_propiedad` con los criterios en `leads.search_criteria` (jsonb) y `consent_at`. |
| Medición | igual que el formulario de contacto | Evento **Lead** por Pixel y CAPI con el mismo `event_id` (`content_type = busco_propiedad`), UTMs/fbclid/first touch de la cookie `ev_attr`. |
| **Otras propiedades** | fichas de propiedad y vehículo (`components/enfoque/SimilarListings.tsx`, `similarProperties/similarVehicles` en `lib/enfoque-filters.ts`) | Hasta 3 publicaciones similares (mismo tipo o cantón; vehículos: marca, ciudad o precio ±30 %), disponibles primero, sin la actual. Debajo, CTA “¿No es lo que buscas? Cuéntanos qué buscas” prellenado con el tipo, cantón y operación de la ficha. |
| CTA | inicio, listados, resultados vacíos, menú y pie (`components/enfoque/BuscoCta.tsx`, `Footer.tsx`) | Lleva a `/busco-propiedad`. |
| **Aviso inmediato** | `lib/enfoque-notify.ts` | Cada lead nuevo (contacto, publicar, busco_propiedad y los de WhatsApp registrados en el panel) se envía por POST JSON a `ENFOQUE_LEAD_WEBHOOK_URL` después de responder al usuario. Sin la variable no pasa nada (aviso en `/admin/estado`). |
| **Panel** | `/admin/leads` | Filtro **Buscadores** (combinable con el estado) con los criterios y la fecha de consentimiento; botón **Exportar CSV** que respeta los filtros. |

Uso comercial: antes de lanzar la campaña de una publicación nueva, filtra *Buscadores* y escribe
primero a quienes encajan (tipo, cantón, presupuesto). Exporta el CSV para cruzarlo en una hoja.

### Payload del webhook (`event = lead.created`)
```json
{
  "event": "lead.created", "source": "enfoque-visual", "created_at": "2026-10-10T12:00:00.000Z",
  "lead": {
    "id": "uuid", "name": "…", "phone": "+593…", "email": null,
    "interest_type": "busco_propiedad", "interest_label": "Busca propiedad", "channel": "formulario",
    "message": "…", "ref_code": null, "listing": null,
    "search_criteria": {"what": "Casa", "operation": "comprar", "canton": "Gualaceo", "budget_max": 90000,
                        "from_abroad": true, "country": "…", "timeframe": "En los próximos 3 meses", "notes": null},
    "whatsapp_url": "https://wa.me/593…"
  },
  "attribution": {"utm_source": "…", "utm_campaign": "…"},
  "admin_url": "https://enfoque.advibeagencia.com/admin/leads",
  "text": "Nuevo lead en Enfoque Visual: …\nBusca propiedad\n…"
}
```
`text` es un resumen listo para reenviar tal cual a Telegram/WhatsApp/Slack desde Make, Zapier o n8n
(ahí se arma también el email: el repo no tiene proveedor de correo). El payload no lleva tokens ni
claves, pero sí datos personales del lead: el destino debe ser de confianza.

### Privacidad (LOPDP)
El consentimiento se guarda con fecha (`consent_at`) y el texto mostrado está en
`CONSENT_TEXT` (`lib/enfoque-demand.ts`). Si alguien pide borrar sus datos, se elimina su fila de
`leads` desde Supabase.
