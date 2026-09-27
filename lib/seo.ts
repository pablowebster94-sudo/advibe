import type { Metadata } from "next";

export const SITE_URL = "https://www.advibeagencia.com";
export const SITE_NAME = "AdVibe Agencia";
export const DEFAULT_TITLE = "AdVibe Agencia | Marketing Digital y Producción Audiovisual en Ecuador";
export const DEFAULT_DESCRIPTION =
  "Agencia de marketing digital y producción audiovisual en Gualaceo, Ecuador. Meta Ads, contenido, desarrollo web, IA y automatización para convertir atención en clientes.";

// Rendered by app/opengraph-image.tsx and app/twitter-image.tsx. Listed
// explicitly because a page-level `openGraph` object replaces the inherited
// file-based image instead of merging with it.
const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "AdVibe Agencia — Marketing digital y producción audiovisual en Ecuador" };

type PageSeo = {
  /** Page title; the root layout template appends " | AdVibe Agencia". */
  title?: string;
  description?: string;
  /** Route path, e.g. "/casos". Used for the canonical URL and og:url. */
  path: string;
  noIndex?: boolean;
};

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString().replace(/\/$/, "");
}

/**
 * Per-page metadata with a self-referencing canonical and matching Open Graph
 * tags. Canonicals are set per page (never in the root layout) so child routes
 * don't inherit the home page's canonical.
 */
export function pageMetadata({ title, description = DEFAULT_DESCRIPTION, path, noIndex }: PageSeo): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: url },
    openGraph: { title: fullTitle, description, url, siteName: SITE_NAME, locale: "es_EC", type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: ["/twitter-image"] },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
