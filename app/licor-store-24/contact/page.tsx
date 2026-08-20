import type { Metadata } from "next";
import { BUSINESS, COMMERCE, absoluteUrl, route } from "@/lib/licor/config";
import CallButton from "@/components/licor/CallButton";
import PhoneOrderBlock from "@/components/licor/PhoneOrderBlock";
import { ClockIcon, PhoneIcon, TruckIcon } from "@/components/licor/Icons";
import { LinkButton, Placeholder, Section, SectionHeading } from "@/components/licor/ui";

export const metadata: Metadata = {
  title: "Contact",
  description: `Call ${BUSINESS.name} to order or ask about availability. Open ${BUSINESS.hours} with free delivery in ${BUSINESS.serviceArea}.`,
  alternates: { canonical: absoluteUrl("/contact") },
};

export default function ContactPage() {
  return (
    <>
      <Section className="pb-6 pt-8 sm:pt-12">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">
          We pick up
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
          Contact
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
          The fastest way to reach {BUSINESS.name} is by phone. We are open{" "}
          {BUSINESS.hours}.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {BUSINESS.phones.map((phone, index) => (
            <div
              key={phone.tel}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
            >
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
                <PhoneIcon className="h-4 w-4 text-[#D4AF37]" />
                Phone {index + 1}
              </p>
              <p className="mt-3 text-2xl font-black tracking-tight text-white">
                {phone.label}
              </p>
              <CallButton
                phone={phone}
                label="Call now"
                variant={index === 0 ? "primary" : "outline"}
                size="md"
                className="mt-4 w-full"
              />
            </div>
          ))}
        </div>
      </Section>

      <Section className="py-10">
        <SectionHeading
          eyebrow="Store information"
          title="Details"
          copy="Anything not yet confirmed by the store is shown as an editable placeholder rather than a guess."
        />

        <dl className="mt-7 grid gap-4 sm:grid-cols-2">
          <InfoCard term="Hours" value={<span className="font-black text-white">{BUSINESS.hours}</span>} icon={<ClockIcon className="h-4 w-4 text-[#D4AF37]" />} />
          <InfoCard
            term="Delivery"
            value={<span className="font-black text-[#D4AF37]">{BUSINESS.concept}</span>}
            icon={<TruckIcon className="h-4 w-4 text-[#D4AF37]" />}
          />
          <InfoCard term="Address" value={<Placeholder>{BUSINESS.address}</Placeholder>} />
          <InfoCard term="Email" value={<Placeholder>{BUSINESS.email}</Placeholder>} />
          <InfoCard
            term="Delivery area"
            value={<Placeholder>{COMMERCE.deliveryZones}</Placeholder>}
          />
          <InfoCard
            term="Service area"
            value={<span className="text-white/70">{BUSINESS.serviceArea}</span>}
          />
          <InfoCard
            term="Instagram"
            value={<Placeholder>{BUSINESS.social.instagram}</Placeholder>}
          />
          <InfoCard
            term="Facebook"
            value={<Placeholder>{BUSINESS.social.facebook}</Placeholder>}
          />
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LinkButton href={route("/shop")} variant="primary" size="lg">
            Start an order
          </LinkButton>
          <LinkButton href={route("/delivery")} variant="ghost" size="lg">
            Delivery info
          </LinkButton>
        </div>
      </Section>

      <PhoneOrderBlock />
    </>
  );
}

function InfoCard({
  term,
  value,
  icon,
}: {
  term: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
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
