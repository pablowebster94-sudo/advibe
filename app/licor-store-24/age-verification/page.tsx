import type { Metadata } from "next";
import { BUSINESS, absoluteUrl } from "@/lib/licor/config";
import LegalPage from "@/components/licor/LegalPage";

export const metadata: Metadata = {
  title: "Age Verification",
  description: `${BUSINESS.name} sells alcohol only to customers ${BUSINESS.minimumAge} or older. A valid government-issued ID is required at delivery.`,
  alternates: { canonical: absoluteUrl("/age-verification") },
};

export default function AgeVerificationPage() {
  return (
    <LegalPage
      title="Age Verification"
      showDraftNotice={false}
      updated="[LAST UPDATED]"
      intro={`${BUSINESS.name} sells alcohol only to customers who are ${BUSINESS.minimumAge} years of age or older.`}
      sections={[
        {
          heading: "Entering this website",
          body: (
            <p>
              The first time you open this website you are asked to confirm that you are{" "}
              {BUSINESS.minimumAge} or older. Confirming stores that answer in your
              browser so you are not asked again on this device. If you indicate that you
              are under {BUSINESS.minimumAge}, access to the store is blocked.
            </p>
          ),
        },
        {
          heading: "At checkout",
          body: (
            <p>
              Every order requires an explicit confirmation that you are{" "}
              {BUSINESS.minimumAge} or older and that you will present a valid
              government-issued photo ID when the order is delivered.
            </p>
          ),
        },
        {
          heading: "At delivery",
          body: (
            <p>
              A person {BUSINESS.minimumAge} or older must be present, sober and able to
              present a valid government-issued photo ID to accept the delivery. If ID
              cannot be presented, or if the recipient appears intoxicated, the delivery
              will not be completed.
            </p>
          ),
        },
        {
          heading: "No exceptions",
          body: (
            <p>
              We do not deliver alcohol to anyone under {BUSINESS.minimumAge}, and we do
              not deliver to a third party on behalf of someone under{" "}
              {BUSINESS.minimumAge}. Please drink responsibly.
            </p>
          ),
        },
        {
          heading: "Questions",
          body: (
            <p>
              Call {BUSINESS.phones[0].label} or {BUSINESS.phones[1].label} with any
              question about this policy.
            </p>
          ),
        },
      ]}
    />
  );
}
