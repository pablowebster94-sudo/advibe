import type { Metadata } from "next";

// Página de un cliente dentro del dominio de AdVibe: reemplaza el canonical y el Open Graph
// heredados del layout raíz para que no apunte a advibeagencia.com, y usa fondo claro.
export const metadata: Metadata = {
  alternates: { canonical: null },
  openGraph: { siteName: "Muebles Ideal", locale: "es_EC", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#faf9f7] text-black">{children}</div>;
}
