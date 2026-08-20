"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { trackPurchase } from "@/lib/licor/analytics";
import { NEVER_CHANGES } from "@/lib/licor/browserStore";
import { BUSINESS, COMMERCE, route } from "@/lib/licor/config";
import { formatPrice } from "@/lib/licor/format";
import CallButton from "./CallButton";
import { readStoredOrder } from "./orderStorage";
import { CheckIcon, TruckIcon } from "./Icons";
import { LinkButton, Placeholder, Section } from "./ui";

export default function OrderConfirmation() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id") ?? "";
  // sessionStorage is only readable on the client; `loaded` stays false through
  // the server render and hydration so both passes produce the same markup.
  const loaded = useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false,
  );
  const order = useMemo(
    () => (loaded && orderId ? readStoredOrder(orderId) : null),
    [loaded, orderId],
  );
  const purchaseTracked = useRef(false);

  useEffect(() => {
    if (!order || purchaseTracked.current) return;
    purchaseTracked.current = true;
    trackPurchase(
      order.orderId,
      order.items.map((item) => ({
        id: item.slug,
        quantity: item.quantity,
        item_price: item.price,
      })),
      order.totals,
    );
  }, [order]);

  if (!loaded) {
    return (
      <Section className="py-16">
        <p className="text-center text-sm text-white/45">Loading your order…</p>
      </Section>
    );
  }

  if (!order) {
    return (
      <Section className="py-12 sm:py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Order not found
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            {orderId
              ? `We could not load the details for ${orderId} in this browser. If you just placed it, the store still has it — call us to confirm.`
              : "No order reference was provided."}
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <CallButton
              phone={BUSINESS.phones[0]}
              label="Call the store"
              variant="primary"
              size="lg"
            />
            <LinkButton href={route("/shop")} variant="ghost" size="md">
              Back to the shop
            </LinkButton>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#14100A] to-[#0A0A0B] p-6 text-center sm:p-9">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37] text-black">
            <CheckIcon className="h-8 w-8" />
          </span>
          <h1 className="mt-6 text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
            Order received
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            Thanks {order.customer.firstName}. Your order reference is
          </p>
          <p className="mt-2 font-mono text-lg font-black tracking-[0.1em] text-[#D4AF37]">
            {order.orderId}
          </p>

          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/55">
            The store will contact you at{" "}
            <span className="font-semibold text-white">{order.customer.phone}</span> to
            confirm the order and arrange payment.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {BUSINESS.phones.map((phone, index) => (
              <CallButton
                key={phone.tel}
                phone={phone}
                variant={index === 0 ? "primary" : "outline"}
                size="lg"
                className="w-full"
              />
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-[#D4AF37]">
            Order summary
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {order.items.map((item) => (
              <li key={item.slug} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-semibold text-white">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="block text-[11px] uppercase tracking-[0.1em] text-white/40">
                    {item.brand} · {item.size}
                  </span>
                </span>
                <span className="shrink-0 font-bold text-white">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 flex flex-col gap-3 border-t border-white/[0.08] pt-5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-white/55">Subtotal</dt>
              <dd className="font-bold text-white">{formatPrice(order.totals.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1.5 text-white/55">
                <TruckIcon className="h-4 w-4 text-[#D4AF37]" />
                Delivery
              </dt>
              <dd className="font-black uppercase tracking-[0.1em] text-[#D4AF37]">
                {COMMERCE.deliveryLabel}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
              <dt className="font-black uppercase tracking-[0.14em] text-white">Total</dt>
              <dd className="text-2xl font-black leading-none text-white">
                {formatPrice(order.totals.total)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-white/[0.08] pt-5 text-sm text-white/55">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
              Delivering to
            </p>
            <p className="mt-2 leading-relaxed">
              {order.delivery.address}
              {order.delivery.apartment ? `, ${order.delivery.apartment}` : ""}
              <br />
              {order.delivery.city}, {order.delivery.state} {order.delivery.zip}
            </p>
            {order.delivery.instructions ? (
              <p className="mt-2 text-[13px] text-white/45">
                “{order.delivery.instructions}”
              </p>
            ) : null}
            <p className="mt-4 text-[11px] leading-relaxed text-white/35">
              Estimated delivery time: <Placeholder>{COMMERCE.deliveryEta}</Placeholder> ·
              Payment: <Placeholder>{COMMERCE.payment.note}</Placeholder>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-white/35">
          An adult {BUSINESS.minimumAge} or older with a valid government-issued ID must
          be present to receive this delivery.
        </p>

        <LinkButton href={route("/shop")} variant="ghost" size="lg" className="mt-6 w-full">
          Continue shopping
        </LinkButton>
      </div>
    </Section>
  );
}
