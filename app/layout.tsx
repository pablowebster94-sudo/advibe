import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MetaPixel from "@/components/MetaPixel";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const siteUrl = "https://www.advibeagencia.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "AdVibe Agencia | Marketing digital y Meta Ads en Gualaceo y Cuenca",
  description: "Agencia de marketing digital en Azuay, Ecuador. Contenido, video y anuncios en Facebook e Instagram que llevan clientes a tu WhatsApp. Más de 2.800 conversaciones generadas.",
  keywords: ["AdVibe Agencia","agencia de marketing Gualaceo","agencia de marketing Cuenca","agencia de marketing Ecuador","Meta Ads Ecuador","inteligencia artificial para empresas","automatización comercial","desarrollo web Ecuador","producción audiovisual Ecuador"],
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true },
  openGraph: { title: "AdVibe Agencia | Marketing digital y Meta Ads en Gualaceo y Cuenca", description: "Contenido y anuncios que llevan clientes a tu WhatsApp. Más de 2.800 conversaciones generadas para negocios.", url: siteUrl, siteName: "AdVibe Agencia", locale: "es_EC", type: "website" },
  twitter: { card: "summary_large_image", title: "AdVibe Agencia | Marketing digital en Azuay", description: "Contenido y anuncios que llevan clientes a tu WhatsApp." },
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
