import { Placeholder, Section } from "./ui";

export type LegalSection = {
  heading: string;
  body: React.ReactNode;
};

/**
 * Shared shell for the policy pages. Anything that is genuine legal wording for
 * this business is left as a marked placeholder — legal text is never invented
 * here. The factual statements that ARE included describe how this website
 * itself behaves, which is verifiable from the code.
 */
export default function LegalPage({
  title,
  intro,
  updated = "[LAST UPDATED]",
  sections,
  showDraftNotice = true,
}: {
  title: string;
  intro: React.ReactNode;
  updated?: string;
  sections: LegalSection[];
  showDraftNotice?: boolean;
}) {
  return (
    <Section className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/35">
          Last updated: <Placeholder>{updated}</Placeholder>
        </p>

        {showDraftNotice ? (
          <p className="mt-6 rounded-xl border border-dashed border-[#D4AF37]/35 bg-[#D4AF37]/[0.06] px-4 py-3 text-[11px] leading-relaxed text-[#E7C766]">
            <strong className="font-black uppercase tracking-[0.16em]">Template</strong> —
            this page describes how the website works and marks every clause that still
            needs the business&apos;s own wording. Have it reviewed by qualified counsel
            before publishing.
          </p>
        ) : null}

        <p className="mt-6 text-sm leading-relaxed text-white/65">{intro}</p>

        <div className="mt-10 flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                {section.heading}
              </h2>
              <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-white/60">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Section>
  );
}
