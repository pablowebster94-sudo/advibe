"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getProduct } from "@/lib/licor/catalog";
import { route } from "@/lib/licor/config";
import { formatPrice } from "@/lib/licor/format";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";
import { CheckIcon } from "./Icons";

/** Confirmation toast with a direct path to the cart — the add-to-cart handoff. */
export default function CartToast() {
  const { lastAdded, totals } = useCart();
  const pathname = usePathname();
  // Tracks which add has been dismissed, so a new add re-opens the toast
  // without an effect writing visibility state on every render pass.
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const visible = lastAdded !== null && dismissedAt !== lastAdded.at;

  useEffect(() => {
    if (!lastAdded) return;
    const timer = window.setTimeout(() => setDismissedAt(lastAdded.at), 4000);
    return () => window.clearTimeout(timer);
  }, [lastAdded]);

  // The toast would only get in the way on the cart and checkout screens.
  const suppressed =
    pathname.startsWith(route("/cart")) || pathname.startsWith(route("/checkout"));

  if (!lastAdded || !visible || suppressed) return null;

  const product = getProduct(lastAdded.slug);
  if (!product) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-[4.75rem] z-[70] mx-auto max-w-md animate-[licor-toast_240ms_ease-out] lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-96"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-[#D4AF37]/40 bg-[#0C0C0E]/98 p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        <span className="relative flex h-14 w-11 shrink-0 items-center justify-center rounded-lg bg-black/60">
          <ProductImage product={product} sizes="44px" className="p-1" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            <CheckIcon className="h-3 w-3" />
            Added to cart
          </p>
          <p className="mt-0.5 truncate text-sm font-bold text-white">{product.name}</p>
          <p className="text-[11px] text-white/45">
            {totals.itemCount} item{totals.itemCount === 1 ? "" : "s"} ·{" "}
            {formatPrice(totals.subtotal)}
          </p>
        </div>
        <Link
          href={route("/cart")}
          onClick={() => setDismissedAt(lastAdded.at)}
          className="shrink-0 rounded-lg bg-[#E01B22] px-3.5 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#F5252C]"
        >
          View
        </Link>
      </div>
    </div>
  );
}
