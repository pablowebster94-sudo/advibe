import type { Metadata } from "next";
import { Suspense } from "react";
import { PRODUCTS } from "@/lib/licor/catalog";
import { BUSINESS, absoluteUrl } from "@/lib/licor/config";
import CategoryRail from "@/components/licor/CategoryRail";
import DemoDataNotice from "@/components/licor/DemoDataNotice";
import PhoneOrderBlock from "@/components/licor/PhoneOrderBlock";
import ShopBrowser from "@/components/licor/ShopBrowser";
import { Section } from "@/components/licor/ui";

export const metadata: Metadata = {
  title: "Shop Liquor, Beer & Spirits",
  description: `Browse ${PRODUCTS.length}+ bottles from ${BUSINESS.name} — whiskey, tequila, vodka, cognac, rum, gin, champagne, beer and wine with 24/7 free delivery.`,
  alternates: { canonical: absoluteUrl("/shop") },
};

export default function ShopPage() {
  return (
    <>
      <Section className="pb-6 pt-8 sm:pt-10">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">
          The catalog
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
          Shop
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
          Every bottle in the store, searchable and filterable. {BUSINESS.concept}.
        </p>
        <DemoDataNotice className="mt-5" />
      </Section>

      <Suspense
        fallback={
          <Section>
            <p className="py-16 text-center text-sm text-white/45">Loading catalog…</p>
          </Section>
        }
      >
        <ShopBrowser />
      </Suspense>

      <CategoryRail />
      <PhoneOrderBlock />
    </>
  );
}
