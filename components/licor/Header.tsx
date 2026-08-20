"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BUSINESS, DESKTOP_NAV, route } from "@/lib/licor/config";
import CallButton from "./CallButton";
import CartCount from "./CartCount";
import Logo from "./Logo";
import SearchBox from "./SearchBox";
import { CartIcon, CloseIcon, MenuIcon, PhoneIcon, SearchIcon } from "./Icons";

export default function Header() {
  const pathname = usePathname();
  // Each overlay records the route it was opened on, so navigating anywhere
  // closes it without an effect that resets state.
  const [menuRoute, setMenuRoute] = useState<string | null>(null);
  const [searchRoute, setSearchRoute] = useState<string | null>(null);
  const menuOpen = menuRoute === pathname;
  const searchOpen = searchRoute === pathname;

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-black/85 backdrop-blur-xl">
      {/* 24/7 free delivery strip */}
      <div className="bg-gradient-to-r from-[#8E0F14] via-[#E01B22] to-[#8E0F14]">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-1.5 text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white sm:text-[11px]">
            {BUSINESS.concept}
          </span>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70 sm:inline">
            · {BUSINESS.serviceArea}
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
          {DESKTOP_NAV.map((item) => {
            const active =
              item.href === route("/")
                ? pathname === route("/")
                : pathname.startsWith(item.href.split("#")[0]);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-[12px] font-bold uppercase tracking-[0.14em] transition ${
                  active
                    ? "text-[#D4AF37]"
                    : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-4">
          <SearchBox className="hidden w-64 xl:block" placeholder="Search the store…" />

          <button
            type="button"
            onClick={() => setSearchRoute(searchOpen ? null : pathname)}
            aria-label="Search"
            aria-expanded={searchOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/80 transition hover:border-white/25 hover:text-white xl:hidden"
          >
            {searchOpen ? <CloseIcon className="h-4.5 w-4.5" /> : <SearchIcon className="h-4.5 w-4.5" />}
          </button>

          <span className="hidden sm:block">
            <CallButton
              phone={BUSINESS.phones[0]}
              label="Call now"
              variant="primary"
              size="sm"
            />
          </span>
          <a
            href={`tel:${BUSINESS.phones[0].tel}`}
            aria-label={`Call ${BUSINESS.phones[0].label}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E01B22] text-white transition hover:bg-[#F5252C] sm:hidden"
          >
            <PhoneIcon className="h-4.5 w-4.5" />
          </a>

          <Link
            href={route("/cart")}
            aria-label="Cart"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white transition hover:border-[#D4AF37]/60"
          >
            <CartIcon className="h-4.5 w-4.5" />
            <span className="absolute -right-1.5 -top-1.5">
              <CartCount />
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuRoute(pathname)}
            aria-label="Open menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white transition hover:border-white/25 lg:hidden"
          >
            <MenuIcon className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-white/[0.08] bg-black/95 px-4 py-3 sm:px-6 xl:hidden">
          <div className="mx-auto max-w-6xl">
            <SearchBox autoFocus onNavigate={() => setSearchRoute(null)} />
          </div>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuRoute(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col border-l border-white/10 bg-[#08080A]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <Logo size="sm" />
              <button
                type="button"
                onClick={() => setMenuRoute(null)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-5">
              <ul className="flex flex-col gap-1">
                {DESKTOP_NAV.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuRoute(null)}
                      className="flex items-center justify-between rounded-xl px-3 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-white/[0.08] px-5 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                Order by phone
              </p>
              <div className="mt-3 grid gap-2">
                {BUSINESS.phones.map((phone) => (
                  <CallButton key={phone.tel} phone={phone} variant="outline" size="md" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
