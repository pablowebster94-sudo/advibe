"use client";

import { BUSINESS, route } from "@/lib/licor/config";
import { formatPrice } from "@/lib/licor/format";
import CallButton from "./CallButton";
import { useCart } from "./CartProvider";
import { AccountIcon, CartIcon, ShieldIcon, TruckIcon } from "./Icons";
import { LinkButton, Section } from "./ui";

/**
 * Account screen.
 *
 * There is no customer login yet — inventing an account system with fake order
 * history would be worse than being direct about it. This screen gives the
 * mobile tab a real destination: current cart, quick actions and store contact.
 */
export default function AccountView() {
  const { totals, ready } = useCart();

  return (
    <Section className="py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]">
            <AccountIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-black uppercase leading-none tracking-tight text-white">
              Account
            </h1>
            <p className="mt-1.5 text-sm text-white/50">Guest checkout</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            <CartIcon className="h-4 w-4" />
            Current cart
          </p>
          <p className="mt-3 text-sm text-white/60">
            {ready
              ? totals.itemCount > 0
                ? `${totals.itemCount} item${totals.itemCount === 1 ? "" : "s"} · ${formatPrice(totals.total)}`
                : "Your cart is empty."
              : "Loading…"}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <LinkButton href={route("/cart")} variant="outline" size="md">
              View cart
            </LinkButton>
            <LinkButton href={route("/shop")} variant="primary" size="md">
              Shop now
            </LinkButton>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
            Order history
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            Customer accounts are not enabled yet. Keep your order reference
            (LS24-…) and call the store for any question about a past order.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {BUSINESS.phones.map((phone) => (
              <CallButton key={phone.tel} phone={phone} variant="outline" size="sm" />
            ))}
          </div>
        </div>

        <ul className="mt-4 grid gap-2">
          {[
            { href: route("/delivery"), label: "Delivery information", icon: TruckIcon },
            { href: route("/age-verification"), label: "Age verification policy", icon: ShieldIcon },
          ].map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <LinkButton href={href} variant="ghost" size="md" className="w-full justify-start">
                <Icon className="h-4 w-4 text-[#D4AF37]" />
                {label}
              </LinkButton>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
