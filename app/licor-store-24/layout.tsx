import type { Metadata, Viewport } from "next";
import { BUSINESS, SITE, absoluteUrl, route } from "@/lib/licor/config";
import { AnalyticsScripts } from "@/components/licor/Analytics";
import AgeGate from "@/components/licor/AgeGate";
import CartToast from "@/components/licor/CartToast";
import { CartProvider } from "@/components/licor/CartProvider";
import Footer from "@/components/licor/Footer";
import Header from "@/components/licor/Header";
import MobileTabBar from "@/components/licor/MobileTabBar";
import ClientBoot from "@/components/licor/ClientBoot";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${BUSINESS.name}`,
  },
  description: SITE.description,
  applicationName: BUSINESS.name,
  keywords: [
    "liquor delivery New York",
    "24/7 liquor delivery",
    "alcohol delivery near me",
    "whiskey delivery",
    "tequila delivery",
    "beer delivery",
    "Licor Store 24",
  ],
  alternates: { canonical: absoluteUrl("/") },
  manifest: route("/manifest.webmanifest"),
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: BUSINESS.name,
    title: SITE.title,
    description: SITE.description,
    url: absoluteUrl("/"),
    locale: SITE.locale,
    images: [
      {
        url: route("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: `${BUSINESS.name} — ${BUSINESS.concept}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    images: [route("/opengraph-image")],
  },
  appleWebApp: {
    capable: true,
    title: BUSINESS.name,
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: true },
  category: "shopping",
};

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Structured data.
 *
 * The business address has not been provided, so no address is emitted here —
 * publishing a placeholder as if it were real location data would be worse
 * than publishing none. Add `address` once the real address is confirmed.
 */
const storeSchema = {
  "@context": "https://schema.org",
  "@type": "LiquorStore",
  name: BUSINESS.name,
  url: absoluteUrl("/"),
  description: SITE.description,
  telephone: BUSINESS.phones.map((phone) => phone.tel),
  areaServed: { "@type": "State", name: BUSINESS.serviceArea },
  currenciesAccepted: "USD",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "00:00",
      closes: "23:59",
    },
  ],
  contactPoint: BUSINESS.phones.map((phone) => ({
    "@type": "ContactPoint",
    telephone: phone.tel,
    contactType: "sales",
    availableLanguage: ["English", "Spanish"],
  })),
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${absoluteUrl("/shop")}?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BUSINESS.name,
  url: absoluteUrl("/"),
  inLanguage: "en-US",
};

export default function LicorStoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="licor-root flex min-h-screen flex-col bg-black text-white">
      <CartProvider>
        <AgeGate />
        <Header />
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
        <Footer />
        <MobileTabBar />
        <CartToast />
      </CartProvider>
      <AnalyticsScripts />
      <ClientBoot />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </div>
  );
}
