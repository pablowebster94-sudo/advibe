import type { Metadata } from "next";
import RoofingUSPage from "../roofing-us/page";

export const metadata: Metadata = {
  title: "Roofing Lead Generation in Houston, TX | AdVibe",
  description:
    "A practical lead generation system for Houston roofing contractors: Meta Ads, focused landing pages, lead qualification and follow-up.",
  alternates: { canonical: "https://www.advibeagencia.com/roofing" },
  openGraph: {
    title: "More Roofing Opportunities. A Clearer Path to New Customers. | AdVibe",
    description:
      "See how AdVibe can structure a lead generation system for your Houston roofing company.",
    url: "https://www.advibeagencia.com/roofing",
    siteName: "AdVibe",
    locale: "en_US",
    type: "website",
  },
};

export default function RoofingPage() {
  return <RoofingUSPage />;
}
