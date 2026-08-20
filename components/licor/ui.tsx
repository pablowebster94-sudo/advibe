import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

/** Shared visual primitives for the Licor Store 24 storefront. */

// `min-h-11` keeps every button at a 44px touch target on a phone.
// Never pass a display utility (hidden / sm:block) through `className`: it
// would collide with `inline-flex` here and lose. Wrap the button instead.
const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-center font-extrabold uppercase tracking-[0.12em] transition duration-200 ease-out transform-gpu active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black";

export const buttonVariants = {
  primary: `${buttonBase} bg-[#E01B22] text-white shadow-[0_14px_40px_-16px_rgba(224,27,34,0.9)] hover:bg-[#F5252C] hover:shadow-[0_18px_50px_-14px_rgba(224,27,34,1)]`,
  gold: `${buttonBase} bg-gradient-to-b from-[#F0D585] to-[#C99B24] text-black shadow-[0_14px_40px_-18px_rgba(212,175,55,0.9)] hover:from-[#F8E3A6] hover:to-[#D9AC33]`,
  outline: `${buttonBase} border border-[#D4AF37]/45 bg-white/[0.03] text-white hover:border-[#D4AF37] hover:bg-[#D4AF37]/10`,
  ghost: `${buttonBase} border border-white/12 bg-white/[0.03] text-white hover:border-white/30 hover:bg-white/[0.08]`,
  dark: `${buttonBase} bg-white text-black hover:bg-white/90`,
} as const;

export const buttonSizes = {
  sm: "px-4 py-2.5 text-[11px]",
  md: "px-5 py-3.5 text-xs",
  lg: "px-7 py-4 text-sm",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
): string {
  return `${buttonVariants[variant]} ${buttonSizes[size]} ${className}`.trim();
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: LinkButtonProps) {
  const isExternal = /^(https?:|tel:|mailto:)/.test(href);
  const classes = buttonClass(variant, size, className);
  if (isExternal) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ActionButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ActionButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function Section({
  id,
  className = "",
  children,
  ...props
}: { id?: string; className?: string; children: ReactNode } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section id={id} className={`px-4 sm:px-6 lg:px-8 ${className}`.trim()} {...props}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.32em] text-[#D4AF37]">
      <span className="h-px w-6 bg-[#D4AF37]/60" aria-hidden />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
  align = "left",
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  copy?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";
  return (
    <div
      className={`flex flex-col gap-3 ${alignment} ${
        action ? "sm:flex-row sm:items-end sm:justify-between sm:text-left" : ""
      }`}
    >
      <div className={`flex flex-col gap-3 ${alignment}`}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="text-2xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-3xl lg:text-4xl">
          {title}
        </h2>
        {copy ? <p className="max-w-2xl text-sm leading-relaxed text-white/60">{copy}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  tone = "red",
  className = "",
  children,
}: {
  tone?: "red" | "gold" | "muted" | "green";
  className?: string;
  children: ReactNode;
}) {
  const tones = {
    red: "bg-[#E01B22] text-white",
    gold: "bg-[#D4AF37] text-black",
    green: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30",
    muted: "bg-white/10 text-white/70 ring-1 ring-inset ring-white/15",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${tones[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

/** Editable-placeholder marker: renders bracketed config values distinctly. */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-dashed border-[#D4AF37]/45 bg-[#D4AF37]/[0.07] px-1.5 py-0.5 font-mono text-[11px] text-[#E7C766]">
      {children}
    </span>
  );
}
