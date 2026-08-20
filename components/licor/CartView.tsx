"use client";

import Link from "next/link";
import { BUSINESS, COMMERCE, route } from "@/lib/licor/config";
import { formatPrice } from "@/lib/licor/format";
import CallButton from "./CallButton";
import DemoDataNotice from "./DemoDataNotice";
import ProductImage from "./ProductImage";
import QuantityStepper from "./QuantityStepper";
import { useCart } from "./CartProvider";
import { TrashIcon, TruckIcon } from "./Icons";
import { LinkButton, Section } from "./ui";

export default function CartView() {
  const { items, totals, ready, setQuantity, remove } = useCart();

  if (!ready) {
    return (
      <Section className="py-16">
        <p className="text-center text-sm text-white/45">Loading your cart…</p>
      </Section>
    );
  }

  if (items.length === 0) {
    return (
      <Section className="py-12 sm:py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Your cart is empty
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            Add a bottle and we will bring it to you. {BUSINESS.concept}.
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <LinkButton href={route("/shop")} variant="primary" size="lg">
              Start shopping
            </LinkButton>
            <CallButton
              phone={BUSINESS.phones[0]}
              label="Order by phone"
              variant="outline"
              size="lg"
            />
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section className="py-8 sm:py-10">
      <h1 className="text-3xl font-black uppercase leading-none tracking-tight text-white sm:text-4xl">
        Your cart
      </h1>
      <p className="mt-2 text-sm text-white/50">
        {totals.itemCount} item{totals.itemCount === 1 ? "" : "s"}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* Lines */}
        <ul className="flex flex-col gap-3">
          {items.map(({ product, quantity, lineTotal }) => (
            <li
              key={product.slug}
              className="flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 sm:gap-4 sm:p-4"
            >
              <Link
                href={route(`/product/${product.slug}`)}
                className="relative h-28 w-20 shrink-0 rounded-xl bg-black/50 sm:h-32 sm:w-24"
              >
                <ProductImage product={product} sizes="96px" className="p-2" />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                      {product.brand}
                    </p>
                    <Link href={route(`/product/${product.slug}`)}>
                      <h2 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-white transition hover:text-[#F5E6B8] sm:text-base">
                        {product.name}
                      </h2>
                    </Link>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/40">
                      {product.size}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(product.slug)}
                    aria-label={`Remove ${product.name} from cart`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/45 transition hover:border-[#E01B22]/60 hover:text-[#E01B22]"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                  <QuantityStepper
                    value={quantity}
                    size="sm"
                    max={
                      product.stock !== null && product.stock > 0
                        ? product.stock
                        : undefined
                    }
                    onChange={(next) => setQuantity(product.slug, next)}
                    label={`Quantity of ${product.name}`}
                  />
                  <div className="text-right">
                    {product.compareAtPrice ? (
                      <p className="text-xs text-white/35 line-through">
                        {formatPrice(product.compareAtPrice * quantity)}
                      </p>
                    ) : null}
                    <p className="text-lg font-black leading-none text-white">
                      {formatPrice(lineTotal)}
                    </p>
                    <p className="mt-1 text-[11px] text-white/40">
                      {formatPrice(product.price)} each
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="lg:sticky lg:top-32">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-[#D4AF37]">
              Order summary
            </h2>

            <dl className="mt-5 flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-white/55">Subtotal</dt>
                <dd className="font-bold text-white">{formatPrice(totals.subtotal)}</dd>
              </div>
              {totals.savings > 0 ? (
                <div className="flex items-center justify-between">
                  <dt className="text-white/55">You save</dt>
                  <dd className="font-bold text-[#E01B22]">
                    −{formatPrice(totals.savings)}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-white/55">
                  <TruckIcon className="h-4 w-4 text-[#D4AF37]" />
                  Delivery
                </dt>
                <dd className="font-black uppercase tracking-[0.1em] text-[#D4AF37]">
                  {COMMERCE.deliveryLabel}
                </dd>
              </div>
              {COMMERCE.taxes.enabled ? null : (
                <div className="flex items-center justify-between text-[11px]">
                  <dt className="text-white/35">Taxes &amp; fees</dt>
                  <dd className="font-mono text-white/35">{COMMERCE.taxes.label}</dd>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-white/[0.08] pt-4">
                <dt className="text-sm font-black uppercase tracking-[0.14em] text-white">
                  Total
                </dt>
                <dd className="text-2xl font-black leading-none text-white">
                  {formatPrice(totals.total)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3">
              <LinkButton href={route("/checkout")} variant="primary" size="lg">
                Checkout
              </LinkButton>
              <LinkButton href={route("/shop")} variant="ghost" size="md">
                Continue shopping
              </LinkButton>
            </div>

            <div className="mt-5 border-t border-white/[0.08] pt-5">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
                Prefer to call?
              </p>
              <div className="mt-3 grid gap-2">
                {BUSINESS.phones.map((phone) => (
                  <CallButton key={phone.tel} phone={phone} variant="outline" size="sm" />
                ))}
              </div>
            </div>
          </div>

          <DemoDataNotice className="mt-4" />
        </aside>
      </div>
    </Section>
  );
}
