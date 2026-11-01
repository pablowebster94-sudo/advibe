import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MetaPixel from "@/components/MetaPixel";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const siteUrl = "https://www.advibeagencia.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "AdVibe | Desarrollo Web, Lead Generation y Marketing Digital",
  description: "Diseñamos páginas web, landing pages y sistemas de captación para empresas en Ecuador y Estados Unidos. Desarrollo web, Meta Ads, contenido y automatización.",
  keywords: ["AdVibe Agencia", "desarrollo web Ecuador", "diseño de páginas web Ecuador", "landing pages Ecuador", "desarrollo web Estados Unidos", "websites for contractors", "contractor lead generation", "roofing websites", "remodeling websites", "Meta Ads", "lead generation", "automatización comercial"],
  alternates: {
    canonical: siteUrl,
    languages: { "es-EC": siteUrl, "en-US": `${siteUrl}/usa` },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "AdVibe | Web, Marketing & Growth Systems",
    description: "Páginas web y sistemas digitales diseñados para atraer oportunidades y convertirlas en clientes. Ecuador y Estados Unidos.",
    url: siteUrl,
    siteName: "AdVibe Agencia",
    locale: "es_EC",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "AdVibe | Web, Marketing & Growth Systems", description: "Desarrollo web, captación y automatización para empresas en Ecuador y Estados Unidos." },
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
