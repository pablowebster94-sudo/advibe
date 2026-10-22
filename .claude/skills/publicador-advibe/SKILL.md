---
name: publicador-advibe
description: Publica o programa contenido orgánico (Reels, carruseles, fotos, historias) en Instagram y Facebook mediante el conector de Zernio. Úsalo cuando Pablo diga "publica", "programa", "sube este reel", "¿qué toca publicar hoy?" o pida el calendario de publicaciones de una cuenta. No sirve para anuncios pagados de Meta Ads.
---

# Publicador AdVibe (Zernio)

Antes de nada, lee `docs/advibe-os/publicador.md`: cuentas conectadas, permisos de cada cliente, calendario y registro de publicaciones.

## 0. Comprobar la conexión
- Busca las herramientas de Zernio con ToolSearch (`zernio`). Si no aparecen, responde:
  "Zernio no está conectado en esta sesión. Agrégalo en https://claude.ai/customize/connectors (URL `https://mcp.zernio.com/mcp`) y abre una sesión nueva." y detente.
- Lista las cuentas conectadas en Zernio y compáralas con la tabla de `publicador.md`. Si no cuadran: `CONFLICTO DETECTADO`.

## 1. Fijar el contexto (una línea)
**Cuenta · Red · Tipo de publicación · Fecha y hora (America/Guayaquil)**
- La cuenta se resuelve con `docs/advibe-os/clientes.md`. Si no está claro, pregunta.
- Solo se publica en cuentas con permiso **CONFIRMADO** en `publicador.md`. Si el permiso está pendiente, no publiques.

## 2. Preparar la publicación (nivel 2: preparar y esperar)
Arma la vista previa y muéstrala completa:
```
Cuenta:      @...
Red:         Instagram / Facebook
Tipo:        Reel / carrusel / foto / historia
Archivo(s):  ruta o enlace exacto
Texto:       <caption final>
Hashtags:    ...
Cuándo:      ahora | AAAA-MM-DD HH:MM (America/Guayaquil)
```
- El texto lo puede redactar el subagente `contenido` si Pablo no lo da.
- Nunca inventes precios, promociones, fechas ni teléfonos. Si faltan: `INFORMACIÓN FALTANTE`.
- Revisa la ortografía y que el archivo sea del cliente correcto.

## 3. Publicar (nivel 3: confirmación explícita por acción)
- Publica o programa **solo** después de un "sí" explícito de Pablo a **esa** publicación concreta.
- Un "sí" no vale para la siguiente. Nunca publiques en bloque ni por inferencia.
- Las respuestas de comentarios y los mensajes directos desde Zernio también son nivel 2 o 3: preparar y esperar.

## 4. Registrar
Después de cada publicación, agrega una fila en el registro de `publicador.md`: fecha, cuenta, tipo, cuándo sale, estado e ID o enlace que devuelva Zernio.

## "¿Qué toca publicar hoy?"
Lee el calendario de `publicador.md`, cruza con el registro y responde con lo que toca hoy por cuenta, lo que falta (archivo o texto) y lo que ya está programado.
