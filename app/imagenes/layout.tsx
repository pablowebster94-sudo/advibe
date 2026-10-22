import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AdVibe Imágenes",
  robots: { index: false, follow: false },
};

export default function ImagenesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
