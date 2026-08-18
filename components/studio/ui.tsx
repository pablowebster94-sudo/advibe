"use client";

/**
 * Small UI primitives for the studio.
 *
 * The studio deliberately uses a near-neutral grey palette rather than the
 * marketing site's tinted glass: a coloured interface shifts how you perceive
 * skin tones, which is the one thing this tool must not do. The AdVibe green
 * appears only on actions.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[#78d94f] text-[#06120a] hover:bg-[#8ee563] active:bg-[#5fc62f] disabled:bg-neutral-700 disabled:text-neutral-500",
  secondary:
    "bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border border-neutral-700 disabled:text-neutral-600",
  ghost:
    "bg-transparent text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 disabled:text-neutral-600",
  danger:
    "bg-transparent text-red-300 border border-red-900/60 hover:bg-red-950/50 disabled:text-neutral-600",
};

export function Button({
  variant = "secondary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-neutral-800 bg-neutral-900/70 ${className}`}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-neutral-800 px-4 py-3">
          {typeof title === "string" ? (
            <h2 className="text-sm font-semibold tracking-wide text-neutral-200">{title}</h2>
          ) : (
            title
          )}
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "accent";
}) {
  const tones = {
    neutral: "bg-neutral-800 text-neutral-300 border-neutral-700",
    good: "bg-emerald-950/60 text-emerald-300 border-emerald-900",
    warn: "bg-amber-950/60 text-amber-300 border-amber-900",
    bad: "bg-red-950/60 text-red-300 border-red-900",
    accent: "bg-[#78d94f]/15 text-[#a4ef84] border-[#78d94f]/30",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-5 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-0.5 text-lg font-semibold text-neutral-100 tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-neutral-500">{hint}</div>}
    </div>
  );
}

export function ProgressBar({
  value,
  total,
  tone = "accent",
}: {
  value: number;
  total: number;
  tone?: "accent" | "neutral";
}) {
  const percent = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-neutral-800"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${
          tone === "accent" ? "bg-[#78d94f]" : "bg-neutral-500"
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-800 px-6 py-14 text-center">
      <h3 className="text-base font-semibold text-neutral-200">{title}</h3>
      <p className="max-w-md text-sm leading-relaxed text-neutral-400">{description}</p>
      {action}
    </div>
  );
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "error";
  children: ReactNode;
}) {
  const tones = {
    info: "border-neutral-700 bg-neutral-900/80 text-neutral-300",
    warn: "border-amber-900 bg-amber-950/40 text-amber-200",
    error: "border-red-900 bg-red-950/40 text-red-200",
  } as const;
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  );
}
