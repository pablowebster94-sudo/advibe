import Link from "next/link";
import { DEALS, dealQuery } from "@/lib/licor/deals";
import { route } from "@/lib/licor/config";
import { ChevronRightIcon } from "./Icons";
import { Badge } from "./ui";

export default function DealsGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {DEALS.map((deal) => {
        const gold = deal.accent === "gold";
        return (
          <Link
            key={deal.id}
            href={`${route("/shop")}${dealQuery(deal)}`}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 transition duration-300 ${
              gold
                ? "border-[#D4AF37]/30 bg-gradient-to-br from-[#D4AF37]/[0.12] to-transparent hover:border-[#D4AF37]/70"
                : "border-[#E01B22]/30 bg-gradient-to-br from-[#E01B22]/[0.14] to-transparent hover:border-[#E01B22]/70"
            }`}
          >
            <span
              aria-hidden
              className={`pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full blur-3xl transition duration-500 group-hover:scale-125 ${
                gold ? "bg-[#D4AF37]/20" : "bg-[#E01B22]/25"
              }`}
            />
            <div className="relative">
              {deal.badge ? (
                <Badge tone={gold ? "gold" : "red"}>{deal.badge}</Badge>
              ) : null}
              <h3 className="mt-3 text-lg font-black uppercase leading-tight tracking-[0.04em] text-white sm:text-xl">
                {deal.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{deal.subtitle}</p>
            </div>
            <span className="relative mt-6 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
              Shop now
              <ChevronRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
