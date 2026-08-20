"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { trackInitiateCheckout } from "@/lib/licor/analytics";
import { BUSINESS, COMMERCE, route } from "@/lib/licor/config";
import { formatPrice } from "@/lib/licor/format";
import { validateOrder, type ValidationErrors } from "@/lib/licor/orders";
import { paymentMode } from "@/lib/licor/payments";
import {
  checkoutDraft,
  clearCheckoutDraft,
  updateCustomer,
  updateDelivery,
} from "@/lib/licor/checkoutDraft";
import CallButton from "./CallButton";
import DemoDataNotice from "./DemoDataNotice";
import ProductImage from "./ProductImage";
import { useCart } from "./CartProvider";
import { ORDER_STORAGE_PREFIX } from "./orderStorage";
import { ChevronDownIcon, TruckIcon } from "./Icons";
import { ActionButton, LinkButton, Placeholder, Section } from "./ui";

export default function CheckoutView() {
  const router = useRouter();
  const { items, totals, ready, clear } = useCart();
  // The form's source of truth is a sessionStorage-backed store, so a refresh
  // mid-checkout restores everything the customer already typed.
  const { customer, delivery } = useSyncExternalStore(
    checkoutDraft.subscribe,
    checkoutDraft.getSnapshot,
    checkoutDraft.getServerSnapshot,
  );
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const checkoutTracked = useRef(false);

  const contents = useMemo(
    () =>
      items.map((item) => ({
        id: item.product.slug,
        quantity: item.quantity,
        item_price: item.product.price,
      })),
    [items],
  );

  // InitiateCheckout — once per visit to this screen with a non-empty cart.
  useEffect(() => {
    if (!ready || checkoutTracked.current || contents.length === 0) return;
    checkoutTracked.current = true;
    trackInitiateCheckout(contents, totals);
  }, [ready, contents, totals]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const found = validateOrder({
      customer,
      delivery,
      itemCount: totals.itemCount,
      ageConfirmed,
    });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const firstKey = Object.keys(found)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      document.getElementById(`field-${firstKey}`)?.focus({ preventScroll: true });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/licor/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          delivery,
          ageConfirmed,
          items: items.map((item) => ({
            slug: item.product.slug,
            name: item.product.name,
            brand: item.product.brand,
            size: item.product.size,
            quantity: item.quantity,
            price: item.product.price,
          })),
          totals,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        orderId?: string;
        errors?: ValidationErrors;
        error?: string;
      };

      if (!response.ok || !data.ok || !data.orderId) {
        if (data.errors) setErrors(data.errors);
        setSubmitError(
          data.error ?? "We could not place the order. Please try again or call us.",
        );
        return;
      }

      // Hand the confirmation screen everything it needs to render and to
      // report the Purchase event.
      window.sessionStorage.setItem(
        `${ORDER_STORAGE_PREFIX}${data.orderId}`,
        JSON.stringify({
          orderId: data.orderId,
          customer,
          delivery,
          items: items.map((item) => ({
            slug: item.product.slug,
            name: item.product.name,
            brand: item.product.brand,
            size: item.product.size,
            quantity: item.quantity,
            price: item.product.price,
          })),
          totals,
          placedAt: new Date().toISOString(),
        }),
      );
      clearCheckoutDraft();
      clear();
      router.push(`${route("/order")}?id=${encodeURIComponent(data.orderId)}`);
    } catch {
      setSubmitError(
        "Network error. Check your connection, or call the store to place the order.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <Section className="py-16">
        <p className="text-center text-sm text-white/45">Loading checkout…</p>
      </Section>
    );
  }

  if (items.length === 0) {
    return (
      <Section className="py-12 sm:py-16">
        <div className="mx-auto max-w-md rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight text-white">
            Nothing to check out
          </h1>
          <p className="mt-3 text-sm text-white/55">
            Add something to your cart first — or call us and we will take the order
            over the phone.
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <LinkButton href={route("/shop")} variant="primary" size="lg">
              Browse the shop
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

  const orderSummary = (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-[#D4AF37]">
        Your order
      </h2>

      <ul className="mt-4 flex flex-col gap-3">
        {items.map(({ product, quantity, lineTotal }) => (
          <li key={product.slug} className="flex items-center gap-3">
            <span className="relative flex h-14 w-11 shrink-0 items-center justify-center rounded-lg bg-black/50">
              <ProductImage product={product} sizes="44px" className="p-1" />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E01B22] px-1 text-[10px] font-black text-white ring-2 ring-[#0A0A0B]">
                {quantity}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">
                {product.name}
              </span>
              <span className="block text-[11px] uppercase tracking-[0.1em] text-white/40">
                {product.size}
              </span>
            </span>
            <span className="shrink-0 text-sm font-bold text-white">
              {formatPrice(lineTotal)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-5 flex flex-col gap-3 border-t border-white/[0.08] pt-5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-white/55">Subtotal</dt>
          <dd className="font-bold text-white">{formatPrice(totals.subtotal)}</dd>
        </div>
        {totals.savings > 0 ? (
          <div className="flex items-center justify-between">
            <dt className="text-white/55">You save</dt>
            <dd className="font-bold text-[#E01B22]">−{formatPrice(totals.savings)}</dd>
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
        <div className="mt-1 flex items-center justify-between border-t border-white/[0.08] pt-4">
          <dt className="text-sm font-black uppercase tracking-[0.14em] text-white">Total</dt>
          <dd className="text-2xl font-black leading-none text-white">
            {formatPrice(totals.total)}
          </dd>
        </div>
      </dl>
    </div>
  );

  return (
    <Section className="py-8 sm:py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase leading-none tracking-tight text-white sm:text-4xl">
            Checkout
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {totals.itemCount} item{totals.itemCount === 1 ? "" : "s"} ·{" "}
            {formatPrice(totals.total)}
          </p>
        </div>
        <Link
          href={route("/cart")}
          className="inline-flex min-h-11 shrink-0 items-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#D4AF37] transition hover:text-white"
        >
          Edit cart
        </Link>
      </div>

      {/* Mobile collapsible summary keeps the form above the fold */}
      <div className="mt-6 lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((open) => !open)}
          aria-expanded={summaryOpen}
          className="flex min-h-12 w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5"
        >
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#D4AF37]">
            {summaryOpen ? "Hide" : "Show"} order summary
          </span>
          <span className="flex items-center gap-2">
            <span className="text-sm font-black text-white">
              {formatPrice(totals.total)}
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 text-white/50 transition ${summaryOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>
        {summaryOpen ? <div className="mt-3">{orderSummary}</div> : null}
      </div>

      <form onSubmit={submit} noValidate className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="flex flex-col gap-6">
          <Fieldset legend="Customer information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="field-firstName"
                label="First name"
                required
                error={errors.firstName}
                value={customer.firstName}
                autoComplete="given-name"
                onChange={(value) => updateCustomer({ firstName: value })}
              />
              <Field
                id="field-lastName"
                label="Last name"
                required
                error={errors.lastName}
                value={customer.lastName}
                autoComplete="family-name"
                onChange={(value) => updateCustomer({ lastName: value })}
              />
              <Field
                id="field-phone"
                label="Phone"
                required
                type="tel"
                inputMode="tel"
                placeholder="631-000-0000"
                error={errors.phone}
                value={customer.phone}
                autoComplete="tel"
                onChange={(value) => updateCustomer({ phone: value })}
              />
              <Field
                id="field-email"
                label="Email"
                required
                type="email"
                inputMode="email"
                placeholder="you@email.com"
                error={errors.email}
                value={customer.email}
                autoComplete="email"
                onChange={(value) => updateCustomer({ email: value })}
              />
            </div>
          </Fieldset>

          <Fieldset legend="Delivery information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="field-address"
                label="Address"
                required
                className="sm:col-span-2"
                error={errors.address}
                value={delivery.address}
                autoComplete="street-address"
                onChange={(value) => updateDelivery({ address: value })}
              />
              <Field
                id="field-apartment"
                label="Apartment / unit"
                value={delivery.apartment}
                autoComplete="address-line2"
                onChange={(value) => updateDelivery({ apartment: value })}
              />
              <Field
                id="field-city"
                label="City"
                required
                error={errors.city}
                value={delivery.city}
                autoComplete="address-level2"
                onChange={(value) => updateDelivery({ city: value })}
              />
              <Field
                id="field-state"
                label="State"
                required
                error={errors.state}
                value={delivery.state}
                autoComplete="address-level1"
                onChange={(value) => updateDelivery({ state: value })}
              />
              <Field
                id="field-zip"
                label="ZIP code"
                required
                inputMode="numeric"
                error={errors.zip}
                value={delivery.zip}
                autoComplete="postal-code"
                onChange={(value) => updateDelivery({ zip: value })}
              />
              <Field
                id="field-instructions"
                label="Delivery instructions"
                multiline
                className="sm:col-span-2"
                placeholder="Buzzer code, gate, floor, where to leave it…"
                value={delivery.instructions}
                onChange={(value) => updateDelivery({ instructions: value })}
              />
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-white/40">
              Delivery area: <Placeholder>{COMMERCE.deliveryZones}</Placeholder> · Estimated
              delivery time: <Placeholder>{COMMERCE.deliveryEta}</Placeholder>
            </p>
          </Fieldset>

          <Fieldset legend="Payment">
            <p className="text-sm leading-relaxed text-white/60">
              {paymentMode() === "order-request" ? (
                <>
                  Online payment is not enabled yet. Place the order here and the store
                  confirms it with you directly — payment method:{" "}
                  <Placeholder>{COMMERCE.payment.note}</Placeholder>
                </>
              ) : (
                "You will be redirected to a secure payment page to complete your order."
              )}
            </p>
          </Fieldset>

          <div id="field-ageConfirmed" tabIndex={-1}>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(event) => setAgeConfirmed(event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#E01B22]"
              />
              <span className="text-sm leading-relaxed text-white/70">
                I confirm I am {BUSINESS.minimumAge} or older and I will present a valid
                government-issued ID at delivery.
              </span>
            </label>
            {errors.ageConfirmed ? (
              <p className="mt-2 text-xs font-semibold text-[#FF6B70]">
                {errors.ageConfirmed}
              </p>
            ) : null}
          </div>

          {submitError ? (
            <p
              role="alert"
              className="rounded-xl border border-[#E01B22]/50 bg-[#E01B22]/10 px-4 py-3 text-sm text-[#FFB3B6]"
            >
              {submitError}
            </p>
          ) : null}

          <div className="hidden lg:block">
            <ActionButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Placing order…" : `Place order · ${formatPrice(totals.total)}`}
            </ActionButton>
          </div>

          <DemoDataNotice />
        </div>

        <aside className="hidden lg:sticky lg:top-32 lg:block">
          {orderSummary}
          <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
              Questions?
            </p>
            <div className="mt-3 grid gap-2">
              {BUSINESS.phones.map((phone) => (
                <CallButton key={phone.tel} phone={phone} variant="outline" size="sm" />
              ))}
            </div>
          </div>
        </aside>

        {/* Sticky mobile submit — the single most important button on the site */}
        <div
          className="fixed inset-x-0 bottom-16 z-30 border-t border-white/[0.08] bg-black/95 px-4 py-3 backdrop-blur-xl lg:hidden"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <ActionButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "Placing order…" : `Place order · ${formatPrice(totals.total)}`}
          </ActionButton>
        </div>
      </form>

      {/* Spacer so the sticky bar never covers the last field */}
      <div className="h-24 lg:hidden" aria-hidden />
    </Section>
  );
}

function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <legend className="px-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#D4AF37]">
        {legend}
      </legend>
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  multiline = false,
  className = "",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric" | "decimal";
  autoComplete?: string;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  const base =
    "w-full rounded-xl border bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:bg-white/[0.07]";
  const borders = error
    ? "border-[#E01B22]/70 focus:border-[#E01B22]"
    : "border-white/12 focus:border-[#D4AF37]/70";

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-white/55"
      >
        {label}
        {required ? <span className="ml-1 text-[#E01B22]">*</span> : null}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={3}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${base} ${borders} resize-y`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`${base} ${borders}`}
        />
      )}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-[#FF6B70]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
