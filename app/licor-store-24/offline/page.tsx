import type { Metadata } from "next";
import { BUSINESS, route } from "@/lib/licor/config";
import CallButton from "@/components/licor/CallButton";
import { LinkButton, Section } from "@/components/licor/ui";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <Section className="py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">
          You are offline
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          We could not reach the store. Your cart is safe on this device — try again
          when you are back online, or call us to place the order right now.
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <CallButton
            phone={BUSINESS.phones[0]}
            label="Order by phone"
            variant="primary"
            size="lg"
          />
          <LinkButton href={route("/")} variant="ghost" size="md">
            Try again
          </LinkButton>
        </div>
      </div>
    </Section>
  );
}
