import { pageMetadata } from "@/lib/seo";

// Internal operations dashboard: never index.
export const metadata = pageMetadata({ title: "Control", path: "/control", noIndex: true });

export default function ControlLayout({ children }: { children: React.ReactNode }) {
  return children;
}
