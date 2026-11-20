import type { Metadata } from "next";
import type { ReactNode } from "react";

const siteUrl = "https://www.advibeagencia.com";
const title = "Diagnóstico digital gratuito | AdVibe Agencia";
const description =
  "Revisamos tu presencia digital, captación y conversión para detectar qué está frenando tu crecimiento. Diagnóstico gratuito para negocios de Gualaceo, Cuenca y el Azuay.";
const url = `${siteUrl}/diagnostico`;

// La página es un componente de cliente y no puede exportar metadata, así que
// heredaba la del layout raíz: mismo título que la home y canonical apuntando a
// "/". Siendo la página a la que llevan todos los CTA, se declaraba a sí misma
// duplicada de la portada.
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, siteName: "AdVibe Agencia", locale: "es_EC", type: "website" },
};

export default function DiagnosticoLayout({ children }: { children: ReactNode }) {
  return children;
}
