import type { Metadata } from "next";
import { BUSINESS, absoluteUrl } from "@/lib/licor/config";
import LegalPage from "@/components/licor/LegalPage";
import { Placeholder } from "@/components/licor/ui";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${BUSINESS.name} handles the information you provide when ordering online.`,
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This page explains what information this website collects when you browse and place an order with ${BUSINESS.name}, and how it is used.`}
      sections={[
        {
          heading: "Information you give us",
          body: (
            <p>
              When you place an order we collect the details you type into the checkout
              form: first and last name, phone number, email address, delivery address,
              apartment or unit, city, state, ZIP code and any delivery instructions.
              This information is used to fulfil and confirm your order.
            </p>
          ),
        },
        {
          heading: "Information stored in your browser",
          body: (
            <>
              <p>
                Your cart, your age confirmation and your in-progress checkout details
                are stored locally in your own browser (localStorage and sessionStorage)
                so you do not lose them when you refresh the page. They are not shared
                with third parties from this website.
              </p>
              <p>
                Clearing your browser storage removes them and resets the age
                verification prompt.
              </p>
            </>
          ),
        },
        {
          heading: "Analytics and advertising",
          body: (
            <>
              <p>
                When configured by the store, this website loads the Meta Pixel and
                Google Analytics 4 and reports page views, product views, searches,
                add-to-cart actions, checkout starts and completed orders. These are used
                to measure advertising performance.
              </p>
              <p>
                Order events may also be sent server-to-server through the Meta
                Conversions API. Where customer identifiers are included they are
                SHA-256 hashed before transmission.
              </p>
              <p>
                Data controller and contact for privacy requests:{" "}
                <Placeholder>[PRIVACY CONTACT]</Placeholder>
              </p>
            </>
          ),
        },
        {
          heading: "Sharing",
          body: (
            <p>
              Order information is shared only as needed to deliver your order and to
              operate this website. Third-party processors used by the business:{" "}
              <Placeholder>[LIST OF PROCESSORS]</Placeholder>
            </p>
          ),
        },
        {
          heading: "Retention and your rights",
          body: (
            <p>
              Retention periods and the process for accessing, correcting or deleting
              your information: <Placeholder>[RETENTION & RIGHTS POLICY]</Placeholder>
            </p>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Questions about this policy: call {BUSINESS.phones[0].label} or{" "}
              {BUSINESS.phones[1].label}, or write to{" "}
              <Placeholder>{BUSINESS.email}</Placeholder>. Business address:{" "}
              <Placeholder>{BUSINESS.address}</Placeholder>
            </p>
          ),
        },
      ]}
    />
  );
}
