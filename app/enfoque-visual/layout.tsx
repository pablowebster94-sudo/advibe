import type { Metadata } from "next";
import Script from "next/script";
import "./styles.css";

export const metadata: Metadata = {
  title: "Enfoque Visual | Propiedades y vehículos",
  description: "Casas, departamentos, terrenos, alquileres y vehículos en Ecuador.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://enfoque.advibeagencia.com"),
};

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
