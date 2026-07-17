import type { AnchorHTMLAttributes } from "react";

const variants = {
  primary:
    "inline-flex items-center justify-center rounded-full bg-cyan-400 px-7 py-3 text-sm font-semibold text-slate-950 shadow-[0_24px_80px_-40px_rgba(0,212,255,0.85)] transition duration-300 ease-out transform-gpu hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-[0_30px_100px_-60px_rgba(0,212,255,0.95)]",
  secondary:
    "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition duration-300 ease-out transform-gpu hover:-translate-y-0.5 hover:border-cyan-400/50 hover:bg-white/10 hover:text-white",
  ghost:
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-slate-200 transition duration-300 ease-out transform-gpu hover:-translate-y-0.5 hover:text-white",
};

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: keyof typeof variants;
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <a
      className={`${variants[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </a>
  );
}
