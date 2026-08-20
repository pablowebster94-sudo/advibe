"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_NAV, route } from "@/lib/licor/config";
import CartCount from "./CartCount";
import { ICONS } from "./Icons";

/** App-style bottom navigation. Mobile only — the desktop nav lives in the header. */
export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-black/92 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {MOBILE_NAV.map((item) => {
          const Icon = ICONS[item.icon];
          const active =
            item.href === route("/")
              ? pathname === route("/")
              : pathname.startsWith(item.href);
          return (
            <li key={item.label} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                  active ? "text-[#D4AF37]" : "text-white/50"
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {item.icon === "cart" ? (
                    <span className="absolute -right-2.5 -top-2">
                      <CartCount />
                    </span>
                  ) : null}
                </span>
                {item.label}
                {active ? (
                  <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-[#D4AF37]" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
