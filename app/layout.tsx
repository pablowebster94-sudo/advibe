import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MetaPixel from "@/components/MetaPixel";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Global defaults. Canonical and og:url are set per page via pageMetadata()
// so child routes never inherit the home page's canonical. og:image and
// twitter:image come from app/opengraph-image.tsx and app/twitter-image.tsx.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["AdVibe Agencia","agencia de marketing digital Ecuador","agencia de marketing Gualaceo","agencia de marketing Cuenca","producción audiovisual Ecuador","Meta Ads Ecuador","desarrollo web Ecuador","inteligencia artificial para empresas","automatización comercial"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, siteName: SITE_NAME, locale: "es_EC", type: "website" },
  twitter: { card: "summary_large_image", title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
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
