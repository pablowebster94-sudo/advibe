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
