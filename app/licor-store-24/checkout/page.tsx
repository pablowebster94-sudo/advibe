import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/licor/config";
import CheckoutView from "@/components/licor/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order — 24/7 free delivery.",
  alternates: { canonical: absoluteUrl("/checkout") },
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
