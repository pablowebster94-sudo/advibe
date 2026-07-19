import type { AnchorHTMLAttributes } from "react";

const variants = {
  primary:
    "inline-flex items-center justify-center rounded-full border border-white/10 bg-white px-7 py-3 text-sm font-semibold text-slate-950 transition duration-300 ease-out transform-gpu hover:-translate-y-0.5 hover:bg-[#f3f3f0] hover:shadow-[0_16px_60px_-30px_rgba(255,255,255,0.45)]",
  secondary:
    "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition duration-300 ease-out transform-gpu hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10 hover:text-white",
  ghost:
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-slate-300 transition duration-300 ease-out transform-gpu hover:-translate-y-0.5 hover:text-white",
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
