import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/licor/config";
import AccountView from "@/components/licor/AccountView";

export const metadata: Metadata = {
  title: "Account",
  description: "Your cart, delivery information and store contact details.",
  alternates: { canonical: absoluteUrl("/account") },
  robots: { index: false, follow: true },
};

export default function AccountPage() {
  return <AccountView />;
}
