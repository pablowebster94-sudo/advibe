import { BUSINESS, route } from "@/lib/licor/config";
import CallButton from "@/components/licor/CallButton";
import { LinkButton, Section } from "@/components/licor/ui";

export default function NotFound() {
  return (
    <Section className="py-16 sm:py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">
          404
        </p>
        <h1 className="mt-4 text-3xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
          We could not find that
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/55">
          The page or product you are looking for is not here. Browse the catalog, or
          call the store and we will find it for you.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <LinkButton href={route("/shop")} variant="primary" size="lg">
            Browse the shop
          </LinkButton>
          <CallButton
            phone={BUSINESS.phones[0]}
            label="Call the store"
            variant="outline"
            size="lg"
          />
        </div>
      </div>
    </Section>
  );
}
