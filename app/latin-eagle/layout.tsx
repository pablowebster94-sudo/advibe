import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { SITE_URL } from "./content";
import "./styles.css";

const montserrat = Montserrat({ variable: "--font-le", subsets: ["latin"], weight: ["500", "700", "800", "900"] });

const TITLE = "Latin Eagle Multiservices | Envíos, giros y productos latinos en Patchogue, NY";
const DESCRIPTION = "Envíos a Ecuador y Colombia, giros y productos latinos en Patchogue, NY. Farmacia de venta libre y atención en español. Escríbenos por WhatsApp.";

// Reemplaza lo heredado del layout raíz de AdVibe (canonical, Open Graph, Twitter):
// esta ruta tiene la identidad de Latin Eagle, no la de AdVibe.
export const metadata: Metadata = {
  // Solo el origen: las rutas de metadata (p. ej. /latin-eagle/opengraph-image) ya son absolutas.
  metadataBase: new URL(new URL(SITE_URL).origin),
  title: { absolute: TITLE },
  description: DESCRIPTION,
  applicationName: "Latin Eagle Multiservices",
  keywords: ["envíos a Ecuador Patchogue", "envíos a Colombia Patchogue", "giros Patchogue", "envío de dinero Patchogue", "productos ecuatorianos Long Island", "tienda latina Patchogue", "Latin Eagle Multiservices"],
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  openGraph: { siteName: "Latin Eagle Multiservices", locale: "es_US", alternateLocale: ["en_US"], type: "website", url: SITE_URL, title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  icons: { icon: "/latin-eagle/logo.webp", apple: "/latin-eagle/logo.webp" },
};

export const viewport: Viewport = { themeColor: "#0a0a0a" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${montserrat.variable} le-root`}>{children}</div>;
}
