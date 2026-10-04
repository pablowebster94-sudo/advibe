import type { Metadata } from "next";
import Script from "next/script";
import { demoAllowed } from "@/lib/enfoque-catalog";
import "./styles.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://enfoque.advibeagencia.com";
const DESCRIPTION = "Casas, departamentos, terrenos, alquileres y vehículos en Cuenca, Gualaceo y Azuay, con fotografía, video e información clara.";

// Reemplaza por completo lo heredado del layout raíz de AdVibe (canonical, Open Graph,
// Twitter) para que ninguna página de Enfoque apunte a advibeagencia.com.
export async function generateMetadata(): Promise<Metadata> {
  const demo = demoAllowed();
  return {
    metadataBase: new URL(SITE),
    title: { default: "Enfoque Visual | Propiedades y vehículos en Ecuador", template: "%s | Enfoque Visual" },
    description: DESCRIPTION,
    applicationName: "Enfoque Visual",
    keywords: ["casas en venta Cuenca", "propiedades Gualaceo", "departamentos en alquiler Cuenca", "terrenos Azuay", "autos usados Cuenca", "vehículos en venta Ecuador"],
    alternates: { canonical: null },
    openGraph: { siteName: "Enfoque Visual", locale: "es_EC", type: "website", title: "Enfoque Visual | Propiedades y vehículos en Ecuador", description: DESCRIPTION },
    twitter: { card: "summary_large_image", title: "Enfoque Visual | Propiedades y vehículos en Ecuador", description: DESCRIPTION },
    // Con datos demo activos (desarrollo o preview con ENFOQUE_ALLOW_DEMO) nada se indexa.
    robots: demo ? { index: false, follow: false } : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const ga = process.env.NEXT_PUBLIC_ENFOQUE_GA_ID || process.env.NEXT_PUBLIC_GA_ID;
  return <>
    {ga && <>
      <Script src={"https://www.googletagmanager.com/gtag/js?id=" + ga} strategy="afterInteractive" />
      <Script id="ev-ga" strategy="afterInteractive">
        {"window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','" + ga + "');"}
      </Script>
    </>}
    {children}
  </>;
}
