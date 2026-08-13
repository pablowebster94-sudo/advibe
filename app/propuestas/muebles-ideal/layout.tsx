import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Propuesta Comercial | Muebles Ideal × AdVibe",
  description:
    "Propuesta comercial de AdVibe para Muebles Ideal: contenido audiovisual, diseño y Meta Ads.",
  alternates: { canonical: "/propuestas/muebles-ideal" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
