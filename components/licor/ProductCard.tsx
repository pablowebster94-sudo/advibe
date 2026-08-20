import Link from "next/link";
import { CATEGORY_BY_ID } from "@/lib/licor/catalog";
import { route } from "@/lib/licor/config";
import { discountPercent, formatPrice } from "@/lib/licor/format";
import type { Product } from "@/lib/licor/types";
import AddToCartButton from "./AddToCartButton";
import ProductImage from "./ProductImage";
import { Badge } from "./ui";

export function AvailabilityTag({ product }: { product: Product }) {
  if (product.availability === "out-of-stock") {
    return <Badge tone="muted">Sold out</Badge>;
  }
  if (product.availability === "low-stock") {
    return <Badge tone="gold">Low stock</Badge>;
  }
  return <Badge tone="green">In stock</Badge>;
}

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const category = CATEGORY_BY_ID[product.category];
  const soldOut = product.availability === "out-of-stock";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.015] transition duration-300 hover:border-[#D4AF37]/40 hover:shadow-[0_24px_70px_-30px_rgba(212,175,55,0.5)]">
      <Link
        href={route(`/product/${product.slug}`)}
        className="relative block aspect-[4/5] overflow-hidden bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.07),transparent_65%)]"
        aria-label={product.name}
      >
        <span className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          {off ? <Badge tone="red">-{off}%</Badge> : null}
          {product.bestSeller && !off ? <Badge tone="gold">Best seller</Badge> : null}
        </span>
        {soldOut ? (
          <span className="absolute right-3 top-3 z-10">
            <Badge tone="muted">Sold out</Badge>
          </span>
        ) : null}
        <div
          className={`flex h-full w-full items-center justify-center p-4 transition duration-500 group-hover:scale-[1.06] ${
            soldOut ? "opacity-45 grayscale" : ""
          }`}
        >
          <ProductImage product={product} priority={priority} />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            {product.brand}
          </span>
          <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-white/35">
            {category.name}
          </span>
        </div>

        <Link href={route(`/product/${product.slug}`)} className="min-h-[2.6rem]">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white transition group-hover:text-[#F5E6B8] sm:text-[15px]">
            {product.name}
          </h3>
        </Link>

        <p className="text-[11px] uppercase tracking-[0.12em] text-white/40">{product.size}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="flex flex-col">
            <span className="text-lg font-black leading-none text-white sm:text-xl">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice ? (
              <span className="mt-1 text-xs text-white/35 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            ) : null}
          </div>
          <AvailabilityTag product={product} />
        </div>

        <AddToCartButton
          product={product}
          size="sm"
          className="w-full"
          label="Add to cart"
        />
      </div>
    </article>
  );
}
