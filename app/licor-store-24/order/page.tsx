import type { Metadata } from "next";
import { Suspense } from "react";
import { absoluteUrl } from "@/lib/licor/config";
import OrderConfirmation from "@/components/licor/OrderConfirmation";
import { Section } from "@/components/licor/ui";

export const metadata: Metadata = {
  title: "Order Confirmation",
  description: "Your Licor Store 24 order confirmation.",
  alternates: { canonical: absoluteUrl("/order") },
  robots: { index: false, follow: false },
};

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <Section className="py-16">
          <p className="text-center text-sm text-white/45">Loading your order…</p>
        </Section>
      }
    >
      <OrderConfirmation />
    </Suspense>
  );
}
