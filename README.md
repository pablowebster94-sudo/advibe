# AdVibe Web

Sitio de AdVibe (Next.js 16 + Tailwind CSS 4) que incluye el **Estudio de imagen**: un generador de imágenes con Google Gemini — Nano Banana 2 (`gemini-3.1-flash-image`).

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # pega tu clave dentro
npm run dev
```

- Sitio: http://localhost:3000
- **Estudio de imagen: http://localhost:3000/estudio**

Para producción: `npm run build && npm start`.

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `GEMINI_API_KEY` | Sí | Clave de Google AI Studio. Se lee **solo en el servidor**. |
| `GEMINI_IMAGE_MODEL` | No | Identificador del modelo. Por defecto `gemini-3.1-flash-image`. |
| `GEMINI_MOCK_MODE` | No | `1` para probar con imágenes simuladas, sin llamar a Gemini ni gastar créditos. |

> **Sobre el modelo:** `gemini-3.1-flash-image` es la versión GA de Nano Banana 2 (disponible desde el 28-05-2026). El identificador anterior, `gemini-3.1-flash-image-preview`, fue retirado por Google el 25-06-2026 y ya no debe usarse. El mismo identificador funciona en la Gemini Developer API y en Vertex AI.

`.env.local` está en `.gitignore`; la clave nunca llega al navegador, ni al HTML, ni a los logs, ni a las respuestas del API (los mensajes de error se filtran antes de salir).

## Estudio de imagen

Pantalla única, pensada para móvil (`/estudio`):

1. Prompt libre — sin necesidad de saber ingeniería de prompts.
2. Una imagen de referencia opcional (se redimensiona en el navegador antes de subirla).
3. Formato: `1:1`, `4:5`, `9:16`, `16:9`, `3:2`.
4. Resolución: `1K` (por defecto), `2K`, `4K`.
5. **Generar imagen** → una imagen, con botones **Descargar** y **Nueva imagen**.
6. Historial local en el dispositivo (IndexedDB): imagen, prompt, formato y fecha. Sin base de datos.

### Control de costes

El principio es **1 solicitud del usuario = 1 llamada a Nano Banana 2 = 1 imagen**:

- una sola llamada a `generateContent` por pulsación, con `candidateCount: 1`;
- reintentos automáticos del SDK desactivados (`retryOptions: { attempts: 1 }`);
- sin variantes, sin upscale, sin regeneración automática y sin un segundo modelo que reescriba el prompt (el prompt se estructura con texto fijo en `lib/gemini-image.ts`);
- si la generación falla, se muestra el error y se detiene;
- límite de 10 solicitudes por minuto y por IP en el backend.

### Desarrollo sin gastar créditos

```bash
GEMINI_MOCK_MODE=1 npm run dev
```

Con esa variable el backend devuelve un marcador de posición local (`lib/mock-image.ts`) y **nunca** contacta con Gemini. La interfaz avisa con un banner cuando el modo simulado está activo.

## Estructura relevante

| Ruta | Contenido |
| --- | --- |
| `app/estudio/page.tsx` | Interfaz del estudio (client component). |
| `app/api/generate-image/route.ts` | Backend: validación, rate limit y una única generación. |
| `lib/gemini-image.ts` | Llamada a Gemini y construcción del prompt (solo servidor). |
| `lib/image-studio.ts` | Formatos, resoluciones y tipos compartidos. |
| `lib/image-history.ts` | Historial en IndexedDB (navegador). |
| `lib/client-image.ts` | Redimensionado de la referencia y descargas. |
| `lib/mock-image.ts` | Generador simulado para desarrollo. |
