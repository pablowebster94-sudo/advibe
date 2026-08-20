import Link from "next/link";
import { BUSINESS, route } from "@/lib/licor/config";

// The wordmark must never wrap in the header, so the mobile sizes are a step
// down from the desktop ones.
const sizes = {
  sm: { box: "h-9 w-9 text-[13px]", name: "text-[13px]", sub: "text-[7px] tracking-[0.22em]" },
  md: {
    box: "h-10 w-10 text-[14px]",
    name: "text-[12px] sm:text-[15px]",
    sub: "text-[7px] tracking-[0.2em] sm:text-[9px] sm:tracking-[0.28em]",
  },
  lg: { box: "h-14 w-14 text-xl", name: "text-xl", sub: "text-[10px] tracking-[0.28em]" },
} as const;

export default function Logo({
  size = "md",
  asLink = true,
}: {
  size?: keyof typeof sizes;
  asLink?: boolean;
}) {
  const s = sizes[size];
  const content = (
    <>
      <span
        className={`flex ${s.box} shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/50 bg-gradient-to-br from-[#E01B22] to-[#8E0F14] font-black tracking-tight text-white shadow-[0_8px_24px_-10px_rgba(224,27,34,0.9)]`}
      >
        LS
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`${s.name} whitespace-nowrap font-black uppercase tracking-[0.06em] text-white`}
        >
          {BUSINESS.name}
        </span>
        <span className={`${s.sub} mt-1 whitespace-nowrap font-bold uppercase text-[#D4AF37]`}>
          {BUSINESS.concept}
        </span>
      </span>
    </>
  );

  if (!asLink) {
    return <span className="flex items-center gap-2.5">{content}</span>;
  }

  return (
    <Link
      href={route("/")}
      className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
      aria-label={`${BUSINESS.name} — home`}
    >
      {content}
    </Link>
  );
}
