"use client";

import { useCart } from "./CartProvider";

/** Cart quantity badge. Renders nothing until the cart is hydrated. */
export default function CartCount({ className = "" }: { className?: string }) {
  const { totals, ready } = useCart();
  if (!ready || totals.itemCount === 0) return null;

  return (
    <span
      aria-label={`${totals.itemCount} items in cart`}
      className={`pointer-events-none flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E01B22] px-1 text-[10px] font-black leading-none text-white ring-2 ring-black ${className}`.trim()}
    >
      {totals.itemCount > 99 ? "99+" : totals.itemCount}
    </span>
  );
}
