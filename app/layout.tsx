import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MetaPixel from "@/components/MetaPixel";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const siteUrl = "https://www.advibeagencia.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "AdVibe Agencia | Marketing, Video y Meta Ads en Gualaceo, Cuenca y Azuay",
  description: "Agencia de marketing en Gualaceo: producción de video, contenido para redes y Meta Ads para negocios de Gualaceo, Cuenca y todo el Azuay que quieren más clientes.",
  keywords: ["AdVibe Agencia","agencia de marketing Gualaceo","agencia de marketing Cuenca","producción de video Cuenca","Meta Ads Azuay","videos para restaurantes","agencia de marketing Ecuador","Meta Ads Ecuador","inteligencia artificial para empresas","automatización comercial","desarrollo web Ecuador","producción audiovisual Ecuador"],
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true },
  openGraph: { title: "AdVibe Agencia | Marketing, Video y Meta Ads en Gualaceo, Cuenca y Azuay", description: "Videos y anuncios que traen clientes a tu WhatsApp. Agencia de marketing en Gualaceo para negocios de todo el Azuay.", url: siteUrl, siteName: "AdVibe Agencia", locale: "es_EC", type: "website" },
  twitter: { card: "summary_large_image", title: "AdVibe Agencia | Marketing, Video y Meta Ads en el Azuay", description: "Videos y anuncios que traen clientes a tu WhatsApp." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased text-white`}>
      <body className="min-h-full bg-[#050505] text-white">
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
