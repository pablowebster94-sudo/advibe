"use client";

import { useEffect, useState } from "react";
import { trackViewContent } from "@/lib/licor/analytics";
import { MAX_LINE_QUANTITY } from "@/lib/licor/cart";
import { route } from "@/lib/licor/config";
import { formatPrice } from "@/lib/licor/format";
import type { Product } from "@/lib/licor/types";
import AddToCartButton from "./AddToCartButton";
import QuantityStepper from "./QuantityStepper";
import { useCart } from "./CartProvider";
import { LinkButton } from "./ui";

/** Quantity + add-to-cart panel. Also fires the ViewContent funnel event. */
export default function ProductPurchase({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const { items } = useCart();

  useEffect(() => {
    trackViewContent(product);
  }, [product]);

  const inCart = items.find((item) => item.product.slug === product.slug);
  const soldOut = product.availability === "out-of-stock";
  const max =
    product.stock !== null && product.stock > 0
      ? Math.min(product.stock, MAX_LINE_QUANTITY)
      : MAX_LINE_QUANTITY;

  return (
    <div className="mt-7">
      {soldOut ? (
        <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-white">
            Currently sold out
          </p>
          <p className="mt-2 text-sm text-white/55">
            Call the store to check when it is back, or browse alternatives.
          </p>
          <LinkButton
            href={route("/shop")}
            variant="ghost"
            size="md"
            className="mt-4 w-full"
          >
            Browse the catalog
          </LinkButton>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
              Quantity
            </span>
            <QuantityStepper value={quantity} onChange={setQuantity} max={max} />
            <span className="text-sm text-white/45">
              {formatPrice(product.price * quantity)} total
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <AddToCartButton
              product={product}
              quantity={quantity}
              size="lg"
              className="w-full"
              label={`Add to cart · ${formatPrice(product.price * quantity)}`}
            />
            <LinkButton href={route("/cart")} variant="outline" size="lg" className="w-full">
              {inCart ? `In cart (${inCart.quantity}) · Go to cart` : "Go to cart"}
            </LinkButton>
          </div>
        </>
      )}
    </div>
  );
}
