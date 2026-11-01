import type { Metadata, Viewport } from "next";
import { SITE_URL } from "./content";
import "./styles.css";

const TITLE = "Latin Eagle Multiservices | Envíos, giros y productos latinos en Patchogue, NY";
const DESCRIPTION = "Envíos a Ecuador y Colombia, giros y productos latinos en Patchogue, NY. Farmacia de venta libre y atención en español. Escríbenos por WhatsApp.";

// Reemplaza lo heredado del layout raíz de AdVibe: esta ruta tiene la identidad de Latin Eagle.
export const metadata: Metadata = {
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
  return <div className="le-root">{children}</div>;
}
