import type { Metadata } from "next";
import { BUSINESS, COMMERCE, absoluteUrl, route } from "@/lib/licor/config";
import HowItWorks, { DeliveryPillars } from "@/components/licor/HowItWorks";
import PhoneOrderBlock from "@/components/licor/PhoneOrderBlock";
import { ClockIcon, ShieldIcon, TruckIcon } from "@/components/licor/Icons";
import { LinkButton, Placeholder, Section, SectionHeading } from "@/components/licor/ui";

export const metadata: Metadata = {
  title: "24/7 Free Delivery",
  description: `${BUSINESS.name} delivers liquor, beer and spirits around the clock in ${BUSINESS.serviceArea}. Free delivery, 24/7.`,
  alternates: { canonical: absoluteUrl("/delivery") },
};

export default function DeliveryPage() {
  return (
    <>
      <Section className="pb-6 pt-10 sm:pt-14">
        <div className="text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">
            Always open
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-tight text-white sm:text-6xl">
            24/7 <span className="text-[#E01B22]">Free</span>
            <br />
            Delivery
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-white/60 sm:text-base">
            {BUSINESS.subheadline} No delivery fee — day, night, weekend or holiday.
          </p>
        </div>

        <div className="mt-10">
          <DeliveryPillars />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <LinkButton href={route("/shop")} variant="primary" size="lg">
            Order now
          </LinkButton>
          <LinkButton href={route("/contact")} variant="outline" size="lg">
            Contact the store
          </LinkButton>
        </div>
      </Section>

      <HowItWorks />

      <Section className="py-10">
        <SectionHeading
          eyebrow="Good to know"
          title="Delivery details"
          copy="Everything we can confirm today. Anything still being finalized is marked as a placeholder — call the store and we will confirm it for your address."
        />

        <dl className="mt-7 grid gap-4 sm:grid-cols-2">
          <DetailCard
            icon={<TruckIcon className="h-5 w-5 text-[#D4AF37]" />}
            term="Delivery fee"
            value={<span className="font-black text-[#D4AF37]">{COMMERCE.deliveryLabel}</span>}
          />
          <DetailCard
            icon={<ClockIcon className="h-5 w-5 text-[#D4AF37]" />}
            term="Hours"
            value={<span className="font-black text-white">{BUSINESS.hours}</span>}
          />
          <DetailCard
            icon={<TruckIcon className="h-5 w-5 text-[#D4AF37]" />}
            term="Delivery area"
            value={<Placeholder>{COMMERCE.deliveryZones}</Placeholder>}
          />
          <DetailCard
            icon={<ClockIcon className="h-5 w-5 text-[#D4AF37]" />}
            term="Estimated delivery time"
            value={<Placeholder>{COMMERCE.deliveryEta}</Placeholder>}
          />
          <DetailCard
            icon={<ShieldIcon className="h-5 w-5 text-[#D4AF37]" />}
            term="Age verification"
            value={
              <span className="text-white/70">
                {BUSINESS.minimumAge}+ only. A valid government-issued ID is required at
                the door.
              </span>
            }
          />
          <DetailCard
            icon={<TruckIcon className="h-5 w-5 text-[#D4AF37]" />}
            term="Payment"
            value={<Placeholder>{COMMERCE.payment.note}</Placeholder>}
          />
        </dl>

        <p className="mt-6 text-[11px] leading-relaxed text-white/35">
          Store address: <Placeholder>{BUSINESS.address}</Placeholder>
        </p>
      </Section>

      <PhoneOrderBlock />
    </>
  );
}

function DetailCard({
  icon,
  term,
  value,
}: {
  icon: React.ReactNode;
  term: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <dt className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
        {icon}
        {term}
      </dt>
      <dd className="mt-3 text-sm">{value}</dd>
    </div>
  );
}
