import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Latin Eagle Multiservices | Cerca de casa, aunque estés lejos",
  description: "Envíos de dinero, paquetería internacional, boletos de avión, pago de facturas, recargas telefónicas y servicios para la comunidad latina en Long Island.",
  metadataBase: new URL("https://latineaglemultiservices.com"),
  openGraph: {
    title: "Latin Eagle Multiservices",
    description: "Un lugar. Muchas soluciones. Atención cercana para nuestra comunidad latina.",
    type: "website",
    locale: "es_US",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
