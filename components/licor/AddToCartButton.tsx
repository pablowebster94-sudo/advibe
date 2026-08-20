"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/licor/types";
import { useCart } from "./CartProvider";
import { CartIcon, CheckIcon } from "./Icons";
import { ActionButton, type ButtonSize, type ButtonVariant } from "./ui";

export default function AddToCartButton({
  product,
  quantity = 1,
  variant = "primary",
  size = "md",
  className = "",
  label = "Add to cart",
}: {
  product: Product;
  quantity?: number;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  label?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const soldOut = product.availability === "out-of-stock";

  function onClick() {
    if (soldOut) return;
    add(product.slug, quantity);
    setAdded(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <ActionButton
      type="button"
      variant={added ? "gold" : variant}
      size={size}
      className={className}
      onClick={onClick}
      disabled={soldOut}
      aria-live="polite"
    >
      {soldOut ? (
        "Sold out"
      ) : added ? (
        <>
          <CheckIcon className="h-4 w-4" />
          Added
        </>
      ) : (
        <>
          <CartIcon className="h-4 w-4" />
          {label}
        </>
      )}
    </ActionButton>
  );
}
