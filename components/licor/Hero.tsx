import Link from "next/link";
import { BUSINESS, route } from "@/lib/licor/config";
import { FEATURED_PRODUCTS } from "@/lib/licor/catalog";
import { formatPrice } from "@/lib/licor/format";
import CallButton from "./CallButton";
import ProductImage from "./ProductImage";
import { ClockIcon, TruckIcon, ShieldIcon } from "./Icons";
import { LinkButton } from "./ui";

const HERO_PRODUCTS = FEATURED_PRODUCTS.slice(0, 3);

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      {/* Ambient light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(224,27,34,0.28),transparent_55%),radial-gradient(ellipse_at_85%_25%,rgba(212,175,55,0.18),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent"
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-8 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.26em] text-[#E7C766]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4AF37] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
            </span>
            {BUSINESS.concept}
          </span>

          <h1 className="mt-6 text-[clamp(2.35rem,9vw,4.5rem)] font-black uppercase leading-[0.88] tracking-[-0.02em] text-white">
            <span className="block">Licor</span>
            <span className="block bg-gradient-to-r from-[#F4DE9B] via-[#D4AF37] to-[#9C7A1E] bg-clip-text text-transparent">
              Store 24
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-lg font-black uppercase leading-tight tracking-[0.02em] text-white sm:text-2xl lg:mx-0">
            {BUSINESS.headline}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60 sm:text-base lg:mx-0">
            {BUSINESS.subheadline}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <LinkButton href={route("/shop")} variant="primary" size="lg" className="w-full sm:w-auto">
              Order now
            </LinkButton>
            <CallButton
              phone={BUSINESS.phones[0]}
              label="Call now"
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            />
          </div>

          <ul className="mt-9 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: TruckIcon, title: "Free", copy: "Delivery" },
              { icon: ClockIcon, title: "24/7", copy: "Always open" },
              { icon: ShieldIcon, title: "21+", copy: "ID at door" },
            ].map(({ icon: Icon, title, copy }) => (
              <li
                key={title}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-3 text-center"
              >
                <Icon className="mx-auto h-5 w-5 text-[#D4AF37]" />
                <p className="mt-2 text-sm font-black uppercase tracking-[0.1em] text-white">
                  {title}
                </p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">{copy}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Product showcase */}
        <div className="relative">
          <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
            {HERO_PRODUCTS.map((product, index) => (
              <Link
                key={product.slug}
                href={route(`/product/${product.slug}`)}
                className={`group relative flex flex-col items-center rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent p-3 transition duration-300 hover:border-[#D4AF37]/50 ${
                  index === 1 ? "z-10 scale-105 shadow-[0_30px_80px_-30px_rgba(224,27,34,0.7)]" : ""
                }`}
              >
                <div className="relative aspect-[3/5] w-full">
                  <ProductImage
                    product={product}
                    priority={index < 2}
                    sizes="(max-width: 1024px) 30vw, 180px"
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-center text-[11px] font-bold leading-tight text-white/85">
                  {product.name}
                </p>
                <p className="mt-1 text-[11px] font-black text-[#D4AF37]">
                  {formatPrice(product.price)}
                </p>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-center text-[10px] uppercase tracking-[0.24em] text-white/30">
            Featured this week
          </p>
        </div>
      </div>
    </section>
  );
}
