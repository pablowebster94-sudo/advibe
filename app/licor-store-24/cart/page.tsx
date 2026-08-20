import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/licor/config";
import CartView from "@/components/licor/CartView";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review your order before checkout. 24/7 free delivery.",
  alternates: { canonical: absoluteUrl("/cart") },
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return <CartView />;
}
