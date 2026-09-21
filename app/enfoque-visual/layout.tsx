import type { Metadata } from "next";
import Script from "next/script";
import "./styles.css";

export const metadata: Metadata = {
  title: "Enfoque Visual | Propiedades y vehículos",
  description: "Casas, departamentos, terrenos, alquileres y vehículos en Ecuador.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://enfoque.advibeagencia.com"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const pixel = process.env.NEXT_PUBLIC_ENFOQUE_META_PIXEL_ID;
  const ga = process.env.NEXT_PUBLIC_ENFOQUE_GA_ID || process.env.NEXT_PUBLIC_GA_ID;
  const pixelCode = pixel
    ? "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?" +
      "n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;" +
      "n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;" +
      "t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}" +
      "(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');" +
      "fbq('init','" + pixel + "');fbq('track','PageView');"
    : "";

  return <>
    {pixel && <Script id="ev-pixel" strategy="afterInteractive">{pixelCode}</Script>}
    {ga && <>
      <Script src={"https://www.googletagmanager.com/gtag/js?id=" + ga} strategy="afterInteractive" />
      <Script id="ev-ga" strategy="afterInteractive">
        {"window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','" + ga + "');"}
      </Script>
    </>}
    {children}
  </>;
}
