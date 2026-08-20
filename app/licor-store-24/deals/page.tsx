import type { Metadata } from "next";
import { PRODUCTS } from "@/lib/licor/catalog";
import { BUSINESS, absoluteUrl } from "@/lib/licor/config";
import BeerCases from "@/components/licor/BeerCases";
import DealsGrid from "@/components/licor/DealsGrid";
import DemoDataNotice from "@/components/licor/DemoDataNotice";
import PhoneOrderBlock from "@/components/licor/PhoneOrderBlock";
import ProductGrid from "@/components/licor/ProductGrid";
import { Section, SectionHeading } from "@/components/licor/ui";

export const metadata: Metadata = {
  title: "Today's Deals",
  description: `Weekend deals, bundles, beer cases and premium spirits from ${BUSINESS.name}. 24/7 free delivery in ${BUSINESS.serviceArea}.`,
  alternates: { canonical: absoluteUrl("/deals") },
};

export default function DealsPage() {
  const onSale = PRODUCTS.filter(
    (product) => product.compareAtPrice && product.compareAtPrice > product.price,
  );

  return (
    <>
      <Section className="pb-8 pt-8 sm:pt-10">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">
          Save tonight
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
          Today&apos;s deals
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
          Rotating offers across spirits, beer and bundles. {BUSINESS.concept}.
        </p>
        <DemoDataNotice className="mt-5" />
        <div className="mt-8">
          <DealsGrid />
        </div>
      </Section>

      {onSale.length > 0 ? (
        <Section className="py-10">
          <SectionHeading
            eyebrow="Marked down right now"
            title="On sale"
            copy="Every product currently discounted in the store."
          />
          <ProductGrid products={onSale} priorityCount={4} className="mt-7" />
        </Section>
      ) : null}

      <BeerCases />
      <PhoneOrderBlock />
    </>
  );
}
