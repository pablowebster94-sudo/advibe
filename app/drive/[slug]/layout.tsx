import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return pageMetadata({
    title: "AM Motorsport Drive",
    description: "Vehículo disponible en AM Motorsport. Solicita información y agenda una prueba.",
    path: `/drive/${slug}`,
  });
}

export default function DriveVehicleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
