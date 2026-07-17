import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AdVibe Agencia | Marketing, IA y Automatización Premium",
  description:
    "AdVibe es una agencia de marketing e inteligencia artificial que crea experiencias digitales premium con campañas publicitarias, automatización y diseño de alto impacto.",
  keywords: [
    "Agencia de marketing",
    "Inteligencia artificial",
    "Automatización",
    "Meta Ads",
    "Google Ads",
    "Landing Pages",
    "Branding",
  ],
  metadataBase: new URL("https://advibe.agency"),
  openGraph: {
    title: "AdVibe Agencia | Marketing, IA y Automatización Premium",
    description:
      "Agencia premium que impulsa marcas con campañas, automatización inteligente y diseño de alto valor.",
    url: "https://advibe.agency",
    siteName: "AdVibe Agencia",
    images: [
      {
        url: "https://advibe.agency/og-image.png",
        width: 1200,
        height: 630,
        alt: "AdVibe Agencia premium",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AdVibe Agencia | Marketing, IA y Automatización Premium",
    description:
      "Agencia premium que impulsa marcas con campañas, automatización inteligente y diseño de alto valor.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased text-white`}
    >
      <body className="min-h-full bg-[#050505] text-white">{children}</body>
    </html>
  );
}
