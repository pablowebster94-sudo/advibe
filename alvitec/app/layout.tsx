import type { Metadata, Viewport } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { SITE_URL, site } from "@/lib/site";
import { images } from "@/lib/images";
import "./globals.css";

const display = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });
const body = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" });

const TITLE = "ALVITEC | Aluminio y vidrio en Guayaquil — fachadas, ventanas y puertas";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: site.description,
  applicationName: site.name,
  keywords: [
    "aluminio y vidrio Guayaquil",
    "fachadas de vidrio Guayaquil",
    "ventanas de aluminio Guayaquil",
    "puertas de aluminio",
    "vidrio templado",
    "vidrio laminado",
    "alucobond",
    "policarbonato",
    "divisiones de vidrio",
    "vitrinas",
    "ALVITEC",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: "/",
    siteName: site.name,
    title: TITLE,
    description: site.description,
    images: [{ url: images.hero.src, width: images.hero.width, height: images.hero.height, alt: "Arquitectura contemporánea con grandes superficies de vidrio (imagen referencial)" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: site.description, images: [images.hero.src] },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#10243A", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-EC" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
