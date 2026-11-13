# ALVITEC — Técnica en Aluminio y Vidrio

Sitio de una página para ALVITEC (Guayaquil, Ecuador). Objetivo: generar solicitudes de cotización por WhatsApp.

Proyecto independiente dentro del repo de AdVibe: Next.js 14 (App Router) · TypeScript · Tailwind CSS 3 · Framer Motion.

## Ejecutar

```bash
cd alvitec
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Deploy (Vercel)

1. Nuevo proyecto en Vercel apuntando a este repo con **Root Directory = `alvitec`**.
2. Variable de entorno `NEXT_PUBLIC_SITE_URL` con el dominio final (sin barra al final). Se usa en canonical, Open Graph, `sitemap.xml`, `robots.txt` y JSON-LD. Sin ella se usa el dominio de producción de Vercel.

## Dónde está cada cosa

| Qué | Archivo |
|---|---|
| Datos del negocio (dirección, horario, cobertura, redes, FAQ, proceso) | `lib/site.ts` |
| Enlaces y mensajes de WhatsApp | `lib/whatsapp.ts` |
| Fotografías y rótulos de la galería | `lib/images.ts`, `public/images/` |
| Secciones | `components/` |
| SEO: metadata, JSON-LD, sitemap, robots | `app/layout.tsx`, `components/JsonLd.tsx`, `app/sitemap.ts`, `app/robots.ts` |

## Pendiente de confirmar con el cliente

- **Fotografías:** todas son de banco de imágenes (Unsplash) y están rotuladas como referenciales. Reemplazar por fotos autorizadas de proyectos de ALVITEC.
- **Facebook:** solo se entregó el nombre de la página; el enlace abre la búsqueda por ese nombre. Poner la URL real en `lib/site.ts`.
- **Dominio:** definir `NEXT_PUBLIC_SITE_URL`.
- **Logo:** se usa un logotipo tipográfico; sustituir si existe uno oficial.

No se publican años de experiencia, proyectos ejecutados, precios, garantías, certificaciones ni especificaciones técnicas: el cliente no los ha entregado.
