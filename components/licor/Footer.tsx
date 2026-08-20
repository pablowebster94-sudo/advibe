import Link from "next/link";
import { BUSINESS, FOOTER_LINKS, COMMERCE } from "@/lib/licor/config";
import CallButton from "./CallButton";
import Logo from "./Logo";
import { Placeholder } from "./ui";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#050506] px-4 pb-28 pt-14 sm:px-6 lg:px-8 lg:pb-14">
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo size="lg" asLink={false} />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
            {BUSINESS.headline} Premium spirits, beer and more, delivered across{" "}
            {BUSINESS.serviceArea}.
          </p>
          <div className="mt-6 grid gap-2 sm:max-w-xs">
            {BUSINESS.phones.map((phone) => (
              <CallButton key={phone.tel} phone={phone} variant="outline" size="md" />
            ))}
          </div>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#D4AF37]">
            Explore
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {FOOTER_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-9 items-center text-sm text-white/60 transition hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.28em] text-[#D4AF37]">
            Store
          </h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm text-white/60">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-white/35">Address</dt>
              <dd className="mt-1">
                <Placeholder>{BUSINESS.address}</Placeholder>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-white/35">Hours</dt>
              <dd className="mt-1 font-semibold text-white">{BUSINESS.hours}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-white/35">Delivery</dt>
              <dd className="mt-1 font-semibold text-[#D4AF37]">{BUSINESS.concept}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-white/35">
                Delivery area
              </dt>
              <dd className="mt-1">
                <Placeholder>{COMMERCE.deliveryZones}</Placeholder>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mx-auto mt-12 w-full max-w-6xl border-t border-white/[0.08] pt-6">
        <p className="text-[11px] leading-relaxed text-white/35">
          You must be {BUSINESS.minimumAge} or older to purchase alcohol. A valid
          government-issued ID is required at delivery. Please drink responsibly.
          Licensing and regulatory details: <Placeholder>[LICENSE INFORMATION]</Placeholder>
        </p>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
          © {BUSINESS.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
