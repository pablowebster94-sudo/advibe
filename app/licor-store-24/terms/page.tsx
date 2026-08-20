import type { Metadata } from "next";
import { BUSINESS, COMMERCE, absoluteUrl } from "@/lib/licor/config";
import LegalPage from "@/components/licor/LegalPage";
import { Placeholder } from "@/components/licor/ui";

export const metadata: Metadata = {
  title: "Terms",
  description: `Terms for ordering from ${BUSINESS.name}.`,
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      intro={`These terms cover the use of this website and orders placed through it with ${BUSINESS.name}.`}
      sections={[
        {
          heading: "Age requirement",
          body: (
            <p>
              You must be {BUSINESS.minimumAge} or older to use this website or to place
              an order. A valid government-issued photo ID is required at delivery.
              Orders may be refused or cancelled if age cannot be verified.
            </p>
          ),
        },
        {
          heading: "Orders",
          body: (
            <>
              <p>
                Placing an order on this website submits an order request. The store
                confirms availability and the final amount with you before the order is
                completed.
              </p>
              <p>
                Order acceptance, cancellation and refund policy:{" "}
                <Placeholder>[ORDER POLICY]</Placeholder>
              </p>
            </>
          ),
        },
        {
          heading: "Pricing",
          body: (
            <p>
              {COMMERCE.demoPricing ? (
                <>
                  The catalog currently shows placeholder demo pricing while the store is
                  being set up. Prices are confirmed by the store before an order is
                  completed. Applicable taxes and fees:{" "}
                  <Placeholder>{COMMERCE.taxes.label}</Placeholder>
                </>
              ) : (
                <>
                  Prices are shown in USD. Applicable taxes and fees:{" "}
                  <Placeholder>{COMMERCE.taxes.label}</Placeholder>
                </>
              )}
            </p>
          ),
        },
        {
          heading: "Delivery",
          body: (
            <p>
              Delivery is free. Delivery area:{" "}
              <Placeholder>{COMMERCE.deliveryZones}</Placeholder>. Estimated delivery
              time: <Placeholder>{COMMERCE.deliveryEta}</Placeholder>. Someone{" "}
              {BUSINESS.minimumAge} or older must be present to receive the order.
            </p>
          ),
        },
        {
          heading: "Payment",
          body: (
            <p>
              Accepted payment methods:{" "}
              <Placeholder>{COMMERCE.payment.note}</Placeholder>
            </p>
          ),
        },
        {
          heading: "Licensing and governing law",
          body: (
            <p>
              License information: <Placeholder>[LICENSE INFORMATION]</Placeholder>.
              Governing law and dispute resolution:{" "}
              <Placeholder>[GOVERNING LAW]</Placeholder>
            </p>
          ),
        },
      ]}
    />
  );
}
