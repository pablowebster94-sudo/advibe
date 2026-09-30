import { pageMetadata } from "@/lib/seo";

// page.tsx es un componente de cliente y no puede exportar metadata; se declara aquí.
export const metadata = pageMetadata({
  title: "Diagnóstico digital gratuito | AdVibe Agencia",
  description: "Revisamos tu publicidad, web, contenido y seguimiento por WhatsApp para detectar qué está frenando tus ventas. Gratis y en menos de 2 minutos.",
  path: "/diagnostico",
});

export default function DiagnosticoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
