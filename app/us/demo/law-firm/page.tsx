import type { Metadata } from "next";
import LawFirmDemo from "@/components/us/LawFirmDemo";

export const metadata: Metadata = {
  title: "Law Firm Website Demo | AdVibe USA",
  description: "Sample website by AdVibe Agency. Fictional business, for demonstration only.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <LawFirmDemo />;
}
