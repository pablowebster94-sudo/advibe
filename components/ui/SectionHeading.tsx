import type { ReactNode } from "react";

type SectionHeadingProps = { eyebrow: string; title: ReactNode; description?: string };

export default function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-5xl space-y-5 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-[.32em] text-[#b7ff38]">{eyebrow}</p>
      <h2 className="max-w-4xl text-[clamp(2.8rem,6.5vw,6.5rem)] font-semibold leading-[.9] tracking-[-.06em] text-white">{title}</h2>
      {description ? <p className="max-w-2xl text-sm leading-7 text-white/55 sm:text-base">{description}</p> : null}
    </div>
  );
}
