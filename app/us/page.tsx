import type { Metadata } from "next";
import UsLanding from "@/components/us/UsLanding";

export const metadata: Metadata = {
  title: "AdVibe USA | Websites & Lead Generation for Long Island Businesses",
  description: "Website redesign, lead capture, Meta Ads and Google Ads for car dealers, law firms and local businesses on Long Island, NY. English and Spanish.",
  alternates: { canonical: "/us" },
  openGraph: {
    title: "AdVibe USA | Websites that bring you customers",
    description: "Website redesign, lead capture and local ads for Long Island businesses. English & Spanish.",
    url: "/us",
    siteName: "AdVibe Agency",
    locale: "en_US",
    type: "website",
  },
};

export default function UsPage() {
  return <UsLanding />;
}
