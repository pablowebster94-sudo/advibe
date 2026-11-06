import type { Metadata } from "next";
import { BackgroundRemover } from "@/components/studio/BackgroundRemover";

export const metadata: Metadata = {
  title: "Quitar fondo · AdVibe AI Photo Editor",
  description: "Elimina el fondo de una imagen directamente en el navegador.",
  robots: { index: false, follow: false },
};

export default function QuitarFondoPage() {
  return <BackgroundRemover />;
}
