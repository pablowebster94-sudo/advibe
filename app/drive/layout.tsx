import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "AM Motorsport Drive",
  description: "Vehículos disponibles de AM Motorsport: revisa características y solicita información.",
  path: "/drive",
});

export default function DriveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
