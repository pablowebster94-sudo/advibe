import { alt, contentType, size } from "./opengraph-image";

/**
 * Campos de Open Graph / Twitter comunes a todo el sitio.
 *
 * Next no hace merge profundo de `openGraph`: si una página declara el
 * objeto, reemplaza por completo el del layout y pierde la imagen que
 * aporta la convención de archivo opengraph-image.tsx. Por eso las
 * páginas que necesitan su propio og:title lo hacen con un spread de
 * estas constantes.
 */
export const sharedOpenGraph = {
  siteName: "AdVibe Agencia",
  locale: "es_EC",
  images: [{ url: "/opengraph-image", width: size.width, height: size.height, alt, type: contentType }],
};

export const sharedTwitter = {
  card: "summary_large_image" as const,
  images: [{ url: "/twitter-image", width: size.width, height: size.height, alt, type: contentType }],
};
