"use client";

import { MAX_LINE_QUANTITY } from "@/lib/licor/cart";
import { MinusIcon, PlusIcon } from "./Icons";

export default function QuantityStepper({
  value,
  onChange,
  max = MAX_LINE_QUANTITY,
  min = 1,
  label = "Quantity",
  size = "md",
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number;
  min?: number;
  label?: string;
  size?: "sm" | "md";
}) {
  const button =
    size === "sm"
      ? "h-9 w-9 text-white/80"
      : "h-11 w-11 text-white";
  const cap = Math.max(min, Math.min(max, MAX_LINE_QUANTITY));

  return (
    <div
      className="inline-flex items-center rounded-xl border border-white/12 bg-white/[0.04]"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={`${button} flex items-center justify-center rounded-l-xl transition hover:bg-white/[0.08] disabled:opacity-30`}
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <span
        aria-live="polite"
        className={`min-w-10 text-center font-bold tabular-nums text-white ${
          size === "sm" ? "text-sm" : "text-base"
        }`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(cap, value + 1))}
        disabled={value >= cap}
        aria-label="Increase quantity"
        className={`${button} flex items-center justify-center rounded-r-xl transition hover:bg-white/[0.08] disabled:opacity-30`}
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
