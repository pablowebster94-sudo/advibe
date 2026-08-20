import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CATEGORY_BY_ID,
  PRODUCTS,
  getProduct,
  relatedProducts,
} from "@/lib/licor/catalog";
import { BUSINESS, COMMERCE, SITE, absoluteUrl, route } from "@/lib/licor/config";
import { discountPercent, formatPrice } from "@/lib/licor/format";
import CallButton from "@/components/licor/CallButton";
import DemoDataNotice from "@/components/licor/DemoDataNotice";
import PhoneOrderBlock from "@/components/licor/PhoneOrderBlock";
import ProductGrid from "@/components/licor/ProductGrid";
import ProductImage from "@/components/licor/ProductImage";
import ProductPurchase from "@/components/licor/ProductPurchase";
import { AvailabilityTag } from "@/components/licor/ProductCard";
import { Badge, Section, SectionHeading } from "@/components/licor/ui";
import { ChevronRightIcon, ClockIcon, ShieldIcon, TruckIcon } from "@/components/licor/Icons";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: PageProps<"/licor-store-24/product/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) return { title: "Product not found" };

  const description = `${product.brand} ${product.name}, ${product.size}. ${product.description} Delivered free, 24/7, by ${BUSINESS.name}.`;
  return {
    title: `${product.name} — ${product.size}`,
    description: description.slice(0, 300),
    alternates: { canonical: absoluteUrl(`/product/${product.slug}`) },
    openGraph: {
      type: "website",
      title: `${product.name} | ${BUSINESS.name}`,
      description: description.slice(0, 300),
      url: absoluteUrl(`/product/${product.slug}`),
      siteName: BUSINESS.name,
      locale: SITE.locale,
    },
  };
}

export default async function ProductPage(
  props: PageProps<"/licor-store-24/product/[slug]">,
) {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) notFound();

  const category = CATEGORY_BY_ID[product.category];
  const off = discountPercent(product.price, product.compareAtPrice);
  const related = relatedProducts(product);

  /**
   * Product structured data. `offers` is only emitted once the catalog holds
   * real pricing (COMMERCE.demoPricing = false) — publishing demo prices as
   * machine-readable offers would misrepresent the store.
   */
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    category: category.name,
    description: product.description,
    size: product.size,
    ...(COMMERCE.demoPricing
      ? {}
      : {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: COMMERCE.currency,
            availability:
              product.availability === "out-of-stock"
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            url: absoluteUrl(`/product/${product.slug}`),
            seller: { "@type": "Organization", name: BUSINESS.name },
          },
        }),
  };

  return (
    <>
      <Section className="pt-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-white/40">
            <li>
              <Link href={route("/shop")} className="inline-flex min-h-9 items-center transition hover:text-white">
                Shop
              </Link>
            </li>
            <ChevronRightIcon className="h-3 w-3" />
            <li>
              <Link
                href={`${route("/shop")}?category=${category.id}`}
                className="inline-flex min-h-9 items-center transition hover:text-white"
              >
                {category.name}
              </Link>
            </li>
            <ChevronRightIcon className="h-3 w-3" />
            <li className="text-white/70">{product.name}</li>
          </ol>
        </nav>
      </Section>

      <Section className="pt-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.08),transparent_65%)]">
            <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
              {off ? <Badge tone="red">-{off}% off</Badge> : null}
              {product.bestSeller ? <Badge tone="gold">Best seller</Badge> : null}
            </div>
            {/* Capped on phones so the price and ADD TO CART stay near the fold. */}
            <div className="relative mx-auto aspect-square w-full max-w-[15rem] p-6 sm:max-w-md sm:p-8">
              <ProductImage
                product={product}
                priority
                sizes="(max-width: 1024px) 90vw, 460px"
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#D4AF37]">
              {product.brand}
            </p>
            <h1 className="mt-3 text-3xl font-black uppercase leading-[0.98] tracking-tight text-white sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-white/12 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/75">
                {product.size}
              </span>
              <span className="rounded-lg border border-white/12 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/75">
                {category.name}
              </span>
              <AvailabilityTag product={product} />
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="text-4xl font-black leading-none text-white">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice ? (
                <>
                  <span className="text-lg text-white/35 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className="rounded-md bg-[#E01B22] px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-white">
                    Save {formatPrice(product.compareAtPrice - product.price)}
                  </span>
                </>
              ) : null}
            </div>

            <p className="mt-5 text-sm leading-relaxed text-white/65">
              {product.description}
            </p>

            <ProductPurchase product={product} />

            <ul className="mt-7 grid grid-cols-3 gap-2">
              {[
                { icon: TruckIcon, label: "Free delivery" },
                { icon: ClockIcon, label: "24/7 ordering" },
                { icon: ShieldIcon, label: "21+ ID required" },
              ].map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-3 text-center"
                >
                  <Icon className="h-4 w-4 text-[#D4AF37]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/60">
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                Need it now?
              </p>
              <p className="mt-2 text-sm text-white/60">
                Order this bottle by phone in one call.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {BUSINESS.phones.map((phone) => (
                  <CallButton key={phone.tel} phone={phone} variant="outline" size="sm" />
                ))}
              </div>
            </div>

            <DemoDataNotice className="mt-5" />
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section className="py-14">
          <SectionHeading eyebrow="Goes well with this" title="Related products" />
          <ProductGrid products={related} className="mt-7" />
        </Section>
      ) : null}

      <PhoneOrderBlock />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
    </>
  );
}
