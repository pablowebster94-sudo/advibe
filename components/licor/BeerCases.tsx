import Link from "next/link";
import { BEER_CASES } from "@/lib/licor/catalog";
import { route } from "@/lib/licor/config";
import { discountPercent, formatPrice } from "@/lib/licor/format";
import AddToCartButton from "./AddToCartButton";
import ProductImage from "./ProductImage";
import { Badge, LinkButton, Section, SectionHeading } from "./ui";

export default function BeerCases({ id = "beer-cases" }: { id?: string }) {
  if (BEER_CASES.length === 0) return null;

  return (
    <Section id={id} className="py-12 sm:py-16">
      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#171003] via-[#0A0A0B] to-[#0A0A0B] p-5 sm:p-8">
        <SectionHeading
          eyebrow="Stocked for the whole crew"
          title="Beer cases"
          copy="12 packs ready to go, delivered free around the clock."
          action={
            <span className="hidden sm:block">
              <LinkButton href={`${route("/shop")}?tag=case`} variant="outline" size="sm">
                All beer
              </LinkButton>
            </span>
          }
        />

        <div className="mt-7 grid gap-3 sm:grid-cols-3 sm:gap-4">
          {BEER_CASES.map((product) => {
            const off = discountPercent(product.price, product.compareAtPrice);
            return (
              <article
                key={product.slug}
                className="group flex flex-col rounded-2xl border border-white/[0.08] bg-black/40 p-4 transition hover:border-[#D4AF37]/45"
              >
                <Link
                  href={route(`/product/${product.slug}`)}
                  className="relative mx-auto block aspect-square w-full max-w-[190px]"
                >
                  {off ? (
                    <span className="absolute left-0 top-0 z-10">
                      <Badge tone="red">-{off}%</Badge>
                    </span>
                  ) : null}
                  <ProductImage
                    product={product}
                    sizes="(max-width: 640px) 60vw, 190px"
                    className="transition duration-500 group-hover:scale-105"
                  />
                </Link>

                <h3 className="mt-3 text-sm font-bold leading-snug text-white">
                  {product.name}
                </h3>
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/40">
                  {product.size}
                </p>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-black text-white">
                    {formatPrice(product.price)}
                  </span>
                  {product.compareAtPrice ? (
                    <span className="text-xs text-white/35 line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  ) : null}
                </div>

                <AddToCartButton
                  product={product}
                  size="sm"
                  className="mt-4 w-full"
                  label="Order now"
                />
              </article>
            );
          })}
        </div>

        <div className="mt-5 sm:hidden">
          <LinkButton href={`${route("/shop")}?tag=case`} variant="outline" size="md" className="w-full">
            All beer
          </LinkButton>
        </div>
      </div>
    </Section>
  );
}
