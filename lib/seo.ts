import type { Metadata } from "next";

export const siteUrl = "https://www.advibeagencia.com";

type PageMetaInput = {
  title: string;
  description: string;
  /** Ruta relativa de la página, p. ej. "/casos/am-motorsport". */
  path: string;
  /** Usa el título tal cual, sin plantilla. */
  absoluteTitle?: boolean;
};

/**
 * Metadatos por página de advibeagencia.com: canonical, Open Graph y Twitter
 * propios. En Next, un `openGraph` definido en una página reemplaza por
 * completo al del layout, así que se repiten aquí los campos comunes.
 */
export function pageMetadata({ title, description, path, absoluteTitle }: PageMetaInput): Metadata {
  const url = `${siteUrl}${path === "/" ? "" : path}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "AdVibe Agencia", locale: "es_EC", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}
