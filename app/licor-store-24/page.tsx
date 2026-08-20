import type { Metadata } from "next";
import Link from "next/link";
import { BEST_SELLERS, FEATURED_PRODUCTS, PRODUCTS } from "@/lib/licor/catalog";
import { BUSINESS, absoluteUrl, route } from "@/lib/licor/config";
import BeerCases from "@/components/licor/BeerCases";
import CategoryRail from "@/components/licor/CategoryRail";
import DealsGrid from "@/components/licor/DealsGrid";
import DemoDataNotice from "@/components/licor/DemoDataNotice";
import Hero from "@/components/licor/Hero";
import HowItWorks, { DeliveryPillars } from "@/components/licor/HowItWorks";
import PhoneOrderBlock from "@/components/licor/PhoneOrderBlock";
import ProductGrid from "@/components/licor/ProductGrid";
import SearchBox from "@/components/licor/SearchBox";
import { LinkButton, Section, SectionHeading } from "@/components/licor/ui";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

export default function LicorHomePage() {
  const featured = FEATURED_PRODUCTS.slice(0, 8);
  const bestSellers = BEST_SELLERS.slice(0, 4);

  return (
    <>
      <Hero />

      {/* Search, right where the ad traffic lands */}
      <Section className="pt-8">
        <SearchBox placeholder="Search Don Julio, Hennessy, whiskey, beer…" />
        <DemoDataNotice className="mt-4" />
      </Section>

      <Section className="pt-10 sm:pt-12">
        <SectionHeading
          eyebrow="Top shelf"
          title="Featured bottles"
          copy={`${PRODUCTS.length} products in stock right now — delivered free, ${BUSINESS.hours}.`}
          action={
            <Link
              href={route("/shop")}
              className="inline-flex min-h-11 items-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] transition hover:text-white"
            >
              Shop all →
            </Link>
          }
        />
        <ProductGrid products={featured} priorityCount={2} className="mt-7" />
        <div className="mt-6 sm:hidden">
          <LinkButton href={route("/shop")} variant="ghost" size="lg" className="w-full">
            Shop all products
          </LinkButton>
        </div>
      </Section>

      <CategoryRail />

      {/* 24/7 free delivery */}
      <Section className="py-12 sm:py-16">
        <div className="overflow-hidden rounded-3xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#14100A] via-[#0A0A0B] to-[#0A0A0B] p-6 sm:p-10">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">
              The promise
            </p>
            <h2 className="mt-4 text-3xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
              24/7 <span className="text-[#E01B22]">Free</span> Delivery
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/60">
              {BUSINESS.subheadline} No delivery fee, day or night.
            </p>
          </div>
          <div className="mt-8">
            <DeliveryPillars />
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <LinkButton href={route("/shop")} variant="primary" size="lg">
              Order now
            </LinkButton>
            <LinkButton href={route("/delivery")} variant="outline" size="lg">
              How delivery works
            </LinkButton>
          </div>
        </div>
      </Section>

      <Section className="py-6">
        <SectionHeading
          eyebrow="Today's deals"
          title="Deals"
          copy="Weekend markdowns, bundles, cases and premium picks."
          action={
            <Link
              href={route("/deals")}
              className="inline-flex min-h-11 items-center text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] transition hover:text-white"
            >
              All deals →
            </Link>
          }
        />
        <div className="mt-7">
          <DealsGrid />
        </div>
      </Section>

      <BeerCases />

      <Section className="py-6">
        <SectionHeading eyebrow="Moves fastest" title="Best sellers" />
        <ProductGrid products={bestSellers} className="mt-7" />
      </Section>

      <PhoneOrderBlock />

      <HowItWorks />
    </>
  );
}
