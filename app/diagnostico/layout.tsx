import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Diagnóstico digital gratuito",
  description: "Solicita un diagnóstico de tu marketing digital: Meta Ads, contenido, web y embudo comercial. Te decimos qué mejorar para conseguir más clientes.",
  path: "/diagnostico",
});

export default function DiagnosticoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
