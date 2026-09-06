# AdVibe Visual Flow — Blueprint Completo

Todo lo que necesitas copiar y pegar para terminar de armar el flujo en Make.com y Bannerbear.

> Antes de usar esto con un cliente, lee `LEEME.md` de esta carpeta: las
> métricas de `demo.html` son de relleno y no se citan como resultados.

## 1. Esquema de datos (JSON) — Salida de la Etapa 1

```json
{
  "cliente": "string",
  "objetivo": "string (ej: awareness, conversión, lanzamiento de producto)",
  "tono": "string (ej: elegante, juvenil, corporativo, divertido)",
  "publico": "string (ej: mujeres 25-40, profesionales urbanos)",
  "industria": "string",
  "mensaje_clave": "string (headline corto, máx 8 palabras)",
  "cta": "string (ej: Compra ahora, Descubre más)",
  "paleta_color": "string (ej: tonos tierra, pastel, alto contraste)",
  "formato": "string (ej: feed 1:1, story 9:16, banner 16:9)"
}
```

## 2. Prompt — Etapa 1: Intérprete de Brief (módulo OpenAI #1)

**System:**
```
Eres un estratega creativo senior de una agencia de publicidad. Tu tarea es leer
el brief de un cliente, muchas veces desordenado o informal, y convertirlo en un
JSON estructurado y accionable para un equipo de diseño. Responde ÚNICAMENTE con
el JSON, sin texto adicional, siguiendo exactamente este esquema: {cliente,
objetivo, tono, publico, industria, mensaje_clave, cta, paleta_color, formato}.
Si el cliente no especifica un campo, infiérelo de forma razonable a partir del
contexto del brief.
```

**User** (mapea el campo del webhook):
```
Brief del cliente: {{1.brief}}
```

**Configuración del módulo:** Model `gpt-4o` · Response format `JSON Object` · Temperature `0.4` (consistencia estructural, no creatividad aquí).

## 3. Prompt — Etapa 2: Director de Arte (módulo OpenAI #2)

**System:**
```
Eres un director de arte experto en generación de imágenes con IA. A partir de un
brief estructurado, escribe UN SOLO prompt en inglés, muy detallado y visual,
listo para pegar en un generador de imágenes tipo DALL-E o Midjourney. Describe:
composición, encuadre, iluminación, estilo fotográfico o ilustrativo, paleta de
color y estado de ánimo. NO incluyas texto, logos ni tipografía en la descripción
de la imagen — eso se añade después en un paso de ensamblaje. Responde solo con
el prompt, sin explicaciones.
```

**User** (mapea variables ya parseadas de la Etapa 1):
```
Objetivo: {{objetivo}}
Tono: {{tono}}
Público: {{publico}}
Industria: {{industria}}
Paleta de color: {{paleta_color}}
Formato: {{formato}}
```

**Configuración del módulo:** Model `gpt-4o` · Temperature `0.8` (aquí sí quieres creatividad).

## 4. Generación de imagen (módulo OpenAI — Create an Image)

- Prompt: salida de texto de la Etapa 2
- Tamaño según `formato`:
  - feed 1:1 → `1024x1024`
  - story 9:16 → `1024x1792`
  - banner 16:9 → `1792x1024`

## 5. Plantilla en Bannerbear — Especificación de capas

Crea una plantilla por cada formato que uses (idealmente 3):

| Formato | Dimensiones |
|---|---|
| Feed | 1080 × 1080 px |
| Story | 1080 × 1920 px |
| Banner | 1920 × 1080 px |

Capas, de atrás hacia adelante:

1. **`background`** — tipo Imagen — recibe la URL de DALL-E — ajuste "cover", recorte centrado.
2. **`overlay_gradient`** (opcional) — Imagen o rectángulo semitransparente — asegura legibilidad del texto sobre la foto.
3. **`headline`** — tipo Texto — recibe `{{mensaje_clave}}` — fuente de marca del cliente, tamaño grande.
4. **`cta_button`** — tipo Texto o Grupo (rectángulo + texto) — recibe `{{cta}}`.
5. **`logo`** — tipo Imagen — fijo o mapeado según cliente — esquina superior o inferior según guía de marca.

Recomendaciones: activa "Auto-resize text" en Bannerbear para que el headline no se desborde si `mensaje_clave` varía en longitud, y guarda el **Template UID** de cada formato — lo necesitarás en el módulo de Make.

## 6. Mapeo de variables — Cheat sheet para Make.com

| Módulo origen | Variable | Módulo destino | Campo destino |
|---|---|---|---|
| Webhook | `brief` | OpenAI Etapa 1 | user prompt |
| Parse JSON | `objetivo, tono, publico, industria, paleta_color, formato` | OpenAI Etapa 2 | user prompt |
| OpenAI Etapa 2 | texto de salida | OpenAI Create Image | prompt |
| OpenAI Create Image | `data[].url` | Bannerbear | `modifications.background` |
| Parse JSON | `mensaje_clave` | Bannerbear | `modifications.headline` |
| Parse JSON | `cta` | Bannerbear | `modifications.cta_button` |
| Bannerbear | `image_url` (tras polling) | Webhook response | `body.imagen_final` |

## 7. Payload de prueba para el Webhook

```json
{
  "cliente": "Café Andino",
  "brief": "Necesitamos un post para redes sociales anunciando nuestro nuevo blend de temporada, dirigido a jóvenes profesionales que valoran lo artesanal. Queremos que se vea premium pero cercano."
}
```

Salida esperada de la Etapa 1:

```json
{
  "cliente": "Café Andino",
  "objetivo": "awareness",
  "tono": "premium y cercano",
  "publico": "jóvenes profesionales urbanos",
  "industria": "café / gastronomía",
  "mensaje_clave": "Tu blend de temporada ya llegó",
  "cta": "Descúbrelo ahora",
  "paleta_color": "tonos tierra cálidos",
  "formato": "feed 1:1"
}
```
