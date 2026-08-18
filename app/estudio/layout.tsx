import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estudio de imagen | AdVibe",
  description:
    "Genera una imagen profesional a partir de un prompt, con formato y resolución a medida.",
  alternates: { canonical: "/estudio" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
