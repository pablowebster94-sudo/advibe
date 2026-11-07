import type { Metadata } from "next";
import DealerDemo from "@/components/us/DealerDemo";

export const metadata: Metadata = {
  title: "Car Dealer Website Demo | AdVibe USA",
  description: "Sample website by AdVibe Agency. Fictional business, for demonstration only.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DealerDemo />;
}
