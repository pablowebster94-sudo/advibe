import { BUSINESS } from "@/lib/licor/config";
import CallButton from "./CallButton";
import { PhoneIcon } from "./Icons";
import { Section } from "./ui";

/** "NEED IT NOW? ORDER BY PHONE" — the highest-intent conversion path. */
export default function PhoneOrderBlock({ id = "order-by-phone" }: { id?: string }) {
  return (
    <Section id={id} className="py-14 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl border border-[#E01B22]/35 bg-gradient-to-br from-[#1A0507] via-[#0B0B0C] to-[#120406] p-6 text-center sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#E01B22]/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -right-16 h-64 w-64 rounded-full bg-[#D4AF37]/15 blur-3xl"
        />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E01B22]/50 bg-[#E01B22]/15 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-white">
            <PhoneIcon className="h-3.5 w-3.5" />
            Need it now?
          </span>

          <h2 className="mt-5 text-3xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
            Order by phone
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60">
            Talk to the store directly and place your order in one call. Available{" "}
            <span className="font-bold text-[#D4AF37]">{BUSINESS.hours}</span>.
          </p>

          <div className="mx-auto mt-8 grid max-w-md gap-3 sm:grid-cols-2">
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

          <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-white/35">
            {BUSINESS.concept}
          </p>
        </div>
      </div>
    </Section>
  );
}
